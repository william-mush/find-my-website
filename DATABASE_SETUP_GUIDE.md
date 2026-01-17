# Database Setup Guide

Complete guide to set up Vercel Postgres and Upstash Redis for your deployed app.

## Part 1: Set Up Vercel Postgres

### Step 1: Go to Vercel Storage

1. Visit: https://vercel.com/dashboard
2. Click on your **find-my-website** project
3. Click **Storage** tab at the top
4. Click **Create Database**

### Step 2: Create Postgres Database

1. Select **Postgres**
2. Database Name: `findmywebsite-db`
3. Region: Choose closest to your users (e.g., `us-east-1`)
4. Click **Create**

### Step 3: Copy Connection String

1. After creation, click **`.env.local`** tab
2. You'll see something like:
   ```
   POSTGRES_URL="postgres://default:..."
   POSTGRES_PRISMA_URL="postgres://default:..."
   POSTGRES_URL_NON_POOLING="postgres://default:..."
   ```
3. **Copy the `POSTGRES_URL`** - this is your DATABASE_URL

## Part 2: Set Up Upstash Redis

### Step 1: Go to Upstash

1. Visit: https://console.upstash.com
2. Sign up/Login (can use GitHub)

### Step 2: Create Redis Database

1. Click **Create database**
2. Name: `findmywebsite-redis`
3. Type: **Regional** (cheaper)
4. Region: Same as your Vercel Postgres
5. Click **Create**

### Step 3: Copy Redis URL

1. Scroll to **REST API** section
2. Copy **UPSTASH_REDIS_REST_URL**

   OR

3. Go to **Details** tab
4. Copy the connection string (starts with `redis://` or `rediss://`)

## Part 3: Configure Environment Variables in Vercel

### Step 1: Go to Project Settings

1. Go to: https://vercel.com/william-mushs-projects/find-my-website
2. Click **Settings**
3. Click **Environment Variables** in sidebar

### Step 2: Add Variables

Add these environment variables:

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | (paste Vercel Postgres URL) | Production, Preview, Development |
| `REDIS_URL` | (paste Upstash Redis URL) | Production, Preview, Development |
| `WAYBACK_API_URL` | `https://web.archive.org` | Production, Preview, Development |
| `NODE_ENV` | `production` | Production |

**How to Add Each Variable:**
1. Click **Add New**
2. Enter **Name**
3. Enter **Value**
4. Select **Production**, **Preview**, and **Development**
5. Click **Save**

## Part 4: Run Database Migrations

### Option A: Run Locally (Recommended)

Open your terminal:

```bash
cd find-my-website

# Set your production DATABASE_URL temporarily
export DATABASE_URL="<paste-your-vercel-postgres-url-here>"

# Run migrations to create tables
npm run db:push

# You should see: "✓ Pushed schema to database"

# Unset the variable
unset DATABASE_URL
```

### Option B: Use Vercel CLI

```bash
cd find-my-website

# Link to your Vercel project (if not already)
vercel link

# Pull environment variables
vercel env pull .env.production

# Run migrations
npm run db:push
```

## Part 5: Trigger Vercel Redeploy

After environment variables are added:

1. Go to: https://vercel.com/william-mushs-projects/find-my-website
2. Click **Deployments** tab
3. Find latest deployment
4. Click **⋯** menu → **Redeploy**
5. Check **Use existing Build Cache**
6. Click **Redeploy**

**OR** push a new commit:

```bash
# Make a small change or just re-commit
git commit --allow-empty -m "Trigger redeploy with database configured"
git push
```

## Part 6: Verify Everything Works

### Test Your Live Site

1. Visit: https://find-my-website-b58bqsgp0-william-mushs-projects.vercel.app
2. Search for a domain (try `google.com`)
3. You should see:
   - ✅ WHOIS data (via RDAP API)
   - ✅ Wayback Machine snapshots
   - ✅ Domain status analysis
   - ✅ Recovery recommendations

### Check Vercel Logs

If something doesn't work:

1. Go to your Vercel project
2. Click **Deployments**
3. Click on latest deployment
4. Click **Functions** or **Runtime Logs**
5. Look for errors

### Check Database Connection

To verify tables were created:

1. Go to Vercel Dashboard → Storage
2. Click your Postgres database
3. Click **Data** tab
4. You should see tables: `domain_searches`, `whois_data`, etc.

## Troubleshooting

### "Cannot connect to database"

**Check:**
1. DATABASE_URL is set in Vercel environment variables
2. DATABASE_URL format is correct (starts with `postgres://`)
3. Database exists in Vercel Storage
4. Redeployed after adding environment variables

### "Redis connection failed"

**Check:**
1. REDIS_URL is set in Vercel environment variables
2. Redis database exists in Upstash
3. Try both formats: `redis://...` and `rediss://...` (with SSL)

### "WHOIS lookup failed"

**This is normal!** The free RDAP API may not have data for all domains. Try:
- google.com (should work)
- github.com (should work)
- example.com (should work)

### Tables not created

Run migrations again:

```bash
export DATABASE_URL="<your-postgres-url>"
npm run db:push
unset DATABASE_URL
```

## Quick Reference

### Your Database URLs

**Vercel Postgres:**
```
Find at: https://vercel.com/dashboard → Storage → Postgres → .env.local tab
Format: postgres://default:xxxxx@xxxxx.postgres.vercel-storage.com/verceldb
```

**Upstash Redis:**
```
Find at: https://console.upstash.com → Database → Details
Format: rediss://default:xxxxx@xxxxx.upstash.io:6379
```

### Commands

```bash
# Run migrations
npm run db:push

# View database schema
npm run db:studio

# Redeploy to Vercel
vercel --prod

# Check deployment status
vercel ls
```

## What Each Database Does

### Postgres (Primary Database)
- Stores domain search history
- Caches WHOIS data
- Stores historical DNS records
- Tracks recovery attempts
- User data (future)

### Redis (Cache)
- Caches API responses
- Rate limiting (future)
- Session storage (future)
- Real-time features (future)

## Cost Estimate

### Free Tiers:
- **Vercel Postgres**: 256 MB storage, 60 hours compute/month
- **Upstash Redis**: 10,000 commands/day
- **RDAP API**: Free, unlimited
- **Wayback Machine API**: Free, unlimited

Your app should stay within free tiers for moderate use!

## Next Steps After Setup

1. ✅ Test the live site
2. 🎨 Customize the UI
3. 📊 Monitor usage in Vercel dashboard
4. 🔄 Set up monitoring/alerts (optional)
5. 🌐 Add custom domain (optional)

---

**Need help?** Check the troubleshooting section or the main README.md
