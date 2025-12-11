"""
Feature Importance Service - Tracks and analyzes feature importance over time

This module provides functionality to:
- Calculate feature importance from trained models
- Track importance trends and stability
- Compare importance across rooms and seasons
- Identify key predictive features

Classes:
    - FeatureImportanceTracker: Main class for importance tracking and analysis
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class FeatureImportanceTracker:
    """
    Tracks feature importance over time and computes trends.
    
    Supports:
    - Global importance calculation
    - Room-specific importance
    - Temporal trends
    - Seasonal analysis
    """
    
    def __init__(self):
        """Initialize the feature importance tracker."""
        self.importance_history = defaultdict(list)  # feature_name -> [(timestamp, score, room_id)]
        self.feature_metadata = {}  # Cache feature info
        
    def calculate_importance(
        self,
        model,
        X_train: pd.DataFrame,
        feature_names: Optional[List[str]] = None,
        room_id: Optional[int] = None
    ) -> Dict[str, float]:
        """
        Calculate feature importance for a trained model.
        
        Args:
            model: Trained sklearn model with feature_importances_ or coef_
            X_train: Training features
            feature_names: Feature column names
            room_id: Optional room ID for room-specific importance
            
        Returns:
            Dictionary mapping feature names to importance scores [0, 1]
        """
        if feature_names is None:
            feature_names = [f"feature_{i}" for i in range(X_train.shape[1])]
        
        # Get raw importance scores
        if hasattr(model, 'feature_importances_'):
            # Tree-based models
            raw_scores = model.feature_importances_
        elif hasattr(model, 'coef_'):
            # Linear models - use absolute coefficients
            raw_scores = np.abs(model.coef_[0] if model.coef_.ndim > 1 else model.coef_)
        else:
            logger.warning("Model has no feature importances or coefficients")
            return {}
        
        # Normalize scores to [0, 1]
        score_sum = np.sum(raw_scores)
        if score_sum > 0:
            normalized_scores = raw_scores / score_sum
        else:
            normalized_scores = raw_scores
        
        # Create mapping
        importance_dict = {}
        for fname, score in zip(feature_names, normalized_scores):
            importance_dict[fname] = float(score)
        
        # Log if room-specific
        if room_id:
            logger.info(f"Calculated importance for room {room_id}: {len(importance_dict)} features")
        
        return importance_dict
    
    def store_importance(
        self,
        importance_scores: Dict[str, float],
        room_id: Optional[int] = None,
        timestamp: Optional[datetime] = None
    ) -> None:
        """
        Store feature importance scores in history.
        
        Args:
            importance_scores: Dictionary mapping feature names to scores
            room_id: Optional room ID for room-specific tracking
            timestamp: When importance was calculated (default: now)
        """
        if timestamp is None:
            timestamp = datetime.now()
        
        for feature_name, score in importance_scores.items():
            # Store as (timestamp, score, room_id)
            self.importance_history[feature_name].append((timestamp, score, room_id))
    
    def get_top_features(
        self,
        n: int = 20,
        room_id: Optional[int] = None,
        days: int = 7
    ) -> List[Tuple[str, float, int]]:
        """
        Get top N features by recent importance.
        
        Args:
            n: Number of top features to return
            room_id: Filter to specific room (None for global)
            days: Recent period to consider
            
        Returns:
            List of (feature_name, importance_score, rank) tuples, sorted by score
        """
        cutoff_date = datetime.now() - timedelta(days=days)
        feature_scores = {}
        
        for feature_name, history in self.importance_history.items():
            # Filter by date and room
            recent = [
                score for ts, score, rid in history
                if ts >= cutoff_date and (room_id is None or rid == room_id or rid is None)
            ]
            
            if recent:
                # Use average of recent scores
                feature_scores[feature_name] = np.mean(recent)
        
        # Sort by score descending and return top n
        sorted_features = sorted(feature_scores.items(), key=lambda x: x[1], reverse=True)
        return [
            (fname, score, rank + 1)
            for rank, (fname, score) in enumerate(sorted_features[:n])
        ]
    
    def get_importance_history(
        self,
        feature_name: str,
        days: int = 90,
        room_id: Optional[int] = None,
        frequency: str = 'daily'
    ) -> List[Dict]:
        """
        Get importance trend for a specific feature over time.
        
        Args:
            feature_name: Name of feature to track
            days: Number of days of history
            room_id: Filter to specific room
            frequency: 'daily' or 'weekly' aggregation
            
        Returns:
            List of dicts with timestamp and score
        """
        if feature_name not in self.importance_history:
            return []
        
        cutoff_date = datetime.now() - timedelta(days=days)
        history = [
            (ts, score, rid) for ts, score, rid in self.importance_history[feature_name]
            if ts >= cutoff_date and (room_id is None or rid == room_id or rid is None)
        ]
        
        if not history:
            return []
        
        # Aggregate by frequency
        if frequency == 'weekly':
            # Group by week
            df = pd.DataFrame(history, columns=['timestamp', 'score', 'room_id'])
            df['week'] = df['timestamp'].dt.isocalendar().week
            grouped = df.groupby('week')['score'].mean()
            result = [
                {'timestamp': f"Week {week}", 'score': float(score)}
                for week, score in grouped.items()
            ]
        else:  # daily
            # Group by day
            df = pd.DataFrame(history, columns=['timestamp', 'score', 'room_id'])
            df['date'] = df['timestamp'].dt.date
            grouped = df.groupby('date')['score'].mean()
            result = [
                {'timestamp': str(date), 'score': float(score)}
                for date, score in grouped.items()
            ]
        
        return result
    
    def compare_importance(
        self,
        room_id_1: Optional[int],
        room_id_2: Optional[int],
        n_features: int = 20
    ) -> List[Dict]:
        """
        Compare feature importance between two rooms or room vs global.
        
        Args:
            room_id_1: First room (None for global)
            room_id_2: Second room (None for global)
            n_features: Number of top features to compare
            
        Returns:
            List of dicts with feature, score1, score2, difference
        """
        top_1 = {fname: score for fname, score, _ in self.get_top_features(n_features, room_id_1)}
        top_2 = {fname: score for fname, score, _ in self.get_top_features(n_features, room_id_2)}
        
        all_features = set(top_1.keys()) | set(top_2.keys())
        
        result = []
        for feature in all_features:
            score1 = top_1.get(feature, 0)
            score2 = top_2.get(feature, 0)
            result.append({
                'feature': feature,
                'score_1': float(score1),
                'score_2': float(score2),
                'difference': float(abs(score1 - score2))
            })
        
        return sorted(result, key=lambda x: x['difference'], reverse=True)
    
    def get_seasonal_importance(
        self,
        room_id: Optional[int] = None,
        n_features: int = 10
    ) -> Dict[str, List[Tuple[str, float, int]]]:
        """
        Get feature importance segmented by season.
        
        Args:
            room_id: Filter to specific room
            n_features: Top N features per season
            
        Returns:
            Dictionary mapping season name to list of (feature, score, rank)
        """
        seasonal_data = {'Spring': [], 'Summer': [], 'Fall': [], 'Winter': []}
        
        for feature_name, history in self.importance_history.items():
            for ts, score, rid in history:
                if room_id is not None and rid != room_id and rid is not None:
                    continue
                
                # Determine season (Northern Hemisphere)
                month = ts.month
                if month in [3, 4, 5]:
                    season = 'Spring'
                elif month in [6, 7, 8]:
                    season = 'Summer'
                elif month in [9, 10, 11]:
                    season = 'Fall'
                else:
                    season = 'Winter'
                
                seasonal_data[season].append((feature_name, score))
        
        # Compute average score per feature per season
        result = {}
        for season, data in seasonal_data.items():
            if data:
                feature_scores = defaultdict(list)
                for fname, score in data:
                    feature_scores[fname].append(score)
                
                avg_scores = {fname: np.mean(scores) for fname, scores in feature_scores.items()}
                sorted_features = sorted(avg_scores.items(), key=lambda x: x[1], reverse=True)
                result[season] = [
                    (fname, score, rank + 1)
                    for rank, (fname, score) in enumerate(sorted_features[:n_features])
                ]
            else:
                result[season] = []
        
        return result
    
    def get_stability_score(
        self,
        feature_name: str,
        days: int = 30,
        room_id: Optional[int] = None
    ) -> float:
        """
        Calculate stability score for a feature (how consistent is its importance).
        
        Args:
            feature_name: Feature to analyze
            days: Period to consider
            room_id: Filter to specific room
            
        Returns:
            Stability score [0, 1] where 1 = perfectly stable, 0 = highly variable
        """
        history = self.get_importance_history(feature_name, days, room_id)
        
        if len(history) < 2:
            return 1.0  # Assume stable if insufficient data
        
        scores = [h['score'] for h in history]
        cv = np.std(scores) / (np.mean(scores) + 1e-6)  # Coefficient of variation
        
        # Convert to stability (lower CV = higher stability)
        stability = 1.0 / (1.0 + cv)
        return float(np.clip(stability, 0, 1))
    
    def get_importance_trend(
        self,
        feature_name: str,
        days: int = 30,
        room_id: Optional[int] = None
    ) -> str:
        """
        Determine if feature importance is increasing, decreasing, or stable.
        
        Args:
            feature_name: Feature to analyze
            days: Period to consider
            room_id: Filter to specific room
            
        Returns:
            'increasing', 'decreasing', or 'stable'
        """
        history = self.get_importance_history(feature_name, days, room_id)
        
        if len(history) < 2:
            return 'stable'
        
        scores = [h['score'] for h in history]
        
        # Simple linear trend
        x = np.arange(len(scores))
        slope = np.polyfit(x, scores, 1)[0]
        
        if abs(slope) < 0.01:
            return 'stable'
        elif slope > 0:
            return 'increasing'
        else:
            return 'decreasing'
    
    def clear_old_data(self, days_to_keep: int = 180) -> None:
        """
        Remove old data beyond retention period.
        
        Args:
            days_to_keep: Keep data from last N days
        """
        cutoff_date = datetime.now() - timedelta(days=days_to_keep)
        
        for feature_name in list(self.importance_history.keys()):
            # Keep only recent entries
            self.importance_history[feature_name] = [
                (ts, score, rid) for ts, score, rid in self.importance_history[feature_name]
                if ts >= cutoff_date
            ]
            
            # Remove feature if no history left
            if not self.importance_history[feature_name]:
                del self.importance_history[feature_name]
        
        logger.info(f"Cleared data older than {cutoff_date}")


# Global instance
feature_importance_tracker = FeatureImportanceTracker()
