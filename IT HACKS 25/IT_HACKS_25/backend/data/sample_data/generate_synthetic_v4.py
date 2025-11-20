# generate_synthetic_v4.py
"""
Version 4 synthetic poultry data generator - OPTIMIZED FOR ML TRAINING (Phase 7)
- Multiple farms with generic names (Joseph's Farm, Diana's Farm, Nazim's Farm)
- Enhanced feature engineering scenarios for ML model testing
- Diverse patterns: high-performers, average, struggling farms
- Rich temporal patterns for better forecasting
- Realistic anomalies and interventions for anomaly detection
- Feed efficiency variations for recommendation engine testing

ML-Optimized Features:
- Rolling averages (3-day, 7-day) test data
- Lag feature variations (1-day, 3-day correlations)
- Trend indicators (improving, stable, declining farms)
- Seasonal pattern diversity (winter/summer stress responses)
- Anomaly scenarios: mortality spikes, feed inefficiency, weight plateaus
- Temperature stress events (heat waves, cold snaps)
- Recovery patterns after interventions

Farm Profiles:
- Joseph's Farm: High-performing, stable operations (4 rooms)
- Diana's Farm: Average operations with some challenges (3 rooms)
- Nazim's Farm: Struggling farm with optimization opportunities (3 rooms)

Usage:
    python generate_synthetic_v4.py --out synthetic_v4.csv --seed 42
    python generate_synthetic_v4.py --weeks 26 --out half_year.csv
"""

import csv
import random
import argparse
import datetime
from pathlib import Path
from typing import List, Dict, Any, Tuple
import math
import numpy as np

# ================================
# CONFIGURATION CONSTANTS
# ================================

# Farm configurations
FARMS = [
    {"name": "Joseph's Farm", "id": "FARM_001", "rooms": 4, "performance": "excellent"},
    {"name": "Diana's Farm", "id": "FARM_002", "rooms": 3, "performance": "average"},
    {"name": "Nazim's Farm", "id": "FARM_003", "rooms": 3, "performance": "struggling"},
]

BIRDS_PER_ROOM = 1000
DEFAULT_WEEKS = 104  # 2 years
DEFAULT_DAYS = DEFAULT_WEEKS * 7  # 728 days

# Biological milestones (days)
LAYING_START_MIN = 126  # Week 18
LAYING_START_MAX = 140  # Week 20
PEAK_PRODUCTION_DAY = 210  # Week 30 - peak egg production
MATURITY_WEIGHT_DAY = 126  # When birds reach full body weight

# Weight progression (kg) - realistic layer chicken growth
WEIGHT_CURVE = {
    0: 0.042,      # Day-old chick
    7: 0.085,      # 1 week
    14: 0.155,     # 2 weeks
    21: 0.245,     # 3 weeks
    28: 0.385,     # 4 weeks
    42: 0.685,     # 6 weeks
    56: 1.025,     # 8 weeks
    70: 1.285,     # 10 weeks
    84: 1.485,     # 12 weeks
    98: 1.625,     # 14 weeks
    112: 1.725,    # 16 weeks
    126: 1.785,    # 18 weeks (sexual maturity)
    140: 1.825,    # 20 weeks (start of lay)
    168: 1.875,    # 24 weeks
    196: 1.915,    # 28 weeks
    224: 1.945,    # 32 weeks
    280: 1.975,    # 40 weeks
    364: 2.015,    # 52 weeks
}

# Feed stages and intake
FEED_STAGES = {
    "starter": (0, 28, 0.022),      # 0-4 weeks, ~22g/bird/day
    "grower": (29, 70, 0.055),      # 5-10 weeks, ~55g/bird/day
    "developer": (71, 125, 0.085),  # 11-17 weeks, ~85g/bird/day
    "pre_lay": (126, 140, 0.105),   # 18-20 weeks, ~105g/bird/day
    "layer": (141, 999, 0.115),     # 20+ weeks, ~115g/bird/day
}

# Environmental ranges (comfortable)
TEMP_OPTIMAL = 21.0  # °C
TEMP_RANGE = (18.0, 28.0)  # Acceptable range
HUMIDITY_OPTIMAL = 60.0  # %
HUMIDITY_RANGE = (40.0, 75.0)  # Acceptable range

# Financial parameters (USD)
FEED_PRICE_BASE = 0.42  # per kg
EGG_PRICE_BASE = 3.20  # per dozen
CHICK_COST = 0.45  # per bird (one-time)
MEDICINE_PER_BIRD_DAY = 0.0025
ENERGY_PER_ROOM_DAY = 5.50
LABOR_PER_ROOM_DAY = 12.00
MAINTENANCE_PER_ROOM_DAY = 2.50

# Mortality rates (% per day)
MORTALITY_BASE = 0.08  # 0.08% per day = ~0.56% per week
MORTALITY_CHICK = 0.15  # Higher in first 2 weeks
MORTALITY_STRESS_MULTIPLIER = 2.5  # During high stress

# Farm-specific performance multipliers
PERFORMANCE_PROFILES = {
    "excellent": {
        "genetic_factor": (1.02, 1.05),      # Better genetics
        "mortality_multiplier": 0.6,          # 40% lower mortality
        "feed_efficiency": 0.95,              # 5% better FCR
        "stress_resistance": 0.7,             # Better stress handling
        "management_quality": 1.15,           # Better egg quality
        "outbreak_probability": 0.003,        # Less outbreaks
        "temp_control_quality": 0.8,          # Better climate control
    },
    "average": {
        "genetic_factor": (0.98, 1.02),
        "mortality_multiplier": 1.0,
        "feed_efficiency": 1.0,
        "stress_resistance": 1.0,
        "management_quality": 1.0,
        "outbreak_probability": 0.005,
        "temp_control_quality": 1.0,
    },
    "struggling": {
        "genetic_factor": (0.95, 0.98),      # Lower quality stock
        "mortality_multiplier": 1.5,          # 50% higher mortality
        "feed_efficiency": 1.10,              # 10% worse FCR
        "stress_resistance": 1.4,             # Poor stress handling
        "management_quality": 0.85,           # Lower egg quality
        "outbreak_probability": 0.008,        # More outbreaks
        "temp_control_quality": 1.3,          # Poor climate control
    },
}

# ================================
# HELPER FUNCTIONS
# ================================

def interpolate_weight(age_days: int) -> float:
    """Smooth interpolation of weight from growth curve."""
    keys = sorted(WEIGHT_CURVE.keys())
    
    if age_days <= keys[0]:
        return WEIGHT_CURVE[keys[0]]
    if age_days >= keys[-1]:
        return WEIGHT_CURVE[keys[-1]]
    
    # Find bounding points
    lower = max(k for k in keys if k <= age_days)
    upper = min(k for k in keys if k >= age_days)
    
    if lower == upper:
        return WEIGHT_CURVE[lower]
    
    # Cubic smoothstep interpolation
    progress = (age_days - lower) / (upper - lower)
    smooth = progress * progress * (3 - 2 * progress)
    
    return WEIGHT_CURVE[lower] + smooth * (WEIGHT_CURVE[upper] - WEIGHT_CURVE[lower])


def get_feed_intake(age_days: int, weight_kg: float, eggs_produced: int, 
                     birds: int, feed_efficiency: float) -> float:
    """Calculate daily feed intake per bird based on age and production."""
    # Find feed stage
    base_intake = 0.115  # default layer feed
    for stage, (min_day, max_day, intake) in FEED_STAGES.items():
        if min_day <= age_days <= max_day:
            base_intake = intake
            break
    
    # Adjust for production (layers need more feed when laying)
    if eggs_produced > 0 and birds > 0:
        lay_rate = eggs_produced / birds
        production_bonus = lay_rate * 0.015  # Extra 15g per egg laid
        base_intake += production_bonus
    
    # Apply farm efficiency factor
    base_intake *= feed_efficiency
    
    # Add small random variation
    return base_intake * random.uniform(0.95, 1.05)


def seasonal_temperature(day_of_year: int, base_temp: float = TEMP_OPTIMAL, 
                         control_quality: float = 1.0) -> float:
    """Calculate temperature with seasonal variation and control quality."""
    # Sine wave: peak in summer (day 180), low in winter (day 0/365)
    seasonal_amplitude = 6.0 * control_quality  # Worse control = more variation
    seasonal = base_temp + seasonal_amplitude * math.sin(2 * math.pi * (day_of_year - 90) / 365)
    
    # Add daily random variation (worse farms have more fluctuation)
    daily_noise = random.uniform(-2.5, 2.5) * control_quality
    
    return max(TEMP_RANGE[0] - 3, min(TEMP_RANGE[1] + 8, seasonal + daily_noise))


def seasonal_humidity(day_of_year: int, base_humidity: float = HUMIDITY_OPTIMAL,
                      control_quality: float = 1.0) -> float:
    """Calculate humidity with seasonal variation and control quality."""
    # Inverse to temperature (higher humidity in winter)
    seasonal_amplitude = 12.0 * control_quality
    seasonal = base_humidity + seasonal_amplitude * math.sin(2 * math.pi * (day_of_year + 90) / 365)
    
    # Add daily random variation
    daily_noise = random.uniform(-8.0, 8.0) * control_quality
    
    return max(25.0, min(95.0, seasonal + daily_noise))


def calculate_stress_index(temp_c: float, humidity_pct: float, 
                           stress_resistance: float) -> float:
    """Calculate stress index based on Temperature-Humidity Index (THI)."""
    # Comfort zone: 18-24°C, 45-70% humidity
    temp_stress = max(0, abs(temp_c - 21) - 3) / 12.0  # Normalized 0-1
    humidity_stress = max(0, abs(humidity_pct - 60) - 10) / 30.0  # Normalized 0-1
    
    combined_stress = (temp_stress * 0.65 + humidity_stress * 0.35) * stress_resistance
    return min(1.0, combined_stress)


def egg_production_rate(age_days: int, stress: float, health_factor: float,
                        management_quality: float) -> float:
    """Calculate egg laying rate (0-1) based on age, stress, and health."""
    if age_days < LAYING_START_MIN:
        return 0.0
    
    # Ramp up period (weeks 18-30)
    if age_days < PEAK_PRODUCTION_DAY:
        days_laying = age_days - LAYING_START_MIN
        ramp_progress = days_laying / (PEAK_PRODUCTION_DAY - LAYING_START_MIN)
        base_rate = 0.55 + (0.40 * ramp_progress)  # 55% -> 95%
    else:
        # Peak production maintained, slight decline after week 45
        if age_days < 315:  # Week 45
            base_rate = 0.95
        else:
            decline_days = age_days - 315
            base_rate = max(0.80, 0.95 - (decline_days * 0.0008))
    
    # Apply management quality
    base_rate *= management_quality
    
    # Apply stress and health penalties
    stress_penalty = 1.0 - (stress * 0.35)  # Up to 35% reduction
    health_penalty = health_factor  # 0.7-1.0 range
    
    # Daily random variation
    daily_variation = random.uniform(0.92, 1.08)
    
    final_rate = base_rate * stress_penalty * health_penalty * daily_variation
    return max(0.0, min(1.0, final_rate))


def egg_weight_grams(age_days: int, management_quality: float) -> float:
    """Calculate average egg weight based on hen age and management."""
    if age_days < LAYING_START_MIN:
        return 0.0
    
    # Eggs get larger as hens age
    days_laying = age_days - LAYING_START_MIN
    
    if days_laying < 30:
        # Small eggs initially (42-50g)
        base_weight = 42 + (days_laying * 0.25)
    elif days_laying < 120:
        # Growing to standard size (50-58g)
        base_weight = 50 + ((days_laying - 30) * 0.09)
    else:
        # Mature size with slight continued growth (58-62g)
        base_weight = min(62, 58 + ((days_laying - 120) * 0.02))
    
    # Apply management quality
    base_weight *= management_quality
    
    # Random variation
    return base_weight * random.uniform(0.96, 1.04)


def egg_grade_a_percent(egg_weight_g: float, stress: float, management_quality: float) -> float:
    """Calculate percentage of Grade A eggs based on weight and conditions."""
    if egg_weight_g == 0:
        return 0.0
    
    # Optimal weight range for Grade A: 53-63g
    if 53 <= egg_weight_g <= 63:
        base_grade_a = 92.0
    elif 50 <= egg_weight_g < 53 or 63 < egg_weight_g <= 66:
        base_grade_a = 78.0
    else:
        base_grade_a = 65.0
    
    # Apply management quality
    base_grade_a *= management_quality
    
    # Stress reduces quality
    stress_penalty = stress * 25.0
    
    result = max(55.0, min(95.0, base_grade_a - stress_penalty + random.uniform(-5, 5)))
    return round(result, 1)


def calculate_mortality(age_days: int, birds: int, stress: float, outbreak: bool,
                       mortality_multiplier: float) -> int:
    """Calculate daily mortality based on age, stress, and health events."""
    if birds <= 0:
        return 0
    
    # Base mortality rate
    if age_days < 14:
        base_rate = MORTALITY_CHICK / 100
    else:
        base_rate = MORTALITY_BASE / 100
    
    # Apply farm-specific mortality multiplier
    base_rate *= mortality_multiplier
    
    # Stress multiplier
    if stress > 0.6:
        base_rate *= (1 + stress * MORTALITY_STRESS_MULTIPLIER)
    
    # Outbreak multiplier
    if outbreak:
        base_rate *= random.uniform(4.0, 8.0)
    
    # Poisson distribution for realistic variation
    expected_deaths = birds * base_rate
    actual_deaths = np.random.poisson(expected_deaths)
    
    return min(birds, max(0, int(actual_deaths)))


def seasonal_price_factor(day_of_year: int, amplitude: float = 0.12) -> float:
    """Price multiplier based on season (demand patterns)."""
    # Peak prices in winter holidays
    return 1.0 + amplitude * math.sin(2 * math.pi * (day_of_year - 60) / 365)


def inject_ml_training_scenarios(day: int, room_states: Dict, farm_profile: Dict) -> None:
    """Inject specific scenarios to test ML features."""
    performance = farm_profile["performance"]
    
    # Scenario 1: Heat wave (tests temperature stress detection)
    if 150 <= day <= 157:  # Week 22 - summer heat wave
        for room_id in room_states:
            room_states[room_id]["temp_override"] = random.uniform(32.0, 36.0)
            room_states[room_id]["humidity_override"] = random.uniform(70.0, 80.0)
    
    # Scenario 2: Cold snap (tests cold stress detection)
    elif 280 <= day <= 286:  # Week 41 - winter cold
        for room_id in room_states:
            room_states[room_id]["temp_override"] = random.uniform(10.0, 14.0)
            room_states[room_id]["humidity_override"] = random.uniform(75.0, 85.0)
    
    # Scenario 3: Feed quality issue (tests feed inefficiency detection)
    elif performance == "struggling" and 200 <= day <= 213:
        for room_id in room_states:
            room_states[room_id]["feed_quality_penalty"] = 0.75  # 25% efficiency loss
    
    # Scenario 4: Weight plateau (tests stagnation detection)
    elif performance == "struggling" and 240 <= day <= 260:
        for room_id in room_states:
            room_states[room_id]["weight_stagnation"] = True
    
    # Scenario 5: Recovery after intervention (tests trend changes)
    elif performance == "struggling" and day == 265:
        for room_id in room_states:
            room_states[room_id]["intervention_recovery"] = True
            room_states[room_id]["weight_stagnation"] = False
            room_states[room_id]["feed_quality_penalty"] = 1.0


# ================================
# MAIN GENERATOR
# ================================

def generate_synthetic_v4(
    start_date: str = None,
    seed: int = None,
    weeks: int = None,
    out: str = "synthetic_v4.csv"
) -> List[Dict[str, Any]]:
    """Generate comprehensive multi-farm synthetic poultry data optimized for ML."""
    
    if seed is not None:
        random.seed(seed)
        np.random.seed(seed)
    
    if start_date:
        start = datetime.date.fromisoformat(start_date)
    else:
        start = datetime.date(2024, 1, 1)  # Full year back for historical data
    
    days = (weeks * 7) if weeks else DEFAULT_DAYS
    
    total_rooms = sum(farm["rooms"] for farm in FARMS)
    print(f"🐔 Generating ML-optimized synthetic poultry data...")
    print(f"📅 Start date: {start}")
    print(f"📊 Farms: {len(FARMS)} ({total_rooms} rooms total)")
    for farm in FARMS:
        print(f"   • {farm['name']}: {farm['rooms']} rooms ({farm['performance']})")
    print(f"🗓️  Duration: {weeks if weeks else DEFAULT_WEEKS} weeks ({days} days)")
    print(f"🥚 Birds per room: {BIRDS_PER_ROOM}")
    
    rows: List[Dict[str, Any]] = []
    
    # Generate data for each farm
    for farm in FARMS:
        farm_id = farm["id"]
        farm_name = farm["name"]
        num_rooms = farm["rooms"]
        performance = farm["performance"]
        profile = PERFORMANCE_PROFILES[performance]
        
        print(f"\n🏗️  Processing {farm_name}...")
        
        # Initialize room-specific parameters
        room_states = {}
        for r in range(1, num_rooms + 1):
            room_id = f"Room {r}"
            genetic_min, genetic_max = profile["genetic_factor"]
            room_states[room_id] = {
                "birds": BIRDS_PER_ROOM,
                "cumulative_mortality": 0,
                "temp_bias": random.uniform(-1.0, 1.0),
                "humidity_bias": random.uniform(-3.0, 3.0),
                "genetic_factor": random.uniform(genetic_min, genetic_max),
                "laying_start_day": random.randint(LAYING_START_MIN, LAYING_START_MAX),
                "outbreak_cooldown": 0,
                # ML scenario overrides
                "temp_override": None,
                "humidity_override": None,
                "feed_quality_penalty": 1.0,
                "weight_stagnation": False,
                "intervention_recovery": False,
            }
        
        # Generate daily data
        for day in range(days):
            current_date = start + datetime.timedelta(days=day)
            week = (day // 7) + 1
            day_of_week = (day % 7) + 1
            day_of_year = current_date.timetuple().tm_yday
            
            # Inject ML training scenarios
            inject_ml_training_scenarios(day, room_states, farm)
            
            for room_id, state in room_states.items():
                birds_start = state["birds"]
                
                if birds_start <= 0:
                    # Room depleted, generate zero record
                    row = create_empty_row(farm_id, farm_name, room_id, current_date, 
                                          week, day_of_week, day)
                    rows.append(row)
                    continue
                
                # === BIOLOGICAL PARAMETERS ===
                
                # Weight progression
                base_weight = interpolate_weight(day) * state["genetic_factor"]
                
                # Apply weight stagnation scenario
                if state["weight_stagnation"]:
                    base_weight *= 0.98  # Minimal growth
                
                # Apply recovery boost
                if state["intervention_recovery"]:
                    base_weight *= 1.015  # Catch-up growth
                
                avg_weight_kg = round(base_weight * random.uniform(0.98, 1.02), 3)
                
                # Daily weight gain
                if day == 0:
                    daily_gain_kg = 0.0
                else:
                    prev_weight = interpolate_weight(day - 1) * state["genetic_factor"]
                    if state["weight_stagnation"]:
                        prev_weight *= 0.98
                    if state["intervention_recovery"]:
                        prev_weight *= 1.015
                    daily_gain_kg = round(avg_weight_kg - prev_weight, 4)
                
                # === ENVIRONMENTAL CONDITIONS ===
                
                if state["temp_override"] is not None:
                    temp_c = round(state["temp_override"], 1)
                else:
                    temp_c = round(seasonal_temperature(day_of_year, TEMP_OPTIMAL, 
                                                       profile["temp_control_quality"]) + state["temp_bias"], 1)
                
                if state["humidity_override"] is not None:
                    humidity_pct = round(state["humidity_override"], 1)
                else:
                    humidity_pct = round(seasonal_humidity(day_of_year, HUMIDITY_OPTIMAL,
                                                          profile["temp_control_quality"]) + state["humidity_bias"], 1)
                
                stress_index = round(calculate_stress_index(temp_c, humidity_pct, 
                                                           profile["stress_resistance"]), 3)
                
                # === HEALTH EVENTS ===
                
                # Disease outbreak probability
                state["outbreak_cooldown"] = max(0, state["outbreak_cooldown"] - 1)
                outbreak_today = False
                
                if state["outbreak_cooldown"] == 0 and random.random() < profile["outbreak_probability"]:
                    outbreak_today = True
                    state["outbreak_cooldown"] = random.randint(14, 28)
                
                health_factor = 0.85 if outbreak_today else random.uniform(0.95, 1.0)
                
                # === MORTALITY ===
                
                mortality_count = calculate_mortality(day, birds_start, stress_index, 
                                                      outbreak_today, profile["mortality_multiplier"])
                birds_end = birds_start - mortality_count
                state["cumulative_mortality"] += mortality_count
                
                # === EGG PRODUCTION ===
                
                if day >= state["laying_start_day"]:
                    lay_rate = egg_production_rate(day, stress_index, health_factor,
                                                   profile["management_quality"])
                    eggs_produced = int(round(birds_start * lay_rate))
                    avg_egg_weight_g = round(egg_weight_grams(day, profile["management_quality"]), 1)
                    egg_grade_a_pct = egg_grade_a_percent(avg_egg_weight_g, stress_index, 
                                                          profile["management_quality"])
                else:
                    eggs_produced = 0
                    avg_egg_weight_g = 0.0
                    egg_grade_a_pct = 0.0
                
                # === FEED & WATER ===
                
                effective_feed_efficiency = profile["feed_efficiency"] * state["feed_quality_penalty"]
                feed_per_bird_kg = get_feed_intake(day, avg_weight_kg, eggs_produced, 
                                                   birds_start, effective_feed_efficiency)
                feed_kg_total = round(feed_per_bird_kg * birds_start, 2)
                
                # Water consumption: 1.8-2.2x feed intake
                water_per_bird = feed_per_bird_kg * random.uniform(1.8, 2.2)
                water_liters_total = round(water_per_bird * birds_start, 1)
                
                # Feed Conversion Ratio
                if daily_gain_kg > 0 and day > 0:
                    total_weight_gain_kg = daily_gain_kg * birds_start
                    fcr = round(feed_kg_total / total_weight_gain_kg if total_weight_gain_kg > 0 else 0, 3)
                else:
                    fcr = 0.0
                
                # === FINANCIAL CALCULATIONS ===
                
                # Feed costs
                feed_price_kg = round(FEED_PRICE_BASE * seasonal_price_factor(day_of_year, 0.08), 3)
                feed_cost_usd = round(feed_kg_total * feed_price_kg, 2)
                
                # Medical costs
                med_base = MEDICINE_PER_BIRD_DAY * birds_start
                med_outbreak = mortality_count * 5.0 if outbreak_today else 0
                med_cost_usd = round(med_base + med_outbreak, 2)
                
                # Energy costs
                energy_multiplier = 1.0 + (abs(temp_c - TEMP_OPTIMAL) / 15.0)
                energy_cost_usd = round(ENERGY_PER_ROOM_DAY * energy_multiplier, 2)
                
                # Labor costs
                labor_cost_usd = round(LABOR_PER_ROOM_DAY * random.uniform(0.95, 1.05), 2)
                
                # Maintenance and other costs
                other_costs_usd = round(MAINTENANCE_PER_ROOM_DAY * random.uniform(0.90, 1.10), 2)
                
                total_costs_usd = round(
                    feed_cost_usd + med_cost_usd + energy_cost_usd + labor_cost_usd + other_costs_usd,
                    2
                )
                
                # Egg revenue
                egg_price_dozen = round(EGG_PRICE_BASE * seasonal_price_factor(day_of_year, 0.15), 2)
                egg_revenue_usd = round((eggs_produced / 12.0) * egg_price_dozen, 2)
                
                # Daily profit
                profit_usd = round(egg_revenue_usd - total_costs_usd, 2)
                
                # === BUILD ROW ===
                
                row = {
                    "farm_id": farm_id,
                    "farm_name": farm_name,
                    "room_id": room_id,
                    "date": current_date.isoformat(),
                    "week": week,
                    "day_of_week": day_of_week,
                    "age_days": day,
                    "birds_start": birds_start,
                    "mortality_daily": mortality_count,
                    "birds_end": birds_end,
                    "cumulative_mortality": state["cumulative_mortality"],
                    "mortality_rate": round((state["cumulative_mortality"] / BIRDS_PER_ROOM) * 100, 2),
                    "avg_weight_kg": avg_weight_kg,
                    "daily_gain_kg": daily_gain_kg,
                    "feed_kg_total": feed_kg_total,
                    "feed_kg_per_bird": round(feed_per_bird_kg, 4),
                    "water_liters_total": water_liters_total,
                    "eggs_produced": eggs_produced,
                    "avg_egg_weight_g": avg_egg_weight_g,
                    "egg_grade_a_pct": egg_grade_a_pct,
                    "temperature_c": temp_c,
                    "humidity_pct": humidity_pct,
                    "stress_index": stress_index,
                    "health_event": "outbreak" if outbreak_today else "normal",
                    "feed_price_per_kg_usd": feed_price_kg,
                    "feed_cost_usd": feed_cost_usd,
                    "med_cost_usd": med_cost_usd,
                    "energy_cost_usd": energy_cost_usd,
                    "labor_cost_usd": labor_cost_usd,
                    "other_costs_usd": other_costs_usd,
                    "total_costs_usd": total_costs_usd,
                    "egg_price_per_dozen_usd": egg_price_dozen,
                    "egg_revenue_usd": egg_revenue_usd,
                    "profit_usd": profit_usd,
                    "fcr": fcr,
                }
                
                rows.append(row)
                
                # Update room state
                state["birds"] = birds_end
            
            # Clear scenario overrides after the day
            for room_id in room_states:
                if day not in range(150, 158) and day not in range(280, 287):
                    room_states[room_id]["temp_override"] = None
                    room_states[room_id]["humidity_override"] = None
    
    # === SAVE CSV ===
    
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    
    if rows:
        fieldnames = list(rows[0].keys())
        with open(out, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
        
        print(f"\n✅ Generated {len(rows):,} rows")
        print(f"📁 Saved to: {out}")
        
        # === SUMMARY STATISTICS ===
        
        print(f"\n📊 FARM PERFORMANCE SUMMARY:")
        
        for farm in FARMS:
            farm_id = farm["id"]
            farm_name = farm["name"]
            farm_rows = [r for r in rows if r["farm_id"] == farm_id]
            
            if not farm_rows:
                continue
            
            final_date_rows = [r for r in farm_rows if r["age_days"] == days - 1]
            
            total_birds_final = sum(r["birds_end"] for r in final_date_rows)
            total_mortality = sum(r["cumulative_mortality"] for r in final_date_rows)
            initial_birds = farm["rooms"] * BIRDS_PER_ROOM
            
            total_eggs = sum(r["eggs_produced"] for r in farm_rows)
            total_revenue = sum(r["egg_revenue_usd"] for r in farm_rows)
            total_costs = sum(r["total_costs_usd"] for r in farm_rows)
            total_profit = total_revenue - total_costs
            
            avg_fcr = np.mean([r["fcr"] for r in farm_rows if r["fcr"] > 0])
            avg_stress = np.mean([r["stress_index"] for r in farm_rows])
            
            print(f"\n  {farm_name} ({farm['performance'].upper()}):")
            print(f"    • Survival rate: {(total_birds_final/initial_birds)*100:.1f}%")
            print(f"    • Total eggs: {total_eggs:,}")
            print(f"    • Total profit: ${total_profit:,.2f}")
            print(f"    • Average FCR: {avg_fcr:.2f}")
            print(f"    • Average stress: {avg_stress:.3f}")
        
        print(f"\n🎉 ML-optimized data generation complete!")
        print(f"💡 Data includes:")
        print(f"   • Multiple farm performance levels for comparison")
        print(f"   • Seasonal temperature/humidity variations")
        print(f"   • Heat wave and cold snap events (weeks 22, 41)")
        print(f"   • Feed inefficiency scenarios")
        print(f"   • Weight plateau and recovery patterns")
        print(f"   • Rich temporal features for ML training")
    
    return rows


def create_empty_row(farm_id, farm_name, room_id, date, week, day_of_week, age_days):
    """Create a zero-filled row for depleted rooms."""
    return {
        "farm_id": farm_id,
        "farm_name": farm_name,
        "room_id": room_id,
        "date": date.isoformat(),
        "week": week,
        "day_of_week": day_of_week,
        "age_days": age_days,
        "birds_start": 0,
        "mortality_daily": 0,
        "birds_end": 0,
        "cumulative_mortality": 0,
        "mortality_rate": 0.0,
        "avg_weight_kg": 0.0,
        "daily_gain_kg": 0.0,
        "feed_kg_total": 0.0,
        "feed_kg_per_bird": 0.0,
        "water_liters_total": 0.0,
        "eggs_produced": 0,
        "avg_egg_weight_g": 0.0,
        "egg_grade_a_pct": 0.0,
        "temperature_c": 0.0,
        "humidity_pct": 0.0,
        "stress_index": 0.0,
        "health_event": "depleted",
        "feed_price_per_kg_usd": 0.0,
        "feed_cost_usd": 0.0,
        "med_cost_usd": 0.0,
        "energy_cost_usd": 0.0,
        "labor_cost_usd": 0.0,
        "other_costs_usd": 0.0,
        "total_costs_usd": 0.0,
        "egg_price_per_dozen_usd": 0.0,
        "egg_revenue_usd": 0.0,
        "profit_usd": 0.0,
        "fcr": 0.0,
    }


# ================================
# CLI
# ================================

def parse_args():
    parser = argparse.ArgumentParser(
        description="Generate Version 4 ML-optimized synthetic poultry data",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--start-date",
        type=str,
        default="2024-01-01",
        help="Simulation start date (YYYY-MM-DD)"
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for reproducibility"
    )
    parser.add_argument(
        "--weeks",
        type=int,
        default=None,
        help=f"Number of weeks to simulate (default: {DEFAULT_WEEKS})"
    )
    parser.add_argument(
        "--out",
        type=str,
        default="synthetic_v4.csv",
        help="Output CSV filename"
    )
    return parser.parse_args()


def main():
    args = parse_args()
    generate_synthetic_v4(
        start_date=args.start_date,
        seed=args.seed,
        weeks=args.weeks,
        out=args.out
    )


if __name__ == "__main__":
    main()
