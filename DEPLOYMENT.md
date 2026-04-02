# 🚀 Deployment Guide

Complete guide for deploying Discipline Tracker to Vercel production environment.

## 📋 Pre-Deployment Checklist

- [ ] All code committed to GitHub
- [ ] Database created on Neon
- [ ] Environment variables prepared
- [ ] Vercel account ready

## 🗄️ Database Setup (Neon)

### Step 1: Create Neon Project
1. Go to [Neon Console](https://console.neon.tech)
2. Click **New Project**
3. Name: `discipline-tracker`
4. Region: Choose closest to your users (e.g., US East)
5. Click **Create Project**

### Step 2: Get Connection String
1. In Neon dashboard, click **Connection Details**
2. Copy the **Connection String**
3. Format:
```
postgresql://username:password@hostname/dbname?sslmode=require
```

### Step 3: Run Migrations
```bash
cd backend
npm run db:push
```

## 🔧 Backend Deployment

### Step 1: Import to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New Project**
3. Import from GitHub: `devraman07/discipline_Tracker`
4. Click **Import**

### Step 2: Configure Project
- **Project Name:** `discipline-tracker-api`
- **Framework Preset:** `Other`
- **Root Directory:** `backend`
- **Build Command:** (leave empty for serverless)
- **Output Directory:** (leave empty)

### Step 3: Environment Variables
Add these in Vercel dashboard:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `your_neon_connection_string` |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` |
| `LOG_LEVEL` | `info` |
| `LOGTAIL_SOURCE_TOKEN` | `your_logtail_token` (optional) |

### Step 4: Deploy
Click **Deploy**

### Step 5: Verify Backend
After deployment, test health endpoint:
```
https://discipline-tracker-api.vercel.app/health
```

Expected response:
```json
{
  "success": true,
  "message": "Discipline Tracker API is running",
  "environment": "production"
}
```

## 🎨 Frontend Deployment

### Step 1: Create New Project
1. In Vercel dashboard, click **Add New Project**
2. Import same repository
3. Click **Import**

### Step 2: Configure Project
- **Project Name:** `discipline-tracker`
- **Framework Preset:** `Vite`
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### Step 3: Environment Variables
Add:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://discipline-tracker-api.vercel.app/api` |

### Step 4: Deploy
Click **Deploy**

### Step 5: Update Backend CORS
1. Go to backend project settings in Vercel
2. Update `FRONTEND_URL` with your deployed frontend URL
3. Redeploy backend

## 🔍 Post-Deployment Testing

### Test Check-in Flow
1. Open frontend URL
2. Navigate to Check-in page
3. Fill daily log
4. Submit
5. Verify success message
6. Check Dashboard shows updated score

### Test Analytics
1. Go to Analytics page
2. Verify charts load
3. Check all KPIs display correctly

### Test Streak
1. Complete check-in
2. Verify streak increments
3. Check streak display in TopBar

## 📊 Logtail Setup (Optional)

### Step 1: Create Account
1. Go to [Better Stack](https://betterstack.com)
2. Sign up for free account
3. Navigate to **Logtail**

### Step 2: Create Source
1. Click **Connect Source**
2. Select **Node.js**
3. Name: `discipline-tracker-api`
4. Copy the **Source Token**

### Step 3: Add to Vercel
Add environment variable:
- `LOGTAIL_SOURCE_TOKEN` = `your_copied_token`

### Step 4: View Logs
1. Redeploy backend
2. Logs will appear in Logtail dashboard
3. Set up alerts for errors

## 🔄 Continuous Deployment

Vercel automatically deploys on every push to main branch.

### Preview Deployments
Every Pull Request gets a preview URL for testing.

### Production Deployment
Merges to `main` branch automatically deploy to production.

## 🛠️ Troubleshooting

### CORS Errors
If frontend can't connect to backend:
1. Check `FRONTEND_URL` in backend env
2. Ensure URL matches exactly (no trailing slash)
3. Redeploy backend after changing

### Database Connection Failed
If backend shows DB errors:
1. Verify `DATABASE_URL` is correct
2. Check Neon project is active
3. Ensure IP allowlist includes Vercel IPs (or set to all)

### Build Failures
If deployment fails:
1. Check build logs in Vercel dashboard
2. Ensure all dependencies in package.json
3. Verify TypeScript compiles locally: `npm run build`

### 404 Errors
If API routes return 404:
1. Check `vercel.json` routes configuration
2. Ensure `/api` prefix is used
3. Verify function is exported correctly

## 📈 Scaling

### Database
- Neon scales automatically
- Monitor usage in Neon dashboard
- Upgrade plan if needed

### API
- Vercel functions auto-scale
- Monitor function duration
- Optimize slow queries if needed

## 📝 Domain Configuration (Optional)

### Custom Domain
1. In Vercel project settings
2. Navigate to **Domains**
3. Add your custom domain
4. Follow DNS configuration steps

### API Subdomain
For cleaner URLs:
- Frontend: `app.yourdomain.com`
- Backend: `api.yourdomain.com`

## ✅ Final Verification Checklist

- [ ] Frontend loads without errors
- [ ] Backend health endpoint works
- [ ] Check-in submission works
- [ ] Analytics page shows data
- [ ] Streak updates correctly
- [ ] CORS errors none in console
- [ ] Logs appearing in Vercel dashboard
- [ ] Mobile responsive works

---

## 🎉 Success!

Your Discipline Tracker is now live on production!

**Next Steps:**
- Share with friends
- Track your progress
- Build consistency
- Dominate your goals

**Support:**
If issues arise, check:
1. Vercel function logs
2. Neon database status
3. Browser console for errors
4. Network tab for failed requests
