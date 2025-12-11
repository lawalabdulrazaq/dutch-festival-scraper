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

-- Enable RLS (Row Level Security) for public access (optional, customize as needed)
ALTER TABLE public.festival_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies to allow all operations (for testing/development)
-- WARNING: This is permissive. In production, restrict based on roles.
CREATE POLICY "Allow all operations on festival_events" 
  ON public.festival_events FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on processed_events" 
  ON public.processed_events FOR ALL USING (true) WITH CHECK (true);
