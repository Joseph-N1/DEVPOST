"""Advanced analytics service for farm monitoring data."""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


class TrendAnalyzer:
    """Analyzes trends in metric data over time."""
    
    def __init__(self):
        """Initialize trend analyzer."""
        self.trends = {}
    
    def calculate_trend(self, values: np.ndarray, timestamps: List[datetime]) -> Dict[str, Any]:
        """
        Calculate linear trend for metric values.
        
        Args:
            values: Array of metric values
            timestamps: List of datetime objects
        
        Returns:
            {
                'slope': float (change per day),
                'direction': 'increasing'|'decreasing'|'stable',
                'r_squared': float (fit quality 0-1),
                'velocity': float (rate of change),
                'acceleration': float (change in rate)
            }
        """
        try:
            if len(values) < 2:
                return {'slope': 0.0, 'direction': 'stable', 'r_squared': 0.0}
            
            # Convert timestamps to days since first
            days = np.array([(t - timestamps[0]).days for t in timestamps])
            
            # Linear regression: y = mx + b
            coeffs = np.polyfit(days, values, 1)
            slope = coeffs[0]
            
            # Calculate R²
            poly = np.poly1d(coeffs)
            y_pred = poly(days)
            ss_res = np.sum((values - y_pred) ** 2)
            ss_tot = np.sum((values - np.mean(values)) ** 2)
            r_squared = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0.0
            
            # Determine direction
            if abs(slope) < 0.01:
                direction = 'stable'
            elif slope > 0:
                direction = 'increasing'
            else:
                direction = 'decreasing'
            
            # Calculate velocity (change per measurement)
            if len(values) > 1:
                velocity = np.mean(np.abs(np.diff(values)))
            else:
                velocity = 0.0
            
            # Calculate acceleration (change in velocity)
            if len(values) > 2:
                diffs = np.diff(values)
                acceleration = np.mean(np.abs(np.diff(diffs)))
            else:
                acceleration = 0.0
            
            return {
                'slope': float(slope),
                'direction': direction,
                'r_squared': float(r_squared),
                'velocity': float(velocity),
                'acceleration': float(acceleration)
            }
        except Exception as e:
            logger.error(f"Error calculating trend: {e}")
            return {'slope': 0.0, 'direction': 'stable', 'r_squared': 0.0}
    
    def get_metric_trends(self, metrics_df: pd.DataFrame, metric_names: List[str]) -> Dict[str, Dict]:
        """
        Get trends for multiple metrics.
        
        Args:
            metrics_df: DataFrame with metric_name, metric_value, recorded_date
            metric_names: List of metric names to analyze
        
        Returns:
            {metric_name: trend_info, ...}
        """
        trends = {}
        for metric_name in metric_names:
            metric_data = metrics_df[metrics_df['metric_name'] == metric_name]
            if len(metric_data) > 1:
                values = metric_data['metric_value'].values
                timestamps = metric_data['recorded_date'].tolist()
                trends[metric_name] = self.calculate_trend(values, timestamps)
            else:
                trends[metric_name] = {'slope': 0.0, 'direction': 'stable', 'r_squared': 0.0}
        
        return trends


class AnomalyStatisticsCalculator:
    """Calculates statistics about detected anomalies."""
    
    def __init__(self):
        """Initialize calculator."""
        self.stats = {}
    
    def calculate_anomaly_stats(self, anomalies: List[Dict]) -> Dict[str, Any]:
        """
        Calculate statistics about anomalies.
        
        Args:
            anomalies: List of anomaly dictionaries
        
        Returns:
            {
                'total_count': int,
                'by_severity': {low: count, medium: count, high: count},
                'by_type': {type: count, ...},
                'average_score': float,
                'max_score': float,
                'min_score': float,
                'frequency': str ('high'|'medium'|'low'),
                'top_metric': str,
                'top_metric_count': int
            }
        """
        try:
            if not anomalies:
                return {
                    'total_count': 0,
                    'by_severity': {'low': 0, 'medium': 0, 'high': 0},
                    'by_type': {},
                    'average_score': 0.0,
                    'frequency': 'low'
                }
            
            df = pd.DataFrame(anomalies)
            
            # Count by severity
            severity_counts = df['severity'].value_counts().to_dict()
            by_severity = {
                'low': severity_counts.get('low', 0),
                'medium': severity_counts.get('medium', 0),
                'high': severity_counts.get('high', 0)
            }
            
            # Count by type
            by_type = df['anomaly_type'].value_counts().to_dict()
            
            # Score statistics
            scores = df['anomaly_score'].astype(float).values
            avg_score = float(np.mean(scores))
            max_score = float(np.max(scores))
            min_score = float(np.min(scores))
            
            # Frequency determination (based on count per day)
            days_span = (df['anomaly_date'].max() - df['anomaly_date'].min()).days + 1
            frequency_per_day = len(anomalies) / max(days_span, 1)
            
            if frequency_per_day > 2:
                frequency = 'high'
            elif frequency_per_day > 0.5:
                frequency = 'medium'
            else:
                frequency = 'low'
            
            # Top metric with most anomalies
            metric_counts = df['metric_name'].value_counts()
            top_metric = metric_counts.index[0] if len(metric_counts) > 0 else 'unknown'
            top_metric_count = int(metric_counts.iloc[0]) if len(metric_counts) > 0 else 0
            
            return {
                'total_count': len(anomalies),
                'by_severity': by_severity,
                'by_type': by_type,
                'average_score': avg_score,
                'max_score': max_score,
                'min_score': min_score,
                'frequency': frequency,
                'top_metric': top_metric,
                'top_metric_count': top_metric_count
            }
        except Exception as e:
            logger.error(f"Error calculating anomaly stats: {e}")
            return {'total_count': 0, 'frequency': 'low'}
    
    def get_severity_distribution(self, anomalies: List[Dict]) -> Dict[str, int]:
        """Get distribution of anomalies by severity."""
        if not anomalies:
            return {'low': 0, 'medium': 0, 'high': 0}
        
        df = pd.DataFrame(anomalies)
        counts = df['severity'].value_counts().to_dict()
        
        return {
            'low': counts.get('low', 0),
            'medium': counts.get('medium', 0),
            'high': counts.get('high', 0)
        }


class PerformanceMetricsCalculator:
    """Calculates performance metrics for models and predictions."""
    
    def __init__(self):
        """Initialize calculator."""
        self.metrics = {}
    
    def calculate_prediction_accuracy(self, predictions: List[Dict]) -> Dict[str, float]:
        """
        Calculate prediction accuracy metrics.
        
        Args:
            predictions: List of prediction dictionaries with actual/predicted values
        
        Returns:
            {
                'mae': float (mean absolute error),
                'rmse': float (root mean squared error),
                'mape': float (mean absolute percentage error),
                'r_squared': float (coefficient of determination)
            }
        """
        try:
            if not predictions or len(predictions) < 2:
                return {'mae': 0.0, 'rmse': 0.0, 'mape': 0.0, 'r_squared': 0.0}
            
            df = pd.DataFrame(predictions)
            
            # Ensure we have actual and predicted columns
            if 'actual' not in df.columns or 'predicted' not in df.columns:
                return {'mae': 0.0, 'rmse': 0.0, 'mape': 0.0, 'r_squared': 0.0}
            
            actual = df['actual'].astype(float).values
            predicted = df['predicted'].astype(float).values
            
            # MAE
            mae = float(np.mean(np.abs(actual - predicted)))
            
            # RMSE
            rmse = float(np.sqrt(np.mean((actual - predicted) ** 2)))
            
            # MAPE (avoid division by zero)
            non_zero_actual = actual[actual != 0]
            if len(non_zero_actual) > 0:
                mape = float(np.mean(np.abs((actual[actual != 0] - predicted[actual != 0]) / actual[actual != 0])) * 100)
            else:
                mape = 0.0
            
            # R²
            ss_res = np.sum((actual - predicted) ** 2)
            ss_tot = np.sum((actual - np.mean(actual)) ** 2)
            r_squared = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0.0
            
            return {
                'mae': mae,
                'rmse': rmse,
                'mape': mape,
                'r_squared': float(r_squared)
            }
        except Exception as e:
            logger.error(f"Error calculating prediction accuracy: {e}")
            return {'mae': 0.0, 'rmse': 0.0, 'mape': 0.0, 'r_squared': 0.0}
    
    def get_system_performance(self, metrics: List[Dict]) -> Dict[str, float]:
        """
        Get system-wide performance metrics.
        
        Args:
            metrics: List of performance metric dictionaries
        
        Returns:
            {
                'avg_latency_ms': float,
                'p95_latency_ms': float,
                'p99_latency_ms': float,
                'success_rate': float (0-100),
                'throughput': float (requests per minute)
            }
        """
        try:
            if not metrics:
                return {
                    'avg_latency_ms': 0.0,
                    'p95_latency_ms': 0.0,
                    'p99_latency_ms': 0.0,
                    'success_rate': 0.0
                }
            
            df = pd.DataFrame(metrics)
            
            # Latency percentiles (in milliseconds)
            if 'latency_ms' in df.columns:
                latencies = df['latency_ms'].astype(float).values
                avg_latency = float(np.mean(latencies))
                p95_latency = float(np.percentile(latencies, 95))
                p99_latency = float(np.percentile(latencies, 99))
            else:
                avg_latency = p95_latency = p99_latency = 0.0
            
            # Success rate
            if 'success' in df.columns:
                success_rate = float((df['success'].astype(bool).sum() / len(df)) * 100)
            else:
                success_rate = 0.0
            
            return {
                'avg_latency_ms': avg_latency,
                'p95_latency_ms': p95_latency,
                'p99_latency_ms': p99_latency,
                'success_rate': success_rate
            }
        except Exception as e:
            logger.error(f"Error calculating system performance: {e}")
            return {'avg_latency_ms': 0.0, 'p95_latency_ms': 0.0, 'success_rate': 0.0}


class CorrelationAnalyzer:
    """Analyzes correlations between metrics."""
    
    def __init__(self):
        """Initialize analyzer."""
        self.correlations = {}
    
    def calculate_correlations(self, metrics_df: pd.DataFrame, metric_names: List[str]) -> Dict[str, Dict]:
        """
        Calculate correlations between metrics.
        
        Args:
            metrics_df: DataFrame with metric data (metric_name, metric_value, room_id, recorded_date)
            metric_names: List of metric names to correlate
        
        Returns:
            {
                'matrix': {metric1: {metric2: correlation, ...}, ...},
                'pairs': [{'metric1': str, 'metric2': str, 'correlation': float}, ...]
            }
        """
        try:
            if len(metric_names) < 2:
                return {'matrix': {}, 'pairs': []}
            
            # Pivot data to get metrics as columns
            pivot_data = metrics_df.pivot_table(
                index='recorded_date',
                columns='metric_name',
                values='metric_value',
                aggfunc='mean'
            )
            
            # Calculate correlation matrix
            corr_matrix = pivot_data.corr()
            
            # Convert to dictionary
            matrix_dict = {}
            for col in corr_matrix.columns:
                matrix_dict[col] = corr_matrix[col].to_dict()
            
            # Extract significant pairs (|correlation| > 0.5)
            pairs = []
            for i, metric1 in enumerate(metric_names):
                for metric2 in metric_names[i+1:]:
                    if metric1 in corr_matrix.columns and metric2 in corr_matrix.columns:
                        corr = float(corr_matrix.loc[metric1, metric2])
                        if abs(corr) > 0.5:  # Only strong correlations
                            pairs.append({
                                'metric1': metric1,
                                'metric2': metric2,
                                'correlation': corr
                            })
            
            # Sort by absolute correlation
            pairs = sorted(pairs, key=lambda x: abs(x['correlation']), reverse=True)
            
            return {
                'matrix': matrix_dict,
                'pairs': pairs
            }
        except Exception as e:
            logger.error(f"Error calculating correlations: {e}")
            return {'matrix': {}, 'pairs': []}


class TimeSeriesForecast:
    """Generates simple forecasts for metric values."""
    
    def __init__(self):
        """Initialize forecaster."""
        self.forecasts = {}
    
    def forecast_metric(self, values: np.ndarray, periods: int = 7) -> Dict[str, Any]:
        """
        Generate simple forecast using exponential smoothing.
        
        Args:
            values: Historical metric values
            periods: Number of periods to forecast
        
        Returns:
            {
                'forecast': [value1, value2, ...],
                'confidence_interval': {lower: [...], upper: [...]},
                'method': 'exponential_smoothing',
                'accuracy': float (0-1)
            }
        """
        try:
            if len(values) < 3:
                return {
                    'forecast': [float(values[-1])] * periods,
                    'confidence_interval': {'lower': [], 'upper': []},
                    'method': 'last_value'
                }
            
            # Simple exponential smoothing
            alpha = 0.3
            smoothed = [values[0]]
            
            for i in range(1, len(values)):
                smoothed.append(alpha * values[i] + (1 - alpha) * smoothed[-1])
            
            # Generate forecast
            forecast = []
            last_smoothed = smoothed[-1]
            trend = smoothed[-1] - smoothed[-2] if len(smoothed) > 1 else 0
            
            for _ in range(periods):
                forecast.append(last_smoothed + trend)
                last_smoothed = forecast[-1]
            
            # Calculate confidence interval (±1 std dev)
            residuals = values - np.array(smoothed[:len(values)])
            std_error = np.std(residuals)
            
            confidence_lower = [f - 1.96 * std_error for f in forecast]
            confidence_upper = [f + 1.96 * std_error for f in forecast]
            
            return {
                'forecast': [float(f) for f in forecast],
                'confidence_interval': {
                    'lower': [float(l) for l in confidence_lower],
                    'upper': [float(u) for u in confidence_upper]
                },
                'method': 'exponential_smoothing'
            }
        except Exception as e:
            logger.error(f"Error generating forecast: {e}")
            return {
                'forecast': [],
                'confidence_interval': {'lower': [], 'upper': []},
                'error': str(e)
            }


class ReportGenerator:
    """Generates comprehensive analytics reports."""
    
    def __init__(self):
        """Initialize generator."""
        self.reports = {}
    
    def generate_summary_report(
        self,
        farm_id: int,
        room_id: Optional[int] = None,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Generate comprehensive summary report.
        
        Args:
            farm_id: Farm ID
            room_id: Optional room ID for room-specific report
            days: Number of days to analyze
        
        Returns:
            {
                'title': str,
                'period': {'start': datetime, 'end': datetime, 'days': int},
                'summary': {key: value},
                'generated_at': datetime,
                'format': 'json'
            }
        """
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        scope = f"Room {room_id}" if room_id else f"Farm {farm_id}"
        
        return {
            'title': f'Analytics Report - {scope}',
            'period': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat(),
                'days': days
            },
            'summary': {
                'farm_id': farm_id,
                'room_id': room_id,
                'metrics_analyzed': 0,
                'anomalies_detected': 0,
                'correlations_found': 0
            },
            'generated_at': datetime.utcnow().isoformat(),
            'format': 'json'
        }
    
    def export_to_csv(self, data: List[Dict], filename: str) -> bytes:
        """
        Export data to CSV format.
        
        Args:
            data: List of dictionaries to export
            filename: Output filename
        
        Returns:
            CSV file content as bytes
        """
        try:
            df = pd.DataFrame(data)
            return df.to_csv(index=False).encode('utf-8')
        except Exception as e:
            logger.error(f"Error exporting to CSV: {e}")
            return b''
    
    def export_to_json(self, data: Any) -> str:
        """
        Export data to JSON format.
        
        Args:
            data: Data to export
        
        Returns:
            JSON string
        """
        import json
        try:
            return json.dumps(data, default=str, indent=2)
        except Exception as e:
            logger.error(f"Error exporting to JSON: {e}")
            return '{}'
