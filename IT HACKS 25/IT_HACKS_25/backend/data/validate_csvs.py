"""
CSV Validation Script
Validates all generated CSVs against the EcoFarm schema
"""

import os
import json
import pandas as pd
from pathlib import Path

DATA_DIR = Path(__file__).parent / "generated"

REQUIRED_COLUMNS = [
    "date", "week", "day_of_week", "age_days", "room_id", "birds_start",
    "mortality_daily", "birds_end", "cumulative_mortality", "mortality_rate",
    "avg_weight_kg", "daily_gain_kg", "feed_kg_total", "feed_kg_per_bird",
    "water_liters_total", "eggs_produced", "avg_egg_weight_g", "egg_grade_a_pct",
    "temperature_c", "humidity_pct", "stress_index", "health_event",
    "feed_price_per_kg_usd", "feed_cost_usd", "med_cost_usd", "energy_cost_usd",
    "labor_cost_usd", "other_costs_usd", "total_costs_usd", "egg_price_per_dozen_usd",
    "egg_revenue_usd", "profit_usd", "fcr"
]

def validate_csv(file_path):
    """
    Validate a single CSV file.
    Returns a dictionary with validation results.
    """
    try:
        df = pd.read_csv(file_path)
        issues = []
        
        # Check columns
        missing_cols = [col for col in REQUIRED_COLUMNS if col not in df.columns]
        if missing_cols:
            issues.append(f"Missing columns: {', '.join(missing_cols)}")
        
        # Check date format
        try:
            pd.to_datetime(df["date"])
            dates_valid = True
        except:
            issues.append("Invalid date format")
            dates_valid = False
        
        # Check rooms
        if "room_id" in df.columns:
            rooms = df["room_id"].nunique()
            if rooms < 4:
                issues.append(f"Expected 4 rooms, found {rooms}")
        
        # Check no NaN in critical columns
        critical_cols = ["date", "room_id", "avg_weight_kg", "eggs_produced", "fcr"]
        nan_cols = [col for col in critical_cols if col in df.columns and df[col].isna().any()]
        if nan_cols:
            issues.append(f"NaN values in critical columns: {', '.join(nan_cols)}")
        
        # Check numeric ranges
        if "mortality_rate" in df.columns:
            if (df["mortality_rate"] < 0).any() or (df["mortality_rate"] > 100).any():
                issues.append("Mortality rate outside 0-100 range")
        
        if "humidity_pct" in df.columns:
            if (df["humidity_pct"] < 0).any() or (df["humidity_pct"] > 100).any():
                issues.append("Humidity % outside 0-100 range")
        
        if "egg_grade_a_pct" in df.columns:
            if (df["egg_grade_a_pct"] < 0).any() or (df["egg_grade_a_pct"] > 100).any():
                issues.append("Egg grade A % outside 0-100 range")
        
        # Validate dates are sorted
        if dates_valid and "date" in df.columns:
            dates = pd.to_datetime(df["date"])
            if not dates.is_monotonic_increasing:
                issues.append("Dates are not in chronological order")
        
        return {
            "file": file_path.name,
            "rows": len(df),
            "columns": len(df.columns),
            "rooms": df["room_id"].nunique() if "room_id" in df.columns else 0,
            "date_min": df["date"].min() if "date" in df.columns else None,
            "date_max": df["date"].max() if "date" in df.columns else None,
            "valid": len(issues) == 0,
            "issues": issues
        }
    except Exception as e:
        return {
            "file": file_path.name,
            "valid": False,
            "issues": [f"Failed to read file: {str(e)}"]
        }

# --- Main Validation ---

if __name__ == "__main__":
    print("=" * 70)
    print("🔍 EcoFarm CSV Validation Report")
    print("=" * 70)
    print()
    
    if not DATA_DIR.exists():
        print(f"❌ Generated data directory not found: {DATA_DIR}")
        exit(1)
    
    # Find all CSVs
    csv_files = sorted(DATA_DIR.glob("*.csv"))
    
    if not csv_files:
        print(f"❌ No CSV files found in {DATA_DIR}")
        exit(1)
    
    # Validate each CSV
    report = {}
    all_valid = True
    
    for csv_file in csv_files:
        result = validate_csv(csv_file)
        report[csv_file.name] = result
        
        status = "✅" if result["valid"] else "❌"
        print(f"{status} {result['file']}")
        print(f"   Rows: {result.get('rows', 'N/A')} | Rooms: {result.get('rooms', 'N/A')} | Columns: {result.get('columns', 'N/A')}")
        
        if result.get('date_min'):
            print(f"   Date Range: {result['date_min']} to {result['date_max']}")
        
        if result["issues"]:
            for issue in result["issues"]:
                print(f"   ⚠️  {issue}")
            all_valid = False
        else:
            print(f"   ✅ All validations passed")
        
        print()
    
    # Write validation report
    report_path = Path(__file__).parent / "validate_report.json"
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)
    
    print("=" * 70)
    print(f"📊 Validation report saved to: {report_path}")
    print("=" * 70)
    
    if all_valid:
        print("✅ All CSV files passed validation!")
        exit(0)
    else:
        print("❌ Some CSV files failed validation. See details above.")
        exit(1)
