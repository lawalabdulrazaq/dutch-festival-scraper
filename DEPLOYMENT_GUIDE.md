# Deployment & N8N Integration Guide

## Step 1: Push Code to Git/Server

### Option A: Push to GitHub (Recommended)

```bash
cd /home/loganthewise/code/Dutch_festival_scraper

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Festival scraper: Initial deployment with field mapping, DB persistence, and N8N integration"

# Add remote (replace with your GitHub repo)
git remote add origin https://github.com/YOUR_USERNAME/dutch-festival-scraper.git

# Push to main branch
git branch -M main
git push -u origin main
```

### Option B: Deploy to Render

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name:** dutch-festival-scraper
   - **Environment:** Node
   - **Build command:** `npm install && npm run build`
   - **Start command:** `npm run start`
   - **Plan:** Free (for testing) or Paid

5. Add Environment Variables:
   ```
   SUPABASE_URL=https://lyhuoggwixbnlrdbsjqn.supabase.co
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5aHVvZ2d3aXhibmxyZGJzanFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg5NzAyOCwiZXhwIjoyMDc4NDczMDI4fQ.l0pT6FipxEXpPrngHA_HyGkxH3MGLT0XGMEVCmSirOE
   CLIENT_ENDPOINT=https://YOUR_N8N_WEBHOOK_URL (from Step 2)
   CLIENT_API_KEY=your_optional_api_key
   ```

6. Deploy!

---

## Step 2: Configure N8N Webhook

### What the Scraper Sends

Every minute (configurable), the scraper sends events like:

```json
{
  "event_date": "2025-12-25",
  "evenement_naam": "Festival Name",
  "locatie_evenement": "Amsterdam",
  "organisator": "Festival Org",
  "contact_organisator": "contact@festival.nl",
  "bron": "festivalinfo.nl",
  "duur_evenement": 3,
  "sleutel": "unique_hash_123"
}
```

### N8N Setup (3 Steps)

#### 1. Create Webhook Trigger in N8N

1. Open your N8N instance
2. Create a new workflow
3. Add a **Webhook** trigger node
4. Set Method: `POST`
5. Copy the webhook URL → this is your `CLIENT_ENDPOINT`

#### 2. Add Processing Nodes

Example workflow:

```
Webhook (receive event)
  ↓
Filter (optional: check if event_date is in future)
  ↓
Database Insert (save to your database)
  ↓
Email/Notification (optional: alert when new event)
  ↓
Response (return 200 OK)
```

#### 3. Test Connection

```bash
# From your local terminal, test the webhook:
curl -X POST https://YOUR_N8N_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{
    "event_date": "2025-12-25",
    "evenement_naam": "Test Festival",
    "locatie_evenement": "Amsterdam",
    "organisator": "Test Org",
    "contact_organisator": "test@example.com",
    "bron": "test",
    "duur_evenement": 1,
    "sleutel": "test_hash"
  }'
```

Should return `200 OK`

---

## Step 3: Update Environment Variables

Once N8N webhook is ready, update `.env`:

```bash
# .env
SUPABASE_URL=https://lyhuoggwixbnlrdbsjqn.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
CLIENT_ENDPOINT=https://n8n.your-domain.com/webhook/festival-events
CLIENT_API_KEY=optional_auth_key
SCRAPE_INTERVAL_HOURS=2
```

Then redeploy.

---

## Step 4: Monitor

### Check Logs on Render

```
Render Dashboard → Your App → Logs
```

Look for:
- `✓ Sent event to client` → Success
- `❌ Error sending event` → Check N8N webhook

### Check Supabase

Go to Supabase dashboard:
- `festival_events` table: see all scraped events
- `processed_events` table: see which ones were sent

---

## Step 5: Scale Up (Add More Events)

Once N8N is connected, you can:

1. **Enable more scrapers** in `src/config/config.ts`
   - Change `enabled: false` to `enabled: true` for disabled sources
   - Add new sources

2. **Increase event collection**:
   - Current: ~35 events
   - Target: 200+ events
   - With all 13 scrapers enabled: 300-500+ events possible

3. **Adjust sync interval** in `src/index.ts`:
   ```typescript
   const syncIntervalMinutes = 240; // Change from 1 to 4 hours
   ```

4. **Deploy changes**:
   ```bash
   git add .
   git commit -m "Enable more scrapers, adjust sync interval"
   git push
   ```

---

## Checklist Before Adding More Events

- [ ] Code pushed to GitHub/server
- [ ] Render (or other server) deployed and running
- [ ] N8N webhook created and tested
- [ ] `CLIENT_ENDPOINT` configured in `.env` on server
- [ ] Server receiving events (check logs)
- [ ] Supabase shows events in `festival_events` table

Once all ✓, proceed to enable more scrapers and increase event collection to 200+.

---

## Troubleshooting

### Events not reaching N8N
- Check `CLIENT_ENDPOINT` URL is correct
- Verify webhook is active in N8N
- Check Render logs for error messages

### Webhook returns 500 error
- Check N8N workflow for errors
- Verify all required fields in workflow are mapped
- Test with curl command above

### Rate limiting (429 errors)
- Some websites block rapid requests
- Increase delays in `src/config/config.ts` (increase `retries` timeout)
- Spread requests across longer interval

