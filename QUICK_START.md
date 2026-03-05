# Quick Start: Deploy CRM-First Dashboard

⏱️ **Time to deploy**: ~15 minutes

## 🎯 What You're Doing

Migrating the AR Leaderboard from Google Sheets to **live GHL CRM data**. The dashboard will now show real-time KPIs updated every 60 seconds.

## 📋 Prerequisites

- [x] GHL CRM account with access to Orlando and Kissimmee locations
- [x] Vercel project already set up (ar-leaderboard)
- [x] Git push access to the repo

## 🚀 Step-by-Step Deployment

### Step 1: Get Your GHL Tokens (5 min)

1. Go to **GHL App** → Select **Orlando** location
2. Click **Settings** → **Integrations** → **API**
3. Find "Private Integration Token" and **copy it**
4. Repeat for **Kissimmee** location (you'll have 2 tokens total)
5. Keep them safe (don't share, don't commit to Git)

### Step 2: Add to Vercel (3 min)

1. Go to Vercel dashboard → Your project → **Settings**
2. Click **Environment Variables**
3. Add these two variables:

   | Key | Value |
   |-----|-------|
   | `GHL_PIT_ORLANDO` | Paste your Orlando token |
   | `GHL_PIT_KSS` | Paste your Kissimmee token |

4. Make sure **Production** is checked
5. Click **Save**

### Step 3: Deploy (2 min)

```bash
cd "/Users/saullozano/Auto Republic/ar-leaderboard"

git add .
git commit -m "Migrate to CRM-first architecture with serverless functions"
git push origin main
```

Wait 2-3 minutes for Vercel to deploy.

### Step 4: Verify (3 min)

Test that it's working:

```bash
# Replace ar-leaderboard.vercel.app with your actual URL
curl https://ar-leaderboard.vercel.app/api/ghl/setters
curl https://ar-leaderboard.vercel.app/api/ghl/closers-sits
```

Both should return JSON with team member data. If you get an error, skip to **Troubleshooting** below.

### Step 5: Test in Browser (2 min)

1. Open https://ar-leaderboard.vercel.app
2. Enter your viewer PIN
3. Check the **Setters** column:
   - Should show KPIs from GHL (leads, citas, shows, etc.)
   - Numbers should match your GHL pipeline
4. Check the **Closers** column:
   - **Sits** should match GHL calendar appointments
5. Wait 60 seconds, refresh → data should update

✓ **If you see CRM data, deployment successful!**

## 📊 What Changed

| Before | After |
|--------|-------|
| Data from Google Sheets (1 hour old) | Data from GHL CRM (real-time) |
| Manual Apps Script sync | Automatic serverless functions |
| Single data source (Sheets) | CRM-first + Sheets audit trail |

## ✅ Verification Checklist

After deployment:
- [ ] Both `/api/ghl/*` endpoints return JSON
- [ ] Dashboard displays data (not loading forever)
- [ ] Setters column shows KPI numbers
- [ ] Closers column shows sit counts
- [ ] Data refreshes every 60 seconds
- [ ] No red errors in browser console
- [ ] Numbers match your GHL data

## 🆘 Troubleshooting

### "401 Unauthorized" Error

**Cause**: GHL token is wrong or expired

**Fix**:
1. Log back into GHL App
2. Go to Settings → Integrations → API
3. Copy the token again
4. Update in Vercel environment variables
5. Wait 2 minutes and retry

### Empty Response (No Data)

**Cause**: No opportunities created this month, or location ID is wrong

**Fix**:
1. Check GHL App → Pipeline → you should see opportunities
2. Make sure opportunities are created THIS month
3. Check Vercel logs: `vercel logs --follow`
4. Look for error messages that hint at what's wrong

### "502 Bad Gateway" or "504 Timeout"

**Cause**: Function taking too long or crashing

**Fix**:
1. Wait 30 seconds (function might be cold-starting)
2. Try again
3. Check Vercel logs for error details
4. If persistent, verify GHL tokens are correct

### Dashboard Still Showing Sheets Data

**Cause**: React might be using cached data

**Fix**:
1. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear localStorage: Open DevTools → Application → Storage → Clear All
3. Refresh page
4. Should now show CRM data

## 📚 Need More Info?

- **Full Architecture Details**: See `ARCHITECTURE.md`
- **Setup Instructions**: See `VERCEL_SETUP.md`
- **Deployment Checklist**: See `DEPLOYMENT_CHECKLIST.md`
- **What Changed**: See `CRM_MIGRATION_SUMMARY.md`

## 🎉 Success!

If you got here, the dashboard is now **CRM-first**!

Your team will see:
- Real-time setter KPIs from GHL pipeline
- Real-time closer sits from GHL calendar
- Auto-refresh every 60 seconds
- Same photos, daily logs, and auth as before

## 📞 Next Steps

1. **Tell your team**: "Dashboard now shows live CRM data"
2. **Monitor for 24 hours**: Watch Vercel logs for errors
3. **Validate numbers**: Spot-check against GHL
4. **Optional**: After 48 hours, disable Apps Script trigger (keep code as backup)

---

**Questions?** Check the docs or reach out to the team.
