# COMPLETE DEPLOYMENT GUIDE - Step by Step

## Overview
You have client access to n8n. Now you need to:
1. Deploy YOUR code to a cloud server (Render)
2. Get the HTTPS endpoint URL
3. Import workflows into client's n8n
4. Configure everything so it works end-to-end

---

## PHASE 1: Initialize Git & Push to GitHub

### Step 1.1: Initialize Git Repository
```bash
cd /home/loganthewise/code/Dutch_festival_scraper

# Initialize git
git init

# Add all files (except .env due to .gitignore)
git add .

# Verify .env is NOT included
git status | grep -i env  # Should return nothing

# Commit
git commit -m "Dutch Festival Scraper - Production Ready"
```

### Step 1.2: Create GitHub Repository
1. Go to github.com
2. Sign in to YOUR account
3. Click "New Repository"
4. Name: `dutch-festival-scraper`
5. Description: "Automated Dutch festival/event scraper for n8n"
6. Make it PUBLIC (Render needs to access it)
7. Click Create

### Step 1.3: Push Code to GitHub
```bash
# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/dutch-festival-scraper.git

# Rename branch to main (if needed)
git branch -M main

# Push code
git push -u origin main

# Verify
git remote -v
# Should show: origin https://github.com/YOUR_USERNAME/dutch-festival-scraper.git
```

**Result:** Your code is now on GitHub. Client can see it.

---

## PHASE 2: Deploy to Render.com

### Step 2.1: Create Render Account
1. Go to **https://render.com**
2. Click "Sign Up"
3. Choose "Sign up with GitHub"
4. Authorize Render to access your GitHub repositories
5. You should see your `dutch-festival-scraper` repo in the list

### Step 2.2: Create Web Service
1. In Render dashboard, click **"New +"**
2. Select **"Web Service"**
3. Find and select your `dutch-festival-scraper` repository
4. Fill in the form:

```
Name:                      dutch-festival-scraper
Environment:              Node
Region:                   Frankfurt (EU-4) [or closest to you]
Branch:                   main
Build Command:            npm run build
Start Command:            npm run server
Plan:                     Free (sufficient for this use case)
```

5. Click **"Create Web Service"**
6. **Wait 3-5 minutes** for deployment

**What's happening:** Render is:
- Pulling your code from GitHub
- Installing dependencies (`npm install`)
- Building TypeScript (`npm run build`)
- Starting server (`npm run server`)
- Assigning you an HTTPS URL

### Step 2.3: Get Your HTTPS Endpoint URL

Once deployment completes:
1. Go to Render dashboard
2. Find your `dutch-festival-scraper` service
3. Look at the top - you'll see a URL like:
   ```
   https://dutch-festival-scraper-xxxxx.onrender.com
   ```
4. **COPY THIS URL** - you'll need it everywhere

**Example:** `https://dutch-festival-scraper-a1b2c3d4.onrender.com`

### Step 2.4: Add Environment Variables to Render

Your `.env` file has secrets. Render needs these as environment variables:

1. In Render dashboard, click on your service
2. Go to **"Environment"** tab
3. Click **"Add Environment Variable"** for each:

```
Name: SUPABASE_URL
Value: https://uphnagrdlnajgqplhcrl.supabase.co

Name: SUPABASE_SERVICE_KEY
Value: [Copy from your .env file]

Name: CLIENT_ENDPOINT
Value: https://uphnagrdlnajgqplhcrl.supabase.co/functions/v1/add-event

Name: CLIENT_API_KEY
Value: [Copy from your .env file]

Name: LOG_LEVEL
Value: info
```

4. Click **"Save"** 
5. Service will auto-restart with new variables

**Important:** Never put `.env` in GitHub. Render gets secrets via environment variables.

---

## PHASE 3: Test Your Deployment

### Step 3.1: Health Check
```bash
curl https://dutch-festival-scraper-XXXXX.onrender.com/health
```

**Expected response:**
```json
{"status":"ok"}
```

### Step 3.2: Trigger Scraper Manually
```bash
curl -X POST https://dutch-festival-scraper-XXXXX.onrender.com/run
```

**Expected response:**
```json
{
  "success": true,
  "eventsCollected": 29,
  "eventsSent": 0,
  "timestamp": "2025-12-04T...",
  "error": null
}
```

If you get errors, check **Render Logs** (click service → "Logs" tab)

---

## PHASE 4: Full Sync (One-Time Initial Load)

### Step 4.1: Run Full Sync
This sends ALL ~1200 Dutch festivals to the client's database.

```bash
curl -X POST https://dutch-festival-scraper-XXXXX.onrender.com/sync-all
```

**Expected response:**
```json
{
  "success": true,
  "message": "Full synchronization complete",
  "eventsSent": 1247,
  "eventsCollected": 1247,
  "timestamp": "2025-12-04T..."
}
```

**What just happened:**
- Scraped FestivalFans + TicketSwap
- Removed duplicates
- Sent ALL events to client's HTTP endpoint
- Marked all as processed in Supabase

**This should only be run ONCE.** After this, use `/run` (incremental).

---

## PHASE 5: Update n8n Workflows with Your URL

### Step 5.1: Edit Both Workflow JSONs

You have two files:
- `n8n-workflow-incremental.json` (production - every 2 hours)
- `n8n-workflow-full-sync.json` (optional - initial load)

Edit BOTH files. Replace `YOUR_RENDER_URL_HERE` with your actual Render URL:

**In `n8n-workflow-incremental.json`:**

Find this line (around line 18):
```json
"url": "=https://YOUR_RENDER_URL_HERE/run",
```

Replace with (example):
```json
"url": "=https://dutch-festival-scraper-a1b2c3d4.onrender.com/run",
```

**In `n8n-workflow-full-sync.json`:**

Find this line (around line 18):
```json
"url": "=https://YOUR_RENDER_URL_HERE/sync-all",
```

Replace with:
```json
"url": "=https://dutch-festival-scraper-a1b2c3d4.onrender.com/sync-all",
```

### Step 5.2: Save Both Files

After editing, save both JSON files locally.

---

## PHASE 6: Import Workflows to Client's n8n

### Step 6.1: Access Client's n8n Dashboard

The client sent you an invite. You should have access to:
- **URL:** Your n8n instance (likely https://app.n8n.cloud or self-hosted)
- **Your n8n account:** Logged in

### Step 6.2: Import Workflow 1 (Full Sync - Optional but Recommended)

1. In n8n dashboard, click **"Workflows"**
2. Click **"New Workflow"** or **"Import Workflow"**
3. If prompted, choose **"Import from JSON"**
4. Upload or paste contents of `n8n-workflow-full-sync.json`
5. Click **"Import"**
6. You'll see a simple workflow:
   - Manual Trigger (start button)
   - HTTP Request node (POST to /sync-all)
7. Click **"Save"**
8. Name it: `Dutch Festival Collector - Full Sync (Initial Load Only)`
9. **Test it once:**
   - Click the "Test Workflow" button
   - Should execute and send all events
   - Check your server logs to verify

**Purpose:** Populates database with ALL festivals on first day.

### Step 6.3: Import Workflow 2 (Incremental - Production)

1. Click **"New Workflow"**
2. Choose **"Import from JSON"**
3. Upload or paste contents of `n8n-workflow-incremental.json`
4. Click **"Import"**
5. You'll see a simple workflow:
   - Schedule Trigger (Cron: every 2 hours)
   - HTTP Request node (POST to /run)
6. Click **"Save"**
7. Name it: `Dutch Festival Collector - Every 2 Hours`
8. **Verify the Cron expression:**
   - Click the Schedule trigger node
   - Check: `0 */2 * * *` (means: every 2 hours)
9. **Activate the workflow:**
   - Top-right, toggle **"Active"** to ON
   - Status should show: "Workflow is active"

**Purpose:** Runs every 2 hours automatically, sending only NEW events.

---

## PHASE 7: Configure Access & Credentials (For Client)

### Step 7.1: What Client Needs Access To

**1. Client's HTTP Endpoint**
- URL where events are sent: `https://uphnagrdlnajgqplhcrl.supabase.co/functions/v1/add-event`
- Your server posts events here automatically
- Client already set this up

**2. Supabase Dashboard (For Monitoring)**
- Where: https://supabase.com/dashboard/projects
- Client can view `processed_events` table
- Tracks which events have been sent

**3. Render Dashboard (For Monitoring)**
- Where: https://render.com
- Shows real-time server logs
- Shows if API is running/crashed

**4. n8n Workflows (For Scheduling)**
- Already imported
- Client can edit Cron expression if needed
- Can view execution history

### Step 7.2: What You Need to Give Client

Create a document with:

```
DEPLOYMENT COMPLETE - Here's What You Need

HTTP API Endpoint (Production):
https://dutch-festival-scraper-a1b2c3d4.onrender.com

Three Endpoints:
1. GET  /health           → Verify server is running
2. POST /run              → Incremental sync (called every 2 hours)
3. POST /sync-all         → Full sync (one-time, already completed)

n8n Workflows (Both Activated):
1. "Dutch Festival Collector - Full Sync" → Manual trigger (initial load)
2. "Dutch Festival Collector - Every 2 Hours" → Automatic (production)

Monitoring:
- Render logs: https://render.com [service dashboard]
- n8n logs: View in workflow executions
- Supabase: Check processed_events table

Credentials (Already Configured):
- SUPABASE_URL: https://uphnagrdlnajgqplhcrl.supabase.co
- CLIENT_ENDPOINT: https://uphnagrdlnajgqplhcrl.supabase.co/functions/v1/add-event
- All other vars: Set in Render environment

Events are automatically sent every 2 hours to your database.
New events only (deduplication tracking in Supabase).
```

---

## PHASE 8: End-to-End Testing

### Step 8.1: Verify First Run

1. Go to client's n8n dashboard
2. Click on "Dutch Festival Collector - Every 2 Hours" workflow
3. Click the **"Execute Workflow"** button (or wait for next 2-hour interval)
4. Watch execution in real-time
5. Should show:
   - HTTP Request completed successfully
   - Response status: 200 OK
   - Response body: `{"success":true, "eventsSent":X, ...}`

### Step 8.2: Check Supabase

1. Go to Supabase dashboard
2. Navigate to table: `processed_events`
3. Should see rows with `sleukel` (event keys)
4. Verify count matches what n8n reported

### Step 8.3: Check Render Logs

1. Go to Render dashboard
2. Click service: `dutch-festival-scraper`
3. Click "Logs" tab
4. Should see output like:
   ```
   [INFO] 📡 HTTP /run endpoint called - incremental sync
   [INFO] 🕷️  Running 2 scrapers...
   [INFO] Found 29 already processed events
   [INFO] Sending 0 new events to endpoint...
   ```

### Step 8.4: Verify Data Flow

Check that your events actually reached client's endpoint:
1. Go to client's Supabase dashboard
2. Check their `events` table (or wherever they save)
3. Should see new festival/event records appearing

---

## PHASE 9: Handoff to Client

### What to Send Client

1. **DELIVERY_INDEX.md** - Master reference document
2. **CLIENT_HANDOFF_EN.md** or **_NL.md** - Depending on language
3. **Credentials Document** (from Phase 7.2)
4. **List of Endpoints** (from Phase 7.2)
5. **Monitoring Instructions** (from Phase 7.2)

### What Client Needs to Know

```
YOUR SYSTEM IS LIVE

Starting Point:
- n8n workflows are activated
- API is deployed and running
- Full sync already completed
- Next automatic run: [in 2 hours from now]

Daily Operation:
- Every 2 hours: n8n triggers /run endpoint
- Your server scrapes, deduplicates, and sends new events
- Events appear in your database automatically
- No manual intervention needed

Monitoring:
- Check n8n execution logs for errors
- Check Render logs if events aren't appearing
- Check Supabase for event records

If Anything Goes Wrong:
1. Check n8n workflow execution history
2. Check Render logs for error messages
3. Verify HTTPS endpoint is accessible: curl [URL]/health
4. Check Supabase database connection

Support:
- All documentation in DELIVERY_INDEX.md
- All guides provided during setup
```

---

## PHASE 10: Ongoing Maintenance (What Client Does)

### Daily/Weekly
- Monitor n8n execution logs (should run every 2 hours)
- Monitor Supabase for incoming events
- No code changes needed

### If Issues Arise
1. Check Render logs first (server issues)
2. Check n8n execution logs (workflow issues)
3. Test /health endpoint: `curl [URL]/health`
4. Review QUICK_START.md for troubleshooting

### If Scaling Needed
- Add more event sources
- Adjust Cron schedule
- Increase Render plan (paid tier)

---

## Summary: What Just Happened

✅ Your code deployed to Render (HTTPS endpoint live)
✅ n8n workflows imported to client's account
✅ Workflows connected to your API endpoint
✅ Full sync completed (all festivals sent initially)
✅ Incremental sync activated (every 2 hours)
✅ Client can monitor via n8n + Render + Supabase
✅ Everything is automated and hands-off

**Result:** Every 2 hours, NEW Dutch festivals automatically appear in client's database. Forever.

---

## Quick Command Reference

```bash
# Test health
curl https://YOUR_URL/health

# Trigger full sync (one-time)
curl -X POST https://YOUR_URL/sync-all

# Trigger incremental (test)
curl -X POST https://YOUR_URL/run

# Check Render logs
# Go to: https://render.com → service → Logs

# Check n8n logs
# Go to: n8n dashboard → Workflows → Execution history
```

---

**You're done! System is live and automated.**
