"""
AI Anomaly Detection System
Uses Z-score and Isolation Forest to detect abnormal patterns in poultry farm data
"""

import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.ensemble import IsolationForest
from scipy import stats
from typing import Dict, List, Any
from datetime import datetime

DATA_DIR = Path(__file__).resolve().parent.parent / 'data' / 'uploads'

def detect_anomalies(file_path: str = None, sensitivity: float = 0.1) -> Dict[str, Any]:
    """
    Comprehensive anomaly detection across all metrics
    
    Args:
        file_path: Path to CSV file (optional)
        sensitivity: Anomaly detection sensitivity (0.05-0.2, lower = more strict)
    
    Returns:
        Dictionary with detected anomalies, severity, explanations, and actions
    """
    try:
        # Load data
        if file_path:
            df = pd.read_csv(file_path, parse_dates=['date'])
        else:
            csv_files = list(DATA_DIR.glob('*.csv'))
            if not csv_files:
                return {'error': 'No CSV files found'}
            df = pd.read_csv(csv_files[0], parse_dates=['date'])
        
        rooms = df['room_id'].unique()
        all_anomalies = []
        
        # Metrics to analyze
        metrics_config = {
            'eggs_produced': {'threshold': 3, 'unit': 'eggs', 'optimal_range': (150, 350)},
            'mortality_rate': {'threshold': 2.5, 'unit': '%', 'optimal_range': (0, 2)},
            'avg_weight_kg': {'threshold': 3, 'unit': 'kg', 'optimal_range': (1.5, 3.5)},
            'feed_kg_total': {'threshold': 3, 'unit': 'kg', 'optimal_range': (50, 200)},
            'water_liters_total': {'threshold': 3, 'unit': 'L', 'optimal_range': (100, 400)},
            'temperature_c': {'threshold': 2.5, 'unit': '°C', 'optimal_range': (18, 26)},
            'humidity_pct': {'threshold': 2.5, 'unit': '%', 'optimal_range': (50, 70)}
        }
        
        # Analyze each room
        for room_id in rooms:
            room_data = df[df['room_id'] == room_id].sort_values('date')
            
            if len(room_data) < 10:
                continue
            
            # Use last 30 days for analysis
            recent_data = room_data.tail(30)
            
            for metric, config in metrics_config.items():
                if metric not in recent_data.columns:
                    continue
                
                # Z-score anomaly detection
                z_anomalies = detect_zscore_anomalies(
                    recent_data, metric, room_id, config
                )
                all_anomalies.extend(z_anomalies)
                
                # Isolation Forest for multivariate analysis
                if len(recent_data) >= 20:
                    iso_anomalies = detect_isolation_forest_anomalies(
                        recent_data, metric, room_id, config, sensitivity
                    )
                    all_anomalies.extend(iso_anomalies)
        
        # Remove duplicates and sort by severity
        unique_anomalies = remove_duplicate_anomalies(all_anomalies)
        sorted_anomalies = sorted(unique_anomalies, key=lambda x: severity_rank(x['severity']), reverse=True)
        
        # Summary statistics
        critical_count = len([a for a in sorted_anomalies if a['severity'] == 'critical'])
        high_count = len([a for a in sorted_anomalies if a['severity'] == 'high'])
        medium_count = len([a for a in sorted_anomalies if a['severity'] == 'medium'])
        
        return {
            'anomalies': sorted_anomalies[:20],  # Top 20 anomalies
            'total_detected': len(sorted_anomalies),
            'summary': {
                'critical': critical_count,
                'high': high_count,
                'medium': medium_count
            },
            'detection_method': 'Z-score + Isolation Forest',
            'generated_at': datetime.now().isoformat()
        }
        
    except Exception as e:
        return {'error': str(e)}


def detect_zscore_anomalies(data: pd.DataFrame, metric: str, room_id: str, config: Dict) -> List[Dict]:
    """Detect anomalies using Z-score method"""
    anomalies = []
    values = data[metric].dropna()
    
    if len(values) < 5:
        return []
    
    # Calculate Z-scores
    z_scores = np.abs(stats.zscore(values))
    threshold = config['threshold']
    
    # Find anomalous points
    anomaly_indices = np.where(z_scores > threshold)[0]
    
    for idx in anomaly_indices:
        if idx >= len(data):
            continue
            
        row = data.iloc[idx]
        value = row[metric]
        mean_val = values.mean()
        std_val = values.std()
        z_score = z_scores[idx]
        
        # Determine severity
        if z_score > 4:
            severity = 'critical'
            emoji = '🛑'
        elif z_score > 3.5:
            severity = 'high'
            emoji = '⚠️'
        else:
            severity = 'medium'
            emoji = 'ℹ️'
        
        # Generate explanation
        deviation = ((value - mean_val) / mean_val) * 100
        direction = 'above' if value > mean_val else 'below'
        
        explanation = f"{metric.replace('_', ' ').title()} is {abs(deviation):.1f}% {direction} normal ({value:.2f} {config['unit']} vs avg {mean_val:.2f} {config['unit']})"
        
        # Generate suggested actions
        actions = generate_corrective_actions(metric, value, config['optimal_range'], severity)
        
        anomalies.append({
            'room_id': room_id,
            'date': row['date'].strftime('%Y-%m-%d') if pd.notna(row['date']) else 'Unknown',
            'metric': metric.replace('_', ' ').title(),
            'value': round(float(value), 2),
            'expected_range': f"{config['optimal_range'][0]}-{config['optimal_range'][1]} {config['unit']}",
            'severity': severity,
            'emoji': emoji,
            'explanation': explanation,
            'actions': actions,
            'detection_method': 'Z-score',
            'z_score': round(float(z_score), 2)
        })
    
    return anomalies


def detect_isolation_forest_anomalies(data: pd.DataFrame, metric: str, room_id: str, config: Dict, sensitivity: float) -> List[Dict]:
    """Detect anomalies using Isolation Forest (multivariate analysis)"""
    anomalies = []
    
    # Select features for multivariate analysis
    feature_columns = [metric]
    related_features = {
        'eggs_produced': ['temperature_c', 'humidity_pct', 'feed_kg_total'],
        'mortality_rate': ['temperature_c', 'humidity_pct', 'avg_weight_kg'],
        'avg_weight_kg': ['feed_kg_total', 'water_liters_total', 'age_days'],
        'temperature_c': ['humidity_pct'],
        'humidity_pct': ['temperature_c']
    }
    
    if metric in related_features:
        for feat in related_features[metric]:
            if feat in data.columns:
                feature_columns.append(feat)
    
    # Prepare feature matrix
    X = data[feature_columns].dropna()
    
    if len(X) < 10:
        return []
    
    # Train Isolation Forest
    iso_forest = IsolationForest(
        contamination=sensitivity,
        random_state=42,
        n_estimators=100
    )
    
    predictions = iso_forest.fit_predict(X)
    scores = iso_forest.score_samples(X)
    
    # Find anomalies (prediction == -1)
    anomaly_indices = np.where(predictions == -1)[0]
    
    for idx in anomaly_indices[:5]:  # Limit to top 5 per metric
        if idx >= len(data):
            continue
            
        row = data.iloc[idx]
        value = row[metric]
        score = scores[idx]
        
        # Determine severity based on anomaly score
        if score < -0.5:
            severity = 'critical'
            emoji = '🛑'
        elif score < -0.3:
            severity = 'high'
            emoji = '⚠️'
        else:
            severity = 'medium'
            emoji = 'ℹ️'
        
        explanation = f"{metric.replace('_', ' ').title()} shows unusual pattern ({value:.2f} {config['unit']}) considering related factors"
        actions = generate_corrective_actions(metric, value, config['optimal_range'], severity)
        
        anomalies.append({
            'room_id': room_id,
            'date': row['date'].strftime('%Y-%m-%d') if pd.notna(row['date']) else 'Unknown',
            'metric': metric.replace('_', ' ').title(),
            'value': round(float(value), 2),
            'expected_range': f"{config['optimal_range'][0]}-{config['optimal_range'][1]} {config['unit']}",
            'severity': severity,
            'emoji': emoji,
            'explanation': explanation,
            'actions': actions,
            'detection_method': 'Isolation Forest',
            'anomaly_score': round(float(score), 3)
        })
    
    return anomalies


def generate_corrective_actions(metric: str, value: float, optimal_range: tuple, severity: str) -> List[str]:
    """Generate actionable recommendations based on anomaly type"""
    actions = []
    min_val, max_val = optimal_range
    
    action_map = {
        'eggs_produced': {
            'low': [
                "Check lighting schedule (14-16 hours recommended)",
                "Review calcium and protein supplementation",
                "Inspect for signs of stress or disease"
            ],
            'high': [
                "Monitor for signs of egg binding",
                "Ensure adequate calcium availability",
                "Maintain current excellent management"
            ]
        },
        'mortality_rate': {
            'high': [
                "URGENT: Veterinary consultation required",
                "Review biosecurity protocols immediately",
                "Check water quality and feed freshness",
                "Isolate sick birds to prevent spread"
            ]
        },
        'avg_weight_kg': {
            'low': [
                "Increase protein content in feed (18-20%)",
                "Check for parasites or disease",
                "Review feeding schedule and access"
            ],
            'high': [
                "Adjust feed formulation to prevent obesity",
                "Ensure adequate exercise space"
            ]
        },
        'temperature_c': {
            'low': [
                "Increase heating immediately",
                "Check for drafts or ventilation issues",
                "Provide additional bedding material"
            ],
            'high': [
                "URGENT: Risk of heat stress",
                "Increase ventilation and air circulation",
                "Provide cool drinking water",
                "Consider misting system if available"
            ]
        },
        'humidity_pct': {
            'low': [
                "Increase humidity with misting system",
                "Check water lines for leaks",
                "Reduce ventilation temporarily"
            ],
            'high': [
                "Increase ventilation to reduce humidity",
                "Check for water leaks or spillage",
                "Risk of respiratory disease - monitor closely"
            ]
        },
        'feed_kg_total': {
            'low': [
                "Investigate reduced appetite causes",
                "Check feed quality and freshness",
                "Review bird health status"
            ],
            'high': [
                "Check for feed wastage",
                "Review feeder design and placement",
                "Monitor for signs of stress eating"
            ]
        },
        'water_liters_total': {
            'low': [
                "URGENT: Check water system for blockages",
                "Verify water availability and cleanliness",
                "Dehydration risk - act immediately"
            ],
            'high': [
                "Check for water leaks",
                "High temperature may increase consumption (normal)",
                "Monitor for signs of disease"
            ]
        }
    }
    
    # Determine if value is low or high
    if value < min_val:
        condition = 'low'
    elif value > max_val:
        condition = 'high'
    else:
        return ["Monitor closely and maintain current practices"]
    
    # Get actions for this metric and condition
    if metric in action_map:
        if condition in action_map[metric]:
            actions = action_map[metric][condition]
        elif 'high' in action_map[metric]:
            actions = action_map[metric]['high']
    
    # Add severity-based general actions
    if severity == 'critical':
        actions.insert(0, "🛑 IMMEDIATE ACTION REQUIRED")
    
    return actions[:3]  # Return top 3 actions


def remove_duplicate_anomalies(anomalies: List[Dict]) -> List[Dict]:
    """Remove duplicate anomalies from the same room/date/metric"""
    seen = set()
    unique = []
    
    for anomaly in anomalies:
        key = (anomaly['room_id'], anomaly['date'], anomaly['metric'])
        if key not in seen:
            seen.add(key)
            unique.append(anomaly)
    
    return unique


def severity_rank(severity: str) -> int:
    """Return numerical rank for sorting by severity"""
    ranks = {'critical': 3, 'high': 2, 'medium': 1, 'low': 0}
    return ranks.get(severity, 0)
