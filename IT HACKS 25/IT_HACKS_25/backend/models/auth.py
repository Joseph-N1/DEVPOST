"""
Authentication models for user management, sessions, and audit logging.
Phase 8: Multi-role authentication with RBAC.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, JSON, Index, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum
from models.farm import Base


class UserRole(str, enum.Enum):
    """
    User role enumeration for RBAC.
    - admin: Full system access, model training, user management
    - manager: Farm management, reports, data upload
    - viewer: Read-only access to analytics
    """
    ADMIN = "admin"
    MANAGER = "manager"
    VIEWER = "viewer"


class User(Base):
    """
    User accounts for authentication and authorization.
    Supports multi-tenant architecture with farm assignments.
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    
    # Profile Information
    full_name = Column(String(255), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    phone = Column(String(50), nullable=True)
    
    # Role & Status
    role = Column(SQLEnum(UserRole, values_callable=lambda x: [e.value for e in x]), nullable=False, default=UserRole.VIEWER, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    
    # User Preferences (stored as JSON)
    preferences = Column(JSON, nullable=True, default=dict)
    # Example preferences: {"language": "en", "theme": "light", "timezone": "UTC"}
    
    # Farm Assignment (for multi-tenant support)
    assigned_farm_id = Column(Integer, ForeignKey("farms.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    last_login = Column(DateTime, nullable=True)
    
    # Relationships
    assigned_farm = relationship("Farm", foreign_keys=[assigned_farm_id])
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_user_email', 'email'),
        Index('idx_user_role', 'role'),
        Index('idx_user_active', 'is_active'),
    )
    
    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"
    
    def to_dict(self, include_sensitive=False):
        """Convert user to dictionary for JSON serialization."""
        data = {
            "id": self.id,
            "email": self.email,
            "username": self.username,
            "full_name": self.full_name,
            "avatar_url": self.avatar_url,
            "phone": self.phone,
            "role": self.role.value if self.role else None,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "preferences": self.preferences or {},
            "assigned_farm_id": self.assigned_farm_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None
        }
        
        if include_sensitive:
            data["password_hash"] = self.password_hash
        
        return data
    
    def has_permission(self, required_role: UserRole) -> bool:
        """
        Check if user has required permission level.
        Admin > Manager > Viewer
        """
        role_hierarchy = {
            UserRole.ADMIN: 3,
            UserRole.MANAGER: 2,
            UserRole.VIEWER: 1
        }
        return role_hierarchy.get(self.role, 0) >= role_hierarchy.get(required_role, 0)


class Session(Base):
    """
    Refresh token sessions for secure token management.
    Access tokens are short-lived JWTs (15 minutes).
    Refresh tokens are long-lived and stored in database (7 days).
    """
    __tablename__ = "sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Token Information
    refresh_token = Column(String(500), unique=True, nullable=False, index=True)
    access_token_jti = Column(String(100), nullable=True)  # JWT ID for revocation
    
    # Session Metadata
    user_agent = Column(String(500), nullable=True)  # Browser/device info
    ip_address = Column(String(50), nullable=True)
    location = Column(String(255), nullable=True)  # City, country
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    is_revoked = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now(), nullable=False)
    expires_at = Column(DateTime, nullable=False, index=True)
    last_used_at = Column(DateTime, default=func.now(), onupdate=func.now())
    revoked_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="sessions")
    
    __table_args__ = (
        Index('idx_session_token', 'refresh_token'),
        Index('idx_session_user', 'user_id', 'is_active'),
        Index('idx_session_expiry', 'expires_at'),
    )
    
    def __repr__(self):
        return f"<Session(id={self.id}, user_id={self.user_id}, active={self.is_active})>"
    
    def is_valid(self) -> bool:
        """Check if session is still valid (not expired or revoked)."""
        return (
            self.is_active
            and not self.is_revoked
            and self.expires_at > datetime.utcnow()
        )
    
    def to_dict(self):
        """Convert session to dictionary for JSON serialization."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_agent": self.user_agent,
            "ip_address": self.ip_address,
            "location": self.location,
            "is_active": self.is_active,
            "is_revoked": self.is_revoked,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "last_used_at": self.last_used_at.isoformat() if self.last_used_at else None,
            "revoked_at": self.revoked_at.isoformat() if self.revoked_at else None
        }


class AuditLog(Base):
    """
    Comprehensive audit logging for compliance and security monitoring.
    Tracks all significant user actions and system events.
    """
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Action Details
    action = Column(String(100), nullable=False, index=True)
    # Examples: "user.login", "user.logout", "data.upload", "model.train", "report.export"
    
    resource_type = Column(String(50), nullable=True, index=True)  # "user", "farm", "room", "model"
    resource_id = Column(Integer, nullable=True)  # ID of affected resource
    
    # Status
    status = Column(String(20), nullable=False, default="success")  # "success", "failure", "warning"
    
    # Context & Metadata
    description = Column(Text, nullable=True)  # Human-readable description
    metadata_ = Column("metadata", JSON, nullable=True)  # Additional structured data (using metadata_ to avoid SQLAlchemy conflict)
    
    # Request Information
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(500), nullable=True)
    endpoint = Column(String(255), nullable=True)  # API endpoint called
    http_method = Column(String(10), nullable=True)  # GET, POST, PUT, DELETE
    
    # Errors
    error_message = Column(Text, nullable=True)
    error_code = Column(String(50), nullable=True)
    
    # Timestamp
    timestamp = Column(DateTime, default=func.now(), nullable=False, index=True)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
    
    __table_args__ = (
        Index('idx_audit_user', 'user_id', 'timestamp'),
        Index('idx_audit_action', 'action', 'timestamp'),
        Index('idx_audit_resource', 'resource_type', 'resource_id'),
        Index('idx_audit_status', 'status', 'timestamp'),
        Index('idx_audit_timestamp', 'timestamp'),
    )
    
    def __repr__(self):
        return f"<AuditLog(id={self.id}, user_id={self.user_id}, action='{self.action}', status='{self.status}')>"
    
    def to_dict(self):
        """Convert audit log to dictionary for JSON serialization."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "action": self.action,
            "resource_type": self.resource_type,
            "resource_id": self.resource_id,
            "status": self.status,
            "description": self.description,
            "metadata": self.metadata_,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "endpoint": self.endpoint,
            "http_method": self.http_method,
            "error_message": self.error_message,
            "error_code": self.error_code,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }
    
    @classmethod
    def create_log(
        cls,
        action: str,
        user_id: int = None,
        status: str = "success",
        description: str = None,
        resource_type: str = None,
        resource_id: int = None,
        metadata: dict = None,
        ip_address: str = None,
        user_agent: str = None,
        endpoint: str = None,
        http_method: str = None,
        error_message: str = None,
        error_code: str = None
    ):
        """Factory method for creating audit log entries."""
        return cls(
            action=action,
            user_id=user_id,
            status=status,
            description=description,
            resource_type=resource_type,
            resource_id=resource_id,
            metadata_=metadata,
            ip_address=ip_address,
            user_agent=user_agent,
            endpoint=endpoint,
            http_method=http_method,
            error_message=error_message,
            error_code=error_code
        )
