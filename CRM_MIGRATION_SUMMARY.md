# CRM Migration Summary: Dashboard Now CRM-First ✓

## What Changed

The AR Leaderboard has been transformed from a **Google Sheets-based system** to a **CRM-first system** powered by the GHL API via Vercel serverless functions.

### Before (v1.0)
```
Google Sheets ← Apps Script ← GHL API
         ↓
React Dashboard (displays Sheets)
```

### Now (v2.0)
```
GHL API (Authoritative)
   ├─→ /api/ghl/setters (serverless fn)
   └─→ /api/ghl/closers-sits (serverless fn)
           ↓
React Dashboard (displays CRM in real-time)
           ↓
Google Sheets (Audit trail only)
```

## What Was Built

### 1. Serverless Functions (Node.js)

**Location**: `/api/ghl/`

#### `config.js`
- GHL location configurations (Orlando, Kissimmee)
- Pipeline stage IDs (3-13) for each location
- GHL user ID → Team name mappings
- Constants for API endpoints

#### `utils.js`
- `fetchAllGHLOpportunities()` - Paginated API calls to GHL
- `fetchCalendarAppointments()` - Fetch calendar appointments
- `computePersonKPIs()` - Calculate KPIs from opportunities
- `extractCalendarSits()` - Extract "showed" appointments
- `mergeKPIs()` - Combine KPIs from multiple locations
- Built-in rate limiting and error handling

#### `setters.js` → `/api/ghl/setters`
- Fetches all setter KPIs from GHL for current month
- Returns: `{ setters: { [name]: { leadsAsignados, leadsNuevos, contactados, citasAgendadas, shows, aplicaron, aprobados, negados, ventas } } }`

#### `closers-sits.js` → `/api/ghl/closers-sits`
- Fetches closer calendar "sits" (showed appointments) from GHL
- Returns: `{ closers: { [name]: sitCount } }`

### 2. React App Updates

**File**: `src/App.jsx`
- Imports `fetchMonthDataWithCRM()` from sheets.js
- For current month: calls serverless functions first, falls back to Sheets
- For historical months: continues using Google Sheets
- Automatic 60-second refresh for live data

**File**: `src/utils/sheets.js`
- New `fetchCRMSetterData()` - calls `/api/ghl/setters`
- New `fetchCRMCloserSits()` - calls `/api/ghl/closers-sits`
- New `fetchMonthDataWithCRM()` - merges CRM data into Sheets data
- CRM data takes precedence, Sheets is fallback

### 3. Documentation

**ARCHITECTURE.md**
- Complete system design and data flow
- Explanation of each component
- Migration phases
- FAQ section

**VERCEL_SETUP.md**
- Step-by-step instructions for deploying to Vercel
- How to get GHL PITs
- Local development setup
- Testing endpoints

**DEPLOYMENT_CHECKLIST.md**
- Pre-deployment checklist
- Vercel deployment steps
- Testing and validation
- Rollback plan
- Troubleshooting guide

**.env.example**
- Template for required environment variables
- Instructions for local development

## What Stays the Same

✓ **Photos**: Stored in localStorage, editable via EditModal
✓ **Daily Log Form**: Manual entry still writes to Google Sheets
✓ **Discord Integration**: Apps Script still parses FLASH NEWS (for now)
✓ **Google Sheets**: Kept as audit trail (CRM vs Manual columns)
✓ **User Pins**: Admin/viewer authentication unchanged
✓ **UI/UX**: Dashboard looks and feels identical

## What Needs to Happen Next

### Critical (Before Going Live)

1. **Get GHL PITs**
   - Log into GHL App
   - Settings → Integrations → API
   - Copy tokens for both locations

2. **Add Environment Variables to Vercel**
   ```
   GHL_PIT_ORLANDO = [your token]
   GHL_PIT_KSS = [your token]
   ```

3. **Deploy to Vercel**
   ```bash
   git add .
   git commit -m "Add CRM-first serverless functions"
   git push origin main
   ```

4. **Test Both Endpoints**
   ```bash
   curl https://ar-leaderboard.vercel.app/api/ghl/setters
   curl https://ar-leaderboard.vercel.app/api/ghl/closers-sits
   ```
   - Should return JSON (not HTML error)
   - Should include team member data

5. **Test in Browser**
   - Open dashboard
   - Verify Setter KPIs match GHL
   - Verify Closer sits match GHL calendar
   - Check data refreshes every 60 seconds

### Important (Within 48 Hours)

6. **Monitor Vercel Logs**
   ```bash
   vercel logs --follow
   ```
   - Watch for errors
   - Check for rate limiting

7. **Compare with Google Sheets**
   - Open Google Sheets tab "Closers_2026-03"
   - Compare CRM column (from GHL) with Dashboard
   - Investigate any discrepancies

8. **Notify Team**
   - "Dashboard now pulls real-time data from GHL CRM"
   - "Photos and daily logs still work as before"
   - "Please verify your numbers look correct"

### Optional (Future)

9. **Retire Apps Script**
   - After 48+ hours of stable operation
   - Remove time-driven trigger (don't delete code yet)
   - Keep code in Git for rollback safety

10. **Next Phase: Discord Integration**
    - Move Discord parsing to serverless function
    - Create `/api/discord/flash-news` endpoint
    - Remove Apps Script from flow entirely

## Key Improvements

| Aspect | Before | After |
|--------|--------|-------|
| **Data Source** | Google Sheets | GHL CRM (live) |
| **Refresh Rate** | Manual (hourly) | Automatic (60s) |
| **Data Freshness** | 1 hour behind | Real-time |
| **Dependency** | Apps Script (flaky) | Serverless (reliable) |
| **Scalability** | Sheets rate limits | Vercel auto-scales |
| **Cost** | Sheets quota limits | Serverless (pay-per-use) |
| **Audit Trail** | Apps Script logs | Google Sheets columns |

## Data Flow Examples

### Scenario 1: New Opportunity Created in GHL
```
1. Closer/Setter creates opportunity in GHL
2. Dashboard refreshes (max 60 seconds)
3. `/api/ghl/setters` sees new opportunity
4. KPI increments (e.g., leadsAsignados++)
5. React app updates display
```

### Scenario 2: Calendar Appointment Shows Up
```
1. Appointment status set to "showed" in GHL calendar
2. Dashboard refreshes (max 60 seconds)
3. `/api/ghl/closers-sits` sees showed appointment
4. Closer sits increments by 1
5. React app updates display
```

### Scenario 3: Manual Entry in Daily Log
```
1. Closer/Setter submits daily log form
2. App validates: daily entry ≤ CRM total
3. App writes entry to Google Sheets (audit trail)
4. Dashboard continues showing CRM data (not manual)
5. Discrepancy visible in Sheets for admin investigation
```

## File Checklist

Code files created/modified:
- [x] `/api/ghl/config.js` (new)
- [x] `/api/ghl/utils.js` (new)
- [x] `/api/ghl/setters.js` (new)
- [x] `/api/ghl/closers-sits.js` (new)
- [x] `src/App.jsx` (updated)
- [x] `src/utils/sheets.js` (updated)
- [x] `.env.example` (new)
- [x] `ARCHITECTURE.md` (new)
- [x] `VERCEL_SETUP.md` (new)
- [x] `DEPLOYMENT_CHECKLIST.md` (new)
- [x] `CRM_MIGRATION_SUMMARY.md` (this file)

Unchanged:
- `/src/components/*` (all working as-is)
- `/src/utils/calculations.js` (no changes needed)
- `/scripts/ghl-discord-sync.gs` (Apps Script, optional for now)
- `/src/data/defaults.js` (fallback values)

## Rollback

If anything goes wrong:

**Option A**: Quick rollback
```bash
vercel rollback
```

**Option B**: Disable CRM, use Sheets
```bash
git revert HEAD
git push origin main
```

**Option C**: Manual Vercel rollback
Vercel dashboard → Deployments → promote previous version

## Questions?

### "Will the dashboard still work if GHL API is down?"
Yes. React app falls back to Google Sheets with a warning in console. No user interruption.

### "Can I still edit data from the dashboard?"
Yes, but only:
- Photos (via EditModal, saved to localStorage)
- Daily logs (via form, saved to Sheets)
- All other data must be edited in GHL directly

### "What if my numbers are different from Sheets?"
That's expected during the migration. GHL is now the source of truth. If discrepancies persist, check:
1. GHL data entry is complete
2. Opportunity/appointment dates are correct
3. Assign ees are correct in GHL

### "Do I need to delete Google Sheets?"
No! Keep it as an audit trail. Compare "CRM" vs "Manual" columns to investigate discrepancies.

---

## Success Indicators ✓

After deployment, you should see:
- [x] Setter KPIs match GHL opportunities
- [x] Closer sits match GHL calendar appointments
- [x] Dashboard refreshes every 60 seconds
- [x] No console errors
- [x] Vercel logs show healthy responses
- [x] Team confirms numbers look accurate

## Timeline

- **Today**: Code review + environment variable setup
- **Tomorrow**: Deploy to Vercel + test endpoints
- **48 Hours**: Monitor logs + verify data accuracy
- **5 Days**: Team confirms everything working
- **2 Weeks** (Optional): Retire Apps Script trigger

---

**Migration Status**: 🟢 **READY FOR DEPLOYMENT**

**Next Step**: Follow VERCEL_SETUP.md to deploy to production.
