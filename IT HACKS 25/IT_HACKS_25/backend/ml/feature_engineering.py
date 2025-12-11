"""
Phase 11: Advanced Feature Engineering Module
Provides sophisticated feature creation for improved model performance
Features include: moving averages, seasonality, stress indices, trend analysis
"""

import pandas as pd
import numpy as np
import logging
from typing import Dict, Tuple, List

logger = logging.getLogger(__name__)


class AdvancedFeatureEngineer:
    """
    Advanced feature engineering with multiple feature types.
    """
    
    def __init__(self):
        """Initialize feature engineer."""
        self.feature_list = []
        self.feature_stats = {}
    
    def engineer_all_features(self, df: pd.DataFrame, 
                              available_cols: List[str]) -> pd.DataFrame:
        """
        Create all advanced features from raw data.
        
        Args:
            df: Raw DataFrame (sorted by room_id, date)
            available_cols: List of available numeric columns
            
        Returns:
            DataFrame with all engineered features
        """
        logger.info("Engineering advanced features...")
        
        # Create base features
        features = self._create_rolling_features(df, available_cols)
        
        # Add lag features
        features = self._add_lag_features(features, df, available_cols)
        
        # Add trend features
        features = self._add_trend_features(features, df)
        
        # Add stress indices
        features = self._add_stress_indices(features, df, available_cols)
        
        # Add seasonal features
        features = self._add_seasonal_features(features, df)
        
        # Add temporal features
        features = self._add_temporal_features(features, df)
        
        logger.info(f"Feature engineering complete. Created {len(features.columns)} features")
        
        return features
    
    def _create_rolling_features(self, df: pd.DataFrame, 
                                 available_cols: List[str]) -> pd.DataFrame:
        """Create rolling average features (3, 7, 14, 30 day windows)."""
        
        logger.info("Creating rolling average features...")
        features_dict = {}
        
        for room_id, room_data in df.groupby('room_id'):
            if len(room_data) < 30:
                continue
            
            room_data = room_data.sort_values('date').reset_index(drop=True)
            
            for i in range(30, len(room_data)):
                feature_dict = {'room_id': room_id, 'index': i}
                
                # Current values
                for col in available_cols:
                    if col in room_data.columns:
                        feature_dict[f'{col}_current'] = self._safe_get(
                            room_data, i, col
                        )
                
                # Rolling averages (3, 7, 14, 30 days)
                for window in [3, 7, 14, 30]:
                    if i >= window:
                        window_data = room_data.iloc[max(0, i-window):i]
                        for col in available_cols:
                            if col in room_data.columns:
                                feature_dict[f'{col}_rolling_{window}d'] = window_data[col].mean()
                        
                        # Rolling std (volatility)
                        for col in available_cols:
                            if col in room_data.columns:
                                feature_dict[f'{col}_std_{window}d'] = window_data[col].std()
                
                if feature_dict:
                    features_dict[len(features_dict)] = feature_dict
        
        df_features = pd.DataFrame.from_dict(features_dict, orient='index')
        return df_features
    
    def _add_lag_features(self, features_df: pd.DataFrame, 
                         raw_df: pd.DataFrame, 
                         available_cols: List[str]) -> pd.DataFrame:
        """Add lag features (1, 3, 7, 14 day lags)."""
        
        logger.info("Adding lag features...")
        
        for room_id, room_data in raw_df.groupby('room_id'):
            room_mask = features_df['room_id'] == room_id
            room_indices = features_df[room_mask].index
            room_data = room_data.sort_values('date').reset_index(drop=True)
            
            for lag in [1, 3, 7, 14]:
                for col in available_cols:
                    if col in room_data.columns:
                        for idx, feature_idx in enumerate(room_indices):
                            data_idx = features_df.loc[feature_idx, 'index']
                            
                            if data_idx >= lag:
                                lag_value = self._safe_get(room_data, data_idx - lag, col)
                                features_df.loc[feature_idx, f'{col}_lag_{lag}d'] = lag_value
                            else:
                                features_df.loc[feature_idx, f'{col}_lag_{lag}d'] = np.nan
        
        # Fill remaining NaNs
        features_df = features_df.fillna(features_df.mean())
        
        return features_df
    
    def _add_trend_features(self, features_df: pd.DataFrame, 
                           raw_df: pd.DataFrame) -> pd.DataFrame:
        """Add trend and momentum features."""
        
        logger.info("Adding trend features...")
        
        for room_id, room_data in raw_df.groupby('room_id'):
            room_mask = features_df['room_id'] == room_id
            room_indices = features_df[room_mask].index
            room_data = room_data.sort_values('date').reset_index(drop=True)
            
            for idx, feature_idx in enumerate(room_indices):
                data_idx = features_df.loc[feature_idx, 'index']
                
                # Weight trend (3, 7 days)
                if 'avg_weight_kg' in room_data.columns:
                    if data_idx >= 3:
                        recent_3d = room_data.iloc[data_idx-3:data_idx]['avg_weight_kg'].dropna()
                        if len(recent_3d) > 1:
                            features_df.loc[feature_idx, 'weight_trend_3d'] = \
                                recent_3d.iloc[-1] - recent_3d.iloc[0]
                    
                    if data_idx >= 7:
                        recent_7d = room_data.iloc[data_idx-7:data_idx]['avg_weight_kg'].dropna()
                        if len(recent_7d) > 1:
                            features_df.loc[feature_idx, 'weight_trend_7d'] = \
                                recent_7d.iloc[-1] - recent_7d.iloc[0]
                
                # Momentum (rate of change)
                for col in ['avg_weight_kg', 'temperature_c', 'humidity_pct']:
                    if col in room_data.columns and data_idx >= 1:
                        curr = self._safe_get(room_data, data_idx, col)
                        prev = self._safe_get(room_data, data_idx - 1, col)
                        if curr is not None and prev is not None and prev != 0:
                            features_df.loc[feature_idx, f'{col}_momentum'] = (curr - prev) / prev
        
        # Fill remaining NaNs
        features_df = features_df.fillna(features_df.mean())
        
        return features_df
    
    def _add_stress_indices(self, features_df: pd.DataFrame, 
                           raw_df: pd.DataFrame,
                           available_cols: List[str]) -> pd.DataFrame:
        """Add stress indices based on environmental factors."""
        
        logger.info("Adding stress indices...")
        
        for room_id, room_data in raw_df.groupby('room_id'):
            room_mask = features_df['room_id'] == room_id
            room_indices = features_df[room_mask].index
            room_data = room_data.sort_values('date').reset_index(drop=True)
            
            for idx, feature_idx in enumerate(room_indices):
                data_idx = features_df.loc[feature_idx, 'index']
                
                # Temperature stress (deviation from optimal 20-24°C)
                if 'temperature_c' in available_cols:
                    temp = self._safe_get(room_data, data_idx, 'temperature_c')
                    if temp is not None:
                        optimal_range = (20, 24)
                        if temp < optimal_range[0]:
                            features_df.loc[feature_idx, 'temperature_stress'] = optimal_range[0] - temp
                        elif temp > optimal_range[1]:
                            features_df.loc[feature_idx, 'temperature_stress'] = temp - optimal_range[1]
                        else:
                            features_df.loc[feature_idx, 'temperature_stress'] = 0
                
                # Humidity stress (deviation from optimal 60-70%)
                if 'humidity_pct' in available_cols:
                    humidity = self._safe_get(room_data, data_idx, 'humidity_pct')
                    if humidity is not None:
                        optimal_range = (60, 70)
                        if humidity < optimal_range[0]:
                            features_df.loc[feature_idx, 'humidity_stress'] = optimal_range[0] - humidity
                        elif humidity > optimal_range[1]:
                            features_df.loc[feature_idx, 'humidity_stress'] = humidity - optimal_range[1]
                        else:
                            features_df.loc[feature_idx, 'humidity_stress'] = 0
                
                # Combined environmental stress
                stress_components = []
                if 'temperature_stress' in features_df.columns:
                    stress_components.append(features_df.loc[feature_idx, 'temperature_stress'] or 0)
                if 'humidity_stress' in features_df.columns:
                    stress_components.append(features_df.loc[feature_idx, 'humidity_stress'] or 0)
                
                if stress_components:
                    features_df.loc[feature_idx, 'total_environmental_stress'] = sum(stress_components)
        
        return features_df
    
    def _add_seasonal_features(self, features_df: pd.DataFrame, 
                              raw_df: pd.DataFrame) -> pd.DataFrame:
        """Add seasonal and cyclical features."""
        
        logger.info("Adding seasonal features...")
        
        # This would require date information - simplified version
        # In production, would use actual dates for day-of-year, month, etc.
        
        # Flock age (if available)
        for room_id, room_data in raw_df.groupby('room_id'):
            room_mask = features_df['room_id'] == room_id
            room_indices = features_df[room_mask].index
            room_data = room_data.sort_values('date').reset_index(drop=True)
            
            for idx, feature_idx in enumerate(room_indices):
                data_idx = features_df.loc[feature_idx, 'index']
                
                if 'age_days' in room_data.columns:
                    age = self._safe_get(room_data, data_idx, 'age_days')
                    if age is not None:
                        features_df.loc[feature_idx, 'flock_age'] = age
                else:
                    features_df.loc[feature_idx, 'flock_age'] = data_idx  # Use row index as proxy
                
                # Flock maturity stage (0=chick, 1=grower, 2=layer)
                flock_age = features_df.loc[feature_idx, 'flock_age']
                if flock_age < 8:
                    features_df.loc[feature_idx, 'maturity_stage'] = 0
                elif flock_age < 16:
                    features_df.loc[feature_idx, 'maturity_stage'] = 1
                else:
                    features_df.loc[feature_idx, 'maturity_stage'] = 2
        
        return features_df
    
    def _add_temporal_features(self, features_df: pd.DataFrame, 
                              raw_df: pd.DataFrame) -> pd.DataFrame:
        """Add time-based features."""
        
        logger.info("Adding temporal features...")
        
        for room_id, room_data in raw_df.groupby('room_id'):
            room_mask = features_df['room_id'] == room_id
            room_indices = features_df[room_mask].index
            room_data = room_data.sort_values('date').reset_index(drop=True)
            
            if 'date' in room_data.columns:
                for idx, feature_idx in enumerate(room_indices):
                    data_idx = features_df.loc[feature_idx, 'index']
                    
                    date = room_data.iloc[data_idx]['date']
                    
                    if pd.notna(date):
                        date = pd.to_datetime(date)
                        features_df.loc[feature_idx, 'day_of_week'] = date.dayofweek
                        features_df.loc[feature_idx, 'day_of_month'] = date.day
                        features_df.loc[feature_idx, 'month'] = date.month
                        features_df.loc[feature_idx, 'quarter'] = date.quarter
        
        return features_df
    
    @staticmethod
    def _safe_get(df: pd.DataFrame, index: int, column: str) -> any:
        """Safely get a value from DataFrame, returning None if invalid."""
        try:
            if index < len(df) and column in df.columns:
                value = df.iloc[index][column]
                if pd.notna(value):
                    return float(value)
        except (KeyError, IndexError, TypeError):
            pass
        return None


def create_advanced_features(df: pd.DataFrame, 
                            available_cols: List[str]) -> Tuple[pd.DataFrame, Dict]:
    """
    Convenience function to create advanced features.
    
    Args:
        df: Raw data DataFrame (sorted by room_id, date)
        available_cols: List of available numeric columns
        
    Returns:
        Tuple of (features_df, feature_info)
    """
    engineer = AdvancedFeatureEngineer()
    
    features_df = engineer.engineer_all_features(df, available_cols)
    
    info = {
        'n_features': len(features_df.columns),
        'n_samples': len(features_df),
        'feature_columns': features_df.columns.tolist()
    }
    
    return features_df, info
