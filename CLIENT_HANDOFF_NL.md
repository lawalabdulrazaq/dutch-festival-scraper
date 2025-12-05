# Handoff: Dutch Festival Scraper - Voltooid

## Samenvatting

Je hebt nu een **volledig productie-klare** oplossing voor het automatisch verzamelen van Nederlandse festival- en evenementen-gegevens via n8n.

**Wat je krijgt:**
- ✅ Geautomatiseerde scraper van 2 werkende bronnen (FestivalFans, TicketSwap)
- ✅ Deduplicatie via Supabase
- ✅ Gehoste API endpoint (Render.com)
- ✅ n8n workflow templates (gereed om in te importeren)
- ✅ Logging in Engels (kan eenvoudig naar Nederlands gewijzigd worden)

---

## Implementatie - 5 Stappen

### Stap 1: Kode naar GitHub pushen

```bash
cd /home/loganthewise/code/Dutch_festival_scraper
git add .
git commit -m "Dutch Festival Scraper - Productie klaar"
git push origin main
```

**Zorg dat `.env` NIET wordt gepusht** (al beveiligd door `.gitignore`)

### Stap 2: Deployen op Render.com

1. Ga naar **https://render.com**
2. Log in met GitHub
3. Click **New + → Web Service**
4. Selecteer je GitHub repository
5. Instellingen:
   - **Name**: `dutch-festival-scraper`
   - **Branch**: `main`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run server`
   - **Region**: Kies het dichtste bij jou

6. Click **Environment**
   - Voeg deze variabelen toe (copy-paste uit `.env`):
   ```
   SUPABASE_URL=https://uphnagrdlnajgqplhcrl.supabase.co
   SUPABASE_SERVICE_KEY=[kopieer van .env]
   CLIENT_ENDPOINT=https://uphnagrdlnajgqplhcrl.supabase.co/functions/v1/add-event
   CLIENT_API_KEY=[kopieer van .env]
   LOG_LEVEL=info
   ```

7. Click **Deploy**
   - Wacht 3-5 minuten op build
   - Je krijgt een URL: `https://dutch-festival-scraper-XXXX.onrender.com`
   - **Dit is je API endpoint!**

### Stap 3: Test de API Endpoints

```bash
# Gezondheidscheck
curl https://dutch-festival-scraper-XXXX.onrender.com/health

# Antwoord moet zijn: {"status":"ok", ...}

# Scraper handmatig starten
curl -X POST https://dutch-festival-scraper-XXXX.onrender.com/run

# Antwoord bijv.: {"success":true,"eventsCollected":29,"eventsSent":3, ...}
```

### Stap 4A: EENMALIGE Full Sync (Initiële Load - alle ~1200 events)

**Dit moet slechts EENMAAL gedaan worden!** Voer dit handmatig uit om je database van alle Nederlandse festivals op te vullen.

```bash
# Full sync - alle events zonder deduplicatie
curl -X POST https://dutch-festival-scraper-XXXX.onrender.com/sync-all

# Dit stuurt ALLE events tegelijk naar je database
```

### Stap 4B: n8n Workflow Instellen - Incremental (Elke 2 Uur)

Na je initiële load, stel dit in voor automatische updates:

1. Open je **n8n account**
2. Click **Workflows → New Workflow**
3. Hernoem naar: `Dutch Festival Collector - 2-Hourly`
4. **Add node**: Search for **"Schedule"** (trigger)
   - Type: **Cron**
   - Expression: `0 */2 * * *` (elke 2 uur)
   - Click Save

5. **Add node**: Search for **"HTTP Request"**
   - Method: **POST**
   - URL: `https://dutch-festival-scraper-XXXX.onrender.com/run`
   - Click Save

6. **Connect nodes**: Drag from Schedule output → HTTP Request input

7. Click **Activate** (top-right)
   - Status moet zijn: "Workflow is active"

8. **Test**: Click "Test workflow" of wacht op volgende 2-uur interval

---

## API Endpoints Referentie

| Endpoint | Methode | Doel | Wanneer gebruiken |
|----------|---------|------|------------------|
| `/health` | GET | Controleer of server draait | Monitoring & debugging |
| `/run` | POST | Incremental sync (alleen NIEUW) | Elke 2 uur via n8n (productie) |
| `/sync-all` | POST | Full sync (ALLE events) | Eenmalig voor initiële load |

---

## Gegevensstructuur

Elk event dat verzonden wordt heeft deze velden:

```json
{
  "datum_evenement": "2025-07-21",              // YYYY-MM-DD format
  "evenement_naam": "Amsterdam Dance Event",    // Event naam
  "locatie_evenement": "Amsterdam",             // Lokatie/stad
  "organisator": "ADE BV",                      // Organisator naam
  "contact_organisator": "info@ade.nl",         // Email/telefoon
  "bron": "FestivalFans",                       // Bron (website)
  "duur_evenement": "1 dag",                    // Duur
  "sleutel": "ade-2025-07-21-amsterdam"         // Unique ID voor deduplicatie
}
```

---

## Inloggen & Monitoring

### n8n Execution Logs
- Open je workflow
- Click **"Executions"** tab
- Controleer op fouten, timestamps, event counts
- Logs zijn in Engels (kunnen gewijzigd worden)

### Supabase Dashboard
- Ga naar https://uphnagrdlnajgqplhcrl.supabase.co
- Controleer tabel `processed_events` 
- Dit toont welke events al zijn verzonden

### Render.com Logs
- Open https://dashboard.render.com
- Selecteer je web service
- Klik op **"Logs"** tab
- Zie real-time scraper output

---

## Troubleshooting

| Probleem | Oplossing |
|----------|-----------|
| "Connection refused" op `/run` | Wacht tot Render deploy klaar is (controleer dashboard) |
| "401 Unauthorized" | Controleer API keys in Render env vars |
| "Geen events verzonden" | Controleer of FestivalFans/TicketSwap websites bereikbaar zijn |
| n8n workflow draait niet | Zorg dat workflow is **Activated** (toggle top-right) |
| Events verschijnen niet in database | Controleer endpoint URL en Supabase logs |

---

## Volgende Stappen

1. ✅ Push naar GitHub
2. ✅ Deploy op Render (~5 min)
3. ✅ Run full-sync eenmalig (`/sync-all`)
4. ✅ Stel n8n workflow in voor 2-uurlijkse checks (`/run`)
5. ✅ Monitor eerste 24 uur op fouten
6. ✅ (Optioneel) Voeg meer bronnen toe of pas velden aan

---

## Bestanden

- **N8N_DEPLOYMENT.md** - Gedetailleerde implementatiegids (Engels)
- **QUICK_START.md** - Snelle referentie
- **n8n-workflow-incremental.json** - Importeerbare n8n workflow (elke 2 uur)
- **n8n-workflow-full-sync.json** - Importeerbare n8n workflow (eenmalige full sync)

---

## Vragen?

- Render logs: Controleer real-time output
- n8n logs: Kijk execution history
- Supabase logs: Controleer database operations
- HTTP responses: Controleer status codes en error messages

**Je bent klaar om live te gaan!** 🚀

Veel succes met je Dutch Festival project!
