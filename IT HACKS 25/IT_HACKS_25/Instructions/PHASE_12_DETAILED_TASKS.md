# PHASE 12 DETAILED TASK BREAKDOWN

## ECO FARM AI - Real-time Monitoring, Anomalies, Explainability, Features

**Project**: ECO FARM AI - IT HACKS 25  
**Phase**: 12  
**Status**: Planning (Ready to Start)  
**Estimated Duration**: 8 hours  
**Start Date**: December 7, 2025

---

## SECTION 1: REAL-TIME MODEL MONITORING DASHBOARD

### 1.1 Backend Monitoring Service Module

**File**: `backend/services/monitoring.py`  
**Size**: 250-300 lines  
**Dependencies**: SQLAlchemy, datetime, numpy

**Classes to Implement**:

```python
class TrainingMetricsCollector:
    """Collect and aggregate training metrics over time"""

    Methods:
    - record_training(model_id, metrics_dict) → None
    - get_training_history(limit=20, offset=0) → List[Dict]
    - get_model_trend(model_id, days=90) → Dict
    - compare_models(model_ids) → Dict
    - calculate_average_metrics(start_date, end_date) → Dict

class PredictionStatsCollector:
    """Collect prediction statistics and latency data"""

    Methods:
    - record_prediction(endpoint, latency_ms, success=True) → None
    - get_prediction_stats(hours=24) → Dict
    - get_latency_histogram(endpoint, hours=24) → Dict
    - calculate_p95_latency(endpoint) → float
    - get_predictions_per_hour(hours=24) → Dict

class SystemHealthMonitor:
    """Monitor system resource usage and health"""

    Methods:
    - get_memory_usage() → Dict
    - get_cpu_usage() → Dict
    - get_disk_usage() → Dict
    - get_model_cache_stats() → Dict
    - get_database_stats() → Dict
    - get_system_status() → Dict (combines all)
```

**Tasks**:

- [ ] Create service module structure
- [ ] Implement TrainingMetricsCollector class
- [ ] Implement PredictionStatsCollector class
- [ ] Implement SystemHealthMonitor class
- [ ] Add database query methods
- [ ] Add caching for expensive operations
- [ ] Write docstrings
- [ ] Create unit tests

---

### 1.2 Backend Monitoring API Endpoints

**File**: `backend/routers/monitoring.py`  
**Size**: 350-400 lines  
**Imports**: FastAPI, monitoring service, database

**Endpoints to Implement**:

```
GET /monitor/training-history
├─ Query params: limit=20, offset=0, sort_by="date", order="desc"
├─ Returns: Array of training records with:
│  ├─ version, model_type, trained_at
│  ├─ metrics: mae, rmse, r2, performance_score
│  ├─ n_samples, n_features
│  └─ training_time_seconds
└─ Response time target: <300ms

GET /monitor/active-model
├─ Returns: Current active model with:
│  ├─ version, model_type, trained_at
│  ├─ Current metrics (from last 7 days)
│  ├─ Performance trend (improving/stable/declining)
│  └─ Next model recommendation (if available)
└─ Response time target: <200ms

GET /monitor/prediction-stats
├─ Query params: hours=24, endpoint (optional)
├─ Returns: Prediction statistics:
│  ├─ Total predictions, success rate
│  ├─ Average latency, p95 latency
│  ├─ Predictions per hour
│  └─ Error rate by endpoint
└─ Response time target: <400ms

GET /monitor/system-health
├─ Returns: Real-time system metrics:
│  ├─ Memory: used/total/percentage
│  ├─ CPU: usage, load average
│  ├─ Database: connections, query time
│  ├─ Cache: hit rate, size
│  └─ Uptime, last training date
└─ Response time target: <250ms

GET /monitor/model-comparison
├─ Query params: limit=5, metric="r2" (mae/rmse/r2)
├─ Returns: Top models ranked by metric:
│  ├─ Model info (version, type, trained_at)
│  ├─ All metrics (mae, rmse, r2, train_time)
│  └─ Rank and comparison
└─ Response time target: <400ms
```

**Tasks**:

- [ ] Create router module
- [ ] Implement all 5 endpoints
- [ ] Add input validation
- [ ] Add error handling
- [ ] Add RBAC (viewer+ can see)
- [ ] Add caching (5-min TTL)
- [ ] Write endpoint tests
- [ ] Document in OpenAPI

---

### 1.3 Frontend Monitoring Dashboard Page

**File**: `frontend/pages/monitor-dashboard.js`  
**Size**: 200-250 lines  
**Dependencies**: React, Recharts, axios

**Page Layout**:

```
┌─────────────────────────────────────────────────────┐
│  Model Monitoring Dashboard                  [⟳]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │ Active Model│  │ Avg MAE     │  │ Success    │ │
│  │ v20251207   │  │ 0.0245      │  │ 99.5%      │ │
│  └─────────────┘  └─────────────┘  └────────────┘ │
│                                                     │
│  ┌────────────────────────────────────────────────┐ │
│  │ Training History (Last 7 Days)                 │ │
│  │  [Line Chart: MAE/RMSE trend]                  │ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
│  ┌─────────────────────┐  ┌────────────────────┐  │
│  │ Model Comparison    │  │ System Health      │  │
│  │ [Bar Chart]         │  │ CPU: 35%           │  │
│  │                     │  │ Memory: 1.8GB      │  │
│  │                     │  │ Cache Hit: 87%     │  │
│  └─────────────────────┘  └────────────────────┘  │
│                                                     │
│  ┌────────────────────────────────────────────────┐ │
│  │ Prediction Stats (Last 24h)                    │ │
│  │  [Area Chart: Predictions per hour]            │ │
│  │  [Latency: avg 245ms, p95 892ms]              │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Tasks**:

- [ ] Create page layout structure
- [ ] Set up state management (useState, useEffect)
- [ ] Create data fetching functions
- [ ] Implement auto-refresh (every 10 seconds)
- [ ] Add error boundaries
- [ ] Add loading states
- [ ] Add filtering/sorting
- [ ] Write component tests

---

### 1.4 Frontend Monitoring Components

**Files**: `frontend/components/Monitoring/`

**Components to Create**:

#### TrainingMetrics.js (150 lines)

```
Shows training history as timeline
- Version selector
- Metric cards (MAE, RMSE, R²)
- Trend indicator (↑ improving, ↓ declining, → stable)
- Performance score gauge
```

#### ModelComparison.js (150 lines)

```
Compares top 5 models side-by-side
- Bar chart: Model versions vs selected metric
- Metric selector (MAE/RMSE/R²)
- Filter: Last N days
- Switch to "worst performing" view
```

#### SystemHealth.js (100 lines)

```
Shows system resource usage
- Memory gauge (0-2GB)
- CPU usage percentage
- Database connection pool status
- Cache hit rate percentage
- Uptime display
```

#### PredictionStats.js (150 lines)

```
Shows prediction volume and latency
- Line chart: Predictions per hour (24h)
- Latency histogram (response times)
- Success rate gauge
- Error rate by endpoint
- P95/P99 latency display
```

**Tasks**:

- [ ] Create TrainingMetrics component
- [ ] Create ModelComparison component
- [ ] Create SystemHealth component
- [ ] Create PredictionStats component
- [ ] Add real-time updates (polling/websocket)
- [ ] Add interactive legends
- [ ] Add tooltip support
- [ ] Write tests for each component

---

### 1.5 Frontend Integration & Polish

**Tasks**:

- [ ] Add navigation link to /monitor-dashboard
- [ ] Add to main navigation menu
- [ ] Responsive design (mobile-friendly)
- [ ] Dark mode support
- [ ] Export functionality (PNG/CSV)
- [ ] Settings panel (refresh interval, metrics to show)
- [ ] Performance optimization (memoization)
- [ ] Accessibility checks (a11y)

---

### 1.6-1.9 Testing

**Unit Tests** (backend/tests/test_monitoring.py):

- [ ] Test TrainingMetricsCollector methods
- [ ] Test PredictionStatsCollector methods
- [ ] Test SystemHealthMonitor methods
- [ ] Test metric calculations

**API Tests** (backend/tests/test_monitoring_api.py):

- [ ] Test GET /monitor/training-history
- [ ] Test GET /monitor/active-model
- [ ] Test GET /monitor/prediction-stats
- [ ] Test GET /monitor/system-health
- [ ] Test GET /monitor/model-comparison
- [ ] Test response times
- [ ] Test error handling

**Component Tests** (frontend/**tests**/components/):

- [ ] Test TrainingMetrics component
- [ ] Test ModelComparison component
- [ ] Test SystemHealth component
- [ ] Test PredictionStats component
- [ ] Test data fetching
- [ ] Test loading states

**Integration Tests**:

- [ ] Dashboard loads correctly
- [ ] Auto-refresh works
- [ ] Charts render properly
- [ ] No memory leaks
- [ ] Performance acceptable

---

## SECTION 2: ADVANCED ANOMALY DETECTION

### 2.1-2.2 Anomaly Detection Algorithms

**File**: `backend/ml/anomaly_detector_advanced.py`  
**Size**: 400-500 lines

**Classes to Implement**:

```python
class IsolationForestDetector:
    """Multivariate anomaly detection using Isolation Forest"""
    - fit(data) → None
    - predict(data) → array of -1/1 labels
    - anomaly_score(data) → array of 0-1 scores
    - explain_anomaly(sample) → Dict with feature contributions

class LocalOutlierFactorDetector:
    """Density-based anomaly detection"""
    - fit(data) → None
    - predict(data) → array of -1/1 labels
    - anomaly_score(data) → array of 0-1 scores

class StatisticalAnomalyDetector:
    """Univariate Z-score and IQR-based detection"""
    - fit(data) → None
    - detect_by_zscore(data, threshold=3) → List of anomalies
    - detect_by_iqr(data, multiplier=1.5) → List of anomalies
    - get_statistics() → Dict with mean, std, median, IQR

class TimeSeriesAnomalyDetector:
    """Time-series specific anomaly detection"""
    - fit(time_series) → None
    - detect_trend_breaks(data) → List of indices
    - detect_velocity_changes(data, threshold=2) → List of indices
    - detect_seasonal_anomalies(data) → List of indices
    - ARIMA residual analysis
```

**Key Methods**:

- All methods return scores in [0, 1] range
- 0 = normal, 1 = strong anomaly
- Different algorithms detect different patterns
- Combine multiple algorithms for better detection

**Tasks**:

- [ ] Implement IsolationForestDetector
- [ ] Implement LocalOutlierFactorDetector
- [ ] Implement StatisticalAnomalyDetector
- [ ] Implement TimeSeriesAnomalyDetector
- [ ] Add ensemble method (combine algorithms)
- [ ] Add hyperparameter tuning
- [ ] Add documentation
- [ ] Write unit tests

---

### 2.3 Anomaly Detection API Endpoints

**File**: `backend/routers/ai_inference.py` (add to existing)  
**Size**: 100-150 lines

**Endpoints to Add**:

```
GET /ai/anomalies/room/{room_id}
├─ Query params: days=7, sensitivity=0.8
├─ Returns: Array of anomalies:
│  ├─ anomaly_date, metric_name, metric_value
│  ├─ anomaly_score (0-1), anomaly_type
│  ├─ description, severity (low/medium/high)
│  └─ is_confirmed boolean
└─ Response time target: <1s

GET /ai/anomalies/farm/{farm_id}
├─ Query params: days=7, severity (low/medium/high)
├─ Returns: Farm-wide anomalies across all rooms
│  ├─ Room ID, metric, date
│  ├─ Score and severity
│  └─ Aggregated severity count
└─ Response time target: <2s

POST /ai/anomalies/feedback
├─ Body: {
│    "anomaly_id": int,
│    "is_real": boolean,
│    "notes": str (optional)
│  }
├─ Purpose: Improve detection with feedback
└─ Response: {"status": "recorded"}
```

**Tasks**:

- [ ] Implement /ai/anomalies/room/{room_id}
- [ ] Implement /ai/anomalies/farm/{farm_id}
- [ ] Implement POST /ai/anomalies/feedback
- [ ] Add input validation
- [ ] Add error handling
- [ ] Add caching (5-min TTL)
- [ ] Add RBAC (viewer+ can see)
- [ ] Write tests

---

### 2.4 Anomaly Database Schema

**File**: `backend/migrations/versions/002_add_anomalies.py`

```sql
CREATE TABLE anomalies (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL REFERENCES rooms(id),
    farm_id INTEGER NOT NULL REFERENCES farms(id),
    anomaly_date TIMESTAMP NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value FLOAT NOT NULL,
    anomaly_score FLOAT NOT NULL,  -- 0-1
    anomaly_type VARCHAR(50) NOT NULL,
    -- Types: 'multivariate', 'univariate', 'trend', 'contextual'
    description TEXT,
    severity VARCHAR(20) NOT NULL,  -- 'low', 'medium', 'high'
    is_confirmed BOOLEAN DEFAULT FALSE,
    feedback_provided BOOLEAN DEFAULT FALSE,
    user_feedback TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    FOREIGN KEY (farm_id) REFERENCES farms(id)
);

CREATE INDEX idx_anomalies_room_date ON anomalies(room_id, anomaly_date DESC);
CREATE INDEX idx_anomalies_farm_date ON anomalies(farm_id, anomaly_date DESC);
CREATE INDEX idx_anomalies_score ON anomalies(anomaly_score DESC);
```

**Tasks**:

- [ ] Create migration file
- [ ] Define anomaly table schema
- [ ] Create indexes
- [ ] Write migration up/down
- [ ] Test migration

---

### 2.5-2.8 Testing

**Unit Tests** (`backend/tests/test_anomaly_detection.py`):

- [ ] Test IsolationForest detection
- [ ] Test LOF detection
- [ ] Test statistical detection
- [ ] Test time-series detection
- [ ] Test ensemble method
- [ ] Test with synthetic anomalies
- [ ] Test score ranges (0-1)

**Integration Tests**:

- [ ] Test detection on real farm data
- [ ] Test API endpoints
- [ ] Test database storage
- [ ] Test feedback mechanism
- [ ] Test sensitivity parameter
- [ ] Test multi-algorithm combination

**Performance Tests**:

- [ ] Detection latency <500ms
- [ ] Memory usage <100MB
- [ ] API response time <2s
- [ ] No memory leaks during streaming data

**Accuracy Tests**:

- [ ] Synthetic anomalies detected >90%
- [ ] False positive rate <5%
- [ ] Real anomalies validated on farm_C, farm_D

---

## SECTION 3: PREDICTION EXPLAINABILITY UI

### 3.1-3.3 Explainability Backend

**File**: `backend/ml/explainability_enhanced.py`  
**Size**: 350-450 lines

**Classes to Implement**:

```python
class SHAPExplainer:
    """SHAP value calculation for model predictions"""

    Methods:
    - __init__(model, training_data)
    - explain_prediction(input_data) → Dict with SHAP values
    - get_feature_importance() → Sorted list of features
    - explain_prediction_batch(data) → List of explanations
    - get_base_value() → float (model baseline)

class FeatureContributionCalculator:
    """Calculate feature contributions to predictions"""

    Methods:
    - calculate_contributions(prediction, features) → Dict
    - get_top_features(n=10) → List of top features
    - get_feature_direction(feature_name) → 'positive'|'negative'
    - get_magnitude(feature_name) → float

class PredictionDecomposer:
    """Decompose prediction into components"""

    Methods:
    - decompose(base_value, features, shap_values) → List
    - generate_waterfall_data(prediction_id) → Dict
    - generate_explanation_text(prediction_id) → str
```

**Key Methods**:

- SHAP values: contribution of each feature
- Must sum to: prediction_value - base_value
- Waterfall chart: show cumulative contributions
- Generate human-readable explanations

**Tasks**:

- [ ] Implement SHAPExplainer class
- [ ] Implement FeatureContributionCalculator
- [ ] Implement PredictionDecomposer
- [ ] Add SHAP value caching (1-hour TTL)
- [ ] Handle edge cases (missing features, etc)
- [ ] Write docstrings
- [ ] Create unit tests

---

### 3.2 Explainability API Endpoints

**File**: `backend/routers/ai_inference.py` (add to existing)

```
GET /ai/explain/prediction/{prediction_id}
├─ Returns: Detailed explanation:
│  ├─ prediction_value, base_value
│  ├─ shap_values: {
│  │    "feature_1": {"value": float, "contribution": float},
│  │    ...
│  │  }
│  └─ top_features: [
│       {"name": str, "contribution": float, "direction": "pos/neg"}
│     ]
└─ Response time target: <1.5s

GET /ai/explain/prediction/room/{room_id}
├─ Query params: metric, days_ahead
├─ Returns: Explanation for specific forecast:
│  ├─ Which metrics drove the prediction
│  ├─ Top contributing features
│  └─ Waterfall data for visualization
└─ Response time target: <1s

GET /ai/explain/feature-importance
├─ Query params: room_id (optional), metric (optional)
├─ Returns: Global feature importance:
│  ├─ Top 10 most important features
│  ├─ Importance scores (0-1)
│  └─ Trend (stable/increasing/decreasing)
└─ Response time target: <800ms
```

**Tasks**:

- [ ] Implement /ai/explain/prediction/{prediction_id}
- [ ] Implement /ai/explain/prediction/room/{room_id}
- [ ] Implement /ai/explain/feature-importance
- [ ] Add response caching
- [ ] Add error handling
- [ ] Write tests

---

### 3.3 Explainability Data Structure

```json
{
  "prediction_id": 12345,
  "prediction_value": 145.2,
  "prediction_date": "2025-12-07T14:30:00Z",
  "base_value": 130.0,
  "room_id": 5,
  "shap_values": {
    "temperature_c_rolling_7d": {
      "value": 22.5,
      "contribution": 8.2,
      "percentile": 0.65
    },
    "humidity_pct_lag_3d": {
      "value": 65.0,
      "contribution": 4.1,
      "percentile": 0.45
    },
    "weight_trend": {
      "value": 0.15,
      "contribution": 2.9,
      "percentile": 0.8
    }
  },
  "top_features": [
    {
      "name": "temperature_c_rolling_7d",
      "contribution": 8.2,
      "direction": "positive"
    },
    {
      "name": "humidity_pct_lag_3d",
      "contribution": 4.1,
      "direction": "negative"
    },
    { "name": "weight_trend", "contribution": 2.9, "direction": "positive" }
  ],
  "explanation_text": "The prediction of 145.2 eggs is 15.2 higher than baseline due to good temperature conditions (8.2 contribution) and positive weight trend (2.9 contribution)."
}
```

---

### 3.4-3.5 Frontend Explainability Components

**File**: `frontend/components/Explainability/ExplainabilityPanel.js` (250-300 lines)

**Component Display**:

```
┌─────────────────────────────────────────┐
│ Why This Prediction?                    │
├─────────────────────────────────────────┤
│                                         │
│ Base: 130.0  [=============]  145.2    │
│              Predicted                  │
│                                         │
│ Top Contributing Factors:               │
│ ┌──────────────────────────────────┐   │
│ │ 1. Temperature (7d avg)      ↑ 8.2│   │
│ │    22.5°C (Good)              ███ │   │
│ │ 2. Humidity (3d lag)          ↓ 4.1│   │
│ │    65% (Moderate)              ██ │   │
│ │ 3. Weight Trend               ↑ 2.9│   │
│ │    +0.15 kg/day (Positive)     ██ │   │
│ └──────────────────────────────────┘   │
│                                         │
│ 📊 Show Waterfall Chart                 │
└─────────────────────────────────────────┘
```

**Tasks**:

- [ ] Create ExplainabilityPanel component
- [ ] Fetch explanation data from API
- [ ] Display top features with contribution bars
- [ ] Show direction indicators (↑ pos, ↓ neg)
- [ ] Add color coding (green/red)
- [ ] Generate human-readable text
- [ ] Add waterfall chart toggle
- [ ] Write tests

**Additional Components**:

- `FeatureContributions.js` - Feature list details
- `WaterfallChart.js` - Waterfall visualization

---

### 3.4 Prediction Detail Page

**File**: `frontend/pages/prediction-detail.js` (200-250 lines)

**Page Layout**:

```
Prediction Details: Room 5 - Egg Production
Date: 2025-12-07  |  Metric: Eggs  |  Days Ahead: 7

┌─────────────────────────────────────────┐
│ Prediction: 145.2 eggs                  │
│ Confidence: 95% (135-155 range)         │
└─────────────────────────────────────────┘

[ Explainability Panel ]

[ Waterfall Chart ]

[ Historical Data Comparison ]
  Previous 7-day: 142.5 eggs (↑ +1.9%)
  30-day average: 141.2 eggs
```

**Tasks**:

- [ ] Create page layout
- [ ] Add URL routing (/predictions/:id)
- [ ] Fetch prediction and explanation data
- [ ] Display all components
- [ ] Add historical comparison
- [ ] Add export functionality
- [ ] Write tests

---

### 3.6-3.9 Testing

**Unit Tests**:

- [ ] Test SHAP value calculation
- [ ] Test feature contribution accuracy
- [ ] Test waterfall decomposition
- [ ] Test explanation text generation

**Integration Tests**:

- [ ] Test explanation API endpoints
- [ ] Test with real predictions
- [ ] Test SHAP values sum correctly
- [ ] Test performance <1.5s

**Component Tests**:

- [ ] Test ExplainabilityPanel rendering
- [ ] Test WaterfallChart display
- [ ] Test data loading states
- [ ] Test error handling

---

## SECTION 4: FEATURE IMPORTANCE VISUALIZATION

### 4.1-4.3 Feature Importance Service

**File**: `backend/services/feature_importance.py` (200-250 lines)

**Classes to Implement**:

```python
class FeatureImportanceTracker:
    """Track feature importance over time"""

    Methods:
    - record_importance(model_id, feature_name, score, room_id=None)
    - get_feature_importance(model_id, room_id=None) → DataFrame
    - get_importance_trend(feature_name, days=90) → List
    - calculate_importance_stability(feature_name) → float
    - compare_rooms(feature_name, room_ids) → Dict
    - get_seasonal_importance(feature_name) → Dict
```

**Database Schema**:

```sql
CREATE TABLE feature_importance (
    id SERIAL PRIMARY KEY,
    model_id INTEGER NOT NULL REFERENCES ml_models(id),
    feature_name VARCHAR(100) NOT NULL,
    importance_score FLOAT NOT NULL,  -- 0-1
    rank INTEGER,
    room_id INTEGER REFERENCES rooms(id),  -- NULL for global
    calculated_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_feature_importance_model ON feature_importance(model_id);
CREATE INDEX idx_feature_importance_date ON feature_importance(calculated_date DESC);
CREATE INDEX idx_feature_importance_room ON feature_importance(room_id);
```

**Tasks**:

- [ ] Create FeatureImportanceTracker class
- [ ] Implement recording methods
- [ ] Implement retrieval methods
- [ ] Add trend calculation
- [ ] Add stability calculation
- [ ] Write docstrings
- [ ] Create unit tests

---

### 4.2 Feature Importance API Endpoints

**File**: `backend/routers/monitoring.py` (add to existing)

```
GET /monitor/feature-importance
├─ Query params: room_id (optional), model_id (optional), limit=20
├─ Returns: Top features with scores:
│  ├─ feature_name, importance_score (0-1)
│  ├─ rank (1-100), trend (↑/→/↓)
│  └─ Global or room-specific
└─ Response time target: <500ms

GET /monitor/feature-importance/history
├─ Query params: feature_name, days=90
├─ Returns: Importance trend over time:
│  ├─ Array of {date, importance_score}
│  ├─ Moving average (7-day)
│  └─ Trend line (linear fit)
└─ Response time target: <800ms

GET /monitor/feature-importance/comparison
├─ Query params: room_id_1, room_id_2
├─ Returns: Side-by-side feature comparison:
│  ├─ Top 15 features for each room
│  ├─ Importance scores compared
│  └─ Differences highlighted
└─ Response time target: <600ms

GET /monitor/feature-importance/seasonal
├─ Returns: Feature importance by season:
│  ├─ Spring, Summer, Fall, Winter
│  ├─ Top 10 features per season
│  └─ Seasonal variations
└─ Response time target: <700ms
```

**Tasks**:

- [ ] Implement /monitor/feature-importance
- [ ] Implement /monitor/feature-importance/history
- [ ] Implement /monitor/feature-importance/comparison
- [ ] Implement /monitor/feature-importance/seasonal
- [ ] Add caching (10-min TTL)
- [ ] Add error handling
- [ ] Write tests

---

### 4.4-4.6 Frontend Feature Importance Components

**Component**: `frontend/components/FeatureImportance/ImportanceChart.js` (150 lines)

**Displays**: Horizontal bar chart of top 20 features

```
Top Features by Importance

temperature_c_rolling_7d    ████████████████░░░ 0.85
humidity_pct_lag_3d          ██████████░░░░░░░░░ 0.52
weight_trend                 ████████░░░░░░░░░░░ 0.42
eggs_produced                ███████░░░░░░░░░░░░ 0.37
mortality_rate               ██████░░░░░░░░░░░░░ 0.33
[... more features ...]
```

**Tasks**:

- [ ] Create ImportanceChart component
- [ ] Fetch data from API
- [ ] Render horizontal bar chart
- [ ] Add hover tooltips
- [ ] Color code by importance

**Component**: `frontend/components/FeatureImportance/ImportanceTrend.js` (150 lines)

**Displays**: Line chart showing how importance changes over time

```
Feature Importance Over 90 Days

┌─────────────────────────────────────┐
│ 0.9 │  ╱╲                          │
│ 0.8 │ ╱  ╲    ╱╲    ╭─────────     │
│ 0.7 │╱    ╲╭─╯  ╰╮ ╱              │
│ 0.6 │      ╱      ╲╱               │
│     └─────────────────────────────│
│     Oct 1        Nov 1        Dec 1│
└─────────────────────────────────────┘
```

**Tasks**:

- [ ] Create ImportanceTrend component
- [ ] Fetch historical data from API
- [ ] Render line chart with trend
- [ ] Add moving average overlay
- [ ] Add date range selector

**Component**: `frontend/components/FeatureImportance/RoomComparison.js` (150 lines)

**Displays**: Heatmap comparing features across rooms

**Page**: `frontend/pages/features.js` (300-350 lines)

**Layout**:

```
┌─────────────────────────────────────────┐
│ Feature Importance Analysis             │
├─────────────────────────────────────────┤
│ [Room Selector] [Time Period] [Export]  │
│                                         │
│ Global Top Features                     │
│ [ ImportanceChart ]                     │
│                                         │
│ Importance Trends (90 days)             │
│ [ ImportanceTrend ]                     │
│                                         │
│ Room Comparison                         │
│ [ RoomComparison Heatmap ]              │
│                                         │
│ Seasonal Analysis                       │
│ Spring  Summer  Fall  Winter            │
│ [Seasonal Bar Charts]                   │
└─────────────────────────────────────────┘
```

**Tasks**:

- [ ] Create features.js page
- [ ] Add room selector
- [ ] Add time period selector
- [ ] Integrate all components
- [ ] Add export functionality
- [ ] Responsive design
- [ ] Write tests

---

### 4.7-4.11 Visualization & Testing

**Visualization Types** (using Recharts):

1. **Horizontal Bar Chart**

   - Features on Y-axis, importance on X-axis
   - Top 20 features
   - Animated bars

2. **Line Chart** (Trends)

   - Time on X-axis, importance on Y-axis
   - Multiple features with legend
   - Hover tooltips

3. **Heatmap** (Room Comparison)

   - Rooms on Y-axis, features on X-axis
   - Color intensity = importance
   - Cells show exact values

4. **Pie Chart** (Dominance)
   - Top 5 features vs Others
   - Show percentage

**Testing Tasks**:

- [ ] Unit tests for importance calculation
- [ ] Integration tests with real models
- [ ] Component rendering tests
- [ ] Chart accuracy tests
- [ ] Performance tests (<1s API)
- [ ] Real data validation

---

## FINAL INTEGRATION CHECKLIST

### 4.8 Integration with Main App

**Updates to Existing Files**:

- [ ] Update `frontend/components/Navbar.js` - Add links to new pages
- [ ] Update `frontend/pages/_app.js` - Add new routes
- [ ] Update `backend/main.py` - Register new routers
- [ ] Update database migrations - Run all new schemas
- [ ] Update documentation index

### 4.9 Database Migrations

- [ ] Create migration: 002_add_anomalies.py
- [ ] Create migration: 003_add_feature_importance.py
- [ ] Test migrations up/down
- [ ] Backup production DB before running

### 4.10 Performance Testing

- [ ] Load test monitoring endpoints
- [ ] Load test anomaly detection
- [ ] Load test explainability
- [ ] Load test feature importance
- [ ] Verify all response times <2s
- [ ] Check memory usage

### 4.11 Documentation

- [ ] Write user guide for monitoring dashboard
- [ ] Write API documentation for new endpoints
- [ ] Document anomaly detection algorithm
- [ ] Document SHAP explainability
- [ ] Create deployment guide

---

## SUCCESS METRICS

**Phase 12 is complete when:**

✅ All 4 sections implemented and tested  
✅ 1000+ lines of code added  
✅ 100% test coverage  
✅ All API endpoints respond in <2s  
✅ Frontend components render smoothly  
✅ Documentation complete  
✅ Zero critical bugs  
✅ Real data tested (farm_C, farm_D)

---

**Estimated Total Time**: 8 hours  
**Start Date**: December 7, 2025  
**Target Completion**: December 8, 2025 (continuous)

---

_This detailed breakdown is ready to use as-is. Start with Section 1, complete all tasks, commit, then move to Section 2. One section at a time._
