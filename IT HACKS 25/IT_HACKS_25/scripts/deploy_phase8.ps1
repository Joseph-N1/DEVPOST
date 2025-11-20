# Phase 8 Authentication Deployment Script
# Run this script to deploy Phase 8 authentication system

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Phase 8 Authentication Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install Backend Dependencies
Write-Host "[1/5] Installing backend dependencies..." -ForegroundColor Yellow
docker exec it_hacks_backend pip install -r requirements.txt

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "Backend dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 2: Run Database Migration
Write-Host "[2/5] Running database migration..." -ForegroundColor Yellow
docker exec it_hacks_backend alembic upgrade head

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to run migration" -ForegroundColor Red
    exit 1
}
Write-Host "Database migration complete" -ForegroundColor Green
Write-Host ""

# Step 3: Restart Backend
Write-Host "[3/5] Restarting backend container..." -ForegroundColor Yellow
docker restart it_hacks_backend
Start-Sleep -Seconds 5
Write-Host "Backend restarted" -ForegroundColor Green
Write-Host ""

# Step 4: Clear Frontend Cache
Write-Host "[4/5] Clearing Next.js cache..." -ForegroundColor Yellow
docker exec it_hacks_frontend rm -rf .next
Write-Host "Frontend cache cleared" -ForegroundColor Green
Write-Host ""

# Step 5: Restart Frontend
Write-Host "[5/5] Restarting frontend container..." -ForegroundColor Yellow
docker restart it_hacks_frontend
Start-Sleep -Seconds 8
Write-Host "Frontend restarted" -ForegroundColor Green
Write-Host ""

# Success Message
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Phase 8 Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open http://localhost:3000/register" -ForegroundColor White
Write-Host "2. Create test users" -ForegroundColor White
Write-Host "3. Test login at http://localhost:3000/login" -ForegroundColor White
Write-Host "4. Verify role-based access control" -ForegroundColor White
Write-Host ""
Write-Host "For detailed testing guide, see:" -ForegroundColor Yellow
Write-Host "Instructions/PHASE_8_TESTING_GUIDE.md" -ForegroundColor White
Write-Host ""
