# Cloudflare Pages Setup

This guide walks you through creating a free Cloudflare account and connecting your GitHub repository to Cloudflare Pages for automatic deployment.

## Prerequisites

- A GitHub account with access to the `low-ghost/mike-bagwell-site` repository
- The repository should be ready to build (Astro project with `package.json`)

## Step 1: Create a Free Cloudflare Account

1. Go to [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
2. Enter your email address and create a password
3. Verify your email address by clicking the link sent to your inbox
4. Log in to the Cloudflare dashboard

**Cost confirmation:** Cloudflare Pages is completely free for static sites with unlimited bandwidth and builds. You will NOT be charged for hosting this site.

## Step 2: Create a Cloudflare Pages Project

1. In the Cloudflare dashboard, click **Pages** in the left sidebar (under "Workers & Pages")
2. Click the **Create application** button
3. Select the **Pages** tab
4. Click **Connect to Git**

## Step 3: Connect Your GitHub Repository

1. Click **Connect GitHub** (you may need to authorize Cloudflare's GitHub App)
2. In the authorization screen:
   - Select **Only select repositories**
   - Choose `low-ghost/mike-bagwell-site` from the dropdown
   - Click **Install & Authorize**
3. Back in Cloudflare, you should now see your repository listed
4. Click **Begin setup** next to `low-ghost/mike-bagwell-site`

## Step 4: Configure Build Settings

On the "Set up builds and deployments" page, configure the following:

### Project name
- Enter: `mike-bagwell-site` (or your preferred subdomain — this becomes `<name>.pages.dev`)

### Production branch
- Select: `main` (or whatever your primary branch is named)

### Framework preset
- Select: **Astro** from the dropdown
  - This will auto-populate the build settings below

### Build settings
The Astro preset should auto-fill these, but verify:

- **Build command:** `npm run build`
- **Build output directory:** `dist`

### Environment variables (optional)
- **Node version:** Add an environment variable if you need a specific Node version:
  - Variable name: `NODE_VERSION`
  - Value: `20` (or `18`, depending on your local Node version)
  - Click **Add variable**

> **Note:** Cloudflare Pages uses Node 18 by default as of 2026. If your local `node --version` is different and you encounter build errors, set `NODE_VERSION` explicitly.

### Root directory
- Leave blank (the build runs from the repository root)

## Step 5: Deploy

1. Click **Save and Deploy**
2. Cloudflare will begin the first build immediately
3. Wait for the build to complete (typically 1-3 minutes)

### Monitoring the Build

- You'll see a build log in real-time showing npm install, build steps, and asset uploads
- If the build succeeds, you'll see: ✅ **Success! Your site has been deployed**
- If it fails, the log will show the error (usually a missing dependency or build command issue)

## Step 6: Verify Your Site

1. Once deployed, Cloudflare will show your **Pages URL**: `https://<project-name>.pages.dev`
2. Click the link to open your site
3. Verify that the site loads correctly with all images and pages working
4. Bookmark this URL — you'll use it to verify everything works before the DNS cutover

## How Auto-Deploy Works

From now on, **every time you push to GitHub:**

1. Cloudflare detects the new commit
2. A new build automatically starts
3. If successful, the new version goes live within 1-3 minutes
4. You can view all builds under **Workers & Pages > [your project] > Deployments**

### Branch Previews

- Commits to non-production branches create **preview deployments** with unique URLs
- Great for testing changes before merging to `main`
- Preview URLs look like: `https://<branch>.<project-name>.pages.dev`

## Viewing Build Logs

To check past builds or debug failures:

1. Go to **Workers & Pages** in the Cloudflare dashboard
2. Click your project name (`mike-bagwell-site`)
3. Click the **Deployments** tab
4. Click any deployment to view its full build log

## Free Tier Confirmation

Cloudflare Pages free tier includes:

- ✅ Unlimited static requests (bandwidth is unmetered)
- ✅ Unlimited builds
- ✅ 500 builds per month with unlimited concurrent builds
- ✅ Automatic SSL certificate
- ✅ Global CDN distribution
- ✅ DDoS protection
- ✅ Web Analytics (opt-in, but also free)

**You will NOT be charged** for hosting this static Astro site. Cloudflare Pages is designed for exactly this use case and is free forever for static hosting.

> **Staying Free:** Do NOT add Cloudflare Workers (serverless functions), R2 storage, or other paid products to this project unless you understand their billing. For this static site, you're using **only** Pages, which is completely free.

## Next Steps

Once your site is deployed and verified at `<project-name>.pages.dev`, proceed to:

- **[02-dns-cutover.md](./02-dns-cutover.md)** — Point your custom domain (`mikebagwell.me`) to Cloudflare Pages

---

**Need help?** Cloudflare Pages documentation: https://developers.cloudflare.com/pages/
