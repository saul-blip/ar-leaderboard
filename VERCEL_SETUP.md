# Vercel Setup Guide

## Quick Start

### 1. Get Your GHL Private Integration Tokens (PITs)

1. Go to **GHL App** → Select a **Location** (e.g., Orlando)
2. Click **Settings** → **Integrations** → **API**
3. Find the **Private Integration Token** section
4. Copy the token (keep it secret!)
5. Repeat for your second location (Kissimmee)

### 2. Add Environment Variables to Vercel

Go to your Vercel project dashboard:

1. **Settings** → **Environment Variables**
2. Add two variables:

| Key | Value |
|-----|-------|
| `GHL_PIT_ORLANDO` | Your Orlando PIT |
| `GHL_PIT_KSS` | Your Kissimmee PIT |

3. Make sure **PRODUCTION** is checked
4. Click **Save**

### 3. Deploy

The serverless functions are already in `/api/ghl/` and will deploy automatically:

```bash
git add .
git commit -m "Add CRM-first serverless functions"
git push origin main
```

Vercel will automatically detect the API functions and deploy them.

### 4. Test

Wait 2-3 minutes for deployment, then test:

```bash
# Replace with your Vercel URL
curl https://ar-leaderboard.vercel.app/api/ghl/setters
curl https://ar-leaderboard.vercel.app/api/ghl/closers-sits
```

Both should return JSON with data from GHL.

## Local Development

### 1. Create `.env.local`

```bash
cp .env.example .env.local
```

Edit with your actual GHL PITs:
```
GHL_PIT_ORLANDO=your_token_here
GHL_PIT_KSS=your_token_here
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Dev Server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### 4. Test Serverless Functions Locally

Vercel functions run at `/api/*`:

```bash
curl http://localhost:3000/api/ghl/setters
curl http://localhost:3000/api/ghl/closers-sits
```

**Note**: React Vite runs on port 5173, but serverless functions are on port 3000 in local dev.

## Troubleshooting

### "401 Unauthorized" Error

**Cause**: GHL PIT is invalid, wrong, or expired.

**Fix**:
1. Go back to GHL App → Settings → Integrations → API
2. Copy the PIT again (make sure you're in the right location)
3. Update in Vercel environment variables
4. Wait 1-2 minutes for deployment
5. Test again

### Empty Response from `/api/ghl/setters`

**Cause**: No opportunities created this month, or location ID is wrong.

**Fix**:
1. Check GHL App → Pipeline → Master (or your pipeline)
2. Make sure you have opportunities created this month
3. Verify location ID in `/api/ghl/config.js` matches GHL settings
4. Check Vercel logs for error messages

### "Cannot find module" Error

**Cause**: Missing dependency or syntax error.

**Fix**:
1. Check Vercel logs for full error
2. Verify `/api/ghl/*.js` files exist and have correct imports
3. Check for typos in filenames and import paths
4. Redeploy

### Slow Response (> 5 seconds)

**Cause**: GHL API is slow or paginating through many records.

**Fix**:
- This is normal during first load or if you have 1000+ opportunities
- Subsequent calls are cached by GHL API (no database polling)
- Consider adding Redis caching in future phases

## Environment Variables Reference

| Variable | Location | Scope |
|----------|----------|-------|
| `GHL_PIT_ORLANDO` | Vercel Settings → Env Vars | PRODUCTION |
| `GHL_PIT_KSS` | Vercel Settings → Env Vars | PRODUCTION |

**Never commit PITs to Git!** They should only exist in:
- `.env.local` (local dev, gitignored)
- Vercel project settings
- GitHub Secrets (if using CI/CD)

## Monitoring

### Check Real-Time Logs

```bash
vercel logs --follow
```

### Check Environment Variables

```bash
vercel env pull
```

This downloads your Vercel env vars (masked) to verify they're set.

### Check Deployment Status

```bash
vercel list
```

Shows all deployments. Green ✓ = successful, red ✗ = failed.

## Rollback

If something breaks:

```bash
vercel rollback
```

This reverts to the previous successful deployment.

## Next Steps

1. ✅ Set environment variables
2. ✅ Deploy to Vercel
3. ✅ Test endpoints
4. Monitor Vercel logs for 24 hours
5. Alert team: "Dashboard now pulls real-time data from GHL CRM"
6. Optional: Retire Apps Script (keep as backup for now)

---

**Questions?** Check ARCHITECTURE.md for detailed info.
