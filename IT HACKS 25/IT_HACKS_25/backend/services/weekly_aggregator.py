import pandas as pd
import numpy as np
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / 'data' / 'uploads'

def aggregate_weekly_data():
    """
    Aggregate CSV data by week for all rooms
    Returns weekly metrics: avg_weight, total_eggs, weekly_fcr, weekly_mortality, weekly_feed, weekly_water
    """
    # Find CSV files
    csv_files = list(DATA_DIR.glob('*.csv'))
    if not csv_files:
        return {'error': 'No CSV data available'}
    
    # Read the most recent CSV
    df = pd.read_csv(csv_files[0], parse_dates=['date'])
    
    # Calculate week number from age_days
    df['week_num'] = (df['age_days'] // 7) + 1
    
    # Group by room and week
    weekly_data = []
    
    for room_id in df['room_id'].unique():
        room_df = df[df['room_id'] == room_id]
        
        for week_num in sorted(room_df['week_num'].unique()):
            week_df = room_df[room_df['week_num'] == week_num]
            
            # Calculate weekly metrics
            weekly_metrics = {
                'room_id': room_id,
                'week': int(week_num),
                'avg_weight': round(week_df['avg_weight_kg'].mean(), 3) if 'avg_weight_kg' in week_df else 0,
                'total_eggs': int(week_df['eggs_produced'].sum()) if 'eggs_produced' in week_df else 0,
                'fcr': round(week_df['fcr'].mean(), 3) if 'fcr' in week_df else 0,
                'mortality_rate': round(week_df['mortality_rate'].mean(), 3) if 'mortality_rate' in week_df else 0,
                'total_feed': round(week_df['feed_kg_total'].sum(), 2) if 'feed_kg_total' in week_df else 0,
                'total_water': round(week_df['water_liters_total'].sum(), 2) if 'water_liters_total' in week_df else 0,
                'avg_temp': round(week_df['temperature_c'].mean(), 1) if 'temperature_c' in week_df else 0,
                'avg_humidity': round(week_df['humidity_pct'].mean(), 1) if 'humidity_pct' in week_df else 0,
                'birds_start': int(week_df.iloc[0]['birds_start']) if 'birds_start' in week_df else 0,
                'birds_end': int(week_df.iloc[-1]['birds_end']) if 'birds_end' in week_df else 0,
            }
            
            weekly_data.append(weekly_metrics)
    
    return {'weekly_data': weekly_data, 'total_weeks': len(set(item['week'] for item in weekly_data))}


def get_week_comparison(room_id=None):
    """
    Get week-over-week comparison for specified room or all rooms
    """
    result = aggregate_weekly_data()
    if 'error' in result:
        return result
    
    weekly_data = result['weekly_data']
    
    # Filter by room if specified
    if room_id:
        weekly_data = [w for w in weekly_data if w['room_id'] == room_id]
    
    # Calculate week-over-week changes
    comparisons = []
    
    # Group by room
    from itertools import groupby
    weekly_data_sorted = sorted(weekly_data, key=lambda x: (x['room_id'], x['week']))
    
    for room, weeks in groupby(weekly_data_sorted, key=lambda x: x['room_id']):
        weeks_list = list(weeks)
        
        for i in range(1, len(weeks_list)):
            prev_week = weeks_list[i-1]
            curr_week = weeks_list[i]
            
            # Calculate percentage changes
            weight_change = ((curr_week['avg_weight'] - prev_week['avg_weight']) / prev_week['avg_weight'] * 100) if prev_week['avg_weight'] > 0 else 0
            egg_change = ((curr_week['total_eggs'] - prev_week['total_eggs']) / prev_week['total_eggs'] * 100) if prev_week['total_eggs'] > 0 else 0
            fcr_change = ((curr_week['fcr'] - prev_week['fcr']) / prev_week['fcr'] * 100) if prev_week['fcr'] > 0 else 0
            mortality_change = ((curr_week['mortality_rate'] - prev_week['mortality_rate']) / prev_week['mortality_rate'] * 100) if prev_week['mortality_rate'] > 0 else 0
            
            comparisons.append({
                'room_id': room,
                'week': curr_week['week'],
                'prev_week': prev_week['week'],
                'weight_change_pct': round(weight_change, 2),
                'egg_change_pct': round(egg_change, 2),
                'fcr_change_pct': round(fcr_change, 2),
                'mortality_change_pct': round(mortality_change, 2),
                'current_metrics': curr_week,
                'previous_metrics': prev_week
            })
    
    return {'comparisons': comparisons}
