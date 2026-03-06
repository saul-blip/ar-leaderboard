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

  const now2 = new Date();
  const calStartMs = new Date(now2.getFullYear(), now2.getMonth(), 1).getTime();
  const calEndMs   = now2.getTime();

  // Test 1: KSS opportunities (full sample - check assignedTo field)
  try {
    const url = `${GHL_API_BASE}/opportunities/search?location_id=${KSS_LOCATION}&pipeline_id=${KSS_PIPELINE}&limit=5`;
    const r = await fetch(url, {
      headers: { 'Authorization': `Bearer ${pitKss}`, 'Version': GHL_API_VERSION, 'Content-Type': 'application/json' }
    });
    const data = await r.json();
    const opp = data.opportunities?.[0];
    results.kss_opp_sample = {
      status: r.status,
      total: data.meta?.total,
      returned: data.opportunities?.length,
      // Show all keys and key field values of first opportunity
      first_opp_keys: opp ? Object.keys(opp) : [],
      first_opp_assignedTo: opp?.assignedTo,
      first_opp_assigned_to: opp?.assigned_to,
      first_opp_userId: opp?.userId,
      first_opp_contact_assignedTo: opp?.contact?.assignedTo,
      first_opp_pipelineStageId: opp?.pipelineStageId,
      first_opp_createdAt: opp?.createdAt,
      first_opp_name: opp?.name,
    };
  } catch(e) { results.kss_opp_sample = { error: e.message }; }

  // Test 2: KSS pipeline stages (to get stage ID → stage name mapping)
  try {
    const url = `${GHL_API_BASE}/opportunities/pipelines/${KSS_PIPELINE}?locationId=${KSS_LOCATION}`;
    const r = await fetch(url, {
      headers: { 'Authorization': `Bearer ${pitKss}`, 'Version': GHL_API_VERSION }
    });
    const body = await r.text();
    results.kss_pipeline_stages = { status: r.status, ok: r.ok, body: body.slice(0, 2000) };
  } catch(e) { results.kss_pipeline_stages = { error: e.message }; }

  // Test 3: ORL pipeline stages
  try {
    const url = `${GHL_API_BASE}/opportunities/pipelines/${ORLANDO_PIPELINE}?locationId=${ORLANDO_LOCATION}`;
    const r = await fetch(url, {
      headers: { 'Authorization': `Bearer ${pitOrl}`, 'Version': GHL_API_VERSION }
    });
    const body = await r.text();
    results.orl_pipeline_stages = { status: r.status, ok: r.ok, body: body.slice(0, 2000) };
  } catch(e) { results.orl_pipeline_stages = { error: e.message }; }

  // Test 4: KSS stage ID counts (full 100 opps to see distribution)
  try {
    const url = `${GHL_API_BASE}/opportunities/search?location_id=${KSS_LOCATION}&pipeline_id=${KSS_PIPELINE}&limit=100`;
    const r = await fetch(url, {
      headers: { 'Authorization': `Bearer ${pitKss}`, 'Version': GHL_API_VERSION, 'Content-Type': 'application/json' }
    });
    const data = await r.json();
    const stageCounts = {};
    const assignedCounts = {};
    (data.opportunities || []).forEach(o => {
      stageCounts[o.pipelineStageId] = (stageCounts[o.pipelineStageId] || 0) + 1;
      const aid = o.assignedTo || o.assigned_to || o.userId || 'unknown';
      assignedCounts[aid] = (assignedCounts[aid] || 0) + 1;
    });
    results.kss_distribution = {
      status: r.status,
      total: data.meta?.total,
      returned: data.opportunities?.length,
      stageCounts,
      // Top 15 assigned user IDs by count
      topAssigned: Object.entries(assignedCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([id, count]) => ({ id, count })),
    };
  } catch(e) { results.kss_distribution = { error: e.message }; }

  // Test 5: ORL opportunities (check if PIT is valid)
  try {
    const url = `${GHL_API_BASE}/opportunities/search?location_id=${ORLANDO_LOCATION}&pipeline_id=${ORLANDO_PIPELINE}&limit=5`;
    const r = await fetch(url, {
      headers: { 'Authorization': `Bearer ${pitOrl}`, 'Version': GHL_API_VERSION, 'Content-Type': 'application/json' }
    });
    const body = await r.text();
    results.orl_opportunities = { status: r.status, ok: r.ok, body: body.slice(0, 400) };
  } catch(e) { results.orl_opportunities = { error: e.message }; }

  // Test 6: KSS calendar by userId (Christopher Cepeda - confirmed working)
  try {
    const closerUserId = 'LPtafFQB9QJg9t4YTw98';
    const url = `${GHL_API_BASE}/calendars/events?locationId=${KSS_LOCATION}&userId=${closerUserId}&startTime=${calStartMs}&endTime=${calEndMs}`;
    const r = await fetch(url, {
      headers: { 'Authorization': `Bearer ${pitKss}`, 'Version': GHL_API_VERSION }
    });
    const data = await r.json();
    const events = data.events || [];
    const showCount = events.filter(e => (e.appointmentStatus || e.status) === 'showed').length;
    results.kss_cal_christopher = {
      status: r.status,
      ok: r.ok,
      totalEvents: events.length,
      showedCount: showCount,
      sample: events[0] ? {
        appointmentStatus: events[0].appointmentStatus,
        status: events[0].status,
        assignedUserId: events[0].assignedUserId,
        userId: events[0].userId,
        calendarId: events[0].calendarId,
        startTime: events[0].startTime,
      } : null,
    };
  } catch(e) { results.kss_cal_christopher = { error: e.message }; }

  // Test 7a: KSS date filter with 'startDate' param (try alternative to broken 'date' param)
  try {
    const monthStartIso = new Date(now2.getFullYear(), now2.getMonth(), 1).toISOString();
    const url = `${GHL_API_BASE}/opportunities/search?location_id=${KSS_LOCATION}&pipeline_id=${KSS_PIPELINE}&limit=5&startDate=${encodeURIComponent(monthStartIso)}&endDate=${encodeURIComponent(now2.toISOString())}`;
    const r = await fetch(url, {
      headers: { 'Authorization': `Bearer ${pitKss}`, 'Version': GHL_API_VERSION, 'Content-Type': 'application/json' }
    });
    const body = await r.text();
    results.kss_startDate_filter = { status: r.status, ok: r.ok, body: body.slice(0, 300) };
  } catch(e) { results.kss_startDate_filter = { error: e.message }; }

  // Test 7b: KSS no filter - check first 5 opp createdAt values to verify sort order
  try {
    const url = `${GHL_API_BASE}/opportunities/search?location_id=${KSS_LOCATION}&pipeline_id=${KSS_PIPELINE}&limit=5`;
    const r = await fetch(url, {
      headers: { 'Authorization': `Bearer ${pitKss}`, 'Version': GHL_API_VERSION, 'Content-Type': 'application/json' }
    });
    const data = await r.json();
    const opps = data.opportunities || [];
    results.kss_sort_order = {
      status: r.status,
      // Show createdAt for first 5 to verify newest-first sort
      createdAts: opps.map(o => ({ createdAt: o.createdAt, assignedTo: o.assignedTo, stage: o.pipelineStageId })),
    };
  } catch(e) { results.kss_sort_order = { error: e.message }; }

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
