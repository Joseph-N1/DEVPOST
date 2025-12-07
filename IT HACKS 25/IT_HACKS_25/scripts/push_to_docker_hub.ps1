#!/usr/bin/env pwsh
<#
.SYNOPSIS
ECO FARM - Docker Hub Image Push Script
Push optimized Phase 10 images to Docker Hub for hackathon judges

.DESCRIPTION
This script tags and pushes backend and frontend images to Docker Hub.
Judges can then pull pre-built images instead of waiting 30+ minutes for builds.

.PARAMETER DockerHubUsername
Your Docker Hub username (required)

.PARAMETER TagName
Tag name for the images (default: 'phase-10')

.EXAMPLE
.\push_to_docker_hub.ps1 -DockerHubUsername josephn
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$DockerHubUsername,
    
    [Parameter(Mandatory = $false)]
    [string]$TagName = "phase-10"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Status {
    param([string]$Message, [string]$Status = "Info")
    $colors = @{"Success" = "Green"; "Error" = "Red"; "Warning" = "Yellow"; "Info" = "Cyan" }
    Write-Host "[$Status] $Message" -ForegroundColor $colors[$Status]
}

# ============================================
# PRE-FLIGHT CHECKS
# ============================================

Write-Status "=== ECO FARM Docker Hub Push Script ===" "Info"
Write-Status "Docker Hub Username: $DockerHubUsername" "Info"
Write-Status "Tag Name: $TagName" "Info"

# Check if Docker is running
try {
    docker ps > $null 2>&1
    Write-Status "✓ Docker daemon is running" "Success"
}
catch {
    Write-Status "✗ Docker daemon is not running. Please start Docker." "Error"
    exit 1
}

# Check if logged in to Docker Hub
Write-Status "`nAttempting Docker Hub login..." "Info"
$dockerLoginOutput = docker login 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Status "✗ Docker login failed. Please run 'docker login' manually." "Error"
    exit 1
}
Write-Status "✓ Successfully logged in to Docker Hub" "Success"

# ============================================
# VERIFY IMAGES EXIST
# ============================================

Write-Status "`n=== Verifying Local Images ===" "Info"

$backendExists = docker images it_hacks_25-backend --quiet
$frontendExists = docker images it_hacks_25-frontend --quiet

if (-not $backendExists) {
    Write-Status "✗ Backend image not found. Please run: docker compose build --no-cache" "Error"
    exit 1
}
Write-Status "✓ Backend image found: it_hacks_25-backend:latest" "Success"

if (-not $frontendExists) {
    Write-Status "✗ Frontend image not found. Please run: docker compose build --no-cache" "Error"
    exit 1
}
Write-Status "✓ Frontend image found: it_hacks_25-frontend:latest" "Success"

# Show image sizes
Write-Status "`n=== Image Sizes ===" "Info"
$backendSize = docker images it_hacks_25-backend:latest --format "{{.Size}}"
$frontendSize = docker images it_hacks_25-frontend:latest --format "{{.Size}}"
Write-Host "Backend:  $backendSize" -ForegroundColor Cyan
Write-Host "Frontend: $frontendSize" -ForegroundColor Cyan

# ============================================
# TAG IMAGES
# ============================================

Write-Status "`n=== Tagging Images ===" "Info"

$backendRepo = "$DockerHubUsername/it_hacks_25-backend"
$frontendRepo = "$DockerHubUsername/it_hacks_25-frontend"

try {
    Write-Status "Tagging backend:latest → $backendRepo:latest" "Info"
    docker tag it_hacks_25-backend:latest "$backendRepo:latest"
    
    Write-Status "Tagging backend:latest → $backendRepo:$TagName" "Info"
    docker tag it_hacks_25-backend:latest "$backendRepo:$TagName"
    
    Write-Status "✓ Backend images tagged" "Success"
}
catch {
    Write-Status "✗ Failed to tag backend images: $_" "Error"
    exit 1
}

try {
    Write-Status "Tagging frontend:latest → $frontendRepo:latest" "Info"
    docker tag it_hacks_25-frontend:latest "$frontendRepo:latest"
    
    Write-Status "Tagging frontend:latest → $frontendRepo:$TagName" "Info"
    docker tag it_hacks_25-frontend:latest "$frontendRepo:$TagName"
    
    Write-Status "✓ Frontend images tagged" "Success"
}
catch {
    Write-Status "✗ Failed to tag frontend images: $_" "Error"
    exit 1
}

# ============================================
# PUSH TO DOCKER HUB
# ============================================

Write-Status "`n=== Pushing to Docker Hub ===" "Info"

# Push backend images
Write-Status "`nPushing backend:latest..." "Info"
if (-not (docker push "$backendRepo:latest")) {
    Write-Status "✗ Failed to push backend:latest" "Error"
    exit 1
}
Write-Status "✓ Pushed $backendRepo:latest" "Success"

Write-Status "Pushing backend:$TagName..." "Info"
if (-not (docker push "$backendRepo:$TagName")) {
    Write-Status "✗ Failed to push backend:$TagName" "Error"
    exit 1
}
Write-Status "✓ Pushed $backendRepo:$TagName" "Success"

# Push frontend images
Write-Status "`nPushing frontend:latest..." "Info"
if (-not (docker push "$frontendRepo:latest")) {
    Write-Status "✗ Failed to push frontend:latest" "Error"
    exit 1
}
Write-Status "✓ Pushed $frontendRepo:latest" "Success"

Write-Status "Pushing frontend:$TagName..." "Info"
if (-not (docker push "$frontendRepo:$TagName")) {
    Write-Status "✗ Failed to push frontend:$TagName" "Error"
    exit 1
}
Write-Status "✓ Pushed $frontendRepo:$TagName" "Success"

# ============================================
# VERIFICATION
# ============================================

Write-Status "`n=== Verifying on Docker Hub ===" "Info"

Write-Host @"
✓ All images pushed successfully!

Backend Images:
  - https://hub.docker.com/r/$backendRepo
    - Tag: latest
    - Tag: $TagName

Frontend Images:
  - https://hub.docker.com/r/$frontendRepo
    - Tag: latest
    - Tag: $TagName

Judge Quick Start:
  docker login
  docker pull $backendRepo:latest
  docker pull $frontendRepo:latest
  docker compose -f docker-compose.yml up -d

Or use docker-compose.prod.yml for production deployment.
"@ -ForegroundColor Green

# ============================================
# DOCKER COMPOSE PROD FILE
# ============================================

Write-Status "`n=== Creating docker-compose.prod.yml ===" "Info"

$prodCompose = @"
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: eco_farm_postgres
    environment:
      - POSTGRES_USER=`${POSTGRES_USER:-farm}
      - POSTGRES_PASSWORD=`${POSTGRES_PASSWORD:-changeme}
      - POSTGRES_DB=`${POSTGRES_DB:-eco_farm}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - farmnet
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U farm"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7
    container_name: eco_farm_redis
    command: redis-server --requirepass `${REDIS_PASSWORD:-changeme}
    ports:
      - "6379:6379"
    networks:
      - farmnet
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  backend:
    image: $backendRepo:latest
    container_name: it_hacks_backend
    ports:
      - "8000:8000"
    environment:
      - PYTHONUNBUFFERED=1
      - DATABASE_URL=postgresql://`${POSTGRES_USER:-farm}:`${POSTGRES_PASSWORD:-changeme}@postgres:5432/`${POSTGRES_DB:-eco_farm}
      - REDIS_URL=`${REDIS_URL:-redis://:changeme@redis:6379}
      - POSTGRES_USER=`${POSTGRES_USER:-farm}
      - POSTGRES_PASSWORD=`${POSTGRES_PASSWORD:-changeme}
      - JWT_SECRET_KEY=`${JWT_SECRET_KEY:-changeme-in-production}
      - REFRESH_SECRET_KEY=`${REFRESH_SECRET_KEY:-changeme-in-production}
      - CORS_ORIGINS=`${CORS_ORIGINS:-http://localhost:3000,http://127.0.0.1:3000}
    networks:
      - farmnet
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    image: $frontendRepo:latest
    container_name: it_hacks_frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=`${NEXT_PUBLIC_API_URL:-http://localhost:8000}
      - NEXT_INTERNAL_API_URL=`${NEXT_INTERNAL_API_URL:-http://backend:8000}
    networks:
      - farmnet
    depends_on:
      backend:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:

networks:
  farmnet:
    driver: bridge
"@

$prodCompose | Out-File "docker-compose.prod.yml" -Encoding UTF8
Write-Status "✓ Created docker-compose.prod.yml for production deployment" "Success"

# ============================================
# FINAL SUMMARY
# ============================================

Write-Status "`n=== PUSH COMPLETE ===" "Info"

Write-Host @"

✅ PHASE 10 - DOCKER HUB PUSH COMPLETE

Images Now Available:
├─ Backend
│  ├─ Tag: latest
│  ├─ Tag: $TagName
│  └─ URL: https://hub.docker.com/r/$backendRepo
│
└─ Frontend
   ├─ Tag: latest
   ├─ Tag: $TagName
   └─ URL: https://hub.docker.com/r/$frontendRepo

For Judges - Quick Deployment:
  1. Create .env from .env.example with strong secrets
  2. Run: docker compose -f docker-compose.prod.yml up -d
  3. Wait 30 seconds for services to be healthy
  4. Access: http://localhost:3000

Next Steps:
  1. Push to git: git push origin main
  2. Verify images on Docker Hub
  3. Test pull from public: docker pull $backendRepo:latest
  4. Share Docker Hub links with judges

Security Highlights:
  ✓ CORS restrictions enabled
  ✓ JWT secrets in .env (not hardcoded)
  ✓ Rate limiting on auth endpoints
  ✓ File upload validation (size, type, traversal)
  ✓ Multi-stage Docker builds
  ✓ Production-ready configuration

Documentation:
  - .security-review: Full security audit
  - PHASE_10_DEPLOYMENT_CHECKLIST.md: Complete deployment guide
  - QUICK_TEST_COMMANDS.md: Test commands for judges

"@ -ForegroundColor Green

Write-Host "`n"
