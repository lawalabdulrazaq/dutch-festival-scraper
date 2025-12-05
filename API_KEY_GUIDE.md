# 🔑 CRITICAL: How to Get the API Key

## The Problem
Your scraper is collecting events correctly BUT failing to send them because the endpoint requires authentication.

Error: `Status: 401, Message: Invalid JWT`

## The Solution: Get the CLIENT_API_KEY

### Step 1: Ask the Client
Message the client:
> "Hi! I've built the scraper and it's working. To send the events to your endpoint, I need the **anon** public key from your Supabase project. Can you provide it?"

### Step 2: Client Should Provide
The client needs to:
1. Go to: https://supabase.com/dashboard/project/lyhuoggwixbnlrdbsjqn/settings/api
2. Find the **"anon"** public key (starts with `eyJ...`)
3. Send it to you

### Step 3: You Add It to .env
Once you get the key, edit `.env`:

```
CLIENT_ENDPOINT=https://lyhuoggwixbnlrdbsjqn.supabase.co/functions/v1/add-event
CLIENT_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...PASTE_THE_KEY_HERE...
```

### Step 4: Run the Scraper
```bash
npm run test
```

If the key is correct, events will send successfully!

---

## ✅ What's Already Working

### Data Structure
The scraper is collecting data in the EXACT format the client requested:

```json
{
  "datum_evenement": "2025-12-06",
  "evenement_naam": "December",
  "locatie_evenement": "Nederland",
  "organisator": "Organisator onbekend",
  "contact_organisator": "info@festivalalfans.nl",
  "bron": "FestivalFans.nl",
  "duur_evenement": "1 dag",
  "sleutel": "december-2025-12-06-nederland"
}
```

All 8 required fields: ✓

### Event Collection
- **FestivalFans**: 23 events (working)
- **Partyflock**: 0 events (needs debugging)
- **TicketSwap**: 0 events (needs debugging)
- **Djguide**: 0 events (needs debugging)

### Deduplication
- Collecting 23 unique events
- Filtering out duplicates correctly
- Ready to send to endpoint

---

## 📋 Next Steps

1. **Get the API key from client** (crucial)
2. Add it to `.env`
3. Test again with `npm run test`
4. Improve other scrapers if needed

---

## Alternative: Test Without Auth
If the client says the endpoint is public (no auth required), comment out this line in `src/config/config.ts`:

```typescript
// OPTIONAL_API_KEY: process.env.CLIENT_API_KEY || '',
```

And it will send without authentication.

