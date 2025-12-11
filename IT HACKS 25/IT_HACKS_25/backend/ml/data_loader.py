"""
Phase 11: Data Loader Module
Unified interface for loading and preparing data for ML pipeline
"""

import pandas as pd
import numpy as np
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict
from datetime import datetime

logger = logging.getLogger(__name__)


class DataLoader:
    """
    Unified data loader for farm data with multiple sources.
    """
    
    def __init__(self, data_dir: Optional[Path] = None):
        """
        Initialize data loader.
        
        Args:
            data_dir: Directory containing CSV files (optional)
        """
        if data_dir is None:
            data_dir = Path(__file__).parent.parent / 'data' / 'uploads'
        
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
    
    def load_from_csv(self, file_path: Optional[str] = None) -> pd.DataFrame:
        """
        Load data from CSV file.
        
        Args:
            file_path: Path to CSV file (uses latest if None)
            
        Returns:
            Loaded DataFrame
        """
        if file_path:
            csv_file = Path(file_path)
            if not csv_file.exists():
                raise FileNotFoundError(f"CSV file not found: {file_path}")
        else:
            # Find latest CSV
            csv_files = sorted(
                self.data_dir.glob('*.csv'),
                key=lambda x: x.stat().st_mtime,
                reverse=True
            )
            
            if not csv_files:
                raise FileNotFoundError("No CSV files found in data directory")
            
            csv_file = csv_files[0]
        
        logger.info(f"Loading CSV from: {csv_file}")
        
        try:
            df = pd.read_csv(csv_file, parse_dates=['date'])
            logger.info(f"Loaded {len(df)} rows from {csv_file.name}")
            
            return df
            
        except Exception as e:
            logger.error(f"Failed to load CSV: {e}")
            raise
    
    def load_from_database(self, room_ids: Optional[list] = None) -> pd.DataFrame:
        """
        Load data from database (placeholder for future implementation).
        
        Args:
            room_ids: List of room IDs to load (all if None)
            
        Returns:
            DataFrame with metrics from database
        """
        logger.info("Database loading not yet implemented - use CSV loader")
        return pd.DataFrame()
    
    def load_latest_data(self, limit_days: Optional[int] = None) -> pd.DataFrame:
        """
        Load latest data from uploads directory.
        
        Args:
            limit_days: Optional limit to last N days of data
            
        Returns:
            DataFrame with latest data
        """
        logger.info("Loading latest farm data...")
        
        df = self.load_from_csv()
        
        if limit_days and 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
            cutoff_date = datetime.now() - pd.Timedelta(days=limit_days)
            df = df[df['date'] >= cutoff_date]
            logger.info(f"Limited data to last {limit_days} days: {len(df)} rows")
        
        return df
    
    def load_multiple_csvs(self, file_paths: list) -> pd.DataFrame:
        """
        Load and combine multiple CSV files.
        
        Args:
            file_paths: List of CSV file paths
            
        Returns:
            Combined DataFrame
        """
        dfs = []
        
        for file_path in file_paths:
            logger.info(f"Loading: {file_path}")
            try:
                df = pd.read_csv(file_path, parse_dates=['date'])
                dfs.append(df)
            except Exception as e:
                logger.warning(f"Failed to load {file_path}: {e}")
        
        if not dfs:
            raise ValueError("No CSV files loaded successfully")
        
        combined_df = pd.concat(dfs, ignore_index=True)
        logger.info(f"Combined {len(dfs)} files into {len(combined_df)} rows")
        
        return combined_df
    
    def load_training_data(self, 
                          csv_path: Optional[str] = None,
                          min_room_size: int = 14) -> Tuple[pd.DataFrame, Dict]:
        """
        Load and validate data for training.
        
        Args:
            csv_path: Path to CSV file
            min_room_size: Minimum days of data per room
            
        Returns:
            Tuple of (cleaned_df, metadata)
        """
        logger.info("Loading training data...")
        
        # Load CSV
        df = self.load_from_csv(csv_path)
        
        # Ensure date column exists
        if 'date' not in df.columns:
            raise ValueError("CSV must contain 'date' column")
        
        df['date'] = pd.to_datetime(df['date'])
        
        # Sort by room and date
        if 'room_id' in df.columns:
            df = df.sort_values(['room_id', 'date']).reset_index(drop=True)
        else:
            logger.warning("No room_id column - treating as single room")
            df['room_id'] = 'room_1'
        
        # Filter by minimum room size
        room_counts = df.groupby('room_id').size()
        valid_rooms = room_counts[room_counts >= min_room_size].index.tolist()
        df = df[df['room_id'].isin(valid_rooms)]
        
        if len(df) == 0:
            raise ValueError(f"No rooms with >= {min_room_size} days of data")
        
        metadata = {
            'n_rows': len(df),
            'n_rooms': df['room_id'].nunique(),
            'date_range': (df['date'].min(), df['date'].max()),
            'columns': df.columns.tolist(),
            'missing_values': df.isnull().sum().to_dict()
        }
        
        logger.info(f"Training data loaded: {metadata['n_rooms']} rooms, {len(df)} records")
        
        return df, metadata
    
    def get_available_csv_files(self) -> list:
        """
        Get list of available CSV files.
        
        Returns:
            List of CSV file paths (newest first)
        """
        csv_files = sorted(
            self.data_dir.glob('*.csv'),
            key=lambda x: x.stat().st_mtime,
            reverse=True
        )
        
        return [str(f) for f in csv_files]
    
    def validate_csv_structure(self, file_path: str) -> Tuple[bool, list]:
        """
        Validate CSV file structure.
        
        Args:
            file_path: Path to CSV file
            
        Returns:
            Tuple of (is_valid, issues)
        """
        issues = []
        
        try:
            df = pd.read_csv(file_path, nrows=1)
            
            # Check required columns
            required_cols = ['date']
            missing = [col for col in required_cols if col not in df.columns]
            if missing:
                issues.append(f"Missing required columns: {missing}")
            
            # Check for data rows
            df_full = pd.read_csv(file_path)
            if len(df_full) == 0:
                issues.append("CSV is empty")
            
        except Exception as e:
            issues.append(f"Failed to read CSV: {e}")
        
        is_valid = len(issues) == 0
        return is_valid, issues


def load_training_data(csv_path: Optional[str] = None) -> Tuple[pd.DataFrame, Dict]:
    """
    Convenience function to load training data.
    
    Args:
        csv_path: Path to CSV file (optional)
        
    Returns:
        Tuple of (df, metadata)
    """
    loader = DataLoader()
    return loader.load_training_data(csv_path)


def load_prediction_data(csv_path: str) -> pd.DataFrame:
    """
    Convenience function to load prediction data.
    
    Args:
        csv_path: Path to CSV file
        
    Returns:
        DataFrame ready for prediction
    """
    loader = DataLoader()
    df = loader.load_from_csv(csv_path)
    
    # Minimal processing
    if 'date' in df.columns:
        df['date'] = pd.to_datetime(df['date'])
    
    return df
