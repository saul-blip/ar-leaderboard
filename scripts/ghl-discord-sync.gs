/**
 * ghl-discord-sync.gs
 * Auto-sync: GHL pipeline → Setter KPIs + Discord #general → Closer Ventas
 *
 * SETUP:
 * 1. Paste this file into the same Apps Script project as daily-log.gs
 * 2. Run syncAll() manually once to verify
 * 3. Add a time-driven trigger: syncAll → every hour (or every day at 6am)
 *
 * WHAT IT DOES:
 * - Reads ALL opportunities in the Master pipeline (ORL + KSS) for the current month
 * - Groups by assignedTo user → computes Setter KPIs (Leads, Citas, Shows, etc.)
 * - Reads #general Discord for "FLASH NEWS" sale posts → computes Closer Ventas
 * - Writes everything to Closers_YYYY-MM and Setters_YYYY-MM tabs
 *
 * IMPORTANT: This script OVERWRITES the KPI columns it owns each run.
 * Daily log entries (written by daily-log.gs) handle other closer columns.
 */

// ─── CONFIGURATION ────────────────────────────────────────────
// Secrets are stored in Apps Script PropertiesService (NOT in code).
// To set them: Apps Script editor → Project Settings → Script Properties
//   DISCORD_TOKEN    = <Command Center bot token>
//   GHL_PIT_ORLANDO  = <Orlando Private Integration Token>
//   GHL_PIT_KSS      = <Kissimmee Private Integration Token>
function getSecrets() {
  const p = PropertiesService.getScriptProperties();
  return {
    discordToken:  p.getProperty('DISCORD_TOKEN'),
    pitOrlando:    p.getProperty('GHL_PIT_ORLANDO'),
    pitKissimmee:  p.getProperty('GHL_PIT_KSS'),
  };
}

// ─── Make.com proxy URL (bypasses GCP Discord IP block) ───────
// Make scenario: Webhooks → HTTP (Discord) → Webhook Response
// Apps Script POSTs {"auth":"Bot TOKEN","url":"DISCORD_URL"} here.
const MAKE_PROXY_URL = 'https://hook.us2.make.com/wid5i6oqw3l13pnau2gn2ffi4lhpnd7u';

/**
 * Fetch Discord messages via Make.com proxy.
 * @param {string} discordUrl  Full Discord API URL (with limit + optional before=)
 * @returns {Array|null}       Parsed JSON array of messages, or null on error
 */
function fetchDiscordMessages(discordUrl) {
  const secrets = getSecrets();
  const body    = JSON.stringify({ auth: 'Bot ' + secrets.discordToken, url: discordUrl });
  const res     = UrlFetchApp.fetch(MAKE_PROXY_URL, {
    method:          'post',
    contentType:     'application/json',
    payload:         body,
    muteHttpExceptions: true,
  });
  const code = res.getResponseCode();
  if (code !== 200) {
    Logger.log('Make proxy HTTP ' + code + ': ' + res.getContentText().slice(0, 300));
    return null;
  }
  const text = res.getContentText();
  try {
    return JSON.parse(text);
  } catch (e) {
    Logger.log('Make proxy parse error: ' + text.slice(0, 300));
    return null;
  }
}

const GDS = {
  SHEET_ID: '16LaMfxt2SLhYyBTKpHOthvxupr-fT2v5TiOBbtDaUls',

  DISCORD_CHANNEL: '1467661813545046186', // #general

  ORLANDO: {
    get pit() { return getSecrets().pitOrlando; },
    locationId: 'ez4QcQYqIRKvgT8fIQ22',
    pipelineId: 'YrNc8hcJFysZAUEuZIvx',
    stages: {
      // Stages that count as "Contactado" (3-7, excluding 1-2)
      contactadoSet: new Set([
        'c7e4a8e1-fdbf-4702-a3b2-5f20883fd9c7', // 3. Contactado sin cita
        'e33fd18a-60b6-4254-b8b2-4a0de58f508a', // 4. Calificado sin cita
        '7c4796c8-5a17-4f34-8392-ef46bc83e497', // 5. Contactado faltan requisitos
        'd1bd15fd-4fe0-4002-8577-7611a445aed0', // 6. Interes futuro
        '2b345846-f786-41c4-b1dc-839b9d426739', // 7. Aplico ONLINE
        'aeadc726-b277-487c-bcd5-b6c1412c50e1', // 8. Cita agendada
        'e9c02162-f741-44b3-8a02-a85d9f489653', // 9. No-Show
        'bd32711e-376e-4808-95f0-898bdf2e77c8', // 10. Asistio NO APLICO
        '74ded8d7-4636-497d-8f0a-05451af5d028', // 11. Asistio NEGADO
        'eaf95326-e9e2-4648-ab03-03b000d295f1', // 12. Asistio APROBADO
        'cff39092-ffa1-4c4e-b9ee-84316819472e', // 13. VENDIDO
      ]),
      citaSet: new Set([
        'aeadc726-b277-487c-bcd5-b6c1412c50e1', // 8
        'e9c02162-f741-44b3-8a02-a85d9f489653', // 9
        'bd32711e-376e-4808-95f0-898bdf2e77c8', // 10
        '74ded8d7-4636-497d-8f0a-05451af5d028', // 11
        'eaf95326-e9e2-4648-ab03-03b000d295f1', // 12
        'cff39092-ffa1-4c4e-b9ee-84316819472e', // 13
      ]),
      showSet: new Set([
        'bd32711e-376e-4808-95f0-898bdf2e77c8', // 10
        '74ded8d7-4636-497d-8f0a-05451af5d028', // 11
        'eaf95326-e9e2-4648-ab03-03b000d295f1', // 12
        'cff39092-ffa1-4c4e-b9ee-84316819472e', // 13
      ]),
      aplicaronSet: new Set([
        '74ded8d7-4636-497d-8f0a-05451af5d028', // 11
        'eaf95326-e9e2-4648-ab03-03b000d295f1', // 12
        'cff39092-ffa1-4c4e-b9ee-84316819472e', // 13
      ]),
      aprobadosSet: new Set([
        'eaf95326-e9e2-4648-ab03-03b000d295f1', // 12
        'cff39092-ffa1-4c4e-b9ee-84316819472e', // 13
      ]),
      negado:  '74ded8d7-4636-497d-8f0a-05451af5d028', // 11
      vendido: 'cff39092-ffa1-4c4e-b9ee-84316819472e', // 13
    }
  },

  KISSIMMEE: {
    get pit() { return getSecrets().pitKissimmee; },
    locationId: 'Vzt98VtJ6jqBE2dYYlnj',
    pipelineId: 'pj8Z0eoyQCz2WKIHFXAX',
    stages: {
      contactadoSet: new Set([
        'a46ba5ea-a02d-40ac-bb25-fb8287251c21', // 3
        '3ced082b-773c-4567-ac1d-893e380815a3', // 4
        'e9a247a3-4a81-441a-b46e-4a4109479a47', // 5
        '07d82839-5e39-4d7e-a041-47681b2322e0', // 6
        'dd6b5e02-6230-4d80-9517-cdd7135245d7', // 7
        'e66507c7-705e-4cc2-99cf-c63de4fd5475', // 8
        'bd520740-867b-42eb-b000-dfc8f9aefd0d', // 9
        'ce7102bf-3e91-42e3-9379-4762e5097abf', // 10
        'c19c3c61-4f70-4a0e-ac96-fe61efae7302', // 11
        '7eb00f52-3dc5-482d-b15f-5f15b611bb0d', // 12
        '9ece7230-eb28-4ffc-b7a7-5618497f3014', // 13
      ]),
      citaSet: new Set([
        'e66507c7-705e-4cc2-99cf-c63de4fd5475', // 8
        'bd520740-867b-42eb-b000-dfc8f9aefd0d', // 9
        'ce7102bf-3e91-42e3-9379-4762e5097abf', // 10
        'c19c3c61-4f70-4a0e-ac96-fe61efae7302', // 11
        '7eb00f52-3dc5-482d-b15f-5f15b611bb0d', // 12
        '9ece7230-eb28-4ffc-b7a7-5618497f3014', // 13
      ]),
      showSet: new Set([
        'ce7102bf-3e91-42e3-9379-4762e5097abf', // 10
        'c19c3c61-4f70-4a0e-ac96-fe61efae7302', // 11
        '7eb00f52-3dc5-482d-b15f-5f15b611bb0d', // 12
        '9ece7230-eb28-4ffc-b7a7-5618497f3014', // 13
      ]),
      aplicaronSet: new Set([
        'c19c3c61-4f70-4a0e-ac96-fe61efae7302', // 11
        '7eb00f52-3dc5-482d-b15f-5f15b611bb0d', // 12
        '9ece7230-eb28-4ffc-b7a7-5618497f3014', // 13
      ]),
      aprobadosSet: new Set([
        '7eb00f52-3dc5-482d-b15f-5f15b611bb0d', // 12
        '9ece7230-eb28-4ffc-b7a7-5618497f3014', // 13
      ]),
      negado:  'c19c3c61-4f70-4a0e-ac96-fe61efae7302', // 11
      vendido: '9ece7230-eb28-4ffc-b7a7-5618497f3014', // 13
    }
  }
};

// ─── Discord user ID → Leaderboard name ──────────────────────
// Add more entries here as people post in FLASH NEWS
const DISCORD_ID_TO_NAME = {
  // ORL Closers
  '1467943892744671253': 'Fabiola Iorio',
  '1467999772756672664': 'Laura Indriago',
  '1467914775685238991': 'María De Gouveia',
  '1470907780406841396': 'Eleazar Hidalgo',
  // KSS Closers
  '1467921519035547832': 'Christopher Cepeda',
  '1467917024335368315': 'Juan Rodriguez',
  '1475551043629875505': 'Nickol Montero',
  // ORL Setters
  '1467874599579422742': 'Isiley Melendez',
  '1467918543152967762': 'Juviany Padron',
  '1467916037728583743': 'David Mendoza',
  '1467916862334435506': 'Nairelys Hernandez',
  // KSS Setters
  '1467874311699304711': 'Elvis Pacheco',
  '1104784577962201208': 'David Santos',
  // Add more as they appear in FLASH NEWS posts
};

// ─── GHL user ID → Leaderboard name ──────────────────────────
const GHL_ID_TO_NAME = {
  // ORL Closers
  'Uv683v0pSIMCgPD91TOb': 'Fabiola Iorio',
  'y75JjO6sSjq0nL5Xw6JF': 'Laura Indriago',
  'QySpqRrxcWXr1YF0jyY3': 'María De Gouveia',
  'hc2or5bP7DIJiII9FrYY': 'Eleazar Hidalgo',
  // ORL Setters
  '77Y4ssGasg6QOKGepk0O': 'Juviany Padron',
  '80mizIxhQrpmXgsb93pm': 'Isiley Melendez',
  'zF40uhazM8W1XQCliZgN': 'David Mendoza',
  'wYzjY9PGxnY3xotGccZu': 'Katherine Atencio',
  'pPbNZKa58XGe8Fp8TMuw': 'Kener Ortega',
  'fUByWm6Q9MqYiL9PEl4M': 'Rene Pena',
  'QY6JjNR1GhVOO2PQnKfx': 'Nairelys Hernandez',
  '3QDNohrktHb6QdyEsOFK': 'Moises Gutierrez',
  // KSS Closers
  'LPtafFQB9QJg9t4YTw98': 'Christopher Cepeda',
  '2OIjTh9wVWhLegmwnoUT': 'Juan Rodriguez',
  'fKqeUgb4DHI8OjvOvi2Q': 'Nickol Montero',
  // KSS Setters
  'O1al7E9TYS0F2ZVw6J44': 'Elvis Pacheco',
  'EOyphwzRsH34S1EuSsMf': 'Carlos Bermudez',
  'a8uNp3jUWOQaBp2EIriU': 'Carlos Castillo',
  'tAqOv8IFbGEwZLqQz7ld': 'David Santos',
  'KYsFEsz8oshVr1foqcBr': 'Esther Alvarado',
  'pPJGWXEkNbg0knzU3MUz': 'Odimar Vasquez',
  'BEAgODgPXZDuMCNmz64B': 'Kevin Aranguren',
  'BBqxWi2sLytCrvkudz8k': 'Katherine Jimenez',
  'CCFn3tgplyrM4Dfd3yDL': 'Keila Ojeda',
  'g2geHQkwvHDktBxLN9sa': 'Jazmin Tua',
  'Dxu8wMcO0vJfiKQ0Viqj': 'Gabriel Zambrano',
};

// ─── MAIN ENTRY POINT ─────────────────────────────────────────
function syncAll() {
  const now        = new Date();
  const year       = now.getFullYear();
  const month      = now.getMonth(); // 0-indexed
  const monthKey   = year + '-' + String(month + 1).padStart(2, '0');
  const monthStart = new Date(year, month, 1).toISOString();

  const ss = SpreadsheetApp.openById(GDS.SHEET_ID);
  Logger.log('=== GHL+Discord Sync for ' + monthKey + ' ===');

  // 1. Fetch GHL opportunities for both locations
  Logger.log('Fetching Orlando opportunities...');
  const orlOpps = fetchAllGHLOpps(GDS.ORLANDO, monthStart);
  Logger.log('Orlando: ' + orlOpps.length + ' opps this month');

  Logger.log('Fetching Kissimmee opportunities...');
  const kssOpps = fetchAllGHLOpps(GDS.KISSIMMEE, monthStart);
  Logger.log('Kissimmee: ' + kssOpps.length + ' opps this month');

  // 2. Compute KPIs per person
  const orlKpis = computePersonKPIs(orlOpps, GDS.ORLANDO.stages);
  const kssKpis = computePersonKPIs(kssOpps, GDS.KISSIMMEE.stages);
  const allKpis = mergeKpis(orlKpis, kssKpis);
  Logger.log('KPIs computed for ' + Object.keys(allKpis).length + ' people');

  // 3. Fetch Discord FLASH NEWS sale posts
  Logger.log('Fetching Discord FLASH NEWS posts...');
  const discordSales = parseDiscordSales(monthStart);
  Logger.log('Discord sales parsed for ' + Object.keys(discordSales).length + ' people');

  // 4. Write to sheets
  writeSetterKPIs(ss, monthKey, allKpis);
  writeCloserVentas(ss, monthKey, discordSales);

  Logger.log('=== Sync complete ===');
}

// ─── GHL: Fetch all opportunities for the current month ───────
function fetchAllGHLOpps(locConfig, monthStart) {
  const allOpps    = [];
  const monthStartMs = new Date(monthStart).getTime();
  let   url        = 'https://services.leadconnectorhq.com/opportunities/search'
                   + '?location_id=' + locConfig.locationId
                   + '&pipeline_id=' + locConfig.pipelineId
                   + '&limit=100';

  while (url) {
    try {
      const res  = UrlFetchApp.fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + locConfig.pit, // pulled from PropertiesService
          'Version':       '2021-07-28',
        },
        muteHttpExceptions: true,
      });

      // Retry on rate-limit (429) or bandwidth quota errors
      const code = res.getResponseCode();
      if (code === 429 || code === 503) {
        Logger.log('GHL rate limit / quota (' + code + ') — waiting 10s then retrying');
        Utilities.sleep(10000);
        continue; // retry same url
      }

      const data = JSON.parse(res.getContentText());
      const opps = data.opportunities || [];
      if (opps.length === 0) break;

      // NOTE: GHL sorts by lastStatusChangeAt desc, not createdAt.
      // Do NOT break early — collect all pages and filter by createdAt client-side.
      for (const opp of opps) {
        if (new Date(opp.createdAt).getTime() >= monthStartMs) {
          allOpps.push(opp);
        }
      }

      url = (data.meta && data.meta.nextPageUrl) ? data.meta.nextPageUrl : null;
      if (url) Utilities.sleep(500); // gentle rate limit (0.5s between pages)

    } catch (err) {
      Logger.log('GHL fetch error: ' + err.message);
      break;
    }
  }

  return allOpps;
}

// ─── Compute KPIs per person from opportunity list ────────────
function computePersonKPIs(opps, stages) {
  // Returns { [personName]: { leadsAsignados, contactados, citasAgendadas,
  //                           shows, aplicaron, aprobados, negados, ventas } }
  const kpis = {};

  for (const opp of opps) {
    const userId = opp.assignedTo;
    if (!userId) continue;

    const name = GHL_ID_TO_NAME[userId];
    if (!name) continue; // Unknown user → skip

    if (!kpis[name]) {
      kpis[name] = {
        leadsAsignados: 0, contactados:   0,
        citasAgendadas: 0, shows:         0,
        aplicaron:      0, aprobados:     0,
        negados:        0, ventas:        0,
      };
    }

    const s = opp.pipelineStageId;
    kpis[name].leadsAsignados++;
    if (stages.contactadoSet.has(s)) kpis[name].contactados++;
    if (stages.citaSet.has(s))       kpis[name].citasAgendadas++;
    if (stages.showSet.has(s))       kpis[name].shows++;
    if (stages.aplicaronSet.has(s))  kpis[name].aplicaron++;
    if (stages.aprobadosSet.has(s))  kpis[name].aprobados++;
    if (s === stages.negado)         kpis[name].negados++;
    if (s === stages.vendido)        kpis[name].ventas++;
  }

  return kpis;
}

// ─── Merge KPIs from two locations (sum duplicates) ───────────
function mergeKpis(a, b) {
  const merged = {};
  const keys   = ['leadsAsignados', 'contactados', 'citasAgendadas',
                   'shows', 'aplicaron', 'aprobados', 'negados', 'ventas'];

  for (const [name, kpi] of Object.entries(a)) {
    merged[name] = Object.assign({}, kpi);
  }
  for (const [name, kpi] of Object.entries(b)) {
    if (merged[name]) {
      for (const k of keys) merged[name][k] = (merged[name][k] || 0) + (kpi[k] || 0);
    } else {
      merged[name] = Object.assign({}, kpi);
    }
  }
  return merged;
}

// ─── Discord: Parse FLASH NEWS sale posts ─────────────────────
// Returns { [personName]: { role: 'closer'|'setter', selfGen: N, others: N } }
function parseDiscordSales(monthStart) {
  const sales        = {};
  const monthStartMs = new Date(monthStart).getTime();
  const baseUrl      = 'https://discord.com/api/v10/channels/'
                     + GDS.DISCORD_CHANNEL + '/messages?limit=100';
  let   fetchUrl     = baseUrl;
  let   done         = false;

  while (!done) {
    try {
      const messages = fetchDiscordMessages(fetchUrl);

      if (!messages || !Array.isArray(messages) || messages.length === 0) break;

      for (const msg of messages) {
        // Stop if we've gone past the start of the month
        if (new Date(msg.timestamp).getTime() < monthStartMs) {
          done = true;
          break;
        }

        // Only process FLASH NEWS embeds
        const embed = (msg.embeds || [])[0];
        if (!embed || !String(embed.title || '').includes('FLASH NEWS')) continue;

        const desc = embed.description || '';

        // Extract source from "from X." pattern
        const srcMatch = desc.match(/from ([^.]+)\./i);
        const source   = srcMatch ? srcMatch[1].trim() : '';

        // Extract all <@USER_ID> mentions
        const mentionRe = /<@(\d+)>/g;
        const mentions  = [];
        let   m;
        while ((m = mentionRe.exec(desc)) !== null) {
          mentions.push(m[1]);
        }

        const hasSetter      = mentions.length >= 2;
        const setterDiscordId = hasSetter ? mentions[0] : null;
        const closerDiscordId = hasSetter ? mentions[1] : (mentions[0] || null);

        const closerName = closerDiscordId ? DISCORD_ID_TO_NAME[closerDiscordId] : null;
        const setterName = setterDiscordId ? DISCORD_ID_TO_NAME[setterDiscordId] : null;

        const saleType = classifySale(source, hasSetter);

        // Credit the closer
        if (closerName) {
          if (!sales[closerName]) sales[closerName] = { role: 'closer', selfGen: 0, others: 0 };
          if (saleType === 'selfGen') sales[closerName].selfGen++;
          else                        sales[closerName].others++;
        } else if (closerDiscordId) {
          Logger.log('Unknown Discord closer ID: ' + closerDiscordId + ' — add to DISCORD_ID_TO_NAME');
        }

        // Credit the setter (ventas count)
        if (setterName) {
          if (!sales[setterName]) sales[setterName] = { role: 'setter', selfGen: 0, others: 0 };
          sales[setterName].others++; // setter "ventas" tracked separately in GHL
        } else if (setterDiscordId) {
          Logger.log('Unknown Discord setter ID: ' + setterDiscordId + ' — add to DISCORD_ID_TO_NAME');
        }
      }

      // Paginate using Discord's before= cursor
      if (!done && messages.length === 100) {
        const lastId = messages[messages.length - 1].id;
        fetchUrl = baseUrl + '&before=' + lastId;
        Utilities.sleep(500);
      } else {
        done = true;
      }

    } catch (err) {
      Logger.log('Discord fetch error: ' + err.message);
      break;
    }
  }

  return sales;
}

// ─── Classify sale as Self-Gen or Others ──────────────────────
// Rule: if there's a setter → always Others
//       Walk-in / Fb Ads / Facebook / Call Center → Others
//       Source contains "self" (any variation) and no setter → Self-Gen
function classifySale(source, hasSetter) {
  if (hasSetter) return 'others';
  const s = (source || '').toLowerCase();
  if (s.includes('walk'))                          return 'others';
  if (s.includes('fb') || s.includes('facebook')) return 'others';
  if (s.includes('call'))                          return 'others';
  if (s.includes('self'))                          return 'selfGen';
  return 'others'; // Default to others if source is unclear
}

// ─── Write Setter KPIs to Setters_YYYY-MM tab ─────────────────
// Columns: Nombre(A) PIN(B) Foto(C) LeadsAsig(D) Contactados(E)
//          CitasAg(F) Shows(G) Ventas(H) Aplicaron(I) Aprobados(J) Negados(K) UltimaAct(L)
function writeSetterKPIs(ss, monthKey, allKpis) {
  const tabName = 'Setters_' + monthKey;
  const sheet   = ss.getSheetByName(tabName);
  if (!sheet) {
    Logger.log('Tab not found: ' + tabName + ' — skipping setter write');
    return;
  }

  const data    = sheet.getDataRange().getValues();
  const today   = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  let   written = 0;

  for (let i = 1; i < data.length; i++) {
    const name = String(data[i][0]).trim();
    if (!name || !allKpis[name]) continue;

    const k   = allKpis[name];
    const row = i + 1;

    sheet.getRange(row, 4).setValue(k.leadsAsignados);
    sheet.getRange(row, 5).setValue(k.contactados);
    sheet.getRange(row, 6).setValue(k.citasAgendadas);
    sheet.getRange(row, 7).setValue(k.shows);
    sheet.getRange(row, 8).setValue(k.ventas);
    sheet.getRange(row, 9).setValue(k.aplicaron);
    sheet.getRange(row, 10).setValue(k.aprobados);
    sheet.getRange(row, 11).setValue(k.negados);
    sheet.getRange(row, 12).setValue(today);
    written++;
  }

  Logger.log('Setter KPIs written for ' + written + ' people in ' + tabName);
}

// ─── Write Closer Ventas to Closers_YYYY-MM tab ───────────────
// Columns: Nombre(A) PIN(B) Foto(C) SelfGen(D) CallCenter(E) ...
// Only updates D (SelfGen) and E (CallCenter/Others) from Discord data
function writeCloserVentas(ss, monthKey, discordSales) {
  const tabName = 'Closers_' + monthKey;
  const sheet   = ss.getSheetByName(tabName);
  if (!sheet) {
    Logger.log('Tab not found: ' + tabName + ' — skipping closer write');
    return;
  }

  const data    = sheet.getDataRange().getValues();
  const today   = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  let   written = 0;

  for (let i = 1; i < data.length; i++) {
    const name = String(data[i][0]).trim();
    if (!name) continue;

    const sale = discordSales[name];
    if (!sale || sale.role !== 'closer') continue;

    const row = i + 1;
    sheet.getRange(row, 4).setValue(sale.selfGen); // D = SelfGen
    sheet.getRange(row, 5).setValue(sale.others);  // E = CallCenter / Others
    sheet.getRange(row, 13).setValue(today);        // M = UltimaActividad
    written++;
  }

  Logger.log('Closer ventas written for ' + written + ' people in ' + tabName);
}

// ─── TEST: Run manually to check output without writing ────────
function testSync_DryRun() {
  const now        = new Date();
  const year       = now.getFullYear();
  const month      = now.getMonth();
  const monthStart = new Date(year, month, 1).toISOString();

  Logger.log('--- GHL Orlando ---');
  const orlOpps = fetchAllGHLOpps(GDS.ORLANDO, monthStart);
  Logger.log('Opps: ' + orlOpps.length);
  const orlKpis = computePersonKPIs(orlOpps, GDS.ORLANDO.stages);
  for (const [name, k] of Object.entries(orlKpis)) {
    Logger.log(name + ': ' + JSON.stringify(k));
  }

  Logger.log('--- GHL Kissimmee ---');
  const kssOpps = fetchAllGHLOpps(GDS.KISSIMMEE, monthStart);
  Logger.log('Opps: ' + kssOpps.length);
  const kssKpis = computePersonKPIs(kssOpps, GDS.KISSIMMEE.stages);
  for (const [name, k] of Object.entries(kssKpis)) {
    Logger.log(name + ': ' + JSON.stringify(k));
  }

  Logger.log('--- Discord FLASH NEWS ---');
  const sales = parseDiscordSales(monthStart);
  for (const [name, s] of Object.entries(sales)) {
    Logger.log(name + ' [' + s.role + ']: selfGen=' + s.selfGen + ' others=' + s.others);
  }
}

// ─── DEBUG: Dump raw Discord message structure ────────────────
// Run this manually to see exactly what FLASH NEWS posts look like.
// Check Execution Log → look for "MSG #..." entries.
function debugDiscordRaw() {
  const url  = 'https://discord.com/api/v10/channels/'
             + GDS.DISCORD_CHANNEL + '/messages?limit=20';
  const msgs = fetchDiscordMessages(url);
  if (!msgs || !Array.isArray(msgs)) {
    Logger.log('ERROR: fetchDiscordMessages returned null or non-array');
    return;
  }
  Logger.log('Fetched ' + msgs.length + ' messages from #general');
  for (let i = 0; i < msgs.length; i++) {
    const m = msgs[i];
    Logger.log('─── MSG #' + i + ' id=' + m.id + ' ts=' + m.timestamp + ' author=' + (m.author && m.author.username));
    Logger.log('  content: ' + JSON.stringify(m.content || '').slice(0, 200));
    const embeds = m.embeds || [];
    Logger.log('  embeds count: ' + embeds.length);
    for (let j = 0; j < embeds.length; j++) {
      const e = embeds[j];
      Logger.log('  embed[' + j + '] title: ' + JSON.stringify(e.title));
      Logger.log('  embed[' + j + '] description: ' + JSON.stringify((e.description || '').slice(0, 300)));
      Logger.log('  embed[' + j + '] fields: ' + JSON.stringify((e.fields || []).map(f => ({name: f.name, value: (f.value||'').slice(0,100)}))));
      Logger.log('  embed[' + j + '] author: ' + JSON.stringify(e.author));
      Logger.log('  embed[' + j + '] footer: ' + JSON.stringify(e.footer));
      Logger.log('  embed[' + j + '] color: ' + e.color);
    }
    if (embeds.length === 0 && (m.content || '').toLowerCase().includes('flash')) {
      Logger.log('  *** FLASH found in content (no embed)');
    }
  }
}

// ─── DEBUG: Dump raw GHL Kissimmee API response ───────────────
// Run this manually to see what the Kissimmee API actually returns.
function debugGHLKissimmee() {
  const secrets = getSecrets();
  Logger.log('KSS PIT token present: ' + !!secrets.pitKissimmee);
  Logger.log('KSS PIT first 8 chars: ' + (secrets.pitKissimmee || '').slice(0, 8));

  const url = 'https://services.leadconnectorhq.com/opportunities/search'
            + '?location_id=' + GDS.KISSIMMEE.locationId
            + '&pipeline_id=' + GDS.KISSIMMEE.pipelineId
            + '&limit=5';
  const res = UrlFetchApp.fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + secrets.pitKissimmee,
      'Version': '2021-07-28',
    },
    muteHttpExceptions: true,
  });
  Logger.log('HTTP status: ' + res.getResponseCode());
  Logger.log('Response body (first 1000 chars): ' + res.getContentText().slice(0, 1000));
}
