"""
AI Weekly Farm Manager Report Generator
Generates comprehensive weekly reports with KPIs, trends, rankings, anomalies, and forecasts
"""

import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Any
from services.ai_intelligence import analyze_csv_data
from ml.anomaly_detector import detect_anomalies
from services.ai_analyzer import generate_weight_forecast, predict_for_room

DATA_DIR = Path(__file__).resolve().parent.parent / 'data' / 'uploads'

def generate_weekly_report(file_path: str = None) -> Dict[str, Any]:
    """
    Generate comprehensive AI-powered weekly farm manager report
    
    Returns:
        Complete report with all sections ready for PDF export or dashboard display
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
        
        # Generate report sections
        report = {
            'report_date': datetime.now().strftime('%Y-%m-%d'),
            'report_period': 'Last 7 Days',
            'farm_overview': generate_farm_overview(df),
            'room_rankings': generate_room_rankings(df),
            'kpi_trends': generate_kpi_trends(df),
            'anomalies_summary': get_anomalies_summary(),
            'recommendations': get_top_recommendations(),
            'weekly_forecast': generate_weekly_forecast_all_rooms(rooms),
            'action_items': generate_action_items(df),
            'executive_summary': ''  # Will be filled at the end
        }
        
        # Generate executive summary
        report['executive_summary'] = generate_executive_summary(report)
        
        return report
        
    except Exception as e:
        return {'error': str(e)}


def generate_farm_overview(df: pd.DataFrame) -> Dict[str, Any]:
    """Generate high-level farm overview for last 7 days"""
    latest_week = df.groupby('room_id').tail(7)
    previous_week = df.groupby('room_id').apply(lambda x: x.iloc[-14:-7] if len(x) >= 14 else pd.DataFrame()).reset_index(drop=True)
    
    # Current week metrics
    current = {
        'total_birds': int(latest_week.groupby('room_id').tail(1)['birds_end'].sum()),
        'total_eggs': int(latest_week['eggs_produced'].sum()),
        'avg_weight': round(latest_week['avg_weight_kg'].mean(), 2),
        'avg_fcr': round(latest_week['fcr'].mean(), 2),
        'mortality_rate': round(latest_week['mortality_rate'].mean(), 2),
        'total_feed_kg': round(latest_week['feed_kg_total'].sum(), 0),
        'avg_temperature': round(latest_week['temperature_c'].mean(), 1),
        'avg_humidity': round(latest_week['humidity_pct'].mean(), 1)
    }
    
    # Calculate trends
    if not previous_week.empty:
        prev = {
            'total_eggs': previous_week['eggs_produced'].sum(),
            'avg_weight': previous_week['avg_weight_kg'].mean(),
            'avg_fcr': previous_week['fcr'].mean(),
            'mortality_rate': previous_week['mortality_rate'].mean()
        }
        
        trends = {
            'eggs_change': round(((current['total_eggs'] - prev['total_eggs']) / prev['total_eggs']) * 100, 1) if prev['total_eggs'] > 0 else 0,
            'weight_change': round(((current['avg_weight'] - prev['avg_weight']) / prev['avg_weight']) * 100, 1) if prev['avg_weight'] > 0 else 0,
            'fcr_change': round(((current['avg_fcr'] - prev['avg_fcr']) / prev['avg_fcr']) * 100, 1) if prev['avg_fcr'] > 0 else 0,
            'mortality_change': round(current['mortality_rate'] - prev['mortality_rate'], 2)
        }
    else:
        trends = {
            'eggs_change': 0,
            'weight_change': 0,
            'fcr_change': 0,
            'mortality_change': 0
        }
    
    # Overall health status
    if current['mortality_rate'] < 1.0:
        health_status = 'Excellent'
        health_emoji = '💚'
    elif current['mortality_rate'] < 2.5:
        health_status = 'Good'
        health_emoji = '✅'
    elif current['mortality_rate'] < 5.0:
        health_status = 'Fair'
        health_emoji = '⚠️'
    else:
        health_status = 'Critical'
        health_emoji = '🛑'
    
    return {
        'current_metrics': current,
        'trends': trends,
        'health_status': health_status,
        'health_emoji': health_emoji,
        'total_rooms': len(df['room_id'].unique())
    }


def generate_room_rankings(df: pd.DataFrame) -> Dict[str, List[Dict]]:
    """Rank rooms by different KPIs"""
    latest_week = df.groupby('room_id').tail(7)
    
    room_stats = []
    for room_id in df['room_id'].unique():
        room_data = latest_week[latest_week['room_id'] == room_id]
        if room_data.empty:
            continue
        
        room_stats.append({
            'room_id': room_id,
            'total_eggs': room_data['eggs_produced'].sum(),
            'avg_weight': room_data['avg_weight_kg'].mean(),
            'avg_fcr': room_data['fcr'].mean(),
            'mortality_rate': room_data['mortality_rate'].mean(),
            'birds': room_data.iloc[-1]['birds_end'] if len(room_data) > 0 else 0
        })
    
    # Create rankings
    rankings = {
        'by_egg_production': sorted(room_stats, key=lambda x: x['total_eggs'], reverse=True),
        'by_weight': sorted(room_stats, key=lambda x: x['avg_weight'], reverse=True),
        'by_fcr': sorted(room_stats, key=lambda x: x['avg_fcr']),  # Lower is better
        'by_health': sorted(room_stats, key=lambda x: x['mortality_rate'])  # Lower is better
    }
    
    # Add ranks and medals
    for category, rooms in rankings.items():
        for idx, room in enumerate(rooms):
            room['rank'] = idx + 1
            if idx == 0:
                room['medal'] = '🥇'
            elif idx == 1:
                room['medal'] = '🥈'
            elif idx == 2:
                room['medal'] = '🥉'
            else:
                room['medal'] = ''
    
    return rankings


def generate_kpi_trends(df: pd.DataFrame) -> Dict[str, Any]:
    """Analyze KPI trends over the last 4 weeks"""
    # Get data for last 28 days, grouped by week
    last_28_days = df.groupby('room_id').tail(28)
    
    # Group by week
    last_28_days['week'] = ((last_28_days.groupby('room_id').cumcount() // 7) + 1)
    
    weekly_data = last_28_days.groupby('week').agg({
        'eggs_produced': 'sum',
        'avg_weight_kg': 'mean',
        'fcr': 'mean',
        'mortality_rate': 'mean',
        'feed_kg_total': 'sum',
        'temperature_c': 'mean',
        'humidity_pct': 'mean'
    }).reset_index()
    
    # Calculate trend direction for each KPI
    trends = {}
    for col in ['eggs_produced', 'avg_weight_kg', 'fcr', 'mortality_rate']:
        if col not in weekly_data.columns or len(weekly_data) < 2:
            trends[col] = 'stable'
            continue
        
        first_week = weekly_data[col].iloc[0]
        last_week = weekly_data[col].iloc[-1]
        
        if last_week > first_week * 1.05:
            trends[col] = 'increasing'
        elif last_week < first_week * 0.95:
            trends[col] = 'decreasing'
        else:
            trends[col] = 'stable'
    
    return {
        'weekly_data': weekly_data.to_dict('records'),
        'trend_analysis': trends,
        'period': '4 weeks'
    }


def get_anomalies_summary() -> Dict[str, Any]:
    """Get summary of detected anomalies"""
    anomaly_result = detect_anomalies()
    
    if 'error' in anomaly_result:
        return {'total': 0, 'critical': 0, 'high': 0, 'medium': 0, 'top_anomalies': []}
    
    return {
        'total': anomaly_result.get('total_detected', 0),
        'critical': anomaly_result.get('summary', {}).get('critical', 0),
        'high': anomaly_result.get('summary', {}).get('high', 0),
        'medium': anomaly_result.get('summary', {}).get('medium', 0),
        'top_anomalies': anomaly_result.get('anomalies', [])[:5]  # Top 5
    }


def get_top_recommendations() -> List[Dict[str, Any]]:
    """Get top AI recommendations from intelligence service"""
    analysis = analyze_csv_data()
    
    if 'error' in analysis:
        return []
    
    all_recs = []
    
    # Collect all recommendations
    all_recs.extend(analysis.get('feed_optimization', []))
    all_recs.extend(analysis.get('mortality_risks', []))
    all_recs.extend(analysis.get('environmental_warnings', []))
    
    # Sort by priority
    sorted_recs = sorted(all_recs, key=lambda x: x.get('priority', 999))
    
    return sorted_recs[:10]  # Top 10 recommendations


def generate_weekly_forecast_all_rooms(rooms: list) -> Dict[str, Any]:
    """Generate 7-day weight forecast for all rooms"""
    forecasts = {}
    
    for room_id in rooms[:5]:  # Limit to first 5 rooms for performance
        try:
            forecast = generate_weight_forecast(room_id, days=7)
            if 'error' not in forecast:
                forecasts[room_id] = {
                    'predicted_weights': forecast['predicted_weights'],
                    'base_weight': forecast['base_weight'],
                    'growth_rate': forecast['growth_rate_percent']
                }
        except Exception:
            continue
    
    return {
        'forecasts': forecasts,
        'forecast_period': '7 days',
        'method': 'AI Weight Prediction Model'
    }


def generate_action_items(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Generate prioritized action items for farm manager"""
    action_items = []
    latest_week = df.groupby('room_id').tail(7)
    
    # Check for critical issues
    for room_id in df['room_id'].unique():
        room_data = latest_week[latest_week['room_id'] == room_id]
        if room_data.empty:
            continue
        
        avg_mortality = room_data['mortality_rate'].mean()
        avg_temp = room_data['temperature_c'].mean()
        avg_fcr = room_data['fcr'].mean()
        avg_eggs = room_data['eggs_produced'].mean()
        
        # High mortality
        if avg_mortality > 3.0:
            action_items.append({
                'priority': 'URGENT',
                'room_id': room_id,
                'issue': 'High Mortality Rate',
                'value': f"{avg_mortality:.1f}%",
                'action': 'Immediate veterinary consultation required',
                'emoji': '🛑'
            })
        
        # Temperature issues
        if avg_temp > 30:
            action_items.append({
                'priority': 'HIGH',
                'room_id': room_id,
                'issue': 'High Temperature',
                'value': f"{avg_temp:.1f}°C",
                'action': 'Increase ventilation to prevent heat stress',
                'emoji': '⚠️'
            })
        
        # Poor FCR
        if avg_fcr > 2.5:
            action_items.append({
                'priority': 'MEDIUM',
                'room_id': room_id,
                'issue': 'Poor Feed Conversion',
                'value': f"{avg_fcr:.2f}",
                'action': 'Review feed quality and feeding schedule',
                'emoji': 'ℹ️'
            })
        
        # Low egg production (if birds are mature enough)
        if avg_eggs < 100 and len(df) > 30:  # After 30 days
            action_items.append({
                'priority': 'MEDIUM',
                'room_id': room_id,
                'issue': 'Low Egg Production',
                'value': f"{avg_eggs:.0f} eggs/day",
                'action': 'Check lighting schedule and calcium supplementation',
                'emoji': 'ℹ️'
            })
    
    # Sort by priority
    priority_order = {'URGENT': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3}
    action_items.sort(key=lambda x: priority_order.get(x['priority'], 999))
    
    return action_items[:15]  # Top 15 action items


def generate_executive_summary(report: Dict[str, Any]) -> str:
    """Generate AI-powered executive summary"""
    overview = report['farm_overview']
    current = overview['current_metrics']
    trends = overview['trends']
    health = overview['health_status']
    
    # Build summary paragraphs
    summary_parts = []
    
    # Opening statement
    summary_parts.append(
        f"Weekly Report for {report['report_date']} | Farm Status: {health} {overview['health_emoji']}"
    )
    
    # Key metrics
    summary_parts.append(
        f"The farm currently manages {current['total_birds']} birds across {overview['total_rooms']} rooms, "
        f"producing {current['total_eggs']} eggs this week with an average bird weight of {current['avg_weight']} kg. "
        f"Feed conversion ratio stands at {current['avg_fcr']}, with a mortality rate of {current['mortality_rate']}%."
    )
    
    # Trends analysis
    trend_statements = []
    if abs(trends['eggs_change']) > 5:
        direction = "increased" if trends['eggs_change'] > 0 else "decreased"
        trend_statements.append(f"Egg production {direction} by {abs(trends['eggs_change'])}%")
    
    if abs(trends['weight_change']) > 3:
        direction = "increased" if trends['weight_change'] > 0 else "decreased"
        trend_statements.append(f"Average weight {direction} by {abs(trends['weight_change'])}%")
    
    if trend_statements:
        summary_parts.append("Week-over-week changes: " + ", ".join(trend_statements) + ".")
    
    # Anomalies
    anomalies = report['anomalies_summary']
    if anomalies['total'] > 0:
        summary_parts.append(
            f"Detected {anomalies['total']} anomalies: {anomalies['critical']} critical, "
            f"{anomalies['high']} high priority, {anomalies['medium']} medium priority."
        )
    
    # Action items
    actions = report['action_items']
    urgent_count = len([a for a in actions if a['priority'] == 'URGENT'])
    if urgent_count > 0:
        summary_parts.append(f"⚠️ {urgent_count} urgent action items require immediate attention.")
    
    # Recommendations
    recs = report['recommendations']
    if recs:
        summary_parts.append(f"Top recommendation: {recs[0].get('suggestion', 'Monitor farm conditions closely')}.")
    
    return " ".join(summary_parts)
