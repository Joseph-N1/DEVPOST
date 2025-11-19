"""
AI Intelligence API Routes
Provides endpoints for AI recommendations, anomaly detection, reports, and metric explanations
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from services.ai_intelligence import analyze_csv_data
from ml.anomaly_detector import detect_anomalies
from services.farm_report_generator import generate_weekly_report

router = APIRouter(prefix='/ai', tags=['AI Intelligence'])

@router.get('/analyze')
async def get_ai_analysis(file_path: Optional[str] = None):
    """
    Get comprehensive AI analysis including:
    - Feed optimization suggestions
    - Mortality risk analysis
    - Environmental warnings
    - Room-specific recommendations
    - Weekly health summary
    """
    try:
        result = analyze_csv_data(file_path)
        
        if 'error' in result:
            raise HTTPException(status_code=404, detail=result['error'])
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/anomalies')
async def get_anomalies(
    file_path: Optional[str] = None,
    sensitivity: float = Query(default=0.1, ge=0.05, le=0.2, description="Anomaly detection sensitivity (0.05-0.2)")
):
    """
    Detect anomalies in farm data using Z-score and Isolation Forest
    
    Returns anomalies with:
    - Severity level (critical/high/medium)
    - Human-readable explanation
    - Recommended corrective actions
    - Detection method used
    """
    try:
        result = detect_anomalies(file_path, sensitivity)
        
        if 'error' in result:
            raise HTTPException(status_code=404, detail=result['error'])
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/report/weekly')
async def get_weekly_report(file_path: Optional[str] = None):
    """
    Generate comprehensive AI-powered weekly farm manager report
    
    Includes:
    - Farm overview with trends
    - Room rankings by KPIs
    - KPI trend analysis (4 weeks)
    - Anomalies summary
    - Top recommendations
    - 7-day forecast for all rooms
    - Prioritized action items
    - Executive summary
    """
    try:
        result = generate_weekly_report(file_path)
        
        if 'error' in result:
            raise HTTPException(status_code=404, detail=result['error'])
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/explain-metric')
async def explain_metric(
    metric: str = Query(..., description="Metric name (e.g., 'eggs_produced', 'mortality_rate')"),
    value: float = Query(..., description="Current metric value"),
    change: float = Query(default=0.0, description="Percentage change from previous period"),
    room_id: Optional[str] = None
):
    """
    Get AI-generated explanation for a specific metric
    
    Explains:
    - What the metric means
    - Why it changed
    - What actions to take next
    
    Used for dynamic tooltips in the UI
    """
    try:
        explanations = {
            'eggs_produced': {
                'meaning': 'Number of eggs collected per day. Target: 200-300 eggs per day for mature layers.',
                'increase': 'Production increased due to: optimal nutrition, good health, proper lighting (14-16 hours), or birds reaching peak laying age (22-26 weeks).',
                'decrease': 'Production decreased possibly due to: stress, poor nutrition, disease, temperature extremes, or aging birds.',
                'action_increase': 'Maintain current practices. Monitor for signs of egg binding or calcium deficiency.',
                'action_decrease': 'Check feed quality, lighting schedule, and bird health. Ensure adequate calcium and protein.'
            },
            'mortality_rate': {
                'meaning': 'Percentage of birds that died. Target: <1.0% per week is excellent, <2.5% is acceptable.',
                'increase': 'Mortality increased - possible causes: disease outbreak, temperature stress, poor ventilation, contaminated feed/water, or predators.',
                'decrease': 'Mortality decreased - improved management practices, better biosecurity, or environmental conditions.',
                'action_increase': '🛑 URGENT: Veterinary consultation required. Review biosecurity, ventilation, water quality, and isolate sick birds.',
                'action_decrease': 'Continue current excellent practices. Maintain biosecurity protocols.'
            },
            'avg_weight_kg': {
                'meaning': 'Average weight per bird in kilograms. Target varies by age: broilers 2-3kg at 6-8 weeks, layers 1.5-2kg.',
                'increase': 'Weight gain indicates good nutrition, health, and growth conditions. Expected in young birds.',
                'decrease': 'Weight loss suggests: disease, insufficient feed, poor feed quality, stress, or parasites.',
                'action_increase': 'Monitor body condition. Ensure balanced growth (not too rapid which can cause leg problems).',
                'action_decrease': 'Check feed quality and quantity. Screen for parasites. Review health status with vet.'
            },
            'fcr': {
                'meaning': 'Feed Conversion Ratio - kg of feed per kg of weight gain. Target: 1.5-2.0 is excellent, 2.0-2.5 is good.',
                'increase': 'FCR increased (worse efficiency): birds consuming more feed for same weight gain. Causes: poor feed quality, disease, stress, or digestive issues.',
                'decrease': 'FCR decreased (better efficiency): improved feed utilization. Good management and bird health.',
                'action_increase': 'Review feed formulation and quality. Check for disease. Reduce feed wastage. Consider enzyme supplements.',
                'action_decrease': 'Maintain current practices. Document successful feed strategy for future reference.'
            },
            'temperature_c': {
                'meaning': 'Ambient temperature in Celsius. Optimal range: 18-24°C for adult birds, 30-35°C for chicks (first week).',
                'increase': 'Temperature rising: risk of heat stress. Birds will pant, reduce feed intake, and egg production may drop.',
                'decrease': 'Temperature dropping: birds will huddle, consume more energy for warmth, growth/production slows.',
                'action_increase': '⚠️ Increase ventilation, provide cool water, reduce stocking density if possible. Consider misting.',
                'action_decrease': 'Increase heating. Check for drafts. Provide extra bedding. Reduce ventilation temporarily.'
            },
            'humidity_pct': {
                'meaning': 'Relative humidity percentage. Optimal range: 50-70%. Too high or low affects bird health.',
                'increase': 'Humidity rising: risk of respiratory disease, wet litter, ammonia buildup. Poor air quality.',
                'decrease': 'Humidity dropping: dusty conditions, respiratory irritation, increased water consumption.',
                'action_increase': 'Increase ventilation. Check for water leaks. Remove wet litter. Risk of disease - monitor closely.',
                'action_decrease': 'Add humidity through misting. Check water system. Reduce ventilation slightly.'
            },
            'feed_kg_total': {
                'meaning': 'Total feed consumed in kilograms. Varies by flock size and bird age. Monitor for appetite changes.',
                'increase': 'Feed consumption increased: normal for growing birds, or may indicate stress eating or feed wastage.',
                'decrease': 'Feed consumption decreased: major concern. May indicate disease, poor feed quality, or heat stress.',
                'action_increase': 'Check for wastage. Review feeder design. Monitor bird behavior.',
                'action_decrease': '⚠️ Investigate immediately. Check feed freshness, bird health, and environmental conditions.'
            },
            'water_liters_total': {
                'meaning': 'Total water consumed in liters. Birds drink 1.5-2x their feed weight in water. Critical for health.',
                'increase': 'Water consumption increased: normal in hot weather, or may indicate disease or medication in water.',
                'decrease': 'Water consumption decreased: 🛑 CRITICAL - check water system immediately. Dehydration risk.',
                'action_increase': 'Monitor for leaks. High consumption in heat is normal. Check for disease if excessive.',
                'action_decrease': '🛑 URGENT: Check water lines for blockages. Verify water availability. Dehydration causes rapid death.'
            }
        }
        
        # Get explanation for the metric
        if metric not in explanations:
            return {
                'metric': metric,
                'meaning': f"{metric.replace('_', ' ').title()} - specific explanation not available",
                'explanation': f"Current value: {value}",
                'action': "Monitor trends and consult documentation for optimal ranges"
            }
        
        exp = explanations[metric]
        
        # Determine change direction
        if abs(change) < 2:
            change_text = exp['meaning']
            action_text = f"Current value: {value}. Stable trend. Continue monitoring."
        elif change > 0:
            change_text = exp['increase']
            action_text = exp['action_increase']
        else:
            change_text = exp['decrease']
            action_text = exp['action_decrease']
        
        return {
            'metric': metric.replace('_', ' ').title(),
            'room_id': room_id,
            'current_value': value,
            'change_percent': change,
            'meaning': exp['meaning'],
            'explanation': change_text,
            'recommended_action': action_text
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/health')
async def ai_health_check():
    """Health check endpoint for AI services"""
    return {
        'status': 'healthy',
        'services': {
            'ai_intelligence': 'operational',
            'anomaly_detection': 'operational',
            'report_generator': 'operational',
            'metric_explainer': 'operational'
        }
    }
