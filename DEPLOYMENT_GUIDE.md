# SciSocial Production Deployment Guide

Complete deployment plan for the Scientific Social Media Platform to production.

---

## 1. Domain Strategy Recommendation

### Primary Domain: `scisocial.pro`

**Rationale:**
- `.pro` extension conveys professionalism and credibility - essential for a scientific platform
- Short, memorable, and clean branding
- Better perception than `.biz` (commercial-focused), `.shop`/`.store` (e-commerce), or `.us` (geo-limited)
- `scisocials.com` has awkward extra "s" that could confuse users

### Domain Allocation Strategy

| Purpose | Domain/Subdomain | Reasoning |
|---------|------------------|-----------|
| **Primary Frontend** | `scisocial.pro` | Main user-facing application |
| | `www.scisocial.pro` | Auto-redirect to apex domain |
| **Backend API** | `api.scisocial.pro` | Separate subdomain for API isolation & CORS simplicity |
| **Admin Dashboard** | `admin.scisocial.pro` | Separate admin interface (can IP-restrict at nginx level) |
| **Static Assets/CDN** | `cdn.scisocial.pro` | User uploads, images, PDFs from citation system |
| **Email Domain** | `@scisocial.pro` | Professional email for system notifications |
| **301 Redirects** | All other 5 domains | Consolidate SEO authority to primary domain |

---

## 2. DNS Configuration (Cloudflare)

### A. Frontend DNS Records

**For Platform Hosting (Vercel/Netlify):**

| Type | Name | Value | TTL | Proxy | Purpose |
|------|------|-------|-----|-------|---------|
| CNAME | `@` | `cname.vercel-dns.com` | Auto | ⚠️ DNS Only | Apex domain → Vercel |
| CNAME | `www` | `cname.vercel-dns.com` | Auto | ⚠️ DNS Only | WWW subdomain |

**For Self-Hosted:**

| Type | Name | Value | TTL | Proxy | Purpose |
|------|------|-------|-----|-------|---------|
| A | `@` | `YOUR_SERVER_IP` | Auto | ✅ Proxied | Apex domain |
| CNAME | `www` | `scisocial.pro` | Auto | ✅ Proxied | WWW → apex redirect |

### B. Backend API DNS Records

**For Platform Hosting (Render/Railway/Fly.io):**

| Type | Name | Value | TTL | Proxy | Purpose |
|------|------|-------|-----|-------|---------|
| CNAME | `api` | `your-app.onrender.com` | Auto | ⚠️ DNS Only | Backend API |

**For Self-Hosted:**

| Type | Name | Value | TTL | Proxy | Purpose |
|------|------|-------|-----|-------|---------|
| A | `api` | `YOUR_API_SERVER_IP` | Auto | ✅ Proxied | Backend API |

### C. Optional Subdomains

| Type | Name | Value | TTL | Proxy | Purpose |
|------|------|-------|-----|-------|---------|
| A/CNAME | `admin` | `YOUR_SERVER_IP` or CNAME | Auto | ✅ Proxied | Admin dashboard |
| A/CNAME | `cdn` | `YOUR_CDN_IP` or S3 CNAME | Auto | ✅ Proxied | Static assets |

### D. Email Configuration (for system emails)

| Type | Name | Value | TTL | Proxy | Purpose |
|------|------|-------|-----|-------|---------|
| MX | `@` | `mx1.forwardemail.net` | Auto | DNS Only | Email receiving (if using ForwardEmail) |
| TXT | `@` | `v=spf1 include:_spf.google.com ~all` | Auto | DNS Only | SPF record |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:admin@scisocial.pro` | Auto | DNS Only | DMARC policy |

### E. Redirect Domains (All 5 Other Domains)

For **each** of: `scisocial.biz`, `scisocial.shop`, `scisocial.store`, `scisocial.us`, `scisocials.com`

| Type | Name | Value | TTL | Proxy | Purpose |
|------|------|-------|-----|-------|---------|
| A | `@` | `YOUR_SERVER_IP` | Auto | ✅ Proxied | Redirect base domain |
| CNAME | `www` | `@` | Auto | ✅ Proxied | Redirect WWW variant |

### Cloudflare SSL/TLS Settings

```
Navigation: SSL/TLS → Overview

SSL/TLS encryption mode: Full (strict)
Always Use HTTPS: On
Automatic HTTPS Rewrites: On
Minimum TLS Version: 1.2
TLS 1.3: Enabled
HTTP Strict Transport Security (HSTS): Enabled
  - Max Age Header: 12 months
  - Include Subdomains: On
  - Preload: On
```

---

## 3. Hosting Configuration

### A. Frontend (Next.js 16 App Router)

#### Option 1: Vercel (Recommended - Zero Config)

**Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

**Step 2: Deploy from frontend directory**
```bash
cd /Users/samhardeman/WebstormProjects/sci-social/frontend
vercel login
vercel --prod
```

**Step 3: Configure in Vercel Dashboard**

1. **Build Settings:**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

2. **Environment Variables** (add in dashboard):
   ```
   NEXT_PUBLIC_API_URL=https://api.scisocial.pro
   NEXT_PUBLIC_APP_NAME=SciSocial
   NEXT_PUBLIC_ENV=production
   ```

3. **Domain Configuration:**
   - Add `scisocial.pro` as production domain
   - Add `www.scisocial.pro` (auto-redirects to apex)

**Step 4: Create vercel.json (optional - for advanced config)**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.scisocial.pro/:path*"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

#### Option 2: Netlify

**netlify.toml:**
```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NEXT_PUBLIC_API_URL = "https://api.scisocial.pro"
  NEXT_PUBLIC_APP_NAME = "SciSocial"
  NEXT_PUBLIC_ENV = "production"

[[redirects]]
  from = "/api/*"
  to = "https://api.scisocial.pro/:splat"
  status = 200
  force = true

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"
```

**Deploy:**
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

#### Option 3: Self-Hosted with PM2

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'scisocial-frontend',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/scisocial/frontend',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_PUBLIC_API_URL: 'https://api.scisocial.pro',
      NEXT_PUBLIC_APP_NAME: 'SciSocial',
      NEXT_PUBLIC_ENV: 'production'
    },
    error_file: '/var/log/scisocial-frontend-error.log',
    out_file: '/var/log/scisocial-frontend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
}
```

**Deploy steps:**
```bash
# Build locally or on server
cd frontend
npm install
npm run build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions to enable auto-start
```

---

### B. Backend (NestJS + TypeORM + PostgreSQL + Redis)

#### Option 1: Render (Recommended - Managed Infrastructure)

**Create render.yaml in backend directory:**

```yaml
services:
  # PostgreSQL Database
  - type: pgsql
    name: scisocial-db
    plan: starter
    databaseName: sci_social_prod
    user: scisocial_user
    ipAllowList: []  # Allow from anywhere (Render internal network)

  # Redis Cache
  - type: redis
    name: scisocial-redis
    plan: starter
    maxmemoryPolicy: allkeys-lru
    ipAllowList: []

  # NestJS Backend API
  - type: web
    name: scisocial-api
    runtime: node
    region: oregon
    plan: starter
    buildCommand: npm install && npm run build
    startCommand: npm run start:prod
    healthCheckPath: /health
    envVars:
      # Database (auto-populated from scisocial-db service)
      - key: DATABASE_URL
        fromDatabase:
          name: scisocial-db
          property: connectionString

      # Redis (auto-populated from scisocial-redis service)
      - key: REDIS_URL
        fromService:
          name: scisocial-redis
          type: redis
          property: connectionString

      # Parsed database variables (for TypeORM)
      - key: DATABASE_HOST
        fromDatabase:
          name: scisocial-db
          property: host
      - key: DATABASE_PORT
        fromDatabase:
          name: scisocial-db
          property: port
      - key: DATABASE_USER
        fromDatabase:
          name: scisocial-db
          property: user
      - key: DATABASE_PASSWORD
        fromDatabase:
          name: scisocial-db
          property: password
      - key: DATABASE_NAME
        value: sci_social_prod

      # Server config
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001

      # CORS (will be updated after frontend is deployed)
      - key: CORS_ORIGIN
        value: https://scisocial.pro,https://www.scisocial.pro

      # API Keys (add manually in Render dashboard)
      - key: CROSSREF_API_EMAIL
        sync: false
      - key: ANTHROPIC_API_KEY
        sync: false

      # Email (configure with your SMTP provider)
      - key: EMAIL_HOST
        value: smtp.sendgrid.net
      - key: EMAIL_PORT
        value: 587
      - key: EMAIL_SECURE
        value: false
      - key: EMAIL_USER
        sync: false
      - key: EMAIL_PASSWORD
        sync: false
      - key: EMAIL_FROM
        value: noreply@scisocial.pro

      # JWT
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_EXPIRATION
        value: 7d
```

**Deploy to Render:**
```bash
# 1. Push your code to GitHub
cd /Users/samhardeman/WebstormProjects/sci-social
git init
git add .
git commit -m "Initial commit for production deployment"
git remote add origin https://github.com/YOUR_USERNAME/scisocial.git
git push -u origin main

# 2. In Render Dashboard:
#    - New → Blueprint
#    - Connect repository
#    - Render will auto-detect render.yaml
#    - Click "Apply" to create all services

# 3. After deployment, run database migrations:
#    - Open Render Shell for scisocial-api service
npm run typeorm migration:run
```

#### Option 2: Railway

**Railway Configuration:**

1. **Install Railway CLI:**
```bash
npm install -g @railway/cli
railway login
```

2. **Initialize project:**
```bash
cd backend
railway init
```

3. **Add services:**
```bash
# Add PostgreSQL
railway add --database postgres

# Add Redis
railway add --database redis

# Deploy backend
railway up
```

4. **Set environment variables in Railway dashboard:**
```bash
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://scisocial.pro,https://www.scisocial.pro
CROSSREF_API_EMAIL=your-email@example.com
ANTHROPIC_API_KEY=your-anthropic-key

# Database variables (auto-populated by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}
DATABASE_HOST=${{Postgres.HOST}}
DATABASE_PORT=${{Postgres.PORT}}
DATABASE_USER=${{Postgres.USER}}
DATABASE_PASSWORD=${{Postgres.PASSWORD}}
DATABASE_NAME=${{Postgres.DATABASE}}

# Redis variables (auto-populated)
REDIS_HOST=${{Redis.HOST}}
REDIS_PORT=${{Redis.PORT}}
```

#### Option 3: Self-Hosted with PM2

**Prerequisites:**
```bash
# Install PostgreSQL 16 with pgvector extension
sudo apt update
sudo apt install postgresql-16 postgresql-16-pgvector

# Install Redis
sudo apt install redis-server

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2
```

**ecosystem.config.js for backend:**
```javascript
module.exports = {
  apps: [{
    name: 'scisocial-api',
    script: 'dist/main.js',
    cwd: '/var/www/scisocial/backend',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      DATABASE_HOST: 'localhost',
      DATABASE_PORT: 5432,
      DATABASE_USER: 'scisocial_prod',
      DATABASE_PASSWORD: 'CHANGE_THIS_SECURE_PASSWORD',
      DATABASE_NAME: 'sci_social_prod',
      REDIS_HOST: 'localhost',
      REDIS_PORT: 6379,
      CROSSREF_API_EMAIL: 'your-email@example.com',
      ANTHROPIC_API_KEY: 'your-anthropic-key',
      EMAIL_HOST: 'smtp.sendgrid.net',
      EMAIL_PORT: 587,
      EMAIL_SECURE: false,
      EMAIL_USER: 'apikey',
      EMAIL_PASSWORD: 'your-sendgrid-api-key',
      EMAIL_FROM: 'noreply@scisocial.pro'
    },
    error_file: '/var/log/scisocial-api-error.log',
    out_file: '/var/log/scisocial-api-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
}
```

**Database setup:**
```sql
-- Create production database and user
CREATE USER scisocial_prod WITH PASSWORD 'CHANGE_THIS_SECURE_PASSWORD';
CREATE DATABASE sci_social_prod OWNER scisocial_prod;

-- Connect to database and enable pgvector
\c sci_social_prod
CREATE EXTENSION IF NOT EXISTS vector;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE sci_social_prod TO scisocial_prod;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO scisocial_prod;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO scisocial_prod;
```

**Deploy backend:**
```bash
cd backend
npm install
npm run build

# Run migrations
npm run typeorm migration:run

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 4. Nginx Reverse Proxy Configuration

**File: `/etc/nginx/sites-available/scisocial.pro`**

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=general_limit:10m rate=30r/s;
limit_req_zone $binary_remote_addr zone=upload_limit:10m rate=2r/s;

# Upstream servers
upstream frontend {
    least_conn;
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

upstream backend {
    least_conn;
    server 127.0.0.1:3001 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

# HTTP → HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name scisocial.pro www.scisocial.pro api.scisocial.pro admin.scisocial.pro;

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# WWW → apex redirect
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.scisocial.pro;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/scisocial.pro/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/scisocial.pro/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_stapling on;
    ssl_stapling_verify on;

    return 301 https://scisocial.pro$request_uri;
}

# Main application server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name scisocial.pro;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/scisocial.pro/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/scisocial.pro/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.scisocial.pro;" always;

    # Logging
    access_log /var/log/nginx/scisocial-access.log combined;
    error_log /var/log/nginx/scisocial-error.log warn;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
    gzip_disable "msie6";

    # File upload limits
    client_max_body_size 50M;
    client_body_buffer_size 128k;
    client_body_timeout 60s;

    # Frontend (Next.js)
    location / {
        limit_req zone=general_limit burst=20 nodelay;

        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Next.js static assets (cache aggressively)
    location /_next/static {
        proxy_pass http://frontend;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # Backend API
    location /api {
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 90s;
        proxy_read_timeout 90s;
    }

    # File uploads (stricter rate limiting)
    location /api/upload {
        limit_req zone=upload_limit burst=5 nodelay;

        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        client_max_body_size 50M;
        proxy_request_buffering off;
    }

    # Health check endpoint (no rate limit)
    location = /api/health {
        proxy_pass http://backend;
        access_log off;
    }

    # Uploaded files served by backend
    location /uploads {
        proxy_pass http://backend;
        proxy_cache_valid 200 7d;
        add_header Cache-Control "public, max-age=604800";
        access_log off;
    }
}

# API subdomain (alternative architecture)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.scisocial.pro;

    ssl_certificate /etc/letsencrypt/live/scisocial.pro/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/scisocial.pro/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # CORS Headers (handled by NestJS but add as backup)
    add_header Access-Control-Allow-Origin "https://scisocial.pro" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS, PATCH" always;
    add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
    add_header Access-Control-Allow-Credentials "true" always;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;

    access_log /var/log/nginx/scisocial-api-access.log;
    error_log /var/log/nginx/scisocial-api-error.log;

    client_max_body_size 50M;

    # Preflight requests
    location / {
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://scisocial.pro";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS, PATCH";
            add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization";
            add_header Access-Control-Allow-Credentials "true";
            add_header Access-Control-Max-Age 86400;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }

        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads {
        proxy_pass http://backend;
        proxy_cache_valid 200 7d;
        add_header Cache-Control "public, max-age=604800";
    }

    location /health {
        proxy_pass http://backend;
        access_log off;
    }
}

# Admin subdomain (optional IP whitelist)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name admin.scisocial.pro;

    ssl_certificate /etc/letsencrypt/live/scisocial.pro/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/scisocial.pro/privkey.pem;

    # Optional: IP whitelist
    # allow 1.2.3.4;  # Your office IP
    # allow 5.6.7.8;  # Your home IP
    # deny all;

    access_log /var/log/nginx/scisocial-admin-access.log;

    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect all other domains → primary
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name scisocial.biz www.scisocial.biz
                scisocial.shop www.scisocial.shop
                scisocial.store www.scisocial.store
                scisocial.us www.scisocial.us
                scisocials.com www.scisocials.com;

    ssl_certificate /etc/letsencrypt/live/scisocial.pro/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/scisocial.pro/privkey.pem;

    access_log /var/log/nginx/scisocial-redirects.log;

    return 301 https://scisocial.pro$request_uri;
}
```

**Enable and test:**
```bash
# Test configuration
sudo nginx -t

# Enable site
sudo ln -s /etc/nginx/sites-available/scisocial.pro /etc/nginx/sites-enabled/

# Reload Nginx
sudo systemctl reload nginx
```

---

## 5. Environment Variables

### A. Frontend Environment Variables

**File: `frontend/.env.production`**

```bash
# ==============================================
# SCISOCIAL FRONTEND - PRODUCTION
# ==============================================

# Environment
NODE_ENV=production
NEXT_PUBLIC_ENV=production

# API Configuration
NEXT_PUBLIC_API_URL=https://api.scisocial.pro
# OR if using path-based routing (scisocial.pro/api):
# NEXT_PUBLIC_API_URL=https://scisocial.pro/api

# Application Branding
NEXT_PUBLIC_APP_NAME=SciSocial
NEXT_PUBLIC_APP_DESCRIPTION=Scientific Social Media Platform
NEXT_PUBLIC_BRANDING_URL=https://scisocial.pro

# Features
NEXT_PUBLIC_ENABLE_SEMANTIC_SEARCH=true
NEXT_PUBLIC_ENABLE_HYBRID_SEARCH=true
NEXT_PUBLIC_ENABLE_AI_SUMMARIES=true
NEXT_PUBLIC_ENABLE_WEEKLY_DIGEST=true

# Optional: Analytics
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
# NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxx

# Optional: Error Tracking
# NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### B. Backend Environment Variables

**File: `backend/.env.production`**

```bash
# ==============================================
# SCISOCIAL BACKEND - PRODUCTION
# ==============================================

# Environment
NODE_ENV=production
PORT=3001

# Database Configuration (PostgreSQL 16 with pgvector)
DATABASE_HOST=your-postgres-host.example.com
DATABASE_PORT=5432
DATABASE_USER=scisocial_prod
DATABASE_PASSWORD=CHANGE_THIS_SECURE_PASSWORD_MIN_32_CHARS
DATABASE_NAME=sci_social_prod

# Or use connection string format:
# DATABASE_URL=postgresql://scisocial_prod:password@host:5432/sci_social_prod?schema=public

# Redis Configuration
REDIS_HOST=your-redis-host.example.com
REDIS_PORT=6379
# REDIS_PASSWORD=your-redis-password  # If password protected
# Or use connection string:
# REDIS_URL=redis://:password@host:6379

# CORS Configuration
CORS_ORIGIN=https://scisocial.pro,https://www.scisocial.pro,https://admin.scisocial.pro
ALLOWED_ORIGINS=https://scisocial.pro,https://www.scisocial.pro

# API Keys - Citation Services
CROSSREF_API_EMAIL=your-email@example.com
# PUBMED_API_KEY=optional-pubmed-key
# SEMANTIC_SCHOLAR_API_KEY=optional-semantic-scholar-key

# AI/ML Configuration
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
# Alternative: Use OpenAI
# OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
# OPENAI_MODEL=gpt-4-turbo-preview

# Embedding Model (Xenova/all-MiniLM-L6-v2)
# No API key needed - runs locally via @xenova/transformers

# Email Configuration (SMTP)
EMAIL_HOST=smtp.sendgrid.net
# OR: smtp.gmail.com, smtp.mailgun.org, smtp.postmarkapp.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@scisocial.pro
EMAIL_FROM_NAME=SciSocial

# Weekly Digest Schedule (cron format)
DIGEST_CRON_SCHEDULE=0 9 * * 1
# Every Monday at 9 AM UTC

# File Upload Configuration
MAX_FILE_SIZE=52428800
# 50MB in bytes
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/gif,image/webp
UPLOAD_DIR=./uploads

# Optional: Cloud Storage (S3/Spaces)
# STORAGE_TYPE=s3
# AWS_ACCESS_KEY_ID=AKIA...
# AWS_SECRET_ACCESS_KEY=...
# AWS_S3_BUCKET=scisocial-uploads-prod
# AWS_S3_REGION=us-east-1
# CDN_URL=https://cdn.scisocial.pro

# Security
JWT_SECRET=CHANGE_THIS_SUPER_SECRET_JWT_KEY_MIN_64_CHARS_RANDOM_STRING
JWT_EXPIRATION=7d
# BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
# Options: error, warn, info, debug

# Application URLs (for emails, OAuth callbacks)
FRONTEND_URL=https://scisocial.pro
ADMIN_URL=https://admin.scisocial.pro
BACKEND_URL=https://api.scisocial.pro

# Optional: OAuth Providers
# GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
# GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx
# GOOGLE_CALLBACK_URL=https://api.scisocial.pro/auth/google/callback

# Optional: Error Tracking
# SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
# SENTRY_ENVIRONMENT=production
```

### C. Docker Environment (if using docker-compose in production)

**File: `.env` (for docker-compose.yml)**

```bash
# PostgreSQL
POSTGRES_USER=scisocial_prod
POSTGRES_PASSWORD=CHANGE_THIS_SECURE_PASSWORD
POSTGRES_DB=sci_social_prod

# Redis
REDIS_PASSWORD=CHANGE_THIS_REDIS_PASSWORD
```

---

## 6. SSL Certificate Setup

### Option 1: Cloudflare SSL (Easiest - No Server Config)

**Automatic if using Cloudflare DNS:**

1. **Set SSL/TLS Mode:**
   - Cloudflare Dashboard → SSL/TLS → Overview
   - Set to: **Full (strict)** if you have a valid cert on your server
   - Or: **Flexible** if using Cloudflare's certificate only (not recommended for production)

2. **Enable Always Use HTTPS:**
   - SSL/TLS → Edge Certificates → Always Use HTTPS: **On**

3. **Configure HSTS:**
   - SSL/TLS → Edge Certificates → HTTP Strict Transport Security
   ```
   Enable HSTS: On
   Max Age Header: 12 months
   Include Subdomains: On
   Preload: On
   ```

4. **Enable Automatic HTTPS Rewrites:**
   - SSL/TLS → Edge Certificates → Automatic HTTPS Rewrites: **On**

**For self-hosted servers, also install origin certificate:**

1. **Generate Origin Certificate:**
   - SSL/TLS → Origin Server → Create Certificate
   - Private key type: RSA (2048)
   - Hostnames: `scisocial.pro`, `*.scisocial.pro`
   - Validity: 15 years

2. **Save certificates on server:**
   ```bash
   sudo mkdir -p /etc/ssl/cloudflare
   sudo nano /etc/ssl/cloudflare/cert.pem  # Paste origin certificate
   sudo nano /etc/ssl/cloudflare/key.pem   # Paste private key
   sudo chmod 600 /etc/ssl/cloudflare/*.pem
   ```

3. **Update Nginx config to use Cloudflare cert:**
   ```nginx
   ssl_certificate /etc/ssl/cloudflare/cert.pem;
   ssl_certificate_key /etc/ssl/cloudflare/key.pem;
   ```

### Option 2: Let's Encrypt (Certbot - Free, Auto-Renewing)

**For self-hosted servers:**

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Stop Nginx temporarily
sudo systemctl stop nginx

# Obtain certificate for all domains
sudo certbot certonly --standalone \
  -d scisocial.pro \
  -d www.scisocial.pro \
  -d api.scisocial.pro \
  -d admin.scisocial.pro \
  -d cdn.scisocial.pro \
  --email admin@scisocial.pro \
  --agree-tos \
  --no-eff-email

# OR if Nginx is running, use nginx plugin:
sudo certbot --nginx \
  -d scisocial.pro \
  -d www.scisocial.pro \
  -d api.scisocial.pro \
  -d admin.scisocial.pro \
  -d cdn.scisocial.pro \
  --email admin@scisocial.pro \
  --agree-tos \
  --redirect

# Start Nginx
sudo systemctl start nginx
```

**Certificate locations:**
```
Certificate: /etc/letsencrypt/live/scisocial.pro/fullchain.pem
Private Key: /etc/letsencrypt/live/scisocial.pro/privkey.pem
Chain: /etc/letsencrypt/live/scisocial.pro/chain.pem
```

**Auto-renewal (certbot auto-installs this):**
```bash
# Test renewal
sudo certbot renew --dry-run

# Check renewal timer status
sudo systemctl status certbot.timer

# Manual renewal (if needed)
sudo certbot renew --nginx
sudo systemctl reload nginx
```

**Certbot renewal hook to reload Nginx:**
```bash
# Create renewal hook
sudo nano /etc/letsencrypt/renewal-hooks/post/reload-nginx.sh

# Add content:
#!/bin/bash
systemctl reload nginx

# Make executable
sudo chmod +x /etc/letsencrypt/renewal-hooks/post/reload-nginx.sh
```

### SSL Best Practices

**Test SSL configuration:**
```bash
# SSL Labs test (comprehensive)
https://www.ssllabs.com/ssltest/analyze.html?d=scisocial.pro

# Check certificate details
openssl s_client -connect scisocial.pro:443 -servername scisocial.pro

# Verify certificate chain
curl -I https://scisocial.pro
```

**Expected SSL Labs grade: A+**

**HSTS Preload Submission (optional):**
```
1. Ensure HSTS header active for 3+ months
2. Visit: https://hstspreload.org/
3. Enter: scisocial.pro
4. Submit for inclusion in browser preload lists
```

---

## 7. Deployment Verification Checklist

### DNS & Domain Verification

```bash
# Check DNS propagation
dig scisocial.pro +short
dig www.scisocial.pro +short
dig api.scisocial.pro +short

# Check from multiple global locations
https://www.whatsmydns.net/#A/scisocial.pro

# Verify nameservers (should point to Cloudflare)
dig NS scisocial.pro +short

# Check MX records (if email configured)
dig MX scisocial.pro +short
```

**Expected Results:**
- [ ] `scisocial.pro` resolves to correct IP or CNAME
- [ ] `api.scisocial.pro` resolves correctly
- [ ] DNS propagated globally (check via whatsmydns.net)
- [ ] Nameservers point to Cloudflare

### SSL Certificate Verification

```bash
# Test HTTPS accessibility
curl -I https://scisocial.pro
curl -I https://api.scisocial.pro
curl -I https://www.scisocial.pro

# Check SSL certificate details
curl -vI https://scisocial.pro 2>&1 | grep -A 10 "SSL certificate"

# Verify HSTS header
curl -I https://scisocial.pro | grep -i strict-transport-security

# SSL Labs comprehensive test
https://www.ssllabs.com/ssltest/analyze.html?d=scisocial.pro
```

**Expected Results:**
- [ ] All domains return `200 OK` or appropriate redirect
- [ ] Certificate valid and trusted
- [ ] HSTS header present with long max-age
- [ ] SSL Labs grade: A or A+
- [ ] TLS 1.2 and 1.3 enabled, older versions disabled

### Application Health Checks

```bash
# Frontend accessibility
curl -I https://scisocial.pro
# Expected: 200 OK

# Backend API health endpoint
curl https://api.scisocial.pro/health
# OR
curl https://scisocial.pro/api/health
# Expected: {"status":"ok"} or similar

# Check CORS headers
curl -I -X OPTIONS https://api.scisocial.pro \
  -H "Origin: https://scisocial.pro" \
  -H "Access-Control-Request-Method: POST"
# Expected: Access-Control-Allow-Origin header present

# Test redirect: WWW → apex
curl -I https://www.scisocial.pro
# Expected: 301 → https://scisocial.pro

# Test redirect: Other domains → primary
curl -I https://scisocial.biz
# Expected: 301 → https://scisocial.pro
```

**Expected Results:**
- [ ] Frontend loads without errors
- [ ] API health endpoint responds
- [ ] CORS configured correctly
- [ ] WWW redirects to apex
- [ ] All 5 alternate domains redirect to primary

### Frontend Application Tests

**1. Homepage & Navigation**
- [ ] Visit https://scisocial.pro
- [ ] Homepage loads completely
- [ ] Logo displays correctly
- [ ] Navigation menu functional
- [ ] No console errors in browser DevTools
- [ ] Mobile responsive (test on mobile device or DevTools)

**2. Search Functionality**
- [ ] Search bar visible
- [ ] Enter query: "neuroscience"
- [ ] Semantic search returns results
- [ ] Hybrid search works (if enabled)
- [ ] Results display correctly (posts, topics, journals, users)
- [ ] Click result navigates to detail page

**3. User Features**
- [ ] User profile pages load: `/users/[username]`
- [ ] User expertise tags display
- [ ] Follow/unfollow functionality works (if implemented)
- [ ] User bio and metadata visible

**4. Citation & Posts**
- [ ] Create new post (if auth implemented)
- [ ] Post appears in feed
- [ ] Citation metadata displays (DOI, journal, authors, year)
- [ ] AI summary visible (if available)
- [ ] Impact factor badge shows
- [ ] Post detail page loads
- [ ] Like functionality works
- [ ] Comment thread displays
- [ ] Reply to comments works

**5. Topics & Journals**
- [ ] Topics page loads: `/topics`
- [ ] Topic detail page shows: `/topics/[id]`
- [ ] Journals page loads: `/journals`
- [ ] Journal detail page shows: `/journals/[id]`
- [ ] Follow topic functionality (if implemented)

**6. Discovery Features**
- [ ] Trending page loads: `/trending`
- [ ] Explore page loads: `/explore`
- [ ] Analytics dashboard loads: `/analytics` (if public)
- [ ] Search analytics tracking (check backend logs)

### Backend API Endpoint Tests

```bash
# Set API base URL
API_URL="https://api.scisocial.pro"

# Test semantic search
curl "$API_URL/semantic-search?q=machine+learning&limit=5"
# Expected: JSON with posts, topics, journals, users

# Test hybrid search
curl "$API_URL/semantic-search?q=Nature&hybrid=true"
# Expected: JSON with boosted keyword matches

# Test posts endpoint
curl "$API_URL/posts?page=1&limit=10"
# Expected: JSON array of posts

# Test topics endpoint
curl "$API_URL/topics"
# Expected: JSON array of topics

# Test journals endpoint
curl "$API_URL/journals"
# Expected: JSON array of journals

# Test users endpoint
curl "$API_URL/users"
# Expected: JSON array of users

# Test citation lookup
curl "$API_URL/citations/lookup?doi=10.1038/nature14236"
# Expected: Citation metadata from Crossref

# Test institutions endpoint
curl "$API_URL/institutions"
# Expected: JSON array of institutions
```

**Expected Results:**
- [ ] All endpoints return valid JSON
- [ ] No 500 errors
- [ ] Response times < 500ms for simple queries
- [ ] Semantic search returns relevant results
- [ ] Pagination works correctly
- [ ] Error handling returns proper status codes

### Database & Infrastructure Tests

```bash
# Check PostgreSQL connection
psql $DATABASE_URL -c "SELECT version();"

# Verify pgvector extension
psql $DATABASE_URL -c "SELECT * FROM pg_extension WHERE extname = 'vector';"

# Check table existence
psql $DATABASE_URL -c "\dt"
# Expected: posts, users, topics, journals, citations, comments, likes, etc.

# Verify embeddings exist
psql $DATABASE_URL -c "SELECT COUNT(*) FROM posts WHERE embedding IS NOT NULL;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM topics WHERE embedding IS NOT NULL;"

# Check Redis connection
redis-cli -h $REDIS_HOST -p $REDIS_PORT ping
# Expected: PONG

# Check Redis keys
redis-cli -h $REDIS_HOST -p $REDIS_PORT KEYS "*"
```

**Expected Results:**
- [ ] Database connection successful
- [ ] pgvector extension installed
- [ ] All tables created
- [ ] Embeddings populated (not NULL)
- [ ] Redis accessible
- [ ] Bull queues configured (check Redis keys)

### Email & Digest Tests

```bash
# Test email sending (if endpoint exists)
curl -X POST "$API_URL/email/test" \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@example.com"}'

# Check digest service
curl "$API_URL/digest/preview"
# Expected: Preview of weekly digest content

# Manually trigger digest (if admin endpoint exists)
# curl -X POST "$API_URL/digest/send" -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Results:**
- [ ] Test email received
- [ ] Email template renders correctly
- [ ] Links in email work
- [ ] Unsubscribe functionality present
- [ ] Digest preview shows expected content

### Onboarding Flow Tests

**Manual Testing:**
- [ ] Navigate to `/onboarding`
- [ ] Onboarding wizard loads
- [ ] Step 1: Welcome screen displays
- [ ] Step 2: Topic selection (if implemented)
- [ ] Step 3: Journal selection
- [ ] Step 4: User preferences
- [ ] Complete onboarding → redirects to dashboard
- [ ] Preferences saved in database

### Admin Dashboard Tests (if implemented)

- [ ] Navigate to `https://admin.scisocial.pro`
- [ ] Admin login works (or redirects to auth)
- [ ] Dashboard loads with metrics
- [ ] User management accessible
- [ ] Moderation queue shows flagged content
- [ ] Institution admin panel loads
- [ ] Analytics dashboard displays
- [ ] Can view/edit/delete content

### Moderation System Tests

```bash
# Test moderation endpoints
curl "$API_URL/moderation/queue"
# Expected: List of items pending moderation

curl "$API_URL/moderation/reports"
# Expected: User reports
```

**Expected Results:**
- [ ] Moderation page loads: `/moderation`
- [ ] Flagged content displays
- [ ] Can approve/reject content
- [ ] Auto-moderation working (if implemented)

### Performance Tests

```bash
# Lighthouse audit (run in browser)
npx lighthouse https://scisocial.pro --view

# Load time check
curl -w "\nTime Total: %{time_total}s\n" -o /dev/null -s https://scisocial.pro

# API response time
time curl -s https://api.scisocial.pro/posts?limit=10 > /dev/null

# Semantic search performance
time curl -s "$API_URL/semantic-search?q=neuroscience" > /dev/null
```

**Performance Targets:**
- [ ] Frontend LCP (Largest Contentful Paint) < 2.5s
- [ ] Frontend FID (First Input Delay) < 100ms
- [ ] Frontend CLS (Cumulative Layout Shift) < 0.1
- [ ] API response time (simple query) < 200ms
- [ ] Semantic search < 500ms
- [ ] No memory leaks (monitor over 24h)

### Security Verification

```bash
# Check security headers
curl -I https://scisocial.pro | grep -i "x-frame-options\|x-content-type\|strict-transport"

# Test for common vulnerabilities
# XSS test (should be sanitized)
curl "$API_URL/posts" -H "Content-Type: application/json" \
  -d '{"content":"<script>alert(1)</script>"}'

# SQL injection test (should be prevented)
curl "$API_URL/search?q='; DROP TABLE posts;--"

# Rate limiting test
for i in {1..150}; do curl -s https://api.scisocial.pro/posts > /dev/null; done
# Should eventually return 429 Too Many Requests

# Security headers check (automated)
https://securityheaders.com/?q=scisocial.pro
```

**Expected Results:**
- [ ] All security headers present
- [ ] XSS inputs sanitized
- [ ] SQL injection prevented (parameterized queries)
- [ ] Rate limiting active (429 after threshold)
- [ ] No sensitive data in client-side code
- [ ] HTTPS everywhere (no mixed content)
- [ ] Security Headers grade: A

### Monitoring & Logs

```bash
# Backend logs (PM2)
pm2 logs scisocial-api --lines 50

# Frontend logs (PM2)
pm2 logs scisocial-frontend --lines 50

# Nginx access logs
sudo tail -f /var/log/nginx/scisocial-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/scisocial-error.log

# Check for errors
sudo grep -i error /var/log/nginx/scisocial-error.log | tail -20
```

**Expected Results:**
- [ ] No critical errors in logs
- [ ] 5xx errors = 0 (or minimal)
- [ ] 4xx errors appropriate (user errors)
- [ ] Request logging functional
- [ ] Error tracking configured (Sentry if enabled)

### Weekly Digest Cron Job

```bash
# Check cron job is scheduled
crontab -l | grep digest
# OR for PM2 cron
pm2 list

# Check digest module loaded
curl "$API_URL/digest/status"

# Manually trigger digest (test)
# (requires admin access or special endpoint)
```

**Expected Results:**
- [ ] Cron job scheduled (every Monday 9 AM)
- [ ] Digest service running
- [ ] Can preview digest content
- [ ] Test email sent successfully
- [ ] Unsubscribe links work

### Search Analytics

```bash
# Test analytics tracking
curl -X POST "$API_URL/search-analytics" \
  -H "Content-Type: application/json" \
  -d '{"query":"machine learning","userId":"test-user","resultsCount":10}'

# Retrieve analytics
curl "$API_URL/search-analytics/popular"
# Expected: List of popular search queries
```

**Expected Results:**
- [ ] Search queries logged
- [ ] Analytics dashboard shows data
- [ ] Popular searches displayed
- [ ] User search history tracked (if logged in)

### Saved Searches

- [ ] Navigate to `/saved-searches`
- [ ] Can save a search query
- [ ] Saved searches persist (check database)
- [ ] Can delete saved search
- [ ] Notifications for saved search updates (if implemented)

### File Upload Tests

```bash
# Test image upload (requires auth token)
curl -X POST "$API_URL/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-image.jpg"
# Expected: {"url":"https://api.scisocial.pro/uploads/filename.jpg"}

# Verify uploaded file accessible
curl -I https://api.scisocial.pro/uploads/filename.jpg
# Expected: 200 OK
```

**Expected Results:**
- [ ] Image upload succeeds
- [ ] File stored in `/uploads` or S3
- [ ] File accessible via CDN/direct URL
- [ ] File size limits enforced (50MB max)
- [ ] Only allowed types accepted (jpg, png, gif, webp)

---

## 8. Multi-Domain Redirect Strategy

### Cloudflare Page Rules (Easiest Method)

**Configure in Cloudflare Dashboard → Rules → Page Rules:**

**1. scisocial.biz → scisocial.pro**
```
URL Pattern: *scisocial.biz/*
Setting: Forwarding URL
Status Code: 301 - Permanent Redirect
Destination URL: https://scisocial.pro/$1
```

**2. scisocial.shop → scisocial.pro**
```
URL Pattern: *scisocial.shop/*
Setting: Forwarding URL
Status Code: 301 - Permanent Redirect
Destination URL: https://scisocial.pro/$1
```

**3. scisocial.store → scisocial.pro**
```
URL Pattern: *scisocial.store/*
Setting: Forwarding URL
Status Code: 301 - Permanent Redirect
Destination URL: https://scisocial.pro/$1
```

**4. scisocial.us → scisocial.pro**
```
URL Pattern: *scisocial.us/*
Setting: Forwarding URL
Status Code: 301 - Permanent Redirect
Destination URL: https://scisocial.pro/$1
```

**5. scisocials.com → scisocial.pro**
```
URL Pattern: *scisocials.com/*
Setting: Forwarding URL
Status Code: 301 - Permanent Redirect
Destination URL: https://scisocial.pro/$1
```

### Nginx-Based Redirects (Already in Config Above)

**Included in Nginx config section 4:**
```nginx
server {
    listen 443 ssl http2;
    server_name scisocial.biz www.scisocial.biz
                scisocial.shop www.scisocial.shop
                scisocial.store www.scisocial.store
                scisocial.us www.scisocial.us
                scisocials.com www.scisocials.com;

    ssl_certificate /etc/letsencrypt/live/scisocial.pro/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/scisocial.pro/privkey.pem;

    return 301 https://scisocial.pro$request_uri;
}
```

### Vercel/Netlify Redirects

**For platform hosting, add to `vercel.json`:**

```json
{
  "redirects": [
    {
      "source": "/:path*",
      "has": [{"type": "host", "value": "scisocial.biz"}],
      "destination": "https://scisocial.pro/:path*",
      "permanent": true
    },
    {
      "source": "/:path*",
      "has": [{"type": "host", "value": "www.scisocial.biz"}],
      "destination": "https://scisocial.pro/:path*",
      "permanent": true
    },
    {
      "source": "/:path*",
      "has": [{"type": "host", "value": "scisocial.shop"}],
      "destination": "https://scisocial.pro/:path*",
      "permanent": true
    },
    {
      "source": "/:path*",
      "has": [{"type": "host", "value": "www.scisocial.shop"}],
      "destination": "https://scisocial.pro/:path*",
      "permanent": true
    },
    {
      "source": "/:path*",
      "has": [{"type": "host", "value": "scisocial.store"}],
      "destination": "https://scisocial.pro/:path*",
      "permanent": true
    },
    {
      "source": "/:path*",
      "has": [{"type": "host", "value": "www.scisocial.store"}],
      "destination": "https://scisocial.pro/:path*",
      "permanent": true
    },
    {
      "source": "/:path*",
      "has": [{"type": "host", "value": "scisocial.us"}],
      "destination": "https://scisocial.pro/:path*",
      "permanent": true
    },
    {
      "source": "/:path*",
      "has": [{"type": "host", "value": "www.scisocial.us"}],
      "destination": "https://scisocial.pro/:path*",
      "permanent": true
    },
    {
      "source": "/:path*",
      "has": [{"type": "host", "value": "scisocials.com"}],
      "destination": "https://scisocial.pro/:path*",
      "permanent": true
    },
    {
      "source": "/:path*",
      "has": [{"type": "host", "value": "www.scisocials.com"}],
      "destination": "https://scisocial.pro/:path*",
      "permanent": true
    }
  ]
}
```

### SEO & Canonical URLs

**1. Add canonical meta tag in frontend layout:**

```tsx
// frontend/app/layout.tsx
export const metadata = {
  metadataBase: new URL('https://scisocial.pro'),
  alternates: {
    canonical: 'https://scisocial.pro',
  },
};
```

**2. Nginx canonical header (optional):**
```nginx
add_header Link '<https://scisocial.pro>; rel="canonical"' always;
```

**3. robots.txt on primary domain:**

Create `frontend/public/robots.txt`:
```
# https://scisocial.pro/robots.txt
User-agent: *
Allow: /

# Sitemap
Sitemap: https://scisocial.pro/sitemap.xml

# Crawl delay
Crawl-delay: 1
```

**4. Block indexing on redirect domains:**

For each redirect domain, create robots.txt:
```
# https://scisocial.biz/robots.txt
User-agent: *
Disallow: /
```

**5. Google Search Console:**
- Add `scisocial.pro` as primary property
- Verify ownership via DNS TXT record
- Submit sitemap: `https://scisocial.pro/sitemap.xml`
- Add redirect domains as properties (optional, for monitoring)
- Set `scisocial.pro` as preferred domain

### Test Redirects

```bash
# Test each domain redirects to primary
curl -I https://scisocial.biz
curl -I https://www.scisocial.biz
curl -I https://scisocial.shop
curl -I https://www.scisocial.shop
curl -I https://scisocial.store
curl -I https://www.scisocial.store
curl -I https://scisocial.us
curl -I https://www.scisocial.us
curl -I https://scisocials.com
curl -I https://www.scisocials.com

# All should return:
# HTTP/2 301
# location: https://scisocial.pro/

# Test path preservation
curl -I https://scisocial.biz/search?q=test
# Should redirect to: https://scisocial.pro/search?q=test
```

---

## 9. Quick Deployment Commands

### Initial Setup

```bash
# 1. Navigate to project
cd /Users/samhardeman/WebstormProjects/sci-social

# 2. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 3. Build both projects
cd ../backend && npm run build
cd ../frontend && npm run build

# 4. Test locally
cd ../backend && npm run start:prod &
cd ../frontend && npm run start &

# Visit http://localhost:3000
```

### Vercel Deployment (Frontend)

```bash
cd /Users/samhardeman/WebstormProjects/sci-social/frontend

# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to production
vercel --prod

# Set environment variables in Vercel dashboard
# OR via CLI:
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://api.scisocial.pro

vercel env add NEXT_PUBLIC_ENV production
# Enter: production
```

### Render Deployment (Backend)

```bash
# 1. Initialize git repository (if not already)
cd /Users/samhardeman/WebstormProjects/sci-social
git init
git add .
git commit -m "Production deployment"

# 2. Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/scisocial.git
git branch -M main
git push -u origin main

# 3. In Render Dashboard:
#    - New → Blueprint
#    - Connect GitHub repository
#    - Render auto-detects render.yaml from backend/
#    - Click "Apply"

# 4. After deployment, access Render Shell and run migrations:
npm run typeorm migration:run

# 5. Generate embeddings for existing data:
npm run generate:embeddings
```

### Self-Hosted Deployment

```bash
# On your production server:

# 1. Clone repository
git clone https://github.com/YOUR_USERNAME/scisocial.git /var/www/scisocial
cd /var/www/scisocial

# 2. Install backend dependencies
cd backend
npm install
npm run build

# 3. Install frontend dependencies
cd ../frontend
npm install
npm run build

# 4. Setup database
sudo -u postgres psql
CREATE DATABASE sci_social_prod;
CREATE USER scisocial_prod WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE sci_social_prod TO scisocial_prod;
\c sci_social_prod
CREATE EXTENSION vector;
\q

# 5. Run migrations
cd ../backend
DATABASE_URL=postgresql://scisocial_prod:password@localhost:5432/sci_social_prod npm run typeorm migration:run

# 6. Start services with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 7. Configure Nginx (see section 4)
sudo nano /etc/nginx/sites-available/scisocial.pro
# Paste config from section 4

sudo ln -s /etc/nginx/sites-available/scisocial.pro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 8. Setup SSL (see section 6)
sudo certbot --nginx -d scisocial.pro -d www.scisocial.pro -d api.scisocial.pro
```

---

## 10. Post-Deployment Tasks

### 1. Generate Embeddings

```bash
# SSH into backend server or Render Shell
npm run generate:embeddings

# This will:
# - Generate embeddings for all posts
# - Generate embeddings for all topics
# - Generate embeddings for all journals
# - Generate embeddings for all users (bio)
```

### 2. Seed Demo Data (Optional)

```bash
# If you want to populate with demo data
npm run ts-node src/seed-demo-data.ts
npm run ts-node src/seed-institutions-personas.ts
npm run ts-node src/seed-real-papers.ts
npm run ts-node src/seed-topics.ts
```

### 3. Configure Monitoring

**Sentry (Error Tracking):**
```bash
# Install Sentry
npm install @sentry/node @sentry/integrations

# Add to backend main.ts:
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

**Uptime Monitoring (UptimeRobot, Pingdom):**
- Monitor: `https://scisocial.pro` (every 5 min)
- Monitor: `https://api.scisocial.pro/health` (every 5 min)
- Alert via email/SMS on downtime

### 4. Backup Strategy

**Database Backups:**
```bash
# Create backup script
sudo nano /opt/scripts/backup-scisocial-db.sh

#!/bin/bash
BACKUP_DIR="/backups/scisocial"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="scisocial_$DATE.sql.gz"

pg_dump $DATABASE_URL | gzip > "$BACKUP_DIR/$FILENAME"

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 cp "$BACKUP_DIR/$FILENAME" s3://scisocial-backups/

# Make executable
sudo chmod +x /opt/scripts/backup-scisocial-db.sh

# Schedule daily backups via cron
crontab -e
# Add: 0 2 * * * /opt/scripts/backup-scisocial-db.sh
```

### 5. Log Rotation

```bash
# Configure logrotate
sudo nano /etc/logrotate.d/scisocial

/var/log/nginx/scisocial-*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}

/var/log/scisocial-*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
}
```

---

## 11. Troubleshooting Common Issues

### Issue: "502 Bad Gateway"

**Cause:** Backend not running or unreachable

**Solutions:**
```bash
# Check if backend is running
pm2 status
# OR
curl http://localhost:3001/health

# Check nginx error logs
sudo tail -f /var/log/nginx/scisocial-error.log

# Restart backend
pm2 restart scisocial-api

# Check nginx upstream
sudo nginx -t
sudo systemctl reload nginx
```

### Issue: "CORS Error" in Browser Console

**Cause:** CORS origin mismatch

**Solutions:**
```bash
# Update backend CORS_ORIGIN in .env
CORS_ORIGIN=https://scisocial.pro,https://www.scisocial.pro

# Verify main.ts CORS config
# Should use environment variable

# Restart backend
pm2 restart scisocial-api

# Check CORS headers
curl -I -X OPTIONS https://api.scisocial.pro \
  -H "Origin: https://scisocial.pro" \
  -H "Access-Control-Request-Method: POST"
```

### Issue: "Connection to PostgreSQL failed"

**Cause:** Database credentials incorrect or database not running

**Solutions:**
```bash
# Check database is running
sudo systemctl status postgresql

# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Verify environment variables
echo $DATABASE_HOST
echo $DATABASE_USER
echo $DATABASE_NAME

# Check database logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

### Issue: "pgvector extension not found"

**Cause:** pgvector not installed

**Solutions:**
```bash
# Install pgvector
sudo apt install postgresql-16-pgvector

# OR compile from source
git clone https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install

# Enable in database
psql $DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Issue: "Embeddings not generating"

**Cause:** Xenova/transformers model not loading

**Solutions:**
```bash
# Check model cache
ls ~/.cache/huggingface/

# Regenerate embeddings
npm run generate:embeddings

# Check logs for errors
pm2 logs scisocial-api --lines 100

# Verify @xenova/transformers installed
npm list @xenova/transformers
```

### Issue: "Weekly digest not sending"

**Cause:** Cron job not configured or email credentials wrong

**Solutions:**
```bash
# Check cron schedule
crontab -l

# Test email credentials
npm run ts-node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
transporter.verify().then(console.log).catch(console.error);
"

# Manually trigger digest (if endpoint exists)
curl -X POST https://api.scisocial.pro/digest/send
```

### Issue: "High memory usage"

**Cause:** Memory leak or embedding model loaded multiple times

**Solutions:**
```bash
# Monitor memory
pm2 monit

# Restart services
pm2 restart all

# Limit PM2 memory
pm2 start ecosystem.config.js --max-memory-restart 1G

# Check for memory leaks
node --inspect dist/main.js
# Use Chrome DevTools to profile
```

---

## 12. Maintenance & Updates

### Update Application Code

```bash
# Pull latest changes
cd /var/www/scisocial
git pull origin main

# Update backend
cd backend
npm install
npm run build
pm2 restart scisocial-api

# Update frontend
cd ../frontend
npm install
npm run build
pm2 restart scisocial-frontend
```

### Database Migrations

```bash
# Create new migration
cd backend
npm run typeorm migration:generate -- -n MigrationName

# Run migrations
npm run typeorm migration:run

# Revert migration (if needed)
npm run typeorm migration:revert
```

### Dependency Updates

```bash
# Check outdated packages
npm outdated

# Update dependencies
npm update

# Or update all to latest
npx npm-check-updates -u
npm install
```

---

## 13. Performance Optimization Checklist

- [ ] Enable Cloudflare caching (Browser Cache TTL: 4 hours)
- [ ] Configure Cloudflare Auto Minify (JS, CSS, HTML)
- [ ] Enable Cloudflare Brotli compression
- [ ] Add pgvector IVFFLAT indexes when dataset > 1000 rows
- [ ] Implement Redis caching for frequent API calls
- [ ] Configure CDN for user uploads
- [ ] Enable Next.js image optimization
- [ ] Implement lazy loading for images
- [ ] Add database read replicas (if high traffic)
- [ ] Configure connection pooling (pgBouncer)
- [ ] Monitor with New Relic or Datadog (optional)

---

## Support Resources

- **NestJS Docs:** https://docs.nestjs.com/
- **Next.js Docs:** https://nextjs.org/docs
- **pgvector Docs:** https://github.com/pgvector/pgvector
- **TypeORM Docs:** https://typeorm.io/
- **Cloudflare Docs:** https://developers.cloudflare.com/
- **Let's Encrypt:** https://letsencrypt.org/docs/

---

**Deployment plan created for SciSocial platform**
**Last updated:** December 2025
**Version:** 1.0

Good luck with your deployment! 🚀
