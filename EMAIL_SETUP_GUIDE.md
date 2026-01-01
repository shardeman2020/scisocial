# 📧 Email Configuration for SciSocial

**Your Email:** shardeman2020@gmail.com

## ✅ Already Configured

- ✅ `CROSSREF_API_EMAIL=shardeman2020@gmail.com` - Used for Crossref API
- ✅ `EMAIL_FROM=noreply@scisocial.pro` - What users see as sender

## 🎯 What You Need: Email Password

To enable weekly digest emails, you need to configure `EMAIL_PASSWORD`.

You have **two options:**

---

## Option A: Gmail SMTP (Easiest - 5 minutes)

**Pros:**
- ✅ Free
- ✅ Quick setup
- ✅ 500 emails/day limit (plenty for starting out)
- ✅ Uses your existing Gmail account

**Cons:**
- ⚠️ Requires app password (2FA must be enabled)
- ⚠️ Gmail may rate limit if sending too many emails

### Setup Steps:

1. **Enable 2-Factor Authentication on your Gmail**
   - Go to: https://myaccount.google.com/security
   - Under "Signing in to Google", enable 2-Step Verification
   - Follow the prompts (use phone verification)

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Other (Custom name)" → Enter "SciSocial"
   - Click "Generate"
   - You'll get a 16-character password like: `abcd efgh ijkl mnop`

3. **Update Environment Variables**

When deploying to Render, add these env vars:

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=shardeman2020@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop  # (remove spaces from app password)
EMAIL_FROM=noreply@scisocial.pro
EMAIL_FROM_NAME=SciSocial
```

---

## Option B: SendGrid (Recommended for Production)

**Pros:**
- ✅ Professional email service
- ✅ Better deliverability (less likely to hit spam)
- ✅ 100 emails/day free tier
- ✅ Detailed analytics
- ✅ Dedicated IP option on paid plans

**Cons:**
- ⚠️ Requires account signup
- ⚠️ Domain verification recommended (but optional)

### Setup Steps:

1. **Sign Up for SendGrid**
   - Go to: https://signup.sendgrid.com/
   - Create free account
   - Verify your email

2. **Create API Key**
   - Dashboard → Settings → API Keys
   - Click "Create API Key"
   - Name: "SciSocial Production"
   - Permissions: "Full Access" (or "Mail Send" only)
   - Click "Create & View"
   - Copy the key (starts with `SG.`)
   - **IMPORTANT:** Save it now - you can't see it again!

3. **Verify Sender Email (Optional but Recommended)**
   - Settings → Sender Authentication
   - Single Sender Verification
   - Add: `noreply@scisocial.pro`
   - Verify via email

4. **Update Environment Variables**

When deploying to Render, add these env vars:

```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@scisocial.pro
EMAIL_FROM_NAME=SciSocial
```

---

## 📝 Current Configuration Status

**File:** `backend/.env.production`

```bash
✅ CROSSREF_API_EMAIL=shardeman2020@gmail.com
✅ ANTHROPIC_API_KEY=sk-ant-api03-SR9BwKh2DnS... (configured)
✅ JWT_SECRET=SrxgXOLmbrMzYxochUEo... (configured)

# Email Configuration (choose Option A or B above)
EMAIL_HOST=smtp.sendgrid.net  # or smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey  # or shardeman2020@gmail.com
EMAIL_PASSWORD=CHANGE_THIS_TO_YOUR_SENDGRID_KEY  # ← Need to update
EMAIL_FROM=noreply@scisocial.pro
EMAIL_FROM_NAME=SciSocial
```

---

## 🚀 When to Configure Email

**You have 3 choices:**

### 1. Configure Before Deployment (Recommended)
- Choose Option A or B above
- Get the credentials
- Update in Render during Step 4 of deployment
- Email features work immediately after deployment

### 2. Configure After Deployment
- Deploy without email first
- Add email credentials later in Render dashboard
- Click "Manual Deploy" to restart with new settings

### 3. Skip Email for Now
- Platform works fine without email
- Weekly digest won't send
- Users won't get email notifications
- Can add anytime later

---

## 🔧 How to Add Email in Render (After Deployment)

If you deploy first and add email later:

1. Go to Render dashboard
2. Find your `scisocial-api` service
3. Click "Environment" tab
4. Update these variables:
   ```
   EMAIL_HOST=smtp.gmail.com  (or smtp.sendgrid.net)
   EMAIL_USER=shardeman2020@gmail.com  (or apikey)
   EMAIL_PASSWORD=<your-app-password-or-sendgrid-key>
   ```
5. Click "Save Changes"
6. Render will auto-redeploy with new settings

---

## 🧪 Testing Email After Deployment

Once email is configured, test it:

```bash
# Trigger a test email via API
curl -X POST https://api.scisocial.pro/digest/send-test \
  -H "Content-Type: application/json" \
  -d '{"email": "shardeman2020@gmail.com"}'
```

Or use the Render Shell to run:
```bash
npm run test:email
```

---

## 📊 Weekly Digest Schedule

Once email is configured, the weekly digest will:
- ✅ Run every Monday at 9 AM UTC
- ✅ Collect top posts from the past week
- ✅ Send to all users who opted in
- ✅ Include AI summaries of trending papers

**Cron Schedule:** `0 9 * * 1` (configured in `.env.production`)

---

## 💡 Recommendation

**For starting out:** Use **Gmail SMTP** (Option A)
- Quick setup (5 min)
- Free
- 500 emails/day is plenty for initial launch
- Can switch to SendGrid later if needed

**For production:** Switch to **SendGrid** (Option B) when you have:
- More than 100 weekly active users
- Need better deliverability
- Want email analytics
- Ready to verify your domain

---

## 🆘 Troubleshooting

### Gmail: "Invalid credentials"
- Make sure 2FA is enabled
- Use app password, not your regular Gmail password
- Remove spaces from the 16-character app password

### SendGrid: "Unauthorized"
- Make sure API key starts with `SG.`
- Check API key has "Mail Send" permissions
- Verify sender email if required

### Emails going to spam
- For Gmail: First few emails may go to spam, mark as "Not spam"
- For SendGrid: Verify your sender domain
- Add SPF/DKIM records in DNS (advanced)

---

## 📞 Next Steps

**To configure email now:**
1. Choose Option A (Gmail) or Option B (SendGrid)
2. Follow the setup steps
3. Get your credentials
4. When deploying to Render (Step 4), add the EMAIL_PASSWORD env var
5. Test after deployment

**To skip email for now:**
- Just continue with deployment
- Everything else works fine
- Add email later when you're ready

---

**Your choice - email is optional but recommended for full features!** 📧
