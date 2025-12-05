# 📋 Setup Guide for Client: Creating the Edge Function

## Status
✅ **Scraper is READY** - collecting 21+ events with all required fields
✅ **Authentication is WORKING** - connecting to your Supabase project
❌ **Edge Function Missing** - needs to be created to receive events

## What the Client Needs to Do

### Step 1: Create the Edge Function

Go to your Supabase Dashboard:
1. Navigate to: https://supabase.com/dashboard/project/lyhuoggwixbnlrdbsjqn/functions
2. Click **"Create a new function"**
3. Name it: `add-event`
4. Choose: **TypeScript**
5. Paste this code:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl!, supabaseKey!);

serve(async (req) => {
  // Only allow POST
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

    // Insert into your events table
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
        JSON.stringify({ error: "Failed to insert event" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, event: data }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
```

### Step 2: Ensure Your Database Table Exists

Create a table called `events` with these columns:

```sql
CREATE TABLE IF NOT EXISTS events (
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
```

Run this in your SQL Editor.

### Step 3: Deploy the Function

- Click **"Deploy"** in the Supabase dashboard
- Wait for deployment to complete
- Test the endpoint manually if needed

---

## Once the Function is Live

The scraper will:
1. ✅ Collect events from sources
2. ✅ Validate all 8 required fields
3. ✅ Detect new vs. existing events
4. ✅ Send only new events via HTTP POST
5. ✅ Store them in your database

---

## Example Event Being Sent

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

---

## Debugging

If you see `404 - Requested function was not found`:
1. Check if the function was deployed successfully
2. Verify the function name is exactly `add-event`
3. Ensure it's in the correct Supabase project

---

Once done, the scraper will automatically start sending events!

