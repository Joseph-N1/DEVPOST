# Docker Restart & Testing Guide

## ✅ Fixes Applied

The following issues have been resolved:

1. **Duplicate variable declaration** in `reports.js` - removed duplicate `currentRanking` variable
2. **Navigation bar i18n key** - changed from `t("analytics")` to `t("analytics_page")` to match translation files
3. **How.js layout issues** - completely restructured with proper responsive grid and spacing
4. **Component imports** - verified all new components (ChartWrapper, MultiChartGrid, ComparisonSelector) are properly imported
5. **Loading component export** - added default export to fix "Element type is invalid" error in analytics, dashboard, and reports pages
6. **CSV file detection** - fixed dashboard and reports to correctly parse backend response (was looking for `data.files` but backend returns array directly)
7. **File path handling** - changed from using `latestFile.name` to `latestFile.path` to correctly access uploaded files
8. **Layout expansion** - changed all pages from `max-w-7xl` (1280px) to `max-w-[1920px]` to fill larger screens, with responsive padding at all breakpoints

## 🚀 How to Restart Docker and View Changes

### Step 1: Stop and Clean Up Containers

```powershell
# Navigate to project directory
cd "C:\Users\Joseph N Nimyel\OneDrive\Documents\DEVPOST\IT HACKS 25\IT_HACKS_25"

# Stop all running containers
docker compose down

# Optional: Remove all volumes and rebuild from scratch
docker compose down -v
```

### Step 2: Rebuild and Start Containers

```powershell
# Rebuild containers with latest code changes
docker compose build --no-cache

# Start containers in detached mode
docker compose up -d

# Or start with logs visible (recommended for first run)
docker compose up
```

### Step 3: Wait for Startup

- **Backend** should start in ~5-10 seconds (port 8000)
- **Frontend** should start in ~30-60 seconds (port 3000)
- Watch the logs for "ready - started server" message

### Step 4: Access the Application

Open your browser and navigate to:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/docs

## 🧪 Testing Checklist

### 1. Navigation Test

- [ ] Visit http://localhost:3000
- [ ] Click on each navigation link:
  - Dashboard ✅
  - Analytics ✅
  - Reports ✅
  - Upload ✅
  - How It Works ✅
- [ ] Verify no console errors (press F12 to open DevTools)

### 2. Upload CSV Test

- [ ] Navigate to Upload page
- [ ] Upload the sample CSV file from: `backend/data/sample_data/synthetic_v2.csv`
- [ ] Verify file appears in "Uploaded Files" list
- [ ] Click "Preview" to see data table

### 3. Dashboard Test

- [ ] Navigate to Dashboard
- [ ] Verify room cards display (should show 4 rooms from CSV)
- [ ] Check that metrics cards show real data
- [ ] Scroll down to verify all sections render properly

### 4. Analytics Test

- [ ] Navigate to Analytics page
- [ ] Verify 6 charts display:
  - 🥚 Egg Production Over Time
  - ⚖️ Average Bird Weight
  - 🌾 Feed Consumption
  - 💚 Mortality Rate
  - 🌡️ Temperature
  - 📊 Feed Conversion Ratio
- [ ] Click "Show Comparison" button
- [ ] Select 2+ features (e.g., Eggs + Weight)
- [ ] Select multiple rooms
- [ ] Click "Generate Comparison Chart"
- [ ] Click expand icon on any chart to view fullscreen
- [ ] Test PNG and CSV export buttons

### 5. Reports Test

- [ ] Navigate to Reports page
- [ ] Verify per-room summary cards display
- [ ] Click different ranking buttons:
  - 🥚 Egg Production
  - ⚖️ Average Weight
  - 🌾 Feed Efficiency (FCR)
  - 💚 Lowest Mortality
- [ ] Verify trophy icons for top 3 performers
- [ ] Check recommendations panel shows suggestions
- [ ] Click "Export Report" button to download CSV

### 6. How It Works Test

- [ ] Navigate to How It Works page
- [ ] Verify proper spacing between sections
- [ ] Check that all 6 steps display correctly
- [ ] Verify 3 feature cards render properly
- [ ] Check best practices section at bottom

### 7. Responsive Test

- [ ] Press F12 to open DevTools
- [ ] Click "Toggle device toolbar" (Ctrl+Shift+M)
- [ ] Test at different widths:
  - 360px (Mobile)
  - 768px (Tablet)
  - 1024px (Desktop)
  - 1366px (Large Desktop)
- [ ] Verify no horizontal scroll at any width
- [ ] Check that grids adapt: 1→2→3→4 columns

### 8. i18n Test (Optional)

- [ ] If language switcher is implemented, test switching between:
  - English (en)
  - Hausa (ha)
  - Yoruba (yo)
  - Igbo (ig)
- [ ] Verify all text updates correctly

## 🐛 Troubleshooting

### Issue: Frontend won't start

**Solution:**

```powershell
# Stop containers
docker compose down

# Remove node_modules volume
docker volume rm it_hacks_25_node_modules

# Rebuild
docker compose build --no-cache frontend
docker compose up
```

### Issue: "Module not found" errors

**Solution:**

```powershell
# Enter frontend container
docker exec -it it_hacks_frontend sh

# Reinstall dependencies
npm install

# Exit container
exit

# Restart
docker compose restart frontend
```

### Issue: Backend API not accessible

**Solution:**

```powershell
# Check backend logs
docker logs it_hacks_backend

# Restart backend
docker compose restart backend

# Verify backend is running
curl http://localhost:8000/docs
```

### Issue: Changes not visible

**Solution:**

```powershell
# Hard refresh browser (Ctrl+Shift+R)
# Or clear browser cache

# If still not working, rebuild:
docker compose down
docker compose build --no-cache
docker compose up
```

### Issue: CSS not loading properly

**Solution:**

```powershell
# Check that Tailwind is compiling
docker logs it_hacks_frontend | grep -i "compiled"

# Restart Next.js dev server
docker compose restart frontend
```

### Issue: Port already in use

**Solution:**

```powershell
# Find process using port 3000 or 8000
netstat -ano | findstr :3000
netstat -ano | findstr :8000

# Kill the process (replace <PID> with actual process ID)
taskkill /PID <PID> /F

# Then restart Docker
docker compose up
```

## 📊 Expected Behavior

### Dashboard Page

- Shows 4 room cards dynamically loaded from CSV
- Farm metrics display real calculated values
- Loading state appears while fetching data
- Yellow warning if no CSV uploaded

### Analytics Page

- 6 charts render in 1→2→3 column responsive grid
- Each chart has expand and export buttons
- Comparison selector allows multi-feature selection
- Charts animate on load with fade-in effect
- Sample data fallback if no CSV uploaded

### Reports Page

- Per-room summary cards show 8 metrics each
- Rankings table updates when KPI button clicked
- Top 3 performers have trophy icons (🏆 🥈 🥉)
- Recommendations panel shows AI-driven suggestions
- Export button downloads comprehensive CSV report

### How It Works Page

- Clean layout with proper spacing
- 2-column grid on desktop, 1 column on mobile
- 6-step guide with icons
- 3 feature cards in responsive grid
- Best practices section at bottom

## 🎯 Success Criteria

All of the following should work without errors:

✅ All pages load without console errors  
✅ Navigation works between all pages  
✅ CSV upload and preview functional  
✅ Dashboard shows all rooms from CSV  
✅ Analytics displays 6 charts correctly  
✅ Comparison feature generates multi-series charts  
✅ Reports show rankings and recommendations  
✅ How It Works page has proper spacing  
✅ Responsive at 360px, 768px, 1024px, 1366px  
✅ No horizontal scroll at any width  
✅ Export buttons (PNG/CSV) work on charts  
✅ i18n translations load for all locales

## 📝 Quick Command Reference

```powershell
# Stop containers
docker compose down

# Start containers (with logs)
docker compose up

# Start containers (detached)
docker compose up -d

# View logs
docker compose logs -f

# View frontend logs only
docker logs -f it_hacks_frontend

# View backend logs only
docker logs -f it_hacks_backend

# Restart single service
docker compose restart frontend
docker compose restart backend

# Rebuild and restart
docker compose down
docker compose build --no-cache
docker compose up -d

# Check running containers
docker ps

# Enter frontend container shell
docker exec -it it_hacks_frontend sh

# Enter backend container shell
docker exec -it it_hacks_backend sh
```

## 🎉 You're All Set!

If all tests pass, your IT Hacks 25 Dashboard is working perfectly with:

- ✅ Responsive design (mobile/tablet/desktop)
- ✅ Multi-chart analytics with comparison
- ✅ Dynamic room loading from CSV
- ✅ Rankings and AI recommendations
- ✅ Proper spacing and layout on all pages
- ✅ Export functionality (PNG/CSV)
- ✅ i18n support (4 languages)

Enjoy your fully-featured poultry farm management dashboard! 🐔📊
