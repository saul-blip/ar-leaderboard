# Deployment Checklist: CRM-First Architecture (v2.0)

## Phase 1: Pre-Deployment ✓ COMPLETE

- [x] Create `/api/ghl/config.js` with GHL location configs, stage IDs, and user mappings
- [x] Create `/api/ghl/utils.js` with GHL API client functions and KPI computation logic
- [x] Create `/api/ghl/setters.js` serverless function (fetch setter KPIs)
- [x] Create `/api/ghl/closers-sits.js` serverless function (fetch closer sits)
- [x] Update `src/utils/sheets.js` with `fetchMonthDataWithCRM()` function
- [x] Update `src/App.jsx` to use `fetchMonthDataWithCRM()` for current month
- [x] Create `.env.example` template
- [x] Create `ARCHITECTURE.md` documentation
- [x] Create `VERCEL_SETUP.md` setup guide
- [x] Create `DEPLOYMENT_CHECKLIST.md` (this file)

## Phase 2: Vercel Deployment

### Step 1: Prepare GHL PITs
- [ ] Log into GHL App (Orlando location)
- [ ] Go to **Settings** → **Integrations** → **API**
- [ ] Copy the **Private Integration Token**
- [ ] Repeat for Kissimmee location
- [ ] Store securely (don't commit to Git)

### Step 2: Configure Vercel Environment
- [ ] Go to Vercel Project → **Settings** → **Environment Variables**
- [ ] Add `GHL_PIT_ORLANDO` = [your token]
- [ ] Add `GHL_PIT_KSS` = [your token]
- [ ] Make sure **Production** is selected
- [ ] Click **Save**

### Step 3: Deploy
```bash
git add .
git commit -m "Add CRM-first serverless functions"
git push origin main
```
- [ ] Monitor Vercel deployment (should take 1-2 minutes)
- [ ] Check deployment status: `vercel list` or Vercel dashboard
- [ ] Verify green ✓ status

### Step 4: Test Endpoints
```bash
# Wait 2-3 minutes for DNS to propagate
curl https://ar-leaderboard.vercel.app/api/ghl/setters
curl https://ar-leaderboard.vercel.app/api/ghl/closers-sits
```
- [ ] Both return JSON (not HTML error page)
- [ ] Response includes `"monthKey": "2026-03"`
- [ ] `"setters"` object contains team member names with KPI data
- [ ] `"closers"` object contains closer names with sit counts

### Step 5: Test in Browser
- [ ] Open https://ar-leaderboard.vercel.app
- [ ] Enter your viewer PIN
- [ ] Check Setters column shows data from CRM (not Sheets)
- [ ] Check Closers column shows sits from CRM (not Sheets)
- [ ] Wait 60 seconds, verify data refreshes
- [ ] Check browser console for warnings/errors

### Step 6: Monitor for 24 Hours
- [ ] Check Vercel logs: `vercel logs --follow`
- [ ] Look for error patterns
- [ ] Check for rate limiting (should rarely happen)
- [ ] Verify dashboard loads consistently
- [ ] Monitor response times (should be < 5 seconds)

## Phase 3: Post-Deployment

### Notify Team
- [ ] Send team message: "Dashboard now pulls real-time data from GHL CRM"
- [ ] Link to ARCHITECTURE.md for technical details
- [ ] Mention: "Photos and manual daily logs still work as before"
- [ ] Ask for feedback on data accuracy

### Monitor & Debug
- [ ] Watch Vercel logs for 48 hours
- [ ] Check Apps Script logs (if still running)
- [ ] Verify Google Sheets audit trail is being updated
- [ ] Investigate any discrepancies in numbers

### Optional: Retire Apps Script
- [ ] After 48 hours of smooth operation, consider disabling Apps Script trigger
- [ ] Keep code in Git for reference/rollback
- [ ] Document the switch for future team members

## Phase 4: Advanced (Future)

- [ ] Create `/api/discord/flash-news` serverless function
- [ ] Move Discord parsing from Apps Script to Node.js
- [ ] Add Redis caching for KPI data (optional, for performance)
- [ ] Implement real-time WebSocket updates (if demand is high)
- [ ] Add direct CRM editing from dashboard (requires GHL auth)

## Rollback Plan

If something breaks:

### Option A: Quick Rollback
```bash
vercel rollback
```
This reverts to the previous successful deployment instantly.

### Option B: Disable Serverless Functions
```bash
# Revert the last commit
git revert HEAD
git push origin main
```
React will fall back to Google Sheets data automatically.

### Option C: Manual Rollback
In Vercel dashboard → **Deployments** → right-click previous version → **Promote to Production**

## Troubleshooting During Deployment

| Problem | Solution |
|---------|----------|
| 401 Unauthorized | GHL PIT is wrong/expired. Get new one from GHL App. |
| 500 Internal Error | Check Vercel logs. Missing env vars? |
| Empty response | No opportunities this month, or location ID wrong. |
| Timeout (>30s) | GHL API slow. This is normal, should cache after. |
| Network 404 | Function not deployed. Wait 5 min, redeploy. |

## Data Validation

After deployment, verify data correctness:

### Check Setters
- [ ] All setters appear in the Setters column
- [ ] `leadsAsignados` ≈ visible opportunities in GHL pipeline
- [ ] `citasAgendadas` matches appointments booked in GHL
- [ ] `shows` matches calendar appointments with status "showed"
- [ ] Numbers are consistent day-to-day

### Check Closers
- [ ] All closers appear in the Closers column
- [ ] `sits` = appointments shown (calendar "showed" status)
- [ ] Numbers increase as new appointments are added
- [ ] Discrepancies: compare with Google Sheets "CRM" column

### Compare with Google Sheets
1. Open Google Sheets
2. Check `Closers_2026-03` tab
3. Compare CRM column with Dashboard numbers
4. If different, investigate GHL data entry

## Success Criteria

Deployment is successful if:
- [ ] Serverless functions return 200 OK with valid JSON
- [ ] Dashboard displays CRM data for current month
- [ ] Data refreshes every 60 seconds without errors
- [ ] No console errors in browser dev tools
- [ ] Team confirms data looks correct vs. GHL
- [ ] No spike in Vercel function invocations (should be ~1 per minute)
- [ ] Vercel logs show healthy responses

## Sign-Off

Once all checks pass:

- [ ] Saul Lozano (or admin): Confirm deployment successful
- [ ] Team Lead: Verify data accuracy
- [ ] Timestamp: `__________` (date/time of sign-off)

## Documentation Updates

After successful deployment, update:
- [ ] README.md (if exists) with new CRM data flow
- [ ] Team wiki/handbook with "Dashboard gets real-time CRM data"
- [ ] Onboarding docs: "How the dashboard works"
- [ ] Troubleshooting guide: "Why are my numbers changing?"

---

**Deployment Date**: ___________
**Deployed By**: ___________
**Review Date**: __________ (48 hours after deployment)
