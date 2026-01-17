# Netlify Setup Guide

This guide walks you through setting up Netlify Functions and Blobs for the workout app backup feature.

## Prerequisites

- A Netlify account (free tier works fine)
- Your workout app deployed to Netlify (or ready to deploy)

## Step-by-Step Setup

### 1. Deploy Your Site to Netlify

If you haven't already:

1. **Connect your repository:**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click **"Add new site"** → **"Import an existing project"**
   - Connect your Git provider (GitHub, GitLab, etc.)
   - Select your `workout-app` repository

2. **Configure build settings:**
   - **Build command:** `npm run build` (or leave empty if no build needed)
   - **Publish directory:** `/` (root directory)
   - Click **"Deploy site"**

### 2. Enable Netlify Blobs

Netlify Blobs is automatically available when you deploy Functions. No extra setup needed!

### 3. Verify Your Function is Deployed

After deployment:

1. Go to your site dashboard on Netlify
2. Click **"Functions"** in the left sidebar
3. You should see `backup` listed under **"Functions"**
4. If you don't see it, make sure:
   - Your `netlify/functions/backup.js` file is in the repository
   - The function was included in your last deploy

### 4. Test the Backup Feature

1. Open your deployed site
2. Go to the **"Cloud Backup"** section
3. You should see a backup key (auto-generated)
4. Click **"Backup to Netlify"** to test
5. Check the status message - it should say "✓ Backed up X sessions to Netlify"

## Troubleshooting

### Function Not Found (404)

- Make sure `netlify/functions/backup.js` exists in your repo
- Redeploy your site after adding the function
- Check the Functions tab in Netlify dashboard

### Backup Fails

- Check the browser console for errors
- Verify your Netlify site has Functions enabled (should be automatic)
- Make sure `@netlify/blobs` is in your `package.json` dependencies

### Local Testing

To test locally before deploying:

```bash
# Install Netlify CLI (if not already installed)
npm install -g netlify-cli

# Run local dev server
netlify dev
```

This will:
- Start a local server
- Make Functions available at `/.netlify/functions/backup`
- Simulate the Netlify environment

## What Gets Stored?

- **Location:** Netlify Blobs storage (managed by Netlify)
- **Key:** Your backup key (keep it private!)
- **Data:** Your workout history in JSON format
- **Access:** Anyone with the backup key can access the backup

## Security Notes

- The backup key is your only security - keep it private
- Don't share your backup key publicly
- Each backup key is independent - different keys = different backups
- Backups are stored in Netlify's infrastructure (secure, but not encrypted by default)

## That's It!

Once deployed, your backup feature should work automatically. No additional configuration needed on Netlify's side - Functions and Blobs are enabled by default for all Netlify sites.
