# Docker Management Script for IT HACKS 25
# Provides easy commands for Docker operations

param(
    [Parameter(Mandatory = $true)]
    [string]$Command,
    
    [string]$Service = "",
    [int]$Users = 10,
    [int]$Duration = 300,
    [string]$LogLevel = "INFO"
)

# Colors for output
$colors = @{
    'Success' = 'Green'
    'Error'   = 'Red'
    'Warning' = 'Yellow'
    'Info'    = 'Cyan'
}

function Write-Status {
    param([string]$Message, [string]$Type = "Info")
    Write-Host $Message -ForegroundColor $colors[$Type]
}

function Main {
    switch ($Command.ToLower()) {
        # ==================== DEPLOYMENT COMMANDS ====================
        
        "build" {
            Write-Status "=== BUILDING DOCKER IMAGES ===" "Info"
            docker-compose build
            if ($LASTEXITCODE -eq 0) {
                Write-Status "✓ Build completed successfully" "Success"
            }
            else {
                Write-Status "✗ Build failed" "Error"
            }
        }
        
        "up" {
            Write-Status "=== STARTING ALL SERVICES ===" "Info"
            docker-compose up -d
            Start-Sleep -Seconds 5
            docker-compose ps
            Write-Status "✓ Services started" "Success"
        }
        
        "down" {
            Write-Status "=== STOPPING ALL SERVICES ===" "Info"
            docker-compose down
            Write-Status "✓ Services stopped" "Success"
        }
        
        "restart" {
            Write-Status "=== RESTARTING SERVICES ===" "Info"
            if ($Service) {
                docker-compose restart $Service
                Write-Status "✓ $Service restarted" "Success"
            }
            else {
                docker-compose restart
                Write-Status "✓ All services restarted" "Success"
            }
        }
        
        "logs" {
            Write-Status "=== VIEWING LOGS ===" "Info"
            if ($Service) {
                docker-compose logs -f --tail=50 $Service
            }
            else {
                docker-compose logs -f --tail=50
            }
        }
        
        "status" {
            Write-Status "=== SERVICE STATUS ===" "Info"
            docker-compose ps
            Write-Status "`n=== DOCKER STATS ===" "Info"
            docker stats --no-stream
        }
        
        "health" {
            Write-Status "=== HEALTH CHECKS ===" "Info"
            
            # Backend health
            Write-Status "`nBackend Health:" "Info"
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -ErrorAction SilentlyContinue
                if ($response.StatusCode -eq 200) {
                    Write-Status "✓ Backend is healthy" "Success"
                }
            }
            catch {
                Write-Status "✗ Backend is unhealthy or unreachable" "Error"
            }
            
            # Frontend check
            Write-Status "`nFrontend Health:" "Info"
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:3000" -ErrorAction SilentlyContinue
                if ($response.StatusCode -eq 200) {
                    Write-Status "✓ Frontend is running" "Success"
                }
            }
            catch {
                Write-Status "✗ Frontend is unreachable" "Error"
            }
            
            # Database check
            Write-Status "`nDatabase Health:" "Info"
            try {
                $dbCheck = docker-compose exec -T postgres psql -U farm -c "SELECT 1" 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Status "✓ Database is connected" "Success"
                }
            }
            catch {
                Write-Status "✗ Database connection failed" "Error"
            }
        }
        
        # ==================== DATABASE COMMANDS ====================
        
        "db-init" {
            Write-Status "=== INITIALIZING DATABASE ===" "Info"
            docker-compose exec -T postgres psql -U farm -d eco_farm -c "SELECT version();"
            Write-Status "✓ Database initialized" "Success"
        }
        
        "db-migrate" {
            Write-Status "=== RUNNING DATABASE MIGRATIONS ===" "Info"
            docker-compose exec backend alembic upgrade head
            Write-Status "✓ Migrations completed" "Success"
        }
        
        "db-seed" {
            Write-Status "=== SEEDING DATABASE ===" "Info"
            docker-compose exec backend python data/generate_multi_farm.py
            Write-Status "✓ Database seeded with sample data" "Success"
        }
        
        "db-shell" {
            Write-Status "=== OPENING DATABASE SHELL ===" "Info"
            docker-compose exec postgres psql -U farm -d eco_farm
        }
        
        # ==================== LOAD TESTING COMMANDS ====================
        
        "load-test" {
            Write-Status "=== STARTING LOAD TEST ===" "Info"
            
            # Check if Locust is installed
            $locusts = pip list | Select-String "locust" -ErrorAction SilentlyContinue
            if (-not $locusts) {
                Write-Status "Installing Locust..." "Warning"
                pip install locust
            }
            
            Write-Status "Starting load test with $Users users for $Duration seconds" "Info"
            Write-Status "Open http://localhost:8089 in your browser" "Info"
            Write-Status "`n" "Info"
            
            locust -f scripts/locustfile.py `
                --host=http://localhost:8000 `
                --users=$Users `
                --spawn-rate=5 `
                --run-time=${Duration}s `
                --headless `
                --csv=load_test_results
            
            if ($LASTEXITCODE -eq 0) {
                Write-Status "`n✓ Load test completed" "Success"
                Write-Status "Results saved to load_test_results.csv" "Info"
            }
            else {
                Write-Status "✗ Load test failed" "Error"
            }
        }
        
        "load-test-gui" {
            Write-Status "=== STARTING LOAD TEST WITH GUI ===" "Info"
            
            # Check if Locust is installed
            $locusts = pip list | Select-String "locust" -ErrorAction SilentlyContinue
            if (-not $locusts) {
                Write-Status "Installing Locust..." "Warning"
                pip install locust
            }
            
            Write-Status "Starting Locust GUI..." "Info"
            Write-Status "Open http://localhost:8089 in your browser" "Info"
            Start-Process "http://localhost:8089"
            
            locust -f scripts/locustfile.py --host=http://localhost:8000
        }
        
        "wrk-test" {
            Write-Status "=== STARTING WRK BENCHMARK TEST ===" "Info"
            
            # Check if wrk is installed
            $wrk = Get-Command wrk -ErrorAction SilentlyContinue
            if (-not $wrk) {
                Write-Status "wrk is not installed. Install with: scoop install wrk" "Error"
                return
            }
            
            Write-Status "Testing with 4 threads, 100 connections, 30 second duration..." "Info"
            
            # Test health endpoint
            Write-Status "`nTesting /health endpoint:" "Info"
            wrk -t4 -c100 -d30s http://localhost:8000/health
            
            # Test monitoring endpoint
            Write-Status "`nTesting /monitor/current endpoint:" "Info"
            wrk -t4 -c100 -d30s http://localhost:8000/monitor/current
            
            # Test feature importance endpoint
            Write-Status "`nTesting /monitor/feature-importance endpoint:" "Info"
            wrk -t4 -c100 -d30s http://localhost:8000/monitor/feature-importance
            
            Write-Status "`n✓ Benchmark tests completed" "Success"
        }
        
        # ==================== CLEANUP COMMANDS ====================
        
        "clean" {
            Write-Status "=== CLEANING UP ===" "Warning"
            Write-Status "This will remove containers and volumes" "Warning"
            $confirm = Read-Host "Continue? (y/n)"
            
            if ($confirm -eq "y" -or $confirm -eq "Y") {
                Write-Status "Removing containers and volumes..." "Info"
                docker-compose down -v
                Write-Status "✓ Cleanup completed" "Success"
            }
        }
        
        "clean-all" {
            Write-Status "=== FULL SYSTEM CLEANUP ===" "Error"
            Write-Status "This will remove ALL containers, images, and volumes" "Error"
            $confirm = Read-Host "Continue? (y/n)"
            
            if ($confirm -eq "y" -or $confirm -eq "Y") {
                Write-Status "Stopping containers..." "Info"
                docker-compose down --rmi all -v
                Write-Status "Pruning system..." "Info"
                docker system prune -a -f
                Write-Status "✓ Full cleanup completed" "Success"
            }
        }
        
        # ==================== HELP ====================
        
        "help" {
            Show-Help
        }
        
        default {
            Write-Status "Unknown command: $Command" "Error"
            Show-Help
        }
    }
}

function Show-Help {
    Write-Host @"
╔════════════════════════════════════════════════════════════════╗
║     IT HACKS 25 - Docker Management Script                    ║
╚════════════════════════════════════════════════════════════════╝

DEPLOYMENT COMMANDS:
  build           Build Docker images
  up              Start all services
  down            Stop all services
  restart         Restart services (optionally specify service name)
  logs            View service logs (optionally specify service name)
  status          Show service status and resource usage
  health          Check health of all services

DATABASE COMMANDS:
  db-init         Initialize database
  db-migrate      Run database migrations
  db-seed         Seed database with sample data
  db-shell        Open PostgreSQL shell

LOAD TESTING COMMANDS:
  load-test       Run headless load test (10 users, 5 min default)
  load-test-gui   Run load test with web GUI
  wrk-test        Run wrk HTTP benchmarking tests

CLEANUP COMMANDS:
  clean           Remove containers and volumes (keep images)
  clean-all       Remove everything (containers, images, volumes)

EXAMPLES:
  .\docker_manage.ps1 -Command build
  .\docker_manage.ps1 -Command up
  .\docker_manage.ps1 -Command logs -Service backend
  .\docker_manage.ps1 -Command load-test -Users 50 -Duration 600
  .\docker_manage.ps1 -Command restart -Service postgres
  .\docker_manage.ps1 -Command health

OPTIONS:
  -Command        The command to execute (required)
  -Service        Service name (optional, for logs/restart)
  -Users          Number of users for load test (default: 10)
  -Duration       Duration in seconds (default: 300)

"@
}

# Run main function
Main
