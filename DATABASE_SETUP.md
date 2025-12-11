# Database Setup Instructions

## Current Status
- ✅ Application code is ready (field names corrected)
- ✅ TypeScript compilation succeeds
- ✅ Scrapers are fetching events (34 new events found)
- ❌ **Database tables are missing** - this is the blocker

## What Needs to Be Done

The Supabase database tables (`festival_events` and `processed_events`) need to be created with the correct field names.

### Step 1: Copy the SQL
Here's the SQL to create the required tables:

```sql
-- Create festival_events table (main events storage)
-- Field names match client's N8N workflow mapping
CREATE TABLE IF NOT EXISTS public.festival_events (
  id BIGSERIAL PRIMARY KEY,
  sleutel TEXT NOT NULL UNIQUE,
  datum_evenement TEXT NOT NULL,
  evenement_naam TEXT NOT NULL,
  locatie_evenement TEXT NOT NULL,
  organisateur TEXT NOT NULL,
  contact_organisator TEXT NOT NULL,
  bron TEXT NOT NULL,
  duur_evenement INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create processed_events table (deduplication tracking)
CREATE TABLE IF NOT EXISTS public.processed_events (
  sleutel TEXT PRIMARY KEY,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_festival_events_sleutel ON public.festival_events(sleutel);
CREATE INDEX IF NOT EXISTS idx_festival_events_datum ON public.festival_events(datum_evenement);
CREATE INDEX IF NOT EXISTS idx_festival_events_bron ON public.festival_events(bron);
CREATE INDEX IF NOT EXISTS idx_processed_events_sleutel ON public.processed_events(sleutel);
CREATE INDEX IF NOT EXISTS idx_processed_events_last_seen ON public.processed_events(last_seen);

-- Enable RLS (Row Level Security) 
ALTER TABLE public.festival_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies to allow all operations (for testing/development)
CREATE POLICY "Allow all operations on festival_events" 
  ON public.festival_events FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on processed_events" 
  ON public.processed_events FOR ALL USING (true) WITH CHECK (true);
```

### Step 2: Execute in Supabase Dashboard
1. Visit: https://lyhuoggwixbnlrdbsjqn.supabase.co/project/_/sql/new
2. Click "New query"
3. Copy-paste the SQL above
4. Click "RUN"

### Step 3: Verify Tables Were Created
After executing the SQL, you should see:
- ✅ Table `public.festival_events` created
- ✅ Table `public.processed_events` created  
- ✅ 4 indexes created
- ✅ RLS policies created

### Step 4: Run the Application Again
Once tables are created, run:
```bash
npm run dev
```

The application will:
1. Scrape events from multiple sources
2. Save them to the `festival_events` table
3. Track processed events in `processed_events` table
4. Run incremental syncs every 1 minute (for testing)

## Expected Results After Table Creation

When you run the app again, you should see:
```
✅ Incremental sync complete: 34 events found
✅ 34 new events saved to database
✅ Events ready for N8N workflow processing
```

## Field Mapping Reference

The system uses a two-layer field mapping:

**Database Layer (Dutch field names):**
- Stores data in the database with Dutch-named fields for the client's N8N workflow

**Client API Layer (English field names):**
- Automatically transforms to English field names when sending to the client API

| Database Field | Client Field | Description | Type |
|---|---|---|---|
| `datum_evenement` | `event_date` | Event date (YYYY-MM-DD) | TEXT |
| `evenement_naam` | `evenement_naam` | Event name | TEXT |
| `locatie_evenement` | `locatie_evenement` | Event location/venue | TEXT |
| `organisateur` | `organisator` | Organizer name | TEXT |
| `contact_organisator` | `contact_organisator` | Contact email/phone | TEXT |
| `bron` | `bron` | Source scraper name | TEXT |
| `duur_evenement` | `duur_evenement` | Duration in days | INTEGER |
| `sleutel` | `sleutel` | Unique event hash | TEXT |

### Transformation Example

When an event is stored in the database:
```json
{
  "datum_evenement": "2025-12-25",
  "organisateur": "John Doe",
  ...
}
```

When sent to the client API, it's automatically transformed to:
```json
{
  "event_date": "2025-12-25",
  "organisator": "John Doe",
  ...
}
```

This transformation happens automatically in the `transformEventForClient()` function.
