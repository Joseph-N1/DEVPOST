from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from pathlib import Path
from typing import List, Dict, Any
import pandas as pd
import os
from services.ai_analyzer import train_example

router = APIRouter(tags=["upload"])

# Base data directory (backend/data)
DATA_DIR = Path(__file__).resolve().parents[1] / "data"
SAMPLE_DATA_DIR = DATA_DIR / "sample_data"

# Directory where uploads will be saved (ensure path exists and is writable)
UPLOAD_DIR = DATA_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/csv")
async def upload_csv(file: UploadFile = File(...)):
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")

    # 🚀 AUTO-TRAIN MODEL AFTER UPLOAD
    training_result = None
    try:
        training_result = train_example()
        if training_result:
            print(f"✅ Model auto-trained after upload: {training_result}")
    except Exception as train_error:
        print(f"⚠️ Auto-training failed (non-fatal): {train_error}")
        # Don't fail the upload if training fails

    return {
        "filename": filename, 
        "saved_to": str(dest),
        "training_triggered": training_result is not None,
        "training_result": training_result
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
    rows: int = Query(default=5, ge=1, le=3000),
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
