#!/bin/bash
# Quick setup: Display instructions to create Supabase tables

echo "═══════════════════════════════════════════════════════════════"
echo "🔧 SUPABASE DATABASE SETUP"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "⚠️  The application needs these tables in Supabase:"
echo ""
echo "1. festival_events (main event storage)"
echo "2. processed_events (deduplication tracking)"
echo ""
echo "📍 Please manually execute this SQL in your Supabase dashboard:"
echo ""
echo "Visit: https://lyhuoggwixbnlrdbsjqn.supabase.co/project/_/sql/new"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "SQL TO RUN:"
echo "═══════════════════════════════════════════════════════════════"
cat << 'SQL'
-- Create festival_events table
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

-- Create processed_events table
CREATE TABLE IF NOT EXISTS public.processed_events (
  sleutel TEXT PRIMARY KEY,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_festival_events_sleutel ON public.festival_events(sleutel);
CREATE INDEX IF NOT EXISTS idx_festival_events_datum ON public.festival_events(datum_evenement);
CREATE INDEX IF NOT EXISTS idx_festival_events_bron ON public.festival_events(bron);
CREATE INDEX IF NOT EXISTS idx_processed_events_sleutel ON public.processed_events(sleutel);
CREATE INDEX IF NOT EXISTS idx_processed_events_last_seen ON public.processed_events(last_seen);

-- Enable RLS
ALTER TABLE public.festival_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations on festival_events" 
  ON public.festival_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on processed_events" 
  ON public.processed_events FOR ALL USING (true) WITH CHECK (true);
SQL

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "✅ After creating the tables, the application is ready!"
echo ""
echo "🚀 Run: npm run dev"
echo ""
echo "═══════════════════════════════════════════════════════════════"
