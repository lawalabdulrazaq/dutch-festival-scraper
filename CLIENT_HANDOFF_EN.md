# Project Handoff: Dutch Festival Scraper - Complete

## Overview

You now have a **production-ready** solution for automatically collecting Dutch festival and event data through n8n.

**What You Get:**
- ✅ Automated scraper from 2 working sources (FestivalFans, TicketSwap)
- ✅ Deduplication via Supabase tracking
- ✅ Hosted API endpoint (Render.com)
- ✅ Ready-to-import n8n workflow templates
- ✅ Complete documentation and guides

---

## Implementation - 5 Steps

### Step 1: Push Code to GitHub

```bash
cd /home/loganthewise/code/Dutch_festival_scraper
git add .
git commit -m "Dutch Festival Scraper - Production ready"
git push origin main
```

**Ensure `.env` is NOT pushed** (protected by `.gitignore`)

### Step 2: Deploy to Render.com

1. Visit **https://render.com**
2. Sign in with GitHub
3. Click **New + → Web Service**
4. Select your GitHub repository
5. Configure:
   - **Name**: `dutch-festival-scraper`
   - **Branch**: `main`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run server`
   - **Region**: Select closest to you

6. Click **Environment** and add these variables (copy from `.env`):
   ```
   SUPABASE_URL=https://uphnagrdlnajgqplhcrl.supabase.co
   SUPABASE_SERVICE_KEY=[copy from .env]
   CLIENT_ENDPOINT=https://uphnagrdlnajgqplhcrl.supabase.co/functions/v1/add-event
   CLIENT_API_KEY=[copy from .env]
   LOG_LEVEL=info
   ```

7. Click **Deploy**
   - Wait 3-5 minutes for build completion
   - You'll get a URL: `https://dutch-festival-scraper-XXXX.onrender.com`
   - **This is your API endpoint!**

### Step 3: Test API Endpoints

```bash
# Health check
curl https://dutch-festival-scraper-XXXX.onrender.com/health

# Response: {"status":"ok", ...}

# Trigger scraper manually
curl -X POST https://dutch-festival-scraper-XXXX.onrender.com/run

# Response: {"success":true,"eventsCollected":29,"eventsSent":3, ...}
```

### Step 4A: ONE-TIME Full Sync (Initial Load - All ~1200 Events)

**This must be run ONCE only!** This populates your database with all Dutch festivals.

```bash
# Full sync - all events without deduplication
curl -X POST https://dutch-festival-scraper-XXXX.onrender.com/sync-all

# This sends ALL events to your database at once
```

### Step 4B: Set Up n8n Workflow - Incremental (Every 2 Hours)

After your initial full sync, set this up for automatic updates:

1. Open your **n8n account**
2. Click **Workflows → New Workflow**
3. Rename to: `Dutch Festival Collector - 2-Hourly`
4. **Add node**: Search for **"Schedule"**
   - Type: **Cron**
   - Expression: `0 */2 * * *` (every 2 hours)
   - Save

5. **Add node**: Search for **"HTTP Request"**
   - Method: **POST**
   - URL: `https://dutch-festival-scraper-XXXX.onrender.com/run`
   - Save

6. **Connect**: Drag Schedule output → HTTP Request input

7. Click **Activate** (top-right)
   - Status should show: "Workflow is active"

8. **Test**: Click "Test workflow" or wait for next 2-hour interval

---

## API Endpoints Reference

| Endpoint | Method | Purpose | When to Use |
|----------|--------|---------|-------------|
| `/health` | GET | Check if server is running | Monitoring & debugging |
| `/run` | POST | Incremental sync (new events only) | Every 2 hours via n8n (production) |
| `/sync-all` | POST | Full sync (all events) | One-time for initial load |

---

## Event Data Structure

Every event sent to your endpoint has these fields:

```json
{
  "datum_evenement": "2025-07-21",              // YYYY-MM-DD format
  "evenement_naam": "Amsterdam Dance Event",    // Event name
  "locatie_evenement": "Amsterdam",             // Location/city
  "organisator": "ADE BV",                      // Organizer name
  "contact_organisator": "info@ade.nl",         // Email/phone
  "bron": "FestivalFans",                       // Source (website)
  "duur_evenement": "1 day",                    // Duration
  "sleutel": "ade-2025-07-21-amsterdam"         // Unique ID for deduplication
}
```

---

## Logging & Monitoring

### n8n Execution Logs
- Open your workflow
- Click **"Executions"** tab
- Check for errors, timestamps, event counts
- Logs are in English

### Supabase Dashboard
- Go to https://uphnagrdlnajgqplhcrl.supabase.co
- Check table `processed_events`
- This shows which events have been sent

### Render.com Logs
- Open https://dashboard.render.com
- Select your web service
- Click **"Logs"** tab
- See real-time scraper output

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Connection refused" on `/run` | Wait for Render deploy to complete (check dashboard) |
| "401 Unauthorized" | Verify API keys in Render environment variables |
| "No events sent" | Check if FestivalFans/TicketSwap websites are accessible |
| n8n workflow not running | Ensure workflow is **Activated** (toggle top-right) |
| Events not appearing in database | Verify endpoint URL and check Supabase logs |

---

## Next Steps

1. ✅ Push to GitHub
2. ✅ Deploy to Render (~5 min)
3. ✅ Run full-sync once (`/sync-all`)
4. ✅ Set up n8n workflow for 2-hourly checks (`/run`)
5. ✅ Monitor first 24 hours for errors
6. ✅ (Optional) Add more sources or customize fields

---

## Documentation Files

- **N8N_DEPLOYMENT.md** - Detailed deployment guide
- **QUICK_START.md** - Quick reference
- **n8n-workflow-incremental.json** - Importable n8n workflow (every 2 hours)
- **n8n-workflow-full-sync.json** - Importable n8n workflow (one-time full sync)
- **CLIENT_HANDOFF_NL.md** - Dutch version of this document

---

## Support

- Render logs: Check real-time output
- n8n logs: Review execution history
- Supabase logs: Check database operations
- HTTP responses: Check status codes and error messages

**You're ready to go live!** 🚀

Good luck with your Dutch Festival project!
