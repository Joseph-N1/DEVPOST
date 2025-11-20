"""
Audit log API endpoints for Phase 8.
Admin-only access to view system activity logs.
"""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from database import get_db
from models.auth import User, AuditLog, UserRole
from auth.utils import get_current_active_user

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/logs")
async def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get audit logs with filtering (admin only).
    
    Query params:
    - skip: Pagination offset
    - limit: Max results per page
    - user_id: Filter by user ID
    - action: Filter by action type
    - status: Filter by status (success/failure/warning)
    - start_date: Filter logs after this date
    - end_date: Filter logs before this date
    """
    # Only admins can view audit logs
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Build query
    query = select(AuditLog)
    
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    
    if action:
        query = query.filter(AuditLog.action == action)
    
    if status:
        query = query.filter(AuditLog.status == status)
    
    if start_date:
        query = query.filter(AuditLog.timestamp >= start_date)
    
    if end_date:
        query = query.filter(AuditLog.timestamp <= end_date)
    
    # Order by timestamp descending (newest first)
    query = query.order_by(desc(AuditLog.timestamp)).offset(skip).limit(limit)
    
    # Execute query
    result = await db.execute(query)
    logs = result.scalars().all()
    
    # Get total count
    count_query = select(func.count(AuditLog.id))
    if user_id:
        count_query = count_query.filter(AuditLog.user_id == user_id)
    if action:
        count_query = count_query.filter(AuditLog.action == action)
    if status:
        count_query = count_query.filter(AuditLog.status == status)
    
    result = await db.execute(count_query)
    total = result.scalar()
    
    return {
        "logs": [log.to_dict() for log in logs],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/logs/{log_id}")
async def get_audit_log_detail(
    log_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed audit log entry (admin only).
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = await db.execute(select(AuditLog).filter(AuditLog.id == log_id))
    log = result.scalar_one_or_none()
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit log not found"
        )
    
    return log.to_dict()


@router.get("/my-logs")
async def get_my_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get audit logs for current user only.
    """
    result = await db.execute(
        select(AuditLog)
        .filter(AuditLog.user_id == current_user.id)
        .order_by(desc(AuditLog.timestamp))
        .offset(skip)
        .limit(limit)
    )
    logs = result.scalars().all()
    
    return [log.to_dict() for log in logs]


@router.get("/stats")
async def get_audit_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get audit statistics (admin only).
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Total logs
    result = await db.execute(select(func.count(AuditLog.id)))
    total_logs = result.scalar()
    
    # Logs by status
    result = await db.execute(
        select(AuditLog.status, func.count(AuditLog.id)).group_by(AuditLog.status)
    )
    status_counts = dict(result.all())
    
    # Recent failed actions (last 24 hours)
    yesterday = datetime.utcnow() - timedelta(days=1)
    result = await db.execute(
        select(func.count(AuditLog.id))
        .filter(AuditLog.status == "failure", AuditLog.timestamp >= yesterday)
    )
    recent_failures = result.scalar()
    
    # Most common actions
    result = await db.execute(
        select(AuditLog.action, func.count(AuditLog.id))
        .group_by(AuditLog.action)
        .order_by(desc(func.count(AuditLog.id)))
        .limit(10)
    )
    top_actions = [{"action": action, "count": count} for action, count in result.all()]
    
    return {
        "total_logs": total_logs,
        "status_distribution": status_counts,
        "recent_failures_24h": recent_failures,
        "top_actions": top_actions
    }
