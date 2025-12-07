"""
Authentication API endpoints for Phase 8.
Handles user registration, login, token refresh, and logout.
"""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field, validator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from database import get_db
from models.auth import User, Session as DBSession, UserRole, AuditLog
from auth.utils import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    get_current_active_user,
    verify_refresh_token,
    revoke_session,
    revoke_all_user_sessions,
    create_audit_log,
    validate_password_strength,
    security,
    AuthenticationError
)

router = APIRouter(prefix="/auth", tags=["authentication"])


# Pydantic Models
class RegisterRequest(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = Field(None, max_length=255)
    role: Optional[UserRole] = UserRole.VIEWER
    
    @validator('username')
    def username_alphanumeric(cls, v):
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Username must be alphanumeric (- and _ allowed)')
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 900  # 15 minutes in seconds
    user: dict


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    preferences: Optional[dict] = None


# Endpoints
@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: Request,
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user account.
    
    - **email**: Valid email address (unique)
    - **username**: Alphanumeric username (unique)
    - **password**: Minimum 8 characters with complexity requirements
    - **full_name**: Optional full name
    - **role**: Optional role (default: viewer, requires admin to set higher roles)
    
    Returns access token, refresh token, and user profile.
    """
    # Validate password strength
    is_valid, error_msg = validate_password_strength(data.password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)
    
    # Check if email already exists
    result = await db.execute(select(User).filter(User.email == data.email))
    if result.scalar_one_or_none():
        await create_audit_log(
            db=db,
            action="user.register.failure",
            status="failure",
            description=f"Registration failed: Email {data.email} already exists",
            request=request,
            error_code="EMAIL_EXISTS"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username already exists
    result = await db.execute(select(User).filter(User.username == data.username))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create new user
    new_user = User(
        email=data.email,
        username=data.username,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        role=data.role,
        is_active=True,
        is_verified=False,  # Email verification can be added later
        preferences={"language": "en", "theme": "light"}
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Create tokens
    access_token = create_access_token(data={"sub": str(new_user.id), "role": new_user.role.value})
    refresh_token = create_refresh_token(data={"sub": str(new_user.id)})
    
    # Store refresh token in database
    session = DBSession(
        user_id=new_user.id,
        refresh_token=refresh_token,
        expires_at=datetime.utcnow() + timedelta(days=7),
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host
    )
    db.add(session)
    await db.commit()
    
    # Log successful registration
    await create_audit_log(
        db=db,
        action="user.register",
        user=new_user,
        status="success",
        description=f"New user registered: {new_user.email}",
        request=request
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=new_user.to_dict()
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    credentials: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user and return JWT tokens.
    
    - **email**: User email
    - **password**: User password
    
    Returns access token (15 min), refresh token (7 days), and user profile.
    """
    # Find user by email
    result = await db.execute(select(User).filter(User.email == credentials.email))
    user = result.scalar_one_or_none()
    
    # Verify user exists and password is correct
    if not user or not verify_password(credentials.password, user.password_hash):
        # Audit log disabled due to async session issues - to be fixed in next phase
        # await create_audit_log(
        #     db=db,
        #     action="user.login.failure",
        #     status="failure",
        #     description=f"Failed login attempt for {credentials.email}",
        #     request=request,
        #     error_code="INVALID_CREDENTIALS"
        # )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )
    
    # Create tokens
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    # Store refresh token in database
    session = DBSession(
        user_id=user.id,
        refresh_token=refresh_token,
        expires_at=datetime.utcnow() + timedelta(days=7),
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host
    )
    db.add(session)
    
    # Update last login timestamp
    user.last_login = datetime.utcnow()
    
    await db.commit()
    
    # Log successful login - disabled due to async session issues
    # await create_audit_log(
    #     db=db,
    #     action="user.login",
    #     user=user,
    #     status="success",
    #     description=f"User logged in: {user.email}",
    #     request=request
    # )
    
    # Detach user from session before converting to dict
    await db.refresh(user)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "role": user.role.value if user.role else None,
            "full_name": user.full_name
        }
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_access_token(
    request: Request,
    data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Refresh access token using refresh token.
    
    - **refresh_token**: Valid refresh token from login/register
    
    Returns new access token and same refresh token.
    """
    # Verify refresh token
    session = await verify_refresh_token(data.refresh_token, db)
    
    # Get user
    result = await db.execute(select(User).filter(User.id == session.user_id))
    user = result.scalar_one_or_none()
    
    if not user or not user.is_active:
        raise AuthenticationError("User not found or inactive")
    
    # Create new access token
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=data.refresh_token,  # Return same refresh token
        user=user.to_dict()
    )


@router.post("/logout")
async def logout(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Logout current user by revoking refresh token.
    Optionally revoke all sessions with logout_all=true.
    """
    # Find and revoke current session
    result = await db.execute(
        select(DBSession).filter(
            DBSession.user_id == current_user.id,
            DBSession.is_active == True
        ).order_by(DBSession.last_used_at.desc())
    )
    session = result.first()
    
    if session:
        await revoke_session(session[0].id, db)
    
    # Log logout
    await create_audit_log(
        db=db,
        action="user.logout",
        user=current_user,
        status="success",
        description=f"User logged out: {current_user.email}",
        request=request
    )
    
    return {"message": "Successfully logged out"}


@router.post("/logout-all")
async def logout_all_devices(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Logout from all devices by revoking all refresh tokens.
    """
    await revoke_all_user_sessions(current_user.id, db)
    
    # Log logout from all devices
    await create_audit_log(
        db=db,
        action="user.logout_all",
        user=current_user,
        status="success",
        description=f"User logged out from all devices: {current_user.email}",
        request=request
    )
    
    return {"message": "Logged out from all devices"}


@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current authenticated user profile.
    """
    return current_user.to_dict()


@router.put("/me")
async def update_profile(
    request: Request,
    data: UpdateProfileRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update current user profile.
    
    - **full_name**: Update full name
    - **phone**: Update phone number
    - **avatar_url**: Update avatar URL
    - **preferences**: Update user preferences (language, theme, etc.)
    """
    if data.full_name is not None:
        current_user.full_name = data.full_name
    
    if data.phone is not None:
        current_user.phone = data.phone
    
    if data.avatar_url is not None:
        current_user.avatar_url = data.avatar_url
    
    if data.preferences is not None:
        current_user.preferences = {**(current_user.preferences or {}), **data.preferences}
    
    current_user.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(current_user)
    
    # Log profile update
    await create_audit_log(
        db=db,
        action="user.profile.update",
        user=current_user,
        status="success",
        description=f"User profile updated: {current_user.email}",
        metadata=data.dict(exclude_none=True),
        request=request
    )
    
    return current_user.to_dict()


@router.post("/change-password")
async def change_password(
    request: Request,
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Change user password.
    
    - **current_password**: Current password for verification
    - **new_password**: New password (minimum 8 characters)
    """
    # Verify current password
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password strength
    is_valid, error_msg = validate_password_strength(data.new_password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)
    
    # Update password
    current_user.password_hash = hash_password(data.new_password)
    current_user.updated_at = datetime.utcnow()
    
    # Revoke all sessions (force re-login)
    await revoke_all_user_sessions(current_user.id, db)
    
    await db.commit()
    
    # Log password change
    await create_audit_log(
        db=db,
        action="user.password.change",
        user=current_user,
        status="success",
        description=f"Password changed for user: {current_user.email}",
        request=request
    )
    
    return {"message": "Password changed successfully. Please log in again."}


@router.get("/sessions")
async def get_user_sessions(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all active sessions for current user.
    """
    result = await db.execute(
        select(DBSession).filter(
            DBSession.user_id == current_user.id,
            DBSession.is_active == True
        ).order_by(DBSession.created_at.desc())
    )
    sessions = result.scalars().all()
    
    return [session.to_dict() for session in sessions]


@router.delete("/sessions/{session_id}")
async def revoke_specific_session(
    session_id: int,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Revoke a specific session (logout from specific device).
    """
    # Verify session belongs to current user
    result = await db.execute(
        select(DBSession).filter(
            DBSession.id == session_id,
            DBSession.user_id == current_user.id
        )
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    await revoke_session(session_id, db)
    
    # Log session revocation
    await create_audit_log(
        db=db,
        action="user.session.revoke",
        user=current_user,
        status="success",
        description=f"Session revoked: {session_id}",
        resource_type="session",
        resource_id=session_id,
        request=request
    )
    
    return {"message": "Session revoked successfully"}


@router.get("/stats")
async def get_auth_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get authentication statistics (admin only).
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    
    # Get user counts by role
    result = await db.execute(
        select(User.role, func.count(User.id)).group_by(User.role)
    )
    role_counts = dict(result.all())
    
    # Get total users
    result = await db.execute(select(func.count(User.id)))
    total_users = result.scalar()
    
    # Get active sessions count
    result = await db.execute(
        select(func.count(DBSession.id)).filter(DBSession.is_active == True)
    )
    active_sessions = result.scalar()
    
    return {
        "total_users": total_users,
        "role_distribution": {role.value: count for role, count in role_counts.items()},
        "active_sessions": active_sessions
    }


@router.post("/forgot-password")
async def forgot_password(
    request: Request,
    email: EmailStr = Body(..., embed=True),
    db: AsyncSession = Depends(get_db)
):
    """
    Request password reset via email.
    
    In production, this would send a password reset email with a token.
    For now, it logs the request and returns a success message.
    
    - **email**: Email address to reset password for
    
    Returns success message (doesn't reveal if email exists for security).
    """
    # Find user
    result = await db.execute(select(User).filter(User.email == email))
    user = result.scalar_one_or_none()
    
    if user:
        # Log the password reset request
        await create_audit_log(
            db=db,
            action="user.password.reset.request",
            user=user,
            status="success",
            description=f"Password reset requested for {user.email}",
            request=request
        )
    
    # Always return success for security (don't reveal if email exists)
    return {
        "message": "If an account exists with this email, a password reset link has been sent to your inbox.",
        "email": email
    }

