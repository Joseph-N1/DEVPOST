# IT HACKS 25 - Docker Quick Start Guide

## Get Up and Running in 5 Minutes

**Last Updated**: 2025-12-07  
**Status**: Production Ready  
**Time to Deploy**: ~5 minutes

---

## ⚡ QUICK START (5 Minutes)

### Step 1: Automated Setup (Recommended)

```powershell
# Navigate to project directory
cd "c:\Users\Joseph N Nimyel\OneDrive\Documents\DEVPOST\IT HACKS 25\IT_HACKS_25"

# Run automated setup
.\scripts\setup.ps1

# This will:
# ✓ Check Docker installation
# ✓ Create .env file
# ✓ Build Docker images
# ✓ Start all services
# ✓ Initialize database
# ✓ Verify health
```

### Step 2: Verify Deployment

```powershell
# Check service status
.\scripts\docker_manage.ps1 -Command status

# Expected output:
# NAME                  STATUS
# eco_farm_postgres     Up (healthy)
# eco_farm_redis        Up (healthy)
# it_hacks_backend      Up (healthy)
# it_hacks_frontend     Up (healthy)
```

### Step 3: Access the Application

```
Frontend:   http://localhost:3000
Backend:    http://localhost:8000
API Docs:   http://localhost:8000/docs
```

---

## 📋 MANUAL SETUP (If Preferred)

### Prerequisites Check

```powershell
# Verify Docker is installed
docker --version
# Expected: Docker version 24.0+

# Verify Docker Compose
docker-compose --version
# Expected: Docker Compose version 2.0+

# Verify Git
git --version
# Expected: git version 2.0+
```

### Setup Steps

```powershell
# 1. Navigate to project
cd "c:\Users\Joseph N Nimyel\OneDrive\Documents\DEVPOST\IT HACKS 25\IT_HACKS_25"

# 2. Create .env file (copy from template)
Copy-Item "template.env" ".env"

# 3. Build images
docker-compose build

# 4. Start services
docker-compose up -d

# 5. Wait for healthy status (~30 seconds)
docker-compose ps

# 6. Initialize database
docker-compose exec backend alembic upgrade head
docker-compose exec backend python data/generate_multi_farm.py

# 7. Verify health
.\scripts\docker_manage.ps1 -Command health
```

---

## 🚀 USEFUL COMMANDS

### Service Management

```powershell
# Start services
.\scripts\docker_manage.ps1 -Command up

# Stop services
.\scripts\docker_manage.ps1 -Command down

# Restart services
.\scripts\docker_manage.ps1 -Command restart

# View logs
.\scripts\docker_manage.ps1 -Command logs

# Check status
.\scripts\docker_manage.ps1 -Command status
```

### Health & Monitoring

```powershell
# Check all services
.\scripts\docker_manage.ps1 -Command health

# View backend logs
.\scripts\docker_manage.ps1 -Command logs -Service backend

# View frontend logs
.\scripts\docker_manage.ps1 -Command logs -Service frontend

# Open database shell
.\scripts\docker_manage.ps1 -Command db-shell
```

### Load Testing

```powershell
# Interactive load test (GUI)
.\scripts\docker_manage.ps1 -Command load-test-gui

# Headless load test (50 users, 10 minutes)
.\scripts\docker_manage.ps1 -Command load-test -Users 50 -Duration 600

# Benchmark test (wrk)
.\scripts\docker_manage.ps1 -Command wrk-test
```

### Cleanup

```powershell
# Remove containers and volumes (keep images)
.\scripts\docker_manage.ps1 -Command clean

# Full cleanup (remove everything)
.\scripts\docker_manage.ps1 -Command clean-all
```

---

## 🔗 ACCESS POINTS

After deployment, access:

| Service            | URL                          | Purpose              |
| ------------------ | ---------------------------- | -------------------- |
| Frontend           | http://localhost:3000        | Main application     |
| Backend API        | http://localhost:8000        | RESTful API          |
| API Docs (Swagger) | http://localhost:8000/docs   | Interactive API docs |
| API Docs (ReDoc)   | http://localhost:8000/redoc  | Alternative API docs |
| Health Check       | http://localhost:8000/health | System health        |
| PostgreSQL         | localhost:5432               | Database             |
| Redis              | localhost:6379               | Cache store          |

---

## 📊 LOAD TESTING

### Start Interactive Load Test

```powershell
.\scripts\docker_manage.ps1 -Command load-test-gui

# Opens http://localhost:8089
# Configure and run tests in GUI
```

### Run Automated Load Test

```powershell
# 50 users, 5 minutes
.\scripts\docker_manage.ps1 -Command load-test -Users 50 -Duration 300

# Results saved to: load_test_results.csv
```

### Benchmark Performance

```powershell
.\scripts\docker_manage.ps1 -Command wrk-test

# Tests multiple endpoints:
# - /health
# - /monitor/current
# - /monitor/feature-importance
```

---

## ✅ VERIFICATION CHECKLIST

After startup, verify:

```
✓ All services running (docker-compose ps shows "healthy")
✓ Backend responsive (http://localhost:8000/health returns 200)
✓ Frontend accessible (http://localhost:3000 loads)
✓ Database connected (can see tables in db-shell)
✓ API endpoints working (can access /docs)
✓ No errors in logs (docker-compose logs shows clean startup)
```

---

## 🐛 TROUBLESHOOTING

### Port Already in Use

```powershell
# Find process using port 3000
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess
taskkill /PID <PID> /F

# Or edit docker-compose.yml to use different port (e.g., 3001:3000)
```

### Docker Service Won't Start

```powershell
# Check Docker daemon
docker ps

# Restart Docker (Windows)
Restart-Service Docker

# Check logs
docker logs it_hacks_backend
```

### Database Connection Failed

```powershell
# Check database is running
docker-compose ps postgres

# Verify credentials in .env
cat .env | Select-String POSTGRES

# Test connection
docker-compose exec postgres psql -U farm -d eco_farm -c "SELECT 1;"
```

### Frontend Can't Reach Backend

```powershell
# Check backend is running
docker-compose ps backend

# Test from frontend container
docker-compose exec frontend curl http://backend:8000/health

# Verify CORS settings in .env
cat .env | Select-String CORS
```

---

## 🔐 SECURITY NOTES

- ✅ Default credentials in `.env` are for development only
- ✅ Change `POSTGRES_PASSWORD` and `JWT_SECRET_KEY` for production
- ✅ Never commit `.env` to version control
- ✅ Use strong, random passwords (generate with: `openssl rand -hex 32`)
- ✅ Enable HTTPS in production (use reverse proxy like nginx)

---

## 📚 NEXT STEPS

1. **Explore the Application**

   - Navigate to http://localhost:3000
   - Login with test credentials
   - Try different features

2. **Run Tests**

   - Unit tests: `pytest backend/tests/ -v`
   - Load tests: `.\scripts\docker_manage.ps1 -Command load-test-gui`

3. **Review Documentation**

   - API Docs: http://localhost:8000/docs
   - Phase 12: Instructions/PHASE_12_FINAL_SUMMARY.md
   - Deployment: Instructions/DOCKER_DEPLOYMENT_GUIDE.md

4. **Monitor Performance**
   - Check health: `.\scripts\docker_manage.ps1 -Command health`
   - View logs: `.\scripts\docker_manage.ps1 -Command logs`
   - Run benchmarks: `.\scripts\docker_manage.ps1 -Command wrk-test`

---

## 🎯 KEY FEATURES

Once running, you have access to:

- ✅ **Real-time Monitoring**: Live metrics dashboard
- ✅ **Anomaly Detection**: 5 detection algorithms with ensemble scoring
- ✅ **Advanced Analytics**: Trends, patterns, and forecasting
- ✅ **Feature Importance**: Visualization and trend tracking
- ✅ **API Endpoints**: 18 endpoints with RBAC and <800ms response times
- ✅ **Load Testing**: Built-in load testing with Locust
- ✅ **Database**: PostgreSQL with automatic migrations
- ✅ **Caching**: Redis for performance optimization

---

## 💾 DATABASE

### Default Credentials

```
User:     farm
Password: (see .env file)
Database: eco_farm
```

### Access Database

```powershell
# Open PostgreSQL shell
.\scripts\docker_manage.ps1 -Command db-shell

# Common commands:
# \dt                    - List all tables
# \d table_name          - Describe table
# SELECT * FROM users;   - Query data
# \q                     - Exit
```

---

## 📈 PERFORMANCE TARGETS

After successful deployment, you should see:

| Metric             | Target | Expected    |
| ------------------ | ------ | ----------- |
| Backend Response   | <500ms | 150-250ms ✓ |
| Dashboard Load     | <3s    | 2-2.5s ✓    |
| Anomaly Detection  | <800ms | 200-400ms ✓ |
| Feature Importance | <700ms | 120-250ms ✓ |
| Success Rate       | >95%   | 99%+ ✓      |

---

## 🆘 GET HELP

If you encounter issues:

1. **Check Documentation**

   - Instructions/DOCKER_DEPLOYMENT_GUIDE.md
   - Instructions/DOCKER_RESTART_GUIDE.md

2. **View Logs**

   - `docker-compose logs -f`
   - `.\scripts\docker_manage.ps1 -Command logs -Service backend`

3. **Reset System**

   - `.\scripts\docker_manage.ps1 -Command clean`
   - Then: `.\scripts\setup.ps1`

4. **Detailed Troubleshooting**
   - See "Troubleshooting" section in DOCKER_DEPLOYMENT_GUIDE.md

---

_Quick Start Version 1.0_  
_Last Updated: 2025-12-07_  
_Status: Production Ready_
