from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import FileResponse, StreamingResponse
from pathlib import Path
import pandas as pd
import json
from io import BytesIO
from typing import Optional, List
import logging
from auth.utils import get_current_active_user, require_role
from models.auth import User, UserRole

logger = logging.getLogger(__name__)
router = APIRouter(prefix='/export', tags=['Export'])

DATA_DIR = Path(__file__).resolve().parents[1] / 'data' / 'uploads'

@router.get('/analytics')
async def export_analytics(
    format: str = Query(..., description="Export format: csv, json, or pdf"),
    rooms: Optional[str] = Query(None, description="Comma-separated list of room IDs"),
    metrics: Optional[str] = Query(None, description="Comma-separated list of metrics"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    """
    Export analytics data in various formats
    Supports CSV, JSON, and PDF with charts
    
    **RBAC Protected**: Requires manager role or higher.
    """
    # RBAC: Managers and admins can export data
    if not current_user.has_permission(UserRole.MANAGER):
        raise HTTPException(
            status_code=403,
            detail=f"Insufficient permissions. Data export requires manager role or higher. Your role: {current_user.role.value}"
        )
    try:
        # Find latest CSV file
        csv_files = list(DATA_DIR.glob('*.csv'))
        if not csv_files:
            raise HTTPException(status_code=404, detail='No data files found')
        
        csv_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
        df = pd.read_csv(csv_files[0])
        
        # Apply filters
        if start_date:
            df['date'] = pd.to_datetime(df['date'], errors='coerce')
            df = df[df['date'] >= pd.to_datetime(start_date)]
        
        if end_date:
            df['date'] = pd.to_datetime(df['date'], errors='coerce')
            df = df[df['date'] <= pd.to_datetime(end_date)]
        
        if rooms:
            room_list = rooms.split(',')
            df = df[df['room_id'].isin(room_list)]
        
        if metrics:
            metric_list = ['room_id', 'date'] + metrics.split(',')
            available_cols = [col for col in metric_list if col in df.columns]
            df = df[available_cols]
        
        # Export based on format
        if format == 'csv':
            output = BytesIO()
            df.to_csv(output, index=False)
            output.seek(0)
            
            return StreamingResponse(
                output,
                media_type='text/csv',
                headers={'Content-Disposition': f'attachment; filename=analytics_export.csv'}
            )
        
        elif format == 'json':
            data = {
                'exported_at': pd.Timestamp.now().isoformat(),
                'total_records': len(df),
                'rooms': df['room_id'].unique().tolist() if 'room_id' in df.columns else [],
                'date_range': {
                    'start': str(df['date'].min()) if 'date' in df.columns else None,
                    'end': str(df['date'].max()) if 'date' in df.columns else None
                },
                'data': df.to_dict('records')
            }
            
            return data
        
        elif format == 'pdf':
            # For PDF, return JSON with chart data for frontend to generate PDF
            # Frontend has better PDF generation capabilities with jspdf
            rooms_list = df['room_id'].unique().tolist() if 'room_id' in df.columns else []
            
            chart_data = {}
            for room in rooms_list:
                room_df = df[df['room_id'] == room].tail(30)
                chart_data[room] = {
                    'dates': room_df['date'].tolist() if 'date' in room_df.columns else [],
                    'metrics': {
                        col: room_df[col].tolist()
                        for col in room_df.columns
                        if col not in ['room_id', 'date'] and pd.api.types.is_numeric_dtype(room_df[col])
                    }
                }
            
            return {
                'format': 'pdf_data',
                'message': 'Generate PDF on frontend using this data',
                'exported_at': pd.Timestamp.now().isoformat(),
                'rooms': rooms_list,
                'chart_data': chart_data,
                'summary': {
                    'total_records': len(df),
                    'total_rooms': len(rooms_list)
                }
            }
        
        else:
            raise HTTPException(status_code=400, detail=f'Unsupported format: {format}')
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f'Export error: {str(e)}', exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/summary')
async def export_summary(
    room_id: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    """
    Export executive summary with key metrics and insights
    
    **RBAC Protected**: Requires manager role or higher.
    """
    # RBAC: Managers and admins can export summaries
    if not current_user.has_permission(UserRole.MANAGER):
        raise HTTPException(
            status_code=403,
            detail=f"Insufficient permissions. Summary export requires manager role or higher. Your role: {current_user.role.value}"
        )
    try:
        csv_files = list(DATA_DIR.glob('*.csv'))
        if not csv_files:
            raise HTTPException(status_code=404, detail='No data files found')
        
        csv_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
        df = pd.read_csv(csv_files[0])
        
        if room_id:
            df = df[df['room_id'] == room_id]
        
        # Calculate summary statistics
        recent = df.tail(7)  # Last 7 days
        
        summary = {
            'period': 'Last 7 Days',
            'total_rooms': df['room_id'].nunique() if 'room_id' in df.columns else 0,
            'total_records': len(recent),
            'metrics': {}
        }
        
        # Calculate metrics
        numeric_cols = recent.select_dtypes(include=['float64', 'int64']).columns
        for col in numeric_cols:
            if col in recent.columns:
                summary['metrics'][col] = {
                    'mean': float(recent[col].mean()),
                    'min': float(recent[col].min()),
                    'max': float(recent[col].max()),
                    'std': float(recent[col].std())
                }
        
        return summary
    
    except Exception as e:
        logger.error(f'Summary export error: {str(e)}', exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
