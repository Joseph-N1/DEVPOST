import csv
import random
import datetime
import argparse
from pathlib import Path
from typing import List, Dict, Any, Tuple
import numpy as np
from math import sin, pi

# Enhanced constants for realistic ranges
WEIGHT_CURVES = {
    'layer': {
        0: 0.035,    # Day 0 (chick weight)
        7: 0.150,    # Week 1
        14: 0.380,   # Week 2
        21: 0.680,   # Week 3
        28: 1.100,   # Week 4
        35: 1.500,   # Week 5
        42: 1.900,   # Week 6
        56: 2.200,   # Week 8
        70: 2.500,   # Week 10
        84: 2.800,   # Week 12
        98: 3.000,   # Week 14
        112: 3.200,  # Week 16
        126: 3.400,  # Week 18
        140: 3.600,  # Week 20 (start of lay)
    }
}

FEED_TYPES = {
    (0, 14): 'starter',
    (15, 56): 'grower',
    (57, 112): 'developer',
    (113, 140): 'pre-lay',
    (141, 999): 'layer'
}

# Enhanced light schedule with seasonal adjustments
LIGHT_SCHEDULE = {
    (0, 21): 24,     # 24 hours for first 3 weeks
    (22, 70): 20,    # 20 hours until week 10
    (71, 126): 16,   # 16 hours during development
    (127, 140): 14,  # Reducing light before lay
    (141, 999): 16   # 16 hours during laying period
}

# Enhanced egg production with seasonal effects
EGG_PRODUCTION = {
    # Age in days: (base %, stress impact %)
    140: (5, 2),      # Start of lay
    147: (20, 5),     # Week 21
    154: (45, 8),     # Week 22
    161: (65, 10),    # Week 23
    168: (80, 12),    # Week 24
    175: (92, 15),    # Week 25
    182: (95, 15),    # Week 26+
}

# New seasonal variations
class SeasonalEffects:
    @staticmethod
    def get_season(date: datetime.datetime) -> str:
        """Determine season based on date."""
        month = date.month
        if 3 <= month <= 5:
            return 'spring'
        elif 6 <= month <= 8:
            return 'summer'
        elif 9 <= month <= 11:
            return 'autumn'
        else:
            return 'winter'

    @staticmethod
    def get_temperature_adjustment(date: datetime.datetime) -> float:
        """Calculate seasonal temperature variation using sine wave."""
        day_of_year = date.timetuple().tm_yday
        # Sine wave with 365-day period, amplitude of 5°C
        return 5 * sin(2 * pi * day_of_year / 365)

    @staticmethod
    def get_humidity_adjustment(date: datetime.datetime) -> float:
        """Calculate seasonal humidity variation."""
        season = SeasonalEffects.get_season(date)
        base_adjustments = {
            'spring': 5,
            'summer': 10,
            'autumn': 5,
            'winter': -5
        }
        return base_adjustments[season]

    @staticmethod
    def get_stress_factor(temperature: float, humidity: float) -> float:
        """Calculate stress factor based on temperature and humidity."""
        # Temperature Humidity Index (THI)
        thi = (1.8 * temperature + 32) - ((0.55 - 0.0055 * humidity) * (1.8 * temperature - 26))
        if thi < 70:
            return 0.0  # No stress
        elif thi < 75:
            return 0.2  # Mild stress
        elif thi < 80:
            return 0.4  # Moderate stress
        elif thi < 85:
            return 0.6  # Severe stress
        else:
            return 0.8  # Extreme stress

class EnhancedDataValidator:
    @staticmethod
    def validate_row(row: Dict[str, Any]) -> List[str]:
        errors = []
        
        # Required fields
        required_fields = ['farm_id', 'room_id', 'date']  # age_days can be 0
        for field in required_fields:
            if not row.get(field):
                errors.append(f"Missing required field: {field}")
        
        # Numeric ranges
        validations = {
            'age_days': (0, 1000),
            'temperature_c': (15, 35),
            'humidity_pct': (40, 80),
            'mortality_rate': (0, 100),
            'feed_conversion_ratio': (0, 10),
            'water_consumed_liters': (0, 1000),
            'light_hours': (0, 24),
            'egg_weight_g': (0, 100),
        }
        
        for field, (min_val, max_val) in validations.items():
            if field in row and row[field] is not None:
                try:
                    value = float(row[field])
                    if not (min_val <= value <= max_val):
                        errors.append(f"Invalid {field}: {row[field]}")
                except (ValueError, TypeError):
                    errors.append(f"Invalid numeric value for {field}: {row[field]}")
        
        return errors

def get_feed_type(age_days: int) -> str:
    """Get appropriate feed type based on bird age."""
    for (start, end), feed_type in FEED_TYPES.items():
        if start <= age_days <= end:
            return feed_type
    return 'layer'

def interpolate_weight(age_days: int) -> float:
    """Interpolate weight based on known age points with improved accuracy."""
    curve = WEIGHT_CURVES['layer']
    known_ages = sorted(curve.keys())
    
    if age_days in curve:
        return curve[age_days]
    
    if age_days < known_ages[0]:
        return curve[known_ages[0]]
    if age_days > known_ages[-1]:
        return curve[known_ages[-1]]
    
    # Find surrounding known ages
    lower_age = max(age for age in known_ages if age <= age_days)
    upper_age = min(age for age in known_ages if age >= age_days)
    
    # Enhanced interpolation with smoothing
    weight_range = curve[upper_age] - curve[lower_age]
    days_range = upper_age - lower_age
    progress = (age_days - lower_age) / days_range
    
    # Apply cubic smoothing for more natural growth curve
    smooth_progress = progress * progress * (3 - 2 * progress)
    base_weight = curve[lower_age] + (weight_range * smooth_progress)
    
    return base_weight

def generate_weight(age_days: int, bird_type: str) -> float:
    """Generate weight with realistic variation and genetic factors."""
    base_weight = interpolate_weight(age_days)
    
    # Genetic variation (consistent per batch)
    genetic_factor = 1.0 + random.gauss(0, 0.02)  # ±2% genetic variation
    
    # Daily variation
    daily_variation = random.uniform(-0.02, 0.02)  # ±2% daily variation
    
    return round(base_weight * genetic_factor * (1 + daily_variation), 3)

def get_light_hours(age_days: int) -> int:
    """Get appropriate light hours based on bird age and development stage."""
    for (start, end), hours in LIGHT_SCHEDULE.items():
        if start <= age_days <= end:
            return hours
    return 16  # Default for mature birds

def calculate_egg_production(
    age_days: int,
    flock_size: int,
    stress_factor: float,
    current_date: datetime.datetime
) -> Tuple[int, float]:
    """
    Calculate egg production with environmental and seasonal effects.
    Returns (eggs_produced, average_egg_weight).
    """
    if age_days < 140:  # Before laying age
        return 0, 0.0
    
    # Get base production rate
    production_ages = sorted(EGG_PRODUCTION.keys())
    target_age = max([age for age in production_ages if age <= age_days], default=140)
    base_rate, stress_impact = EGG_PRODUCTION[target_age]
    
    # Apply stress and seasonal effects
    season = SeasonalEffects.get_season(current_date)
    seasonal_factor = {
        'spring': 1.05,  # Best production
        'summer': 0.95,  # Heat stress
        'autumn': 1.00,  # Normal
        'winter': 0.98   # Slightly reduced
    }[season]
    
    # Calculate actual production rate
    actual_rate = (base_rate / 100) * seasonal_factor * (1 - (stress_factor * stress_impact / 100))
    eggs_produced = int(flock_size * actual_rate)
    
    # Calculate egg weight with seasonal variations
    base_weight = 45.0
    age_factor = min((age_days - 140) / 100, 1.0)
    weight_increase = 15.0 * age_factor
    seasonal_weight_adj = {
        'spring': 1.02,
        'summer': 0.98,
        'autumn': 1.00,
        'winter': 1.01
    }[season]
    
    egg_weight = (base_weight + weight_increase) * seasonal_weight_adj
    egg_weight += random.gauss(0, 1)  # Normal distribution variation
    
    return eggs_produced, round(max(30, min(100, egg_weight)), 1)  # Constrain weight to realistic range

def generate_synthetic_data(
    num_rooms: int = 4,
    days: int = 140,
    start_date: str = None,
    seed: int = None,
    include_seasonal: bool = True
) -> List[Dict[str, Any]]:
    if seed is not None:
        random.seed(seed)
        np.random.seed(seed)
    
    if start_date is None:
        start_date = datetime.date.today().isoformat()
    
    start = datetime.datetime.fromisoformat(start_date)
    rows = []
    
    for room_id in range(1, num_rooms + 1):
        initial_birds = random.randint(2000, 3000)  # Typical commercial layer house size
        current_birds = initial_birds
        prev_weight = WEIGHT_CURVES['layer'][0]  # Starting weight
        
        # Each room gets slightly different environmental conditions
        base_temp = 32 - (room_id * 0.5)  # Slight temperature variation between rooms
        base_humidity = 60 + (room_id * 2)  # Slight humidity variation
        
        for age_days in range(days):
            date = (start + datetime.timedelta(days=age_days)).isoformat()
            
            # Calculate current weight and gain
            if age_days == 0:
                current_weight = WEIGHT_CURVES['layer'][0]  # Start with exact day 0 weight
                daily_gain = 0  # No gain on first day
            else:
                current_weight = generate_weight(age_days, 'layer')
                daily_gain = max(0, round(current_weight - prev_weight, 3))
            prev_weight = current_weight
            
            # Feed and water calculations
            base_feed_pct = 0.08  # Base feed intake as percentage of body weight
            if age_days < 7:
                base_feed_pct = 0.12  # Higher feed intake for chicks
            elif age_days < 28:
                base_feed_pct = 0.10  # Gradually reducing feed intake
                
            feed_intake = round(current_weight * base_feed_pct * (1 + random.uniform(-0.1, 0.1)), 3)
            water_intake = round(feed_intake * 2 * (1 + random.uniform(-0.1, 0.1)), 3)  # ~2x feed intake
            
            # Mortality calculations (higher risk in first week and during stress periods)
            mortality_risk = 0.001  # Base risk
            if age_days < 7:
                mortality_risk *= 2  # Higher risk in first week
            if 140 <= age_days <= 147:  # Higher risk during start of lay
                mortality_risk *= 1.5
            
            mortality = round(random.uniform(0, mortality_risk) * current_birds)
            current_birds -= mortality
            
            # Calculate current date and environmental conditions
            current_date = start + datetime.timedelta(days=age_days)
            
            # Apply seasonal effects
            if include_seasonal:
                temp_adjustment = SeasonalEffects.get_temperature_adjustment(current_date)
                humidity_adjustment = SeasonalEffects.get_humidity_adjustment(current_date)
            else:
                temp_adjustment = 0
                humidity_adjustment = 0
            
            # Calculate actual environmental conditions
            if age_days < 21:
                target_temp = base_temp - (age_days * 0.3)
            else:
                target_temp = 24
            
            actual_temp = round(target_temp + temp_adjustment + random.uniform(-1, 1), 1)
            actual_humidity = round(base_humidity + humidity_adjustment + random.uniform(-5, 5), 1)
            
            # Calculate stress factor
            stress_factor = SeasonalEffects.get_stress_factor(actual_temp, actual_humidity)
            
            # Calculate egg production and weights
            eggs_produced, egg_weight = calculate_egg_production(
                age_days,
                current_birds,
                stress_factor,
                current_date
            )
            
            # Environmental conditions (temperature decreases with age, more stable after week 3)
            if age_days < 21:
                target_temp = base_temp - (age_days * 0.3)  # Gradual temperature reduction
            else:
                target_temp = 24  # Stable temperature for adult birds
            
            actual_temp = round(target_temp + random.uniform(-1, 1), 1)
            actual_humidity = round(base_humidity + random.uniform(-5, 5), 1)
            
            # Economic calculations
            feed_cost = round(feed_intake * 0.5, 2)  # $0.50 per kg feed
            egg_revenue = round(eggs_produced * (egg_weight / 1000) * 2.5, 2)  # $2.50 per kg eggs
            profit = round(egg_revenue - feed_cost, 2)
            
            row = {
                'farm_id': 'F001',
                'room_id': f'R{room_id:03d}',
                'date': date,
                'age_days': age_days,
                'current_birds': current_birds,
                'mortality_count': mortality,
                'mortality_rate': round((mortality / current_birds * 100) if current_birds > 0 else 0, 3),
                'avg_weight_kg': current_weight,
                'daily_gain_kg': daily_gain,
                'feed_intake_kg': feed_intake,
                'water_consumed_liters': water_intake,
                'feed_conversion_ratio': min(10, round(feed_intake / daily_gain if daily_gain > 0 else 0, 2)),
                'temperature_c': actual_temp,
                'humidity_pct': actual_humidity,
                'light_hours': get_light_hours(age_days),
                'feed_type': get_feed_type(age_days),
                'eggs_produced': eggs_produced,
                'egg_weight_g': egg_weight if eggs_produced > 0 else 0,
                'feed_cost_usd': feed_cost,
                'egg_revenue_usd': egg_revenue,
                'profit_usd': profit
            }
            
            # Validate before adding
            errors = EnhancedDataValidator.validate_row(row)
            if not errors:
                rows.append(row)
            else:
                print(f"Warning: Skipping invalid row: {errors}")
    
    return rows

def save_csv(rows: List[Dict[str, Any]], filename: str):
    """Save data to CSV with enhanced validation and reporting."""
    Path(filename).parent.mkdir(parents=True, exist_ok=True)
    
    with open(filename, 'w', newline='') as f:
        if not rows:
            return
        
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
        
        # Comprehensive report generation
        print(f"\n✅ Generated {len(rows)} rows of synthetic poultry data")
        print(f"\n📊 Configuration:")
        print(f"   - Rooms: {len(set(row['room_id'] for row in rows))}")
        print(f"   - Days: {max(row['age_days'] for row in rows) + 1}")
        print(f"   - Date Range: {min(row['date'] for row in rows)} to {max(row['date'] for row in rows)}")
        
        # Calculate and display summary statistics
        print("\n📈 Summary Statistics:")
        final_day = max(row['date'] for row in rows)
        final_rows = [row for row in rows if row['date'] == final_day]
        
        total_birds = sum(row['current_birds'] for row in final_rows)
        avg_weight = sum(row['avg_weight_kg'] for row in final_rows) / len(final_rows)
        total_eggs = sum(row['eggs_produced'] for row in final_rows)
        avg_fcr = sum(row['feed_conversion_ratio'] for row in final_rows) / len(final_rows)
        total_profit = sum(row['profit_usd'] for row in final_rows)
        
        print(f"Total Birds: {total_birds}")
        print(f"Average Weight: {avg_weight:.2f} kg")
        print(f"Daily Egg Production: {total_eggs}")
        print(f"Average FCR: {avg_fcr:.2f}")
        print(f"Daily Profit: ${total_profit:.2f}")
        
        # Display sample data validation
        print("\n🔍 Data Validation (First 10 Rows):")
        for i, row in enumerate(rows[:10]):
            errors = EnhancedDataValidator.validate_row(row)
            if errors:
                print(f"  Row {i+1}: {', '.join(errors)}")
            else:
                print(f"  Row {i+1}: ✓ Valid")
        
        # Final confirmation
        print(f"\n💾 Data saved to: {filename}")

def main():
    parser = argparse.ArgumentParser(description='Generate synthetic layer farm data')
    parser.add_argument('--rooms', type=int, default=4, help='Number of rooms')
    parser.add_argument('--days', type=int, default=140, help='Days to simulate')
    parser.add_argument('--seed', type=int, help='Random seed for reproducibility')
    parser.add_argument('--start-date', type=str, help='Start date (YYYY-MM-DD)')
    parser.add_argument('--out', type=str, default='sample_upload_expanded.csv', 
                       help='Output file path')
    parser.add_argument('--no-seasonal', action='store_true',
                       help='Disable seasonal variations')
    
    args = parser.parse_args()
    
    data = generate_synthetic_data(
        num_rooms=args.rooms,
        days=args.days,
        start_date=args.start_date,
        seed=args.seed,
        include_seasonal=not args.no_seasonal
    )
    
    save_csv(data, args.out)

if __name__ == '__main__':
    main()
