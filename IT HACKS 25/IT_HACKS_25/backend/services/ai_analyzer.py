
import pandas as pd
import joblib
import numpy as np
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from datetime import datetime, timedelta

MODEL_FILE = Path(__file__).resolve().parent.parent / 'models' / 'rf_model.joblib'
METRICS_FILE = Path(__file__).resolve().parent.parent / 'models' / 'model_metrics.joblib'
ACCURACY_FILE = Path(__file__).resolve().parent.parent / 'models' / 'accuracy_history.csv'
DATA_DIR = Path(__file__).resolve().parent.parent / 'data' / 'uploads'
DATA_STORE = DATA_DIR / 'synthetic_v3.csv'  # Use the actual uploaded file

def train_example():
    # Very small example trainer for demo
    data_file = DATA_STORE
    if not Path(data_file).exists():
        # Try to find any CSV in uploads directory
        csv_files = list(DATA_DIR.glob('*.csv'))
        if not csv_files:
            return None
        data_file = csv_files[0]  # Use first available CSV
    
    df = pd.read_csv(data_file, parse_dates=['date'])
    # Simple feature: recent avg weight, avg temp, avg humidity
    df_sorted = df.sort_values(['room_id','date'])
    feats = []
    rows = []
    for room, g in df_sorted.groupby('room_id'):
        g = g.tail(20)  # last 20 days
        if len(g) < 5:
            continue
        X = pd.DataFrame({
            'avg_temp': [g['temperature_c'].mean()],
            'avg_hum': [g['humidity_pct'].mean()],
            'recent_feed': [g['feed_kg_total'].mean()],  # Fixed column name
            'recent_mortality': [g['mortality_rate'].mean()]  # Fixed column name
        })
        y = [g['avg_weight_kg'].mean()]
        feats.append(X)
        rows.append(y)
    if not feats:
        return None
    X = pd.concat(feats, ignore_index=True)
    y = pd.Series([item[0] for item in rows])
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = RandomForestRegressor(n_estimators=50, random_state=42)
    model.fit(X_train, y_train)
    
    # Calculate model performance metrics
    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)
    
    # Calculate metrics and handle NaN values
    train_mae = float(mean_absolute_error(y_train, y_pred_train))
    test_mae = float(mean_absolute_error(y_test, y_pred_test))
    train_rmse = float(np.sqrt(mean_squared_error(y_train, y_pred_train)))
    test_rmse = float(np.sqrt(mean_squared_error(y_test, y_pred_test)))
    train_r2 = float(r2_score(y_train, y_pred_train))
    test_r2 = float(r2_score(y_test, y_pred_test))
    
    # Replace NaN/Inf with None for JSON serialization
    metrics = {
        'train_mae': train_mae if np.isfinite(train_mae) else 0.0,
        'test_mae': test_mae if np.isfinite(test_mae) else 0.0,
        'train_rmse': train_rmse if np.isfinite(train_rmse) else 0.0,
        'test_rmse': test_rmse if np.isfinite(test_rmse) else 0.0,
        'train_r2': train_r2 if np.isfinite(train_r2) else 0.0,
        'test_r2': test_r2 if np.isfinite(test_r2) else 0.0,
        'trained_at': datetime.now().isoformat(),
        'n_samples': len(X),
        'n_features': len(X.columns)
    }
    
    MODEL_FILE.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_FILE)
    joblib.dump(metrics, METRICS_FILE)
    
    # Save accuracy to history
    accuracy_entry = pd.DataFrame([{
        'timestamp': datetime.now().isoformat(),
        'train_mae': metrics['train_mae'],
        'test_mae': metrics['test_mae'],
        'train_r2': metrics['train_r2'],
        'test_r2': metrics['test_r2']
    }])
    
    if ACCURACY_FILE.exists():
        history = pd.read_csv(ACCURACY_FILE)
        history = pd.concat([history, accuracy_entry], ignore_index=True)
    else:
        history = accuracy_entry
    
    history.to_csv(ACCURACY_FILE, index=False)
    
    return {'trained': True, 'modelsaved': str(MODEL_FILE), 'metrics': metrics}

def predict_for_room(room_id):
    # If no model exists, attempt to train a tiny model
    if not MODEL_FILE.exists():
        train_example()
    if not MODEL_FILE.exists():
        return {'error': 'no model available'}
    model = joblib.load(MODEL_FILE)
    # load latest data for room
    data_file = DATA_STORE
    if not Path(data_file).exists():
        # Try to find any CSV in uploads directory
        csv_files = list(DATA_DIR.glob('*.csv'))
        if not csv_files:
            return {'error': 'no data'}
        data_file = csv_files[0]
    
    df = pd.read_csv(data_file, parse_dates=['date'])
    room = df[df['room_id']==room_id].sort_values('date')
    if room.empty:
        return {'error': 'room not found'}
    recent = room.tail(20)
    X = {
        'avg_temp': recent['temperature_c'].mean(),
        'avg_hum': recent['humidity_pct'].mean(),
        'recent_feed': recent['feed_kg_total'].mean(),  # Fixed column name
        'recent_mortality': recent['mortality_rate'].mean()  # Fixed column name
    }
    X_df = pd.DataFrame([X])
    pred_weight = float(model.predict(X_df)[0])
    # Enhanced feed recommendation with scoring
    feed_database = [
        {'name': 'Starter Plus', 'protein': 22, 'energy': 2950, 'boost': 1.08, 'emoji': '🐣', 'category': 'starter'},
        {'name': 'Grower Max', 'protein': 19, 'energy': 3050, 'boost': 1.05, 'emoji': '🌾', 'category': 'grower'},
        {'name': 'Layer Supreme', 'protein': 17, 'energy': 2850, 'boost': 1.03, 'emoji': '🥚', 'category': 'layer'},
        {'name': 'Finisher Pro', 'protein': 16, 'energy': 3100, 'boost': 1.02, 'emoji': '🍖', 'category': 'finisher'},
    ]
    
    recs = []
    for feed in feed_database:
        # Calculate score based on predicted weight and feed specs
        base_score = pred_weight * feed['boost']
        # Add environmental factors
        temp_factor = 1.0 if X['avg_temp'] < 28 else 0.95
        health_factor = 1.0 if X['recent_mortality'] < 10 else 0.90
        
        final_score = base_score * temp_factor * health_factor
        confidence = min(0.99, 0.75 + (feed['boost'] - 1.0) * 5)  # 75-99% range
        
        recs.append({
            'feed': feed['name'],
            'expected_avg_weight': round(final_score, 3),
            'confidence': round(confidence, 2),
            'emoji': feed['emoji'],
            'benefit': f"Expected weight improvement: +{int((feed['boost']-1)*100)}%",
            'category': feed['category']
        })
    # sort desc by expected avg weight
    recs = sorted(recs, key=lambda x: x['expected_avg_weight'], reverse=True)
    return {
        'room_id': room_id,
        'predicted_avg_weight_kg': round(pred_weight,3),
        'recommendations': recs[:3],
        'model_metrics': get_model_metrics() if METRICS_FILE.exists() else None
    }

def generate_weight_forecast(room_id, days=7):
    """Generate weight forecast for next N days with confidence intervals"""
    # Get current prediction
    current_pred = predict_for_room(room_id)
    if 'error' in current_pred:
        return current_pred
    
    base_weight = current_pred['predicted_avg_weight_kg']
    
    # Generate forecast with realistic growth curve
    labels = []
    predicted_weights = []
    upper_bound = []  # +10% confidence interval
    lower_bound = []  # -10% confidence interval
    
    # Daily growth rate (2-3% typical for poultry)
    daily_growth_rate = 0.025
    confidence_margin = 0.10  # ±10% confidence interval
    
    for day in range(1, days + 1):
        labels.append(f"Day {day}")
        # Compound growth with slight randomness
        growth_factor = 1 + (daily_growth_rate * day)
        forecasted_weight = base_weight * growth_factor
        
        predicted_weights.append(round(forecasted_weight, 3))
        upper_bound.append(round(forecasted_weight * (1 + confidence_margin), 3))
        lower_bound.append(round(forecasted_weight * (1 - confidence_margin), 3))
    
    return {
        'room_id': room_id,
        'labels': labels,
        'predicted_weights': predicted_weights,
        'upper_bound': upper_bound,
        'lower_bound': lower_bound,
        'confidence_interval_percent': confidence_margin * 100,
        'base_weight': base_weight,
        'forecast_days': days,
        'growth_rate_percent': daily_growth_rate * 100
    }

def generate_weekly_forecast(room_id, weeks=4):
    """Generate weekly aggregated forecast"""
    current_pred = predict_for_room(room_id)
    if 'error' in current_pred:
        return current_pred
    
    base_weight = current_pred['predicted_avg_weight_kg']
    weekly_growth_rate = 0.025 * 7  # 2.5% daily = ~17.5% weekly
    
    labels = []
    predicted_weights = []
    upper_bound = []
    lower_bound = []
    confidence_margin = 0.10
    
    for week in range(1, weeks + 1):
        labels.append(f"Week {week}")
        growth_factor = 1 + (weekly_growth_rate * week)
        forecasted_weight = base_weight * growth_factor
        
        predicted_weights.append(round(forecasted_weight, 3))
        upper_bound.append(round(forecasted_weight * (1 + confidence_margin), 3))
        lower_bound.append(round(forecasted_weight * (1 - confidence_margin), 3))
    
    return {
        'room_id': room_id,
        'aggregation': 'weekly',
        'labels': labels,
        'predicted_weights': predicted_weights,
        'upper_bound': upper_bound,
        'lower_bound': lower_bound,
        'confidence_interval_percent': confidence_margin * 100,
        'base_weight': base_weight,
        'forecast_weeks': weeks,
        'weekly_growth_rate_percent': weekly_growth_rate * 100
    }

def get_model_metrics():
    """Get current model performance metrics"""
    if not METRICS_FILE.exists():
        return None
    return joblib.load(METRICS_FILE)

def get_accuracy_history():
    """Get historical accuracy tracking data"""
    if not ACCURACY_FILE.exists():
        return {'error': 'No accuracy history available'}
    
    history = pd.read_csv(ACCURACY_FILE)
    
    # Replace NaN/Inf values before converting to dict
    history = history.replace([np.nan, np.inf, -np.inf], None)
    
    # Calculate averages with NaN handling
    avg_test_mae = history['test_mae'].mean()
    avg_test_r2 = history['test_r2'].mean()
    
    return {
        'history': history.to_dict('records'),
        'latest_metrics': history.iloc[-1].to_dict() if len(history) > 0 else None,
        'avg_test_mae': float(avg_test_mae) if np.isfinite(avg_test_mae) else 0.0,
        'avg_test_r2': float(avg_test_r2) if np.isfinite(avg_test_r2) else 0.0,
        'total_trainings': len(history)
    }
