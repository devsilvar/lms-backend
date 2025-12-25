# 🔧 Fix Render Deployment Error

## ❌ The Error You Got

```
Error: Cannot find module '/opt/render/project/src/index.js'
```

**Why?** Render was trying to run `node index.js` instead of using your `npm start` command.

## ✅ How to Fix in Render Dashboard

### Option 1: Update Settings in Render Dashboard (Recommended)

1. **Go to your Render service** → Settings

2. **Build & Deploy section**, verify/update:
   ```
   Root Directory: lms-backend
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

3. **Click "Save Changes"**

4. **Manually Redeploy**:
   - Go to "Manual Deploy" section
   - Click "Clear build cache & deploy"

### Option 2: Use render.yaml (Already Done)

The `render.yaml` file has been updated with:
- `rootDir: lms-backend` - Points to backend folder
- `runtime: node` - Explicit runtime specification
- `buildCommand: npm install && npm run build`
- `startCommand: npm start`

After pushing the updated `render.yaml`:
- Render will automatically pick up the new configuration
- Next deploy should work correctly

## 📋 Verify Your Render Configuration

Check these settings in Render Dashboard:

### Build Settings
- ✅ **Root Directory**: `lms-backend` (if using monorepo structure)
- ✅ **Build Command**: `npm install && npm run build`
- ✅ **Start Command**: `npm start`

### Environment
- ✅ All environment variables added (see main documentation)
- ✅ `DATABASE_URL` with Aiven connection string
- ✅ `NODE_ENV=production`

### Advanced
- ✅ **Health Check Path**: `/api/health`
- ✅ **Auto-Deploy**: Enabled (optional)

## 🚀 Steps to Redeploy

### After Pushing This Fix:

1. **Push to GitHub**:
   ```bash
   git push origin main
   ```

2. **In Render Dashboard**:
   - Render will auto-deploy if enabled
   - OR click "Manual Deploy" → "Deploy latest commit"

3. **Watch the logs** for:
   ```
   ==> Running 'npm install && npm run build'
   ==> Running 'npm start'
   🚀 Server running on port 5000
   ```

4. **Test deployment**:
   - Visit: `https://your-app.onrender.com/api/health`
   - Should return: `{"status":"ok","message":"LMS Backend API is running"}`

## 🔍 What Was Wrong?

### Before (Incorrect):
```
Render tried: node index.js
File doesn't exist: /opt/render/project/src/index.js
```

### After (Correct):
```
Render runs: npm start
Which executes: node dist/src/server.js
File exists after build: ✅
```

## 📊 Build Process Flow

```
1. npm install
   └─ Installs all dependencies
   └─ Runs postinstall: prisma generate

2. npm run build
   └─ Runs: prisma generate && tsc
   └─ Generates Prisma client
   └─ Compiles TypeScript to dist/

3. npm start
   └─ Runs: node dist/src/server.js
   └─ Starts your Express server ✅
```

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module"
**Solution**: Ensure `Root Directory` is set to `lms-backend` if you're in a monorepo

### Issue: Build succeeds but start fails
**Solution**: Check that `dist/src/server.js` exists after build
- Look in build logs for TypeScript compilation errors

### Issue: DATABASE_URL not found
**Solution**: Add all environment variables in Render Dashboard

### Issue: Prisma errors during build
**Solution**: Make sure `DATABASE_URL` is set in environment variables (needed for `prisma generate`)

## ✅ Success Indicators

You'll know it's working when you see:

```
==> Build successful!
==> Deploying...
==> Starting service with 'npm start'
🚀 Server running on port 5000
🌍 Environment: production
📄 Swagger docs available at https://your-app.onrender.com/api-docs
❤️  Health check available at https://your-app.onrender.com/api/health
==> Service is live!
```

## 📞 Next Steps After Successful Deploy

1. **Test health endpoint**: `https://your-app.onrender.com/api/health`
2. **Run migrations**: Open Render Shell and run `npm run migrate:deploy`
3. **Test API docs**: `https://your-app.onrender.com/api-docs`
4. **Update frontend**: Point frontend to new backend URL
5. **Test authentication**: Try login/register endpoints

## 🔗 Useful Render Commands

```bash
# In Render Shell (Dashboard → Shell tab)
npm run migrate:deploy    # Run database migrations
npm run seed              # Seed initial data (optional)
node --version            # Check Node version
ls -la dist/src/          # Verify compiled files exist
```

---

**Status**: Ready to redeploy with correct configuration! 🚀
