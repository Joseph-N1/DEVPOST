
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
import pandas as pd
from services.csv_parser import parse_and_store
from pathlib import Path
import os
from typing import List, Dict, Any

router = APIRouter()

# Define the data directory path
DATA_DIR = Path(__file__).parent.parent / 'data'
SAMPLE_DATA_DIR = DATA_DIR / 'sample_data'

@router.post('/csv')
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail='Only CSV files are accepted')
    contents = await file.read()
    # parse with pandas
    df = pd.read_csv(pd.io.common.BytesIO(contents))
    inserted = parse_and_store(df)
    return {'inserted_rows': inserted, 'filename': file.filename}

@router.get('/files', response_model=List[Dict[str, Any]])
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
                'type': 'user'
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
        
        # Read CSV with pandas
        df = pd.read_csv(full_path, nrows=rows)
        
        return {
            'filename': os.path.basename(file_path),
            'total_rows': len(pd.read_csv(full_path, usecols=[0])),  # Efficient row count
            'total_columns': len(df.columns),
            'columns': df.columns.tolist(),
            'preview_rows': df.to_dict('records'),
            'dtypes': df.dtypes.astype(str).to_dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
