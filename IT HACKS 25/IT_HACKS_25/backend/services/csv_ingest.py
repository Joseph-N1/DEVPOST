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
    # Column mapping dictionary - handles Phase 10 generated CSVs and legacy formats
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
        'feed_kg_total': 'feed_consumed_kg',
        
        'water': 'water_consumed_l',
        'water consumed': 'water_consumed_l',
        'water_consumed': 'water_consumed_l',
        'water_consumed_l': 'water_consumed_l',
        'water_liters_total': 'water_consumed_l',
        
        'fcr': 'fcr',
        'feed conversion ratio': 'fcr',
        'feed_conversion_ratio': 'fcr',
        
        'mortality': 'mortality_rate',
        'mortality rate': 'mortality_rate',
        'mortality_rate': 'mortality_rate',
        'mortality_daily': 'mortality_rate',
        
        'temperature': 'temperature_c',
        'temp': 'temperature_c',
        'temperature_c': 'temperature_c',
        
        'humidity': 'humidity_pct',
        'humidity_pct': 'humidity_pct',
        'humidity percentage': 'humidity_pct',
        
        'revenue': 'revenue',
        'egg_revenue_usd': 'revenue',
        
        'cost': 'cost',
        'total_costs_usd': 'cost',
        
        'profit': 'profit',
        'profit_usd': 'profit',
        
        'birds': 'birds_remaining',
        'birds remaining': 'birds_remaining',
        'birds_remaining': 'birds_remaining',
        'birds_end': 'birds_remaining',
        
        'flock age': 'flock_age_days',
        'flock_age': 'flock_age_days',
        'flock_age_days': 'flock_age_days',
        'age_days': 'flock_age_days',
        
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
                      'water_consumed_l', 'fcr', 'mortality_rate',
                      'temperature_c', 'humidity_pct', 'revenue', 'cost', 'profit']
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
                # Handle case where birds_start is NaN - try birds_remaining instead
                if (birds_start is None or pd.isna(birds_start)) and 'birds_remaining' in room_df.columns:
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
    
    # Helper function to safely get values from row
    def get_metric_value(row, col, type_func=None):
        """Safely extract value from pandas Series row"""
        if col not in row.index:
            return None
        val = row[col]
        # Handle case where val might be a Series (MultiIndex) - take first element
        if isinstance(val, pd.Series):
            if len(val) == 0:
                return None
            val = val.iloc[0]
        # Check for NaN/null values
        try:
            if pd.isna(val):
                return None
        except (TypeError, ValueError):
            # If isna() fails, treat as None
            return None
        try:
            if type_func:
                return type_func(val)
            return val
        except (ValueError, TypeError):
            return None
    
    for (csv_farm_id, room_id), room_db_id in room_map.items():
        room_df = df[(df['farm_id'] == csv_farm_id) & (df['room_id'] == room_id)].copy()
        
        for _, row in room_df.iterrows():
            # Check if metric already exists (avoid duplicates)
            try:
                # Convert date to datetime if it's a string
                date_val = row['date']
                if pd.isna(date_val):
                    logger.warning(f"Skipping row with missing date")
                    continue
                # Ensure we have a Timestamp object
                ts = pd.Timestamp(date_val) if not isinstance(date_val, pd.Timestamp) else date_val
                metric_date = ts.date()
            except Exception as e:
                logger.warning(f"Skipping row with invalid date {date_val}: {str(e)}")
                continue
            
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
            
            # Create metric record with safe value extraction
            metric = Metric(
                room_id=room_db_id,
                date=metric_date,
                eggs_produced=get_metric_value(row, 'eggs_produced', int),
                avg_weight_kg=get_metric_value(row, 'avg_weight_kg', float),
                feed_consumed_kg=get_metric_value(row, 'feed_consumed_kg', float),
                water_consumed_l=get_metric_value(row, 'water_consumed_l', float),
                fcr=get_metric_value(row, 'fcr', float),
                mortality_rate=get_metric_value(row, 'mortality_rate', float),
                temperature_c=get_metric_value(row, 'temperature_c', float),
                humidity_pct=get_metric_value(row, 'humidity_pct', float),
                revenue=get_metric_value(row, 'revenue', float),
                cost=get_metric_value(row, 'cost', float),
                profit=get_metric_value(row, 'profit', float),
                birds_remaining=get_metric_value(row, 'birds_remaining', int),
                flock_age_days=get_metric_value(row, 'flock_age_days', int)
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
