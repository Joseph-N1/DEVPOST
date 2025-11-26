<# 
restart_project.ps1
Rebuild + restart docker-compose, ensure PostgreSQL DBs exist,
run migrations, run deploy scripts, and tail backend logs.
#>

param(
    [string]$ProjectRoot = (Get-Location).Path,
    [int]$PostgresTimeoutSec = 180
)

function Info($m) { Write-Host "[INFO]  $m" -ForegroundColor Cyan }
function Warn($m) { Write-Host "[WARN]  $m" -ForegroundColor Yellow }
function Err($m) { Write-Host "[ERROR] $m" -ForegroundColor Red }

# ----------------------------------------
# 1. Move to project root
# ----------------------------------------
Set-Location -Path $ProjectRoot
Info "Working directory: $ProjectRoot"

# ----------------------------------------
# 2. Activate venv
# ----------------------------------------
$venv = Join-Path $ProjectRoot ".venv\Scripts\Activate.ps1"
if (Test-Path $venv) {
    Info "Activating .venv..."
    & $venv
}
else {
    Warn ".venv not found — continuing without activation."
}

# ----------------------------------------
# 3. Stop / rebuild docker
# ----------------------------------------
Info "Stopping containers…"
docker-compose down

Info "Rebuilding & starting containers…"
docker-compose up -d --build

# ----------------------------------------
# 4. Wait for Postgres
# ----------------------------------------
$pgContainer = "eco_farm_postgres"
$elapsed = 0
$interval = 5

Info "Waiting for Postgres ($pgContainer) to be healthy…"

while ($true) {
    $status = docker inspect -f "{{.State.Health.Status}}" $pgContainer 2>$null

    if ($status -eq "healthy") {
        Info "Postgres is healthy."
        break
    }

    Start-Sleep -Seconds $interval
    $elapsed += $interval

    if ($elapsed -ge $PostgresTimeoutSec) {
        Err "Postgres did NOT become healthy within timeout."
        break
    }

    Info ("Still waiting... ({0} sec)" -f $elapsed)
}

# ----------------------------------------
# 5. Create DBs if missing
# ----------------------------------------
$pgUser = "farm"
$dbList = @("eco_farm", "farm")

foreach ($db in $dbList) {
    Info "Checking if database '$db' exists..."

    $checkCmd = "psql -U $pgUser -tAc 'SELECT 1 FROM pg_database WHERE datname=''$db'' '"
    $result = docker exec -i $pgContainer bash -c $checkCmd 2>$null

    if ($result.Trim() -eq "1") {
        Info "Database '$db' exists."
    }
    else {
        Info "Creating database '$db'..."
        $createCmd = "psql -U $pgUser -c 'CREATE DATABASE ""$db"" OWNER $pgUser;'"
        docker exec -i $pgContainer bash -c $createCmd
    }
}

# ----------------------------------------
# 6. Migrations / init_db fallback
# ----------------------------------------
$backendContainer = "it_hacks_backend"

$hasAlembic = docker exec -i $backendContainer bash -c "test -f /app/alembic.ini && echo yes || echo no"
$hasAlembic = $hasAlembic.Trim()

if ($hasAlembic -eq "yes") {
    Info "Running Alembic migrations..."
    docker exec -i $backendContainer bash -c "cd /app; alembic upgrade head"
}
else {
    Warn "alembic.ini not found — trying init_db() fallback"

    $cmd = "cd /app; python - << 'EOF'
from database import init_db
init_db()
print('ok')
EOF"

    $output = docker exec -i $backendContainer bash -c "$cmd"

    if ($output -match "ok") {
        Info "init_db() executed successfully."
    }
    else {
        Warn "init_db() not found or failed."
    }
}

# ----------------------------------------
# 7. Run deploy scripts
# ----------------------------------------
$deployScripts = @(
    "scripts\deploy_phase7_clean.ps1",
    "scripts\deploy_phase7.ps1",
    "scripts\deploy_phase8.ps1"
)

foreach ($s in $deployScripts) {
    $path = Join-Path $ProjectRoot $s
    if (Test-Path $path) {
        Info "Running deploy script: $s"
        try {
            & $path
            Info "Finished $s"
        }
        catch {
            Warn ("Error in script {0}: {1}" -f $s, $_)
        }
    }
    else {
        Info "Deploy script not found: $s (skipping)"
    }
}

# ----------------------------------------
# 8. Show containers
# ----------------------------------------
Info "Running containers:"
docker ps

# ----------------------------------------
# 9. Tail backend logs
# ----------------------------------------
Info "Tailing backend logs… (CTRL+C to exit)"
docker-compose logs -f backend
