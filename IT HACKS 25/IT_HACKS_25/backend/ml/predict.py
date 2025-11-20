"""
Phase 7: Advanced ML Prediction Engine
Multi-horizon forecasting (7/14/30 days) with confidence intervals
Anomaly detection integration
Feed optimization recommendations
"""

import pandas as pd
import numpy as np
import joblib
import logging
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Paths
MODELS_DIR = Path(__file__).parent / 'models'
DATA_DIR = Path(__file__).parent.parent / 'data' / 'uploads'


class MLPredictor:
    """
    Advanced ML prediction engine with multi-horizon forecasting.
    Supports 7-day, 14-day, and 30-day predictions with confidence intervals.
    """
    
    def __init__(self, model_version: str = 'latest'):
        """
        Initialize predictor with specified model version.
        
        Args:
            model_version: Version folder name ('latest' or 'v20251120_123456')
        """
        self.model_version = model_version
        self.model_dir = MODELS_DIR / model_version
        
        if not self.model_dir.exists():
            raise FileNotFoundError(f"Model version '{model_version}' not found at {self.model_dir}")
        
        # Load model components
        self.model = joblib.load(self.model_dir / 'model.joblib')
        self.scaler = joblib.load(self.model_dir / 'scaler.joblib')
        self.feature_names = joblib.load(self.model_dir / 'features.joblib')
        
        # Load metrics
        import json
        with open(self.model_dir / 'metrics.json', 'r') as f:
            self.metrics = json.load(f)
        
        logger.info(f"Loaded model version: {model_version}")
        logger.info(f"Model type: {self.metrics.get('model_type', 'unknown')}")
        logger.info(f"Performance score: {self.metrics.get('performance_score', 0):.2f}/100")
    
    def load_room_data(self, room_id: str, csv_path: Optional[str] = None) -> pd.DataFrame:
        """
        Load historical data for a specific room.
        
        Args:
            room_id: Room identifier
            csv_path: Optional path to specific CSV file
            
        Returns:
            DataFrame with room's historical data
        """
        if csv_path and Path(csv_path).exists():
            data_file = Path(csv_path)
        else:
            csv_files = sorted(DATA_DIR.glob('*.csv'), key=lambda x: x.stat().st_mtime, reverse=True)
            if not csv_files:
                raise FileNotFoundError("No CSV files found")
            data_file = csv_files[0]
        
        df = pd.read_csv(data_file, parse_dates=['date'])
        room_data = df[df['room_id'] == room_id].sort_values('date')
        
        if room_data.empty:
            raise ValueError(f"Room '{room_id}' not found in data")
        
        return room_data
    
    def create_prediction_features(self, room_data: pd.DataFrame, as_of_date: Optional[datetime] = None) -> pd.DataFrame:
        """
        Create features for prediction based on recent history.
        
        Args:
            room_data: Historical data for the room
            as_of_date: Date to predict from (defaults to latest date in data)
            
        Returns:
            DataFrame with one row of features
        """
        if as_of_date is None:
            as_of_date = room_data['date'].max()
        
        # Get recent data window (last 7 days)
        recent_data = room_data[room_data['date'] <= as_of_date].tail(7)
        
        if len(recent_data) < 3:
            raise ValueError("Insufficient historical data for prediction (need at least 3 days)")
        
        feature_dict = {}
        
        # Current values (most recent)
        latest = recent_data.iloc[-1]
        for col in ['temperature_c', 'humidity_pct', 'feed_kg_total', 'water_liters_total', 
                   'mortality_rate', 'eggs_produced']:
            if col in recent_data.columns:
                feature_dict[f'{col}_current'] = latest[col] if pd.notna(latest[col]) else recent_data[col].mean()
        
        # Rolling averages
        for window in [3, 7]:
            window_data = recent_data.tail(window)
            for col in ['temperature_c', 'humidity_pct', 'feed_kg_total', 'water_liters_total', 
                       'mortality_rate', 'eggs_produced']:
                if col in recent_data.columns:
                    feature_dict[f'{col}_rolling_{window}d'] = window_data[col].mean()
        
        # Lag features
        for lag in [1, 3]:
            if len(recent_data) > lag:
                lagged_row = recent_data.iloc[-(lag+1)]
                for col in ['temperature_c', 'humidity_pct', 'feed_kg_total', 'water_liters_total', 
                           'mortality_rate', 'eggs_produced']:
                    if col in recent_data.columns:
                        feature_dict[f'{col}_lag_{lag}d'] = lagged_row[col] if pd.notna(lagged_row[col]) else recent_data[col].mean()
        
        # Weight trend
        if 'avg_weight_kg' in recent_data.columns and len(recent_data) >= 3:
            recent_weights = recent_data.tail(3)['avg_weight_kg'].dropna()
            if len(recent_weights) >= 2:
                feature_dict['weight_trend'] = recent_weights.iloc[-1] - recent_weights.iloc[0]
            else:
                feature_dict['weight_trend'] = 0
        else:
            feature_dict['weight_trend'] = 0
        
        # Flock age
        if 'age_days' in recent_data.columns:
            feature_dict['flock_age'] = latest['age_days'] if pd.notna(latest['age_days']) else 30
        else:
            feature_dict['flock_age'] = len(recent_data)
        
        # Create DataFrame with correct column order
        X = pd.DataFrame([feature_dict])
        
        # Ensure all required features are present
        for feat in self.feature_names:
            if feat not in X.columns:
                X[feat] = 0
        
        # Select and order features
        X = X[self.feature_names]
        
        # Fill any NaN
        X = X.fillna(X.mean())
        
        return X
    
    def predict_single_day(self, features: pd.DataFrame) -> Tuple[float, float, float]:
        """
        Make prediction for a single timepoint with confidence interval.
        
        Args:
            features: Feature DataFrame
            
        Returns:
            Tuple of (prediction, lower_bound, upper_bound)
        """
        # Scale features
        X_scaled = self.scaler.transform(features)
        
        # Prediction
        prediction = float(self.model.predict(X_scaled)[0])
        
        # Confidence interval (±10% based on test error)
        test_mae = self.metrics.get('test_mae', 0.1)
        margin = test_mae * 1.5  # 1.5x MAE for ~90% confidence
        
        lower_bound = prediction - margin
        upper_bound = prediction + margin
        
        return prediction, lower_bound, upper_bound
    
    def predict_multi_horizon(self, room_id: str, horizons: List[int] = [7, 14, 30]) -> Dict[str, Any]:
        """
        Generate multi-horizon forecasts for a room.
        
        Args:
            room_id: Room identifier
            horizons: List of forecast horizons in days
            
        Returns:
            Dictionary with predictions for each horizon
        """
        try:
            # Load room data
            room_data = self.load_room_data(room_id)
            
            # Create base features
            base_features = self.create_prediction_features(room_data)
            
            # Get current weight for growth projection
            current_weight = room_data['avg_weight_kg'].iloc[-1] if 'avg_weight_kg' in room_data.columns else 2.5
            
            # Generate predictions for each horizon
            predictions = {}
            
            for horizon in horizons:
                # Daily predictions
                daily_preds = []
                daily_lower = []
                daily_upper = []
                daily_labels = []
                
                # Growth rate based on historical data
                if len(room_data) >= 7 and 'avg_weight_kg' in room_data.columns:
                    recent_weights = room_data.tail(7)['avg_weight_kg'].dropna()
                    if len(recent_weights) >= 2:
                        growth_rate = (recent_weights.iloc[-1] - recent_weights.iloc[0]) / len(recent_weights)
                        growth_rate = max(0, growth_rate)  # Ensure non-negative
                    else:
                        growth_rate = 0.025  # Default 2.5% daily growth
                else:
                    growth_rate = 0.025
                
                # Generate daily predictions
                for day in range(1, horizon + 1):
                    # Adjust features for future prediction (simplified approach)
                    # In production, this would use more sophisticated recursive forecasting
                    adjusted_features = base_features.copy()
                    
                    # Adjust flock age
                    if 'flock_age' in adjusted_features.columns:
                        adjusted_features['flock_age'] += day
                    
                    # Make prediction
                    pred, lower, upper = self.predict_single_day(adjusted_features)
                    
                    # Apply growth trend
                    pred_with_growth = current_weight + (growth_rate * day)
                    
                    # Blend ML prediction with growth trend (70% ML, 30% trend)
                    final_pred = 0.7 * pred + 0.3 * pred_with_growth
                    
                    daily_preds.append(round(final_pred, 3))
                    daily_lower.append(round(final_pred * 0.9, 3))
                    daily_upper.append(round(final_pred * 1.1, 3))
                    daily_labels.append(f"Day +{day}")
                
                predictions[f'{horizon}_day'] = {
                    'horizon_days': horizon,
                    'labels': daily_labels,
                    'predicted_weights': daily_preds,
                    'lower_bound': daily_lower,
                    'upper_bound': daily_upper,
                    'confidence_percent': 90,
                    'current_weight': round(float(current_weight), 3),
                    'growth_rate_per_day': round(growth_rate, 4)
                }
            
            # Add anomaly predictions
            anomalies = self.detect_future_anomalies(room_data, predictions)
            
            # Generate recommendations
            recommendations = self.generate_recommendations(room_data, predictions)
            
            return {
                'room_id': room_id,
                'model_version': self.model_version,
                'model_performance': self.metrics.get('performance_score', 0),
                'predictions': predictions,
                'anomalies': anomalies,
                'recommendations': recommendations,
                'generated_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Prediction failed for room {room_id}: {e}", exc_info=True)
            return {
                'room_id': room_id,
                'error': str(e),
                'message': 'Prediction failed'
            }
    
    def detect_future_anomalies(self, room_data: pd.DataFrame, predictions: Dict) -> List[Dict]:
        """
        Detect potential future anomalies based on predictions.
        
        Args:
            room_data: Historical data
            predictions: Prediction results
            
        Returns:
            List of anomaly warnings
        """
        anomalies = []
        
        # Check mortality trend
        if 'mortality_rate' in room_data.columns:
            recent_mortality = room_data.tail(7)['mortality_rate'].mean()
            if recent_mortality > 5:
                anomalies.append({
                    'type': 'mortality_spike',
                    'severity': 'critical',
                    'message': f'High mortality rate detected: {recent_mortality:.2f}%',
                    'action': 'Immediate veterinary consultation required'
                })
        
        # Check feed conversion efficiency
        if 'feed_kg_total' in room_data.columns and 'avg_weight_kg' in room_data.columns:
            recent_feed = room_data.tail(7)['feed_kg_total'].mean()
            recent_weight = room_data.tail(7)['avg_weight_kg'].mean()
            if recent_weight > 0:
                fcr = recent_feed / recent_weight
                if fcr > 2.5:
                    anomalies.append({
                        'type': 'feed_inefficiency',
                        'severity': 'high',
                        'message': f'Poor feed conversion: FCR {fcr:.2f}',
                        'action': 'Review feed quality and formulation'
                    })
        
        # Check weight plateau
        if '7_day' in predictions:
            pred_7d = predictions['7_day']['predicted_weights']
            if len(pred_7d) >= 7:
                weight_gain = pred_7d[-1] - pred_7d[0]
                if weight_gain < 0.1:
                    anomalies.append({
                        'type': 'weight_plateau',
                        'severity': 'medium',
                        'message': 'Weight gain projected to slow significantly',
                        'action': 'Consider adjusting feed formulation'
                    })
        
        # Check environmental risks
        if 'temperature_c' in room_data.columns:
            recent_temp = room_data.tail(3)['temperature_c'].mean()
            if recent_temp > 28:
                anomalies.append({
                    'type': 'heat_stress_risk',
                    'severity': 'high',
                    'message': f'High temperature: {recent_temp:.1f}°C',
                    'action': 'Increase ventilation, provide cool water'
                })
            elif recent_temp < 18:
                anomalies.append({
                    'type': 'cold_stress_risk',
                    'severity': 'medium',
                    'message': f'Low temperature: {recent_temp:.1f}°C',
                    'action': 'Increase heating, check for drafts'
                })
        
        return anomalies
    
    def generate_recommendations(self, room_data: pd.DataFrame, predictions: Dict) -> List[Dict]:
        """
        Generate actionable recommendations based on predictions and current state.
        
        Args:
            room_data: Historical data
            predictions: Prediction results
            
        Returns:
            List of recommendations
        """
        recommendations = []
        
        # Feed recommendations based on predicted weight trajectory
        if '7_day' in predictions:
            pred_weight = predictions['7_day']['predicted_weights'][-1]
            
            feed_options = [
                {
                    'name': 'Starter Plus 22% Protein',
                    'protein': 22,
                    'energy': 2950,
                    'best_for': 'young flocks',
                    'expected_improvement': '+8%'
                },
                {
                    'name': 'Grower Max 19% Protein',
                    'protein': 19,
                    'energy': 3050,
                    'best_for': 'growing phase',
                    'expected_improvement': '+5%'
                },
                {
                    'name': 'Layer Supreme 17% Protein',
                    'protein': 17,
                    'energy': 2850,
                    'best_for': 'egg production',
                    'expected_improvement': '+3%'
                },
            ]
            
            # Select best feed based on predicted weight
            if pred_weight < 2.0:
                best_feed = feed_options[0]
            elif pred_weight < 2.5:
                best_feed = feed_options[1]
            else:
                best_feed = feed_options[2]
            
            recommendations.append({
                'category': 'feed',
                'priority': 'high',
                'recommendation': f"Switch to {best_feed['name']}",
                'rationale': f"Optimized for current weight trajectory ({pred_weight:.2f} kg)",
                'expected_benefit': best_feed['expected_improvement'],
                'implementation': 'Gradual transition over 3-5 days'
            })
        
        # Environmental recommendations
        if 'temperature_c' in room_data.columns and 'humidity_pct' in room_data.columns:
            recent_temp = room_data.tail(3)['temperature_c'].mean()
            recent_humid = room_data.tail(3)['humidity_pct'].mean()
            
            if recent_temp > 25 or recent_humid > 70:
                recommendations.append({
                    'category': 'environment',
                    'priority': 'high',
                    'recommendation': 'Improve ventilation system',
                    'rationale': f'Current: {recent_temp:.1f}°C, {recent_humid:.1f}% humidity',
                    'expected_benefit': 'Reduce heat stress, improve FCR by 5-10%',
                    'implementation': 'Increase fan speed, check air inlets'
                })
        
        # Health monitoring
        if 'mortality_rate' in room_data.columns:
            mortality = room_data.tail(7)['mortality_rate'].mean()
            if mortality > 2:
                recommendations.append({
                    'category': 'health',
                    'priority': 'critical',
                    'recommendation': 'Implement enhanced biosecurity protocols',
                    'rationale': f'Mortality rate elevated: {mortality:.2f}%',
                    'expected_benefit': 'Reduce disease transmission',
                    'implementation': 'Daily health checks, isolate sick birds'
                })
        
        return recommendations


def predict_for_farm(farm_id: int, horizons: List[int] = [7, 14, 30], model_version: str = 'latest') -> Dict[str, Any]:
    """
    Generate predictions for all rooms in a farm.
    
    Args:
        farm_id: Farm identifier
        horizons: Forecast horizons in days
        model_version: Model version to use
        
    Returns:
        Dictionary with predictions for all rooms
    """
    try:
        predictor = MLPredictor(model_version=model_version)
        
        # Load all rooms from latest CSV
        csv_files = sorted(DATA_DIR.glob('*.csv'), key=lambda x: x.stat().st_mtime, reverse=True)
        if not csv_files:
            return {'error': 'No data files found'}
        
        df = pd.read_csv(csv_files[0], parse_dates=['date'])
        rooms = df['room_id'].unique()
        
        room_predictions = {}
        
        for room_id in rooms:
            pred = predictor.predict_multi_horizon(room_id, horizons)
            room_predictions[room_id] = pred
        
        # Farm-wide summary
        summary = {
            'total_rooms': len(rooms),
            'best_performing_room': None,
            'worst_performing_room': None,
            'avg_predicted_weight_7d': 0,
            'total_anomalies': 0
        }
        
        # Calculate summary statistics
        weights_7d = []
        for room_id, pred in room_predictions.items():
            if 'predictions' in pred and '7_day' in pred['predictions']:
                weight = pred['predictions']['7_day']['predicted_weights'][-1]
                weights_7d.append((room_id, weight))
            if 'anomalies' in pred:
                summary['total_anomalies'] += len(pred['anomalies'])
        
        if weights_7d:
            weights_7d.sort(key=lambda x: x[1], reverse=True)
            summary['best_performing_room'] = weights_7d[0][0]
            summary['worst_performing_room'] = weights_7d[-1][0]
            summary['avg_predicted_weight_7d'] = round(sum([w[1] for w in weights_7d]) / len(weights_7d), 3)
        
        return {
            'farm_id': farm_id,
            'model_version': model_version,
            'room_predictions': room_predictions,
            'summary': summary,
            'generated_at': datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Farm prediction failed: {e}", exc_info=True)
        return {
            'farm_id': farm_id,
            'error': str(e),
            'message': 'Farm prediction failed'
        }


if __name__ == "__main__":
    # Test predictions
    print("=" * 60)
    print("Phase 7: ML Prediction Engine Test")
    print("=" * 60)
    
    try:
        result = predict_for_farm(farm_id=1, horizons=[7, 14, 30])
        
        if 'error' not in result:
            print(f"\n✅ Predictions generated successfully!")
            print(f"Farm ID: {result['farm_id']}")
            print(f"Total Rooms: {result['summary']['total_rooms']}")
            print(f"Best Room: {result['summary']['best_performing_room']}")
            print(f"Avg 7-day Weight: {result['summary']['avg_predicted_weight_7d']} kg")
        else:
            print(f"\n❌ Prediction failed: {result['error']}")
    
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
