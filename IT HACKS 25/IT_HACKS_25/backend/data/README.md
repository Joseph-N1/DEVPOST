# EcoFarm Data Management

This directory contains all farm datasets and data generation scripts for the EcoFarm application.

## 📁 Folder Structure

```
backend/data/
├── generate_multi_farm.py          # Main data generation script
├── validate_csvs.py                # CSV validation script
├── generated/                      # Generated farm CSV files
│   ├── farm_A_1yr_weekly.csv       # Farm A: 1 year, 4 rooms
│   ├── farm_B_1yr_weekly.csv       # Farm B: 1 year, 4 rooms
│   ├── farm_C_2yr_weekly.csv       # Farm C: 2 years, 4 rooms
│   ├── farm_D_3yr_weekly.csv       # Farm D: 3 years, 4 rooms
│   └── farm_E_2yr_weekly_large.csv # Farm E: 2 years, 4 rooms (large flock)
├── validate_report.json            # Validation report (auto-generated)
├── uploads/                        # User-uploaded CSV files
└── sample_data/                    # Legacy sample data (optional)
```

## 📊 Dataset Details

### farm_A_1yr_weekly.csv

- **Duration:** 1 year (52 weeks)
- **Rows:** 208 (52 weeks × 4 rooms)
- **Rooms:** 4 (Room 1, Room 2, Room 3, Room 4)
- **Flock Size:** 1,000-2,200 birds per room
- **Use Case:** Quick testing, basic analytics

### farm_B_1yr_weekly.csv

- **Duration:** 1 year (52 weeks)
- **Rows:** 208 (52 weeks × 4 rooms)
- **Rooms:** 4
- **Flock Size:** 1,000-2,200 birds per room
- **Use Case:** Comparison analysis between farms

### farm_C_2yr_weekly.csv

- **Duration:** 2 years (104 weeks)
- **Rows:** 416 (104 weeks × 4 rooms)
- **Rooms:** 4
- **Flock Size:** 1,000-2,200 birds per room
- **Use Case:** Long-term trend analysis, seasonal patterns

### farm_D_3yr_weekly.csv

- **Duration:** 3 years (156 weeks)
- **Rows:** 624 (156 weeks × 4 rooms)
- **Rooms:** 4
- **Flock Size:** 1,000-2,200 birds per room
- **Use Case:** Extended historical analysis, ML model training

### farm_E_2yr_weekly_large.csv

- **Duration:** 2 years (104 weeks)
- **Rows:** 416 (104 weeks × 4 rooms)
- **Rooms:** 4
- **Flock Size:** 2,000-3,500 birds per room (large commercial farm)
- **Use Case:** Scaled-up operations, high-volume production

## 📋 CSV Column Definitions

### Basic Identification

| Column        | Type                | Description                |
| ------------- | ------------------- | -------------------------- |
| `date`        | string (YYYY-MM-DD) | Observation date           |
| `week`        | integer             | Week number (1-156)        |
| `day_of_week` | integer             | Day of week (1-7, Mon-Sun) |
| `age_days`    | integer             | Bird age in days           |
| `room_id`     | string              | Room identifier (Room 1-4) |

### Flock Metrics

| Column                 | Type    | Description                         | Unit      | Range     |
| ---------------------- | ------- | ----------------------------------- | --------- | --------- |
| `birds_start`          | integer | Initial flock size at start of week | birds     | 1000-3500 |
| `mortality_daily`      | integer | Daily mortality count               | birds/day | 0-5       |
| `birds_end`            | integer | Flock size at end of week           | birds     | 100-3500  |
| `cumulative_mortality` | integer | Total birds lost to date            | birds     | 0+        |
| `mortality_rate`       | float   | Percentage of birds lost            | %         | 0-100     |

### Growth & Nutrition

| Column               | Type  | Description             | Unit    | Range    |
| -------------------- | ----- | ----------------------- | ------- | -------- |
| `avg_weight_kg`      | float | Average bird weight     | kg      | 0.04-2.5 |
| `daily_gain_kg`      | float | Weight gain per day     | kg/day  | 0-0.03   |
| `feed_kg_total`      | float | Total feed consumed     | kg      | 0-500    |
| `feed_kg_per_bird`   | float | Feed per bird           | kg/bird | 0-0.5    |
| `water_liters_total` | float | Total water consumption | liters  | 0-800    |

### Egg Production

| Column             | Type    | Description             | Unit  | Range  |
| ------------------ | ------- | ----------------------- | ----- | ------ |
| `eggs_produced`    | integer | Daily eggs laid         | eggs  | 0-2000 |
| `avg_egg_weight_g` | float   | Average egg weight      | grams | 45-70  |
| `egg_grade_a_pct`  | float   | Percentage Grade A eggs | %     | 30-95  |

### Environmental Conditions

| Column          | Type   | Description             | Unit | Range                             |
| --------------- | ------ | ----------------------- | ---- | --------------------------------- |
| `temperature_c` | float  | Room temperature        | °C   | 14-28                             |
| `humidity_pct`  | float  | Room humidity level     | %    | 30-85                             |
| `stress_index`  | float  | Calculated stress level | 0-1  | 0-1                               |
| `health_event`  | string | Event type              | -    | normal, disease, heat_stress, etc |

### Economics

| Column                    | Type  | Description               | Unit      |
| ------------------------- | ----- | ------------------------- | --------- |
| `feed_price_per_kg_usd`   | float | Cost per kg feed          | USD       |
| `feed_cost_usd`           | float | Weekly feed cost          | USD       |
| `med_cost_usd`            | float | Weekly medical costs      | USD       |
| `energy_cost_usd`         | float | Weekly energy costs       | USD       |
| `labor_cost_usd`          | float | Weekly labor costs        | USD       |
| `other_costs_usd`         | float | Other miscellaneous costs | USD       |
| `total_costs_usd`         | float | Total weekly costs        | USD       |
| `egg_price_per_dozen_usd` | float | Egg market price          | USD/dozen |
| `egg_revenue_usd`         | float | Weekly egg revenue        | USD       |
| `profit_usd`              | float | Weekly profit/loss        | USD       |

### Production Efficiency

| Column | Type  | Description           | Unit               | Range  |
| ------ | ----- | --------------------- | ------------------ | ------ |
| `fcr`  | float | Feed Conversion Ratio | kg feed/dozen eggs | 0.5-10 |

## 🚀 Usage

### 1. Generate New Data

```bash
cd backend/data
python generate_multi_farm.py
```

Creates 5 new CSVs in the `generated/` folder.

### 2. Validate CSVs

```bash
cd backend/data
python validate_csvs.py
```

Validates all CSVs and outputs `validate_report.json`.

### 3. Upload to Backend

```bash
# Method 1: Via API
curl -X POST -F "file=@backend/data/generated/farm_A_1yr_weekly.csv" \
  http://localhost:8000/upload/csv

# Method 2: Via Dashboard
1. Login to http://localhost:3000
2. Go to Upload page
3. Select CSV and click Upload
```

### 4. Use in ML Training

```bash
cd backend
python ml/train.py  # Auto-loads latest CSV from generated/
```

### 5. Preview in Dashboard

1. Go to http://localhost:3000/dashboard
2. Data auto-loads from uploaded CSVs
3. Analytics, predictions, and reports available

## 🔍 Data Validation

The `validate_csvs.py` script checks:

- ✅ All 33 required columns present
- ✅ Correct data types (int, float, string, date)
- ✅ No NaN values in critical columns
- ✅ Valid date format and chronological order
- ✅ 4 rooms per dataset
- ✅ Numeric ranges (mortality 0-100%, humidity 0-100%, etc)

View validation results:

```bash
cat backend/data/validate_report.json
```

## 📊 ML Model Compatibility

The generated CSVs are fully compatible with:

- **Random Forest** model training
- **Gradient Boosting** model training
- **LSTM** neural networks
- **Prophet** time series forecasting

Features automatically engineered:

- Rolling averages (7, 14, 30-day windows)
- Rate of change calculations
- Seasonal components
- Lag features
- Interaction terms

## 🔒 Data Privacy & Security

- All data is synthetic/simulated
- No real farm data included
- Safe for demo, development, and testing
- No personal/proprietary information
- Can be freely used for training purposes

## 📈 Analytics Support

These datasets support:

- Dashboard visualizations
- KPI calculations
- Anomaly detection
- Forecasting
- Comparative analysis
- Export (CSV, PDF)
- Report generation

## ⚙️ Configuration

To modify data generation parameters, edit `generate_multi_farm.py`:

```python
# Change flock sizes
if large:
    flock_size = np.random.randint(2000, 4000)  # Larger range
else:
    flock_size = np.random.randint(800, 1800)   # Smaller range

# Adjust seasonal variation
seasonal_curve = 0.5 + 0.7 * np.sin(...)  # More variation

# Modify health event frequency
if rand < 0.05:  # 5% event rate
    health_events.append("disease")
```

## 📝 Next Steps (Phase 11)

1. **Data Pipeline Enhancement**

   - Add real-time data ingestion
   - Implement streaming analytics
   - Add data quality monitoring

2. **ML Model Improvements**

   - Ensemble model voting
   - Real-time model retraining
   - A/B testing framework

3. **Advanced Analytics**

   - Causal inference analysis
   - Multi-farm comparison engine
   - Predictive maintenance

4. **Data Integration**
   - Cloud storage (S3)
   - Data warehouse (PostgreSQL)
   - API streaming endpoints

## 📧 Support

For issues or questions about data:

- Check validation report: `validate_report.json`
- Review generated CSV headers
- Run validation script again
- Check backend logs: `docker compose logs backend`

---

**Last Updated:** December 2025  
**Status:** Phase 10 Data Rebuild ✅
