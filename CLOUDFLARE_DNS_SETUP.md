# Cloudflare DNS Setup Guide

Complete step-by-step guide to configure DNS for SciSocial on Cloudflare.

## Prerequisites

- [ ] You own all 6 domains:
  - scisocial.pro (primary)
  - scisocial.biz
  - scisocial.shop
  - scisocial.store
  - scisocial.us
  - scisocials.com
- [ ] All domains are added to Cloudflare
- [ ] Nameservers point to Cloudflare

## Step 1: Add Domains to Cloudflare

If not already added:

1. Go to https://dash.cloudflare.com/
2. Click "Add a Site"
3. Enter domain name (e.g., `scisocial.pro`)
4. Choose plan (Free is fine)
5. Cloudflare will scan existing DNS records
6. Copy the Cloudflare nameservers shown
7. Update nameservers at your domain registrar
8. Repeat for all 6 domains

## Step 2: Configure Primary Domain (scisocial.pro)

### For Vercel + Render Deployment (Recommended)

Go to `scisocial.pro` in Cloudflare dashboard → DNS → Records:

#### Frontend DNS Records

| Type | Name | Content | Proxy Status | TTL |
|------|------|---------|--------------|-----|
| CNAME | @ | cname.vercel-dns.com | DNS only (gray cloud) | Auto |
| CNAME | www | cname.vercel-dns.com | DNS only (gray cloud) | Auto |

#### Backend API DNS Records

| Type | Name | Content | Proxy Status | TTL |
|------|------|---------|--------------|-----|
| CNAME | api | your-app-name.onrender.com | DNS only (gray cloud) | Auto |

**Note:** Replace `your-app-name.onrender.com` with your actual Render URL from dashboard.

#### Optional: Admin & CDN

| Type | Name | Content | Proxy Status | TTL |
|------|------|---------|--------------|-----|
| CNAME | admin | cname.vercel-dns.com | DNS only (gray cloud) | Auto |
| CNAME | cdn | your-cdn-url.com | DNS only (gray cloud) | Auto |

### For Self-Hosted Deployment

If deploying to your own server:

| Type | Name | Content | Proxy Status | TTL |
|------|------|---------|--------------|-----|
| A | @ | YOUR_SERVER_IP | ✅ Proxied (orange cloud) | Auto |
| CNAME | www | scisocial.pro | ✅ Proxied | Auto |
| A | api | YOUR_SERVER_IP | ✅ Proxied | Auto |
| A | admin | YOUR_SERVER_IP | ✅ Proxied | Auto |

**Replace `YOUR_SERVER_IP` with your actual server IP address.**

## Step 3: Configure SSL/TLS

1. Go to `scisocial.pro` → SSL/TLS → Overview
2. Set SSL/TLS encryption mode: **Full (strict)**
3. Go to Edge Certificates:
   - Always Use HTTPS: **On**
   - Automatic HTTPS Rewrites: **On**
   - Minimum TLS Version: **1.2**
   - TLS 1.3: **On**

### Enable HSTS (Security)

1. Go to SSL/TLS → Edge Certificates
2. Scroll to HTTP Strict Transport Security (HSTS)
3. Click "Enable HSTS"
4. Configure:
   - Max Age Header: **12 months**
   - Include Subdomains: **On**
   - Preload: **On**
5. Accept acknowledgment

## Step 4: Set Up Page Rules for Redirects

Go to Rules → Page Rules:

### WWW to Apex Redirect

- **URL:** `www.scisocial.pro/*`
- **Setting:** Forwarding URL
- **Status Code:** 301 - Permanent Redirect
- **Destination URL:** `https://scisocial.pro/$1`

## Step 5: Configure Redirect Domains

For EACH of the 5 other domains, repeat these steps:

### scisocial.biz

1. Go to scisocial.biz domain in Cloudflare
2. DNS → Add record:

| Type | Name | Content | Proxy Status | TTL |
|------|------|---------|--------------|-----|
| A | @ | YOUR_SERVER_IP (or 192.0.2.1 if using Page Rules) | ✅ Proxied | Auto |
| CNAME | www | @ | ✅ Proxied | Auto |

3. Rules → Page Rules → Create Page Rule:
   - **URL:** `*scisocial.biz/*`
   - **Setting:** Forwarding URL
   - **Status Code:** 301 - Permanent Redirect
   - **Destination URL:** `https://scisocial.pro/$1`

4. SSL/TLS → Set to **Full** or **Flexible**

### Repeat for Other Domains

Repeat the above for:
- scisocial.shop
- scisocial.store
- scisocial.us
- scisocials.com

**Quick copy-paste for Page Rules:**

```
scisocial.shop/* → https://scisocial.pro/$1 (301)
scisocial.store/* → https://scisocial.pro/$1 (301)
scisocial.us/* → https://scisocial.pro/$1 (301)
scisocials.com/* → https://scisocial.pro/$1 (301)
```

## Step 6: Configure Speed & Security Settings

### Speed Settings

Go to `scisocial.pro` → Speed:

1. **Auto Minify:**
   - JavaScript: On
   - CSS: On
   - HTML: On

2. **Brotli:** On

### Security Settings

Go to Security → Settings:

1. **Security Level:** Medium
2. **Browser Integrity Check:** On
3. **Challenge Passage:** 30 minutes

## Step 7: Verify DNS Propagation

Check DNS is working correctly:

```bash
# Check primary domain
dig scisocial.pro +short
dig www.scisocial.pro +short
dig api.scisocial.pro +short

# Check nameservers
dig NS scisocial.pro +short

# Check from multiple locations
open https://www.whatsmydns.net/#A/scisocial.pro
```

**Expected:**
- `scisocial.pro` → Vercel IP or your server IP
- `api.scisocial.pro` → Render IP or your server IP
- Nameservers → Cloudflare nameservers

## Step 8: Test Redirects

```bash
# Test WWW redirect
curl -I https://www.scisocial.pro
# Should return: 301 → https://scisocial.pro

# Test other domains
curl -I https://scisocial.biz
curl -I https://scisocial.shop
curl -I https://scisocial.store
curl -I https://scisocial.us
curl -I https://scisocials.com
# All should return: 301 → https://scisocial.pro
```

## Step 9: Verify SSL

1. Visit: https://www.ssllabs.com/ssltest/analyze.html?d=scisocial.pro
2. Wait for scan to complete
3. **Target Grade:** A or A+

If not A+, check:
- HSTS is enabled
- TLS 1.3 is on
- Minimum TLS version is 1.2

## Step 10: Update Platform Configurations

### Vercel

1. Go to Vercel dashboard → Your project → Settings → Domains
2. Add custom domain: `scisocial.pro`
3. Vercel will detect your DNS records
4. Add: `www.scisocial.pro` (will auto-redirect to apex)

### Render

1. Go to Render dashboard → Your web service → Settings
2. Custom Domain: `api.scisocial.pro`
3. Render will provide instructions to verify DNS

## Troubleshooting

### "Too Many Redirects" Error

**Cause:** SSL/TLS mode mismatch

**Fix:**
1. Cloudflare → SSL/TLS → Overview
2. Change to **Full (strict)** if you have valid SSL on server
3. Or **Full** if using self-signed certificate
4. **Never use Flexible with HTTPS backend**

### DNS Not Resolving

**Cause:** DNS not propagated or nameservers not updated

**Fix:**
1. Wait 24-48 hours for DNS propagation
2. Verify nameservers at your registrar match Cloudflare's
3. Check: `dig NS scisocial.pro`
4. Clear DNS cache: `sudo dscacheutil -flushcache` (Mac)

### Vercel Domain Not Verifying

**Cause:** Proxy status should be DNS only (gray cloud)

**Fix:**
1. Cloudflare → DNS → Click orange cloud next to record
2. Change to gray cloud (DNS only)
3. Wait a few minutes
4. Retry verification in Vercel

### Page Rule Not Working

**Cause:** Page Rules have limits (3 on free plan)

**Fix:**
1. Consolidate multiple redirects into one rule using wildcards
2. Or use Cloudflare Workers for more complex rules
3. Or use nginx redirects on your server (see DEPLOYMENT_GUIDE.md)

## DNS Configuration Checklist

- [ ] scisocial.pro apex → Vercel/Server
- [ ] www.scisocial.pro → Vercel/Server
- [ ] api.scisocial.pro → Render/Server
- [ ] SSL/TLS mode: Full (strict)
- [ ] HSTS enabled (12 months)
- [ ] Always Use HTTPS: On
- [ ] Page Rule: www → apex (301)
- [ ] All 5 other domains redirect to scisocial.pro (301)
- [ ] DNS propagated (check whatsmydns.net)
- [ ] SSL Labs grade: A or A+
- [ ] Domains verified in Vercel/Render

## Post-Setup

Once DNS is configured:
1. Deploy your application (see QUICK_DEPLOY.md)
2. Test all domains and redirects
3. Monitor in Cloudflare Analytics

---

**Need Help?**
- Cloudflare Docs: https://developers.cloudflare.com/dns/
- DNS Checker: https://www.whatsmydns.net/
- SSL Checker: https://www.ssllabs.com/ssltest/
