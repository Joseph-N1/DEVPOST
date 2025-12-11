"""
Phase 11: Advanced Data Preprocessing Module
Provides data cleaning, validation, and transformation utilities for ML pipeline
"""

import pandas as pd
import numpy as np
import logging
from pathlib import Path
from typing import Tuple, List, Dict, Optional

logger = logging.getLogger(__name__)


class DataPreprocessor:
    """
    Advanced data preprocessing with validation and transformation.
    """
    
    def __init__(self, missing_value_strategy: str = 'forward_fill'):
        """
        Initialize preprocessor.
        
        Args:
            missing_value_strategy: How to handle missing values 
                                   ('forward_fill', 'interpolate', 'drop', 'mean')
        """
        self.missing_value_strategy = missing_value_strategy
        self.numeric_columns = []
        self.categorical_columns = []
        
    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Clean data by removing duplicates, fixing types, handling missing values.
        
        Args:
            df: Raw DataFrame
            
        Returns:
            Cleaned DataFrame
        """
        logger.info("Starting data cleaning...")
        
        # Remove duplicates
        original_len = len(df)
        df = df.drop_duplicates()
        if len(df) < original_len:
            logger.info(f"Removed {original_len - len(df)} duplicate rows")
        
        # Fix date columns
        date_cols = [col for col in df.columns if 'date' in col.lower()]
        for col in date_cols:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors='coerce')
        
        # Ensure numeric columns are numeric
        numeric_cols = df.select_dtypes(include=['float64', 'int64']).columns
        for col in numeric_cols:
            df[col] = pd.to_numeric(df[col], errors='coerce')
        
        # Handle missing values
        df = self._handle_missing_values(df)
        
        logger.info(f"Data cleaning complete. Shape: {df.shape}")
        return df
    
    def _handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle missing values based on strategy."""
        
        numeric_cols = df.select_dtypes(include=['float64', 'int64']).columns
        
        for col in numeric_cols:
            missing_count = df[col].isna().sum()
            if missing_count == 0:
                continue
                
            if self.missing_value_strategy == 'forward_fill':
                df[col] = df.groupby('room_id')[col].fillna(method='ffill')
                df[col] = df[col].fillna(method='bfill')  # Backward fill for first values
                
            elif self.missing_value_strategy == 'interpolate':
                df[col] = df.groupby('room_id')[col].transform(
                    lambda x: x.interpolate(method='linear', limit_direction='both')
                )
                
            elif self.missing_value_strategy == 'drop':
                df = df.dropna(subset=[col])
                
            elif self.missing_value_strategy == 'mean':
                mean_val = df[col].mean()
                df[col] = df[col].fillna(mean_val)
        
        return df
    
    def validate_data(self, df: pd.DataFrame) -> Tuple[bool, List[str]]:
        """
        Validate data quality.
        
        Args:
            df: DataFrame to validate
            
        Returns:
            Tuple of (is_valid, list_of_issues)
        """
        issues = []
        
        # Check required columns
        required_cols = ['room_id', 'date', 'avg_weight_kg']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            issues.append(f"Missing required columns: {missing_cols}")
        
        # Check minimum rows
        if len(df) < 14:
            issues.append(f"Insufficient data: {len(df)} rows (need at least 14)")
        
        # Check for minimum rooms
        if 'room_id' in df.columns:
            n_rooms = df['room_id'].nunique()
            if n_rooms < 1:
                issues.append("No valid room data found")
        
        # Check for valid numeric values
        numeric_cols = df.select_dtypes(include=['float64', 'int64']).columns
        for col in numeric_cols:
            inf_count = np.isinf(df[col]).sum()
            if inf_count > 0:
                issues.append(f"Column {col} contains infinite values")
        
        is_valid = len(issues) == 0
        
        if is_valid:
            logger.info("✅ Data validation passed")
        else:
            logger.warning(f"⚠️  Data validation issues: {issues}")
        
        return is_valid, issues
    
    def scale_features(self, X: pd.DataFrame, fit: bool = True) -> pd.DataFrame:
        """
        Scale numeric features to 0-1 range.
        
        Args:
            X: Feature DataFrame
            fit: Whether to fit the scaler (True) or just transform
            
        Returns:
            Scaled DataFrame
        """
        from sklearn.preprocessing import MinMaxScaler
        
        numeric_cols = X.select_dtypes(include=['float64', 'int64']).columns
        X_scaled = X.copy()
        
        scaler = MinMaxScaler()
        X_scaled[numeric_cols] = scaler.fit_transform(X[numeric_cols])
        
        return X_scaled


def preprocess_farm_data(df: pd.DataFrame, 
                        strategy: str = 'forward_fill') -> Tuple[pd.DataFrame, Dict]:
    """
    Convenience function to preprocess farm data.
    
    Args:
        df: Raw farm data DataFrame
        strategy: Missing value handling strategy
        
    Returns:
        Tuple of (cleaned_df, preprocessing_info)
    """
    preprocessor = DataPreprocessor(missing_value_strategy=strategy)
    
    # Clean
    df_clean = preprocessor.clean_data(df)
    
    # Validate
    is_valid, issues = preprocessor.validate_data(df_clean)
    
    info = {
        'original_rows': len(df),
        'cleaned_rows': len(df_clean),
        'is_valid': is_valid,
        'issues': issues,
        'strategy': strategy
    }
    
    return df_clean, info
