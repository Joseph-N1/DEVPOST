
from fastapi import APIRouter
from services.csv_parser import get_rooms, compute_kpis, load_sample_df
from services.ai_analyzer import predict_for_room

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

@router.get('/sample')
def sample_data():
    df = load_sample_df()
    return {'rows': len(df)}
