# 🚀 Final Render Deployment Instructions

## ✅ All Build Issues Fixed!

The following issues have been resolved:
1. ✅ TypeScript compilation output structure fixed
2. ✅ Module resolution paths corrected
3. ✅ Start command updated
4. ✅ Build tested locally and working

---

## 🎯 Render Dashboard Configuration

### Build & Deploy Settings

| Setting | Value |
|---------|-------|
| **Environment** | Node |
| **Root Directory** | `lms-backend` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |

### Important Notes

- ✅ **Root Directory**: Set to `lms-backend` if your repo has both frontend and backend
- ✅ **Build Command**: Installs dependencies, generates Prisma client, compiles TypeScript
- ✅ **Start Command**: Runs `node dist/server.js` (via npm start)

---

## 🔐 Environment Variables to Add in Render

Add these in the **Environment** tab:

### Database
```
DATABASE_URL=postgres://avnadmin:AVNS_-arGDrCrd9Kn33LROni@pg-ea842a3-devrecruitc-ec02.f.aivencloud.com:14933/defaultdb?sslmode=require&sslaccept=accept_invalid_certs
NODE_TLS_REJECT_UNAUTHORIZED=0
```

### JWT Secrets
```
JWT_ACCESS_SECRET=m/Nnnv/sXBu0egMrXhznm7hIDtJvD9D6QqbkTc+j2rA=
JWT_REFRESH_SECRET=GlTUULFLaIse+37bJwkWPtu1VbwUWYOl7N63+WitvjY=
```

### Email (SMTP)
```
SMTP_HOST=smtp.zeptomail.com
SMTP_PORT=587
SMTP_USER=emailapikey
SMTP_PASS=wSsVR60lrBOjCaguzzCoJ788mQxRAVzyFh8p2wOg7n6qS6uRp8c/...
SMTP_FROM=admin@wallx.co
```

### Cloudinary
```
CLOUDINARY_CLOUD_NAME=dbhr79zxy
CLOUDINARY_API_KEY=614434349363385
CLOUDINARY_API_SECRET=j2GOW1TGe8AR2D_fuJF6UzKkOJM
CLOUDINARY_URL=cloudinary://614434349363385:j2GOW1TGe8AR2D_fuJF6UzKkOJM@dbhr79zxy
```

### Application URLs
```
NODE_ENV=production
FRONTEND_URL=https://devrecschool.netlify.app
BASE_URL=https://your-app-name.onrender.com
APP_URL=https://your-app-name.onrender.com
```

**Note**: Update `BASE_URL` and `APP_URL` after Render assigns your URL.

---

## 📋 Deployment Steps

### 1. Push Your Code
```bash
cd lms-backend
git add .
git commit -m "Fix TypeScript build configuration for Render"
git push origin main
```

### 2. Create Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure settings (see table above)

### 3. Add Environment Variables

1. Go to **Environment** tab
2. Add all variables listed above
3. Click **"Save Changes"**

### 4. Deploy

1. Click **"Create Web Service"** or **"Manual Deploy"**
2. Wait for build to complete (~5 minutes)
3. Watch logs for:
   ```
   ==> Running 'npm install && npm run build'
   ✔ Generated Prisma Client
   ==> Build successful!
   ==> Running 'npm start'
   🚀 Server running on port 5000
   ```

### 5. Run Database Migrations

After successful deployment:

1. Open **Shell** tab in Render dashboard
2. Run:
   ```bash
   npm run migrate:deploy
   ```

### 6. Test Deployment

Visit these endpoints:
- **Health**: `https://your-app.onrender.com/api/health`
- **API Docs**: `https://your-app.onrender.com/api-docs`

---

## 🔍 Expected Build Output

### During Build Phase
```
==> Cloning from https://github.com/...
==> Downloading cache...
==> Running 'npm install && npm run build'
npm install
...
npm run build
> prisma generate && tsc
✔ Generated Prisma Client
[TypeScript compilation]
==> Build successful!
```

### During Start Phase
```
==> Starting service with 'npm start'
> node dist/server.js
🚀 Server running on port 10000
🌍 Environment: production
📄 Swagger docs available at https://your-app.onrender.com/api-docs
❤️  Health check available at https://your-app.onrender.com/api/health
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module"

**Solution**: Verify Root Directory is set correctly
- Should be: `lms-backend` (if in monorepo)
- NOT: `src` or left blank if backend is in subfolder

### Issue: Build fails with TypeScript errors

**Solution**: Check that DATABASE_URL is set in environment variables
- Prisma needs it to generate the client

### Issue: Server starts but crashes immediately

**Solution**: Check environment variables are all set
- Missing JWT secrets
- Missing DATABASE_URL
- Missing SMTP credentials

### Issue: Database connection fails

**Solution**: 
- Verify `NODE_TLS_REJECT_UNAUTHORIZED=0` is set
- Check DATABASE_URL includes `?sslmode=require`

---

## ✅ Post-Deployment Checklist

After successful deployment:

- [ ] Health endpoint returns 200 OK
- [ ] API docs accessible
- [ ] Database migrations run successfully
- [ ] Test user registration endpoint
- [ ] Test login endpoint
- [ ] Update frontend with backend URL
- [ ] Test frontend → backend connection
- [ ] Verify file uploads work (Cloudinary)
- [ ] Test email sending (SMTP)

---

## 🎯 Update Frontend

After backend is deployed, update your frontend `.env`:

```env
VITE_API_BASE_URL=https://your-app-name.onrender.com/api
```

Then redeploy your frontend on Netlify.

---

## 📊 What Changed from Previous Errors

### Error 1: "Cannot find module '/opt/render/project/src/index.js'"
**Cause**: Wrong start command
**Fixed**: Updated Render configuration to use `npm start`

### Error 2: "Cannot find module '/opt/render/project/src/dist/src/routes/...'"
**Cause**: TypeScript compiling with wrong `rootDir`
**Fixed**: 
- Set `rootDir: "./src"` in tsconfig.json
- Removed `prisma/**` from include paths
- Updated start command to `node dist/server.js`

---

## 🚀 You're Ready!

All configuration issues have been fixed. Your deployment should now work perfectly!

**Expected deployment time**: ~5 minutes

**Next**: Push your code and follow the steps above.

---

## 📞 Support

If you encounter issues:
1. Check Render logs for specific error messages
2. Verify all environment variables are set
3. Ensure Root Directory matches your repo structure
4. Confirm DATABASE_URL is accessible from Render

Good luck with your deployment! 🎉
