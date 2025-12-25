# LMS Backend - Render Deployment Guide

This guide will help you deploy the LMS Backend to Render with Aiven PostgreSQL.

## Prerequisites

- [Render Account](https://render.com)
- [Aiven PostgreSQL Database](https://aiven.io) (already set up)
- [GitHub Repository](https://github.com) with your code

## Environment Variables Required

The following environment variables must be configured in Render:

### Database
- `DATABASE_URL` - Your Aiven PostgreSQL connection string
- `NODE_TLS_REJECT_UNAUTHORIZED` - Set to `0` for Aiven SSL

### Server Configuration
- `NODE_ENV` - Set to `production`
- `PORT` - Render will set this automatically (default: 5000)
- `BASE_URL` - Your Render app URL (e.g., `https://lms-backend.onrender.com`)
- `APP_URL` - Same as BASE_URL
- `FRONTEND_URL` - Your frontend URL (e.g., `https://devrecschool.netlify.app`)

### JWT Secrets
- `JWT_ACCESS_SECRET` - Secret for access tokens (generate a secure random string)
- `JWT_REFRESH_SECRET` - Secret for refresh tokens (generate a secure random string)

**Generate secure secrets using:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Email Configuration (SMTP)
- `SMTP_HOST` - SMTP server host (e.g., `smtp.zeptomail.com`)
- `SMTP_PORT` - SMTP port (usually `587`)
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password
- `SMTP_FROM` - From email address

### Cloudinary (File Uploads)
- `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Your Cloudinary API key
- `CLOUDINARY_API_SECRET` - Your Cloudinary API secret
- `CLOUDINARY_URL` - Full Cloudinary URL (optional)

### Payment (Optional)
- `FLUTTERWAVE_SECRET_KEY` - Flutterwave payment gateway key

## Deployment Steps

### Option 1: Deploy via Render Dashboard

1. **Create New Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**
   - **Name**: `lms-backend` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your deployment branch)
   - **Root Directory**: `lms-backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

3. **Add Environment Variables**
   - Go to "Environment" tab
   - Add all required variables listed above
   - Copy values from your `.env` file (DO NOT commit .env)

4. **Advanced Settings**
   - **Health Check Path**: `/api/health`
   - **Auto-Deploy**: Enable (optional)

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete (5-10 minutes first time)

### Option 2: Deploy via render.yaml (Infrastructure as Code)

1. **Push Code to GitHub**
   ```bash
   cd lms-backend
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Create New Blueprint Instance**
   - Go to Render Dashboard
   - Click "New +" → "Blueprint"
   - Connect repository
   - Select `lms-backend/render.yaml`
   - Add environment variables (they're marked as `sync: false` for security)

3. **Deploy**
   - Click "Apply"
   - Render will create the service based on render.yaml

## Post-Deployment Steps

### 1. Run Database Migrations

After first deployment, you need to run migrations:

```bash
# Via Render Shell (Dashboard → Shell tab)
npm run migrate:deploy
```

Or add a manual deploy hook:
- Go to Service Settings → "Deploy Hook"
- Create hook
- Run: `curl -X POST [your-deploy-hook-url]`

### 2. Verify Deployment

Check these endpoints:
- Health Check: `https://your-app.onrender.com/api/health`
- API Docs: `https://your-app.onrender.com/api-docs`

### 3. Seed Database (Optional)

If you need initial data:

```bash
# Via Render Shell
npm run seed
```

### 4. Update Frontend

Update your frontend `.env` to point to the new backend:
```
VITE_API_BASE_URL=https://your-app.onrender.com/api
```

## Database Connection String Format

Your Aiven PostgreSQL connection string should look like:
```
postgres://username:password@host:port/database?sslmode=require
```

Example:
```
postgres://avnadmin:password@pg-xxxxx.aivencloud.com:14933/defaultdb?sslmode=require
```

## Troubleshooting

### Build Fails

**Issue**: `prisma generate` fails
- **Solution**: Ensure `DATABASE_URL` is set in environment variables

**Issue**: TypeScript compilation errors
- **Solution**: Check `tsconfig.json` and ensure all dependencies are in `package.json`

### Runtime Errors

**Issue**: Database connection fails
- **Solution**: Verify `DATABASE_URL` is correct and includes `?sslmode=require`
- Check `NODE_TLS_REJECT_UNAUTHORIZED=0` is set

**Issue**: CORS errors
- **Solution**: Ensure `FRONTEND_URL` matches your actual frontend URL
- Check CORS configuration in `src/app.ts`

**Issue**: JWT errors
- **Solution**: Verify `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are set
- Ensure they're the same as used in development (or regenerate and re-login all users)

### Performance Issues

**Issue**: Cold starts (free tier)
- **Solution**: Render free tier spins down after inactivity
- Upgrade to paid tier for always-on service
- Use a cron job to ping `/api/health` every 14 minutes

### Email Not Sending

**Issue**: SMTP connection fails
- **Solution**: Verify all SMTP credentials
- Check SMTP provider allows connections from Render's IP range

## Monitoring

### Logs
- Access logs via Render Dashboard → "Logs" tab
- Real-time log streaming available

### Metrics
- CPU, Memory, and Request metrics in Dashboard
- Set up alerts for high error rates

### Health Checks
- Render automatically monitors `/api/health`
- Service restarts if health check fails repeatedly

## Scaling

### Horizontal Scaling
- Upgrade to paid tier
- Adjust instance type based on load
- Enable auto-scaling in settings

### Database Optimization
- Add indexes for frequently queried fields
- Use connection pooling (already configured with `pg.Pool`)
- Monitor query performance in Aiven console

## Security Checklist

- [ ] All sensitive data in environment variables (not in code)
- [ ] `.env` file is in `.gitignore`
- [ ] Strong JWT secrets (32+ random bytes)
- [ ] HTTPS enforced (automatic on Render)
- [ ] CORS properly configured
- [ ] Database uses SSL (`sslmode=require`)
- [ ] Rate limiting enabled (check `express-rate-limit` in code)

## Backup & Recovery

### Database Backups
- Aiven provides automatic daily backups
- Configure backup retention in Aiven console
- Test restore procedure

### Application Backups
- Code is in Git repository
- Environment variables documented in `.env.example`
- Render keeps deployment history

## Cost Optimization

### Free Tier Limits
- Render Free: 750 hours/month (one service always-on)
- Spins down after 15 minutes of inactivity
- Slow cold starts (~30 seconds)

### Recommendations
- Start with free tier for development
- Upgrade to Starter ($7/month) for production
- Aiven: Use smallest instance that meets needs

## Support & Resources

- [Render Documentation](https://render.com/docs)
- [Aiven Documentation](https://docs.aiven.io)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-production.html)

## Quick Commands Reference

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations (production)
npm run migrate:deploy

# Build for production
npm run build

# Start production server
npm start

# Development mode
npm run dev

# Seed database
npm run seed
```

## Next Steps

1. Deploy and verify the backend is running
2. Run database migrations
3. Update frontend to use new backend URL
4. Test all API endpoints
5. Monitor logs and metrics
6. Set up error tracking (Sentry, LogRocket, etc.)
7. Configure custom domain (optional)
8. Set up CI/CD pipeline (optional)

---

**Need help?** Check the logs first, then refer to the troubleshooting section above.
