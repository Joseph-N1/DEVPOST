"""
Comprehensive Multi-Farm Data Generation Script
Generates 5 realistic farm datasets with complete schema alignment
for EcoFarm analytics, ML training, and dashboard visualization
"""

import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path

# Configuration
OUTPUT_DIR = Path(__file__).parent / "generated"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# --- Utility Functions --------------------------------------------------------

def generate_time_series(weeks):
    """Generate weekly dates starting from 2023-01-01"""
    start_date = datetime(2023, 1, 1)
    return [start_date + timedelta(weeks=i) for i in range(weeks)]

def seasonal_curve(weeks):
    """Generate seasonal variation (egg production peaks in spring/summer)"""
    x = np.arange(weeks)
    return 0.5 + 0.5 * np.sin(2 * np.pi * x / 52)

def random_noise(size, scale=0.1):
    """Generate random Gaussian noise"""
    return np.random.normal(0, scale, size)

def generate_farm(farm_name, years, large=False):
    """
    Generate complete farm dataset with all required columns.
    
    Args:
        farm_name: Output CSV filename (without .csv)
        years: Number of years of data (1-3)
        large: If True, larger flock sizes
    """
    weeks = years * 52
    dates = generate_time_series(weeks)
    rooms = ["Room 1", "Room 2", "Room 3", "Room 4"]
    
    all_rows = []
    
    for room_idx, room in enumerate(rooms):
        # Initialize flock parameters
        if large:
            flock_size = np.random.randint(2000, 3500)
        else:
            flock_size = np.random.randint(1000, 2200)
        
        # Birds: gradual decline due to mortality
        cumulative_mortality_count = np.cumsum(np.maximum(0, np.random.poisson(1.5, weeks)))
        current_birds = flock_size - cumulative_mortality_count
        current_birds = np.maximum(current_birds, 100)  # Minimum viable population
        
        # Daily mortality
        mortality_daily = np.maximum(0, np.random.poisson(1.5, weeks)).astype(int)
        
        # Cumulative mortality
        cumulative_mortality = np.cumsum(mortality_daily)
        
        # Mortality rate (%)
        mortality_rate = (mortality_daily / np.maximum(current_birds, 1)) * 100
        
        # Weight progression: birds grow over time
        age_weeks = np.arange(weeks)
        base_weight = 0.04 + 0.025 * age_weeks + 0.0002 * (age_weeks ** 2)
        avg_weight_kg = base_weight + random_noise(weeks, 0.08)
        avg_weight_kg = np.maximum(avg_weight_kg, 0.04)
        
        # Daily weight gain
        daily_gain_kg = np.diff(avg_weight_kg, prepend=avg_weight_kg[0])
        daily_gain_kg = np.maximum(daily_gain_kg, 0)
        
        # Feed intake: increases with bird weight and count
        feed_kg_total = (avg_weight_kg * 0.115 * current_birds / 1000) + np.abs(random_noise(weeks, 2))
        feed_kg_per_bird = feed_kg_total / np.maximum(current_birds, 1)
        
        # Water intake: proportional to feed
        water_liters_total = (avg_weight_kg * 0.24 * current_birds / 1000) + np.abs(random_noise(weeks, 1.5))
        
        # Egg production: peaks at weeks 5-30, then declines
        egg_base = np.maximum(0, 40 + 50 * seasonal_curve(weeks) - 2 * (age_weeks - 15) ** 2 / 100)
        egg_base = np.minimum(egg_base, 95)  # Cap at 95%
        egg_base += random_noise(weeks, scale=3)
        eggs_produced = (current_birds * (egg_base / 100)).astype(int)
        eggs_produced = np.maximum(eggs_produced, 0)
        
        # Cumulative eggs
        cumulative_eggs = np.cumsum(eggs_produced)
        
        # Egg metrics
        avg_egg_weight_g = 55 + 5 * seasonal_curve(weeks) + random_noise(weeks, 1)
        avg_egg_weight_g = np.maximum(avg_egg_weight_g, 45)
        
        egg_grade_a_pct = 60 + 20 * seasonal_curve(weeks) + random_noise(weeks, 3)
        egg_grade_a_pct = np.clip(egg_grade_a_pct, 30, 95)
        
        # Temperature: seasonal variation ±6°C from 20°C baseline
        temperature_c = 20 + 6 * seasonal_curve(weeks) + random_noise(weeks, 1)
        
        # Humidity: peaks in summer, dips in winter
        humidity_pct = 55 + 15 * seasonal_curve(weeks) + random_noise(weeks, 2)
        humidity_pct = np.clip(humidity_pct, 30, 85)
        
        # Stress index: inversely related to optimal conditions
        temp_stress = np.abs(temperature_c - 22) / 10
        humidity_stress = np.abs(humidity_pct - 60) / 30
        stress_index = (temp_stress + humidity_stress + mortality_rate / 100) / 3
        stress_index = np.clip(stress_index, 0, 1)
        
        # Health events (random rare events)
        health_events = []
        for _ in range(weeks):
            rand = np.random.random()
            if rand < 0.02:
                health_events.append(np.random.choice(["disease", "respiratory", "infection"]))
            elif rand < 0.05:
                health_events.append("heat_stress")
            elif rand < 0.08:
                health_events.append("feed_quality")
            else:
                health_events.append("normal")
        
        # Feed cost
        feed_price_per_kg_usd = 0.35 + 0.15 * seasonal_curve(weeks) + random_noise(weeks, 0.05)
        feed_cost_usd = feed_kg_total * feed_price_per_kg_usd
        
        # Additional costs
        med_cost_usd = (mortality_rate / 100) * flock_size * 0.02 + random_noise(weeks, 0.5)
        med_cost_usd = np.maximum(med_cost_usd, 0)
        
        energy_cost_usd = (temperature_c < 15).astype(int) * 8 + (temperature_c > 28).astype(int) * 12 + random_noise(weeks, 1)
        
        labor_cost_usd = np.ones(weeks) * 12.5 + random_noise(weeks, 0.5)
        
        other_costs_usd = np.ones(weeks) * 2.5 + random_noise(weeks, 0.5)
        
        total_costs_usd = feed_cost_usd + med_cost_usd + energy_cost_usd + labor_cost_usd + other_costs_usd
        
        # Egg revenue
        egg_price_per_dozen_usd = 2.50 + 0.60 * seasonal_curve(weeks) + random_noise(weeks, 0.15)
        egg_revenue_usd = (eggs_produced / 12) * egg_price_per_dozen_usd
        
        # Profit
        profit_usd = egg_revenue_usd - total_costs_usd
        
        # Feed Conversion Ratio (kg feed per dozen eggs)
        fcr = (feed_kg_total * 12) / np.maximum(eggs_produced, 1)
        fcr = np.maximum(fcr, 0.5)
        fcr = np.minimum(fcr, 10)
        
        # Week number
        week_num = np.arange(1, weeks + 1)
        
        # Day of week (repeating pattern)
        day_of_week = ((week_num - 1) % 7) + 1
        
        # Age in days
        age_days = week_num * 7
        
        # Create DataFrame for this room
        df = pd.DataFrame({
            "date": [d.strftime("%Y-%m-%d") for d in dates],
            "week": week_num,
            "day_of_week": day_of_week,
            "age_days": age_days,
            "room_id": room,
            "birds_start": flock_size,
            "mortality_daily": mortality_daily,
            "birds_end": current_birds.astype(int),
            "cumulative_mortality": cumulative_mortality,
            "mortality_rate": mortality_rate.round(2),
            "avg_weight_kg": avg_weight_kg.round(3),
            "daily_gain_kg": daily_gain_kg.round(3),
            "feed_kg_total": feed_kg_total.round(2),
            "feed_kg_per_bird": feed_kg_per_bird.round(3),
            "water_liters_total": water_liters_total.round(2),
            "eggs_produced": eggs_produced,
            "avg_egg_weight_g": avg_egg_weight_g.round(1),
            "egg_grade_a_pct": egg_grade_a_pct.round(1),
            "temperature_c": temperature_c.round(1),
            "humidity_pct": humidity_pct.round(1),
            "stress_index": stress_index.round(4),
            "health_event": health_events,
            "feed_price_per_kg_usd": feed_price_per_kg_usd.round(3),
            "feed_cost_usd": feed_cost_usd.round(2),
            "med_cost_usd": med_cost_usd.round(2),
            "energy_cost_usd": energy_cost_usd.round(2),
            "labor_cost_usd": labor_cost_usd.round(2),
            "other_costs_usd": other_costs_usd.round(2),
            "total_costs_usd": total_costs_usd.round(2),
            "egg_price_per_dozen_usd": egg_price_per_dozen_usd.round(2),
            "egg_revenue_usd": egg_revenue_usd.round(2),
            "profit_usd": profit_usd.round(2),
            "fcr": fcr.round(3)
        })
        
        all_rows.append(df)
    
    # Combine all rooms
    final_df = pd.concat(all_rows, ignore_index=True)
    final_df = final_df.sort_values(['date', 'room_id']).reset_index(drop=True)
    
    # Output CSV
    output_path = OUTPUT_DIR / f"{farm_name}.csv"
    final_df.to_csv(output_path, index=False)
    
    print(f"✅ Generated {output_path}")
    print(f"   - Rows: {len(final_df)}")
    print(f"   - Weeks: {years * 52}")
    print(f"   - Rooms: 4")
    print(f"   - Date range: {final_df['date'].min()} to {final_df['date'].max()}")
    print()

# --- Generate All Farms ---

if __name__ == "__main__":
    print("=" * 70)
    print("🌾 EcoFarm Multi-Farm Data Generation")
    print("=" * 70)
    print()
    
    generate_farm("farm_A_1yr_weekly", 1, large=False)
    generate_farm("farm_B_1yr_weekly", 1, large=False)
    generate_farm("farm_C_2yr_weekly", 2, large=False)
    generate_farm("farm_D_3yr_weekly", 3, large=False)
    generate_farm("farm_E_2yr_weekly_large", 2, large=True)
    
    print("=" * 70)
    print("✅ All farms generated successfully!")
    print("=" * 70)
