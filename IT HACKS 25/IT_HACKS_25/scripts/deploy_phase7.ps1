# Phase 7 Deployment Script
# Run this after starting Docker containers

Write-Host "=" -NoNewline; 1..60 | ForEach-Object { Write-Host "=" -NoNewline }
Write-Host ""
Write-Host "Phase 7: AI Prediction Engine - Deployment Script"
Write-Host "=" -NoNewline; 1..60 | ForEach-Object { Write-Host "=" -NoNewline }
Write-Host "`n"

# Check if containers are running
Write-Host "[1/6] Checking Docker containers..." -ForegroundColor Cyan
$containers = docker ps --format "{{.Names}}"
$required = @("it_hacks_backend", "eco_farm_postgres", "eco_farm_redis", "it_hacks_frontend")
$allRunning = $true

foreach ($container in $required) {
    if ($containers -contains $container) {
        Write-Host "  ✅ $container is running" -ForegroundColor Green
    }
    else {
        Write-Host "  ❌ $container is NOT running" -ForegroundColor Red
        $allRunning = $false
    }
}

if (-not $allRunning) {
    Write-Host "`n❌ Error: Not all required containers are running." -ForegroundColor Red
    Write-Host "Please run: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n[2/6] Installing Python dependencies..." -ForegroundColor Cyan
docker exec it_hacks_backend pip install --quiet torch==2.1.0 statsmodels==0.14.0 lightgbm==4.1.0 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Dependencies installed successfully" -ForegroundColor Green
}
else {
    Write-Host "  ⚠️  Some dependencies may already be installed" -ForegroundColor Yellow
}

Write-Host "`n[3/6] Running database migrations..." -ForegroundColor Cyan
$migrationOutput = docker exec it_hacks_backend alembic upgrade head 2>&1
if ($migrationOutput -match "Running upgrade|already at head") {
    Write-Host "  ✅ Migrations applied successfully" -ForegroundColor Green
}
else {
    Write-Host "  ❌ Migration failed:" -ForegroundColor Red
    Write-Host "  $migrationOutput" -ForegroundColor Red
    exit 1
}

Write-Host "`n[4/6] Verifying database tables..." -ForegroundColor Cyan
$tables = docker exec eco_farm_postgres psql -U farm -d eco_farm -t -c "\dt" 2>&1
if ($tables -match "ml_models" -and $tables -match "predictions") {
    Write-Host "  ✅ ml_models table exists" -ForegroundColor Green
    Write-Host "  ✅ predictions table exists" -ForegroundColor Green
}
else {
    Write-Host "  ❌ Required tables not found" -ForegroundColor Red
    exit 1
}

Write-Host "`n[5/6] Checking ML models directory..." -ForegroundColor Cyan
$modelsDir = ".\backend\ml\models"
if (Test-Path $modelsDir) {
    Write-Host "  ✅ ML models directory exists: $modelsDir" -ForegroundColor Green
}
else {
    New-Item -ItemType Directory -Path $modelsDir -Force | Out-Null
    Write-Host "  ✅ Created ML models directory: $modelsDir" -ForegroundColor Green
}

Write-Host "`n[6/6] Testing ML API endpoints..." -ForegroundColor Cyan
Start-Sleep -Seconds 2  # Wait for backend to be ready

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/ml/models" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ ML API is accessible" -ForegroundColor Green
        $data = $response.Content | ConvertFrom-Json
        Write-Host "  ℹ️  Current models count: $($data.total_count)" -ForegroundColor Cyan
    }
}
catch {
    Write-Host "  ⚠️  ML API not responding yet (may need backend restart)" -ForegroundColor Yellow
}

Write-Host "`n$("=" * 60)"
Write-Host "✅ Phase 7 Deployment Complete!" -ForegroundColor Green
Write-Host $("=" * 60)

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "  1. Upload CSV data: http://localhost:3000/upload" -ForegroundColor White
Write-Host "     (This will auto-train your first model)" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. View model monitor: http://localhost:3000/model-monitor" -ForegroundColor White
Write-Host "     (Monitor training status and performance)" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Generate predictions:" -ForegroundColor White
Write-Host "     curl -X POST `"http://localhost:8000/ml/predict/room/2?horizons=7`"" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. API Documentation: http://localhost:8000/docs" -ForegroundColor White
Write-Host "     (View all ML endpoints)" -ForegroundColor Gray

Write-Host "`nManual Training (if needed):" -ForegroundColor Cyan
Write-Host "  curl -X POST `"http://localhost:8000/ml/train?model_type=random_forest`"" -ForegroundColor Gray

Write-Host "`nTroubleshooting:" -ForegroundColor Cyan
Write-Host "  - View backend logs: docker logs it_hacks_backend --tail 50" -ForegroundColor Gray
Write-Host "  - Restart backend: docker restart it_hacks_backend" -ForegroundColor Gray
Write-Host "  - Check database: docker exec eco_farm_postgres psql -U farm -d eco_farm" -ForegroundColor Gray

Write-Host "`n📚 Documentation: ./Instructions/Phase_7_AI_Prediction_Engine.md" -ForegroundColor Yellow
Write-Host ""
