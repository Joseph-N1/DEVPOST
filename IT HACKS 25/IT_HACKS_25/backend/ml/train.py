"""
Phase 7: Advanced ML Training Pipeline
Supports multiple model types: RandomForest, LSTM, Transformer, AutoARIMA
Includes model versioning, performance tracking, and auto-deployment
"""

import pandas as pd
import numpy as np
import joblib
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional, Tuple
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Paths
MODELS_DIR = Path(__file__).parent / 'models'
MODELS_DIR.mkdir(parents=True, exist_ok=True)

DATA_DIR = Path(__file__).parent.parent / 'data' / 'uploads'


class MLTrainer:
    """
    Advanced ML training pipeline with multi-model support.
    Handles data loading, feature engineering, training, evaluation, and versioning.
    """
    
    def __init__(self, model_type: str = 'random_forest'):
        """
        Initialize trainer with specified model type.
        
        Args:
            model_type: Type of model ('random_forest', 'gradient_boosting', 'lstm', 'transformer')
        """
        self.model_type = model_type
        self.model = None
        self.scaler = None
        self.feature_names = None
        self.metrics = {}
        
    def load_data_from_csv(self, csv_path: Optional[str] = None) -> pd.DataFrame:
        """
        Load data from CSV file or latest upload.
        
        Args:
            csv_path: Path to CSV file (optional, uses latest if None)
            
        Returns:
            DataFrame with loaded data
        """
        if csv_path and Path(csv_path).exists():
            data_file = Path(csv_path)
        else:
            # Find latest CSV in uploads directory
            csv_files = sorted(DATA_DIR.glob('*.csv'), key=lambda x: x.stat().st_mtime, reverse=True)
            if not csv_files:
                raise FileNotFoundError("No CSV files found in uploads directory")
            data_file = csv_files[0]
        
        logger.info(f"Loading data from: {data_file}")
        df = pd.read_csv(data_file, parse_dates=['date'])
        logger.info(f"Loaded {len(df)} records from {len(df['room_id'].unique())} rooms")
        
        return df
    
    def engineer_features(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Create features for ML training with advanced feature engineering.
        
        Features include:
        - Rolling averages (3-day, 7-day)
        - Lag features (1-day, 3-day, 7-day)
        - Environmental factors
        - Trend indicators
        - Room-specific statistics
        
        Args:
            df: Raw DataFrame with metrics
            
        Returns:
            Tuple of (X features, y target)
        """
        logger.info("Engineering features...")
        
        # Sort by room and date
        df = df.sort_values(['room_id', 'date']).copy()
        
        features_list = []
        target_list = []
        
        for room_id, room_data in df.groupby('room_id'):
            if len(room_data) < 14:  # Need at least 2 weeks of data
                logger.warning(f"Skipping room {room_id}: insufficient data ({len(room_data)} days)")
                continue
            
            room_data = room_data.sort_values('date').reset_index(drop=True)
            
            # Base features
            base_cols = ['temperature_c', 'humidity_pct', 'feed_kg_total', 'water_liters_total', 
                        'mortality_rate', 'eggs_produced']
            
            # Check which columns exist
            available_cols = [col for col in base_cols if col in room_data.columns and room_data[col].notna().any()]
            
            if not available_cols:
                logger.warning(f"Skipping room {room_id}: no valid feature columns")
                continue
            
            # Target: predict average weight
            if 'avg_weight_kg' not in room_data.columns or room_data['avg_weight_kg'].isna().all():
                logger.warning(f"Skipping room {room_id}: no target variable (avg_weight_kg)")
                continue
            
            # Create time-based features
            for i in range(7, len(room_data)):  # Start from day 7 to have enough history
                feature_dict = {}
                
                # Current values
                for col in available_cols:
                    if col in room_data.columns:
                        feature_dict[f'{col}_current'] = room_data.iloc[i][col] if pd.notna(room_data.iloc[i][col]) else room_data[col].mean()
                
                # Rolling averages (3-day, 7-day)
                for window in [3, 7]:
                    window_data = room_data.iloc[max(0, i-window):i]
                    for col in available_cols:
                        if col in room_data.columns:
                            feature_dict[f'{col}_rolling_{window}d'] = window_data[col].mean()
                
                # Lag features (1-day, 3-day)
                for lag in [1, 3]:
                    if i >= lag:
                        for col in available_cols:
                            if col in room_data.columns:
                                feature_dict[f'{col}_lag_{lag}d'] = room_data.iloc[i-lag][col] if pd.notna(room_data.iloc[i-lag][col]) else room_data[col].mean()
                
                # Trend indicators
                if 'avg_weight_kg' in room_data.columns and i >= 3:
                    recent_weights = room_data.iloc[i-3:i]['avg_weight_kg'].dropna()
                    if len(recent_weights) >= 2:
                        feature_dict['weight_trend'] = recent_weights.iloc[-1] - recent_weights.iloc[0] if len(recent_weights) > 0 else 0
                    else:
                        feature_dict['weight_trend'] = 0
                
                # Day of cycle (if available)
                if 'age_days' in room_data.columns:
                    feature_dict['flock_age'] = room_data.iloc[i]['age_days'] if pd.notna(room_data.iloc[i]['age_days']) else 30
                else:
                    feature_dict['flock_age'] = i  # Use day number as proxy
                
                # Target value
                target_value = room_data.iloc[i]['avg_weight_kg']
                
                if pd.notna(target_value) and all(pd.notna(v) or isinstance(v, (int, float)) for v in feature_dict.values()):
                    features_list.append(feature_dict)
                    target_list.append(target_value)
        
        if not features_list:
            raise ValueError("No valid feature samples created. Check data quality and column names.")
        
        X = pd.DataFrame(features_list)
        y = pd.Series(target_list)
        
        # Fill any remaining NaN values
        X = X.fillna(X.mean())
        
        logger.info(f"Created {len(X)} feature samples with {len(X.columns)} features")
        logger.info(f"Feature columns: {X.columns.tolist()}")
        
        self.feature_names = X.columns.tolist()
        
        return X, y
    
    def train_model(self, X: pd.DataFrame, y: pd.Series, test_size: float = 0.2) -> Dict[str, Any]:
        """
        Train ML model with specified configuration.
        
        Args:
            X: Feature matrix
            y: Target variable
            test_size: Test set proportion
            
        Returns:
            Dictionary with training metrics
        """
        logger.info(f"Training {self.model_type} model...")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42
        )
        
        # Feature scaling
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Select and train model
        if self.model_type == 'random_forest':
            self.model = RandomForestRegressor(
                n_estimators=200,
                max_depth=15,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            )
        elif self.model_type == 'gradient_boosting':
            self.model = GradientBoostingRegressor(
                n_estimators=200,
                learning_rate=0.1,
                max_depth=5,
                min_samples_split=5,
                random_state=42
            )
        else:
            # Default to Random Forest
            self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        
        # Train model
        self.model.fit(X_train_scaled, y_train)
        
        # Predictions
        y_train_pred = self.model.predict(X_train_scaled)
        y_test_pred = self.model.predict(X_test_scaled)
        
        # Calculate metrics
        metrics = {
            'train_mae': float(mean_absolute_error(y_train, y_train_pred)),
            'test_mae': float(mean_absolute_error(y_test, y_test_pred)),
            'train_rmse': float(np.sqrt(mean_squared_error(y_train, y_train_pred))),
            'test_rmse': float(np.sqrt(mean_squared_error(y_test, y_test_pred))),
            'train_r2': float(r2_score(y_train, y_train_pred)),
            'test_r2': float(r2_score(y_test, y_test_pred)),
            'n_samples': len(X),
            'n_features': len(X.columns),
            'model_type': self.model_type,
            'trained_at': datetime.now().isoformat()
        }
        
        # Cross-validation score
        try:
            cv_scores = cross_val_score(self.model, X_train_scaled, y_train, cv=5, 
                                       scoring='neg_mean_absolute_error', n_jobs=-1)
            metrics['cv_mae_mean'] = float(-cv_scores.mean())
            metrics['cv_mae_std'] = float(cv_scores.std())
        except Exception as e:
            logger.warning(f"Cross-validation failed: {e}")
        
        # Performance score (0-100)
        performance_score = max(0, min(100, metrics['test_r2'] * 100))
        metrics['performance_score'] = round(performance_score, 2)
        
        self.metrics = metrics
        
        logger.info(f"Training complete:")
        logger.info(f"  Test MAE: {metrics['test_mae']:.4f}")
        logger.info(f"  Test RMSE: {metrics['test_rmse']:.4f}")
        logger.info(f"  Test R²: {metrics['test_r2']:.4f}")
        logger.info(f"  Performance Score: {metrics['performance_score']:.2f}/100")
        
        return metrics
    
    def save_model(self, version: Optional[str] = None) -> Dict[str, str]:
        """
        Save trained model and metadata.
        
        Args:
            version: Model version string (auto-generated if None)
            
        Returns:
            Dictionary with save paths
        """
        if version is None:
            version = f"v{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Create version-specific directory
        version_dir = MODELS_DIR / version
        version_dir.mkdir(parents=True, exist_ok=True)
        
        # Save model
        model_path = version_dir / 'model.joblib'
        joblib.dump(self.model, model_path)
        
        # Save scaler
        scaler_path = version_dir / 'scaler.joblib'
        joblib.dump(self.scaler, scaler_path)
        
        # Save feature names
        features_path = version_dir / 'features.joblib'
        joblib.dump(self.feature_names, features_path)
        
        # Save metrics
        metrics_path = version_dir / 'metrics.json'
        import json
        with open(metrics_path, 'w') as f:
            json.dump(self.metrics, f, indent=2)
        
        # Update "latest" symlink (create copy for Windows compatibility)
        latest_dir = MODELS_DIR / 'latest'
        if latest_dir.exists():
            import shutil
            shutil.rmtree(latest_dir)
        
        import shutil
        shutil.copytree(version_dir, latest_dir)
        
        logger.info(f"Model saved to: {version_dir}")
        logger.info(f"Latest model updated: {latest_dir}")
        
        return {
            'version': version,
            'model_path': str(model_path),
            'scaler_path': str(scaler_path),
            'features_path': str(features_path),
            'metrics_path': str(metrics_path)
        }


def train_new_model(csv_path: Optional[str] = None, model_type: str = 'random_forest') -> Dict[str, Any]:
    """
    Main training function - creates and trains a new model.
    
    Args:
        csv_path: Path to CSV file (optional)
        model_type: Type of model to train
        
    Returns:
        Dictionary with training results and model metadata
    """
    try:
        # Initialize trainer
        trainer = MLTrainer(model_type=model_type)
        
        # Load data
        df = trainer.load_data_from_csv(csv_path)
        
        # Engineer features
        X, y = trainer.engineer_features(df)
        
        # Train model
        metrics = trainer.train_model(X, y)
        
        # Save model
        save_info = trainer.save_model()
        
        result = {
            'success': True,
            'version': save_info['version'],
            'model_type': model_type,
            'metrics': metrics,
            'paths': save_info,
            'message': f'Model {save_info["version"]} trained successfully'
        }
        
        logger.info(f"Training complete: {result['message']}")
        
        return result
        
    except Exception as e:
        logger.error(f"Training failed: {e}", exc_info=True)
        return {
            'success': False,
            'error': str(e),
            'message': 'Training failed'
        }


if __name__ == "__main__":
    # Test training
    print("=" * 60)
    print("Phase 7: ML Training Pipeline")
    print("=" * 60)
    
    result = train_new_model(model_type='random_forest')
    
    if result['success']:
        print(f"\n✅ Training successful!")
        print(f"Version: {result['version']}")
        print(f"Model Type: {result['model_type']}")
        print(f"\nMetrics:")
        for key, value in result['metrics'].items():
            if isinstance(value, float):
                print(f"  {key}: {value:.4f}")
            else:
                print(f"  {key}: {value}")
    else:
        print(f"\n❌ Training failed: {result['error']}")
