"""
ETL Pipeline for CSV Ingestion to PostgreSQL

This module handles the transformation of uploaded CSV files
into structured database records (farms, rooms, metrics).
"""

import pandas as pd
import numpy as np
from datetime import datetime, date
from typing import Dict, List, Tuple, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from models.farm import Farm, Room, Metric
import logging
import re

logger = logging.getLogger(__name__)


class CSVIngestError(Exception):
    """Custom exception for CSV ingestion errors."""
    pass


def detect_rooms(df: pd.DataFrame) -> List[str]:
    """
    Detect unique room identifiers from the CSV columns.
    
    Looks for columns that indicate different rooms:
    - Columns ending with "Room X" or "room_X"
    - Columns with room identifiers in the name
    
    Args:
        df: pandas DataFrame with CSV data
        
    Returns:
        List of room identifiers found
    """
    room_ids = set()
    
    # Check if there's a 'room' or 'room_id' column
    if 'room' in df.columns:
        room_ids.update(df['room'].dropna().unique())
    if 'room_id' in df.columns:
        room_ids.update(df['room_id'].dropna().unique())
    
    # Check for columns with room indicators
    room_pattern = re.compile(r'room[_\s]*([a-z0-9]+)', re.IGNORECASE)
    for col in df.columns:
        match = room_pattern.search(col)
        if match:
            room_ids.add(match.group(1))
    
    # If no rooms detected, create a default "Room 1"
    if not room_ids:
        room_ids.add("1")
        logger.warning("No room identifiers detected in CSV, using default 'Room 1'")
    
    return sorted(list(room_ids))


def normalize_column_names(df: pd.DataFrame) -> pd.DataFrame:
    """
    Normalize column names to match expected database schema.
    
    Handles common variations:
    - "Eggs Produced" -> "eggs_produced"
    - "Avg Weight (kg)" -> "avg_weight_kg"
    - "Temperature (°C)" -> "temperature_c"
    
    Args:
        df: pandas DataFrame with original column names
        
    Returns:
        DataFrame with normalized column names
    """
    # Column mapping dictionary
    column_map = {
        'date': 'date',
        'eggs': 'eggs_produced',
        'eggs produced': 'eggs_produced',
        'eggs_produced': 'eggs_produced',
        
        'weight': 'avg_weight_kg',
        'avg weight': 'avg_weight_kg',
        'avg_weight': 'avg_weight_kg',
        'avg_weight_kg': 'avg_weight_kg',
        
        'feed': 'feed_consumed_kg',
        'feed consumed': 'feed_consumed_kg',
        'feed_consumed': 'feed_consumed_kg',
        'feed_consumed_kg': 'feed_consumed_kg',
        
        'water': 'water_consumed_l',
        'water consumed': 'water_consumed_l',
        'water_consumed': 'water_consumed_l',
        'water_consumed_l': 'water_consumed_l',
        
        'fcr': 'fcr',
        'feed conversion ratio': 'fcr',
        
        'mortality': 'mortality_rate',
        'mortality rate': 'mortality_rate',
        'mortality_rate': 'mortality_rate',
        
        'production': 'production_rate',
        'production rate': 'production_rate',
        'production_rate': 'production_rate',
        
        'temperature': 'temperature_c',
        'temp': 'temperature_c',
        'temperature_c': 'temperature_c',
        
        'humidity': 'humidity_pct',
        'humidity_pct': 'humidity_pct',
        
        'ammonia': 'ammonia_ppm',
        'ammonia_ppm': 'ammonia_ppm',
        
        'revenue': 'revenue',
        'cost': 'cost',
        'profit': 'profit',
        
        'birds': 'birds_remaining',
        'birds remaining': 'birds_remaining',
        'birds_remaining': 'birds_remaining',
        
        'flock age': 'flock_age_days',
        'flock_age': 'flock_age_days',
        'flock_age_days': 'flock_age_days',
        
        'room': 'room_id',
        'room_id': 'room_id'
    }
    
    # Normalize column names (lowercase, remove special chars)
    df.columns = [col.lower().strip().replace('(', '').replace(')', '').replace('°', '') 
                  for col in df.columns]
    
    # Apply column mapping
    df = df.rename(columns=column_map)
    
    return df


def validate_data(df: pd.DataFrame) -> Tuple[bool, List[str]]:
    """
    Validate CSV data meets minimum requirements.
    
    Requirements:
    - Must have a 'date' column
    - Must have at least one metric column (eggs, weight, etc.)
    - Date column must be parseable
    
    Args:
        df: pandas DataFrame with normalized column names
        
    Returns:
        Tuple of (is_valid: bool, errors: List[str])
    """
    errors = []
    
    # Check for date column
    if 'date' not in df.columns:
        errors.append("Missing required 'date' column")
        return False, errors
    
    # Check date parseability
    try:
        pd.to_datetime(df['date'], errors='coerce')
    except Exception as e:
        errors.append(f"Date column cannot be parsed: {e}")
    
    # Check for at least one metric
    metric_columns = ['eggs_produced', 'avg_weight_kg', 'feed_consumed_kg', 
                      'water_consumed_l', 'fcr', 'mortality_rate']
    has_metric = any(col in df.columns for col in metric_columns)
    
    if not has_metric:
        errors.append("CSV must contain at least one metric column (eggs, weight, feed, etc.)")
    
    # Check for empty dataframe
    if len(df) == 0:
        errors.append("CSV file is empty")
    
    return len(errors) == 0, errors


async def ingest_to_db(
    csv_path: str,
    farm_name: Optional[str] = None,
    clear_existing: bool = False,
    db: AsyncSession = None
) -> Dict[str, any]:
    """
    Main ETL pipeline: CSV file → PostgreSQL database.
    
    Process:
    1. Read CSV file with pandas
    2. Normalize column names
    3. Validate data
    4. Detect rooms
    5. Create/get farm record
    6. Create room records
    7. Batch insert metrics
    
    Args:
        csv_path: Path to CSV file
        farm_name: Optional farm name (auto-generated if not provided)
        db: AsyncSession for database operations
        
    Returns:
        Dictionary with ingestion results:
        {
            'farm_id': int,
            'farm_name': str,
            'rooms_created': int,
            'metrics_inserted': int,
            'date_range': {'start': date, 'end': date}
        }
    """
    logger.info(f"Starting CSV ingestion: {csv_path}")
    
    # Step 1: Clear existing data if requested
    if clear_existing:
        logger.warning("Clearing all existing farms, rooms, and metrics...")
        try:
            # Delete in correct order (child → parent)
            await db.execute(delete(Metric))
            await db.execute(delete(Room))
            await db.execute(delete(Farm))
            await db.commit()
            logger.info("Existing data cleared successfully")
        except Exception as e:
            await db.rollback()
            raise CSVIngestError(f"Failed to clear existing data: {e}")
    
    # Step 2: Read CSV
    try:
        df = pd.read_csv(csv_path)
        logger.info(f"CSV loaded: {len(df)} rows, {len(df.columns)} columns")
    except Exception as e:
        raise CSVIngestError(f"Failed to read CSV file: {e}")
    
    # Step 2: Normalize columns
    df = normalize_column_names(df)
    
    # Step 3: Validate
    is_valid, errors = validate_data(df)
    if not is_valid:
        raise CSVIngestError(f"Data validation failed: {', '.join(errors)}")
    
    # Step 4: Parse dates
    df['date'] = pd.to_datetime(df['date'], errors='coerce')
    df = df.dropna(subset=['date'])
    
    # Step 5: Detect farms and rooms
    if 'room_id' not in df.columns:
        # If no room column, assume single room
        df['room_id'] = '1'
    
    # Check if CSV has farm_id and farm_name columns (v4 format)
    has_farm_columns = 'farm_id' in df.columns and 'farm_name' in df.columns
    
    if has_farm_columns:
        # Multi-farm CSV (v4 format)
        farms_data = df[['farm_id', 'farm_name']].drop_duplicates()
        logger.info(f"Detected {len(farms_data)} farms in CSV: {farms_data['farm_name'].tolist()}")
    else:
        # Single farm CSV (v3 format)
        if not farm_name:
            farm_name = f"Farm_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        df['farm_id'] = 'FARM_001'
        df['farm_name'] = farm_name
        farms_data = pd.DataFrame({'farm_id': ['FARM_001'], 'farm_name': [farm_name]})
    
    # Step 6: Create farms
    farm_map = {}  # farm_id -> database id
    for _, farm_row in farms_data.iterrows():
        csv_farm_id = farm_row['farm_id']
        csv_farm_name = farm_row['farm_name']
        
        # Check if farm exists by name
        result = await db.execute(select(Farm).filter(Farm.name == csv_farm_name))
        farm = result.scalar_one_or_none()
        
        if not farm:
            farm = Farm(name=csv_farm_name)
            db.add(farm)
            await db.flush()
            logger.info(f"Created farm: {csv_farm_name} (ID: {farm.id})")
        else:
            logger.info(f"Using existing farm: {csv_farm_name} (ID: {farm.id})")
        
        farm_map[csv_farm_id] = farm
    
    # Step 7: Create rooms for each farm
    room_map = {}  # (farm_id, room_id) -> database room.id
    
    for csv_farm_id, farm in farm_map.items():
        # Get rooms for this farm
        farm_df = df[df['farm_id'] == csv_farm_id]
        room_ids = farm_df['room_id'].unique().tolist()
        logger.info(f"Farm {farm.name}: detected {len(room_ids)} rooms: {room_ids}")
        
        for room_id in room_ids:
            result = await db.execute(
                select(Room).filter(Room.farm_id == farm.id, Room.room_id == str(room_id))
            )
            room = result.scalar_one_or_none()
            
            if not room:
                # Calculate initial bird count if available
                room_df = farm_df[farm_df['room_id'] == room_id]
                birds_start = room_df['birds_start'].iloc[0] if 'birds_start' in room_df.columns else None
                if pd.isna(birds_start) and 'birds_remaining' in room_df.columns:
                    birds_start = room_df['birds_remaining'].iloc[0]
                
                room = Room(
                    farm_id=farm.id,
                    room_id=str(room_id),
                    birds_start=int(birds_start) if pd.notna(birds_start) else None
                )
                db.add(room)
                await db.flush()
                logger.info(f"Created room: {room_id} for farm {farm.name} (DB ID: {room.id})")
            
            room_map[(csv_farm_id, room_id)] = room.id
    
    # Step 8: Batch insert metrics
    metrics_inserted = 0
    for (csv_farm_id, room_id), room_db_id in room_map.items():
        room_df = df[(df['farm_id'] == csv_farm_id) & (df['room_id'] == room_id)].copy()
        
        for _, row in room_df.iterrows():
            # Check if metric already exists (avoid duplicates)
            metric_date = row['date'].date()
            result = await db.execute(
                select(Metric).filter(
                    Metric.room_id == room_db_id,
                    Metric.date == metric_date
                )
            )
            existing = result.scalar_one_or_none()
            
            if existing:
                logger.debug(f"Skipping duplicate metric: room={room_id}, date={metric_date}")
                continue
            
            # Create metric record
            metric = Metric(
                room_id=room_db_id,
                date=metric_date,
                eggs_produced=int(row['eggs_produced']) if 'eggs_produced' in row and pd.notna(row['eggs_produced']) else None,
                avg_weight_kg=float(row['avg_weight_kg']) if 'avg_weight_kg' in row and pd.notna(row['avg_weight_kg']) else None,
                feed_consumed_kg=float(row['feed_consumed_kg']) if 'feed_consumed_kg' in row and pd.notna(row['feed_consumed_kg']) else None,
                water_consumed_l=float(row['water_consumed_l']) if 'water_consumed_l' in row and pd.notna(row['water_consumed_l']) else None,
                fcr=float(row['fcr']) if 'fcr' in row and pd.notna(row['fcr']) else None,
                mortality_rate=float(row['mortality_rate']) if 'mortality_rate' in row and pd.notna(row['mortality_rate']) else None,
                production_rate=float(row['production_rate']) if 'production_rate' in row and pd.notna(row['production_rate']) else None,
                temperature_c=float(row['temperature_c']) if 'temperature_c' in row and pd.notna(row['temperature_c']) else None,
                humidity_pct=float(row['humidity_pct']) if 'humidity_pct' in row and pd.notna(row['humidity_pct']) else None,
                ammonia_ppm=float(row['ammonia_ppm']) if 'ammonia_ppm' in row and pd.notna(row['ammonia_ppm']) else None,
                revenue=float(row['revenue']) if 'revenue' in row and pd.notna(row['revenue']) else None,
                cost=float(row['cost']) if 'cost' in row and pd.notna(row['cost']) else None,
                profit=float(row['profit']) if 'profit' in row and pd.notna(row['profit']) else None,
                birds_remaining=int(row['birds_remaining']) if 'birds_remaining' in row and pd.notna(row['birds_remaining']) else None,
                flock_age_days=int(row['flock_age_days']) if 'flock_age_days' in row and pd.notna(row['flock_age_days']) else None
            )
            db.add(metric)
            metrics_inserted += 1
    
    # Commit all changes
    await db.commit()
    
    # Calculate date range
    date_range = {
        'start': df['date'].min().date().isoformat(),
        'end': df['date'].max().date().isoformat()
    }
    
    # Get first farm for backwards compatibility
    first_farm = list(farm_map.values())[0]
    
    result = {
        'farm_id': first_farm.id,
        'farm_name': first_farm.name,
        'farms_created': len(farm_map),
        'rooms_created': len(room_map),
        'metrics_inserted': metrics_inserted,
        'date_range': date_range,
        'cleared_existing': clear_existing,
        'farms': [{'id': f.id, 'name': f.name} for f in farm_map.values()]
    }
    
    logger.info(f"Ingestion complete: {result}")
    return result
