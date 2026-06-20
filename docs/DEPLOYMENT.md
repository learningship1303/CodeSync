# CodeSync Deployment Guide

Complete guide to deploying CodeSync to production.

---

## 📋 Pre-Deployment Checklist

- [ ] All tests passing locally
- [ ] Environment variables configured
- [ ] MongoDB Atlas cluster created
- [ ] Gmail App Password generated
- [ ] Google Gemini API key obtained
- [ ] Vercel account created
- [ ] Render account created
- [ ] Docker Hub account created (optional)
- [ ] Security review completed
- [ ] Performance testing done

---

## 🗄️ Step 1: Database Setup (MongoDB Atlas)

### Create MongoDB Cluster

1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create free cluster
3. Create database user:
   - Username: `codesync_user`
   - Password: Generate strong password
4. Whitelist IP addresses:
   - Vercel IPs
   - Render IPs
   - Your development IP
5. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/codesync`

### Initialize Database

```bash
# Connect and run setup
mongo "mongodb+srv://codesync_user:PASSWORD@cluster.mongodb.net/codesync"

# Collections will be created automatically by Node.js
# Indexes are created on first run
```

---

## 🔑 Step 2: Environment Configuration

### Generate Secrets

```bash
# Generate strong JWT secrets (in terminal)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Run this command twice for JWT_SECRET and JWT_REFRESH_SECRET
```

### Create .env Files

```bash
# Backend .env
cp .env.example .env

# Edit .env with:
MONGODB_URI=mongodb+srv://codesync_user:PASSWORD@cluster.mongodb.net/codesync
JWT_SECRET=<generated-32-char-secret>
JWT_REFRESH_SECRET=<generated-32-char-secret>
GOOGLE_GENERATIVE_AI_KEY=AIzaSy...
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx
NODE_ENV=production
PORT=5000
```

### Gmail App Password

1. Enable 2-Factor Authentication on Gmail
2. Generate App Password:
   - Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Windows Computer"
   - Generate password (16 characters)
   - Use as EMAIL_PASSWORD in .env

---

## 🚀 Step 3: Frontend Deployment (Vercel)

### Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import GitHub repository
4. Select `client` as root directory
5. Framework: React
6. Build command: `npm run build`
7. Output directory: `build`

### Set Environment Variables

In Vercel dashboard:

```
REACT_APP_API_URL=https://api.codesync.com
REACT_APP_SOCKET_URL=wss://api.codesync.com
REACT_APP_ENV=production
```

### Deploy

```bash
# Vercel automatically deploys on push to main
# Or manually:
vercel deploy --prod
```

---

## 🔧 Step 4: Backend Deployment (Render)

### Create Web Service

1. Go to [render.com](https://render.com)
2. New Web Service
3. Connect GitHub repository
4. Settings:
   - Name: `codesync-api`
   - Environment: Node
   - Region: Choose closest
   - Branch: main
   - Build command: `cd server && npm ci && npm run build`
   - Start command: `cd server && npm start`
   - Plan: Standard or higher

### Set Environment Variables

In Render dashboard, add all variables from .env:

```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
GOOGLE_GENERATIVE_AI_KEY=...
EMAIL_USER=...
EMAIL_PASSWORD=...
NODE_ENV=production
PORT=5000
```

### Deploy

```bash
# Render automatically deploys on push to main
# Monitor deployment in dashboard
```

---

## 🐳 Step 5: Docker Setup (Optional)

### Build Execution Environment Image

```bash
# Navigate to project root
cd CodeSync

# Build image
docker build -t codesync/executor:latest -f Dockerfile .

# Test locally
docker run -it codesync/executor:latest /bin/bash

# Push to Docker Hub
docker login
docker tag codesync/executor:latest your-username/codesync-executor:latest
docker push your-username/codesync-executor:latest
```

---

## 🔍 Step 6: Health Checks

### Verify Backend

```bash
# Test health endpoint
curl https://api.codesync.com/health

# Expected response:
# {
#   "status": "CodeSync Core Refined Engine Operational",
#   "poolStatus": "Connected",
#   "timestamp": "2026-06-13T..."
# }
```

### Verify Frontend

```bash
# Visit application
https://codesync.vercel.app

# Check console for errors
# Test features:
# - Register with email
# - Run code execution
# - Test chat
```

### Verify Database

```bash
# From MongoDB Atlas
# Collections tab shows:
# - users
# - rooms
# - chats

# Check for indexes
```

---

## 📊 Step 7: Monitoring & Logging

### Setup Sentry (Error Tracking)

```bash
# 1. Create account at sentry.io
# 2. Create project for Node.js
# 3. Get DSN: https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
# 4. Add to environment variables

SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

### Verify Logs

```bash
# Render dashboard:
# Real-time Logs tab → View all logs

# Vercel dashboard:
# Deployments → Select deployment → Logs

# MongoDB Atlas:
# Data Explorer → View collections and documents
```

---

## 🔐 Step 8: Security Hardening

### HTTPS/SSL

- ✅ Vercel: Automatic SSL
- ✅ Render: Automatic SSL
- ✅ Update REACT_APP_SOCKET_URL to use `wss://` (WebSocket Secure)

### CORS Configuration

Update in `server/src/server.ts`:

```typescript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://codesync.vercel.app'
    : 'http://localhost:3000',
  credentials: true,
}));
```

### Rate Limiting

Already configured in server.ts:
- Global: 300 requests per 15 minutes
- OTP resend: 3 per hour
- Password reset: 5 per day

### Database Security

```bash
# MongoDB Atlas:
# 1. Network Access → Add IP whitelist
# 2. Database Users → Create additional read-only user
# 3. Backup → Enable automatic backups
```

---

## 🚨 Step 9: Error Handling & Recovery

### Common Issues

**"Connection refused" on database**
- Check MongoDB Atlas IP whitelist
- Verify connection string in .env
- Ensure database user has correct permissions

**"Email not sending"**
- Verify Gmail App Password (not account password)
- Check EMAIL_USER and EMAIL_PASSWORD in .env
- Test locally before deploying

**"AI responses failing"**
- Check GOOGLE_GENERATIVE_AI_KEY is valid
- Verify API quota not exceeded
- Test with simpler prompts first

**"Socket.IO connection timeout"**
- Ensure backend health check passes
- Check REACT_APP_SOCKET_URL matches API domain
- Verify CORS allows socket connections

### Rollback Procedure

```bash
# If deployment fails:

# Vercel:
# Deployments → Select previous → Redeploy

# Render:
# Dashboard → Redeploy previous version

# Database:
# MongoDB Atlas has automatic snapshots
# Can restore to previous snapshot
```

---

## 📈 Performance Optimization

### Frontend (Vercel)

```bash
# Optimizations included:
# - Code splitting (React lazy loading)
# - Image optimization
# - CSS minification
# - JavaScript minification
# - Gzip compression
```

### Backend (Render)

```bash
# Node.js optimizations:
# - Process clustering
# - Connection pooling
# - Caching headers
# - Compression middleware
```

### Database (MongoDB Atlas)

```bash
# Optimizations:
# - Indexes on frequently queried fields
# - Sharding for large datasets
# - Read replicas for high traffic
```

---

## 📊 Step 10: Post-Deployment Testing

### Functional Testing

- [ ] User registration with email verification
- [ ] Password reset flow
- [ ] Login and authentication
- [ ] Code execution (JS, Python, C++, Java)
- [ ] Real-time collaboration (file sync, chat)
- [ ] AI copilot (all 8 capabilities)
- [ ] Cursor tracking
- [ ] File operations (create, delete, rename)

### Performance Testing

```bash
# Test response times:
curl -w "\n%{time_total}s\n" https://api.codesync.com/health

# Should be < 500ms

# Load test (optional):
# Use tools like Apache Bench or wrk
ab -n 1000 -c 10 https://api.codesync.com/health
```

### Security Testing

```bash
# Test rate limiting:
for i in {1..350}; do curl https://api.codesync.com/health; done
# Should see 429 (Too Many Requests) after 300 requests

# Test CORS:
curl -H "Origin: https://malicious.com" https://api.codesync.com/health
# Should reject unauthorized origins
```

---

## 🔄 Continuous Deployment

### GitHub Actions Workflow

Already configured in `.github/workflows/deploy.yml`:

1. **Push to main**
   ↓
2. **Run tests**
   ↓
3. **Build Docker image**
   ↓
4. **Deploy frontend to Vercel**
   ↓
5. **Deploy backend to Render**
   ↓
6. **Health check**

### Monitor Deployments

```bash
# GitHub:
# Actions tab → Watch workflow progress

# Vercel:
# Deployments tab → Real-time updates

# Render:
# Dashboard → Deployment history
```

---

## 📞 Support & Troubleshooting

### Getting Help

1. Check logs in respective dashboards
2. Review error messages
3. Check connectivity:
   ```bash
   ping api.codesync.com
   curl https://api.codesync.com/health
   ```
4. Test locally before assuming production issue

### Useful Commands

```bash
# SSH into Render (if needed):
render run bash

# View MongoDB logs:
# MongoDB Atlas → Activity tab

# Check Vercel analytics:
# Analytics tab in Vercel dashboard
```

---

## ✅ Deployment Complete!

Your CodeSync is now live in production! 🎉

**Next Steps**:
1. Monitor applications for 24 hours
2. Collect user feedback
3. Fix any issues that arise
4. Plan Phase 2 features

**Endpoints**:
- Frontend: https://codesync.vercel.app
- Backend API: https://api.codesync.com
- Health check: https://api.codesync.com/health

---

*Last Updated: June 13, 2026*
