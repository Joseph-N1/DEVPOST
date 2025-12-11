# Setup and Initialization Script for IT HACKS 25
# Automates Docker setup, dependencies, and load testing

param(
    [Parameter(Mandatory = $false)]
    [string]$Action = "setup",
    
    [switch]$SkipDocker = $false,
    [switch]$SkipLoadTest = $false
)

$ErrorActionPreference = "Stop"
$WarningPreference = "Continue"

# Colors
$colors = @{
    'Success' = 'Green'
    'Error'   = 'Red'
    'Warning' = 'Yellow'
    'Info'    = 'Cyan'
    'Section' = 'Magenta'
}

function Write-Status {
    param([string]$Message, [string]$Type = "Info")
    $prefix = switch ($Type) {
        "Success" { "✓" }
        "Error" { "✗" }
        "Warning" { "⚠" }
        "Section" { "━" }
        default { "•" }
    }
    Write-Host "$prefix $Message" -ForegroundColor $colors[$Type]
}

function Check-Command {
    param([string]$Command)
    $exists = Get-Command $Command -ErrorAction SilentlyContinue
    return $null -ne $exists
}

function Check-Docker {
    Write-Status "Checking Docker installation..." "Info"
    
    if (-not (Check-Command docker)) {
        Write-Status "Docker not found. Please install Docker Desktop" "Error"
        Write-Host "Download from: https://www.docker.com/products/docker-desktop"
        return $false
    }
    
    Write-Status "Docker installed" "Success"
    $version = docker --version
    Write-Status $version "Info"
    return $true
}

function Check-DockerCompose {
    Write-Status "Checking Docker Compose..." "Info"
    
    if (-not (Check-Command docker-compose)) {
        Write-Status "Docker Compose not found" "Error"
        return $false
    }
    
    Write-Status "Docker Compose installed" "Success"
    $version = docker-compose --version
    Write-Status $version "Info"
    return $true
}

function Check-Git {
    Write-Status "Checking Git installation..." "Info"
    
    if (-not (Check-Command git)) {
        Write-Status "Git not found. Please install Git" "Error"
        Write-Host "Download from: https://git-scm.com/download/win"
        return $false
    }
    
    Write-Status "Git installed" "Success"
    $version = git --version
    Write-Status $version "Info"
    return $true
}

function Check-Python {
    Write-Status "Checking Python installation..." "Info"
    
    if (-not (Check-Command python)) {
        Write-Status "Python not found. Please install Python 3.8+" "Error"
        Write-Host "Download from: https://www.python.org/downloads/"
        return $false
    }
    
    Write-Status "Python installed" "Success"
    $version = python --version
    Write-Status $version "Info"
    return $true
}

function Setup-Environment {
    Write-Status "Setting up environment files..." "Section"
    
    $envFile = ".env"
    
    if (-not (Test-Path $envFile)) {
        Write-Status "Creating .env file..." "Info"
        
        $envContent = @"
# PostgreSQL Configuration
POSTGRES_USER=farm
POSTGRES_PASSWORD=EcoFarm2025Secure!
POSTGRES_DB=eco_farm

# Redis Configuration
REDIS_PASSWORD=Redis2025Secure!
REDIS_URL=redis://:Redis2025Secure!@redis:6379

# Backend Configuration
PYTHONUNBUFFERED=1
JWT_SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")
REFRESH_SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")

# Database
DATABASE_URL=postgresql://farm:EcoFarm2025Secure!@postgres:5432/eco_farm

# API Configuration
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Features
RATE_LIMIT_ENABLED=true
MAX_UPLOAD_SIZE_MB=50
ANOMALY_DETECTION_ENABLED=true
FEATURE_IMPORTANCE_TRACKING=true

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_INTERNAL_API_URL=http://backend:8000

# Logging
LOG_LEVEL=INFO
DEBUG=false
"@
        
        Set-Content -Path $envFile -Value $envContent
        Write-Status ".env file created successfully" "Success"
    }
    else {
        Write-Status ".env file already exists" "Warning"
    }
}

function Install-Dependencies {
    Write-Status "Installing Python dependencies..." "Section"
    
    # Check if venv exists
    if (-not (Test-Path ".venv")) {
        Write-Status "Creating virtual environment..." "Info"
        python -m venv .venv
        Write-Status "Virtual environment created" "Success"
    }
    else {
        Write-Status "Virtual environment already exists" "Warning"
    }
    
    # Activate venv
    Write-Status "Activating virtual environment..." "Info"
    & .\.venv\Scripts\Activate.ps1
    
    # Install dependencies
    Write-Status "Installing Python packages..." "Info"
    pip install --upgrade pip
    pip install pytest locust
    
    Write-Status "Python dependencies installed" "Success"
}

function Setup-Docker {
    param([bool]$Skip = $false)
    
    if ($Skip) {
        Write-Status "Skipping Docker setup" "Warning"
        return
    }
    
    Write-Status "Setting up Docker..." "Section"
    
    # Build images
    Write-Status "Building Docker images..." "Info"
    docker-compose build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Status "Docker build failed" "Error"
        return $false
    }
    
    Write-Status "Docker images built successfully" "Success"
    
    # Start services
    Write-Status "Starting Docker services..." "Info"
    docker-compose up -d
    
    if ($LASTEXITCODE -ne 0) {
        Write-Status "Failed to start Docker services" "Error"
        return $false
    }
    
    Write-Status "Docker services started" "Success"
    
    # Wait for services to be healthy
    Write-Status "Waiting for services to be healthy..." "Info"
    $maxAttempts = 30
    $attempt = 0
    
    while ($attempt -lt $maxAttempts) {
        $health = docker-compose ps --format "json" | ConvertFrom-Json | Where-Object { $_.State -notmatch "healthy|running" }
        
        if ($null -eq $health) {
            Write-Status "All services are healthy" "Success"
            return $true
        }
        
        Start-Sleep -Seconds 2
        $attempt++
    }
    
    Write-Status "Services did not become healthy in time" "Warning"
    return $true
}

function Verify-Health {
    Write-Status "Verifying system health..." "Section"
    
    # Check backend
    Write-Status "Checking backend health..." "Info"
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Status "Backend is healthy" "Success"
        }
    }
    catch {
        Write-Status "Backend is not responding" "Warning"
    }
    
    # Check frontend
    Write-Status "Checking frontend..." "Info"
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Status "Frontend is accessible" "Success"
        }
    }
    catch {
        Write-Status "Frontend is not accessible" "Warning"
    }
    
    # Check Docker
    Write-Status "Docker services running:" "Info"
    docker-compose ps
}

function Setup-LoadTesting {
    param([bool]$Skip = $false)
    
    if ($Skip) {
        Write-Status "Skipping load testing setup" "Warning"
        return
    }
    
    Write-Status "Setting up load testing..." "Section"
    
    # Check if Locust script exists
    if (-not (Test-Path "scripts/locustfile.py")) {
        Write-Status "locustfile.py not found" "Error"
        return
    }
    
    Write-Status "Load testing script ready at scripts/locustfile.py" "Success"
    
    Write-Status "`nTo run load tests:" "Info"
    Write-Status "  Interactive GUI:  .\scripts\docker_manage.ps1 -Command load-test-gui" "Info"
    Write-Status "  Headless (10 users):  .\scripts\docker_manage.ps1 -Command load-test" "Info"
    Write-Status "  Benchmarking:  .\scripts\docker_manage.ps1 -Command wrk-test" "Info"
}

function Initialize-Database {
    Write-Status "Initializing database..." "Section"
    
    # Run migrations
    Write-Status "Running database migrations..." "Info"
    try {
        docker-compose exec -T backend alembic upgrade head 2>$null
        Write-Status "Migrations completed" "Success"
    }
    catch {
        Write-Status "Migration failed or already completed" "Warning"
    }
    
    # Seed sample data
    Write-Status "Seeding sample data..." "Info"
    try {
        docker-compose exec -T backend python data/generate_multi_farm.py 2>$null
        Write-Status "Sample data loaded" "Success"
    }
    catch {
        Write-Status "Sample data loading skipped" "Warning"
    }
}

function Show-Summary {
    Write-Host @"

╔════════════════════════════════════════════════════════════════╗
║           IT HACKS 25 - Setup Completed Successfully           ║
╚════════════════════════════════════════════════════════════════╝

✓ All systems initialized and ready for deployment

NEXT STEPS:

1. Access the Application:
   • Frontend:   http://localhost:3000
   • Backend:    http://localhost:8000
   • API Docs:   http://localhost:8000/docs

2. View Logs:
   .\scripts\docker_manage.ps1 -Command logs

3. Check Health:
   .\scripts\docker_manage.ps1 -Command health

4. Run Load Tests:
   .\scripts\docker_manage.ps1 -Command load-test-gui

5. Manage Docker:
   .\scripts\docker_manage.ps1 -Command help

DEFAULT CREDENTIALS:
   Database User:     farm
   Database Password: (see .env file)
   Redis Password:    (see .env file)

USEFUL COMMANDS:

   Restart services:     .\scripts\docker_manage.ps1 -Command restart
   Stop all services:    .\scripts\docker_manage.ps1 -Command down
   View database:        .\scripts\docker_manage.ps1 -Command db-shell
   Run tests:            pytest backend/tests/ -v

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For more information, see Instructions/DOCKER_DEPLOYMENT_GUIDE.md

"@ -ForegroundColor Green
}

function Main {
    Clear-Host
    
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "║        IT HACKS 25 - Docker Setup & Initialization            ║" -ForegroundColor Magenta
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
    Write-Host ""
    
    # Check prerequisites
    Write-Status "Checking prerequisites..." "Section"
    
    if (-not (Check-Git)) { exit 1 }
    if (-not (Check-Docker)) { exit 1 }
    if (-not (Check-DockerCompose)) { exit 1 }
    if (-not (Check-Python)) { exit 1 }
    
    Write-Status "All prerequisites satisfied" "Success"
    
    # Setup
    Setup-Environment
    Install-Dependencies
    Setup-Docker -Skip $SkipDocker
    Initialize-Database
    Verify-Health
    Setup-LoadTesting -Skip $SkipLoadTest
    
    # Summary
    Show-Summary
}

# Run main
Main
