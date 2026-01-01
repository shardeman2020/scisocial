# 🚀 Final Deployment Steps for SciSocial

**Status:** Ready to deploy! All code fixes complete, environment variables configured.

## What's Already Done ✅

- ✅ All TypeScript errors fixed
- ✅ Frontend builds successfully
- ✅ Backend builds successfully
- ✅ Anthropic API key configured
- ✅ JWT secret generated
- ✅ All deployment config files created
- ✅ Vercel CLI installed

## What You Need to Do Now

### Step 1: Authenticate with Vercel (2 minutes)

Run this command and follow the prompts:

```bash
vercel login
```

Choose your preferred login method (GitHub, GitLab, Bitbucket, or email).

### Step 2: Deploy Frontend to Vercel (5 minutes)

```bash
cd /Users/samhardeman/WebstormProjects/sci-social/frontend
vercel --prod --yes
```

**What will happen:**
- Vercel will detect Next.js automatically
- It will build your frontend
- Deploy to production
- Give you a deployment URL

**After deployment:**
1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Find your project
3. Go to Settings → Domains
4. Add your custom domain: `scisocial.pro`
5. Also add: `www.scisocial.pro`, `scisocial.biz`, etc.

### Step 3: Prepare Backend for Render (5 minutes)

First, you need to push your code to GitHub:

```bash
# Initialize git (if not already done)
cd /Users/samhardeman/WebstormProjects/sci-social
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial deployment: SciSocial platform with semantic search"

# Create GitHub repo (replace YOUR_USERNAME with your GitHub username)
# Go to https://github.com/new and create a repo called "scisocial"

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/scisocial.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 4: Deploy Backend to Render (10 minutes)

1. **Go to Render:** https://render.com/

2. **Click "New" → "Blueprint"**

3. **Connect your GitHub repository**
   - Authorize Render to access your GitHub
   - Select the `scisocial` repository

4. **Render will detect `backend/render.yaml`**
   - It will automatically configure:
     - PostgreSQL database with pgvector
     - Redis cache
     - NestJS web service

5. **Click "Apply"**

6. **Add sensitive environment variables:**
   - Go to your newly created services
   - Click on "scisocial-api" service
   - Go to "Environment" tab
   - Add these (Render will auto-fill database URLs):
     ```
     ANTHROPIC_API_KEY=<your-anthropic-api-key>
     JWT_SECRET=<your-jwt-secret-generated-with-openssl>
     EMAIL_PASSWORD=<your-sendgrid-or-gmail-password>
     CROSSREF_API_EMAIL=<your-email@example.com>
     ```

7. **Wait for deployment** (3-5 minutes)
   - Render will build and deploy automatically
   - You'll get a URL like: `https://scisocial-api.onrender.com`

8. **Add custom domain:**
   - In your service, go to Settings → Custom Domains
   - Add: `api.scisocial.pro`

9. **Generate embeddings (Important!):**
   - Once deployed, go to Shell tab in Render
   - Run: `npm run generate:embeddings`
   - This populates the semantic search vectors

### Step 5: Configure Cloudflare DNS (15 minutes)

**For scisocial.pro domain:**

1. **Go to Cloudflare Dashboard:** https://dash.cloudflare.com/
2. **Select scisocial.pro**
3. **Go to DNS → Records**

**Add these DNS records:**

| Type | Name | Content | Proxy Status | TTL |
|------|------|---------|--------------|-----|
| CNAME | @ | cname.vercel-dns.com | DNS only | Auto |
| CNAME | www | cname.vercel-dns.com | DNS only | Auto |
| CNAME | api | scisocial-api.onrender.com | DNS only | Auto |

**Repeat for other domains** (scisocial.biz, .shop, .store, .us, scisocials.com):
- Each should point to `cname.vercel-dns.com`
- This allows Vercel to handle redirects

**SSL/TLS Settings:**
1. Go to SSL/TLS tab
2. Set encryption mode to "Full (strict)"
3. Enable "Always Use HTTPS"
4. Enable "Automatic HTTPS Rewrites"

### Step 6: Update CORS After Deployment

Once you have your actual deployment URLs, update the backend environment:

1. **In Render dashboard:**
   - Go to your `scisocial-api` service
   - Environment tab
   - Update `CORS_ORIGIN`:
     ```
     CORS_ORIGIN=https://scisocial.pro,https://www.scisocial.pro,https://api.scisocial.pro
     ```

2. **Also update URLs:**
   ```
   FRONTEND_URL=https://scisocial.pro
   BACKEND_URL=https://api.scisocial.pro
   ```

3. **Click "Manual Deploy" → "Deploy latest commit"**

## Verification Checklist

After everything is deployed:

### Test Frontend
```bash
# Homepage
curl -I https://scisocial.pro
# Expected: 200 OK

# WWW redirect
curl -I https://www.scisocial.pro
# Expected: 301 redirect to https://scisocial.pro
```

### Test Backend
```bash
# Health check
curl https://api.scisocial.pro/health
# Expected: {"status":"ok","timestamp":"..."}

# Posts endpoint
curl https://api.scisocial.pro/posts?limit=10
# Expected: JSON array of posts
```

### Test Features
- [ ] Visit https://scisocial.pro (homepage loads)
- [ ] Search works
- [ ] Semantic search: `https://scisocial.pro/search?q=machine+learning`
- [ ] Posts display correctly
- [ ] Can create new post (if logged in)

### Test SSL
Visit: https://www.ssllabs.com/ssltest/analyze.html?d=scisocial.pro
**Expected:** Grade A or A+

## Email Configuration (Optional - Can Do Later)

To enable weekly digest emails, you need to update `EMAIL_PASSWORD`:

**Option A: SendGrid**
1. Sign up at https://sendgrid.com/ (free tier: 100 emails/day)
2. Create an API key
3. Update in Render: `EMAIL_PASSWORD=SG.xxxxx`

**Option B: Gmail**
1. Enable 2FA on your Gmail account
2. Generate app password: https://myaccount.google.com/apppasswords
3. Update in Render:
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=<16-char-app-password>
   ```

## Troubleshooting

### "CORS Error" in browser
- Update `CORS_ORIGIN` in Render to include your frontend URL
- Redeploy backend

### "502 Bad Gateway"
- Check Render dashboard - backend might be starting up (takes 1-2 min)
- Check logs in Render for errors

### "DNS not resolving"
- Wait 24-48 hours for DNS propagation
- Use https://dnschecker.org/ to check status

### "Build failed" on Vercel
- Check build logs in Vercel dashboard
- Verify all dependencies are in package.json

### "Database connection failed" on Render
- Render auto-provisions database
- Check if `DATABASE_URL` env var is set correctly
- Check database is running in Render dashboard

## Post-Deployment Tasks

### 1. Generate Embeddings
After backend is deployed, run in Render Shell:
```bash
npm run generate:embeddings
```

### 2. Monitor Services
- Vercel: https://vercel.com/dashboard
- Render: https://dashboard.render.com/

### 3. Set Up Monitoring (Optional)
- Sentry for error tracking: https://sentry.io/
- UptimeRobot for uptime monitoring: https://uptimerobot.com/

### 4. Backups
Render automatically backs up PostgreSQL on paid plans. For free tier:
- Set up weekly manual backups from Render dashboard

## Estimated Time

- **Vercel deployment:** 5 minutes
- **GitHub setup:** 5 minutes
- **Render deployment:** 10 minutes
- **DNS configuration:** 15 minutes
- **Verification:** 10 minutes

**Total: ~45 minutes**

## Support

If you encounter issues:
1. Check the relevant section in `DEPLOYMENT_GUIDE.md`
2. Check Vercel/Render logs for error messages
3. Verify all environment variables are set correctly
4. Check that DNS has propagated (https://dnschecker.org/)

---

**You're almost there! 🚀**

All the hard work is done - the code is ready, configs are in place, just need to run the deployment commands and configure DNS.
