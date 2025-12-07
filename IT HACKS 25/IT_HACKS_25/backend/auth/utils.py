"""
Authentication utilities for Phase 8.
Includes password hashing, JWT token generation, and RBAC decorators.
"""

import os
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from functools import wraps

from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.auth import User, Session as DBSession, UserRole, AuditLog
from database import get_db

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production-please")
REFRESH_SECRET_KEY = os.getenv("REFRESH_SECRET_KEY", "your-refresh-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15  # Short-lived access tokens
REFRESH_TOKEN_EXPIRE_DAYS = 7  # Long-lived refresh tokens

# HTTP Bearer token scheme
security = HTTPBearer()


class AuthenticationError(HTTPException):
    """Custom exception for authentication errors."""
    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class AuthorizationError(HTTPException):
    """Custom exception for authorization errors."""
    def __init__(self, detail: str = "Insufficient permissions"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
        )


# Password Hashing Functions
def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


# JWT Token Functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Dictionary containing user data (sub, role, etc.)
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """
    Create a JWT refresh token.
    
    Args:
        data: Dictionary containing minimal user data
        
    Returns:
        Encoded JWT refresh token string
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh",
        "jti": secrets.token_urlsafe(32)  # JWT ID for revocation
    })
    
    encoded_jwt = jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str, token_type: str = "access") -> Dict[str, Any]:
    """
    Decode and validate a JWT token.
    
    Args:
        token: JWT token string
        token_type: Type of token ("access" or "refresh")
        
    Returns:
        Decoded token payload
        
    Raises:
        AuthenticationError: If token is invalid or expired
    """
    secret = SECRET_KEY if token_type == "access" else REFRESH_SECRET_KEY
    
    try:
        payload = jwt.decode(token, secret, algorithms=[ALGORITHM])
        
        # Verify token type
        if payload.get("type") != token_type:
            raise AuthenticationError(f"Invalid token type. Expected {token_type}")
        
        return payload
        
    except JWTError as e:
        raise AuthenticationError(f"Token validation failed: {str(e)}")


# User Authentication Dependencies
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user from JWT token.
    
    Args:
        credentials: HTTP Bearer token from Authorization header
        db: Database session
        
    Returns:
        User object
        
    Raises:
        AuthenticationError: If authentication fails
    """
    token = credentials.credentials
    
    try:
        # Decode access token
        payload = decode_token(token, token_type="access")
        user_id_str: str = payload.get("sub")
        
        if user_id_str is None:
            raise AuthenticationError("Invalid token payload")
        
        # Convert user_id from string to int
        try:
            user_id = int(user_id_str)
        except (ValueError, TypeError):
            raise AuthenticationError("Invalid user ID in token")
        
        # Fetch user from database
        result = await db.execute(select(User).filter(User.id == user_id))
        user = result.scalar_one_or_none()
        
        if user is None:
            raise AuthenticationError("User not found")
        
        if not user.is_active:
            raise AuthenticationError("User account is deactivated")
        
        return user
        
    except JWTError:
        raise AuthenticationError("Could not validate credentials")


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to ensure user is active.
    
    Args:
        current_user: User from get_current_user dependency
        
    Returns:
        Active user object
        
    Raises:
        AuthenticationError: If user is inactive
    """
    if not current_user.is_active:
        raise AuthenticationError("Inactive user")
    
    return current_user


# Role-Based Access Control (RBAC) Decorators
def require_role(*allowed_roles):
    """
    Decorator factory for role-based access control.
    
    Usage:
        @router.get("/admin-only")
        @require_role(UserRole.ADMIN)
        async def admin_endpoint(user: User = Depends(get_current_active_user)):
            return {"message": "Admin access granted"}
        
        # Multiple roles allowed:
        @router.post("/upload")
        @require_role(UserRole.ADMIN, UserRole.MANAGER)
        async def upload_endpoint(user: User = Depends(get_current_active_user)):
            return {"message": "Admin or Manager access granted"}
    
    Args:
        *allowed_roles: One or more UserRole values that are allowed
        
    Returns:
        Decorator function
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract user from kwargs (injected by Depends)
            user = kwargs.get('user') or kwargs.get('current_user')
            
            if user is None:
                raise AuthorizationError("User not found in request context")
            
            # Check if user role is in allowed roles
            if user.role not in allowed_roles:
                roles_str = ", ".join([role.value for role in allowed_roles])
                raise AuthorizationError(
                    f"Access denied. Required role(s): {roles_str}, "
                    f"your role: {user.role.value}"
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


def require_admin(func):
    """Shortcut decorator for admin-only endpoints."""
    return require_role(UserRole.ADMIN)(func)


def require_manager(func):
    """Shortcut decorator for manager+ endpoints."""
    return require_role(UserRole.MANAGER)(func)


# Audit Logging Utility
async def create_audit_log(
    db: AsyncSession,
    action: str,
    user: Optional[User] = None,
    status: str = "success",
    description: str = None,
    resource_type: str = None,
    resource_id: int = None,
    metadata: dict = None,
    request: Request = None,
    error_message: str = None,
    error_code: str = None
):
    """
    Create an audit log entry.
    
    Args:
        db: Database session
        action: Action identifier (e.g., "user.login", "data.upload")
        user: User who performed the action
        status: "success", "failure", or "warning"
        description: Human-readable description
        resource_type: Type of resource affected
        resource_id: ID of affected resource
        metadata: Additional structured data
        request: FastAPI Request object for extracting IP, user agent
        error_message: Error message if status is "failure"
        error_code: Error code if applicable
    """
    log_entry = AuditLog.create_log(
        action=action,
        user_id=user.id if user else None,
        status=status,
        description=description,
        resource_type=resource_type,
        resource_id=resource_id,
        metadata=metadata,  # Will be mapped to metadata_ in create_log
        ip_address=request.client.host if request else None,
        user_agent=request.headers.get("user-agent") if request else None,
        endpoint=str(request.url.path) if request else None,
        http_method=request.method if request else None,
        error_message=error_message,
        error_code=error_code
    )
    
    db.add(log_entry)
    await db.commit()
    
    return log_entry


# Token Revocation Check
async def verify_refresh_token(token: str, db: AsyncSession) -> DBSession:
    """
    Verify that a refresh token is valid and not revoked.
    
    Args:
        token: Refresh token string
        db: Database session
        
    Returns:
        Session object if valid
        
    Raises:
        AuthenticationError: If token is invalid or revoked
    """
    try:
        # Decode token
        payload = decode_token(token, token_type="refresh")
        
        # Check if session exists and is valid
        result = await db.execute(
            select(DBSession).filter(
                DBSession.refresh_token == token,
                DBSession.is_active == True,
                DBSession.is_revoked == False
            )
        )
        session = result.scalar_one_or_none()
        
        if session is None:
            raise AuthenticationError("Invalid or revoked refresh token")
        
        if not session.is_valid():
            raise AuthenticationError("Refresh token has expired")
        
        # Update last used timestamp
        session.last_used_at = datetime.utcnow()
        await db.commit()
        
        return session
        
    except JWTError:
        raise AuthenticationError("Invalid refresh token")


# Session Management
async def revoke_session(session_id: int, db: AsyncSession):
    """
    Revoke a user session (logout).
    
    Args:
        session_id: Session ID to revoke
        db: Database session
    """
    result = await db.execute(
        select(DBSession).filter(DBSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    
    if session:
        session.is_revoked = True
        session.is_active = False
        session.revoked_at = datetime.utcnow()
        await db.commit()


async def revoke_all_user_sessions(user_id: int, db: AsyncSession):
    """
    Revoke all sessions for a user (force logout from all devices).
    
    Args:
        user_id: User ID
        db: Database session
    """
    result = await db.execute(
        select(DBSession).filter(
            DBSession.user_id == user_id,
            DBSession.is_active == True
        )
    )
    sessions = result.scalars().all()
    
    for session in sessions:
        session.is_revoked = True
        session.is_active = False
        session.revoked_at = datetime.utcnow()
    
    await db.commit()


# Helper Functions
def get_password_requirements() -> Dict[str, Any]:
    """Get password complexity requirements."""
    return {
        "min_length": 8,
        "require_uppercase": True,
        "require_lowercase": True,
        "require_digits": True,
        "require_special": False
    }


def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password strength against requirements.
    
    Args:
        password: Password string to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    reqs = get_password_requirements()
    
    if len(password) < reqs["min_length"]:
        return False, f"Password must be at least {reqs['min_length']} characters long"
    
    if reqs["require_uppercase"] and not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"
    
    if reqs["require_lowercase"] and not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"
    
    if reqs["require_digits"] and not any(c.isdigit() for c in password):
        return False, "Password must contain at least one digit"
    
    if reqs["require_special"] and not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        return False, "Password must contain at least one special character"
    
    return True, ""
