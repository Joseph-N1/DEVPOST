# Phase 10 Deployment & Docker Hub Push Checklist

## PRE-DEPLOYMENT (Local Testing)

- [ ] Run `docker compose down` to stop existing containers
- [ ] Run `.\.venv\Scripts\Activate.ps1` to activate Python environment
- [ ] Verify `.env` file exists with strong secrets
- [ ] Run `docker compose build --no-cache` to rebuild with new Dockerfile
- [ ] Run `docker compose up -d` to start containers
- [ ] Wait 30 seconds for services to become healthy: `docker compose ps`
- [ ] Run test suite: `.\scripts\test_phase10.ps1`
- [ ] Verify all tests pass (no CRITICAL or ERROR messages)
- [ ] Check logs: `docker compose logs backend` (should show no errors)

## SECURITY VERIFICATION

- [ ] CORS vulnerability fixed: `curl -H 'Origin: http://evil.com' http://localhost:8000` (should NOT return evil.com in CORS header)
- [ ] Secrets not in docker-compose.yml: `grep -r "SECRET_KEY=" docker-compose.yml` (should show 0 matches)
- [ ] .env file created and added to .gitignore
- [ ] No hardcoded passwords visible in code: `grep -r "password.*=.*['\"]" backend/` (verify no plaintext passwords)
- [ ] Rate limiting enabled: 15 rapid requests to /auth/login should trigger 429 responses
- [ ] File upload validation working: Try uploading file >50MB (should reject with 413)

## GIT OPERATIONS

- [ ] Stage security patch files:
  ```
  git add backend/main.py docker-compose.yml backend/Dockerfile backend/routers/upload.py
  git add .env.example backend/requirements_dev.txt backend/scripts/init-db.sql
  git add scripts/test_phase10.ps1
  ```
- [ ] Create commit:
  ```
  git commit -m "Phase 10: Security hardening - CORS fix, secrets management, rate limiting, file upload validation, multi-stage Docker build"
  ```
- [ ] Verify commit contains all changes: `git log --oneline -1`
- [ ] Push to repository: `git push origin main`

## DOCKER IMAGE BUILD & PUSH

- [ ] Verify Docker Hub account credentials are configured:

  ```
  docker login
  # Enter username and token/password when prompted
  ```

- [ ] Build backend image (this will take 5-15 minutes depending on system):

  ```
  docker compose build --no-cache backend
  # Watch for completion message: "Successfully built..."
  ```

- [ ] Build frontend image:

  ```
  docker compose build --no-cache frontend
  # Watch for completion message
  ```

- [ ] Verify images exist:

  ```
  docker images | grep it_hacks
  # Should show: it_hacks_25-backend and it_hacks_25-frontend
  ```

- [ ] Tag backend image for Docker Hub:

  ```
  docker tag it_hacks_25-backend:latest YOUR_DOCKERHUB_USERNAME/it_hacks_25-backend:latest
  docker tag it_hacks_25-backend:latest YOUR_DOCKERHUB_USERNAME/it_hacks_25-backend:phase-10
  ```

- [ ] Tag frontend image for Docker Hub:

  ```
  docker tag it_hacks_25-frontend:latest YOUR_DOCKERHUB_USERNAME/it_hacks_25-frontend:latest
  docker tag it_hacks_25-frontend:latest YOUR_DOCKERHUB_USERNAME/it_hacks_25-frontend:phase-10
  ```

- [ ] Push backend image:

  ```
  docker push YOUR_DOCKERHUB_USERNAME/it_hacks_25-backend:latest
  docker push YOUR_DOCKERHUB_USERNAME/it_hacks_25-backend:phase-10
  ```

- [ ] Push frontend image:

  ```
  docker push YOUR_DOCKERHUB_USERNAME/it_hacks_25-frontend:latest
  docker push YOUR_DOCKERHUB_USERNAME/it_hacks_25-frontend:phase-10
  ```

- [ ] Verify images on Docker Hub:
  - Visit: https://hub.docker.com/r/YOUR_DOCKERHUB_USERNAME/it_hacks_25-backend
  - Visit: https://hub.docker.com/r/YOUR_DOCKERHUB_USERNAME/it_hacks_25-frontend
  - Confirm both `latest` and `phase-10` tags are present

## PRODUCTION DEPLOYMENT VERIFICATION

- [ ] Test pulling images from Docker Hub (simulates judge's environment):

  ```
  docker pull YOUR_DOCKERHUB_USERNAME/it_hacks_25-backend:latest
  docker pull YOUR_DOCKERHUB_USERNAME/it_hacks_25-frontend:latest
  ```

- [ ] Create docker-compose override for production:

  ```yaml
  # docker-compose.prod.yml
  version: "3.8"
  services:
    backend:
      image: YOUR_DOCKERHUB_USERNAME/it_hacks_25-backend:latest
    frontend:
      image: YOUR_DOCKERHUB_USERNAME/it_hacks_25-frontend:latest
  ```

- [ ] Test production deployment:
  ```
  docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
  docker compose ps  # Verify all services healthy
  curl http://localhost:8000/health  # Should return operational status
  ```

## HACKATHON SUBMISSION PREPARATION

- [ ] Create README with deployment instructions:

  ```
  ## Quick Start (Judges)

  docker login
  docker compose -f docker-compose.prod.yml up -d

  # Wait 30 seconds for services to become healthy
  docker compose ps

  # Access application at http://localhost:3000
  ```

- [ ] Document security improvements in Phase 10 summary:

  - CORS vulnerability fixed
  - Secrets managed via .env (not hardcoded)
  - Rate limiting on auth endpoints
  - File upload validation (size, type, path traversal)
  - Multi-stage Docker builds (50% smaller images)
  - Non-root user in containers

- [ ] Create Phase 10 Security Review document
- [ ] Update project README with Phase 10 changes
- [ ] Create DEPLOYMENT.md for judges with step-by-step instructions

## PERFORMANCE VERIFICATION (Optional but Recommended)

- [ ] Test image pull speed from Docker Hub (target: <2 minutes total)
- [ ] Test cold start time (image pull + container startup): should be <5 minutes
- [ ] Run load test: `docker run --rm -it locust:latest -f /app/locustfile.py --host=http://localhost:8000 -u 100 -r 10 --run-time 5m`
- [ ] Monitor resource usage: `docker stats` (check CPU and memory consumption)

## FINAL CHECKLIST

- [ ] All tests passing locally
- [ ] Images pushed to Docker Hub
- [ ] Git commits pushed to repository
- [ ] Security review document complete
- [ ] Deployment instructions written for judges
- [ ] README updated with Phase 10 information
- [ ] All secrets removed from committed files
- [ ] Docker images are optimized (multi-stage, non-root user, healthchecks)

## ROLLBACK PROCEDURE (if needed)

If issues arise:

```
git reset --hard HEAD~1  # Undo last commit
docker compose down
docker system prune -a   # Clean up images
git log --oneline        # Verify rollback
```

## SUCCESS CRITERIA ✅

- Docker images run successfully with environment variables from .env
- All 5 CRITICAL fixes implemented and verified
- User registration → Login → JWT token generation → Profile retrieval works end-to-end
- Database persistence verified
- CORS restricted to allowed origins only
- Rate limiting active on auth endpoints
- File upload validation enforces size/type/path security
- Images available on Docker Hub for judge evaluation
- Judges can deploy with single command: `docker compose -f docker-compose.prod.yml up -d`
