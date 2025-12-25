# Render Deployment Checklist

Use this checklist to ensure your LMS backend is properly configured for Render deployment.

## Pre-Deployment

### Code Preparation
- [x] `.env.example` file created with all required variables
- [x] `.gitignore` includes `.env` file
- [x] Health check endpoint added (`/api/health`)
- [x] CORS configured for production
- [x] Production-ready build scripts in `package.json`
- [x] Prisma schema configured for PostgreSQL
- [ ] All code committed to Git repository
- [ ] Repository pushed to GitHub/GitLab/Bitbucket

### Database Setup
- [ ] Aiven PostgreSQL database created
- [ ] Database connection string obtained
- [ ] Connection string includes `?sslmode=require`
- [ ] Test database connection locally (update `.env` and run `npm run dev`)

### Environment Variables Ready
- [ ] `DATABASE_URL` - Aiven PostgreSQL connection string
- [ ] `JWT_ACCESS_SECRET` - Generated secure random string
- [ ] `JWT_REFRESH_SECRET` - Generated secure random string
- [ ] `SMTP_HOST` - Email service configured
- [ ] `SMTP_PORT` - Usually 587
- [ ] `SMTP_USER` - Email username/API key
- [ ] `SMTP_PASS` - Email password
- [ ] `SMTP_FROM` - From email address
- [ ] `CLOUDINARY_CLOUD_NAME` - Cloudinary account name
- [ ] `CLOUDINARY_API_KEY` - Cloudinary API key
- [ ] `CLOUDINARY_API_SECRET` - Cloudinary API secret
- [ ] `FRONTEND_URL` - Your frontend URL
- [ ] `NODE_TLS_REJECT_UNAUTHORIZED` - Set to 0 for Aiven

## Deployment on Render

### Create Web Service
- [ ] Logged into [Render Dashboard](https://dashboard.render.com)
- [ ] Clicked "New +" → "Web Service"
- [ ] Connected GitHub repository
- [ ] Selected correct repository and branch

### Service Configuration
- [ ] **Name**: Set service name (e.g., `lms-backend`)
- [ ] **Region**: Selected appropriate region
- [ ] **Branch**: Set to `main` or deployment branch
- [ ] **Root Directory**: Set to `lms-backend` (if monorepo)
- [ ] **Runtime**: Node
- [ ] **Build Command**: `npm install && npm run build`
- [ ] **Start Command**: `npm start`
- [ ] **Plan**: Selected appropriate plan (Free/Starter/Standard)

### Environment Variables
- [ ] All environment variables added in Render dashboard
- [ ] Sensitive values properly set (not default/example values)
- [ ] `NODE_ENV` set to `production`
- [ ] `PORT` - Let Render set automatically (or use default)
- [ ] Database URL tested and working

### Advanced Settings
- [ ] **Health Check Path**: `/api/health`
- [ ] **Auto-Deploy**: Enabled (if desired)
- [ ] **Build Filters**: Configured (optional)

### Deploy
- [ ] Clicked "Create Web Service"
- [ ] Watched build logs for errors
- [ ] Build completed successfully
- [ ] Service started without errors

## Post-Deployment

### Run Database Migrations
- [ ] Opened Render Shell (Dashboard → Shell tab)
- [ ] Ran `npm run migrate:deploy`
- [ ] Migrations completed successfully
- [ ] No migration errors in logs

### Verify Deployment
- [ ] Health check endpoint working: `https://your-app.onrender.com/api/health`
- [ ] API docs accessible: `https://your-app.onrender.com/api-docs`
- [ ] Test authentication endpoint
- [ ] Test a course endpoint
- [ ] Check logs for any errors

### Database Seeding (Optional)
- [ ] Opened Render Shell
- [ ] Ran `npm run seed` (if needed)
- [ ] Verified seed data in database

### Frontend Integration
- [ ] Updated frontend `.env` with new backend URL
- [ ] Example: `VITE_API_BASE_URL=https://your-app.onrender.com/api`
- [ ] Tested frontend → backend connection
- [ ] Verified CORS is working correctly
- [ ] Tested login/registration flow
- [ ] Tested file uploads
- [ ] Tested course enrollment

## Testing

### API Endpoints
- [ ] Test `/api/health` - Should return 200 OK
- [ ] Test `/api/auth/register` - User registration
- [ ] Test `/api/auth/login` - User login
- [ ] Test `/api/auth/refresh` - Token refresh
- [ ] Test protected endpoints with JWT
- [ ] Test instructor course creation
- [ ] Test student course enrollment
- [ ] Test file upload (Cloudinary)
- [ ] Test email sending (SMTP)

### Performance
- [ ] Check response times (acceptable for your use case)
- [ ] Monitor cold start time (free tier only)
- [ ] Check memory usage in Render dashboard
- [ ] Review logs for warnings or errors

## Monitoring & Maintenance

### Setup Monitoring
- [ ] Reviewed Render metrics dashboard
- [ ] Set up error alerts (optional)
- [ ] Configured uptime monitoring (e.g., UptimeRobot)
- [ ] Added logging service (e.g., Sentry, LogRocket)

### Documentation
- [ ] Documented backend URL for team
- [ ] Updated API documentation
- [ ] Shared environment variables with team (securely)
- [ ] Created runbook for common issues

### Backups
- [ ] Verified Aiven automatic backups enabled
- [ ] Tested database restore procedure
- [ ] Documented backup recovery process

## Optional Enhancements

### Custom Domain
- [ ] Purchased domain name
- [ ] Added custom domain in Render
- [ ] Updated DNS records
- [ ] SSL certificate automatically provisioned
- [ ] Updated `BASE_URL` and `APP_URL` environment variables

### CI/CD Pipeline
- [ ] Set up GitHub Actions (optional)
- [ ] Configure automated testing
- [ ] Set up staging environment
- [ ] Configure branch-specific deployments

### Security Enhancements
- [ ] Review and tighten CORS settings
- [ ] Set up rate limiting (already in code)
- [ ] Enable request logging
- [ ] Set up security headers
- [ ] Configure DDoS protection (Cloudflare, etc.)

### Performance Optimization
- [ ] Enable connection pooling (already configured)
- [ ] Set up caching (Redis, if needed)
- [ ] Optimize database queries
- [ ] Add database indexes for common queries
- [ ] Configure CDN for static assets

## Troubleshooting

If you encounter issues, check:

1. **Build Failures**
   - Review build logs in Render dashboard
   - Verify `package.json` scripts are correct
   - Ensure all dependencies are listed

2. **Database Connection Issues**
   - Verify `DATABASE_URL` is correct
   - Check `NODE_TLS_REJECT_UNAUTHORIZED=0` is set
   - Test connection string locally first

3. **Runtime Errors**
   - Check application logs in Render
   - Verify all environment variables are set
   - Test endpoints with curl or Postman

4. **CORS Errors**
   - Verify `FRONTEND_URL` matches actual frontend
   - Check CORS configuration in `src/app.ts`
   - Test with browser dev tools

5. **Cold Starts (Free Tier)**
   - Service spins down after 15 minutes
   - First request after spin-down takes ~30 seconds
   - Consider upgrading to paid tier

## Quick Reference

### Render Dashboard URLs
- Dashboard: https://dashboard.render.com
- Your service: https://dashboard.render.com/web/[service-id]
- Logs: [Service] → Logs tab
- Shell: [Service] → Shell tab
- Environment: [Service] → Environment tab

### Important Commands
```bash
# In Render Shell
npm run migrate:deploy  # Run migrations
npm run seed           # Seed database
npm start              # Start server (automatic)
node dist/src/server.js # Alternative start
```

### Test Endpoints
```bash
# Health check
curl https://your-app.onrender.com/api/health

# API docs
open https://your-app.onrender.com/api-docs

# Test auth
curl -X POST https://your-app.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","role":"STUDENT"}'
```

---

**Status**: Ready for deployment! Follow this checklist step by step.

**Estimated Time**: 30-45 minutes for first deployment

**Support**: Refer to `DEPLOYMENT.md` for detailed instructions
