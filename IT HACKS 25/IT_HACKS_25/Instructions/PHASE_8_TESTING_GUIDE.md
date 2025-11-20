# Phase 8 Authentication - Quick Test Guide

## Step 1: Install Backend Dependencies & Run Migration

```powershell
# Install new Python packages
docker exec it_hacks_backend pip install -r requirements.txt

# Run database migration to create auth tables
docker exec it_hacks_backend alembic upgrade head

# Restart backend to reload code
docker restart it_hacks_backend
```

## Step 2: Restart Frontend Container

```powershell
# Clear Next.js cache and restart
docker exec it_hacks_frontend rm -rf .next
docker restart it_hacks_frontend
```

Wait ~15-20 seconds for containers to fully restart.

## Step 3: Test User Registration

Open http://localhost:3000/register in your browser and create test users:

**Admin User:**
- Full Name: Admin User
- Email: admin@ecofarm.com
- Username: admin
- Password: Admin123!

**Manager User:**
- Full Name: Manager User
- Email: manager@ecofarm.com
- Username: manager
- Password: Manager123!

**Viewer User:**
- Full Name: Viewer User
- Email: viewer@ecofarm.com
- Username: viewer
- Password: Viewer123!

## Step 4: Test Login

1. Go to http://localhost:3000/login
2. Login with one of the users you created
3. You should be redirected to the dashboard
4. Check the navbar - you should see your profile avatar and name

## Step 5: Test Role-Based Access

**As Viewer:**
- ✅ Can access: Dashboard, Analytics
- ❌ Cannot access: Reports, Upload, Audit Logs

**As Manager:**
- ✅ Can access: Dashboard, Analytics, Reports, Upload
- ❌ Cannot access: Audit Logs

**As Admin:**
- ✅ Can access: Everything including Audit Logs

## Step 6: Test API Endpoints with Postman/curl

### Register New User
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Test123!",
    "full_name": "Test User"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ecofarm.com",
    "password": "Admin123!"
  }'
```

Save the `access_token` from the response.

### Get Current User Profile
```bash
curl -X GET http://localhost:8000/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### View Audit Logs (Admin Only)
```bash
curl -X GET http://localhost:8000/audit/logs \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Step 7: Test Frontend Features

### Profile Page
1. Login as any user
2. Click on your avatar in the navbar
3. Click "Profile"
4. Try updating your name or phone
5. Test the "Change Password" feature

### Logout
1. Click on your avatar
2. Click "Sign Out"
3. You should be redirected to login page

### Token Auto-Refresh
1. Login and wait 15+ minutes (access token expiry)
2. Navigate to any page
3. The app should automatically refresh your token
4. You should stay logged in

### Protected Routes
1. Logout completely
2. Try to access http://localhost:3000/dashboard
3. You should be redirected to login
4. After login, you'll be redirected back to dashboard

## Common Issues & Solutions

### Issue: "Module not found: Can't resolve '@/contexts/AuthContext'"
**Solution:** Restart the frontend container:
```powershell
docker restart it_hacks_frontend
```

### Issue: Backend auth endpoints return 404
**Solution:** Check if auth router is included in main.py and restart backend:
```powershell
docker restart it_hacks_backend
```

### Issue: Database tables don't exist
**Solution:** Run the migration:
```powershell
docker exec it_hacks_backend alembic upgrade head
```

### Issue: "Invalid token" errors
**Solution:** Clear localStorage and login again:
- Open browser DevTools (F12)
- Go to Application → Local Storage
- Clear all items
- Refresh page and login

## Verify Everything is Working

✅ Registration creates new users
✅ Login returns JWT tokens
✅ Protected pages redirect to login when not authenticated
✅ Navbar shows user info when logged in
✅ Profile page displays and can be updated
✅ Logout clears tokens and redirects
✅ Admin can access audit logs
✅ Manager can access upload page
✅ Viewer is restricted from upload/audit

## Next Steps

Once authentication is working:
1. Protect existing upload endpoints with `@require_role(UserRole.MANAGER)`
2. Protect ML training endpoints with `@require_role(UserRole.ADMIN)`
3. Add audit logging to critical operations
4. Test the complete user flow from registration to data upload

---

**Phase 8 Complete! 🎉**

You now have enterprise-grade authentication with JWT, RBAC, audit logging, and session management.
