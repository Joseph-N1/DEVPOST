
import pandas as pd
import joblib
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split

MODEL_FILE = Path(__file__).resolve().parent.parent / 'models' / 'rf_model.joblib'
DATA_STORE = Path(__file__).resolve().parent.parent.parent / 'data' / 'metrics_store.csv'

def train_example():
    # Very small example trainer for demo
    if not Path(DATA_STORE).exists():
        return None
    df = pd.read_csv(DATA_STORE, parse_dates=['date'])
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
            'recent_feed': [g['feed_consumed_kg'].mean()],
            'recent_mortality': [g['mortality_count'].sum()]
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
    MODEL_FILE.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_FILE)
    return {'trained': True, 'modelsaved': str(MODEL_FILE)}

def predict_for_room(room_id):
    # If no model exists, attempt to train a tiny model
    if not MODEL_FILE.exists():
        train_example()
    if not MODEL_FILE.exists():
        return {'error': 'no model available'}
    model = joblib.load(MODEL_FILE)
    # load latest data for room
    if not Path(DATA_STORE).exists():
        return {'error': 'no data'}
    df = pd.read_csv(DATA_STORE, parse_dates=['date'])
    room = df[df['room_id']==room_id].sort_values('date')
    if room.empty:
        return {'error': 'room not found'}
    recent = room.tail(20)
    X = {
        'avg_temp': recent['temperature_c'].mean(),
        'avg_hum': recent['humidity_pct'].mean(),
        'recent_feed': recent['feed_consumed_kg'].mean(),
        'recent_mortality': recent['mortality_count'].sum()
    }
    X_df = pd.DataFrame([X])
    pred_weight = float(model.predict(X_df)[0])
    # Simple rule-based feed recommendation (demo)
    feed_options = ['Feed A','Feed B','Feed C','Feed D']
    recs = []
    for f in feed_options:
        score = 0.0
        if 'A' in f:
            score = pred_weight * 1.01
        elif 'B' in f:
            score = pred_weight * 1.02
        elif 'C' in f:
            score = pred_weight * 0.99
        else:
            score = pred_weight * 1.00
        recs.append({'feed': f, 'expected_avg_weight': round(score,3)})
    # sort desc by expected avg weight
    recs = sorted(recs, key=lambda x: x['expected_avg_weight'], reverse=True)
    return {
        'room_id': room_id,
        'predicted_avg_weight_kg': round(pred_weight,3),
        'recommendations': recs[:3]
    }
