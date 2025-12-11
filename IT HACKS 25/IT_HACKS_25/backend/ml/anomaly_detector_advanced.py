"""
Advanced Anomaly Detection Engine

Implements multiple anomaly detection algorithms:
- Isolation Forest (multivariate anomalies)
- Local Outlier Factor (density-based contextual anomalies)
- Statistical Methods (Z-score, IQR-based univariate)
- Time Series Methods (ARIMA residuals, trend breaks)

Each detector returns anomaly scores in [0, 1] range for easy combination.
"""

from typing import List, Dict, Tuple, Optional
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
import logging
from datetime import datetime
import pandas as pd

logger = logging.getLogger(__name__)


class IsolationForestDetector:
    """
    Multivariate anomaly detection using Isolation Forest.
    
    Detects observations that are isolated by random partitioning.
    Effective for detecting global outliers in multivariate data.
    """
    
    def __init__(self, contamination: float = 0.1, random_state: int = 42):
        """
        Initialize Isolation Forest detector.
        
        Args:
            contamination: Expected proportion of anomalies (0.01-0.5)
            random_state: Random seed for reproducibility
        """
        self.contamination = min(max(contamination, 0.01), 0.5)
        self.model = IsolationForest(
            contamination=self.contamination,
            random_state=random_state,
            n_estimators=100
        )
        self.trained = False
        self.training_data_mean = None
        self.training_data_std = None
    
    def fit(self, data: np.ndarray) -> None:
        """
        Fit the Isolation Forest model.
        
        Args:
            data: Training data (n_samples, n_features)
        """
        try:
            if len(data) < 10:
                logger.warning("Training data too small for Isolation Forest")
                return
            
            self.model.fit(data)
            self.training_data_mean = np.mean(data, axis=0)
            self.training_data_std = np.std(data, axis=0)
            self.trained = True
            logger.info(f"Isolation Forest trained on {len(data)} samples with {data.shape[1]} features")
        except Exception as e:
            logger.error(f"Error training Isolation Forest: {e}")
    
    def predict(self, data: np.ndarray) -> np.ndarray:
        """
        Predict anomalies (-1 for anomaly, 1 for normal).
        
        Args:
            data: Test data (n_samples, n_features)
        
        Returns:
            Array of -1 (anomaly) or 1 (normal)
        """
        if not self.trained:
            return np.ones(len(data), dtype=int)
        
        try:
            return self.model.predict(data)
        except Exception as e:
            logger.error(f"Error predicting with Isolation Forest: {e}")
            return np.ones(len(data), dtype=int)
    
    def anomaly_score(self, data: np.ndarray) -> np.ndarray:
        """
        Get anomaly scores in [0, 1] range.
        
        Args:
            data: Test data (n_samples, n_features)
        
        Returns:
            Scores between 0 (normal) and 1 (anomaly)
        """
        if not self.trained:
            return np.zeros(len(data))
        
        try:
            # Get raw anomaly scores (higher = more anomalous)
            raw_scores = self.model.score_samples(data)
            
            # Normalize to [0, 1]
            min_score = np.min(raw_scores)
            max_score = np.max(raw_scores)
            
            if max_score == min_score:
                return np.zeros(len(data))
            
            normalized = (raw_scores - min_score) / (max_score - min_score)
            return normalized
        except Exception as e:
            logger.error(f"Error calculating anomaly scores: {e}")
            return np.zeros(len(data))
    
    def explain_anomaly(self, sample: np.ndarray, feature_names: Optional[List[str]] = None) -> Dict:
        """
        Explain why a sample is considered anomalous.
        
        Args:
            sample: Single sample (1, n_features)
            feature_names: Optional feature names
        
        Returns:
            Dictionary with explanation
        """
        if not self.trained:
            return {"explanation": "Model not trained"}
        
        try:
            score = self.anomaly_score(sample.reshape(1, -1))[0]
            
            if self.training_data_std is not None:
                # Calculate how far from training data
                distances = np.abs((sample - self.training_data_mean) / (self.training_data_std + 1e-8))
                
                most_anomalous_idx = np.argmax(distances)
                most_anomalous_distance = distances[most_anomalous_idx]
                
                feature_name = feature_names[most_anomalous_idx] if feature_names else f"Feature {most_anomalous_idx}"
                
                return {
                    "anomaly_score": float(score),
                    "most_anomalous_feature": feature_name,
                    "feature_distance_std": float(most_anomalous_distance),
                    "explanation": f"Sample is {most_anomalous_distance:.2f} std deviations from mean on {feature_name}"
                }
            
            return {"anomaly_score": float(score), "explanation": "Isolated by tree partitioning"}
        except Exception as e:
            logger.error(f"Error explaining anomaly: {e}")
            return {"error": str(e)}


class LocalOutlierFactorDetector:
    """
    Density-based anomaly detection using Local Outlier Factor.
    
    Detects contextual anomalies by comparing local density to neighbors.
    Effective for detecting anomalies in clusters of varying density.
    """
    
    def __init__(self, n_neighbors: int = 20):
        """
        Initialize LOF detector.
        
        Args:
            n_neighbors: Number of neighbors for density estimation
        """
        self.n_neighbors = max(n_neighbors, 5)
        self.model = LocalOutlierFactor(
            n_neighbors=self.n_neighbors,
            novelty=False  # Will use fit_predict
        )
        self.trained = False
        self.training_data = None
    
    def fit(self, data: np.ndarray) -> None:
        """
        Fit the LOF model.
        
        Args:
            data: Training data (n_samples, n_features)
        """
        try:
            if len(data) < self.n_neighbors + 1:
                logger.warning(f"Training data too small for LOF (need >{self.n_neighbors})")
                return
            
            # LOF doesn't have explicit fit, but we store for reference
            self.training_data = data.copy()
            self.trained = True
            logger.info(f"LOF ready for {len(data)} samples with {data.shape[1]} features")
        except Exception as e:
            logger.error(f"Error training LOF: {e}")
    
    def predict(self, data: np.ndarray) -> np.ndarray:
        """
        Predict anomalies using LOF on training data + new data.
        
        Args:
            data: Test data (n_samples, n_features)
        
        Returns:
            Array of -1 (anomaly) or 1 (normal)
        """
        if not self.trained or self.training_data is None:
            return np.ones(len(data), dtype=int)
        
        try:
            # Combine training and test data
            combined = np.vstack([self.training_data, data])
            
            # Fit LOF on combined data
            lof = LocalOutlierFactor(n_neighbors=self.n_neighbors, novelty=False)
            predictions = lof.fit_predict(combined)
            
            # Return only test data predictions
            return predictions[len(self.training_data):]
        except Exception as e:
            logger.error(f"Error predicting with LOF: {e}")
            return np.ones(len(data), dtype=int)
    
    def anomaly_score(self, data: np.ndarray) -> np.ndarray:
        """
        Get anomaly scores in [0, 1] range.
        
        Args:
            data: Test data (n_samples, n_features)
        
        Returns:
            Scores between 0 (normal) and 1 (anomaly)
        """
        if not self.trained or self.training_data is None:
            return np.zeros(len(data))
        
        try:
            combined = np.vstack([self.training_data, data])
            
            # Fit LOF
            lof = LocalOutlierFactor(n_neighbors=self.n_neighbors, novelty=False)
            lof.fit(combined)
            
            # Get negative outlier factors (negative LOF values)
            negative_outlier_factor = -lof.negative_outlier_factor_
            
            # Get only test data scores
            test_scores = negative_outlier_factor[len(self.training_data):]
            
            # Normalize to [0, 1]
            min_score = np.min(test_scores)
            max_score = np.max(test_scores)
            
            if max_score == min_score:
                return np.zeros(len(data))
            
            normalized = (test_scores - min_score) / (max_score - min_score)
            return normalized
        except Exception as e:
            logger.error(f"Error calculating LOF scores: {e}")
            return np.zeros(len(data))


class StatisticalAnomalyDetector:
    """
    Univariate statistical anomaly detection.
    
    Methods:
    - Z-score: |z| > 3 standard deviations
    - IQR: Values beyond Q1 - 1.5*IQR or Q3 + 1.5*IQR
    """
    
    def __init__(self):
        """Initialize statistical detector."""
        self.means = None
        self.stds = None
        self.q1s = None
        self.q3s = None
        self.iqrs = None
        self.trained = False
    
    def fit(self, data: np.ndarray) -> None:
        """
        Fit statistical parameters.
        
        Args:
            data: Training data (n_samples, n_features)
        """
        try:
            self.means = np.mean(data, axis=0)
            self.stds = np.std(data, axis=0)
            
            self.q1s = np.percentile(data, 25, axis=0)
            self.q3s = np.percentile(data, 75, axis=0)
            self.iqrs = self.q3s - self.q1s
            
            self.trained = True
            logger.info(f"Statistical detector trained on {len(data)} samples")
        except Exception as e:
            logger.error(f"Error training statistical detector: {e}")
    
    def detect_by_zscore(self, data: np.ndarray, threshold: float = 3.0) -> List[int]:
        """
        Detect anomalies using Z-score method.
        
        Args:
            data: Test data (n_samples, n_features)
            threshold: Z-score threshold (default 3.0 = 0.3% of data)
        
        Returns:
            Indices of anomalous samples
        """
        if not self.trained:
            return []
        
        try:
            z_scores = np.abs((data - self.means) / (self.stds + 1e-8))
            # Sample is anomalous if ANY feature exceeds threshold
            anomalies = np.where(np.any(z_scores > threshold, axis=1))[0]
            return list(anomalies)
        except Exception as e:
            logger.error(f"Error detecting Z-score anomalies: {e}")
            return []
    
    def detect_by_iqr(self, data: np.ndarray, multiplier: float = 1.5) -> List[int]:
        """
        Detect anomalies using Interquartile Range method.
        
        Args:
            data: Test data (n_samples, n_features)
            multiplier: IQR multiplier (default 1.5 = Tukey's fences)
        
        Returns:
            Indices of anomalous samples
        """
        if not self.trained:
            return []
        
        try:
            lower_bounds = self.q1s - multiplier * self.iqrs
            upper_bounds = self.q3s + multiplier * self.iqrs
            
            # Sample is anomalous if ANY feature is outside bounds
            outside = np.any((data < lower_bounds) | (data > upper_bounds), axis=1)
            anomalies = np.where(outside)[0]
            return list(anomalies)
        except Exception as e:
            logger.error(f"Error detecting IQR anomalies: {e}")
            return []
    
    def get_statistics(self) -> Dict:
        """
        Get fitted statistics.
        
        Returns:
            Dictionary with mean, std, Q1, Q3, IQR
        """
        if not self.trained:
            return {}
        
        return {
            "means": self.means.tolist() if self.means is not None else [],
            "stds": self.stds.tolist() if self.stds is not None else [],
            "q1s": self.q1s.tolist() if self.q1s is not None else [],
            "q3s": self.q3s.tolist() if self.q3s is not None else [],
            "iqrs": self.iqrs.tolist() if self.iqrs is not None else []
        }


class TimeSeriesAnomalyDetector:
    """
    Time-series specific anomaly detection.
    
    Methods:
    - Trend breaks: Significant changes in trajectory
    - Velocity changes: Sudden acceleration/deceleration
    - Seasonal anomalies: Deviations from expected seasonal pattern
    - ARIMA residuals: Unexpected values given history
    """
    
    def __init__(self, window_size: int = 7):
        """
        Initialize time-series detector.
        
        Args:
            window_size: Window for trend calculation (days)
        """
        self.window_size = window_size
        self.fitted_params = None
    
    def fit(self, time_series: np.ndarray) -> None:
        """
        Fit time-series parameters.
        
        Args:
            time_series: 1D time series array
        """
        try:
            if len(time_series) < self.window_size + 1:
                logger.warning("Time series too short for fitting")
                return
            
            # Calculate moving average and std
            ma = pd.Series(time_series).rolling(window=self.window_size, min_periods=1).mean()
            std = pd.Series(time_series).rolling(window=self.window_size, min_periods=1).std()
            
            self.fitted_params = {
                "ma": ma.values,
                "std": std.values,
                "mean": np.mean(time_series),
                "overall_std": np.std(time_series)
            }
            logger.info(f"Time-series detector fitted on {len(time_series)} points")
        except Exception as e:
            logger.error(f"Error fitting time-series detector: {e}")
    
    def detect_trend_breaks(self, time_series: np.ndarray, threshold: float = 2.0) -> List[int]:
        """
        Detect significant changes in trend.
        
        Args:
            time_series: 1D time series array
            threshold: Std deviations for trend change detection
        
        Returns:
            Indices where trend breaks occur
        """
        if len(time_series) < 3:
            return []
        
        try:
            # Calculate velocity (first difference)
            velocity = np.diff(time_series)
            
            # Calculate acceleration (second difference)
            acceleration = np.diff(velocity)
            
            # Detect large accelerations
            if len(acceleration) > 0:
                acc_mean = np.mean(acceleration)
                acc_std = np.std(acceleration)
                
                if acc_std > 0:
                    z_scores = np.abs((acceleration - acc_mean) / acc_std)
                    anomalies = np.where(z_scores > threshold)[0] + 2  # +2 because diff reduces length twice
                    return list(anomalies)
            
            return []
        except Exception as e:
            logger.error(f"Error detecting trend breaks: {e}")
            return []
    
    def detect_velocity_changes(self, time_series: np.ndarray, threshold: float = 2.0) -> List[int]:
        """
        Detect sudden velocity changes (acceleration/deceleration).
        
        Args:
            time_series: 1D time series array
            threshold: Std deviations for velocity change detection
        
        Returns:
            Indices where velocity changes occur
        """
        if len(time_series) < 2:
            return []
        
        try:
            # Calculate velocity
            velocity = np.diff(time_series)
            
            # Detect outliers in velocity
            vel_mean = np.mean(velocity)
            vel_std = np.std(velocity)
            
            if vel_std > 0:
                z_scores = np.abs((velocity - vel_mean) / vel_std)
                anomalies = np.where(z_scores > threshold)[0] + 1  # +1 because diff reduces length
                return list(anomalies)
            
            return []
        except Exception as e:
            logger.error(f"Error detecting velocity changes: {e}")
            return []
    
    def detect_seasonal_anomalies(self, time_series: np.ndarray, season_length: int = 7) -> List[int]:
        """
        Detect seasonal anomalies (e.g., weekly patterns).
        
        Args:
            time_series: 1D time series array
            season_length: Length of seasonal cycle (7 for daily data)
        
        Returns:
            Indices of seasonal anomalies
        """
        if len(time_series) < season_length * 2:
            return []
        
        try:
            anomalies = []
            
            for i in range(season_length, len(time_series)):
                # Compare with same position in previous season
                previous_idx = i - season_length
                
                # Expected value is the seasonal counterpart
                expected = time_series[previous_idx]
                actual = time_series[i]
                
                # Calculate deviation
                seasonal_std = np.std(time_series)
                if seasonal_std > 0:
                    deviation = np.abs(actual - expected) / seasonal_std
                    
                    if deviation > 2.0:  # 2 standard deviations
                        anomalies.append(i)
            
            return anomalies
        except Exception as e:
            logger.error(f"Error detecting seasonal anomalies: {e}")
            return []
    
    def get_arima_residuals(self, time_series: np.ndarray, order: Tuple = (1, 0, 1)) -> np.ndarray:
        """
        Get ARIMA residuals for anomaly detection.
        
        Args:
            time_series: 1D time series array
            order: ARIMA order (p, d, q)
        
        Returns:
            Residuals (differences from predicted values)
        """
        try:
            # Simple AR model: next value = mean + previous value - mean
            # This approximates ARIMA(1,0,0) behavior
            
            if len(time_series) < 2:
                return np.array([])
            
            series_mean = np.mean(time_series)
            
            # Predict using previous value
            residuals = np.zeros(len(time_series) - 1)
            for i in range(1, len(time_series)):
                predicted = series_mean + 0.8 * (time_series[i-1] - series_mean)
                residuals[i-1] = time_series[i] - predicted
            
            return residuals
        except Exception as e:
            logger.error(f"Error calculating ARIMA residuals: {e}")
            return np.array([])


class AnomalyEnsemble:
    """
    Combines multiple anomaly detection methods for robust detection.
    """
    
    def __init__(self):
        """Initialize ensemble of detectors."""
        self.isolation_forest = IsolationForestDetector()
        self.lof = LocalOutlierFactorDetector()
        self.statistical = StatisticalAnomalyDetector()
        self.timeseries = TimeSeriesAnomalyDetector()
    
    def fit(self, data: np.ndarray, time_series_col: Optional[int] = None) -> None:
        """
        Fit all detectors.
        
        Args:
            data: Training data (n_samples, n_features)
            time_series_col: Optional column index for time series data
        """
        self.isolation_forest.fit(data)
        self.lof.fit(data)
        self.statistical.fit(data)
        
        if time_series_col is not None and time_series_col < data.shape[1]:
            self.timeseries.fit(data[:, time_series_col])
    
    def detect(self, data: np.ndarray, weights: Optional[Dict[str, float]] = None) -> np.ndarray:
        """
        Detect anomalies using weighted ensemble.
        
        Args:
            data: Test data (n_samples, n_features)
            weights: Weights for each detector {iso_forest, lof, statistical, timeseries}
        
        Returns:
            Anomaly scores [0, 1] for each sample
        """
        if weights is None:
            weights = {
                "iso_forest": 0.3,
                "lof": 0.3,
                "statistical": 0.2,
                "timeseries": 0.2
            }
        
        scores = np.zeros(len(data))
        
        # Isolation Forest scores
        if weights.get("iso_forest", 0) > 0:
            iso_scores = self.isolation_forest.anomaly_score(data)
            scores += weights["iso_forest"] * iso_scores
        
        # LOF scores
        if weights.get("lof", 0) > 0:
            lof_scores = self.lof.anomaly_score(data)
            scores += weights["lof"] * lof_scores
        
        # Statistical scores
        if weights.get("statistical", 0) > 0:
            stat_anomalies = set(self.statistical.detect_by_zscore(data))
            stat_scores = np.array([1.0 if i in stat_anomalies else 0.0 for i in range(len(data))])
            scores += weights["statistical"] * stat_scores
        
        # Normalize to [0, 1]
        total_weight = sum(weights.values())
        if total_weight > 0:
            scores = scores / total_weight
        
        return scores
