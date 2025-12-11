import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function setupDatabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
    process.exit(1);
  }

  console.log('🔧 Initializing Supabase client...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('\n1️⃣  Creating festival_events table...');
    const { error: tableError } = await supabase.from('festival_events').select('*').limit(0);
    
    if (tableError?.code === 'PGRST200') {
      console.log('✅ Table festival_events already exists');
    } else if (tableError?.code === 'PGRST205') {
      console.log('⚠️  Table does not exist yet - you need to create it manually in Supabase');
      console.log('📍 SQL to execute:');
      console.log(`
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

CREATE TABLE IF NOT EXISTS public.processed_events (
  sleutel TEXT PRIMARY KEY,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_festival_events_sleutel ON public.festival_events(sleutel);
CREATE INDEX IF NOT EXISTS idx_festival_events_datum ON public.festival_events(datum_evenement);
CREATE INDEX IF NOT EXISTS idx_festival_events_bron ON public.festival_events(bron);
CREATE INDEX IF NOT EXISTS idx_processed_events_sleutel ON public.processed_events(sleutel);
CREATE INDEX IF NOT EXISTS idx_processed_events_last_seen ON public.processed_events(last_seen);

ALTER TABLE public.festival_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on festival_events" 
  ON public.festival_events FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on processed_events" 
  ON public.processed_events FOR ALL USING (true) WITH CHECK (true);
      `);
      console.log('\n👉 Visit Supabase SQL editor and copy-paste the SQL above');
    } else if (tableError) {
      console.log('❌ Error checking table:', tableError);
    } else {
      console.log('✅ festival_events table exists');
    }

  } catch (error: any) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
