
import pandas as pd
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent.parent / 'data'
DATA_DIR.mkdir(parents=True, exist_ok=True)
STORE_FILE = DATA_DIR / 'metrics_store.csv'

EXPECTED_COLUMNS = ['farm_id','room_id','date','age_days','temperature_c','humidity_pct','ammonia_ppm','feed_consumed_kg','feed_type','vitamins','disinfectant_used','mortality_count','egg_count','avg_weight_kg','bird_count']

def parse_and_store(df: pd.DataFrame):
    # Basic validation
    missing = [c for c in EXPECTED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"Missing columns: {missing}")
    # Append to store CSV
    df[EXPECTED_COLUMNS].to_csv(STORE_FILE, mode='a', header=not STORE_FILE.exists(), index=False)
    return len(df)

def load_store():
    if STORE_FILE.exists():
        return pd.read_csv(STORE_FILE, parse_dates=['date'])
    return pd.DataFrame(columns=EXPECTED_COLUMNS)

def get_rooms():
    df = load_store()
    return sorted(df['room_id'].unique().tolist())

def compute_kpis(room_id):
    df = load_store()
    if df.empty:
        return {'error': 'no data'}
    r = df[df['room_id']==room_id].sort_values('date')
    if r.empty:
        return {'error': 'room not found'}
    total_feed = r['feed_consumed_kg'].sum()
    # approximate total weight gain: sum of (avg_weight * bird_count) differences
    r = r.sort_values('date')
    r['total_weight'] = r['avg_weight_kg'] * r['bird_count']
    weight_gain = r['total_weight'].iloc[-1] - r['total_weight'].iloc[0] if len(r)>=2 else r['total_weight'].iloc[-1]
    fcr = None
    if weight_gain > 0:
        fcr = total_feed / weight_gain
    mortality = r['mortality_count'].sum()
    mortality_rate = mortality / r['bird_count'].iloc[0] if len(r)>=1 and r['bird_count'].iloc[0]>0 else None
    avg_weight = r['avg_weight_kg'].mean()
    return {
        'room_id': room_id,
        'total_feed_kg': float(total_feed),
        'weight_gain_kg': float(weight_gain if weight_gain is not None else 0),
        'fcr': float(fcr) if fcr is not None else None,
        'mortality_count': int(mortality),
        'mortality_rate': float(mortality_rate) if mortality_rate is not None else None,
        'avg_weight_kg': float(avg_weight)
    }

def load_sample_df():
    sample = Path(__file__).resolve().parent.parent.parent / 'sample_data' / 'sample_upload.csv'
    if sample.exists():
        return pd.read_csv(sample)
    return pd.DataFrame()
