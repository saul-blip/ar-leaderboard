/**
 * /api/ghl/closers-sits
 * Fetch closer "sits" (showed appointments) from GHL calendar for the current month
 *
 * Uses /calendars/events?userId=xxx endpoint (confirmed working via debug tests).
 * The /appointments/ endpoint returns 404; /calendars/events requires userId, calendarId, or groupId.
 *
 * Returns: { monthKey, timestamp, closers: { [personName]: sitCount } }
 */

export const config = { maxDuration: 30 };

import { fetchCalendarEventsByUserId } from './utils.js';
import { GHL_CONFIG, GHL_ID_TO_NAME } from './config.js';

function getCurrentMonth() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function getMonthRangeMs() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const startMs = new Date(year, month, 1).getTime();
  const endMs = now.getTime();
  return { startMs, endMs };
}

// Closer user IDs per location (must match GHL_ID_TO_NAME keys in config.js)
const ORL_CLOSER_IDS = [
  'Uv683v0pSIMCgPD91TOb', // Fabiola Iorio
  'y75JjO6sSjq0nL5Xw6JF', // Laura Indriago
  'QySpqRrxcWXr1YF0jyY3', // María De Gouveia
  'hc2or5bP7DIJiII9FrYY', // Eleazar Hidalgo
];

const KSS_CLOSER_IDS = [
  'LPtafFQB9QJg9t4YTw98', // Christopher Cepeda
  '2OIjTh9wVWhLegmwnoUT', // Juan Rodriguez
  'fKqeUgb4DHI8OjvOvi2Q', // Nickol Montero
];

/** Count events with appointmentStatus === 'showed' */
function countShows(events) {
  let count = 0;
  for (const e of events) {
    const status = e.appointmentStatus || e.status || '';
    if (status === 'showed') count++;
  }
  return count;
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { startMs, endMs } = getMonthRangeMs();
    const monthKey = getCurrentMonth();

    const pitOrlando = process.env.GHL_PIT_ORLANDO;
    const pitKissimmee = process.env.GHL_PIT_KSS;

    console.log(`Fetching closer sits for ${monthKey} (startMs=${startMs}, endMs=${endMs})...`);

    const closerSits = {};

    // Helper: fetch events for a list of userIds and accumulate shows
    async function fetchSitsForClosers(locationId, pit, userIds, label) {
      if (!pit) {
        console.warn(`${label}: No PIT configured, skipping`);
        return;
      }
      const promises = userIds.map(userId =>
        fetchCalendarEventsByUserId(locationId, pit, userId, startMs, endMs)
          .then(events => {
            const name = GHL_ID_TO_NAME[userId];
            const shows = countShows(events);
            console.log(`${label} ${name || userId}: ${events.length} events, ${shows} shows`);
            if (name && shows > 0) {
              closerSits[name] = (closerSits[name] || 0) + shows;
            }
          })
          .catch(err => {
            console.error(`${label} calendar error for userId=${userId}: ${err.message}`);
          })
      );
      await Promise.all(promises);
    }

    // Fetch KSS closers (PIT confirmed working)
    await fetchSitsForClosers(
      GHL_CONFIG.KISSIMMEE.locationId,
      pitKissimmee,
      KSS_CLOSER_IDS,
      'KSS'
    );

    // Fetch ORL closers (PIT may be invalid — errors handled gracefully per user)
    await fetchSitsForClosers(
      GHL_CONFIG.ORLANDO.locationId,
      pitOrlando,
      ORL_CLOSER_IDS,
      'ORL'
    );

    console.log(`Closer sits result: ${JSON.stringify(closerSits)}`);

    return res.status(200).json({
      monthKey,
      timestamp: new Date().toISOString(),
      closers: closerSits,
    });

  } catch (error) {
    console.error('Error fetching closer sits:', error);
    return res.status(500).json({
      error: 'Failed to fetch closer sits',
      details: error.message,
    });
  }
}
