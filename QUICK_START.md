# Quick Start Guide - Find My Website

Get up and running in 5 minutes!

## Prerequisites Check

Make sure you have these installed:

```bash
# Check Node.js (need v20+)
node --version

# Check npm
npm --version

# Check Docker
docker --version

# Check Docker Compose
docker compose version
```

If anything is missing:
- **Node.js**: Download from [nodejs.org](https://nodejs.org)
- **Docker**: Download from [docker.com](https://www.docker.com/get-started)

## Installation Steps

### 1. Navigate to Project
```bash
cd find-my-website
```

### 2. Install Dependencies
```bash
npm install
```
*This will take 1-2 minutes*

### 3. Start Databases
```bash
docker compose up -d
```
*Starts PostgreSQL and Redis in the background*

### 4. Set Up Database
```bash
npm run db:push
```
*Creates all necessary database tables*

### 5. Start the App
```bash
npm run dev
```

### 6. Open in Browser
Navigate to: **http://localhost:3000**

## First Search

Try searching for these domains to test:

1. **google.com** - See active domain analysis
2. **archive.org** - See well-archived website
3. **oldwebsite.com** - Try an expired domain

## What You Can Do

### 1. Domain Search
- Enter any domain name
- Get instant analysis
- See WHOIS data, expiry dates, status

### 2. View Wayback Data
- See how many snapshots exist
- View timeline of archives
- Check quality assessment

### 3. Download Recovery Script
- Click "Recovery Guide" tab
- Choose script type:
  - **Bash** - Linux/Mac users
  - **Node.js** - JavaScript developers
  - **Python** - Python users
- Script downloads to your computer

### 4. Recover a Website
Run the downloaded script:

```bash
# Make it executable (Bash only)
chmod +x recover-domain-com.sh

# Run it
./recover-domain-com.sh
```

The script will:
1. Install dependencies
2. Download website from Wayback Machine
3. Clean up archived content
4. Generate recovery report

## Troubleshooting

### Port Already in Use
If port 3000 is busy:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- -p 3001
```

### Database Connection Error
```bash
# Restart Docker containers
docker compose down
docker compose up -d

# Wait 10 seconds, then retry
npm run db:push
```

### WHOIS Not Found
WHOIS lookups use your system's `whois` command:

**macOS**: Already installed
**Linux**: `sudo apt-get install whois`
**Windows**: Use WSL or install via package manager

### No Wayback Snapshots
Some domains may not be archived. Try these well-archived domains:
- google.com
- wikipedia.org
- github.com
- stackoverflow.com

## Next Steps

### Explore the Dashboard
1. Search for a domain
2. Click through all 3 tabs:
   - **Overview**: See domain details
   - **Recovery Guide**: Get action plan
   - **Historical Data**: View timeline

### Try Recovery Script
1. Search for a well-archived domain
2. Download Bash script
3. Run it in a test directory
4. Examine the recovered files

### Check Database
View your database with Drizzle Studio:
```bash
npm run db:studio
```
Opens a web UI at http://localhost:4983

## Environment Variables

Already configured in `.env`:

```bash
DATABASE_URL=postgresql://findmywebsite:findmywebsite@localhost:5432/findmywebsite
REDIS_URL=redis://localhost:6379
WAYBACK_API_URL=https://web.archive.org
```

## Stopping the App

### Stop Development Server
Press `Ctrl+C` in the terminal

### Stop Databases
```bash
docker compose down
```

### Stop Everything
```bash
# Stop dev server (Ctrl+C)
# Then stop Docker
docker compose down
```

## Common Questions

**Q: Can I search for my own domain?**
A: Yes! Search for any domain to see its recovery potential.

**Q: Does this actually download websites?**
A: The recovery scripts do - they run on your computer and download from Wayback Machine.

**Q: Is this free?**
A: The platform is free. Wayback Machine is free. Actual domain recovery costs vary.

**Q: Can I recover a domain I don't own?**
A: The tool shows you HOW to recover it. Actually acquiring the domain requires following the recommended steps (purchase, backorder, etc.).

**Q: How accurate are the cost estimates?**
A: They're realistic ranges based on industry standards. Actual costs may vary.

## Getting Help

1. **Check PROJECT_OVERVIEW.md** - Detailed documentation
2. **Check README.md** - Full project info
3. **Database Issues** - See Troubleshooting above
4. **API Errors** - Check browser console (F12)

## What's Next?

Once you're comfortable:
- Customize the UI in `app/page.tsx`
- Add your own domain status logic
- Integrate paid APIs (SecurityTrails, WhoisXML)
- Deploy to production (Vercel recommended)

---

**Ready to start?**
```bash
npm run dev
```

Then open http://localhost:3000 and search for a domain!
