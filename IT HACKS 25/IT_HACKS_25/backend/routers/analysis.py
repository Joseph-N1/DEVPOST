
from fastapi import APIRouter, Query
from services.csv_parser import get_rooms, compute_kpis, load_sample_df
from services.ai_analyzer import (
    predict_for_room, 
    generate_weight_forecast, 
    generate_weekly_forecast,
    get_model_metrics,
    get_accuracy_history
)

router = APIRouter()

@router.get('/rooms')
def list_rooms():
    rooms = get_rooms()
    return {'rooms': rooms}

@router.get('/rooms/{room_id}/kpis')
def room_kpis(room_id: str):
    kpis = compute_kpis(room_id)
    return kpis

@router.get('/rooms/{room_id}/predict')
def room_predict(room_id: str):
    pred = predict_for_room(room_id)
    return pred

@router.get('/rooms/{room_id}/forecast')
def room_forecast(room_id: str, days: int = Query(default=7, ge=1, le=30)):
    """Generate weight forecast for the next N days with confidence intervals"""
    forecast = generate_weight_forecast(room_id, days)
    return forecast

@router.get('/rooms/{room_id}/forecast/weekly')
def room_weekly_forecast(room_id: str, weeks: int = Query(default=4, ge=1, le=12)):
    """Generate weekly aggregated weight forecast"""
    forecast = generate_weekly_forecast(room_id, weeks)
    return forecast

@router.get('/model/metrics')
def model_metrics():
    """Get current model performance metrics"""
    metrics = get_model_metrics()
    if metrics is None:
        return {'error': 'No model metrics available. Train model first.'}
    return metrics

@router.get('/model/accuracy-history')
def accuracy_history():
    """Get historical accuracy tracking data"""
    return get_accuracy_history()

@router.get('/sample')
def sample_data():
    df = load_sample_df()
    return {'rows': len(df)}
