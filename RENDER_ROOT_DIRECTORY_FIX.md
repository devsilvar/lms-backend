# 🔧 Fix Render Root Directory Error

## ❌ Current Error

```
Error: Cannot find module '/opt/render/project/src/dist/server.js'
```

## 🎯 The Problem

Your Render service has **Root Directory** set to `src` instead of `lms-backend`.

The path shows:
```
/opt/render/project/src/dist/server.js
                     ^^^
                     Wrong! Should be "lms-backend"
```

## ✅ How to Fix in Render Dashboard

### Step 1: Go to Your Service Settings

1. Open [Render Dashboard](https://dashboard.render.com)
2. Click on your `lms-backend` service
3. Click **"Settings"** in the left sidebar

### Step 2: Update Root Directory

1. Scroll down to **"Build & Deploy"** section
2. Find **"Root Directory"** field
3. **Current value**: `src` ❌
4. **Change to**: `lms-backend` ✅
5. Click **"Save Changes"**

### Step 3: Verify Other Settings

While you're in Settings, confirm these are correct:

| Setting | Correct Value |
|---------|---------------|
| **Root Directory** | `lms-backend` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |

### Step 4: Clear Cache and Redeploy

1. Scroll down to **"Manual Deploy"** section
2. Click **"Clear build cache & deploy"**
3. Wait for deployment to complete (~5 minutes)

---

## 📊 Understanding the Directory Structure

Your GitHub repository structure:
```
your-repo/
├── devrecruitSchool/        ← Frontend
│   └── ...
└── lms-backend/             ← Backend (THIS is Root Directory!)
    ├── package.json
    ├── src/
    │   ├── server.ts
    │   └── ...
    └── dist/                ← Built files go here
        ├── server.js        ← Entry point after build
        └── ...
```

When Root Directory is set to `lms-backend`:
- Render changes to: `/opt/render/project/lms-backend/`
- Then runs: `npm install && npm run build`
- Build creates: `dist/server.js`
- Start command runs: `node dist/server.js`
- Full path: `/opt/render/project/lms-backend/dist/server.js` ✅

When Root Directory is set to `src` (WRONG):
- Render changes to: `/opt/render/project/src/`
- No `package.json` found at that level
- Tries to run: `node dist/server.js`
- Full path: `/opt/render/project/src/dist/server.js` ❌
- **Error**: File doesn't exist!

---

## 🚨 Alternative: If Root Directory Field is Empty

If you deployed with `render.yaml`, the Root Directory might be empty.

### Check Your Repository Structure

**Option A**: Backend is in `lms-backend/` subfolder
- Set Root Directory: `lms-backend`

**Option B**: Backend is at repository root
- Leave Root Directory: **empty** or `.`
- But your repo structure shows backend is in `lms-backend/`, so use Option A

---

## 📝 Expected Build Logs After Fix

### Successful Build:
```
==> Cloning from https://github.com/your-username/your-repo
==> Using root directory: lms-backend
==> Running 'npm install && npm run build'
npm install
...
npm run build
✔ Generated Prisma Client
[TypeScript compilation successful]
==> Build successful!
==> Starting service with 'npm start'
🚀 Server running on port 10000
🌍 Environment: production
```

### What You're Currently Seeing (Wrong):
```
==> Using root directory: src
==> Running 'npm start'
Error: Cannot find module '/opt/render/project/src/dist/server.js'
```

---

## ✅ Quick Checklist

Before redeploying, verify in Render Dashboard:

- [ ] Root Directory is set to: `lms-backend`
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npm start`
- [ ] All environment variables are added (DATABASE_URL, JWT secrets, etc.)
- [ ] Clicked "Save Changes"
- [ ] Clicked "Clear build cache & deploy"

---

## 🎯 After the Fix

Once Root Directory is corrected:

1. ✅ Build will find `package.json` correctly
2. ✅ TypeScript will compile to `dist/`
3. ✅ `npm start` will run `node dist/server.js`
4. ✅ File will exist at `/opt/render/project/lms-backend/dist/server.js`
5. ✅ Server will start successfully!

---

## 🔍 How to Verify Root Directory is Correct

In the deploy logs, look for:
```
==> Using root directory: lms-backend
```

If you see:
```
==> Using root directory: src
```
or anything else, **it's wrong!**

---

## 💡 Why This Happened

Most likely one of these:

1. **Manual Setup**: When creating the service, you typed `src` in Root Directory field
2. **render.yaml**: The file has `rootDir: src` (but we fixed this in code)
3. **Auto-detection**: Render guessed wrong based on repository structure

The fix is simple: Just change it in Dashboard Settings!

---

## ⚡ TL;DR - Quick Fix

1. Render Dashboard → Your Service → **Settings**
2. Find **Root Directory** field
3. Change from `src` to `lms-backend`
4. Click **"Save Changes"**
5. Click **"Clear build cache & deploy"**

**Done!** ✅

---

## 📞 Still Having Issues?

If after changing Root Directory you still get errors:

1. **Double-check** the field shows exactly: `lms-backend` (no spaces, correct spelling)
2. **Verify** your GitHub repo has the `lms-backend/` folder at the root level
3. **Confirm** `package.json` exists at `lms-backend/package.json` in your repo
4. **Check** build logs for "Using root directory: lms-backend"

If logs still show wrong directory, try:
- Delete the service and create a new one with correct settings
- Or contact Render support

---

**This is the ONLY fix needed!** Once Root Directory is correct, your deployment will work. 🚀
