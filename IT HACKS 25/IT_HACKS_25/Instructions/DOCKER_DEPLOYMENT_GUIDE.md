# Docker Deployment & Load Testing Guide

## Complete Setup for Production Deployment

**Last Updated**: 2025-12-07  
**Status**: Production Ready  
**Phase**: 12 Complete + Docker Containerization

---

## TABLE OF CONTENTS

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Docker Architecture](#docker-architecture)
4. [Environment Setup](#environment-setup)
5. [Deploying with Docker](#deploying-with-docker)
6. [Load Testing](#load-testing)
7. [Monitoring & Health Checks](#monitoring--health-checks)
8. [Troubleshooting](#troubleshooting)

---

## QUICK START

### One-Command Deployment

```bash
# Navigate to project root
cd "c:\Users\Joseph N Nimyel\OneDrive\Documents\DEVPOST\IT HACKS 25\IT_HACKS_25"

# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Verify services are running
docker-compose ps

# Stop all services
docker-compose down
```

### Services Available After Startup

```
Frontend:    http://localhost:3000
Backend API: http://localhost:8000
PostgreSQL:  localhost:5432
Redis:       localhost:6379
```

---

## PREREQUISITES

### Required Software

```
✅ Docker Desktop (latest)
   - Download: https://www.docker.com/products/docker-desktop
   - Windows 10+ recommended

✅ Docker Compose (included with Docker Desktop)
   - Verify: docker-compose --version

✅ Git (for version control)
   - Verify: git --version

✅ Optional but Recommended:
   - Postman (API testing)
   - DBeaver (Database management)
   - Visual Studio Code
```

### Minimum System Requirements

```
CPU:     2 cores minimum (4+ recommended)
RAM:     4GB minimum (8GB+ recommended)
Disk:    10GB free space minimum
OS:      Windows 10+ / macOS 11+ / Linux
```

### Verify Installation

```bash
# Check Docker
docker --version
# Expected: Docker version 24.0+

# Check Docker Compose
docker-compose --version
# Expected: Docker Compose version 2.0+

# Check Git
git --version
# Expected: git version 2.0+
```

---

## DOCKER ARCHITECTURE

### Service Structure

```
┌─────────────────────────────────────────────────────┐
│                 Docker Network: farmnet             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐  ┌──────────────┐               │
│  │  Frontend    │  │   Backend    │               │
│  │  (Next.js)   │  │   (FastAPI)  │               │
│  │ :3000        │  │   :8000      │               │
│  └──────┬───────┘  └──────┬───────┘               │
│         │                 │                       │
│         └────────┬────────┘                       │
│                  │                                │
│         ┌────────┴────────┐                       │
│         │                 │                       │
│    ┌────▼─────┐    ┌─────▼────┐                  │
│    │PostgreSQL│    │   Redis  │                  │
│    │ :5432    │    │  :6379   │                  │
│    └──────────┘    └──────────┘                  │
│                                                   │
└─────────────────────────────────────────────────────┘
```

### Service Dependencies

```
Frontend  → depends on → Backend
Backend   → depends on → PostgreSQL, Redis
PostgreSQL → independent (only data persistence)
Redis     → independent (only caching/sessions)
```

### Health Check Configuration

```
Backend:     Checks /health endpoint every 15 seconds
PostgreSQL:  Checks pg_isready every 10 seconds
Redis:       Checks PING every 10 seconds
Frontend:    Waits for Backend to be healthy
```

---

## ENVIRONMENT SETUP

### Create .env File

Create a file named `.env` in the project root with the following content:

```env
# PostgreSQL Configuration
POSTGRES_USER=farm
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=eco_farm

# Redis Configuration
REDIS_PASSWORD=your_redis_password_here
REDIS_URL=redis://:your_redis_password_here@redis:6379

# Backend Configuration
PYTHONUNBUFFERED=1
JWT_SECRET_KEY=your_jwt_secret_key_here
REFRESH_SECRET_KEY=your_refresh_secret_key_here

# API Configuration
DATABASE_URL=postgresql://farm:your_secure_password_here@postgres:5432/eco_farm
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://your-domain.com

# Feature Flags
RATE_LIMIT_ENABLED=true
MAX_UPLOAD_SIZE_MB=50
ANOMALY_DETECTION_ENABLED=true
FEATURE_IMPORTANCE_TRACKING=true

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_INTERNAL_API_URL=http://backend:8000

# Logging
LOG_LEVEL=INFO
DEBUG=false
```

### Security Best Practices

```
❌ NEVER commit .env to git
❌ NEVER use default passwords in production
❌ NEVER expose JWT_SECRET_KEY

✅ Generate strong passwords:
   - Use: openssl rand -hex 32

✅ Store secrets in:
   - Environment variables
   - Secret management service
   - CI/CD pipeline secrets

✅ Change default credentials:
   - POSTGRES_PASSWORD
   - REDIS_PASSWORD
   - JWT_SECRET_KEY
```

---

## DEPLOYING WITH DOCKER

### Step 1: Prepare Environment

```bash
# Navigate to project directory
cd "c:\Users\Joseph N Nimyel\OneDrive\Documents\DEVPOST\IT HACKS 25\IT_HACKS_25"

# Create .env file (see above)
# Edit credentials to your preferences
```

### Step 2: Build Docker Images

```bash
# Build all images (first time only)
docker-compose build

# Expected output:
# Building postgres... DONE
# Building redis... DONE
# Building backend... DONE
# Building frontend... DONE
```

### Step 3: Start Services

```bash
# Start all services in detached mode
docker-compose up -d

# Monitor startup (watch for healthy status)
docker-compose ps

# Expected output:
# NAME                  STATUS
# eco_farm_postgres     Up (healthy)
# eco_farm_redis        Up (healthy)
# it_hacks_backend      Up (healthy)
# it_hacks_frontend     Up (healthy)
```

### Step 4: Verify Deployment

```bash
# Check backend health
curl http://localhost:8000/health

# Check frontend
open http://localhost:3000

# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Step 5: Database Initialization

```bash
# Run migrations (if any)
docker-compose exec backend alembic upgrade head

# Seed sample data
docker-compose exec backend python data/generate_multi_farm.py

# Check database connection
docker-compose exec postgres psql -U farm -d eco_farm -c "SELECT version();"
```

---

## LOAD TESTING

### What is Load Testing?

Load testing simulates multiple users accessing your application simultaneously to:

- Identify performance bottlenecks
- Measure response times under load
- Find maximum concurrent user capacity
- Detect memory leaks
- Validate auto-scaling behavior

### Load Testing Setup

#### Option 1: Using Locust (Recommended - Python-based)

**Install Locust**:

```bash
pip install locust
```

**Create Load Test Script** (`scripts/locustfile.py`):

```python
from locust import HttpUser, task, between
import random

class EcoFarmUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        """Called when a user starts"""
        self.token = self.login()

    def login(self):
        """Login and get JWT token"""
        response = self.client.post("/auth/login", json={
            "username": "testuser",
            "password": "testpass"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        return None

    @task(2)
    def get_monitoring_dashboard(self):
        """Get current metrics (2x frequency)"""
        headers = {"Authorization": f"Bearer {self.token}"}
        self.client.get("/monitor/current", headers=headers)

    @task(1)
    def get_anomalies(self):
        """Get anomalies (1x frequency)"""
        headers = {"Authorization": f"Bearer {self.token}"}
        self.client.get("/monitor/anomalies", headers=headers)

    @task(1)
    def get_feature_importance(self):
        """Get feature importance"""
        headers = {"Authorization": f"Bearer {self.token}"}
        self.client.get("/monitor/feature-importance", headers=headers)

    @task(1)
    def get_analytics(self):
        """Get analytics data"""
        headers = {"Authorization": f"Bearer {self.token}"}
        room_id = random.randint(1, 5)
        self.client.get(f"/monitor/trends?room_id={room_id}", headers=headers)
```

**Run Load Test**:

```bash
# Navigate to project root
cd "c:\Users\Joseph N Nimyel\OneDrive\Documents\DEVPOST\IT HACKS 25\IT_HACKS_25"

# Start load test with GUI
locust -f scripts/locustfile.py --host=http://localhost:8000

# Open browser and navigate to:
# http://localhost:8089

# Configure:
# - Number of users: 10-100 (adjust for testing)
# - Spawn rate: 5-10 users/second
# - Host: http://localhost:8000
```

#### Option 2: Using Apache JMeter

**Install JMeter**:

```bash
# Windows
choco install jmeter

# macOS
brew install jmeter

# Linux
sudo apt-get install jmeter
```

**Run JMeter**:

```bash
jmeter -t scripts/load_test_plan.jmx -l results.jtl -j jmeter.log
```

#### Option 3: Using wrk (Simple HTTP Benchmarking)

**Install wrk**:

```bash
# Windows - use scoop or manual download
scoop install wrk

# macOS
brew install wrk

# Linux
git clone https://github.com/wg/wrk.git
cd wrk && make
```

**Run Benchmark**:

```bash
# Test single endpoint
wrk -t4 -c100 -d30s http://localhost:8000/health

# Test with custom script
wrk -t4 -c100 -d30s -s scripts/wrk_script.lua http://localhost:8000
```

---

### Load Testing Scenarios

#### Scenario 1: Light Load

```
Users:           10
Duration:        5 minutes
Expected Result: <100ms response time
Success Rate:    >99%
```

#### Scenario 2: Medium Load

```
Users:           50
Duration:        10 minutes
Expected Result: <300ms response time
Success Rate:    >95%
```

#### Scenario 3: Heavy Load

```
Users:           100+
Duration:        15 minutes
Expected Result: <1000ms response time
Success Rate:    >90%
```

#### Scenario 4: Stress Test

```
Users:           Ramp up to failure
Duration:        Until stability drops
Expected Result: Identify breaking point
Success Rate:    Acceptable degradation
```

---

### Interpreting Load Test Results

#### Key Metrics

```
Response Time (ms)
  - Min:     Fastest response
  - Max:     Slowest response
  - Mean:    Average response time
  - P95:     95th percentile (95% of requests faster than this)
  - P99:     99th percentile (99% of requests faster than this)

Throughput (requests/second)
  - Good:    >100 RPS
  - Target:  >500 RPS
  - Excellent: >1000 RPS

Error Rate
  - Acceptable:  0-1%
  - Poor:        1-5%
  - Unacceptable: >5%

Success Rate
  - Excellent:   99%+
  - Good:        95%+
  - Poor:        <95%
```

#### Performance Benchmarks (Expected)

```
GET /monitor/current
  - Response Time: 150-250ms
  - Throughput: 400+ RPS
  - Error Rate: <0.5%

GET /monitor/anomalies
  - Response Time: 200-400ms
  - Throughput: 250+ RPS
  - Error Rate: <0.5%

GET /monitor/feature-importance
  - Response Time: 120-250ms
  - Throughput: 400+ RPS
  - Error Rate: <0.5%

POST /monitor/reports/generate
  - Response Time: 600-1200ms
  - Throughput: 50+ RPS
  - Error Rate: <1%
```

---

## MONITORING & HEALTH CHECKS

### Docker Health Status

```bash
# Check all services
docker-compose ps

# Watch real-time status
docker-compose ps --no-trunc

# Get detailed health info
docker inspect eco_farm_postgres --format='{{json .State.Health}}'
```

### Log Monitoring

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last N lines
docker-compose logs --tail=50 backend

# Real-time with timestamps
docker-compose logs -f --timestamps backend
```

### Performance Monitoring

```bash
# Monitor container resource usage
docker stats

# Specific container
docker stats it_hacks_backend

# Watch CPU and Memory
docker stats --no-stream
```

### Database Health

```bash
# Connect to database
docker-compose exec postgres psql -U farm -d eco_farm

# Check tables
\dt

# Check table sizes
SELECT table_name,
       pg_size_pretty(pg_total_relation_size(table_name))
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(table_name) DESC;

# Check slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC;
```

### API Health Endpoints

```bash
# Backend health
curl http://localhost:8000/health

# Expected response:
# {"status": "healthy", "uptime": 1234.56}

# Database health
curl http://localhost:8000/health/db

# Expected response:
# {"status": "ok", "database": "postgresql"}

# Redis health
curl http://localhost:8000/health/redis

# Expected response:
# {"status": "ok", "redis": "connected"}
```

---

## TROUBLESHOOTING

### Issue: Services won't start

**Error**: `docker-compose up` fails

```bash
# Solution 1: Check if ports are in use
netstat -ano | findstr :3000
netstat -ano | findstr :8000
netstat -ano | findstr :5432

# Solution 2: Free up ports
# Kill process on port 3000
taskkill /PID <PID> /F

# Solution 3: Use different ports in docker-compose.yml
# Change "3000:3000" to "3001:3000"
```

### Issue: Database connection fails

**Error**: `FATAL: password authentication failed`

```bash
# Solution 1: Check .env file
cat .env | grep POSTGRES_PASSWORD

# Solution 2: Ensure credentials match
# In .env:   POSTGRES_PASSWORD=mypass
# In docker-compose: uses ${POSTGRES_PASSWORD:-changeme}

# Solution 3: Rebuild with fresh database
docker-compose down -v
docker-compose up -d
```

### Issue: Frontend can't reach backend

**Error**: `CORS error` or `Failed to fetch`

```bash
# Solution 1: Check CORS_ORIGINS in .env
# Should include http://localhost:3000

# Solution 2: Check backend is running
docker-compose logs backend | grep "listening"

# Solution 3: Verify network connection
docker-compose exec frontend curl http://backend:8000/health
```

### Issue: High memory usage

**Error**: `Docker using >80% RAM`

```bash
# Solution 1: Check which container is using memory
docker stats

# Solution 2: Check for memory leaks
docker-compose logs backend | grep -i "memory"

# Solution 3: Restart container
docker-compose restart backend

# Solution 4: Increase Docker memory limit
# Docker Desktop → Preferences → Resources → Memory
```

### Issue: Slow API responses

**Error**: `Response time >1000ms`

```bash
# Solution 1: Check database performance
docker-compose exec postgres psql -U farm -d eco_farm
SELECT * FROM pg_stat_statements ORDER BY mean_time DESC;

# Solution 2: Check for slow queries
docker-compose logs backend | grep "query took"

# Solution 3: Restart services
docker-compose restart

# Solution 4: Monitor resource usage
docker stats
```

### Complete Reset

```bash
# Remove all containers and volumes
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Clean up Docker system
docker system prune -a

# Rebuild and restart
docker-compose build --no-cache
docker-compose up -d
```

---

## PRODUCTION DEPLOYMENT CHECKLIST

```
✅ Environment Variables
   - [ ] Changed all default passwords
   - [ ] Generated strong JWT secrets
   - [ ] Set CORS_ORIGINS to production domain
   - [ ] Enabled RATE_LIMIT_ENABLED
   - [ ] Set DEBUG=false

✅ Database
   - [ ] Backups configured
   - [ ] Migrations run successfully
   - [ ] Sample data loaded
   - [ ] Indexes created
   - [ ] Slow query log enabled

✅ Security
   - [ ] HTTPS enabled (reverse proxy)
   - [ ] SSL certificates configured
   - [ ] JWT tokens validated
   - [ ] Rate limiting enabled
   - [ ] CORS properly configured

✅ Performance
   - [ ] Load testing completed
   - [ ] Response times acceptable
   - [ ] Error rate <1%
   - [ ] Cache configured
   - [ ] Auto-scaling ready

✅ Monitoring
   - [ ] Health checks working
   - [ ] Logs centralized
   - [ ] Alerts configured
   - [ ] Metrics collected
   - [ ] Backup strategy tested

✅ Documentation
   - [ ] Deployment guide completed
   - [ ] Runbook created
   - [ ] Troubleshooting guide written
   - [ ] Team trained
   - [ ] Escalation procedures documented
```

---

## USEFUL DOCKER COMMANDS

### Container Management

```bash
# List running containers
docker ps

# List all containers
docker ps -a

# View container logs
docker logs <container_id>

# Execute command in container
docker exec -it <container_id> bash

# Stop container
docker stop <container_id>

# Start container
docker start <container_id>

# Remove container
docker rm <container_id>

# View container stats
docker stats <container_id>
```

### Docker Compose Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View status
docker-compose ps

# View logs
docker-compose logs -f

# Execute command
docker-compose exec backend bash

# Rebuild images
docker-compose build

# Clean up everything
docker-compose down -v
```

### Image Management

```bash
# List images
docker images

# Remove image
docker rmi <image_id>

# Tag image
docker tag <image_id> myregistry/myimage:latest

# Push to registry
docker push myregistry/myimage:latest

# Pull from registry
docker pull myregistry/myimage:latest
```

---

## RESOURCES

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Guide](https://docs.docker.com/compose/)
- [Locust Load Testing](https://locust.io/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Redis Docker Image](https://hub.docker.com/_/redis)

---

_Last Updated: 2025-12-07_  
_Version: 1.0_  
_Status: Production Ready_
