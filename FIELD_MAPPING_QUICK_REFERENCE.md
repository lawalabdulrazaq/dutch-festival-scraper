# Quick Reference: Field Mapping

## The Three-Layer Field System

```
┌─────────────────────────────────────────────────────────────┐
│              CLIENT API (N8N Webhook)                        │
│  Expects: event_date, organisator (ENGLISH names)            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    transformEventForClient()
                           │
┌──────────────────────────▼──────────────────────────────────┐
│           APPLICATION LAYER (TypeScript)                     │
│  Uses: FestivalEvent interface (DUTCH names internally)      │
│  - datum_evenement                                           │
│  - organisateur                                              │
│  - contact_organisator                                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                       save/query
                           │
┌──────────────────────────▼──────────────────────────────────┐
│         DATABASE LAYER (Supabase)                            │
│  Stores: datum_evenement, organisateur (DUTCH names)         │
│  festival_events table structure:                            │
│  ├─ id (auto)                                               │
│  ├─ sleutel (unique key)                                    │
│  ├─ datum_evenement (date)                                  │
│  ├─ evenement_naam (name)                                   │
│  ├─ locatie_evenement (location)                            │
│  ├─ organisateur (organizer)                                │
│  ├─ contact_organisator (contact)                           │
│  ├─ bron (source)                                           │
│  ├─ duur_evenement (duration)                               │
│  ├─ created_at (timestamp)                                  │
│  └─ updated_at (timestamp)                                  │
└─────────────────────────────────────────────────────────────┘
```

## Field Transformation Mapping

| Database | Internal | Client API | N8N Receives |
|----------|----------|-----------|-------------|
| `datum_evenement` | `datum_evenement` | `event_date` | `event_date` ✓ |
| `evenement_naam` | `evenement_naam` | `evenement_naam` | `evenement_naam` ✓ |
| `locatie_evenement` | `locatie_evenement` | `locatie_evenement` | `locatie_evenement` ✓ |
| `organisateur` | `organisateur` | `organisator` | `organisator` ✓ |
| `contact_organisator` | `contact_organisator` | `contact_organisator` | `contact_organisator` ✓ |
| `bron` | `bron` | `bron` | `bron` ✓ |
| `duur_evenement` | `duur_evenement` | `duur_evenement` | `duur_evenement` ✓ |
| `sleutel` | `sleutel` | `sleutel` | `sleutel` ✓ |

## Example Event Journey

### 1. After Scraping (normalizeEvent output)
```json
{
  "datum_evenement": "2025-12-25",
  "evenement_naam": "Christmas Festival",
  "locatie_evenement": "Amsterdam",
  "organisateur": "City Events",
  "contact_organisator": "info@cityevents.nl",
  "bron": "FestivalInfo",
  "duur_evenement": 3,
  "sleutel": "abc123xyz"
}
```

### 2. Stored in Database (same format)
```sql
INSERT INTO festival_events (
  datum_evenement, evenement_naam, locatie_evenement, 
  organisateur, contact_organisator, bron, duur_evenement, sleutel
) VALUES (
  '2025-12-25', 'Christmas Festival', 'Amsterdam',
  'City Events', 'info@cityevents.nl', 'FestivalInfo', 3, 'abc123xyz'
)
```

### 3. Sent to Client (transformEventForClient output)
```json
{
  "event_date": "2025-12-25",
  "evenement_naam": "Christmas Festival",
  "locatie_evenement": "Amsterdam",
  "organisator": "City Events",
  "contact_organisator": "info@cityevents.nl",
  "bron": "FestivalInfo",
  "duur_evenement": 3,
  "sleutel": "abc123xyz"
}
```

### 4. N8N Workflow Receives
The client's N8N can now map these directly:
```
POST https://your-n8n.com/webhook/events

{
  "event_date": "2025-12-25",           ← N8N expects this
  "evenement_naam": "Christmas Festival",
  "locatie_evenement": "Amsterdam",
  "organisator": "City Events",         ← Not organisateur!
  "contact_organisator": "info@cityevents.nl",
  "bron": "FestivalInfo",
  "duur_evenement": 3,
  "sleutel": "abc123xyz"
}
```

✅ **Perfect match with what N8N expects!**
