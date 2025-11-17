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

# Responsive Changes (feature/responsive-mobile-desktop)

Summary:

- Added mobile-first responsive helper classes in frontend/styles/globals.css
- Added responsive grid & card rules in frontend/styles/dashboard.css
- Added chart wrappers and responsive tweaks in frontend/styles/charts.css
- Ensured Tailwind breakpoints exist in frontend/tailwind.config.js
- Wrapped chart components with responsive containers and `maintainAspectRatio: false`

How to revert:

- Checkout previous commit or remove branch feature/responsive-mobile-desktop

Testing checklist:

- npm install
- npm run dev
- Open /analytics, /reports, /how
- Test widths: 360px, 412px, 768px, 1024px, 1366px
- Verify no horizontal scrollbar at 360px & 1366px
- Ensure charts preserve aspect ratio

---

## November 17, 2025 - Major Fixes & Improvements

### 🎯 Issues Fixed

#### 1. Analytics Page Runtime Error ✅

**Problem**: TypeError - Cannot read properties of undefined (reading 'totalBirds')

- **Root Cause**: Backend returned only `{ rooms: [...] }` but frontend expected `productionMetrics`, `environmentMetrics`, etc.
- **Solution**: Merged backend data with sampleData fallback in `frontend/pages/analytics.js`
- **Result**: Page renders correctly with either backend data or fallback sample data

#### 2. How & Reports Pages Empty ✅

**Problem**: Pages showed only layout with no useful content

- **How Page Fix**:
  - Rendered steps list with icons and descriptions
  - Added feature cards showing upload, analytics, and reports workflows
  - Utilized existing GlassCard components for consistent styling
- **Reports Page Fix**:
  - Added file listing from `/upload/files` endpoint
  - Implemented preview functionality calling `/upload/preview/{path}`
  - Created table view showing first N rows of selected CSV
  - Shows file metadata (size, type, columns)

#### 3. CSV Upload/Display Issue ✅

**Problem**: Upload failed, uploaded files not displaying in UI

- **Backend Route Double Prefix Issue**:
  - Routes were `/upload/upload/csv` instead of `/upload/csv`
  - Fixed by removing `prefix="/upload"` from `APIRouter` in `backend/routers/upload.py`
  - Backend already included router with prefix in `main.py`
- **UploadBox Component Refactor**:
  - Changed from self-contained upload logic to callback-based file selector
  - Now properly integrates with parent page state management
  - Added visual feedback showing selected filename
- **Upload Page Enhancements**:
  - Added loading states with disabled buttons during upload
  - Color-coded success/error/warning messages
  - Automatic file list refresh after successful upload
  - Clear button to reset selection
  - Proper error handling with backend error messages
- **File Preview URL Encoding**:
  - Added `encodeURIComponent` for file paths to handle special characters
- **Uploaded Files Visibility**:
  - Modified `/upload/files` endpoint to include `uploads/` directory
  - Uploaded files now tagged as `type: "user-upload"`

#### 4. Dashboard Cards Cramped Layout ✅

**Problem**: Cards too small, text cramped on both mobile and desktop

- **CSS Updates** (`frontend/styles/dashboard.css`):
  - Increased `.card-min-h` from 10rem to 14rem
  - Added 1rem padding to cards
  - Added `.wide-card` utility for full-width spanning
- **Result**: Better spacing, readable text, improved mobile/desktop experience

### 🔧 Technical Changes

**Backend** (`backend/routers/upload.py`):

- Removed duplicate prefix from router definition
- Added uploads directory to file listing
- Endpoints now correctly at `/upload/csv`, `/upload/files`, `/upload/preview/{path}`

**Frontend**:

- `pages/analytics.js`: Data merging strategy for robust rendering
- `pages/how.js`: Content rendering with steps and features
- `pages/reports.js`: File listing and preview implementation
- `pages/upload.js`: Enhanced state management and UX
- `components/ui/UploadBox.js`: Simplified to callback-based selector
- `styles/dashboard.css`: Improved card sizing and spacing

### ✅ Verified Working

**Backend Endpoints**:

- ✅ `POST /upload/csv` - File upload functional
- ✅ `GET /upload/files` - Lists all CSV files (sample + uploads)
- ✅ `GET /upload/preview/{path}?rows=N` - Displays file contents
- ✅ `GET /analysis/rooms` - Returns room data for dashboard

**Frontend Pages**:

- ✅ http://localhost:3000/ - Home page loads
- ✅ http://localhost:3000/dashboard - Shows rooms and metrics
- ✅ http://localhost:3000/analytics - Renders charts with data/fallback
- ✅ http://localhost:3000/how - Shows steps and features
- ✅ http://localhost:3000/reports - Lists files with preview
- ✅ http://localhost:3000/upload - Upload form with feedback

### 📝 Usage Instructions

**To Upload a CSV File**:

1. Visit http://localhost:3000/upload
2. Click "Choose File" and select your CSV
3. Click "📤 Upload File"
4. Success message shows saved filename
5. File list auto-refreshes showing new upload

**To View Uploaded Files**:

1. Visit http://localhost:3000/reports
2. All CSV files listed (sample data + uploads)
3. Click "Preview" button on any file
4. View first 10 rows with column types

**API Usage** (PowerShell):

```powershell
# Upload file
$file = Get-Item "path\to\your\file.csv"
Invoke-RestMethod -Uri "http://localhost:8000/upload/csv" -Method Post -Form @{file=$file}

# List files
curl http://localhost:8000/upload/files

# Preview file (URL encode path if needed)
curl "http://localhost:8000/upload/preview/uploads/yourfile.csv?rows=10"
```

### 🚀 Current Status

All core functionality operational:

- ✅ CSV upload and storage working
- ✅ File listing includes user uploads
- ✅ Preview displays file contents correctly
- ✅ Analytics page renders with fallback data
- ✅ All pages show meaningful content
- ✅ Dashboard cards properly sized and responsive
- ✅ CORS enabled for local development
- ✅ Docker containers running successfully

### 🔍 Testing Completed

- Backend endpoint validation (all passing)
- File upload via Python script (successful)
- Preview with synthetic_v2.csv (2800 rows, 32 columns)
- Frontend accessibility tests (all pages 200 OK)
- Container health checks (backend + frontend running)

**Test file**: `test_upload_complete.py` available for comprehensive validation
