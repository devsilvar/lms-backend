# 🚀 Quick Start - Deploy to Render in 10 Minutes

This is the fastest path to get your LMS backend deployed to Render with Aiven PostgreSQL.

## Step 1: Prepare Your Repository (2 minutes)

```bash
cd lms-backend
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

## Step 2: Set Up on Render (5 minutes)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `lms-backend`
   - **Root Directory**: `lms-backend` (if monorepo)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or Starter for production)

## Step 3: Add Environment Variables (2 minutes)

Copy these from your `.env` file into Render's Environment tab:

### Required (Copy from your .env)
```
DATABASE_URL=postgres://username:password@your-aiven-host.aivencloud.com:PORT/defaultdb?sslmode=require
JWT_ACCESS_SECRET=<generate-with-crypto-randomBytes>
JWT_REFRESH_SECRET=<generate-with-crypto-randomBytes>
SMTP_HOST=smtp.zeptomail.com
SMTP_PORT=587
SMTP_USER=emailapikey
SMTP_PASS=<your-smtp-password>
SMTP_FROM=admin@wallx.co
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
FRONTEND_URL=https://devrecschool.netlify.app
```

**Generate JWT secrets with:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Render Will Set Automatically
```
NODE_ENV=production
PORT=(auto)
```

### Add These
```
NODE_TLS_REJECT_UNAUTHORIZED=0
BASE_URL=https://your-app-name.onrender.com
APP_URL=https://your-app-name.onrender.com
```

## Step 4: Deploy & Migrate (1 minute)

1. Click **"Create Web Service"**
2. Wait for build to complete (~3-5 minutes)
3. Once deployed, open **Shell** tab
4. Run: `npm run migrate:deploy`

## Step 5: Verify (30 seconds)

Test your endpoints:

- **Health**: https://your-app.onrender.com/api/health
- **API Docs**: https://your-app.onrender.com/api-docs

## Step 6: Update Frontend

Update your frontend environment variables:

```env
VITE_API_BASE_URL=https://your-app-name.onrender.com/api
```

## 🎉 Done!

Your backend is now live and connected to Aiven PostgreSQL!

---

### Need More Details?

- **Comprehensive Guide**: See `DEPLOYMENT.md`
- **Step-by-Step Checklist**: See `RENDER_CHECKLIST.md`

### Common Issues

**Build fails?**
- Check that all environment variables are set
- Verify DATABASE_URL is correct

**Can't connect to database?**
- Ensure `NODE_TLS_REJECT_UNAUTHORIZED=0` is set
- Verify connection string includes `?sslmode=require`

**CORS errors?**
- Make sure `FRONTEND_URL` matches your actual frontend URL

### Free Tier Note

Render free tier:
- Spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- 750 hours/month (enough for one always-on service)

For production, consider upgrading to Starter ($7/month) for:
- No spin-down
- Faster performance
- Better reliability
