# Dutch Festival Scraper - Quick Start

## What You're Getting

A fully automated scraper that collects Dutch festivals and events every 2 hours and posts them to your endpoint.

**Sources Enabled:**
- FestivalFans (electronic festivals)
- TicketSwap (concerts, shows)

**Event Count:** ~25-30 new events per cycle (deduplicates automatically)

---

## Architecture

```
n8n Cron (Every 2h)
    ↓
HTTP POST → Deployed Server (/run endpoint)
    ↓
Fetches 2 event sources in parallel
    ↓
Deduplicates (Supabase tracking)
    ↓
Sends NEW events to: https://uphnagrdlnajgqplhcrl.supabase.co/functions/v1/add-event
```

---

## Setup (3 Steps)

### 1. Push Code to GitHub
```bash
git add .
git commit -m "Deploy scraper"
git push origin main
```

### 2. Deploy to Render
1. Sign up at render.com (free tier works)
2. Connect GitHub repo
3. Set environment variables (see below)
4. Deploy

### 3. Create n8n Workflow
1. Add Cron trigger: `0 */2 * * *`
2. Add HTTP POST node: `https://your-render-url.onrender.com/run`
3. Activate workflow

---

## Environment Variables

```
SUPABASE_URL=https://uphnagrdlnajgqplhcrl.supabase.co
SUPABASE_SERVICE_KEY=[Your JWT token]
CLIENT_ENDPOINT=https://uphnagrdlnajgqplhcrl.supabase.co/functions/v1/add-event
CLIENT_API_KEY=[Your JWT token]
LOG_LEVEL=info
```

---

## Testing

```bash
# Health check
curl https://your-render-url/health

# Trigger scraper manually
curl -X POST https://your-render-url/run
```

Expected response:
```json
{
  "success": true,
  "eventsCollected": 29,
  "eventsSent": 3,
  "timestamp": "2025-12-04T19:52:05.123Z"
}
```

---

## Monitoring

- **Render Logs**: Check for errors or connection issues
- **n8n History**: View successful/failed executions
- **Supabase Dashboard**: Verify new events in database

---

## Support

Check `N8N_DEPLOYMENT.md` for detailed troubleshooting.
