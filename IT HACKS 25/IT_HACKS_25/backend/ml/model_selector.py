"""
Phase 11: Model Selector Module
Automatically selects best ML model type based on dataset characteristics
Supports: RandomForest, GradientBoosting, LightGBM, XGBoost
"""

import pandas as pd
import numpy as np
import logging
from typing import Dict, Tuple, List
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import cross_val_score
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)


class ModelSelector:
    """
    Intelligent model selection based on dataset characteristics.
    """
    
    def __init__(self):
        """Initialize model selector."""
        self.dataset_stats = {}
        self.model_scores = {}
    
    def analyze_dataset(self, X: pd.DataFrame, y: pd.Series) -> Dict:
        """
        Analyze dataset characteristics.
        
        Args:
            X: Feature matrix
            y: Target variable
            
        Returns:
            Dictionary with dataset statistics
        """
        logger.info("Analyzing dataset characteristics...")
        
        stats = {
            'n_samples': len(X),
            'n_features': len(X.columns),
            'target_distribution': {
                'mean': float(y.mean()),
                'std': float(y.std()),
                'min': float(y.min()),
                'max': float(y.max()),
                'skewness': float(y.skew()),
                'kurtosis': float(y.kurtosis())
            },
            'feature_stats': {
                'n_numeric': X.select_dtypes(include=[np.number]).shape[1],
                'n_categorical': X.select_dtypes(exclude=[np.number]).shape[1],
                'missing_values': int(X.isnull().sum().sum()),
                'high_cardinality': sum(1 for col in X.columns if X[col].nunique() > 100)
            }
        }
        
        self.dataset_stats = stats
        
        logger.info(f"Dataset: {stats['n_samples']} samples, {stats['n_features']} features")
        logger.info(f"Target range: [{stats['target_distribution']['min']:.2f}, {stats['target_distribution']['max']:.2f}]")
        
        return stats
    
    def select_best_model(self, X: pd.DataFrame, y: pd.Series, 
                         models_to_test: List[str] = None) -> Tuple[str, Dict]:
        """
        Test multiple models and select the best one.
        
        Args:
            X: Feature matrix
            y: Target variable
            models_to_test: List of model types to evaluate
                           Default: ['random_forest', 'gradient_boosting']
            
        Returns:
            Tuple of (best_model_type, evaluation_results)
        """
        if models_to_test is None:
            models_to_test = ['random_forest', 'gradient_boosting']
        
        logger.info(f"Testing models: {models_to_test}")
        
        # Analyze dataset
        self.analyze_dataset(X, y)
        
        results = {}
        
        # Test each model
        if 'random_forest' in models_to_test:
            results['random_forest'] = self._evaluate_model(
                X, y, 
                RandomForestRegressor(n_estimators=100, max_depth=15, random_state=42)
            )
        
        if 'gradient_boosting' in models_to_test:
            results['gradient_boosting'] = self._evaluate_model(
                X, y,
                GradientBoostingRegressor(n_estimators=100, max_depth=5, random_state=42)
            )
        
        # Try LightGBM if available
        if 'lightgbm' in models_to_test:
            try:
                import lightgbm as lgb
                lgb_model = lgb.LGBMRegressor(n_estimators=100, random_state=42)
                results['lightgbm'] = self._evaluate_model(X, y, lgb_model)
            except ImportError:
                logger.warning("LightGBM not available - skipping")
        
        # Try XGBoost if available
        if 'xgboost' in models_to_test:
            try:
                import xgboost as xgb
                xgb_model = xgb.XGBRegressor(n_estimators=100, max_depth=5, random_state=42)
                results['xgboost'] = self._evaluate_model(X, y, xgb_model)
            except ImportError:
                logger.warning("XGBoost not available - skipping")
        
        # Select best model
        if not results:
            logger.warning("No models evaluated - returning default 'random_forest'")
            return 'random_forest', {}
        
        best_model = max(results.items(), key=lambda x: x[1]['cv_score_mean'])
        
        logger.info(f"\n{'='*60}")
        logger.info("MODEL COMPARISON RESULTS")
        logger.info(f"{'='*60}")
        
        for model_name, scores in sorted(results.items(), 
                                        key=lambda x: x[1]['cv_score_mean'], 
                                        reverse=True):
            logger.info(f"\n{model_name.upper()}:")
            logger.info(f"  CV Score (MAE): {scores['cv_score_mean']:.4f} ± {scores['cv_score_std']:.4f}")
            logger.info(f"  Train MAE: {scores['train_mae']:.4f}")
            logger.info(f"  Test MAE: {scores['test_mae']:.4f}")
        
        logger.info(f"\n{'='*60}")
        logger.info(f"✅ SELECTED MODEL: {best_model[0].upper()}")
        logger.info(f"{'='*60}\n")
        
        self.model_scores = results
        
        return best_model[0], results
    
    def _evaluate_model(self, X: pd.DataFrame, y: pd.Series, model) -> Dict:
        """
        Evaluate a single model using cross-validation.
        
        Args:
            X: Feature matrix
            y: Target variable
            model: Model instance to evaluate
            
        Returns:
            Dictionary with evaluation metrics
        """
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import mean_absolute_error
        
        try:
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            # Train
            model.fit(X_train, y_train)
            
            # Evaluate
            train_mae = mean_absolute_error(y_train, model.predict(X_train))
            test_mae = mean_absolute_error(y_test, model.predict(X_test))
            
            # Cross-validation
            cv_scores = cross_val_score(
                model, X_train, y_train, cv=5,
                scoring='neg_mean_absolute_error', n_jobs=-1
            )
            
            results = {
                'train_mae': float(train_mae),
                'test_mae': float(test_mae),
                'cv_score_mean': float(-cv_scores.mean()),
                'cv_score_std': float(cv_scores.std()),
                'cv_scores': [-score for score in cv_scores]
            }
            
            return results
            
        except Exception as e:
            logger.error(f"Model evaluation failed: {e}")
            return {
                'train_mae': float('inf'),
                'test_mae': float('inf'),
                'cv_score_mean': float('inf'),
                'cv_score_std': 0,
                'error': str(e)
            }
    
    def recommend_model(self) -> str:
        """
        Recommend a model based on dataset characteristics.
        
        Returns:
            Recommended model type
        """
        if not self.dataset_stats:
            return 'random_forest'  # Default
        
        stats = self.dataset_stats
        
        # Decision tree for model selection
        
        # If many samples and features -> GradientBoosting
        if stats['n_samples'] > 1000 and stats['n_features'] > 30:
            logger.info("Large dataset detected - recommending GradientBoosting")
            return 'gradient_boosting'
        
        # If high feature dimensionality -> RandomForest
        if stats['n_features'] > 50:
            logger.info("High dimensionality detected - recommending RandomForest")
            return 'random_forest'
        
        # If target has high skewness -> GradientBoosting
        if abs(stats['target_distribution']['skewness']) > 1:
            logger.info("Skewed target distribution - recommending GradientBoosting")
            return 'gradient_boosting'
        
        # Default
        logger.info("Using default RandomForest")
        return 'random_forest'
    
    def get_model_parameters(self, model_type: str, 
                            dataset_size: str = 'medium') -> Dict:
        """
        Get recommended hyperparameters for model type and dataset size.
        
        Args:
            model_type: Type of model
            dataset_size: Size of dataset ('small', 'medium', 'large')
            
        Returns:
            Dictionary of hyperparameters
        """
        params = {
            'random_forest': {
                'small': {
                    'n_estimators': 50,
                    'max_depth': 10,
                    'min_samples_split': 5
                },
                'medium': {
                    'n_estimators': 100,
                    'max_depth': 15,
                    'min_samples_split': 5
                },
                'large': {
                    'n_estimators': 200,
                    'max_depth': 20,
                    'min_samples_split': 3
                }
            },
            'gradient_boosting': {
                'small': {
                    'n_estimators': 50,
                    'learning_rate': 0.1,
                    'max_depth': 3
                },
                'medium': {
                    'n_estimators': 100,
                    'learning_rate': 0.1,
                    'max_depth': 5
                },
                'large': {
                    'n_estimators': 200,
                    'learning_rate': 0.05,
                    'max_depth': 7
                }
            }
        }
        
        return params.get(model_type, {}).get(dataset_size, {})


def select_best_model(X: pd.DataFrame, y: pd.Series) -> Tuple[str, Dict]:
    """
    Convenience function to select best model.
    
    Args:
        X: Feature matrix
        y: Target variable
        
    Returns:
        Tuple of (model_type, results)
    """
    selector = ModelSelector()
    return selector.select_best_model(X, y)
