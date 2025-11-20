# Phase 7: Advanced AI Prediction Engine

**Implementation Date:** November 20, 2025  
**Status:** ✅ Complete  
**Version:** 7.0.0

---

## 🎯 Executive Summary

Phase 7 transforms the ECO FARM platform into a production-grade ML-powered predictive system with:

- **Multi-horizon forecasting** (7/14/30-day predictions)
- **Automated model training** pipeline
- **Model versioning & management** system
- **Anomaly detection** with severity classification
- **Feed optimization** recommendations
- **Database-backed predictions** storage
- **Real-time performance monitoring**

---

## 🏗️ Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     ECO FARM Phase 7                         │
│                  ML Prediction Engine                        │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐         ┌──────▼──────┐      ┌──────▼──────┐
   │  Train  │         │   Predict   │      │   Monitor   │
   │ Pipeline│         │   Engine    │      │  Dashboard  │
   └────┬────┘         └──────┬──────┘      └──────┬──────┘
        │                     │                     │
        ├─────────────────────┴─────────────────────┤
        │         PostgreSQL Database                │
        │  ┌──────────────────────────────────┐    │
        │  │ Tables:                           │    │
        │  │  - ml_models                      │    │
        │  │  - predictions                    │    │
        │  │  - farms / rooms / metrics        │    │
        │  └──────────────────────────────────┘    │
        └───────────────────────────────────────────┘
```

---

## 📦 New Database Schema

### `ml_models` Table

Stores ML model metadata, performance metrics, and deployment status.

```sql
CREATE TABLE ml_models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) UNIQUE NOT NULL,
    model_type VARCHAR(100) NOT NULL,
    model_path VARCHAR(500),

    -- Performance Metrics
    train_mae FLOAT,
    test_mae FLOAT,
    train_rmse FLOAT,
    test_rmse FLOAT,
    train_r2 FLOAT,
    test_r2 FLOAT,
    performance_score FLOAT,  -- 0-100

    -- Training Config
    n_samples INTEGER,
    n_features INTEGER,
    hyperparameters JSON,

    -- Status
    is_active BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'trained',
    notes TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    trained_by VARCHAR(100)
);
```

### `predictions` Table

Stores forecast results for historical tracking and analysis.

```sql
CREATE TABLE predictions (
    id SERIAL PRIMARY KEY,
    farm_id INTEGER REFERENCES farms(id) ON DELETE CASCADE,
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    model_id INTEGER REFERENCES ml_models(id) ON DELETE SET NULL,

    target_date DATE NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    predicted_value FLOAT NOT NULL,
    confidence FLOAT,

    prediction_horizon INTEGER NOT NULL,  -- Days ahead
    upper_bound FLOAT,
    lower_bound FLOAT,

    created_at TIMESTAMP DEFAULT NOW(),
    prediction_type VARCHAR(50) DEFAULT 'forecast',

    UNIQUE(room_id, target_date, metric_name, model_id)
);
```

---

## 🤖 ML Pipeline Components

### 1. Training Pipeline (`/backend/ml/train.py`)

**Features:**

- Automated feature engineering (rolling averages, lag features, trends)
- Multi-model support (Random Forest, Gradient Boosting)
- Cross-validation with 5-fold CV
- Model versioning with timestamps
- Performance tracking (MAE, RMSE, R², Performance Score)

**Feature Engineering:**

```python
Features Created (per room):
- Current values: temp, humidity, feed, water, mortality, eggs
- Rolling averages: 3-day, 7-day windows
- Lag features: 1-day, 3-day
- Trend indicators: weight trajectory
- Flock age: days in cycle
```

**Training Trigger:**

- Auto-triggered after CSV upload
- Manual trigger via `/ml/train` API endpoint
- Requires minimum 14 days of data

**Model Saving:**

```
/backend/ml/models/
  ├── v20251120_143025/
  │   ├── model.joblib
  │   ├── scaler.joblib
  │   ├── features.joblib
  │   └── metrics.json
  └── latest/  (copy of most recent)
```

### 2. Prediction Engine (`/backend/ml/predict.py`)

**Capabilities:**

- Multi-horizon forecasting: 7, 14, 30 days
- Confidence intervals (±10%)
- Growth trend blending (70% ML + 30% historical trend)
- Anomaly warnings integration
- Feed optimization recommendations

**Prediction Process:**

```
1. Load room historical data (last 7 days minimum)
2. Create feature matrix with rolling/lag features
3. Scale features using trained scaler
4. Generate base prediction
5. Apply growth trajectory correction
6. Calculate confidence bounds
7. Detect anomalies in forecast
8. Generate actionable recommendations
9. Save to database (optional)
```

**Output Format:**

```json
{
  "room_id": "R01",
  "model_version": "v20251120_143025",
  "predictions": {
    "7_day": {
      "horizon_days": 7,
      "labels": ["Day +1", "Day +2", ...],
      "predicted_weights": [2.1, 2.15, 2.2, ...],
      "lower_bound": [1.89, 1.94, ...],
      "upper_bound": [2.31, 2.37, ...],
      "confidence_percent": 90
    },
    "14_day": { ... },
    "30_day": { ... }
  },
  "anomalies": [
    {
      "type": "mortality_spike",
      "severity": "critical",
      "message": "High mortality rate detected: 6.5%",
      "action": "Immediate veterinary consultation required"
    }
  ],
  "recommendations": [
    {
      "category": "feed",
      "priority": "high",
      "recommendation": "Switch to Grower Max 19% Protein",
      "rationale": "Optimized for current weight trajectory",
      "expected_benefit": "+5%",
      "implementation": "Gradual transition over 3-5 days"
    }
  ]
}
```

### 3. Model Manager (`/backend/ml/model_manager.py`)

**Functions:**

- List all model versions
- Get model details (metrics, files, size)
- Validate model integrity
- Compare model performance
- Get training history
- Delete old models (except 'latest')

---

## 🔌 API Endpoints

### Model Management

**POST `/ml/train`**

- Trains new ML model
- Query params: `model_type` (random_forest, gradient_boosting)
- Auto-registers model in database
- Returns: version, metrics, paths

**GET `/ml/models`**

- Lists all trained models with performance metrics
- Returns: models[], total_count, active_model

**GET `/ml/models/{model_id}`**

- Get detailed model information
- Includes: metrics, config, prediction count

**GET `/ml/models/active/info`**

- Get currently active/deployed model
- Returns: full model metadata

**POST `/ml/models/{model_id}/activate`**

- Activate specific model version for predictions
- Deactivates all other models

### Predictions

**POST `/ml/predict/room/{room_id}`**

- Generate multi-horizon predictions for room
- Query params: `horizons` (list), `save_predictions` (bool)
- Returns: predictions, anomalies, recommendations

**POST `/ml/predict/farm/{farm_id}`**

- Generate predictions for all rooms in farm
- Query params: `horizons` (list)
- Returns: room_predictions{}, summary{}

**GET `/ml/predictions/history`**

- Get historical predictions from database
- Query params: farm_id, room_id, metric_name, days
- Returns: predictions[], total_count

### Monitoring

**GET `/ml/monitor/status`**

- Overall ML system health status
- Returns: system_status, active_model, statistics, model_validation

**GET `/ml/monitor/performance`**

- Performance metrics across all models
- Returns: models[], trends{}, best_model

---

## 🎨 Frontend Components

### Model Monitor Page (`/frontend/pages/model-monitor.js`)

**Features:**

- System status dashboard (operational/degraded)
- Active model details (version, type, metrics)
- Performance metrics (score, R², MAE, trends)
- Training history table
- One-click model training
- Model version switching
- Usage instructions

**UI Sections:**

1. **Header** - Title + Train New Model button
2. **Status Cards** (3 cards)
   - System Status (health, predictions count)
   - Performance Metrics (scores, trends)
   - Active Model Details
3. **Training History Table**
   - All models with metrics
   - Activate buttons
   - Status badges
4. **Instructions Card**

### Enhanced Dashboard & Analytics

**Updates to `dashboard.js`:**

- Integrated ML predictions display
- 7/14/30-day forecast toggle
- Anomaly alerts panel
- Feed recommendations section

**Updates to `analytics.js`:**

- Multi-horizon forecast charts
- Confidence interval visualization
- Historical vs predicted comparison
- Model performance overlay

---

## 📊 Performance Metrics

### Model Performance Score (0-100)

Calculated as: `R² × 100`

- **90-100:** Excellent predictive power
- **70-89:** Good predictions, reliable for decisions
- **50-69:** Moderate accuracy, use with caution
- **< 50:** Poor fit, retrain with more data

### Additional Metrics

- **MAE (Mean Absolute Error):** Average prediction error in kg
- **RMSE (Root Mean Squared Error):** Penalizes large errors
- **R² (R-squared):** Proportion of variance explained (0-1)
- **CV Score:** Cross-validation MAE (robustness check)

---

## 🚨 Anomaly Detection

### Types of Anomalies Detected

1. **Mortality Spike** (Critical)

   - Threshold: > 5% daily mortality
   - Action: Immediate veterinary consultation

2. **Feed Inefficiency** (High)

   - Threshold: FCR > 2.5
   - Action: Review feed quality and formulation

3. **Weight Plateau** (Medium)

   - Threshold: < 0.1 kg gain over 7 days
   - Action: Adjust feed formulation

4. **Heat Stress Risk** (High)

   - Threshold: Temperature > 28°C
   - Action: Increase ventilation, provide cool water

5. **Cold Stress Risk** (Medium)

   - Threshold: Temperature < 18°C
   - Action: Increase heating, check for drafts

6. **Environmental Inconsistency** (Medium)
   - Unusual temperature/humidity patterns
   - Action: Inspect HVAC systems

### Severity Classification

- **Critical** 🛑: Immediate action required (< 24 hours)
- **High** ⚠️: Urgent attention needed (< 48 hours)
- **Medium** ℹ️: Monitor closely (< 1 week)
- **Low** ✓: Informational, track trends

---

## 🎯 Feed Recommendations

### Recommendation Engine

Based on:

- Predicted weight trajectory
- Current flock age
- Environmental conditions
- Mortality rate
- Feed conversion efficiency

### Feed Database

```javascript
[
  {
    name: "Starter Plus 22% Protein",
    protein: 22,
    energy: 2950,
    best_for: "young flocks (<2kg)",
    expected_improvement: "+8%",
  },
  {
    name: "Grower Max 19% Protein",
    protein: 19,
    energy: 3050,
    best_for: "growing phase (2-2.5kg)",
    expected_improvement: "+5%",
  },
  {
    name: "Layer Supreme 17% Protein",
    protein: 17,
    energy: 2850,
    best_for: "egg production (>2.5kg)",
    expected_improvement: "+3%",
  },
];
```

---

## 🔧 Configuration & Setup

### Database Migration

```bash
# Run from backend container
alembic upgrade head
```

This creates `ml_models` and `predictions` tables.

### Training First Model

```bash
# Manual training
curl -X POST http://localhost:8000/ml/train?model_type=random_forest

# Or upload CSV (auto-triggers training)
curl -X POST -F "file=@data.csv" http://localhost:8000/upload/csv
```

### Checking Model Status

```bash
curl http://localhost:8000/ml/monitor/status
```

---

## 📈 Usage Examples

### 1. Train New Model

```python
# Backend (automatic)
from ml.train import train_new_model

result = train_new_model(model_type='random_forest')
# Returns: {'success': True, 'version': 'v20251120_143025', 'metrics': {...}}
```

### 2. Generate Predictions

```python
from ml.predict import MLPredictor

predictor = MLPredictor(model_version='latest')
predictions = predictor.predict_multi_horizon('R01', horizons=[7, 14, 30])
# Returns: {'predictions': {...}, 'anomalies': [...], 'recommendations': [...]}
```

### 3. Frontend Usage

```javascript
// Train model
const result = await trainModel("random_forest");

// Get predictions
const predictions = await getRoomMLPredictions(roomId, [7, 14, 30]);

// View model monitor
// Navigate to /model-monitor page
```

---

## 🛡️ Error Handling & Validation

### Data Validation

**Before Training:**

- Minimum 14 days of data required
- At least 3 rooms needed
- Check for missing critical columns
- Validate date ranges

**Before Prediction:**

- Minimum 3 days of recent data
- Active model must exist
- Room must have historical data
- Features must match trained model

### Graceful Degradation

- If model training fails → Keep using previous model
- If prediction fails → Return informative error message
- If database unavailable → Use file-based fallback
- If insufficient data → Return warning with minimum requirements

---

## 📊 Testing & Validation

### Model Testing

```bash
# Test training pipeline
cd backend/ml
python train.py

# Test prediction engine
python predict.py

# Test model manager
python model_manager.py
```

### API Testing

```bash
# Train model
curl -X POST http://localhost:8000/ml/train?model_type=random_forest

# Get models
curl http://localhost:8000/ml/models

# Generate predictions
curl -X POST http://localhost:8000/ml/predict/room/2?horizons=7&horizons=14&horizons=30

# Check status
curl http://localhost:8000/ml/monitor/status
```

---

## 🚀 Deployment Checklist

- [ ] Run database migrations (Alembic)
- [ ] Verify PostgreSQL ml_models & predictions tables exist
- [ ] Upload sample CSV data (minimum 14 days)
- [ ] Train first model manually or wait for auto-training
- [ ] Verify model saved to /backend/ml/models/
- [ ] Check model status via API
- [ ] Generate test predictions
- [ ] Access /model-monitor page
- [ ] Configure automated retraining schedule (optional)

---

## 📝 Future Enhancements (Phase 8+)

1. **LSTM/Transformer Models**

   - Deep learning for complex patterns
   - Longer-horizon forecasting (60+ days)

2. **Real-time Streaming Predictions**

   - WebSocket integration
   - Live dashboard updates

3. **A/B Testing Framework**

   - Compare multiple models simultaneously
   - Automatic champion/challenger evaluation

4. **AutoML Integration**

   - Hyperparameter optimization
   - Model selection automation

5. **Edge Deployment**

   - ONNX model export
   - Lightweight inference engine
   - Offline prediction capability

6. **Explainability Dashboard**
   - SHAP values visualization
   - Feature importance tracking
   - Decision transparency

---

## 🎓 Key Learnings

1. **Feature Engineering is Critical**

   - Rolling averages capture short-term trends
   - Lag features provide context
   - Domain knowledge improves accuracy

2. **Model Versioning Saves Time**

   - Easy rollback to previous versions
   - Compare performance across iterations
   - Track improvements over time

3. **Confidence Intervals Build Trust**

   - Users understand prediction uncertainty
   - Enables risk-based decision making
   - More honest than point estimates

4. **Anomaly Detection > Pure Forecasting**

   - Warnings prevent losses
   - Proactive vs reactive management
   - Higher perceived value

5. **Automation Drives Adoption**
   - Auto-training removes friction
   - One-click deployment
   - Self-service ML system

---

## 📞 Support & Troubleshooting

### Common Issues

**Q: Model training fails with "Insufficient data"**  
A: Ensure at least 14 days of data across 3+ rooms. Check for missing columns (avg_weight_kg required).

**Q: Predictions return error "room not found"**  
A: Verify room exists in database. Check room_id vs room database ID mismatch.

**Q: Model performance score is very low (<50)**  
A: More data needed. Add more historical CSV uploads. Check data quality (no missing values).

**Q: Frontend can't connect to ML endpoints**  
A: Verify `/ml` router is included in main.py. Check Docker backend logs for errors.

---

## 📚 References

- Scikit-learn Documentation: https://scikit-learn.org
- FastAPI Docs: https://fastapi.tiangolo.com
- Alembic Migrations: https://alembic.sqlalchemy.org
- Random Forest Algorithm: [Breiman, 2001]
- Time Series Forecasting: [Hyndman & Athanasopoulos]

---

**Phase 7 Status: ✅ COMPLETE**  
**Next Phase: Phase 8 - Real-time Streaming & Advanced Analytics**

---

_Document Version: 1.0_  
_Last Updated: November 20, 2025_  
_Author: ECO FARM Development Team_
