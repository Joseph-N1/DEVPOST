# generate_synthetic_v3.py
"""
Version 3 synthetic poultry data generator - Enhanced for IT Hacks 25 Dashboard
- 4 rooms with 1000 birds each
- 52 weeks (364 days) full year simulation
- Egg production starts around week 18-20 (days 126-140)
- Realistic layer chicken lifecycle with all KPIs for Reports & Analytics pages
- Enhanced features: seasonal patterns, disease outbreaks, feed efficiency tracking

Features tracked per day per room:
- Bird count, mortality, weight progression
- Egg production (quantity, weight, grade)
- Feed consumption and FCR
- Water intake
- Temperature and humidity with seasonal patterns
- Stress index and health indicators
- Financial metrics (costs, revenue, profit)

Usage:
    python generate_synthetic_v3.py --out synthetic_v3.csv --seed 42
    python generate_synthetic_v3.py --start-date 2025-01-01 --out data_2025.csv
"""

import csv
import random
import argparse
import datetime
from pathlib import Path
from typing import List, Dict, Any
import math
import numpy as np

# ================================
# CONFIGURATION CONSTANTS
# ================================

# Farm configuration
ROOMS = 4
BIRDS_PER_ROOM = 1000
WEEKS = 52
DAYS = WEEKS * 7  # 364 days

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


def get_feed_intake(age_days: int, weight_kg: float, eggs_produced: int, birds: int) -> float:
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
    
    # Add small random variation
    return base_intake * random.uniform(0.95, 1.05)


def seasonal_temperature(day_of_year: int, base_temp: float = TEMP_OPTIMAL) -> float:
    """Calculate temperature with seasonal variation."""
    # Sine wave: peak in summer (day 180), low in winter (day 0/365)
    seasonal_amplitude = 6.0  # ±6°C seasonal swing
    seasonal = base_temp + seasonal_amplitude * math.sin(2 * math.pi * (day_of_year - 90) / 365)
    
    # Add daily random variation
    daily_noise = random.uniform(-2.5, 2.5)
    
    return max(TEMP_RANGE[0], min(TEMP_RANGE[1] + 5, seasonal + daily_noise))


def seasonal_humidity(day_of_year: int, base_humidity: float = HUMIDITY_OPTIMAL) -> float:
    """Calculate humidity with seasonal variation."""
    # Inverse to temperature (higher humidity in winter)
    seasonal_amplitude = 12.0  # ±12% seasonal swing
    seasonal = base_humidity + seasonal_amplitude * math.sin(2 * math.pi * (day_of_year + 90) / 365)
    
    # Add daily random variation
    daily_noise = random.uniform(-8.0, 8.0)
    
    return max(25.0, min(95.0, seasonal + daily_noise))


def calculate_stress_index(temp_c: float, humidity_pct: float) -> float:
    """Calculate stress index based on Temperature-Humidity Index (THI)."""
    # Comfort zone: 18-24°C, 45-70% humidity
    temp_stress = max(0, abs(temp_c - 21) - 3) / 12.0  # Normalized 0-1
    humidity_stress = max(0, abs(humidity_pct - 60) - 10) / 30.0  # Normalized 0-1
    
    combined_stress = (temp_stress * 0.65 + humidity_stress * 0.35)
    return min(1.0, combined_stress)


def egg_production_rate(age_days: int, stress: float, health_factor: float) -> float:
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
    
    # Apply stress and health penalties
    stress_penalty = 1.0 - (stress * 0.35)  # Up to 35% reduction
    health_penalty = health_factor  # 0.7-1.0 range
    
    # Daily random variation
    daily_variation = random.uniform(0.92, 1.08)
    
    final_rate = base_rate * stress_penalty * health_penalty * daily_variation
    return max(0.0, min(1.0, final_rate))


def egg_weight_grams(age_days: int) -> float:
    """Calculate average egg weight based on hen age."""
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
    
    # Random variation
    return base_weight * random.uniform(0.96, 1.04)


def egg_grade_a_percent(egg_weight_g: float, stress: float) -> float:
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
    
    # Stress reduces quality
    stress_penalty = stress * 25.0
    
    result = max(55.0, min(95.0, base_grade_a - stress_penalty + random.uniform(-5, 5)))
    return round(result, 1)


def calculate_mortality(age_days: int, birds: int, stress: float, outbreak: bool) -> int:
    """Calculate daily mortality based on age, stress, and health events."""
    if birds <= 0:
        return 0
    
    # Base mortality rate
    if age_days < 14:
        base_rate = MORTALITY_CHICK / 100
    else:
        base_rate = MORTALITY_BASE / 100
    
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


# ================================
# MAIN GENERATOR
# ================================

def generate_synthetic_v3(
    start_date: str = None,
    seed: int = None,
    out: str = "synthetic_v3.csv"
) -> List[Dict[str, Any]]:
    """Generate comprehensive synthetic poultry farm data."""
    
    if seed is not None:
        random.seed(seed)
        np.random.seed(seed)
    
    if start_date:
        start = datetime.date.fromisoformat(start_date)
    else:
        start = datetime.date(2025, 1, 1)
    
    print(f"🐔 Generating synthetic poultry data for {ROOMS} rooms over {WEEKS} weeks...")
    print(f"📅 Start date: {start}")
    print(f"🥚 Birds per room: {BIRDS_PER_ROOM}")
    
    rows: List[Dict[str, Any]] = []
    farm_id = "FARM_001"
    
    # Initialize room-specific parameters
    room_states = {}
    for r in range(1, ROOMS + 1):
        room_id = f"R{r:02d}"
        room_states[room_id] = {
            "birds": BIRDS_PER_ROOM,
            "cumulative_mortality": 0,
            "temp_bias": random.uniform(-1.0, 1.0),
            "humidity_bias": random.uniform(-3.0, 3.0),
            "genetic_factor": random.uniform(0.97, 1.03),
            "laying_start_day": random.randint(LAYING_START_MIN, LAYING_START_MAX),
            "outbreak_cooldown": 0,  # Days since last outbreak
        }
    
    # Generate daily data
    for day in range(DAYS):
        current_date = start + datetime.timedelta(days=day)
        week = (day // 7) + 1
        day_of_week = (day % 7) + 1
        day_of_year = current_date.timetuple().tm_yday
        
        for room_id, state in room_states.items():
            birds_start = state["birds"]
            
            if birds_start <= 0:
                # Room depleted, generate zero record
                row = create_empty_row(farm_id, room_id, current_date, week, day_of_week, day)
                rows.append(row)
                continue
            
            # === BIOLOGICAL PARAMETERS ===
            
            # Weight progression
            base_weight = interpolate_weight(day) * state["genetic_factor"]
            avg_weight_kg = round(base_weight * random.uniform(0.98, 1.02), 3)
            
            # Daily weight gain
            if day == 0:
                daily_gain_kg = 0.0
            else:
                prev_weight = interpolate_weight(day - 1) * state["genetic_factor"]
                daily_gain_kg = round(avg_weight_kg - prev_weight, 4)
            
            # === ENVIRONMENTAL CONDITIONS ===
            
            temp_c = round(seasonal_temperature(day_of_year) + state["temp_bias"], 1)
            humidity_pct = round(seasonal_humidity(day_of_year) + state["humidity_bias"], 1)
            stress_index = round(calculate_stress_index(temp_c, humidity_pct), 3)
            
            # === HEALTH EVENTS ===
            
            # Disease outbreak probability (0.5% per day if cooldown expired)
            state["outbreak_cooldown"] = max(0, state["outbreak_cooldown"] - 1)
            outbreak_today = False
            
            if state["outbreak_cooldown"] == 0 and random.random() < 0.005:
                outbreak_today = True
                state["outbreak_cooldown"] = random.randint(14, 28)  # 2-4 weeks cooldown
            
            health_factor = 0.85 if outbreak_today else random.uniform(0.95, 1.0)
            
            # === MORTALITY ===
            
            mortality_count = calculate_mortality(day, birds_start, stress_index, outbreak_today)
            birds_end = birds_start - mortality_count
            state["cumulative_mortality"] += mortality_count
            
            # === EGG PRODUCTION ===
            
            if day >= state["laying_start_day"]:
                lay_rate = egg_production_rate(day, stress_index, health_factor)
                eggs_produced = int(round(birds_start * lay_rate))
                avg_egg_weight_g = round(egg_weight_grams(day), 1)
                egg_grade_a_pct = egg_grade_a_percent(avg_egg_weight_g, stress_index)
            else:
                eggs_produced = 0
                avg_egg_weight_g = 0.0
                egg_grade_a_pct = 0.0
            
            # === FEED & WATER ===
            
            feed_per_bird_kg = get_feed_intake(day, avg_weight_kg, eggs_produced, birds_start)
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
            
            # Energy costs (varies with season - heating/cooling)
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
        
        final_date_rows = [r for r in rows if r["age_days"] == DAYS - 1]
        
        total_birds_final = sum(r["birds_end"] for r in final_date_rows)
        total_mortality = sum(r["cumulative_mortality"] for r in final_date_rows)
        total_eggs_final_day = sum(r["eggs_produced"] for r in final_date_rows)
        
        total_revenue = sum(r["egg_revenue_usd"] for r in rows)
        total_costs = sum(r["total_costs_usd"] for r in rows)
        total_profit = total_revenue - total_costs
        
        avg_fcr = np.mean([r["fcr"] for r in rows if r["fcr"] > 0])
        
        print(f"\n📊 SUMMARY STATISTICS:")
        print(f"  • Final birds alive: {total_birds_final:,} / {ROOMS * BIRDS_PER_ROOM:,}")
        print(f"  • Total mortality: {total_mortality:,} ({(total_mortality/(ROOMS*BIRDS_PER_ROOM))*100:.1f}%)")
        print(f"  • Final day egg production: {total_eggs_final_day:,} eggs")
        print(f"  • Total revenue (52 weeks): ${total_revenue:,.2f}")
        print(f"  • Total costs (52 weeks): ${total_costs:,.2f}")
        print(f"  • Total profit (52 weeks): ${total_profit:,.2f}")
        print(f"  • Average FCR: {avg_fcr:.2f}")
        print(f"\n🎉 Data generation complete!")
    
    return rows


def create_empty_row(farm_id, room_id, date, week, day_of_week, age_days):
    """Create a zero-filled row for depleted rooms."""
    return {
        "farm_id": farm_id,
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
        description="Generate Version 3 synthetic poultry data for IT Hacks 25",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--start-date",
        type=str,
        default="2025-01-01",
        help="Simulation start date (YYYY-MM-DD)"
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="Random seed for reproducibility"
    )
    parser.add_argument(
        "--out",
        type=str,
        default="synthetic_v3.csv",
        help="Output CSV filename"
    )
    return parser.parse_args()


def main():
    args = parse_args()
    generate_synthetic_v3(
        start_date=args.start_date,
        seed=args.seed,
        out=args.out
    )


if __name__ == "__main__":
    main()
