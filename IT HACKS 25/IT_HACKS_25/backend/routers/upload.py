from fastapi import APIRouter, UploadFile, File, HTTPException, Query, Depends
from pathlib import Path
from typing import List, Dict, Any
import pandas as pd
import os
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from services.csv_ingest import ingest_to_db, CSVIngestError
from cache import invalidate_farm_cache
from ml.train import train_new_model
from auth.utils import get_current_active_user, require_role
from models.auth import User, UserRole
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["upload"])

# Base data directory (backend/data)
DATA_DIR = Path(__file__).resolve().parents[1] / "data"
SAMPLE_DATA_DIR = DATA_DIR / "sample_data"

# Directory where uploads will be saved (maintain file storage for backward compatibility)
UPLOAD_DIR = DATA_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Security: File upload constraints
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "50"))
MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024
ALLOWED_EXTENSIONS = {"csv", "xlsx", "xls"}

def sanitize_filename(filename: str) -> str:
    """Remove path traversal and invalid characters from filename"""
    import re
    # Remove any path separators and special chars, keep only alphanumeric, dash, underscore, dot
    sanitized = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
    # Remove leading dots to prevent hidden files
    sanitized = sanitized.lstrip('.')
    # Prevent directory traversal
    sanitized = sanitized.replace('..', '')
    return sanitized

def validate_file_upload(file: UploadFile) -> tuple[str, str]:
    """Validate file before upload"""
    # Check filename
    if not file.filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    
    # Check file extension
    file_ext = Path(file.filename).suffix.lower().lstrip('.')
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file extension. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Check file size (preliminary check based on headers)
    if file.size and file.size > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size: {MAX_UPLOAD_SIZE_MB}MB"
        )
    
    return sanitize_filename(file.filename), file_ext

@router.post("/csv")
@require_role(UserRole.admin, UserRole.manager)
async def upload_csv(
    file: UploadFile = File(...),
    farm_name: str = Query(default=None, description="Optional farm name"),
    clear_existing: bool = Query(default=False, description="Clear existing data before upload"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload CSV file and ingest into database.
    
    **RBAC Protected**: Requires admin or manager role.
    
    Security:
    - File size limited to 50MB
    - Only CSV/XLSX/XLS files allowed
    - Filenames sanitized against path traversal
    - RBAC enforcement on role-based access
    
    Process:
    1. Validate and sanitize uploaded file
    2. Save CSV file to disk (for backup/reference)
    3. Ingest data into PostgreSQL via ETL pipeline
    4. Invalidate cache for the farm
    5. Auto-train ML model
    
    Args:
        file: CSV file upload
        farm_name: Optional farm name (auto-generated if not provided)
        db: Database session
        current_user: Authenticated user (admin or manager)
        
    Returns:
        {
            "filename": str,
            "saved_to": str,
            "farm_id": int,
            "farm_name": str,
            "rooms_created": int,
            "metrics_inserted": int,
            "date_range": {"start": date, "end": date},
            "training_triggered": bool,
            "training_result": dict
        }
    """
    # RBAC: Only admin and manager can upload data (decorator also enforces this)
    # Additional validation
    
    # Validate file
    sanitized_filename, file_ext = validate_file_upload(file)
    
    dest = UPLOAD_DIR / sanitized_filename
    
    # Track file size during streaming to enforce limit
    bytes_received = 0
    try:
        # Stream write to avoid large memory use
        with dest.open("wb") as f:
            while True:
                chunk = await file.read(8192)  # 8KB chunks for precise size tracking
                if not chunk:
                    break
                
                bytes_received += len(chunk)
                if bytes_received > MAX_UPLOAD_SIZE_BYTES:
                    # Delete partial file
                    dest.unlink(missing_ok=True)
                    raise HTTPException(
                        status_code=413,
                        detail=f"File too large. Maximum size: {MAX_UPLOAD_SIZE_MB}MB"
                    )
                
                f.write(chunk)
        
        logger.info(f"CSV saved to disk: {dest} ({bytes_received} bytes)")
    except HTTPException:
        raise
    except Exception as e:
        # Clean up partial file
        dest.unlink(missing_ok=True)
        logger.error(f"Failed to save file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")

    # 🔄 ETL PIPELINE: CSV → PostgreSQL
    try:
        ingestion_result = await ingest_to_db(
            csv_path=str(dest),
            farm_name=farm_name,
            clear_existing=clear_existing,
            db=db
        )
        logger.info(f"ETL ingestion complete: {ingestion_result}")
        
        # Invalidate cache for this farm
        await invalidate_farm_cache(ingestion_result['farm_id'])
        
    except CSVIngestError as e:
        logger.error(f"CSV ingestion failed: {e}")
        raise HTTPException(status_code=400, detail=f"Data ingestion failed: {str(e)}")
    except Exception as e:
        import traceback
        logger.error(f"Unexpected ingestion error: {e}")
        logger.error(f"Full traceback:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Unexpected error during ingestion: {str(e)}")

    # 🚀 AUTO-TRAIN MODEL AFTER UPLOAD (Phase 7)
    training_result = None
    try:
        training_result = train_new_model(csv_path=str(dest), model_type='random_forest')
        if training_result and training_result.get('success'):
            logger.info(f"Model auto-trained after upload: {training_result['version']}")
    except Exception as train_error:
        logger.warning(f"Auto-training failed (non-fatal): {train_error}")
        # Don't fail the upload if training fails

    return {
        "filename": sanitized_filename, 
        "saved_to": str(dest),
        **ingestion_result,
        "training_triggered": training_result is not None and training_result.get('success', False),
        "training_result": training_result if training_result and training_result.get('success') else None
    }

@router.get('/files')
async def list_csv_files():
    """List all available CSV files in the data directory."""
    csv_files = []

    # List files in main data directory
    if DATA_DIR.exists():
        csv_files.extend([
            {
                'filename': f.name,
                'path': str(f.relative_to(DATA_DIR)),
                'size': f.stat().st_size,
                'modified': f.stat().st_mtime,
                'type': 'user' if f.parent == DATA_DIR else 'other'
            }
            for f in DATA_DIR.glob('*.csv')
        ])

    # List files in sample_data directory
    if SAMPLE_DATA_DIR.exists():
        csv_files.extend([
            {
                'filename': f.name,
                'path': str(f.relative_to(DATA_DIR)),
                'size': f.stat().st_size,
                'modified': f.stat().st_mtime,
                'type': 'sample'
            }
            for f in SAMPLE_DATA_DIR.glob('*.csv')
        ])

    # List files in uploads directory
    if UPLOAD_DIR.exists():
        csv_files.extend([
            {
                'filename': f.name,
                'path': str(f.relative_to(DATA_DIR)),
                'size': f.stat().st_size,
                'modified': f.stat().st_mtime,
                'type': 'user-upload'
            }
            for f in UPLOAD_DIR.glob('*.csv')
        ])

    return sorted(csv_files, key=lambda x: x['modified'], reverse=True)

@router.get('/preview/{file_path:path}')
async def preview_csv(
    file_path: str,
    rows: int = Query(default=5, ge=1, le=15000),
    start_date: str = Query(default=None),
    end_date: str = Query(default=None)
):
    """Preview the contents of a CSV file with optional date filtering."""
    try:
        full_path = DATA_DIR / file_path
        if not full_path.is_file() or not str(full_path).endswith('.csv'):
            raise HTTPException(status_code=404, detail='File not found')

        # Read CSV with pandas
        df = pd.read_csv(full_path)

        # Apply date filtering if provided
        if start_date or end_date:
            # Check if 'date' column exists
            if 'date' in df.columns:
                df['date'] = pd.to_datetime(df['date'], errors='coerce')
                
                if start_date:
                    start_dt = pd.to_datetime(start_date)
                    df = df[df['date'] >= start_dt]
                
                if end_date:
                    end_dt = pd.to_datetime(end_date)
                    df = df[df['date'] <= end_dt]
        
        total_rows = len(df)
        
        # Limit rows after filtering
        df_preview = df.head(rows)

        return {
            'filename': os.path.basename(file_path),
            'total_rows': total_rows,
            'total_columns': len(df_preview.columns),
            'columns': df_preview.columns.tolist(),
            'preview_rows': df_preview.to_dict('records'),
            'dtypes': df_preview.dtypes.astype(str).to_dict(),
            'filtered': bool(start_date or end_date),
            'date_range': {'start': start_date, 'end': end_date} if (start_date or end_date) else None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
