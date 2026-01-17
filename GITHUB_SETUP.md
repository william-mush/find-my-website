# Push to GitHub - Step by Step

## Option 1: Create Repository via GitHub Website (Easiest)

### Step 1: Create Repository on GitHub

1. Go to [github.com](https://github.com)
2. Click the **+** icon (top right)
3. Click **New repository**
4. Fill in:
   - **Repository name**: `find-my-website`
   - **Description**: `Domain recovery platform - analyze domains, view history, generate recovery scripts`
   - **Public** or **Private** (your choice)
   - ⚠️ **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **Create repository**

### Step 2: Push Your Code

GitHub will show you commands. Use these:

```bash
# Add GitHub as remote
git remote add origin https://github.com/YOUR_USERNAME/find-my-website.git

# Push to GitHub
git push -u origin main
```

**Replace `YOUR_USERNAME`** with your actual GitHub username!

### Step 3: Verify

1. Refresh your GitHub repository page
2. You should see all your files! ✅

---

## Option 2: Create Repository via GitHub CLI

If you have `gh` CLI installed:

```bash
# Create repo and push in one command
gh repo create find-my-website --public --source=. --push

# Or for private repo
gh repo create find-my-website --private --source=. --push
```

---

## What Gets Pushed

Your repository will include:

```
find-my-website/
├── .env.example          ✅ (safe to commit)
├── .gitignore           ✅
├── README.md            ✅
├── DEPLOYMENT.md        ✅
├── PROJECT_OVERVIEW.md  ✅
├── QUICK_START.md       ✅
├── app/                 ✅ (all your code)
├── components/          ✅
├── lib/                 ✅
├── package.json         ✅
└── ... (all source files)

NOT pushed (in .gitignore):
├── .env                 ❌ (contains secrets)
├── node_modules/        ❌ (too large)
├── .next/              ❌ (build output)
└── drizzle/            ❌ (migration files)
```

---

## Troubleshooting

### "remote origin already exists"

If you see this error:

```bash
# Remove old remote
git remote remove origin

# Add new remote
git remote add origin https://github.com/YOUR_USERNAME/find-my-website.git

# Push
git push -u origin main
```

### "Permission denied (publickey)"

You need to set up SSH keys or use HTTPS:

**Option A: Use HTTPS (easier)**
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/find-my-website.git
git push -u origin main
```

**Option B: Set up SSH keys**
1. Follow [GitHub SSH guide](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
2. Then push with SSH URL

### "Branch 'main' doesn't exist"

If your default branch is 'master':

```bash
# Rename to main
git branch -M main

# Then push
git push -u origin main
```

---

## After Pushing

### View Your Repository

Your code is now at:
`https://github.com/YOUR_USERNAME/find-my-website`

### Next Steps

✅ Code is on GitHub
⏭️ **Next: Deploy to Vercel** (see DEPLOYMENT.md)

### Keep It Updated

When you make changes:

```bash
# Make changes to code
# ...

# Stage changes
git add -A

# Commit
git commit -m "Description of changes"

# Push to GitHub
git push
```

### Branch Strategy (Optional)

For larger changes, use branches:

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes, commit
git add -A
git commit -m "Add new feature"

# Push branch
git push -u origin feature/new-feature

# Create Pull Request on GitHub
# Merge when ready
```

---

## Repository Settings (Recommended)

After pushing, configure your repo:

### 1. Add Topics

On GitHub repository page:
- Click ⚙️ next to "About"
- Add topics: `nextjs`, `typescript`, `domain-recovery`, `wayback-machine`, `whois`

### 2. Set Description

Update repository description:
```
🔍 Find My Website - Comprehensive domain recovery platform. Analyze domains, view Wayback Machine history, generate recovery scripts.
```

### 3. Add Website URL

After deploying to Vercel, add the live URL to your repo.

### 4. Enable Issues (Optional)

Settings → General → Features → Check "Issues"

---

## What's Next?

✅ Your code is on GitHub!

**Now deploy to Vercel**: See `DEPLOYMENT.md`

Or run locally:
```bash
npm run dev
```

🎉 **You're all set!**
