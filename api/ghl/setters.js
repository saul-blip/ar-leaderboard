/**
 * /api/ghl/setters
 * Fetch setter KPIs from GHL API for the current month
 *
 * Returns: { setters: { [personName]: { leadsAsignados, leadsNuevos, contactados,
 *                                         citasAgendadas, shows, aplicaron, aprobados,
 *                                         negados, ventas } } }
 */

import {
  fetchAllGHLOpportunities,
  computePersonKPIs,
  mergeKPIs,
} from './utils.js';
import { GHL_CONFIG, GHL_ID_TO_NAME } from './config.js';

function getCurrentMonth() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function getMonthStartISOString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return new Date(year, month, 1).toISOString();
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
    const monthStart = getMonthStartISOString();
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

    console.log(`Fetching setter KPIs for ${monthKey}...`);

    // Fetch opportunities from both locations
    const [orlOpps, kssOpps] = await Promise.all([
      fetchAllGHLOpportunities(
        GHL_CONFIG.ORLANDO.locationId,
        pitOrlando,
        GHL_CONFIG.ORLANDO.pipelineId,
        monthStart
      ),
      fetchAllGHLOpportunities(
        GHL_CONFIG.KISSIMMEE.locationId,
        pitKissimmee,
        GHL_CONFIG.KISSIMMEE.pipelineId,
        monthStart
      ),
    ]);

    console.log(`Orlando: ${orlOpps.length} opportunities, Kissimmee: ${kssOpps.length}`);

    // Compute KPIs for each location
    const orlKpis = computePersonKPIs(orlOpps, GHL_CONFIG.ORLANDO.stages, GHL_ID_TO_NAME);
    const kssKpis = computePersonKPIs(kssOpps, GHL_CONFIG.KISSIMMEE.stages, GHL_ID_TO_NAME);

    // Merge KPIs from both locations
    const allKpis = mergeKPIs(orlKpis, kssKpis);

    // Filter to only setters (not closers)
    const closerNames = new Set([
      'Fabiola Iorio', 'Laura Indriago', 'María De Gouveia', 'Eleazar Hidalgo',
      'Christopher Cepeda', 'Juan Rodriguez', 'Nickol Montero',
    ]);

    const setterKpis = {};
    for (const [name, kpi] of Object.entries(allKpis)) {
      if (!closerNames.has(name)) {
        setterKpis[name] = kpi;
      }
    }

    console.log(`Setters KPIs computed for ${Object.keys(setterKpis).length} people`);

    return res.status(200).json({
      monthKey,
      timestamp: new Date().toISOString(),
      setters: setterKpis,
    });

  } catch (error) {
    console.error('Error fetching setter KPIs:', error);
    return res.status(500).json({
      error: 'Failed to fetch setter KPIs',
      details: error.message,
    });
  }
}
