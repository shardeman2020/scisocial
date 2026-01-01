# 🚀 SciSocial Deployment - START HERE

Welcome! This guide will get your SciSocial platform deployed to production in ~30 minutes.

## 📋 Prerequisites

Before you begin, make sure you have:

- [ ] All 6 domains owned and added to Cloudflare
- [ ] GitHub account (for Render deployment)
- [ ] Vercel account (free)
- [ ] Render account (free)
- [ ] Anthropic API key (for AI summaries)
- [ ] SendGrid API key or Gmail SMTP (for emails)

## 🎯 Quick Start (3 Steps)

### Step 1: Fix TypeScript Errors (5 minutes)

There's one small fix needed before deployment:

**File:** `frontend/app/onboarding/page.tsx`

Wrap `useSearchParams()` in Suspense:

```tsx
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function OnboardingContent() {
  const searchParams = useSearchParams()
  // ... rest of your component code
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div>Loading onboarding...</div>}>
      <OnboardingContent />
    </Suspense>
  )
}
```

**Verify the fix works:**
```bash
cd frontend
npm run build
# Should complete without errors
```

See `PRE_DEPLOYMENT_FIXES.md` for details.

### Step 2: Configure Environment Variables (10 minutes)

Follow `ENVIRONMENT_SETUP.md` to:

1. Get API keys (Anthropic, SendGrid)
2. Create `.env.production` files
3. Configure frontend and backend

**Quick commands:**
```bash
# Frontend
cd frontend
cp .env.production.example .env.production
nano .env.production  # Edit with your values

# Backend
cd ../backend
cp .env.production.example .env.production
nano .env.production  # Edit with your values
```

**Required values:**
- `ANTHROPIC_API_KEY` (get from https://console.anthropic.com/)
- `EMAIL_PASSWORD` (SendGrid API key or Gmail app password)
- `JWT_SECRET` (generate: `openssl rand -base64 64`)

### Step 3: Deploy! (15 minutes)

#### Option A: Use Deploy Script (Easiest)

```bash
./deploy.sh
```

Select:
1. Option 1: Deploy Frontend to Vercel
2. Option 2: Deploy Backend to Render

#### Option B: Manual Deployment

**Frontend to Vercel:**
```bash
cd frontend
vercel --prod
```

**Backend to Render:**
1. Push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Deploy to production"
   git remote add origin https://github.com/YOUR_USERNAME/scisocial.git
   git push -u origin main
   ```

2. Go to render.com → New → Blueprint
3. Connect your GitHub repo
4. Render detects `backend/render.yaml`
5. Click "Apply" to create services

See `QUICK_DEPLOY.md` for details.

## 🌐 Configure DNS (After Deployment)

Once deployed, configure Cloudflare DNS:

Follow `CLOUDFLARE_DNS_SETUP.md` for complete instructions.

**Quick DNS setup:**

In Cloudflare for `scisocial.pro`:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | @ | cname.vercel-dns.com | DNS only |
| CNAME | www | cname.vercel-dns.com | DNS only |
| CNAME | api | your-app.onrender.com | DNS only |

**Add domains in platforms:**
- Vercel: Add `scisocial.pro` in dashboard
- Render: Add `api.scisocial.pro` in custom domains

## ✅ Verify Deployment

After deployment, check:

```bash
# Frontend
curl -I https://scisocial.pro
# Expected: 200 OK

# Backend API
curl https://api.scisocial.pro/health
# Expected: {"status":"ok","timestamp":"..."}

# Redirects
curl -I https://www.scisocial.pro
# Expected: 301 → https://scisocial.pro
```

**Web checks:**
- Visit: https://scisocial.pro (should load)
- SSL: https://www.ssllabs.com/ssltest/analyze.html?d=scisocial.pro (Grade A+)

## 🔧 Post-Deployment

### Generate Embeddings

After backend is deployed, run in Render Shell:

```bash
npm run generate:embeddings
```

This populates the semantic search vectors.

### Test Features

- [ ] Homepage loads
- [ ] Search works
- [ ] Semantic search: `/semantic-search?q=test`
- [ ] Posts display
- [ ] Weekly digest configured

## 📚 Documentation Reference

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **START_HERE.md** (this file) | Quick overview | First time setup |
| **PRE_DEPLOYMENT_FIXES.md** | TypeScript fixes needed | Before deploying |
| **ENVIRONMENT_SETUP.md** | Configure env variables | Setting up API keys |
| **QUICK_DEPLOY.md** | 5-minute deploy guide | Fast deployment |
| **CLOUDFLARE_DNS_SETUP.md** | DNS configuration | After deployment |
| **DEPLOYMENT_GUIDE.md** | Complete reference (500+ lines) | Comprehensive guide |
| **README.md** | Project overview | Learning about the project |

## 🆘 Need Help?

### Common Issues

**"CORS Error"**
- Fix: Add frontend URL to `CORS_ORIGIN` in backend env vars

**"502 Bad Gateway"**
- Fix: Check backend is running in Render dashboard

**"DNS not resolving"**
- Fix: Wait 24-48 hours for DNS propagation

**"Build failed"**
- Fix: Complete Step 1 (TypeScript fixes)

See `DEPLOYMENT_GUIDE.md` Section 11 for more troubleshooting.

## 🎉 You're Done!

Once deployed and verified:
1. Your site is live at https://scisocial.pro
2. API accessible at https://api.scisocial.pro
3. All domains redirect to primary
4. SSL enabled with grade A+
5. Semantic search working
6. Weekly digests scheduled

**Next steps:**
- Add content and test features
- Monitor in Render/Vercel dashboards
- Set up backups (see DEPLOYMENT_GUIDE.md Section 10)
- Configure monitoring (Sentry, UptimeRobot)

---

## 📞 Support

- Deployment issues: See DEPLOYMENT_GUIDE.md
- TypeScript errors: See PRE_DEPLOYMENT_FIXES.md
- DNS questions: See CLOUDFLARE_DNS_SETUP.md
- Environment setup: See ENVIRONMENT_SETUP.md

**Happy Deploying! 🚀**
