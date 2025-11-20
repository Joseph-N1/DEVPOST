"""
Phase 7: ML Model Manager
Handles model lifecycle: loading, versioning, deployment, monitoring
"""

import joblib
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List, Optional
import json

logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).parent / 'models'
MODELS_DIR.mkdir(parents=True, exist_ok=True)


class ModelManager:
    """Manages ML model lifecycle and versioning."""
    
    @staticmethod
    def list_models() -> List[Dict[str, Any]]:
        """
        List all available model versions.
        
        Returns:
            List of model metadata dictionaries
        """
        models = []
        
        for version_dir in MODELS_DIR.iterdir():
            if version_dir.is_dir() and version_dir.name != '__pycache__':
                metrics_file = version_dir / 'metrics.json'
                
                if metrics_file.exists():
                    with open(metrics_file, 'r') as f:
                        metrics = json.load(f)
                    
                    models.append({
                        'version': version_dir.name,
                        'model_type': metrics.get('model_type', 'unknown'),
                        'performance_score': metrics.get('performance_score', 0),
                        'test_mae': metrics.get('test_mae', 0),
                        'test_r2': metrics.get('test_r2', 0),
                        'n_samples': metrics.get('n_samples', 0),
                        'trained_at': metrics.get('trained_at', ''),
                        'is_latest': version_dir.name == 'latest'
                    })
        
        # Sort by trained_at descending
        models.sort(key=lambda x: x.get('trained_at', ''), reverse=True)
        
        return models
    
    @staticmethod
    def get_model_info(version: str = 'latest') -> Dict[str, Any]:
        """
        Get detailed information about a specific model version.
        
        Args:
            version: Model version name
            
        Returns:
            Dictionary with model metadata
        """
        version_dir = MODELS_DIR / version
        
        if not version_dir.exists():
            return {'error': f'Model version {version} not found'}
        
        metrics_file = version_dir / 'metrics.json'
        
        if not metrics_file.exists():
            return {'error': f'Metrics file not found for version {version}'}
        
        with open(metrics_file, 'r') as f:
            metrics = json.load(f)
        
        # Check for model files
        model_files = {
            'model': (version_dir / 'model.joblib').exists(),
            'scaler': (version_dir / 'scaler.joblib').exists(),
            'features': (version_dir / 'features.joblib').exists()
        }
        
        return {
            'version': version,
            'metrics': metrics,
            'files_present': model_files,
            'path': str(version_dir),
            'size_mb': sum(f.stat().st_size for f in version_dir.glob('*') if f.is_file()) / (1024 * 1024)
        }
    
    @staticmethod
    def get_active_model() -> Dict[str, Any]:
        """
        Get the currently active/deployed model.
        
        Returns:
            Dictionary with active model info
        """
        return ModelManager.get_model_info('latest')
    
    @staticmethod
    def delete_model(version: str) -> Dict[str, Any]:
        """
        Delete a model version (except 'latest').
        
        Args:
            version: Model version to delete
            
        Returns:
            Result dictionary
        """
        if version == 'latest':
            return {'error': 'Cannot delete latest model', 'success': False}
        
        version_dir = MODELS_DIR / version
        
        if not version_dir.exists():
            return {'error': f'Model version {version} not found', 'success': False}
        
        try:
            import shutil
            shutil.rmtree(version_dir)
            logger.info(f"Deleted model version: {version}")
            return {'success': True, 'message': f'Model {version} deleted'}
        except Exception as e:
            logger.error(f"Failed to delete model {version}: {e}")
            return {'error': str(e), 'success': False}
    
    @staticmethod
    def compare_models(version1: str, version2: str) -> Dict[str, Any]:
        """
        Compare two model versions.
        
        Args:
            version1: First model version
            version2: Second model version
            
        Returns:
            Comparison results
        """
        model1 = ModelManager.get_model_info(version1)
        model2 = ModelManager.get_model_info(version2)
        
        if 'error' in model1 or 'error' in model2:
            return {'error': 'One or both models not found'}
        
        comparison = {
            'version1': version1,
            'version2': version2,
            'metrics_comparison': {
                'test_mae': {
                    'version1': model1['metrics'].get('test_mae', 0),
                    'version2': model2['metrics'].get('test_mae', 0),
                    'winner': version1 if model1['metrics'].get('test_mae', 999) < model2['metrics'].get('test_mae', 999) else version2
                },
                'test_r2': {
                    'version1': model1['metrics'].get('test_r2', 0),
                    'version2': model2['metrics'].get('test_r2', 0),
                    'winner': version1 if model1['metrics'].get('test_r2', 0) > model2['metrics'].get('test_r2', 0) else version2
                },
                'performance_score': {
                    'version1': model1['metrics'].get('performance_score', 0),
                    'version2': model2['metrics'].get('performance_score', 0),
                    'winner': version1 if model1['metrics'].get('performance_score', 0) > model2['metrics'].get('performance_score', 0) else version2
                }
            },
            'recommendation': None
        }
        
        # Determine overall winner
        v1_wins = sum(1 for metric in comparison['metrics_comparison'].values() if metric['winner'] == version1)
        v2_wins = sum(1 for metric in comparison['metrics_comparison'].values() if metric['winner'] == version2)
        
        if v1_wins > v2_wins:
            comparison['recommendation'] = f'{version1} performs better overall'
        elif v2_wins > v1_wins:
            comparison['recommendation'] = f'{version2} performs better overall'
        else:
            comparison['recommendation'] = 'Models perform similarly'
        
        return comparison
    
    @staticmethod
    def get_model_history() -> List[Dict[str, Any]]:
        """
        Get training history across all models.
        
        Returns:
            List of historical training records
        """
        models = ModelManager.list_models()
        
        history = []
        for model in models:
            if model['version'] != 'latest':
                history.append({
                    'version': model['version'],
                    'trained_at': model['trained_at'],
                    'performance_score': model['performance_score'],
                    'test_mae': model['test_mae'],
                    'test_r2': model['test_r2'],
                    'model_type': model['model_type']
                })
        
        return history
    
    @staticmethod
    def validate_model(version: str = 'latest') -> Dict[str, Any]:
        """
        Validate model integrity and readiness.
        
        Args:
            version: Model version to validate
            
        Returns:
            Validation results
        """
        version_dir = MODELS_DIR / version
        
        checks = {
            'version_exists': version_dir.exists(),
            'model_file': False,
            'scaler_file': False,
            'features_file': False,
            'metrics_file': False,
            'model_loadable': False,
            'scaler_loadable': False,
            'features_loadable': False
        }
        
        if not checks['version_exists']:
            return {'valid': False, 'checks': checks, 'error': 'Version directory not found'}
        
        # Check file existence
        checks['model_file'] = (version_dir / 'model.joblib').exists()
        checks['scaler_file'] = (version_dir / 'scaler.joblib').exists()
        checks['features_file'] = (version_dir / 'features.joblib').exists()
        checks['metrics_file'] = (version_dir / 'metrics.json').exists()
        
        # Try loading files
        try:
            if checks['model_file']:
                joblib.load(version_dir / 'model.joblib')
                checks['model_loadable'] = True
        except Exception as e:
            checks['model_load_error'] = str(e)
        
        try:
            if checks['scaler_file']:
                joblib.load(version_dir / 'scaler.joblib')
                checks['scaler_loadable'] = True
        except Exception as e:
            checks['scaler_load_error'] = str(e)
        
        try:
            if checks['features_file']:
                joblib.load(version_dir / 'features.joblib')
                checks['features_loadable'] = True
        except Exception as e:
            checks['features_load_error'] = str(e)
        
        # Overall validity
        is_valid = all([
            checks['model_loadable'],
            checks['scaler_loadable'],
            checks['features_loadable'],
            checks['metrics_file']
        ])
        
        return {
            'valid': is_valid,
            'version': version,
            'checks': checks,
            'message': 'Model is valid and ready for predictions' if is_valid else 'Model validation failed'
        }


# Convenience functions
def get_latest_model():
    """Get the latest model for predictions."""
    return ModelManager.get_active_model()


def list_all_models():
    """List all available models."""
    return ModelManager.list_models()


def validate_deployment():
    """Validate that a model is ready for deployment."""
    return ModelManager.validate_model('latest')


if __name__ == "__main__":
    print("=" * 60)
    print("Phase 7: Model Manager")
    print("=" * 60)
    
    models = ModelManager.list_models()
    print(f"\nFound {len(models)} model(s):")
    for model in models:
        print(f"  - {model['version']} ({model['model_type']}): "
              f"Score {model['performance_score']:.2f}/100, "
              f"R² {model['test_r2']:.4f}")
    
    print("\nValidating latest model...")
    validation = ModelManager.validate_model('latest')
    if validation['valid']:
        print("✅ Model is valid and ready")
    else:
        print("❌ Model validation failed")
        print(f"   Checks: {validation['checks']}")
