# ECO FARM Phase 10 - Quick Test Commands for Judges

## 🚀 Quick Start (30 seconds)

```bash
# Pull and run the application
docker login
docker compose -f docker-compose.yml up -d

# Wait for services to be healthy
docker compose ps

# Verify all services healthy (should show all "healthy" or "running")
```

## ✅ Test 1: CORS Security (CRITICAL FIX #2)

```bash
# This should NOT include "evil.com" in response headers
# If no CORS headers appear, CORS is properly restricted ✅
curl -v -H 'Origin: http://evil.com' http://localhost:8000
```

## ✅ Test 2: User Registration (CRITICAL FIX #1)

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "judge@ecocrop.com",
    "username": "judge_user",
    "password": "SecurePass123!",
    "first_name": "Judge",
    "last_name": "Reviewer"
  }'

# Expected response: JWT token in response body
# Example: {"access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...", ...}
```

## ✅ Test 3: User Login (CRITICAL FIX #1)

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "judge@ecocrop.com",
    "password": "SecurePass123!"
  }'

# Expected response: JWT access token
# Save the token for next tests:
# TOKEN="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

## ✅ Test 4: Database Persistence (CRITICAL FIX #4)

```bash
# Check how many users are in the database
docker compose exec postgres psql -U farm -d eco_farm -c "SELECT COUNT(*) FROM users;"

# Expected: Should show count > 0 after registration
```

## ✅ Test 5: JWT Token Validation

```bash
# Use the token from Test 3
TOKEN="your-token-here"

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/auth/me

# Expected response: User profile with email and username
```

## ✅ Test 6: Rate Limiting (CRITICAL FIX #3)

```bash
# Send 15 rapid login attempts
# Requests 11-15 should return HTTP 429 (Too Many Requests)
for i in {1..15}; do
  echo "Request $i:"
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  sleep 0.1
done

# Expected pattern: 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 429, 429, 429, 429, 429
```

## ✅ Test 7: File Upload Size Validation (HIGH FIX #1)

```bash
# Create a 51MB test file
dd if=/dev/zero bs=1M count=51 of=test_large_file.csv

# Try to upload (should be rejected with 413 - Payload Too Large)
TOKEN="your-token-here"
curl -s -w "\nStatus: %{http_code}\n" \
  -F "file=@test_large_file.csv" \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/upload/csv

# Expected: HTTP 413 Payload Too Large

# Cleanup
rm test_large_file.csv
```

## ✅ Test 8: File Upload Type Validation (HIGH FIX #1)

```bash
# Create a fake executable file
echo "fake executable" > malware.exe

# Try to upload (should be rejected with 400 - Invalid extension)
TOKEN="your-token-here"
curl -s -w "\nStatus: %{http_code}\n" \
  -F "file=@malware.exe" \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/upload/csv

# Expected: HTTP 400 with message about invalid file extension

# Cleanup
rm malware.exe
```

## ✅ Test 9: API Documentation

```bash
# Visit Swagger UI to explore all endpoints
http://localhost:8000/docs

# ReDoc alternative documentation
http://localhost:8000/redoc
```

## ✅ Test 10: Health Check

```bash
curl http://localhost:8000/health

# Expected response:
# {"status": "operational", "security": "hardened", ...}
```

## ✅ Test 11: RBAC - Permission Denied

```bash
# Try to access admin endpoint without admin role
TOKEN="your-token-here"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/audit/logs

# Expected: HTTP 403 Forbidden (insufficient permissions)
```

## 📋 Automated Test Suite (PowerShell)

```powershell
# Run comprehensive test suite
./scripts/test_phase10.ps1

# This will test all critical fixes and report results
```

## 🐳 Docker Verification

```bash
# Check all containers are healthy
docker compose ps

# View logs for any service
docker compose logs backend
docker compose logs postgres
docker compose logs redis
docker compose logs frontend

# Check image sizes
docker images | grep it_hacks

# Expected: Backend image should be ~1-2GB (optimized multi-stage build)
```

## 🔐 Security Verification

```bash
# Verify secrets are NOT in docker-compose.yml
grep "JWT_SECRET_KEY=" docker-compose.yml
# Expected: Show only variable references like ${JWT_SECRET_KEY}, not actual values

# Verify .env is in .gitignore
grep ".env" .gitignore
# Expected: Should show ".env" is ignored

# Verify no dangerous code patterns
grep -r "eval\|exec\|pickle\|__import__\|os.system" backend/
# Expected: 0 matches (no dangerous patterns)
```

## 📊 Performance Check

```bash
# Check container resource usage
docker stats

# All containers should use <500MB memory
# CPU usage should be low when idle
```

## 🧪 Cleanup (After Testing)

```bash
# Stop all containers
docker compose down

# Remove test files (if any)
rm -f test_*.csv malware.exe

# Clean up Docker system (optional)
docker system prune -a
```

---

## 📝 Expected Test Results

### All Tests Should Pass ✅

| Test              | Expected Result                        |
| ----------------- | -------------------------------------- |
| CORS              | No "evil.com" in response headers      |
| Registration      | HTTP 200 with JWT token                |
| Login             | HTTP 200 with JWT token                |
| DB Persistence    | User count > 0                         |
| Token Validation  | HTTP 200 with user profile             |
| Rate Limiting     | HTTP 429 after 10 attempts in 1 minute |
| Large File Upload | HTTP 413 Payload Too Large             |
| Invalid File Type | HTTP 400 Invalid Extension             |
| API Docs          | HTTP 200 with Swagger UI               |
| Health Check      | HTTP 200 with operational status       |
| RBAC Denied       | HTTP 403 Forbidden                     |

---

## 🆘 Troubleshooting

### Containers not starting?

```bash
# Check logs for errors
docker compose logs

# Rebuild images
docker compose build --no-cache

# Restart with clean slate
docker compose down -v
docker compose up -d
```

### Port already in use?

```bash
# Find what's using the port (example: 8000)
netstat -ano | findstr :8000  # Windows
lsof -i :8000                   # Mac/Linux

# Either stop the service or use different port in docker-compose.yml
```

### Tests failing?

```bash
# Enable debug logging
docker compose logs backend --tail=100

# Check if services are healthy
docker compose ps

# Manually test database connection
docker compose exec postgres psql -U farm -d eco_farm -c "SELECT 1"
```

---

## 📞 Support

For more details, see:

- `.security-review` - Full security audit report
- `PHASE_10_DEPLOYMENT_CHECKLIST.md` - Complete deployment guide
- `backend/main.py` - CORS and rate limiting implementation
- `backend/routers/upload.py` - File upload validation
- `docker-compose.yml` - Service configuration

---

**Phase 10: Security Hardening Complete ✅**
