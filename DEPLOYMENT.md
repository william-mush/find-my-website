# Deployment Guide - Find My Website

## Deploy to Vercel (Recommended)

### Step 1: Push to GitHub

Already done if you're reading this! ✅

### Step 2: Set Up Vercel Postgres (Database)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Storage** in the sidebar
3. Click **Create Database**
4. Select **Postgres**
5. Choose a region (same as your deployment)
6. Click **Create**
7. **Copy the connection string** - you'll need this!

### Step 3: Set Up Upstash Redis (Cache)

1. Go to [upstash.com](https://upstash.com) and sign in
2. Click **Create Database**
3. Choose **Redis**
4. Select a region (same as your deployment)
5. Click **Create**
6. **Copy the Redis URL** - you'll need this!

### Step 4: Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select your **find-my-website** repo
4. Click **Import**

### Step 5: Configure Environment Variables

In the Vercel import screen, add these environment variables:

```bash
# Database (from Vercel Postgres)
DATABASE_URL=<paste-your-vercel-postgres-url>

# Redis (from Upstash)
REDIS_URL=<paste-your-upstash-redis-url>

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# APIs (Optional)
WAYBACK_API_URL=https://web.archive.org
SECURITYTRAILS_API_KEY=
WHOISXML_API_KEY=
```

### Step 6: Deploy

1. Click **Deploy**
2. Wait 2-3 minutes for build
3. Click **Visit** when done

### Step 7: Run Database Migrations

After first deployment:

1. Go to your Vercel project
2. Click **Settings** → **General**
3. Scroll to **Build & Development Settings**
4. Set **Install Command** to:
   ```bash
   npm install && npm run db:push
   ```
5. Click **Save**
6. Trigger a new deployment

**Or** run migrations locally:

```bash
# Set your production DATABASE_URL temporarily
export DATABASE_URL="<your-vercel-postgres-url>"

# Run migrations
npm run db:push

# Unset
unset DATABASE_URL
```

## Vercel Project Settings

### Build Settings
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Development Command**: `npm run dev`

### Environment Variables

Make sure all environment variables are set:
- ✅ DATABASE_URL
- ✅ REDIS_URL
- ✅ NODE_ENV
- ✅ NEXT_PUBLIC_APP_URL
- ✅ WAYBACK_API_URL

### Domains

1. Vercel gives you: `your-app.vercel.app`
2. Add custom domain (optional):
   - Go to **Settings** → **Domains**
   - Add your domain
   - Update DNS records

## Important Notes

### WHOIS Lookups

⚠️ **WHOIS may not work on Vercel** because:
- Vercel serverless functions don't have `whois` command
- System calls are restricted

**Solutions**:
1. Use WhoisXML API (paid) - Add API key to env vars
2. Use a separate WHOIS service
3. Deploy API routes to a VPS (Digital Ocean, AWS EC2)

**Quick Fix**: Modify `lib/external-apis/whois.ts` to use an HTTP WHOIS API instead of system command.

### Database Connection Pooling

For production, use connection pooling:

```typescript
// lib/db/index.ts
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, { schema });
```

### Redis Caching

Upstash Redis is serverless-optimized:
- Auto-scales
- Pay per request
- Global replication available

No special configuration needed!

## Post-Deployment Checklist

- [ ] Visit your deployed site
- [ ] Test domain search
- [ ] Verify Wayback Machine integration works
- [ ] Check database connection (search creates records)
- [ ] Test script generation
- [ ] Check browser console for errors
- [ ] Test on mobile device
- [ ] Set up custom domain (optional)

## Monitoring

### Vercel Analytics

1. Go to **Analytics** tab
2. Enable **Web Analytics**
3. Track:
   - Page views
   - Performance
   - User engagement

### Error Tracking

Add Sentry (optional):

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

## Scaling Considerations

### Free Tier Limits (Vercel)
- 100GB bandwidth/month
- Unlimited deployments
- Serverless function execution: 100 GB-hours

### Database Limits (Vercel Postgres)
- Hobby: 256MB storage, 60 hours compute
- Pro: 512MB+ storage, unlimited compute

### If You Exceed Limits
1. Upgrade Vercel plan
2. Use external database (Supabase, Neon, Railway)
3. Implement aggressive caching

## Alternative Deployments

### Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Click **New Project**
3. Select **Deploy from GitHub**
4. Railway provides:
   - PostgreSQL (built-in)
   - Redis (add from marketplace)
   - Automatic deployments
5. Set environment variables
6. Deploy!

### Deploy to Your Own VPS

1. **Set up server** (Ubuntu 22.04)
2. **Install dependencies**:
   ```bash
   sudo apt update
   sudo apt install nodejs npm postgresql redis-server
   ```
3. **Clone repo**:
   ```bash
   git clone <your-repo>
   cd find-my-website
   npm install
   ```
4. **Set up database**:
   ```bash
   sudo -u postgres createdb findmywebsite
   npm run db:push
   ```
5. **Build and start**:
   ```bash
   npm run build
   npm start
   ```
6. **Set up Nginx reverse proxy**
7. **Configure SSL with Let's Encrypt**

## Troubleshooting

### Build Fails

**Error**: `Module not found`
- Solution: Check `package.json` dependencies
- Run: `npm install` locally first

**Error**: `DATABASE_URL not defined`
- Solution: Add environment variable in Vercel

### Database Connection Fails

**Error**: `Connection refused`
- Solution: Check DATABASE_URL format
- Ensure Vercel Postgres is running
- Check IP allowlist settings

### WHOIS Not Working

**Error**: `whois: command not found`
- Expected on Vercel serverless
- Solution: Use WhoisXML API or external service

### Slow Performance

- Enable Edge Functions for API routes
- Add Redis caching for WHOIS/Wayback data
- Implement request deduplication
- Use CDN for static assets

## Production Optimizations

### 1. Enable Caching

Cache WHOIS and Wayback results:

```typescript
// In API route
const cacheKey = `domain:${domain}`;
const cached = await redis.get(cacheKey);
if (cached) return cached;

// ... fetch data ...

await redis.setex(cacheKey, 3600, data); // Cache 1 hour
```

### 2. Rate Limiting

Add rate limiting to prevent abuse:

```bash
npm install @upstash/ratelimit
```

### 3. Error Monitoring

Add error tracking:
- Sentry
- LogRocket
- Vercel Analytics

### 4. Performance Monitoring

Monitor API response times:
- Vercel Speed Insights
- Custom metrics in Redis

## Security

### Environment Variables

Never commit:
- ✅ `.env` is in `.gitignore`
- ✅ Only `.env.example` is committed
- ✅ Production secrets only in Vercel

### API Security

Add API key authentication (future):
```typescript
if (!request.headers.get('x-api-key')) {
  return new Response('Unauthorized', { status: 401 });
}
```

### Rate Limiting

Implement per-IP rate limits:
- 10 requests/minute for free users
- 100 requests/minute for authenticated

## Support

After deployment, monitor:
- Vercel deployment logs
- Database query performance
- Redis hit rates
- Error rates

---

🎉 **Congratulations!** Your app is live!

Visit your deployed site and start helping users recover their domains!
