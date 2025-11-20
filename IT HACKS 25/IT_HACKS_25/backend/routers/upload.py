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
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["upload"])

# Base data directory (backend/data)
DATA_DIR = Path(__file__).resolve().parents[1] / "data"
SAMPLE_DATA_DIR = DATA_DIR / "sample_data"

# Directory where uploads will be saved (maintain file storage for backward compatibility)
UPLOAD_DIR = DATA_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/csv")
async def upload_csv(
    file: UploadFile = File(...),
    farm_name: str = Query(default=None, description="Optional farm name"),
    clear_existing: bool = Query(default=False, description="Clear existing data before upload"),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload CSV file and ingest into database.
    
    Process:
    1. Save CSV file to disk (for backup/reference)
    2. Ingest data into PostgreSQL via ETL pipeline
    3. Invalidate cache for the farm
    4. Auto-train ML model
    
    Args:
        file: CSV file upload
        farm_name: Optional farm name (auto-generated if not provided)
        db: Database session
        
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
    # Basic validation
    filename = Path(file.filename).name
    if not filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")

    dest = UPLOAD_DIR / filename
    try:
        # Stream write to avoid large memory use
        with dest.open("wb") as f:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                f.write(chunk)
        
        logger.info(f"CSV saved to disk: {dest}")
    except Exception as e:
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
        logger.error(f"Unexpected ingestion error: {e}")
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
        "filename": filename, 
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
