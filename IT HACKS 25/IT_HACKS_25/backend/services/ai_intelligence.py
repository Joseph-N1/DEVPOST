"""
AI Intelligence Service - Advanced Recommendations and Analysis
Provides comprehensive AI-driven insights for poultry farm management
"""

import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Any

DATA_DIR = Path(__file__).resolve().parent.parent / 'data' / 'uploads'

def analyze_csv_data(file_path: str = None) -> Dict[str, Any]:
    """
    Comprehensive AI analysis of CSV data
    Returns recommendations, risk analysis, environmental warnings, and room-specific insights
    """
    try:
        # Find CSV file
        if file_path:
            csv_path = DATA_DIR / file_path if not file_path.startswith('/') else Path(file_path)
            df = pd.read_csv(csv_path, parse_dates=['date'])
        else:
            csv_files = list(DATA_DIR.glob('*.csv'))
            if not csv_files:
                return {'error': 'No CSV files found'}
            # Use the largest/most recent CSV file
            csv_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
            df = pd.read_csv(csv_files[0], parse_dates=['date'])
        
        # Get room list
        rooms = df['room_id'].unique()
        
        # Initialize analysis results
        analysis = {
            'feed_optimization': [],
            'mortality_risks': [],
            'environmental_warnings': [],
            'room_recommendations': [],
            'health_summary': {},
            'kpi_summary': {},
            'generated_at': datetime.now().isoformat()
        }
        
        # Global KPI Summary
        latest_data = df.groupby('room_id').tail(7)  # Last week per room
        analysis['kpi_summary'] = {
            'avg_weight_kg': round(latest_data['avg_weight_kg'].mean(), 2),
            'total_eggs_weekly': int(latest_data['eggs_produced'].sum()),
            'avg_mortality_rate': round(latest_data['mortality_rate'].mean(), 2),
            'avg_fcr': round(latest_data['fcr'].mean(), 2),
            'avg_temperature': round(latest_data['temperature_c'].mean(), 1),
            'avg_humidity': round(latest_data['humidity_pct'].mean(), 1),
            'total_birds': int(latest_data.groupby('room_id').tail(1)['birds_end'].sum())
        }
        
        # Analyze each room
        for room_id in rooms:
            room_data = df[df['room_id'] == room_id].sort_values('date')
            recent = room_data.tail(14)  # Last 2 weeks
            
            if len(recent) < 3:
                continue
            
            # Feed Optimization Analysis
            feed_insight = analyze_feed_efficiency(recent, room_id)
            if feed_insight:
                analysis['feed_optimization'].append(feed_insight)
            
            # Mortality Risk Analysis
            mortality_risk = analyze_mortality_risk(recent, room_id)
            if mortality_risk:
                analysis['mortality_risks'].append(mortality_risk)
            
            # Environmental Analysis
            env_warning = analyze_environment(recent, room_id)
            if env_warning:
                analysis['environmental_warnings'].append(env_warning)
            
            # Room-Specific Recommendations
            room_rec = generate_room_recommendation(recent, room_id)
            if room_rec:
                analysis['room_recommendations'].append(room_rec)
        
        # Weekly Health Summary
        analysis['health_summary'] = generate_health_summary(df)
        
        return analysis
        
    except Exception as e:
        return {'error': str(e)}


def analyze_feed_efficiency(recent_data: pd.DataFrame, room_id: str) -> Dict[str, Any]:
    """Analyze feed conversion ratio and provide optimization suggestions"""
    avg_fcr = recent_data['fcr'].mean()
    fcr_trend = recent_data['fcr'].iloc[-3:].mean() - recent_data['fcr'].iloc[:3].mean()
    
    # Optimal FCR range: 1.5 - 2.5
    if avg_fcr > 2.5:
        severity = 'high'
        emoji = '🛑'
        suggestion = f"FCR is {avg_fcr:.2f} (High). Consider: 1) Checking feed quality, 2) Adjusting feeding schedule, 3) Reviewing water availability"
    elif avg_fcr > 2.0:
        severity = 'medium'
        emoji = '⚠️'
        suggestion = f"FCR is {avg_fcr:.2f} (Moderate). Monitor feed intake and bird health closely"
    else:
        severity = 'low'
        emoji = '✅'
        suggestion = f"FCR is {avg_fcr:.2f} (Excellent). Maintain current feeding practices"
    
    return {
        'room_id': room_id,
        'metric': 'Feed Conversion Ratio',
        'value': round(avg_fcr, 2),
        'trend': 'increasing' if fcr_trend > 0.1 else 'decreasing' if fcr_trend < -0.1 else 'stable',
        'severity': severity,
        'emoji': emoji,
        'suggestion': suggestion,
        'priority': 1 if severity == 'high' else 2 if severity == 'medium' else 3
    }


def analyze_mortality_risk(recent_data: pd.DataFrame, room_id: str) -> Dict[str, Any]:
    """Predict mortality risk based on trends and environmental factors"""
    avg_mortality = recent_data['mortality_rate'].mean()
    mortality_trend = recent_data['mortality_rate'].iloc[-3:].mean() - recent_data['mortality_rate'].iloc[:3].mean()
    
    # Risk assessment
    if avg_mortality > 5.0:
        risk_level = 'critical'
        emoji = '🛑'
        suggestion = f"Mortality rate at {avg_mortality:.1f}% is CRITICAL. Immediate veterinary consultation recommended. Check for disease outbreak, ventilation issues, or water contamination"
    elif avg_mortality > 2.0:
        risk_level = 'high'
        emoji = '⚠️'
        suggestion = f"Mortality rate at {avg_mortality:.1f}% is elevated. Review biosecurity protocols, temperature regulation, and feed quality"
    elif mortality_trend > 0.5:
        risk_level = 'medium'
        emoji = 'ℹ️'
        suggestion = f"Mortality rate trending upward ({avg_mortality:.1f}%). Monitor closely for next 3-5 days"
    else:
        return None  # No risk alert needed
    
    return {
        'room_id': room_id,
        'metric': 'Mortality Rate',
        'value': round(avg_mortality, 2),
        'trend': 'increasing' if mortality_trend > 0.2 else 'stable',
        'risk_level': risk_level,
        'emoji': emoji,
        'suggestion': suggestion,
        'priority': 1 if risk_level == 'critical' else 2
    }


def analyze_environment(recent_data: pd.DataFrame, room_id: str) -> Dict[str, Any]:
    """Detect environmental issues (temperature, humidity)"""
    avg_temp = recent_data['temperature_c'].mean()
    avg_humidity = recent_data['humidity_pct'].mean()
    
    warnings = []
    severity = 'low'
    emoji = 'ℹ️'
    
    # Temperature analysis (optimal: 18-24°C)
    if avg_temp > 30:
        warnings.append(f"Temperature {avg_temp:.1f}°C is TOO HIGH. Risk of heat stress. Increase ventilation immediately")
        severity = 'high'
        emoji = '🛑'
    elif avg_temp > 26:
        warnings.append(f"Temperature {avg_temp:.1f}°C is elevated. Monitor birds for panting or reduced feed intake")
        severity = 'medium'
        emoji = '⚠️'
    elif avg_temp < 18:
        warnings.append(f"Temperature {avg_temp:.1f}°C is LOW. Birds may huddle. Increase heating")
        severity = 'medium'
        emoji = '⚠️'
    
    # Humidity analysis (optimal: 50-70%)
    if avg_humidity > 75:
        warnings.append(f"Humidity {avg_humidity:.1f}% is TOO HIGH. Risk of respiratory issues. Improve ventilation")
        if severity != 'high':
            severity = 'medium'
            emoji = '⚠️'
    elif avg_humidity < 40:
        warnings.append(f"Humidity {avg_humidity:.1f}% is LOW. Risk of dusty conditions. Consider misting system")
        if severity == 'low':
            severity = 'medium'
            emoji = 'ℹ️'
    
    if not warnings:
        return None  # No environmental warnings
    
    return {
        'room_id': room_id,
        'metric': 'Environmental Conditions',
        'temperature': round(avg_temp, 1),
        'humidity': round(avg_humidity, 1),
        'severity': severity,
        'emoji': emoji,
        'warnings': warnings,
        'priority': 1 if severity == 'high' else 2 if severity == 'medium' else 3
    }


def generate_room_recommendation(recent_data: pd.DataFrame, room_id: str) -> Dict[str, Any]:
    """Generate comprehensive recommendation for a specific room"""
    # Calculate key metrics
    avg_weight = recent_data['avg_weight_kg'].mean()
    avg_eggs = recent_data['eggs_produced'].mean()
    avg_fcr = recent_data['fcr'].mean()
    avg_mortality = recent_data['mortality_rate'].mean()
    
    # Performance score (0-100)
    weight_score = min(100, (avg_weight / 3.0) * 100)  # 3kg as target
    egg_score = min(100, (avg_eggs / 300) * 100)  # 300 eggs as target
    fcr_score = max(0, 100 - ((avg_fcr - 1.5) / 0.01))  # 1.5 optimal
    health_score = max(0, 100 - (avg_mortality * 10))  # Lower mortality = higher score
    
    overall_score = (weight_score + egg_score + fcr_score + health_score) / 4
    
    # Generate action items
    actions = []
    if weight_score < 70:
        actions.append("Increase protein content in feed to boost weight gain")
    if egg_score < 70:
        actions.append("Review lighting schedule and calcium supplementation for better egg production")
    if fcr_score < 70:
        actions.append("Optimize feed formulation and reduce waste")
    if health_score < 80:
        actions.append("Implement stricter biosecurity measures and health monitoring")
    
    if not actions:
        actions.append("Maintain current excellent management practices")
    
    # Rating
    if overall_score >= 85:
        rating = 'Excellent'
        emoji = '🏆'
    elif overall_score >= 70:
        rating = 'Good'
        emoji = '✅'
    elif overall_score >= 50:
        rating = 'Fair'
        emoji = '⚠️'
    else:
        rating = 'Needs Improvement'
        emoji = '🛑'
    
    return {
        'room_id': room_id,
        'overall_score': round(overall_score, 1),
        'rating': rating,
        'emoji': emoji,
        'metrics': {
            'avg_weight_kg': round(avg_weight, 2),
            'avg_eggs_daily': round(avg_eggs, 0),
            'avg_fcr': round(avg_fcr, 2),
            'mortality_rate': round(avg_mortality, 2)
        },
        'action_items': actions[:3],  # Top 3 actions
        'priority': 1 if overall_score < 50 else 2 if overall_score < 70 else 3
    }


def generate_health_summary(df: pd.DataFrame) -> Dict[str, Any]:
    """Generate weekly health summary for the entire farm"""
    latest_week = df.groupby('room_id').tail(7)
    
    total_birds = latest_week.groupby('room_id').tail(1)['birds_end'].sum()
    total_mortality = latest_week['mortality_daily'].sum() if 'mortality_daily' in latest_week.columns else 0
    avg_weight = latest_week['avg_weight_kg'].mean()
    total_eggs = latest_week['eggs_produced'].sum()
    avg_fcr = latest_week['fcr'].mean()
    
    # Health status
    avg_mortality_rate = latest_week['mortality_rate'].mean()
    if avg_mortality_rate < 1.0:
        health_status = 'Excellent'
        emoji = '💚'
    elif avg_mortality_rate < 2.5:
        health_status = 'Good'
        emoji = '✅'
    elif avg_mortality_rate < 5.0:
        health_status = 'Fair'
        emoji = '⚠️'
    else:
        health_status = 'Critical'
        emoji = '🛑'
    
    return {
        'period': 'Last 7 days',
        'health_status': health_status,
        'emoji': emoji,
        'total_birds': int(total_birds),
        'total_mortality': int(total_mortality),
        'avg_mortality_rate': round(avg_mortality_rate, 2),
        'avg_weight_kg': round(avg_weight, 2),
        'total_eggs_produced': int(total_eggs),
        'avg_fcr': round(avg_fcr, 2),
        'summary': f"Farm health is {health_status}. Total {int(total_birds)} birds across all rooms producing {int(total_eggs)} eggs in the last week."
    }
