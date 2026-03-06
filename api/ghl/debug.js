/**
 * Debug endpoint - tests GHL API connectivity and shows raw errors
 * GET /api/ghl/debug
 */

export const config = { maxDuration: 30 };

const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const GHL_API_VERSION = '2021-07-28';

const ORLANDO_LOCATION  = 'ez4QcQYqIRKvgT8fIQ22';
const ORLANDO_PIPELINE  = 'YrNc8hcJFysZAUEuZIvx';
const KSS_LOCATION      = 'Vzt98VtJ6jqBE2dYYlnj';
const KSS_PIPELINE      = 'pj8Z0eoyQCz2WKIHFXAX';

export default async function handler(req, res) {
  const pitOrl = process.env.GHL_PIT_ORLANDO;
  const pitKss = process.env.GHL_PIT_KSS;

  const results = {};

  // Test 1: Orlando opportunities
  try {
    const url = `${GHL_API_BASE}/opportunities/search?location_id=${ORLANDO_LOCATION}&pipeline_id=${ORLANDO_PIPELINE}&limit=5`;
    const r = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${pitOrl}`,
        'Version': GHL_API_VERSION,
        'Content-Type': 'application/json',
      }
    });
    const body = await r.text();
    results.orl_opportunities = {
      status: r.status,
      ok: r.ok,
      body: body.slice(0, 500),
    };
  } catch(e) {
    results.orl_opportunities = { error: e.message };
  }

  // Test 2: Kissimmee opportunities
  try {
    const url = `${GHL_API_BASE}/opportunities/search?location_id=${KSS_LOCATION}&pipeline_id=${KSS_PIPELINE}&limit=5`;
    const r = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${pitKss}`,
        'Version': GHL_API_VERSION,
        'Content-Type': 'application/json',
      }
    });
    const body = await r.text();
    results.kss_opportunities = {
      status: r.status,
      ok: r.ok,
      body: body.slice(0, 500),
    };
  } catch(e) {
    results.kss_opportunities = { error: e.message };
  }

  // Test 3: Orlando contacts (simpler endpoint to verify auth)
  try {
    const url = `${GHL_API_BASE}/contacts/?locationId=${ORLANDO_LOCATION}&limit=1`;
    const r = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${pitOrl}`,
        'Version': GHL_API_VERSION,
      }
    });
    const body = await r.text();
    results.orl_contacts = {
      status: r.status,
      ok: r.ok,
      body: body.slice(0, 300),
    };
  } catch(e) {
    results.orl_contacts = { error: e.message };
  }

  // Test 4: Calendars KSS (various endpoint formats)
  const now2 = new Date();
  const calStart = new Date(now2.getFullYear(), now2.getMonth(), 1).toISOString();
  const calEnd   = now2.toISOString();
  const calStartMs = new Date(now2.getFullYear(), now2.getMonth(), 1).getTime();
  const calEndMs   = now2.getTime();

  // Try /calendars/events
  try {
    const url = `${GHL_API_BASE}/calendars/events?locationId=${KSS_LOCATION}&startTime=${calStartMs}&endTime=${calEndMs}&limit=5`;
    const r = await fetch(url, {
      headers: { 'Authorization': `Bearer ${pitKss}`, 'Version': GHL_API_VERSION }
    });
    const body = await r.text();
    results.kss_cal_events = { status: r.status, ok: r.ok, body: body.slice(0, 400) };
  } catch(e) { results.kss_cal_events = { error: e.message }; }

  // Try /appointments/ with camelCase
  try {
    const url = `${GHL_API_BASE}/appointments/?locationId=${KSS_LOCATION}&startDate=${encodeURIComponent(calStart)}&endDate=${encodeURIComponent(calEnd)}&limit=5`;
    const r = await fetch(url, {
      headers: { 'Authorization': `Bearer ${pitKss}`, 'Version': GHL_API_VERSION }
    });
    const body = await r.text();
    results.kss_appointments = { status: r.status, ok: r.ok, body: body.slice(0, 400) };
  } catch(e) { results.kss_appointments = { error: e.message }; }

  // Get KSS opportunities full (to see real stage IDs)
  try {
    const url = `${GHL_API_BASE}/opportunities/search?location_id=${KSS_LOCATION}&pipeline_id=${KSS_PIPELINE}&limit=100`;
    const r = await fetch(url, {
      headers: { 'Authorization': `Bearer ${pitKss}`, 'Version': GHL_API_VERSION, 'Content-Type': 'application/json' }
    });
    const data = await r.json();
    const stageCounts = {};
    (data.opportunities || []).forEach(o => {
      stageCounts[o.pipelineStageId] = (stageCounts[o.pipelineStageId] || 0) + 1;
    });
    results.kss_stage_ids = { status: r.status, stageCounts, total: data.meta?.total, returned: data.opportunities?.length };
  } catch(e) { results.kss_stage_ids = { error: e.message }; }

  // Get KSS calendars list
  try {
    const url = `${GHL_API_BASE}/calendars/?locationId=${KSS_LOCATION}`;
    const r = await fetch(url, {
      headers: { 'Authorization': `Bearer ${pitKss}`, 'Version': GHL_API_VERSION }
    });
    const body = await r.text();
    results.kss_calendars_list = { status: r.status, ok: r.ok, body: body.slice(0, 800) };
  } catch(e) { results.kss_calendars_list = { error: e.message }; }

  // Test /calendars/events with a KSS closer userId
  try {
    const closerUserId = 'LPtafFQB9QJg9t4YTw98'; // Christopher Cepeda KSS
    const url = `${GHL_API_BASE}/calendars/events?locationId=${KSS_LOCATION}&userId=${closerUserId}&startTime=${calStartMs}&endTime=${calEndMs}`;
    const r = await fetch(url, {
      headers: { 'Authorization': `Bearer ${pitKss}`, 'Version': GHL_API_VERSION }
    });
    const body = await r.text();
    results.kss_cal_by_user = { status: r.status, ok: r.ok, body: body.slice(0, 500) };
  } catch(e) { results.kss_cal_by_user = { error: e.message }; }

  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    timestamp: new Date().toISOString(),
    env_vars_present: {
      GHL_PIT_ORLANDO: !!pitOrl,
      GHL_PIT_KSS: !!pitKss,
      orl_prefix: pitOrl?.slice(0, 10),
      kss_prefix: pitKss?.slice(0, 10),
    },
    results,
  });
}
