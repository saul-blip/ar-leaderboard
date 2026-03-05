# AR Leaderboard Architecture

## Overview

The AR Leaderboard is a CRM-first dashboard that displays team performance metrics. It has evolved from a Google Sheets-based system to a real-time system powered by the GHL (HighLevel) CRM API via Vercel serverless functions.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    GHL CRM (Authoritative)                  │
│   - Opportunities (Setter KPIs: leads, citas, shows, etc)    │
│   - Calendar (Closer sits: appointments showed)              │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼──────────┐   ┌──────▼──────────────┐
│ /api/ghl/setters │   │ /api/ghl/closers... │
│ (Serverless Fn)  │   │ (Serverless Fn)     │
└────────┬─────────┘   └─────────┬───────────┘
         │                       │
         └───────────┬───────────┘
                     │
         ┌───────────▼────────────┐
         │  React Dashboard App    │
         │  - Displays CRM Data    │
         │  - Shows Real-time KPIs │
         │  - Stores Photos (LS)   │
         └────────────┬────────────┘
                      │
         ┌────────────▼──────────────┐
         │  Google Sheets (Audit     │
         │   Trail Only)             │
         │  - CRM Column (synced)    │
         │  - Manual Column (user)   │
         └───────────────────────────┘
```

## Data Sources

### Primary: GHL CRM (CRM-First)

The dashboard **always shows CRM data** as the authoritative source:

1. **Setter KPIs** → Fetched from `/api/ghl/setters`
   - `leadsAsignados` - All assigned opportunities
   - `leadsNuevos` - New opportunities this month
   - `contactados` - Opportunities in contact stages (3-9)
   - `citasAgendadas` - Opportunities in appointment stages (8-13)
   - `shows` - Opportunities in "showed" stages (10-13)
   - `aplicaron` - Opportunities in application/approval stages (11-13)
   - `aprobados` - Approved opportunities (12-13)
   - `negados` - Denied/rejected opportunities (11)
   - `ventas` - Sold opportunities (13)

2. **Closer Calendar Sits** → Fetched from `/api/ghl/closers-sits`
   - `sits` - Number of calendar appointments where customer showed up

### Secondary: Google Sheets (Audit Trail)

Google Sheets now serves as an **audit trail only**, with two columns per metric:
- **CRM Column**: Auto-synced from GHL (written by scheduled Discord sync)
- **Manual Column**: User entries (written by daily log form)

If a discrepancy exists, admin can investigate the Sheet and correct in CRM if needed.

### Tertiary: Discord Flash News (Closer Ventas)

Closer sales come from Discord `#general` FLASH NEWS posts:
- **SelfGen**: Marked with [SG] or "from Self-Generated"
- **CallCenter**: Setter mentioned first (booked the appointment)
- **WalkIn**: Marked with [WI] or "Walk-In"

Discord parsing is still handled by the Apps Script (for now), not by serverless functions.

## Serverless Functions

All serverless functions are deployed to Vercel and live in `/api/ghl/`.

### `/api/ghl/setters` (Node.js)

**Purpose**: Fetch all setter KPIs for the current month from GHL API.

**Response**:
```json
{
  "monthKey": "2026-03",
  "timestamp": "2026-03-05T18:30:00Z",
  "setters": {
    "David Mendoza": {
      "leadsAsignados": 43,
      "leadsNuevos": 35,
      "contactados": 28,
      "citasAgendadas": 12,
      "shows": 8,
      "aplicaron": 5,
      "aprobados": 3,
      "negados": 1,
      "ventas": 3
    },
    ...
  }
}
```

**Environment Variables Required**:
- `GHL_PIT_ORLANDO` - Private Integration Token for Orlando location
- `GHL_PIT_KSS` - Private Integration Token for Kissimmee location

**How It Works**:
1. Fetches opportunities from both locations using GHL `/opportunities/search` API
2. Filters to opportunities created this month
3. Computes KPIs per person based on pipeline stage membership
4. Merges results from both locations
5. Returns only setters (excludes closers)

### `/api/ghl/closers-sits` (Node.js)

**Purpose**: Fetch calendar "sits" (showed appointments) for closers for the current month.

**Response**:
```json
{
  "monthKey": "2026-03",
  "timestamp": "2026-03-05T18:30:00Z",
  "closers": {
    "Fabiola Iorio": 12,
    "Laura Indriago": 8,
    ...
  }
}
```

**Environment Variables Required**: Same as `/api/ghl/setters`

**How It Works**:
1. Fetches calendar appointments from both locations using GHL `/appointments/` API
2. Filters to appointments with status `showed` in the current month
3. Groups by closer (assignedUserId)
4. Returns only closers (excludes setters)

## Configuration

### Setting Up Environment Variables

On Vercel, add these to your project settings:

```
GHL_PIT_ORLANDO=<your_orlando_pit>
GHL_PIT_KSS=<your_kissimmee_pit>
```

To get your GHL PITs:
1. Go to **GHL App** → **Your Location** → **Settings** → **Integrations** → **API**
2. Find your **Private Integration Token** (PITs don't expire)
3. Copy and paste into Vercel environment variables

### Local Development

Create a `.env.local` file in the project root:

```bash
GHL_PIT_ORLANDO=your_token_here
GHL_PIT_KSS=your_token_here
```

Run the dev server:
```bash
npm run dev
```

Test serverless functions locally:
```bash
curl http://localhost:3000/api/ghl/setters
curl http://localhost:3000/api/ghl/closers-sits
```

## Data Flow: Today (March 2026+)

1. **Real-Time KPIs** (every 60 seconds):
   - React App calls `/api/ghl/setters` → fetches CRM data → displays in Setters column
   - React App calls `/api/ghl/closers-sits` → fetches CRM data → displays in Closers column (sits only)

2. **Closer Ventas** (daily via Apps Script trigger):
   - Apps Script reads Discord #general → parses FLASH NEWS → extracts sales
   - Apps Script writes to Google Sheets "Closers_YYYY-MM" (for audit trail)
   - React App displays from Google Sheets (fallback, not CRM)

3. **Manual Entry** (hourly via Daily Log form):
   - Team member submits daily production log
   - App validates against CRM data (daily entry ≤ CRM total)
   - App writes to Google Sheets (audit trail)
   - CRM data remains authoritative in display

## Data Flow: Transition from Apps Script

The Apps Script (`scripts/ghl-discord-sync.gs`) will gradually move out of the primary flow:

### Phase 1 (Current): CRM-First Display ✓
- Serverless functions fetch from GHL API
- React displays CRM data in real-time
- Google Sheets updated only for audit trail

### Phase 2 (Planned): Discord Integration via Serverless
- Create `/api/discord/flash-news` serverless function
- Move Discord parsing from Apps Script to Node.js
- Apps Script becomes optional/backup only

### Phase 3 (Future): Full Serverless Pipeline
- All syncing handled by serverless functions
- Apps Script completely retired
- Google Sheets remains as read-only audit trail

## File Structure

```
/api/ghl/
  ├── config.js           # GHL location IDs, pipeline stages, user mappings
  ├── utils.js            # GHL API client, KPI computation, pagination
  ├── setters.js          # /api/ghl/setters handler
  └── closers-sits.js     # /api/ghl/closers-sits handler

/src/utils/
  ├── sheets.js           # Google Sheets fetch + new CRM helper functions
  └── calculations.js     # KPI calculation helpers (percentages, sorting)

/src/components/
  ├── EditModal.jsx       # Photo editing (localStorage persistence)
  ├── StatsBar.jsx        # Global stats (3-source breakdown, pace, location)
  ├── Column.jsx          # Closer/Setter columns
  ├── CloserKpi.jsx       # Detail view
  └── SetterKpi.jsx       # Detail view

/scripts/
  └── ghl-discord-sync.gs # Apps Script (maintenance mode, not primary flow)
```

## Debugging

### Check Serverless Function Status

1. **Vercel Logs**:
   ```bash
   vercel logs --follow
   ```

2. **Test Endpoint**:
   ```bash
   curl https://ar-leaderboard.vercel.app/api/ghl/setters
   ```

3. **Check Environment Variables**:
   ```bash
   vercel env pull   # Download current environment
   ```

### Common Issues

| Issue | Solution |
|-------|----------|
| `401 Unauthorized` | GHL PIT invalid or expired. Refresh in GHL settings. |
| `500 Internal Server Error` | Check Vercel logs. PIT not set in environment variables. |
| `Empty response` | Location ID or pipeline ID incorrect in config.js. |
| `Rate limited (429)` | API backoff too short. Increase sleep time in utils.js. |

## Migration Checklist

- [ ] Set `GHL_PIT_ORLANDO` and `GHL_PIT_KSS` in Vercel environment variables
- [ ] Deploy serverless functions to Vercel
- [ ] Test `/api/ghl/setters` endpoint with curl
- [ ] Test `/api/ghl/closers-sits` endpoint with curl
- [ ] Verify React app displays CRM data (should replace Sheets data)
- [ ] Run for 48 hours in production, monitor for errors
- [ ] Remove Apps Script from primary flow (keep as backup)
- [ ] Update team on new data source (CRM is now live)

## FAQ

**Q: Why don't we pull closer ventas from GHL CRM?**
A: Closer sales come from Discord #general because:
- GHL pipeline tracks opportunities (setter work), not closer sales
- Closer sales are ad-hoc and entered via Discord FLASH NEWS
- Apps Script already parses Discord reliably

In future, we may add a "Sales Entered" stage to GHL to track this, but for now Discord is the source of truth.

**Q: What if GHL API is down?**
A: The React app automatically falls back to Google Sheets data, with a warning in console. No user interruption.

**Q: Can I edit CRM data from the dashboard?**
A: Not yet. Currently:
- Admins can edit photos (stored in localStorage)
- Team members can enter daily logs (written to Sheets)
- Corrections to KPIs must be made in GHL CRM directly

Future phases may add direct CRM editing.

**Q: How often does the dashboard refresh?**
A: Every 60 seconds for current month (checks for new CRM data). Historical months only load once.

**Q: Can I see a detailed audit trail?**
A: Yes, check the Google Sheets "Closers_YYYY-MM" and "Setters_YYYY-MM" tabs:
- "CRM" column: auto-synced from GHL
- "Manual" column: from daily log form
- Compare to find discrepancies

---

**Last Updated**: 2026-03-05
**Architecture Version**: 2.0 (CRM-First)
