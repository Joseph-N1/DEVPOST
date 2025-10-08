
from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
from services.csv_parser import parse_and_store

router = APIRouter()

@router.post('/csv')
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail='Only CSV files are accepted')
    contents = await file.read()
    # parse with pandas
    df = pd.read_csv(pd.io.common.BytesIO(contents))
    inserted = parse_and_store(df)
    return {'inserted_rows': inserted, 'filename': file.filename}
