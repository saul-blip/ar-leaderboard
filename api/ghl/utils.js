/**
 * Utility functions for GHL API calls
 */

import { GHL_API_BASE, GHL_API_VERSION } from './config.js';

/**
 * Helper: Make a paginated GHL API request
 * @param {string} locationId - GHL location ID
 * @param {string} pit - Private Integration Token
 * @param {string} endpoint - API endpoint path (without base URL)
 * @param {object} params - Query parameters
 * @returns {Promise<object[]>} - Array of all items across all pages
 */
export async function fetchGHLPaginated(locationId, pit, endpoint, params = {}) {
  if (!pit) {
    throw new Error(`GHL PIT not configured for location ${locationId}`);
  }

  const items = [];
  let nextPageUrl = null;

  // Build initial URL
  const searchParams = new URLSearchParams({
    location_id: locationId,
    limit: 100,
    ...params,
  });

  let url = `${GHL_API_BASE}${endpoint}?${searchParams.toString()}`;

  while (url) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${pit}`,
          'Version': GHL_API_VERSION,
          'Content-Type': 'application/json',
        },
      });

      // Handle rate limiting
      if (response.status === 429 || response.status === 503) {
        console.log(`Rate limited (${response.status}), waiting 2s...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue; // Retry same URL
      }

      if (!response.ok) {
        const text = await response.text();
        console.error(`GHL API error (${response.status}):`, text.slice(0, 300));
        break;
      }

      const data = await response.json();
      const pageItems = data.opportunities || data.appointments || data.items || [];
      items.push(...pageItems);

      // Get next page URL
      nextPageUrl = data.meta?.nextPageUrl || null;
      url = nextPageUrl;

      // Small delay between pages to avoid rate limits
      if (url) await new Promise(resolve => setTimeout(resolve, 50));

    } catch (error) {
      console.error(`GHL fetch error: ${error.message}`);
      break;
    }
  }

  return items;
}

/**
 * Fetch all opportunities for a location for the current month
 * @param {string} locationId
 * @param {string} pit
 * @param {string} pipelineId
 * @param {string} monthStart - ISO string for month start
 * @returns {Promise<object[]>}
 */
export async function fetchAllGHLOpportunities(locationId, pit, pipelineId, monthStart) {
  const monthStartMs = new Date(monthStart).getTime();
  const allOpps = [];

  // GHL 'date'/'endDate' params cause 400 — do not use server-side date filter.
  // Instead, rely on API returning opportunities newest-first and exit early
  // once a full page has zero current-month opps (proven efficient in practice).
  let url = `${GHL_API_BASE}/opportunities/search?location_id=${locationId}&pipeline_id=${pipelineId}&limit=100`;

  while (url) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${pit}`,
          'Version': GHL_API_VERSION,
          'Content-Type': 'application/json',
        },
      });

      // Handle rate limiting
      if (response.status === 429 || response.status === 503) {
        console.log(`Rate limited (${response.status}), waiting 2s...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }

      if (!response.ok) {
        const text = await response.text();
        console.error(`GHL opportunities error (${response.status}):`, text.slice(0, 300));
        break;
      }

      const data = await response.json();
      const opps = data.opportunities || [];

      let pageHasCurrentMonth = false;
      for (const opp of opps) {
        if (new Date(opp.createdAt).getTime() >= monthStartMs) {
          allOpps.push(opp);
          pageHasCurrentMonth = true;
        }
      }

      // API returns newest first — if an entire page has no current-month opps,
      // all subsequent pages will be even older, so stop early.
      if (opps.length > 0 && !pageHasCurrentMonth) break;

      url = data.meta?.nextPageUrl || null;
      if (url) await new Promise(resolve => setTimeout(resolve, 50));

    } catch (error) {
      console.error(`GHL opportunities fetch error: ${error.message}`);
      break;
    }
  }

  return allOpps;
}

/**
 * Fetch calendar appointments for a location (month range)
 * @param {string} locationId
 * @param {string} pit
 * @param {string} monthStart - ISO string for month start
 * @param {string} monthEnd - ISO string for month end
 * @returns {Promise<object[]>}
 */
export async function fetchCalendarAppointments(locationId, pit, monthStart, monthEnd) {
  const allAppts = [];

  let url = `${GHL_API_BASE}/appointments/?locationId=${locationId}&startDate=${encodeURIComponent(monthStart)}&endDate=${encodeURIComponent(monthEnd)}&limit=100`;

  while (url) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${pit}`,
          'Version': GHL_API_VERSION,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 429 || response.status === 503) {
        console.log(`Rate limited (${response.status}), waiting 2s...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }

      if (!response.ok) {
        const text = await response.text();
        console.error(`GHL calendar error (${response.status}):`, text.slice(0, 300));
        break;
      }

      const data = await response.json();
      const appts = data.appointments || data.items || [];
      allAppts.push(...appts);

      url = data.meta?.nextPageUrl || null;
      if (url) await new Promise(resolve => setTimeout(resolve, 50));

    } catch (error) {
      console.error(`GHL calendar fetch error: ${error.message}`);
      break;
    }
  }

  return allAppts;
}

/**
 * Compute KPIs from opportunities
 * @param {object[]} opps - Opportunities array
 * @param {object} stages - Stage sets configuration
 * @param {object} idToName - GHL ID to name mapping
 * @returns {object} - { [personName]: { leadsAsignados, contactados, ... } }
 */
export function computePersonKPIs(opps, stages, idToName) {
  const kpis = {};

  for (const opp of opps) {
    const userId = opp.assignedTo;
    if (!userId) continue;

    const name = idToName[userId];
    if (!name) continue;

    if (!kpis[name]) {
      kpis[name] = {
        leadsAsignados: 0,
        leadsNuevos: 0,
        contactados: 0,
        citasAgendadas: 0,
        shows: 0,
        aplicaron: 0,
        aprobados: 0,
        negados: 0,
        ventas: 0,
      };
    }

    const s = opp.pipelineStageId;
    kpis[name].leadsAsignados++;
    kpis[name].leadsNuevos++; // All opportunities count as new leads for now
    if (stages.contactadoSet.has(s)) kpis[name].contactados++;
    if (stages.citaSet.has(s)) kpis[name].citasAgendadas++;
    if (stages.showSet.has(s)) kpis[name].shows++;
    if (stages.aplicaronSet.has(s)) kpis[name].aplicaron++;
    if (stages.aprobadosSet.has(s)) kpis[name].aprobados++;
    if (s === stages.negado) kpis[name].negados++;
    if (s === stages.vendido) kpis[name].ventas++;
  }

  return kpis;
}

/**
 * Extract calendar "sits" (showed appointments) by closer
 * @param {object[]} appts - Appointments array
 * @param {object} idToName - GHL ID to name mapping
 * @returns {object} - { [personName]: sitCount }
 */
export function extractCalendarSits(appts, idToName) {
  const sits = {};

  for (const appt of appts) {
    // Match both field name variants across GHL API versions
    const status = appt.appointmentStatus || appt.status || '';
    if (status !== 'showed') continue;

    const userId = appt.assignedUserId || appt.userId || '';
    if (!userId) continue;

    const name = idToName[userId];
    if (!name) {
      console.log(`Calendar: unknown userId=${userId}`);
      continue;
    }

    sits[name] = (sits[name] || 0) + 1;
  }

  return sits;
}

/**
 * Fetch calendar events for a specific user (closer) using /calendars/events
 * This endpoint requires userId, calendarId, or groupId - we use userId per closer
 * @param {string} locationId - GHL location ID
 * @param {string} pit - Private Integration Token
 * @param {string} userId - GHL user ID of the closer
 * @param {number} startMs - Start time in milliseconds (Unix timestamp)
 * @param {number} endMs - End time in milliseconds (Unix timestamp)
 * @returns {Promise<object[]>} - Array of calendar events
 */
export async function fetchCalendarEventsByUserId(locationId, pit, userId, startMs, endMs) {
  if (!pit) throw new Error(`GHL PIT not configured for location ${locationId}`);

  const allEvents = [];
  let url = `${GHL_API_BASE}/calendars/events?locationId=${locationId}&userId=${userId}&startTime=${startMs}&endTime=${endMs}`;

  while (url) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${pit}`,
          'Version': GHL_API_VERSION,
        },
      });

      if (response.status === 429 || response.status === 503) {
        console.log(`Rate limited (${response.status}), waiting 2s...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }

      if (!response.ok) {
        const text = await response.text();
        console.error(`GHL calendar events error for user ${userId} (${response.status}):`, text.slice(0, 300));
        break;
      }

      const data = await response.json();
      const events = data.events || data.appointments || data.items || [];
      allEvents.push(...events);

      url = data.meta?.nextPageUrl || null;
      if (url) await new Promise(resolve => setTimeout(resolve, 50));

    } catch (error) {
      console.error(`GHL calendar events fetch error for user ${userId}: ${error.message}`);
      break;
    }
  }

  return allEvents;
}

/**
 * Merge KPIs from multiple locations
 * @param {object[]} kpiArrays - Array of KPI objects
 * @returns {object} - Merged KPIs
 */
export function mergeKPIs(...kpiArrays) {
  const merged = {};
  const keys = ['leadsAsignados', 'leadsNuevos', 'contactados', 'citasAgendadas',
                'shows', 'aplicaron', 'aprobados', 'negados', 'ventas'];

  for (const kpis of kpiArrays) {
    for (const [name, kpi] of Object.entries(kpis)) {
      if (!merged[name]) {
        merged[name] = { ...kpi };
      } else {
        for (const k of keys) {
          merged[name][k] = (merged[name][k] || 0) + (kpi[k] || 0);
        }
      }
    }
  }

  return merged;
}
