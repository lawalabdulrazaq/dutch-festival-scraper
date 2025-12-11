# 🚀 Quick Start Guide

Get the Dutch Festival Scraper running in **5 minutes**.

---

## Step 1: Prerequisites (1 min)

- **Node.js 18+** → [Install](https://nodejs.org)
- **Supabase account** (free) → [Sign up](https://supabase.com)
- **Client webhook endpoint** (your API to receive events)

---

## Step 2: Clone & Install (2 min)

```bash
# Clone or download the project
cd Dutch_festival_scraper

# Install dependencies
npm install

# Compile TypeScript
npm run build
```

---

## Step 3: Database Setup (1 min)

Go to your **Supabase Console** → Create two tables:

### Table 1: `festival_events`
```sql
CREATE TABLE festival_events (
  sleutel VARCHAR(255) PRIMARY KEY,
  event_date DATE NOT NULL,
  evenement_naam VARCHAR(500) NOT NULL,
  locatie_evenement VARCHAR(500) NOT NULL,
  organisator VARCHAR(255),
  contact_organisator VARCHAR(255),
  bron VARCHAR(255) NOT NULL,
  duur_evenement INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table 2: `processed_events`
```sql
CREATE TABLE processed_events (
  sleutel VARCHAR(255) PRIMARY KEY,
  last_seen TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Step 4: Configure (1 min)

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env`:
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ0eXA...
CLIENT_ENDPOINT=https://your-api.com/webhook
CLIENT_API_KEY=sk_live_xxx          # Optional
SCRAPE_INTERVAL_HOURS=2
LOG_LEVEL=info
```

Get values from:
- **SUPABASE_URL** → Supabase Settings → API
- **SUPABASE_SERVICE_KEY** → Supabase Settings → API → Service Role Key
- **CLIENT_ENDPOINT** → Your webhook URL

---

## Step 5: Run! (1 min)

```bash
# Development mode (auto-reload)
npm run dev

# Or production
npm run build && npm start
```

**Expected Output**:
```
🚀 Starting Dutch Festival Scraper System...
📊 First run detected - performing FULL SYNC...
🕷️  Initializing Full Sync Workflow...
✓ Initialized 10 scrapers
🕷️  Running scraper: FestivalInfo
✓ FestivalInfo: Found 234 events in 45.23s
...
✅ Full Sync Complete in 543.82s: 1,187 events saved
⏱️  Scheduling incremental sync every 2 hours
✅ System ready and waiting for scheduled tasks...
```

---

## What Happens Now?

**First Run**:
- 📊 Collects 1,000-1,200 events from all sources
- 💾 Stores in `festival_events` table
- ⏱️ Takes ~1 hour

**Every 2 Hours**:
- 🔄 Runs incremental sync
- 🆕 Finds new/updated events only
- 📤 POSTs to your client endpoint
- ⏱️ Takes ~5-15 minutes

---

## Test Your Setup

```bash
# Test single scraper
SCRAPE_ONLY=festivalinfo npm run dev

# Watch logs
LOG_LEVEL=debug npm run dev

# Test client endpoint
curl -X POST https://your-api.com/webhook \
  -H "Content-Type: application/json" \
  -d '{"event_date": "2024-06-15", "evenement_naam": "Test Event"}'
```

---

## Troubleshooting

### "Cannot find module 'puppeteer'"
```bash
npm install puppeteer
```

### "Cannot connect to Supabase"
- Check SUPABASE_URL and SUPABASE_SERVICE_KEY
- Verify network connectivity
- Check Supabase project is running

### "0 events scraped"
```bash
LOG_LEVEL=debug npm run dev
# Check for parsing errors in logs
# Website HTML structure may have changed
```

### "Events not reaching my endpoint"
- Check CLIENT_ENDPOINT URL (must be public)
- Verify endpoint accepts POST requests
- Check CLIENT_API_KEY if using authentication
- Look for errors: `curl -v https://your-endpoint/webhook`

---

## What's Inside?

```
📁 src/
  📄 index.ts                    ← Main entry + cron scheduler
  📁 scrapers/                   ← 10+ event scrapers
  📁 services/                   ← HTTP, Supabase, Browser
  📁 workflows/                  ← Full/Incremental sync logic
  📁 utils/                      ← Hash, contact, normalize
  📁 types/                      ← TypeScript interfaces
```

---

## Next Steps

1. ✅ **First sync completes** → Check Supabase for events
2. 📊 **Monitor logs** → Set `LOG_LEVEL=debug` to see details
3. 🔧 **Add more scrapers** → See SCRAPER_DOCS.md
4. 📋 **Configure schedule** → Change `SCRAPE_INTERVAL_HOURS`
5. 🚀 **Deploy** → Docker/Railway/Heroku support

---

## Key Files

- **README.md** - Overview & architecture
- **SCRAPER_DOCS.md** - Complete technical docs (⭐ Read this!)
- **.env.example** - Configuration template
- **src/index.ts** - Application entry point

---

## Support

If something doesn't work:
1. Check logs: `LOG_LEVEL=debug npm run dev`
2. Read SCRAPER_DOCS.md troubleshooting section
3. Verify Supabase tables exist
4. Test network connectivity

---

**You're ready!** 🎉

The system will now:
- Collect 1,200+ Dutch events
- Deduplicate across sources
- Extract contact information
- Send updates to your webhook
- Run automatically every 2 hours
