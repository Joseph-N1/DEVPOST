"""
ML Explainability Module
Provides explanations for model predictions and feature importance analysis
"""

import numpy as np
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)


class ExplainabilityAnalyzer:
    """
    Analyzes and explains machine learning model predictions
    Provides feature importance, decision paths, and reasoning
    """
    
    def __init__(self):
        """Initialize the explainability analyzer"""
        self.explanations = {}
    
    def explain_prediction(
        self,
        prediction: float,
        features: Dict[str, float],
        feature_importance: Optional[Dict[str, float]] = None,
        model_type: str = "regression"
    ) -> Dict[str, Any]:
        """
        Explain a model prediction
        
        Args:
            prediction: The model's prediction value
            features: Input features used for prediction
            feature_importance: Feature importance scores
            model_type: Type of model (regression, classification)
        
        Returns:
            Dictionary with explanation details
        """
        
        explanation = {
            "prediction": float(prediction),
            "model_type": model_type,
            "features_used": features.copy(),
            "key_factors": [],
            "explanation": ""
        }
        
        # Identify key factors
        if feature_importance:
            sorted_features = sorted(
                feature_importance.items(),
                key=lambda x: abs(x[1]),
                reverse=True
            )
            explanation["key_factors"] = [
                {
                    "feature": name,
                    "importance": float(score),
                    "value": features.get(name, 0)
                }
                for name, score in sorted_features[:5]
            ]
        
        # Generate explanation text
        explanation["explanation"] = self._generate_explanation(
            prediction, explanation["key_factors"], model_type
        )
        
        return explanation
    
    def _generate_explanation(
        self,
        prediction: float,
        key_factors: List[Dict[str, Any]],
        model_type: str
    ) -> str:
        """Generate human-readable explanation"""
        
        if not key_factors:
            return f"Predicted value: {prediction:.2f}"
        
        top_factor = key_factors[0] if key_factors else None
        if not top_factor:
            return f"Predicted value: {prediction:.2f}"
        
        explanation = f"Predicted {model_type} value: {prediction:.2f}. "
        explanation += f"Most influential factor: {top_factor['feature']} "
        explanation += f"(importance: {top_factor['importance']:.3f}, value: {top_factor['value']:.2f}). "
        
        if len(key_factors) > 1:
            other_factors = ", ".join([f["feature"] for f in key_factors[1:3]])
            explanation += f"Other important factors: {other_factors}."
        
        return explanation
    
    def compare_predictions(
        self,
        pred1: float,
        pred2: float,
        features1: Dict[str, float],
        features2: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Compare two predictions and explain differences
        
        Args:
            pred1: First prediction
            pred2: Second prediction
            features1: Features for first prediction
            features2: Features for second prediction
        
        Returns:
            Comparison explanation
        """
        
        difference = pred2 - pred1
        percent_change = (difference / pred1 * 100) if pred1 != 0 else 0
        
        # Find largest feature differences
        feature_diffs = {}
        all_features = set(features1.keys()) | set(features2.keys())
        
        for feature in all_features:
            v1 = features1.get(feature, 0)
            v2 = features2.get(feature, 0)
            feature_diffs[feature] = v2 - v1
        
        sorted_diffs = sorted(
            feature_diffs.items(),
            key=lambda x: abs(x[1]),
            reverse=True
        )
        
        return {
            "prediction_1": float(pred1),
            "prediction_2": float(pred2),
            "difference": float(difference),
            "percent_change": float(percent_change),
            "contributing_factors": [
                {"feature": name, "difference": float(diff)}
                for name, diff in sorted_diffs[:5]
            ]
        }
    
    def get_feature_sensitivity(
        self,
        baseline_features: Dict[str, float],
        feature_importance: Dict[str, float],
        sensitivity_percent: float = 10.0
    ) -> Dict[str, Any]:
        """
        Calculate feature sensitivity to changes
        
        Args:
            baseline_features: Baseline feature values
            feature_importance: Feature importance scores
            sensitivity_percent: Percentage change to test
        
        Returns:
            Sensitivity analysis results
        """
        
        sensitivities = {}
        
        for feature, importance in feature_importance.items():
            baseline_value = baseline_features.get(feature, 0)
            
            if baseline_value == 0:
                sensitivity = importance * (sensitivity_percent / 100)
            else:
                change = baseline_value * (sensitivity_percent / 100)
                sensitivity = importance * (change / baseline_value) if baseline_value != 0 else 0
            
            sensitivities[feature] = {
                "importance": float(importance),
                "sensitivity": float(sensitivity),
                "baseline_value": float(baseline_value)
            }
        
        return sensitivities
