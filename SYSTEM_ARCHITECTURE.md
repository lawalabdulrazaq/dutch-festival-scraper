# COMPLETE SYSTEM ARCHITECTURE & DEPLOYMENT FLOW

## Visual Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DEPLOYMENT OVERVIEW                              │
└─────────────────────────────────────────────────────────────────────────────┘

YOUR MACHINE                GITHUB                   RENDER.COM              CLIENT'S n8n
┌──────────────┐         ┌─────────┐              ┌───────────┐           ┌─────────────┐
│ Code Files   │         │         │              │   Server  │           │  n8n        │
│ .ts, .json   │ PUSH    │ Repo    │ AUTO-DEPLOY  │ Node.js   │  HTTP     │  Workflows  │
│              │────────>│         │─────────────>│  Express  │<──────────│             │
│ .env (LOCAL) │         │         │  (Render)    │           │  POST /run│ Cron        │
│ package.json │         │         │              │  HTTPS    │           │ Schedule    │
└──────────────┘         └─────────┘              └───────────┘           └─────────────┘
                                                         │
                                                         │ POST /run
                                                         │ Sends events
                                                         ▼
                                                  ┌──────────────┐
                                                  │ Client's DB  │
                                                  │ (Supabase)   │
                                                  │ Events table │
                                                  └──────────────┘
```

## Step-by-Step Deployment Timeline

```
┌──────────────────────────────────────────────────────────────────────┐
│ STEP 1: Your Machine → GitHub (5 minutes)                            │
├──────────────────────────────────────────────────────────────────────┤
│ git init                                                             │
│ git add .                                                            │
│ git commit -m "Deploy"                                              │
│ git push origin main                                                │
│ ✓ Code is on GitHub (public)                                        │
└──────────────────────────────────────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│ STEP 2: Render.com Account & GitHub Connection (2 minutes)           │
├──────────────────────────────────────────────────────────────────────┤
│ 1. Sign up at render.com with GitHub                                │
│ 2. Authorize Render to access your repos                            │
│ 3. Choose dutch-festival-scraper repo                               │
│ ✓ Render can now see your code                                      │
└──────────────────────────────────────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│ STEP 3: Create Web Service on Render (1 minute setup, 5 min deploy)  │
├──────────────────────────────────────────────────────────────────────┤
│ - Name: dutch-festival-scraper                                      │
│ - Build Command: npm run build                                      │
│ - Start Command: npm run server                                     │
│ - Add Environment Variables (copy from .env)                        │
│ ✓ Render builds and deploys automatically                           │
│ ✓ Gets HTTPS URL: https://dutch-festival-scraper-XXXXX.onrender.com│
└──────────────────────────────────────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│ STEP 4: Test Deployment (2 minutes)                                  │
├──────────────────────────────────────────────────────────────────────┤
│ curl https://YOUR_URL/health                  → {status: ok}        │
│ curl -X POST https://YOUR_URL/run            → {success: true, ...} │
│ ✓ Server is running and responding                                  │
└──────────────────────────────────────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│ STEP 5: Full Sync (1 minute)                                         │
├──────────────────────────────────────────────────────────────────────┤
│ curl -X POST https://YOUR_URL/sync-all                              │
│ → Sends ALL ~1200 Dutch festivals                                   │
│ → Client's database populated completely                            │
│ ✓ One-time initial load done                                        │
└──────────────────────────────────────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│ STEP 6: Update Workflow JSONs (1 minute)                             │
├──────────────────────────────────────────────────────────────────────┤
│ In both JSON files:                                                  │
│ - Find: "url": "=https://YOUR_RENDER_URL_HERE/..."                  │
│ - Replace with: "url": "=https://YOUR_ACTUAL_URL/..."               │
│ ✓ Workflows now point to your deployed server                       │
└──────────────────────────────────────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│ STEP 7: Import to Client's n8n (2 minutes per workflow)              │
├──────────────────────────────────────────────────────────────────────┤
│ CLIENT'S n8n DASHBOARD:                                             │
│ 1. Workflows → Import → Upload JSON                                 │
│ 2. Name: "Dutch Festival Collector - Every 2 Hours"                │
│ 3. Click Save                                                       │
│ 4. Toggle "Active" ON (top-right)                                   │
│ 5. Repeat for both workflows                                        │
│ ✓ Workflows are now imported and activated                          │
└──────────────────────────────────────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│ STEP 8: Test End-to-End (2 minutes)                                  │
├──────────────────────────────────────────────────────────────────────┤
│ In client's n8n:                                                    │
│ 1. Open workflow: "Dutch Festival Collector - Every 2 Hours"        │
│ 2. Click "Execute Workflow"                                         │
│ 3. Watch execution complete successfully                            │
│ 4. Check: Supabase logs for new events                              │
│ ✓ Full integration working                                          │
└──────────────────────────────────────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│ RESULT: SYSTEM LIVE & AUTOMATED                                      │
├──────────────────────────────────────────────────────────────────────┤
│ ✓ Every 2 hours: n8n triggers /run endpoint                         │
│ ✓ Your server: Scrapes, deduplicates, sends new events            │
│ ✓ Client's DB: Receives fresh events automatically                │
│ ✓ Forever: No manual intervention needed                           │
└──────────────────────────────────────────────────────────────────────┘

Total Time: ~30-40 minutes (mostly waiting for Render deployment)
```

## Where Client Controls Everything

```
CLIENT HAS ACCESS TO:

┌─────────────────────────────────────────────────────────────────────┐
│ 1. n8n Dashboard (MAIN CONTROL)                                     │
├─────────────────────────────────────────────────────────────────────┤
│ What: Client's n8n account where workflows run                      │
│ Access: https://app.n8n.cloud or self-hosted n8n                   │
│                                                                     │
│ What Can Change:                                                    │
│ • Cron Schedule: Edit "0 */2 * * *" to different interval           │
│ • HTTP URL: Change endpoint if they move server                     │
│ • Execution History: View all runs, see errors                      │
│ • Workflow Settings: Enable/disable, adjust settings                │
│                                                                     │
│ Current Setup:                                                      │
│ • Trigger: Schedule (Cron: every 2 hours)                          │
│ • Action: HTTP POST to https://YOUR_RENDER_URL/run                 │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 2. Render.com (SERVER MONITORING)                                   │
├─────────────────────────────────────────────────────────────────────┤
│ What: Where your deployed server runs                               │
│ Access: https://render.com (YOUR account, share login if needed)    │
│                                                                     │
│ What Can View:                                                      │
│ • Live Logs: Real-time server output                                │
│ • Health Status: Is server running/crashed?                         │
│ • Deployment History: All versions deployed                         │
│ • Environment Variables: Current config (sensitive!)                │
│                                                                     │
│ What Can Change:                                                    │
│ • Environment Variables: Edit API keys, URLs                        │
│ • Redeploy: Push new code from GitHub                              │
│ • Plan Upgrade: Move from free to paid (if needed)                 │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 3. Supabase Dashboard (DATABASE MONITORING)                          │
├─────────────────────────────────────────────────────────────────────┤
│ What: Database where events are tracked                             │
│ Access: https://supabase.com/dashboard/projects                     │
│                                                                     │
│ Tables to Monitor:                                                  │
│ • processed_events: All events that have been sent (tracking)       │
│ • events: (Client's table) Where your events are written            │
│                                                                     │
│ What Can View:                                                      │
│ • Event records being inserted                                      │
│ • Row counts over time                                              │
│ • Query logs                                                        │
│ • Database usage                                                    │
│                                                                     │
│ What Can Change:                                                    │
│ • API Keys (if compromised)                                         │
│ • Database structure (expert only)                                  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 4. GitHub (SOURCE CODE)                                             │
├─────────────────────────────────────────────────────────────────────┤
│ What: Your source code repository                                   │
│ Access: https://github.com/YOUR_USERNAME/dutch-festival-scraper     │
│                                                                     │
│ What Can View:                                                      │
│ • All source code                                                   │
│ • Commit history                                                    │
│ • Workflows used                                                    │
│                                                                     │
│ What Can Change:                                                    │
│ • Nothing (unless they're developers)                               │
│ • Render auto-deploys when you push updates                         │
└─────────────────────────────────────────────────────────────────────┘
```

## Where to Change HTTPS Endpoint (If Needed)

```
SCENARIO: Client wants to change their HTTP endpoint where events go

Current: https://uphnagrdlnajgqplhcrl.supabase.co/functions/v1/add-event

If they move/change this, update:

┌────────────────────────────────────────────────────────────────┐
│ LOCATION 1: Render.com Environment Variables                   │
├────────────────────────────────────────────────────────────────┤
│ 1. Go to Render dashboard                                     │
│ 2. Select service: dutch-festival-scraper                     │
│ 3. Go to "Environment" tab                                    │
│ 4. Find: CLIENT_ENDPOINT                                      │
│ 5. Change value to new endpoint URL                           │
│ 6. Click Save                                                 │
│ 7. Service auto-restarts with new config                      │
│                                                               │
│ Result: Your server now posts to new endpoint                 │
└────────────────────────────────────────────────────────────────┘

NO OTHER CHANGES NEEDED!
- n8n workflows don't need to change (they call YOUR /run endpoint)
- Database tracking still works
- Everything continues automatically
```

## Complete Data Flow (Visual)

```
EVERY 2 HOURS:

     n8n Dashboard
     (Client's account)
              │
              │ Cron trigger fires
              │ (0 */2 * * *)
              ▼
     HTTP POST Request
     https://dutch-festival-scraper-XXXXX.onrender.com/run
              │
              ▼
     ┌──────────────────────┐
     │   YOUR SERVER        │
     │   (Render.com)       │
     │                      │
     │ 1. Run scrapers      │
     │    • FestivalFans    │
     │    • TicketSwap      │
     │                      │
     │ 2. Remove dups       │
     │    (same source)     │
     │                      │
     │ 3. Check Supabase    │
     │    processed_events  │
     │    (filter old ones) │
     │                      │
     │ 4. Send NEW events   │
     │    HTTP POST to:     │
     │    CLIENT_ENDPOINT   │
     │                      │
     │ 5. Update tracking   │
     │    Save sleukel keys │
     └──────────────────────┘
              │
              │ Events data
              ▼
     ┌──────────────────────┐
     │  CLIENT'S ENDPOINT   │
     │ (Their Supabase or   │
     │  custom function)    │
     └──────────────────────┘
              │
              ▼
     ┌──────────────────────┐
     │  CLIENT'S DATABASE   │
     │  Events Table        │
     │  New records added   │
     └──────────────────────┘

Result: Fresh Dutch festivals available in client's DB
Timeline: Runs automatically every 2 hours forever
```

## Quick Status Check (How to Verify Everything Working)

```
✅ STEP 1: Health Check (Server Running?)
   curl https://YOUR_RENDER_URL/health
   → Should return: {"status":"ok"}

✅ STEP 2: n8n Execution (Workflow Running?)
   Go to: n8n dashboard → Workflow → Execution History
   → Should show successful runs every 2 hours

✅ STEP 3: Events Received (Data Flowing?)
   Go to: Supabase dashboard → processed_events table
   → Should see new event keys appearing

✅ STEP 4: Render Logs (Server Healthy?)
   Go to: Render dashboard → Logs
   → Should show: "Starting scrapers..." "Sending events..." "Success"

✅ STEP 5: Database Events (Actually Stored?)
   Go to: Client's database → events table
   → Should see new festival/event records appearing
```

## Emergency Restart (If Something Breaks)

```
OPTION 1: Restart Server (Render)
├─ Go to Render dashboard
├─ Select service
├─ Click "Restart" button
└─ Wait 30 seconds, test /health

OPTION 2: Check Logs (Render)
├─ Go to Render dashboard
├─ Click "Logs" tab
├─ Look for errors
└─ Fix and push new code to GitHub (auto-deploys)

OPTION 3: Re-run Full Sync (If events missing)
├─ curl -X POST https://YOUR_URL/sync-all
├─ This repopulates everything
└─ Takes ~2 minutes

OPTION 4: Test Endpoint (If events not arriving)
├─ curl -X POST https://YOUR_URL/run
├─ Check response: should show eventsSent count
├─ If 0: check if there are actually new events
└─ Check Render logs for errors
```

---

**Everything is documented and ready. Client can operate independently with this guide.**
