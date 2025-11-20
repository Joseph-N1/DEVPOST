"""
Phase 7: ML Predictions API Router
Endpoints for model training, predictions, and monitoring
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List, Optional
from datetime import datetime, timedelta, date as date_type
import logging

from database import get_db
from models.farm import Farm, Room, MLModel, Prediction
from ml.train import train_new_model
from ml.predict import MLPredictor, predict_for_farm
from ml.model_manager import ModelManager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ml", tags=["machine-learning"])


# ============================================================================
# MODEL MANAGEMENT ENDPOINTS
# ============================================================================

@router.post('/train')
async def train_model(
    model_type: str = Query(default='random_forest', description="Model type: random_forest, gradient_boosting"),
    db: AsyncSession = Depends(get_db)
):
    """
    Train a new ML model using available data.
    Auto-saves model and registers in database.
    
    Returns training metrics and model version.
    """
    try:
        logger.info(f"Starting model training: {model_type}")
        
        # Train model
        result = train_new_model(model_type=model_type)
        
        if not result.get('success'):
            raise HTTPException(status_code=500, detail=result.get('error', 'Training failed'))
        
        # Register model in database
        metrics = result['metrics']
        new_model = MLModel(
            name=f"{model_type}_{result['version']}",
            version=result['version'],
            model_type=model_type,
            model_path=result['paths']['model_path'],
            train_mae=metrics.get('train_mae'),
            test_mae=metrics.get('test_mae'),
            train_rmse=metrics.get('train_rmse'),
            test_rmse=metrics.get('test_rmse'),
            train_r2=metrics.get('train_r2'),
            test_r2=metrics.get('test_r2'),
            performance_score=metrics.get('performance_score'),
            n_samples=metrics.get('n_samples'),
            n_features=metrics.get('n_features'),
            hyperparameters={'model_type': model_type},
            is_active=True,
            status='deployed',
            description=f"Auto-trained {model_type} model",
            trained_by='system'
        )
        
        # Deactivate other models
        stmt = select(MLModel).where(MLModel.is_active == True)
        result_set = await db.execute(stmt)
        active_models = result_set.scalars().all()
        for model in active_models:
            model.is_active = False
        
        # Add new model
        db.add(new_model)
        await db.commit()
        await db.refresh(new_model)
        
        logger.info(f"Model registered in database: {new_model.version}")
        
        return {
            'success': True,
            'model_id': new_model.id,
            'version': new_model.version,
            'model_type': new_model.model_type,
            'performance_score': new_model.performance_score,
            'metrics': metrics,
            'message': 'Model trained and deployed successfully'
        }
        
    except Exception as e:
        logger.error(f"Model training failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/models')
async def list_models(db: AsyncSession = Depends(get_db)):
    """
    List all trained models with their performance metrics.
    """
    try:
        stmt = select(MLModel).order_by(MLModel.created_at.desc())
        result = await db.execute(stmt)
        models = result.scalars().all()
        
        return {
            'models': [model.to_dict() for model in models],
            'total_count': len(models),
            'active_model': next((m.to_dict() for m in models if m.is_active), None)
        }
    except Exception as e:
        logger.error(f"Failed to list models: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/models/{model_id}')
async def get_model_details(model_id: int, db: AsyncSession = Depends(get_db)):
    """
    Get detailed information about a specific model.
    """
    try:
        stmt = select(MLModel).where(MLModel.id == model_id)
        result = await db.execute(stmt)
        model = result.scalar_one_or_none()
        
        if not model:
            raise HTTPException(status_code=404, detail="Model not found")
        
        # Get prediction count
        pred_stmt = select(func.count(Prediction.id)).where(Prediction.model_id == model_id)
        pred_result = await db.execute(pred_stmt)
        prediction_count = pred_result.scalar()
        
        model_dict = model.to_dict()
        model_dict['prediction_count'] = prediction_count
        
        return model_dict
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get model details: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/models/active/info')
async def get_active_model_info(db: AsyncSession = Depends(get_db)):
    """
    Get information about the currently active/deployed model.
    """
    try:
        stmt = select(MLModel).where(MLModel.is_active == True).order_by(MLModel.created_at.desc())
        result = await db.execute(stmt)
        model = result.scalar_one_or_none()
        
        if not model:
            return {'error': 'No active model found', 'message': 'Train a model first'}
        
        return model.to_dict()
    except Exception as e:
        logger.error(f"Failed to get active model: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/models/{model_id}/activate')
async def activate_model(model_id: int, db: AsyncSession = Depends(get_db)):
    """
    Activate a specific model version for predictions.
    """
    try:
        # Get target model
        stmt = select(MLModel).where(MLModel.id == model_id)
        result = await db.execute(stmt)
        model = result.scalar_one_or_none()
        
        if not model:
            raise HTTPException(status_code=404, detail="Model not found")
        
        # Deactivate all models
        all_stmt = select(MLModel)
        all_result = await db.execute(all_stmt)
        all_models = all_result.scalars().all()
        for m in all_models:
            m.is_active = False
        
        # Activate target model
        model.is_active = True
        model.status = 'deployed'
        
        await db.commit()
        
        logger.info(f"Model {model.version} activated")
        
        return {
            'success': True,
            'model_id': model.id,
            'version': model.version,
            'message': f'Model {model.version} is now active'
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to activate model: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# PREDICTION ENDPOINTS
# ============================================================================

@router.post('/predict/room/{room_id}')
async def predict_room(
    room_id: int,
    horizons: List[int] = Query(default=[7, 14, 30], description="Forecast horizons in days"),
    save_predictions: bool = Query(default=True, description="Save predictions to database"),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate multi-horizon predictions for a specific room.
    
    Returns:
    - 7-day, 14-day, and 30-day forecasts
    - Confidence intervals
    - Anomaly warnings
    - Feed recommendations
    """
    try:
        # Get room from database
        room_stmt = select(Room).where(Room.id == room_id)
        room_result = await db.execute(room_stmt)
        room = room_result.scalar_one_or_none()
        
        if not room:
            raise HTTPException(status_code=404, detail=f"Room {room_id} not found")
        
        # Get active model
        model_stmt = select(MLModel).where(MLModel.is_active == True)
        model_result = await db.execute(model_stmt)
        active_model = model_result.scalar_one_or_none()
        
        if not active_model:
            raise HTTPException(status_code=503, detail="No active model available. Train a model first.")
        
        # Generate predictions using room_id string
        predictor = MLPredictor(model_version='latest')
        predictions = predictor.predict_multi_horizon(room.room_id, horizons=horizons)
        
        if 'error' in predictions:
            raise HTTPException(status_code=400, detail=predictions['error'])
        
        # Save predictions to database if requested
        if save_predictions and 'predictions' in predictions:
            saved_count = 0
            today = datetime.now().date()
            
            for horizon_key, horizon_data in predictions['predictions'].items():
                horizon_days = horizon_data['horizon_days']
                predicted_weights = horizon_data['predicted_weights']
                lower_bounds = horizon_data['lower_bound']
                upper_bounds = horizon_data['upper_bound']
                
                for i, (pred_weight, lower, upper) in enumerate(zip(predicted_weights, lower_bounds, upper_bounds)):
                    target_date = today + timedelta(days=i+1)
                    
                    # Check if prediction already exists
                    check_stmt = select(Prediction).where(
                        and_(
                            Prediction.room_id == room_id,
                            Prediction.target_date == target_date,
                            Prediction.metric_name == 'avg_weight_kg',
                            Prediction.model_id == active_model.id
                        )
                    )
                    check_result = await db.execute(check_stmt)
                    existing = check_result.scalar_one_or_none()
                    
                    if not existing:
                        new_prediction = Prediction(
                            farm_id=room.farm_id,
                            room_id=room_id,
                            model_id=active_model.id,
                            target_date=target_date,
                            metric_name='avg_weight_kg',
                            predicted_value=pred_weight,
                            confidence=0.90,
                            prediction_horizon=horizon_days,
                            upper_bound=upper,
                            lower_bound=lower,
                            prediction_type='forecast'
                        )
                        db.add(new_prediction)
                        saved_count += 1
            
            if saved_count > 0:
                await db.commit()
                logger.info(f"Saved {saved_count} predictions for room {room_id}")
        
        return {
            'room_id': room_id,
            'room_identifier': room.room_id,
            'farm_id': room.farm_id,
            'model_version': active_model.version,
            'model_performance': active_model.performance_score,
            'predictions': predictions.get('predictions', {}),
            'anomalies': predictions.get('anomalies', []),
            'recommendations': predictions.get('recommendations', []),
            'generated_at': datetime.now().isoformat(),
            'saved_to_database': save_predictions
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction failed for room {room_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/predict/farm/{farm_id}')
async def predict_farm(
    farm_id: int,
    horizons: List[int] = Query(default=[7, 14, 30]),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate predictions for all rooms in a farm.
    """
    try:
        # Get farm
        farm_stmt = select(Farm).where(Farm.id == farm_id)
        farm_result = await db.execute(farm_stmt)
        farm = farm_result.scalar_one_or_none()
        
        if not farm:
            raise HTTPException(status_code=404, detail=f"Farm {farm_id} not found")
        
        # Get all rooms
        rooms_stmt = select(Room).where(Room.farm_id == farm_id)
        rooms_result = await db.execute(rooms_stmt)
        rooms = rooms_result.scalars().all()
        
        if not rooms:
            raise HTTPException(status_code=404, detail=f"No rooms found for farm {farm_id}")
        
        # Get active model
        model_stmt = select(MLModel).where(MLModel.is_active == True)
        model_result = await db.execute(model_stmt)
        active_model = model_result.scalar_one_or_none()
        
        if not active_model:
            raise HTTPException(status_code=503, detail="No active model available")
        
        # Generate predictions for each room
        room_predictions = {}
        predictor = MLPredictor(model_version='latest')
        
        for room in rooms:
            try:
                pred = predictor.predict_multi_horizon(room.room_id, horizons=horizons)
                room_predictions[room.room_id] = {
                    'room_db_id': room.id,
                    'predictions': pred.get('predictions', {}),
                    'anomalies': pred.get('anomalies', []),
                    'recommendations': pred.get('recommendations', [])
                }
            except Exception as e:
                logger.warning(f"Prediction failed for room {room.room_id}: {e}")
                room_predictions[room.room_id] = {'error': str(e)}
        
        # Calculate summary
        weights_7d = []
        total_anomalies = 0
        
        for room_id, pred_data in room_predictions.items():
            if 'predictions' in pred_data and '7_day' in pred_data['predictions']:
                weights = pred_data['predictions']['7_day']['predicted_weights']
                if weights:
                    weights_7d.append((room_id, weights[-1]))
            if 'anomalies' in pred_data:
                total_anomalies += len(pred_data['anomalies'])
        
        summary = {
            'total_rooms': len(rooms),
            'successful_predictions': len([p for p in room_predictions.values() if 'error' not in p]),
            'total_anomalies': total_anomalies,
            'avg_predicted_weight_7d': round(sum([w[1] for w in weights_7d]) / len(weights_7d), 3) if weights_7d else 0,
            'best_performing_room': max(weights_7d, key=lambda x: x[1])[0] if weights_7d else None,
            'worst_performing_room': min(weights_7d, key=lambda x: x[1])[0] if weights_7d else None
        }
        
        return {
            'farm_id': farm_id,
            'farm_name': farm.name,
            'model_version': active_model.version,
            'room_predictions': room_predictions,
            'summary': summary,
            'generated_at': datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Farm prediction failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/predictions/history')
async def get_prediction_history(
    farm_id: Optional[int] = Query(default=None),
    room_id: Optional[int] = Query(default=None),
    metric_name: str = Query(default='avg_weight_kg'),
    days: int = Query(default=30, ge=1, le=90),
    db: AsyncSession = Depends(get_db)
):
    """
    Get historical predictions from the database.
    """
    try:
        # Build query
        stmt = select(Prediction).where(Prediction.metric_name == metric_name)
        
        if farm_id:
            stmt = stmt.where(Prediction.farm_id == farm_id)
        if room_id:
            stmt = stmt.where(Prediction.room_id == room_id)
        
        # Date filter
        cutoff_date = datetime.now().date() - timedelta(days=days)
        stmt = stmt.where(Prediction.created_at >= cutoff_date)
        
        stmt = stmt.order_by(Prediction.target_date.desc()).limit(1000)
        
        result = await db.execute(stmt)
        predictions = result.scalars().all()
        
        return {
            'predictions': [p.to_dict() for p in predictions],
            'total_count': len(predictions),
            'filters': {
                'farm_id': farm_id,
                'room_id': room_id,
                'metric_name': metric_name,
                'days': days
            }
        }
    except Exception as e:
        logger.error(f"Failed to get prediction history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# MODEL MONITORING ENDPOINTS
# ============================================================================

@router.get('/monitor/status')
async def get_model_status(db: AsyncSession = Depends(get_db)):
    """
    Get overall ML system status and health.
    """
    try:
        # Get active model
        model_stmt = select(MLModel).where(MLModel.is_active == True)
        model_result = await db.execute(model_stmt)
        active_model = model_result.scalar_one_or_none()
        
        # Get total models count
        count_stmt = select(func.count(MLModel.id))
        count_result = await db.execute(count_stmt)
        total_models = count_result.scalar()
        
        # Get prediction count (last 7 days)
        week_ago = datetime.now() - timedelta(days=7)
        pred_stmt = select(func.count(Prediction.id)).where(Prediction.created_at >= week_ago)
        pred_result = await db.execute(pred_stmt)
        predictions_last_week = pred_result.scalar()
        
        # Validate model files
        model_validation = {'valid': False, 'message': 'No active model'}
        if active_model:
            validation = ModelManager.validate_model('latest')
            model_validation = {
                'valid': validation['valid'],
                'message': validation['message'],
                'checks': validation['checks']
            }
        
        status = {
            'system_status': 'operational' if active_model and model_validation['valid'] else 'degraded',
            'active_model': active_model.to_dict() if active_model else None,
            'model_validation': model_validation,
            'statistics': {
                'total_models_trained': total_models,
                'predictions_last_week': predictions_last_week
            },
            'timestamp': datetime.now().isoformat()
        }
        
        return status
        
    except Exception as e:
        logger.error(f"Failed to get model status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/monitor/performance')
async def get_performance_metrics(db: AsyncSession = Depends(get_db)):
    """
    Get performance metrics across all models.
    """
    try:
        stmt = select(MLModel).order_by(MLModel.created_at.desc())
        result = await db.execute(stmt)
        models = result.scalars().all()
        
        performance_data = []
        for model in models:
            performance_data.append({
                'version': model.version,
                'trained_at': model.created_at.isoformat(),
                'performance_score': model.performance_score,
                'test_mae': model.test_mae,
                'test_r2': model.test_r2,
                'is_active': model.is_active
            })
        
        # Calculate trends
        if len(performance_data) >= 2:
            latest_score = performance_data[0]['performance_score'] or 0
            previous_score = performance_data[1]['performance_score'] or 0
            score_trend = latest_score - previous_score
        else:
            score_trend = 0
        
        return {
            'models': performance_data,
            'trends': {
                'performance_score_change': round(score_trend, 2),
                'improving': score_trend > 0
            },
            'best_model': max(performance_data, key=lambda x: x['performance_score'] or 0) if performance_data else None
        }
        
    except Exception as e:
        logger.error(f"Failed to get performance metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))
