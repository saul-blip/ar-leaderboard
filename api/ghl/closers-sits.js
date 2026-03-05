/**
 * /api/ghl/closers-sits
 * Fetch closer "sits" (showed appointments) from GHL calendar for the current month
 *
 * Returns: { closers: { [personName]: sitCount } }
 */

import { fetchCalendarAppointments, extractCalendarSits, mergeKPIs } from './utils.js';
import { GHL_CONFIG, GHL_ID_TO_NAME } from './config.js';

function getCurrentMonth() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function getMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = new Date(year, month, 1).toISOString();
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();
  return { start, end };
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
    const { start, end } = getMonthRange();
    const monthKey = getCurrentMonth();

    // Get GHL PITs from environment variables
    const pitOrlando = process.env.GHL_PIT_ORLANDO;
    const pitKissimmee = process.env.GHL_PIT_KSS;

    if (!pitOrlando || !pitKissimmee) {
      console.error('Missing GHL PIT environment variables');
      return res.status(500).json({
        error: 'GHL credentials not configured',
        details: 'Set GHL_PIT_ORLANDO and GHL_PIT_KSS environment variables',
      });
    }

    console.log(`Fetching closer sits for ${monthKey}...`);

    // Fetch calendar appointments from both locations
    const [orlAppts, kssAppts] = await Promise.all([
      fetchCalendarAppointments(
        GHL_CONFIG.ORLANDO.locationId,
        pitOrlando,
        start,
        end
      ),
      fetchCalendarAppointments(
        GHL_CONFIG.KISSIMMEE.locationId,
        pitKissimmee,
        start,
        end
      ),
    ]);

    console.log(`Orlando: ${orlAppts.length} appointments, Kissimmee: ${kssAppts.length}`);

    // Extract sits (showed appointments) by closer
    const orlSits = extractCalendarSits(orlAppts, GHL_ID_TO_NAME);
    const kssSits = extractCalendarSits(kssAppts, GHL_ID_TO_NAME);

    // Merge sits from both locations
    const allSits = {};
    [orlSits, kssSits].forEach(sitsMap => {
      for (const [name, count] of Object.entries(sitsMap)) {
        allSits[name] = (allSits[name] || 0) + count;
      }
    });

    // Filter to only closers
    const closerNames = new Set([
      'Fabiola Iorio', 'Laura Indriago', 'María De Gouveia', 'Eleazar Hidalgo',
      'Christopher Cepeda', 'Juan Rodriguez', 'Nickol Montero',
    ]);

    const closerSits = {};
    for (const [name, count] of Object.entries(allSits)) {
      if (closerNames.has(name)) {
        closerSits[name] = count;
      }
    }

    console.log(`Closer sits: ${JSON.stringify(closerSits)}`);

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
