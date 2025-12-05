# 🔧 Your Supabase Testing Setup

## Your Project Details
- **Project ID**: vmqyhcerulbaivrkyxna
- **Project URL**: https://vmqyhcerulbaivrkyxna.supabase.co
- **Dashboard**: https://supabase.com/dashboard/projects

## Step 1: Run This SQL

Go to your Supabase dashboard → **SQL Editor** → **New Query**

Copy and paste this entire SQL block:

```sql
-- ============================================
-- Create processed_events table
-- ============================================
CREATE TABLE IF NOT EXISTS public.processed_events (
  sleutel TEXT NOT NULL,
  processed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  CONSTRAINT processed_events_pkey PRIMARY KEY (sleutel)
);

CREATE INDEX IF NOT EXISTS idx_processed_at 
  ON public.processed_events USING BTREE (processed_at);

-- ============================================
-- Create events table
-- ============================================
CREATE TABLE IF NOT EXISTS public.events (
  id BIGSERIAL PRIMARY KEY,
  datum_evenement TEXT NOT NULL,
  evenement_naam TEXT NOT NULL,
  locatie_evenement TEXT NOT NULL,
  organisator TEXT,
  contact_organisator TEXT,
  bron TEXT,
  duur_evenement TEXT,
  sleutel TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_sleutel 
  ON public.events USING BTREE (sleutel);

CREATE INDEX IF NOT EXISTS idx_events_created_at 
  ON public.events USING BTREE (created_at);

-- ============================================
-- Enable RLS and set policies
-- ============================================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_events ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert into events (for the edge function)
CREATE POLICY "Enable insert for all" ON public.events
  FOR INSERT WITH CHECK (true);

-- Allow anyone to select from events
CREATE POLICY "Enable select for all" ON public.events
  FOR SELECT USING (true);

-- Allow anyone to insert into processed_events
CREATE POLICY "Enable insert for all" ON public.processed_events
  FOR INSERT WITH CHECK (true);

-- Allow anyone to select from processed_events
CREATE POLICY "Enable select for all" ON public.processed_events
  FOR SELECT USING (true);
```

Click **Run** and wait for success ✅

---

## Step 2: Create the Edge Function

1. Go to **Functions** in your Supabase dashboard
2. Click **Create a new function**
3. Name: `add-event`
4. Language: **TypeScript**
5. Paste this code:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl!, supabaseKey!);

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const event = await req.json();

    // Validate required fields
    const required = [
      "datum_evenement",
      "evenement_naam",
      "locatie_evenement",
      "organisator",
      "contact_organisator",
      "bron",
      "duur_evenement",
      "sleutel",
    ];

    for (const field of required) {
      if (!event[field]) {
        return new Response(
          JSON.stringify({ error: `Missing field: ${field}` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Insert into events table
    const { data, error } = await supabase
      .from("events")
      .insert({
        datum_evenement: event.datum_evenement,
        evenement_naam: event.evenement_naam,
        locatie_evenement: event.locatie_evenement,
        organisator: event.organisator,
        contact_organisator: event.contact_organisator,
        bron: event.bron,
        duur_evenement: event.duur_evenement,
        sleutel: event.sleutel,
      })
      .select();

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to insert event", details: error.message }),
        { 
          status: 500, 
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          } 
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, event: data }),
      {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        } 
      }
    );
  }
});
```

Click **Deploy** and wait for completion ✅

---

## Step 3: Get Your API Key

Go to **Settings → API** and copy:
- **Project URL**: (you already have this)
- **anon public key**: Copy this

---

## Step 4: Update Your .env

Update your `.env` file with your own project credentials:

```env
SUPABASE_URL=https://vmqyhcerulbaivrkyxna.supabase.co
SUPABASE_SERVICE_KEY=<your_service_role_key>

CLIENT_ENDPOINT=https://vmqyhcerulbaivrkyxna.supabase.co/functions/v1/add-event
CLIENT_API_KEY=<your_anon_public_key>
```

---

## Step 5: Test It!

```bash
npm run test
```

You should see:
- ✅ Events collected from FestivalFans
- ✅ Events sent to your endpoint
- ✅ 0 errors (or fewer errors)

---

## Verify in Supabase

After running the test:
1. Go to **Table Editor**
2. Click on `events` table
3. You should see the events that were just inserted!

---

## Next: Send to Client

Once everything works perfectly on YOUR Supabase:
1. Create a NEW Supabase project for the client
2. Deploy the same setup there
3. Give the client the instructions

