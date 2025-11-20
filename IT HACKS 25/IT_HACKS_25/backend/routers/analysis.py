"""
Analysis Router - Database Powered

All analytics endpoints now query PostgreSQL directly instead of CSV files.
Maintains backward compatibility with existing API contracts.
"""

from fastapi import APIRouter, Query, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.sql import text
from database import get_db
from models.farm import Farm, Room, Metric
from cache import cache_analytics, get_cached_analytics
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, date
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get('/farms')
async def list_farms(db: AsyncSession = Depends(get_db)):
    """
    List all available farms.
    
    Returns:
        {"farms": [{"id": int, "name": str, "created_at": str, "rooms_count": int}]}
    """
    result = await db.execute(
        select(Farm.id, Farm.name, Farm.created_at, func.count(Room.id).label('rooms_count'))
        .outerjoin(Room, Room.farm_id == Farm.id)
        .group_by(Farm.id, Farm.name, Farm.created_at)
        .order_by(desc(Farm.created_at))
    )
    
    farms = []
    for row in result:
        farms.append({
            "id": row.id,
            "name": row.name,
            "created_at": row.created_at.isoformat(),
            "rooms_count": row.rooms_count
        })
    
    return {"farms": farms}


@router.get('/rooms')
async def list_rooms(
    farm_id: Optional[int] = Query(default=None, description="Filter by farm ID"),
    db: AsyncSession = Depends(get_db)
):
    """
    List all rooms (optionally filtered by farm).
    
    Backward compatible: returns room_id strings matching CSV-based system.
    """
    query = select(Room.id, Room.room_id, Room.farm_id, Room.birds_start, Farm.name.label('farm_name'))
    query = query.join(Farm, Farm.id == Room.farm_id)
    
    if farm_id:
        query = query.filter(Room.farm_id == farm_id)
    
    result = await db.execute(query.order_by(Room.id))
    
    rooms = []
    for row in result:
        rooms.append({
            "id": row.id,
            "room_id": row.room_id,
            "farm_id": row.farm_id,
            "farm_name": row.farm_name,
            "birds_start": row.birds_start
        })
    
    return {"rooms": rooms}


@router.get('/rooms/{room_id}/kpis')
async def room_kpis(
    room_id: int,
    start_date: Optional[str] = Query(default=None),
    end_date: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db)
):
    """
    Compute KPIs for a specific room.
    
    KPIs include:
    - Total eggs produced
    - Average weight
    - Average FCR
    - Average mortality rate
    - Average production rate
    - Total revenue/cost/profit
    - Anomaly count
    
    Args:
        room_id: Database room ID
        start_date: Optional start date (YYYY-MM-DD)
        end_date: Optional end date (YYYY-MM-DD)
    """
    # Check cache
    cache_key = f"kpis_{room_id}_{start_date}_{end_date}"
    cached = await get_cached_analytics(room_id, cache_key)
    if cached:
        return cached
    
    # Build query with date filters
    query = select(Metric).filter(Metric.room_id == room_id)
    
    if start_date:
        query = query.filter(Metric.date >= datetime.fromisoformat(start_date).date())
    if end_date:
        query = query.filter(Metric.date <= datetime.fromisoformat(end_date).date())
    
    result = await db.execute(query.order_by(Metric.date))
    metrics = result.scalars().all()
    
    if not metrics:
        raise HTTPException(status_code=404, detail=f"No data found for room {room_id}")
    
    # Aggregate KPIs
    total_eggs = sum(m.eggs_produced for m in metrics if m.eggs_produced)
    avg_weight = sum(m.avg_weight_kg for m in metrics if m.avg_weight_kg) / len([m for m in metrics if m.avg_weight_kg]) if any(m.avg_weight_kg for m in metrics) else 0
    avg_fcr = sum(m.fcr for m in metrics if m.fcr) / len([m for m in metrics if m.fcr]) if any(m.fcr for m in metrics) else 0
    avg_mortality = sum(m.mortality_rate for m in metrics if m.mortality_rate) / len([m for m in metrics if m.mortality_rate]) if any(m.mortality_rate for m in metrics) else 0
    avg_production = sum(m.production_rate for m in metrics if m.production_rate) / len([m for m in metrics if m.production_rate]) if any(m.production_rate for m in metrics) else 0
    
    total_revenue = sum(m.revenue for m in metrics if m.revenue) if any(m.revenue for m in metrics) else 0
    total_cost = sum(m.cost for m in metrics if m.cost) if any(m.cost for m in metrics) else 0
    total_profit = sum(m.profit for m in metrics if m.profit) if any(m.profit for m in metrics) else 0
    
    anomaly_count = sum(1 for m in metrics if m.anomaly_detected)
    
    kpis = {
        "room_id": room_id,
        "date_range": {
            "start": metrics[0].date.isoformat() if metrics else None,
            "end": metrics[-1].date.isoformat() if metrics else None
        },
        "total_eggs_produced": total_eggs,
        "avg_weight_kg": round(avg_weight, 2),
        "avg_fcr": round(avg_fcr, 3),
        "avg_mortality_rate": round(avg_mortality, 2),
        "avg_production_rate": round(avg_production, 2),
        "total_revenue": round(total_revenue, 2),
        "total_cost": round(total_cost, 2),
        "total_profit": round(total_profit, 2),
        "anomaly_count": anomaly_count,
        "data_points": len(metrics)
    }
    
    # Cache result
    await cache_analytics(room_id, cache_key, kpis)
    
    return kpis


@router.get('/rooms/{room_id}/metrics')
async def room_metrics(
    room_id: int,
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """
    Get raw metrics for a room with pagination.
    
    Returns time-series data for charting.
    """
    query = select(Metric).filter(Metric.room_id == room_id).order_by(desc(Metric.date))
    query = query.limit(limit).offset(offset)
    
    result = await db.execute(query)
    metrics = result.scalars().all()
    
    if not metrics:
        raise HTTPException(status_code=404, detail=f"No data found for room {room_id}")
    
    return {
        "room_id": room_id,
        "metrics": [m.to_dict() for m in metrics],
        "count": len(metrics)
    }


@router.get('/rooms/{room_id}/predict')
async def room_predict(room_id: int, db: AsyncSession = Depends(get_db)):
    """
    ML prediction endpoint - delegates to AI analyzer.
    
    Converts database room ID to room_id string for ML model compatibility.
    """
    # Get room to find its room_id string
    result = await db.execute(select(Room).filter(Room.id == room_id))
    room = result.scalar_one_or_none()
    
    if not room:
        raise HTTPException(status_code=404, detail=f"Room {room_id} not found")
    
    # Use room_id string for ML prediction
    from services.ai_analyzer import predict_for_room
    
    try:
        pred = predict_for_room(room.room_id)
        if isinstance(pred, dict) and pred.get('error'):
            # Graceful fallback: return basic prediction structure
            return {
                "room_id": room.room_id,
                "predicted_avg_weight_kg": None,
                "recommendations": [],
                "error": "ML model requires CSV data for predictions. Feature coming in Phase 7.",
                "note": "Upload CSV files to enable ML predictions"
            }
        return pred
    except Exception as e:
        logger.warning(f"Prediction unavailable for room {room_id} ({room.room_id}): {e}")
        # Return graceful fallback instead of 500 error
        return {
            "room_id": room.room_id,
            "predicted_avg_weight_kg": None,
            "recommendations": [],
            "error": "ML predictions temporarily unavailable",
            "detail": str(e)
        }


@router.get('/rooms/{room_id}/forecast')
async def room_forecast(
    room_id: int,
    days: int = Query(default=7, ge=1, le=30),
    db: AsyncSession = Depends(get_db)
):
    """Generate weight forecast for the next N days with confidence intervals"""
    # Get room to find its room_id string
    result = await db.execute(select(Room).filter(Room.id == room_id))
    room = result.scalar_one_or_none()
    
    if not room:
        raise HTTPException(status_code=404, detail=f"Room {room_id} not found")
    
    from services.ai_analyzer import generate_weight_forecast
    
    try:
        forecast = generate_weight_forecast(room.room_id, days)
        return forecast
    except Exception as e:
        logger.error(f"Forecast error for room {room_id} ({room.room_id}): {e}")
        raise HTTPException(status_code=500, detail=f"Forecast failed: {str(e)}")


@router.get('/rooms/{room_id}/forecast/weekly')
async def room_weekly_forecast(
    room_id: int,
    weeks: int = Query(default=4, ge=1, le=12),
    db: AsyncSession = Depends(get_db)
):
    """Generate weekly aggregated weight forecast"""
    # Get room to find its room_id string
    result = await db.execute(select(Room).filter(Room.id == room_id))
    room = result.scalar_one_or_none()
    
    if not room:
        raise HTTPException(status_code=404, detail=f"Room {room_id} not found")
    
    from services.ai_analyzer import generate_weekly_forecast
    
    try:
        forecast = generate_weekly_forecast(room.room_id, weeks)
        return forecast
    except Exception as e:
        logger.error(f"Weekly forecast error for room {room_id} ({room.room_id}): {e}")
        raise HTTPException(status_code=500, detail=f"Weekly forecast failed: {str(e)}")


@router.get('/model/metrics')
async def model_metrics():
    """Get current model performance metrics"""
    from services.ai_analyzer import get_model_metrics
    
    metrics = get_model_metrics()
    if metrics is None:
        return {'error': 'No model metrics available. Train model first.'}
    return metrics


@router.get('/model/accuracy-history')
async def accuracy_history():
    """Get historical accuracy tracking data"""
    from services.ai_analyzer import get_accuracy_history
    return get_accuracy_history()


@router.get('/weekly')
async def weekly_aggregation(
    farm_id: Optional[int] = Query(default=None),
    db: AsyncSession = Depends(get_db)
):
    """
    Get weekly aggregated metrics for all rooms in a farm.
    
    Groups metrics by ISO week and calculates averages.
    """
    # Check cache
    cache_key = f"weekly_{farm_id}" if farm_id else "weekly_all"
    cached = await get_cached_analytics(farm_id or 0, cache_key)
    if cached:
        return cached
    
    # Build query
    query = select(
        Room.room_id,
        func.extract('year', Metric.date).label('year'),
        func.extract('week', Metric.date).label('week'),
        func.avg(Metric.eggs_produced).label('avg_eggs'),
        func.avg(Metric.avg_weight_kg).label('avg_weight'),
        func.avg(Metric.fcr).label('avg_fcr'),
        func.avg(Metric.mortality_rate).label('avg_mortality'),
        func.avg(Metric.production_rate).label('avg_production'),
        func.sum(Metric.revenue).label('total_revenue'),
        func.sum(Metric.cost).label('total_cost'),
        func.sum(Metric.profit).label('total_profit')
    ).select_from(Metric).join(Room, Room.id == Metric.room_id)
    
    if farm_id:
        query = query.filter(Room.farm_id == farm_id)
    
    query = query.group_by(Room.room_id, 'year', 'week').order_by('year', 'week', Room.room_id)
    
    result = await db.execute(query)
    
    weekly_data = []
    for row in result:
        weekly_data.append({
            "room_id": row.room_id,
            "year": int(row.year),
            "week": int(row.week),
            "avg_eggs": round(float(row.avg_eggs), 2) if row.avg_eggs else 0,
            "avg_weight": round(float(row.avg_weight), 2) if row.avg_weight else 0,
            "avg_fcr": round(float(row.avg_fcr), 3) if row.avg_fcr else 0,
            "avg_mortality": round(float(row.avg_mortality), 2) if row.avg_mortality else 0,
            "avg_production": round(float(row.avg_production), 2) if row.avg_production else 0,
            "total_revenue": round(float(row.total_revenue), 2) if row.total_revenue else 0,
            "total_cost": round(float(row.total_cost), 2) if row.total_cost else 0,
            "total_profit": round(float(row.total_profit), 2) if row.total_profit else 0
        })
    
    # Cache result
    await cache_analytics(farm_id or 0, cache_key, weekly_data)
    
    return {"weekly_data": weekly_data}


@router.get('/weekly/comparison')
async def weekly_comparison(
    room_id: Optional[int] = Query(default=None),
    db: AsyncSession = Depends(get_db)
):
    """
    Get week-over-week comparison for specific room or all rooms.
    
    Compares current week vs previous week for key metrics.
    """
    # Get current week
    today = date.today()
    current_week = today.isocalendar()[1]
    current_year = today.year
    
    # Query current week
    current_query = select(
        Room.room_id,
        func.avg(Metric.eggs_produced).label('eggs'),
        func.avg(Metric.avg_weight_kg).label('weight'),
        func.avg(Metric.fcr).label('fcr'),
        func.avg(Metric.mortality_rate).label('mortality')
    ).select_from(Metric).join(Room, Room.id == Metric.room_id).filter(
        func.extract('year', Metric.date) == current_year,
        func.extract('week', Metric.date) == current_week
    )
    
    if room_id:
        current_query = current_query.filter(Room.id == room_id)
    
    current_query = current_query.group_by(Room.room_id)
    current_result = await db.execute(current_query)
    
    # Query previous week
    prev_query = select(
        Room.room_id,
        func.avg(Metric.eggs_produced).label('eggs'),
        func.avg(Metric.avg_weight_kg).label('weight'),
        func.avg(Metric.fcr).label('fcr'),
        func.avg(Metric.mortality_rate).label('mortality')
    ).select_from(Metric).join(Room, Room.id == Metric.room_id).filter(
        func.extract('year', Metric.date) == current_year,
        func.extract('week', Metric.date) == current_week - 1
    )
    
    if room_id:
        prev_query = prev_query.filter(Room.id == room_id)
    
    prev_query = prev_query.group_by(Room.room_id)
    prev_result = await db.execute(prev_query)
    
    # Build comparison
    current_data = {row.room_id: dict(row._mapping) for row in current_result}
    prev_data = {row.room_id: dict(row._mapping) for row in prev_result}
    
    comparisons = []
    for room_id_str in current_data:
        current = current_data[room_id_str]
        previous = prev_data.get(room_id_str, {})
        
        def calc_change(curr, prev):
            if prev and prev != 0:
                return round(((curr - prev) / prev) * 100, 2)
            return 0
        
        comparisons.append({
            "room_id": room_id_str,
            "current_week": {
                "eggs": round(float(current['eggs']), 2) if current['eggs'] else 0,
                "weight": round(float(current['weight']), 2) if current['weight'] else 0,
                "fcr": round(float(current['fcr']), 3) if current['fcr'] else 0,
                "mortality": round(float(current['mortality']), 2) if current['mortality'] else 0
            },
            "previous_week": {
                "eggs": round(float(previous.get('eggs', 0)), 2) if previous.get('eggs') else 0,
                "weight": round(float(previous.get('weight', 0)), 2) if previous.get('weight') else 0,
                "fcr": round(float(previous.get('fcr', 0)), 3) if previous.get('fcr') else 0,
                "mortality": round(float(previous.get('mortality', 0)), 2) if previous.get('mortality') else 0
            },
            "change_pct": {
                "eggs": calc_change(current.get('eggs', 0), previous.get('eggs', 0)),
                "weight": calc_change(current.get('weight', 0), previous.get('weight', 0)),
                "fcr": calc_change(current.get('fcr', 0), previous.get('fcr', 0)),
                "mortality": calc_change(current.get('mortality', 0), previous.get('mortality', 0))
            }
        })
    
    return {"comparisons": comparisons, "current_week": current_week, "current_year": current_year}
