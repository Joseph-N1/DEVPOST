# IT HACKS 25 - Poultry Performance Tracker (Starter Repo)

This repository contains a starter scaffold for a responsive web dashboard (Next.js + Tailwind) and a FastAPI backend.
It includes Dockerfiles and a docker-compose setup for local testing.
The backend includes example CSV analysis logic using pandas and scikit-learn and a synthetic sample CSV to test uploads.

## Quick start (local)

Requirements: Docker & Docker Compose, or Node & Python installed locally.

### Using Docker Compose (recommended)

```bash
# from repository root
docker-compose build
docker-compose up
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

### Running services manually (without Docker)

#### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
# open http://localhost:3000
```

## What’s included

- `frontend/` Next.js + Tailwind starter with basic pages: Dashboard, Upload
- `backend/` FastAPI app with CSV upload endpoint, analytics endpoint, and a simple ML pipeline example
- `sample_data/` example CSV and a small synthetic data generator script
- `docker-compose.yml` to run both services together

## CSV format (sample)

## Day 3 Progress (October 17, 2025)

### Fixed & Improved

- ✅ Fixed Next.js + Tailwind configuration
  - Added proper PostCSS config for Tailwind CSS
  - Configured path aliases (@/) in jsconfig.json
  - Updated imports to use consistent paths
- ✅ Installed and configured required dependencies
  - Added chart.js and react-chartjs-2 for visualizations
  - Added axios for API calls
  - Configured i18next for localization support
- ✅ Improved build process
  - Successfully running `npm run build`
  - Development server working with HMR

### Current Status

- 📊 Dashboard shows basic metrics and chart placeholders
- 🔄 Chart components properly configured for SSR/CSR
- 🌐 i18n infrastructure ready for translations
- 📤 Upload form connected to backend endpoint

### Known Issues

- ⚠️ Sample data is limited/basic
- ⚠️ Charts using mock data instead of real metrics
- ⚠️ Translations incomplete for ha/ig/yo locales

### Next Steps (Priority: Backend Data)

1. Enhance data generation:
   - Expand CSV columns for comprehensive farm metrics
   - Generate realistic synthetic data with proper ranges
   - Add data validation
2. Improve visualization:
   - Connect charts to real data
   - Add more chart types for different metrics
3. Complete localization:
   - Fill missing translations
   - Add language switcher UI

Header expected:

```
farm_id,room_id,date,age_days,temperature_c,humidity_pct,ammonia_ppm,feed_consumed_kg,feed_type,vitamins,disinfectant_used,mortality_count,egg_count,avg_weight_kg,bird_count
```

Please open the repo in VS Code and start the services. Good luck with IT HACKS 25!

## Day 3 Progress (October 17, 2025)

### Fixed & Improved

- ✅ Fixed Next.js + Tailwind configuration
  - Added proper PostCSS config for Tailwind CSS
  - Configured path aliases (@/) in jsconfig.json
  - Updated imports to use consistent paths
- ✅ Installed and configured required dependencies
  - Added chart.js and react-chartjs-2 for visualizations
  - Added axios for API calls
  - Configured i18next for localization support
- ✅ Improved build process
  - Successfully running `npm run build`
  - Development server working with HMR

### Current Status

- 📊 Dashboard shows basic metrics and chart placeholders
- 🔄 Chart components properly configured for SSR/CSR
- 🌐 i18n infrastructure ready for translations
- 📤 Upload form connected to backend endpoint

### Known Issues

- ⚠️ Sample data is limited/basic
- ⚠️ Charts using mock data instead of real metrics
- ⚠️ Translations incomplete for ha/ig/yo locales

### Next Steps (Priority: Backend Data)

1. Enhance data generation:
   - Expand CSV columns for comprehensive farm metrics
   - Generate realistic synthetic data with proper ranges
   - Add data validation
2. Improve visualization:
   - Connect charts to real data
   - Add more chart types for different metrics
3. Complete localization:
   - Fill missing translations
   - Add language switcher UI
