from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from pathlib import Path
from typing import List, Dict, Any
import pandas as pd
import os

router = APIRouter(prefix="/upload", tags=["upload"])

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

    return {"filename": filename, "saved_to": str(dest)}

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

    return sorted(csv_files, key=lambda x: x['modified'], reverse=True)

@router.get('/preview/{file_path:path}')
async def preview_csv(
    file_path: str,
    rows: int = Query(default=5, ge=1, le=100)
):
    """Preview the contents of a CSV file."""
    try:
        full_path = DATA_DIR / file_path
        if not full_path.is_file() or not str(full_path).endswith('.csv'):
            raise HTTPException(status_code=404, detail='File not found')

        # Read CSV with pandas (first N rows)
        df = pd.read_csv(full_path, nrows=rows)

        # Efficient total row count (avoid loading full file)
        with open(full_path, 'rb') as f:
            total_rows = sum(1 for _ in f) - 1  # subtract header

        return {
            'filename': os.path.basename(file_path),
            'total_rows': max(total_rows, 0),
            'total_columns': len(df.columns),
            'columns': df.columns.tolist(),
            'preview_rows': df.to_dict('records'),
            'dtypes': df.dtypes.astype(str).to_dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
