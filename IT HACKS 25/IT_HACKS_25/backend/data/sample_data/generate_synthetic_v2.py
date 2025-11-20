# generate_synthetic_v2.py
"""
Version 2 synthetic poultry data generator
- Simulates N rooms, M birds per room
- Simulates for W weeks (7*W days)
- Adds seasonal cost/production fluctuations, outbreaks, energy & labor costs
- Outputs one CSV with daily aggregated rows per room

Usage:
    python generate_synthetic_v2.py --rooms 4 --birds 1000 --weeks 100 --start-date 2025-01-01 --out synthetic_v2.csv --seed 42
"""

import csv
import random
import argparse
import datetime
from pathlib import Path
from typing import List, Dict, Any, Tuple
import math
import numpy as np

# ---------------------------
# Helper / Config Constants
# ---------------------------
LAYING_START_DAY = 140  # day when laying normally starts (≈20 weeks)
DAYS_PER_WEEK = 7

# baseline weight curve (kg) for interpolation (sparse keypoints)
WEIGHT_POINTS = {
    0: 0.035,
    7: 0.15,
    28: 1.10,
    56: 2.20,
    112: 3.20,
    140: 3.60,
    200: 3.75,
    365: 3.9
}

# feed type by age ranges (days)
FEED_STAGES = [
    (0, 14, "starter"),
    (15, 56, "grower"),
    (57, 112, "developer"),
    (113, 140, "pre-lay"),
    (141, 9999, "layer")
]

# base feed intake kg per bird per day (as fraction of weight or absolute for chicks)
def base_feed_intake_kg(age_days: int, avg_weight_kg: float) -> float:
    # chicks eat proportionally more
    if age_days < 7:
        return max(0.01, avg_weight_kg * 0.12)  # 12% bw
    if age_days < 28:
        return max(0.02, avg_weight_kg * 0.10)
    if age_days < 112:
        return max(0.03, avg_weight_kg * 0.08)
    # layers feed ~0.1 - 0.14 kg/day depending on weight and production
    return max(0.04, avg_weight_kg * 0.05 + 0.08)

# seasonal sine-based factor (0.85 - 1.15)
def seasonal_factor_for_date(date: datetime.date, amplitude=0.12, phase_shift=0.0):
    day_of_year = date.timetuple().tm_yday
    # Use 365-day sine wave; shift can move peak to desired month
    return 1.0 + amplitude * math.sin(2 * math.pi * (day_of_year / 365.0) + phase_shift)

# interpolate weight from WEIGHT_POINTS using smoothstep
def interp_weight(age_days: int):
    keys = sorted(WEIGHT_POINTS.keys())
    if age_days <= keys[0]:
        return WEIGHT_POINTS[keys[0]]
    if age_days >= keys[-1]:
        return WEIGHT_POINTS[keys[-1]]
    lower = max(k for k in keys if k <= age_days)
    upper = min(k for k in keys if k >= age_days)
    if lower == upper:
        return WEIGHT_POINTS[lower]
    prog = (age_days - lower) / (upper - lower)
    # smooth cubic
    s = prog * prog * (3 - 2 * prog)
    return WEIGHT_POINTS[lower] + s * (WEIGHT_POINTS[upper] - WEIGHT_POINTS[lower])

# THI-like stress (temp in C, humidity %)
def stress_from_temp_hum(temp_c: float, hum: float) -> float:
    # simplified stress index: normalized 0..1
    # comfortable range 18..26 C, 40..70% hum
    temp_pen = max(0.0, (abs(temp_c - 22.0) - 2.0) / 15.0)  # scaled
    hum_pen = max(0.0, (abs(hum - 60.0) - 10.0) / 40.0)
    return min(1.0, (temp_pen * 0.7 + hum_pen * 0.3))

# small utility to format cents to dollars
def cents(x):
    return round(x, 2)

# --------------------------
# Main generator
# --------------------------
def generate_synthetic_v2(
    rooms: int = 4,
    birds_per_room: int = 1000,
    weeks: int = 100,
    start_date: str = None,
    seed: int = None,
    out: str = "synthetic_v2.csv",
) -> List[Dict[str, Any]]:
    if seed is not None:
        random.seed(seed)
        np.random.seed(seed)

    days = weeks * DAYS_PER_WEEK
    if start_date:
        start = datetime.date.fromisoformat(start_date)
    else:
        start = datetime.date.today()

    rows: List[Dict[str, Any]] = []
    farm_id = "FARM_V2"

    # model base prices (these will vary seasonally/randomly)
    base_feed_price_per_kg = 0.45  # USD per kg
    base_energy_cost_per_day = 4.0  # per room
    base_labor_per_room_per_day = 8.0  # support staff allocation
    base_med_per_bird = 0.002  # emergency meds amortized per bird per day

    # monthly market price pattern for eggs (USD per dozen)
    egg_price_base = 2.8  # base price per dozen
    egg_price_amp = 0.5

    for r in range(1, rooms + 1):
        room_id = f"R{r:02d}"
        # initialize room-level variations
        birds = birds_per_room
        cum_mortality = 0
        # slight differences by room
        room_temp_bias = random.uniform(-1.5, 1.5)
        room_hum_bias = random.uniform(-4, 4)
        # genetic flocks variation (±3%)
        genetic_multiplier = 1.0 + random.gauss(0, 0.03)

        for day in range(days):
            age_days = day
            current_date = start + datetime.timedelta(days=day)
            week = day // 7 + 1
            day_of_week = (day % 7) + 1

            # average bird weight
            base_weight = interp_weight(age_days) * genetic_multiplier
            # small daily noise
            avg_weight = round(base_weight * (1 + random.uniform(-0.01, 0.01)), 3)
            # daily gain
            if day == 0:
                daily_gain = 0.0
            else:
                prev_weight = interp_weight(age_days - 1) * genetic_multiplier
                daily_gain = round(avg_weight - prev_weight, 3)

            # environmental: temp & humidity with seasonality and occasional spike
            # seasonality: peak temperature mid-year
            temp_season_mul = seasonal_factor_for_date(current_date, amplitude=0.08, phase_shift=0.0)
            avg_temp = 22.0 * temp_season_mul + room_temp_bias + random.uniform(-1.5, 1.5)
            humidity = 60.0 * (1.0 + (seasonal_factor_for_date(current_date, amplitude=0.06, phase_shift=1.0) - 1.0)) + room_hum_bias + random.uniform(-6, 6)
            avg_temp = round(avg_temp, 1)
            humidity = round(max(20.0, min(95.0, humidity)), 1)

            # stress factor 0..1
            stress = stress_from_temp_hum(avg_temp, humidity)

            # outbreak chance: small monthly chance; if outbreak occurs cause multi-day penalty
            # We'll simulate outbreak as room-specific event stored in a small dict across days
            # For simplicity we compute a dynamic outbreak multiplier probability
            outbreak_prob_daily = 0.0008 + 0.0002 * (1 if week % 13 == 0 else 0)  # slightly higher on every 13th week (stress)
            outbreak_event = random.random() < outbreak_prob_daily
            # If outbreak occurs, increase mortality and reduce egg production for next 7-14 days
            if outbreak_event:
                outbreak_days = random.randint(7, 14)
                # mark outbreak intensity
                outbreak_intensity = random.uniform(0.15, 0.45)  # production loss fraction & mortality multiplier
            else:
                outbreak_days = 0
                outbreak_intensity = 0.0

            # Keep simple outbreak state per day using random local variable: to simulate persistence we'll
            # apply outbreak effect with a small probability when event true (stateless but produces occasional clusters)
            # (This is enough for synthetic realism without storing a persistent dict.)

            # egg production (starts after LAYING_START_DAY)
            eggs = 0
            avg_egg_weight = 0.0
            egg_grade_A_pct = 0.0
            if age_days >= LAYING_START_DAY:
                # base laying percentage increases with age then stabilizes
                # use logistic-like ramp
                days_since_lay = age_days - LAYING_START_DAY
                lay_rate_base = 0.60 + 0.35 * (1 - math.exp(-days_since_lay / 60.0))  # 0.60 -> ~0.95 over time
                # seasonal effect (mild)
                season_prod = seasonal_factor_for_date(current_date, amplitude=0.06, phase_shift=0.5)
                # apply stress & outbreak penalties
                outbreak_penalty = (1.0 - outbreak_intensity) if outbreak_event else 1.0
                # daily variability
                daily_variation = random.uniform(-0.06, 0.06)
                actual_lay_rate = max(0.05, lay_rate_base * season_prod * (1 - stress * 0.9) * outbreak_penalty * (1 + daily_variation))
                eggs = int(round(birds * actual_lay_rate))
                # egg weight grows slightly with age and season
                avg_egg_weight = round(45 + min(10, days_since_lay / 20.0) + random.gauss(0, 2.0), 1)
                egg_grade_A_pct = round(max(50.0, 90.0 - stress * 50 + random.uniform(-5, 5)), 1)
            else:
                eggs = 0
                avg_egg_weight = 0.0
                egg_grade_A_pct = 0.0

            # feed & water
            feed_per_bird = base_feed_intake_kg(age_days, avg_weight) * (1 + random.uniform(-0.06, 0.06))
            feed_total = round(feed_per_bird * birds, 3)
            water_per_bird = round(feed_per_bird * random.uniform(1.8, 2.5), 3)
            water_total = round(water_per_bird * birds, 3)

            # mortality: base higher in first week; increases with stress and outbreak
            base_daily_mortality_rate = 0.0008
            if age_days < 7:
                base_daily_mortality_rate *= 2.5
            # add stress & outbreak factors
            daily_mortality_expected = base_daily_mortality_rate * (1 + stress * 3.0 + (outbreak_intensity * 8.0 if outbreak_event else 0.0))
            # sample actual mortality (Poisson-like)
            mortality = np.random.poisson(daily_mortality_expected * birds)
            mortality = int(min(birds, mortality))
            birds_end = birds - mortality
            cum_mortality += mortality

            # costs (seasonal feed price & market egg price)
            feed_price = base_feed_price_per_kg * seasonal_factor_for_date(current_date, amplitude=0.08, phase_shift=0.1) * (1 + random.uniform(-0.03, 0.03))
            feed_cost = round(feed_total * feed_price, 2)

            # medicine costs: depend on mortality & outbreak
            med_cost = round((mortality * 0.4 + birds * base_med_per_bird) * (1 + outbreak_intensity * 5.0), 2)

            # energy cost: fluctuates monthly / seasonal weather
            energy_cost = round(base_energy_cost_per_day * seasonal_factor_for_date(current_date, amplitude=0.25, phase_shift=1.0) * (1 + random.uniform(-0.1, 0.1)), 2)

            # labor cost
            labor_cost = round(base_labor_per_room_per_day * (1 + random.uniform(-0.05, 0.05)), 2)

            # other costs (packaging, maintenance)
            other_costs = round((feed_cost + med_cost) * 0.02 + random.uniform(0.5, 2.0), 2)

            total_costs = round(feed_cost + med_cost + energy_cost + labor_cost + other_costs, 2)

            # egg market price per dozen varies seasonally and randomly
            egg_price = round((egg_price_base + egg_price_amp * math.sin(2 * math.pi * current_date.timetuple().tm_yday / 365.0 + r)) * (1 + random.uniform(-0.08, 0.08)), 2)
            egg_revenue = round((eggs * (avg_egg_weight / 1000.0)) * (egg_price / 12.0) * 1000, 2) if eggs > 0 else 0.0
            # explanation: eggs * kg-per-egg * (price per dozen / 12) gives USD per egg; times 1000? hold on — we must be careful
            # compute properly: eggs * (egg_weight_g / 1000) gives kg of eggs -> revenue = kg * price_per_kg
            # price per dozen / 12 => price per egg (USD). So:
            # egg_revenue = eggs * (price_per_dozen / 12)
            egg_revenue = round(eggs * (egg_price / 12.0), 2)

            profit = round(egg_revenue - total_costs, 2)

            # feed conversion ratio (FCR): kg feed per kg weight gain (aggregate). Avoid division by zero.
            total_weight_gain = round(daily_gain * birds if daily_gain > 0 else 0.0, 3)
            fcr = round((feed_total / total_weight_gain) if total_weight_gain > 0 else 0.0, 3)

            row = {
                "farm_id": farm_id,
                "room_id": room_id,
                "date": current_date.isoformat(),
                "week": week,
                "day_of_week": day_of_week,
                "age_days": age_days,
                "birds_start": birds,
                "mortality_daily": mortality,
                "birds_end": birds_end,
                "cumulative_mortality": cum_mortality,
                "avg_weight_kg": round(avg_weight, 3),
                "daily_gain_kg": round(daily_gain, 4),
                "feed_kg_total": feed_total,
                "feed_kg_per_bird": round(feed_per_bird, 4),
                "water_liters_total": water_total,
                "eggs_produced": eggs,
                "avg_egg_weight_g": avg_egg_weight,
                "egg_grade_A_pct": egg_grade_A_pct,
                "temperature_c": avg_temp,
                "humidity_pct": humidity,
                "stress_index": round(stress, 3),
                "feed_price_per_kg_usd": round(feed_price, 3),
                "feed_cost_usd": feed_cost,
                "med_cost_usd": med_cost,
                "energy_cost_usd": energy_cost,
                "labor_cost_usd": labor_cost,
                "other_costs_usd": other_costs,
                "total_costs_usd": total_costs,
                "egg_price_per_dozen_usd": egg_price,
                "egg_revenue_usd": egg_revenue,
                "profit_usd": profit,
                "fcr": fcr,
            }

            rows.append(row)

            # update birds for next day
            birds = birds_end
            # if flock extinct, keep zero birds (but continue producing zero rows)
            if birds <= 0:
                birds = 0

    # Save CSV
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    if rows:
        fieldnames = list(rows[0].keys())
        with open(out, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)

    # Print summary
    if rows:
        dates = [r["date"] for r in rows]
        print(f"Generated {len(rows)} rows for {rooms} rooms over {weeks} weeks")
        print(f"Date range: {min(dates)} to {max(dates)}")
        # summary final day aggregated across rooms
        final_date = max(dates)
        final_rows = [r for r in rows if r["date"] == final_date]
        total_birds = sum(r["birds_end"] for r in final_rows)
        total_eggs = sum(r["eggs_produced"] for r in final_rows)
        total_profit = sum(r["profit_usd"] for r in final_rows)
        avg_fcr = round(np.mean([r["fcr"] for r in final_rows]) if final_rows else 0, 3)
        print(f"Final total birds: {total_birds}")
        print(f"Final daily eggs: {total_eggs}")
        print(f"Final daily profit (sum of rooms): USD {round(total_profit,2)}")
        print(f"Final avg FCR (rooms): {avg_fcr}")

    return rows

# --------------------------
# CLI
# --------------------------
def parse_args():
    p = argparse.ArgumentParser(description="Generate richer synthetic poultry CSV (version 2)")
    p.add_argument("--rooms", type=int, default=4, help="Number of rooms")
    p.add_argument("--birds", type=int, default=1000, help="Starting birds per room")
    p.add_argument("--weeks", type=int, default=100, help="Number of weeks to simulate")
    p.add_argument("--start-date", type=str, help="Simulation start date YYYY-MM-DD")
    p.add_argument("--seed", type=int, help="Random seed")
    p.add_argument("--out", type=str, default="synthetic_v2.csv", help="Output CSV file")
    return p.parse_args()

def main():
    args = parse_args()
    generate_synthetic_v2(
        rooms=args.rooms,
        birds_per_room=args.birds,
        weeks=args.weeks,
        start_date=args.start_date,
        seed=args.seed,
        out=args.out,
    )

if __name__ == "__main__":
    main()
