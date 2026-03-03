/**
 * Google Apps Script: Sync Manual KPI Sheets → Clean AR Leaderboard Sheet
 *
 * SETUP:
 * 1. Open the clean AR Leaderboard sheet (16LaMfxt2SLhYyBTKpHOthvxupr-fT2v5TiOBbtDaUls)
 * 2. Go to Extensions > Apps Script
 * 3. Paste this entire script
 * 4. Click Run > syncCurrentMonth (authorize when prompted)
 * 5. To auto-sync, go to Triggers (clock icon) > Add Trigger:
 *    - Function: syncCurrentMonth
 *    - Event source: Time-driven
 *    - Type: Hour timer
 *    - Every: 1 hour
 */

const CLEAN_SHEET_ID = '16LaMfxt2SLhYyBTKpHOthvxupr-fT2v5TiOBbtDaUls';
const SETTERS_SHEET_ID = '1DiUl2tTZX1hgNeeM6nE2bZBt4bcOe44P9urS9ezsjg8';
const CLOSERS_SHEET_ID = '1zGi2-WY3aXTpLJLr-3aB6bam89ds35x3_f8iRpf1Qxc';

// Month name abbreviations used in manual sheet tabs
const MONTH_ABBREV = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                      'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/**
 * Get the tab name for the current month in each manual sheet.
 * Setters use "FEB 2026", Closers use "FEB 26" (inconsistent naming).
 * This function tries multiple patterns.
 */
function findMonthTab(spreadsheet, year, month) {
  const abbrev = MONTH_ABBREV[month];
  const shortYear = String(year).slice(2);

  // Try various naming conventions
  const patterns = [
    `${abbrev} ${year}`,      // "FEB 2026"
    `${abbrev} ${shortYear}`, // "FEB 26"
    `${abbrev}${year}`,       // "FEB2026"
    `${abbrev}${shortYear}`,  // "FEB26"
  ];

  for (const name of patterns) {
    const sheet = spreadsheet.getSheetByName(name);
    if (sheet) return sheet;
  }
  return null;
}

/**
 * Parse a single metric value from the manual sheet.
 * Handles numbers, dashes, empty strings, and decimal values.
 */
function parseVal(val) {
  if (!val && val !== 0) return 0;
  const s = String(val).trim().replace(/,/g, '');
  if (s === '-' || s === '' || s === '#DIV/0!' || s === 'N/A') return 0;
  const n = parseFloat(s);
  return isNaN(n) ? 0 : Math.round(n); // Round to handle half-values
}

/**
 * Parse a date cell from the person name row.
 * Handles: Date objects, "02/01" (MM/DD), "2/1" (M/D), Date serial numbers.
 * Returns "YYYY-MM-DD" or '' if not a date.
 */
function parseDateCell(val, year, month0) {
  if (!val) return '';
  if (val instanceof Date) {
    return `${val.getFullYear()}-${String(val.getMonth() + 1).padStart(2, '0')}-${String(val.getDate()).padStart(2, '0')}`;
  }
  const s = String(val).trim();
  if (s === '' || s.toLowerCase() === 'off') return '';
  // Match MM/DD or M/D format
  const mmdd = s.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (mmdd) {
    const m = parseInt(mmdd[1]);
    const d = parseInt(mmdd[2]);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      // Use the provided year; month from the date string itself
      return `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }
  return '';
}

/**
 * Extract person metrics from a manual sheet tab.
 * The structure is: person name in col A, metrics in col B, month-to-date in col F.
 * Daily columns: person name row has date labels ("02/01","02/02",...) at alternating columns,
 * and metric rows have daily values at the columns between dates (dateCol + 1).
 */
function extractPeople(sheet, year, month0) {
  const data = sheet.getDataRange().getValues();
  const people = [];
  let current = null;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const colA = String(row[0]).trim();
    const rawColB = row[1];
    const colB = String(rawColB).trim();
    const colF = row[5]; // Month-to-date total (column F, index 5)

    // Detect person name row: non-empty col A, col B has a date
    // Handle both string dates ("3/May/2024") and Date objects (Google Sheets auto-formats)
    const colBIsDate = (rawColB instanceof Date) || (/\d{1,2}\/\w{3}\/\d{4}/.test(colB));
    if (colA && colA.length > 2 && colBIsDate) {
      if (current) people.push(current);

      // Build date map from person name row: { colIndex: "YYYY-MM-DD" }
      const dateCols = {};
      for (let col = 6; col < row.length; col++) {
        const parsed = parseDateCell(row[col], year, month0);
        if (parsed) dateCols[col] = parsed;
      }

      current = {
        name: colA.trim(),
        dials: 0,
        uniqueLeads: 0,
        prospects: 0,
        appts: 0,
        visits: 0,
        apply: 0,
        approved: 0,
        denied: 0,
        closes: 0,
        cancels: 0,
        selfGenAds: 0,
        lastActive: '',
        _metricsRead: 0,
        _dateCols: dateCols, // date columns from name row
      };
      continue;
    }

    if (!current) continue;

    // Only read the FIRST set of metrics (before the rates/Self Gen section)
    if (current._metricsRead >= 9) continue;

    // Check daily columns for "Dials Made" row to find latest activity date
    if (colB.includes('Dials Made') && current._metricsRead === 0) {
      current.dials = parseVal(colF);
      // Scan daily columns from right to left for last non-zero value
      if (!current.lastActive) {
        for (let col = row.length - 1; col >= 6; col--) {
          const val = row[col];
          if (val && parseVal(val) > 0) {
            // Find nearest date column: check col-1, col, col+1
            for (const dc of [col - 1, col, col + 1]) {
              if (current._dateCols[dc]) {
                current.lastActive = current._dateCols[dc];
                break;
              }
            }
            if (current.lastActive) break;
          }
        }
      }
      current._metricsRead++;
    } else if (colB.includes('Unique leads') && current._metricsRead === 1) {
      current.uniqueLeads = parseVal(colF);
      current._metricsRead++;
    } else if (colB.includes('Prospects Spoken') && current._metricsRead <= 2) {
      current.prospects = parseVal(colF);
      current._metricsRead = 3;
    } else if (colB.includes('Appts Booked') && current._metricsRead <= 3) {
      current.appts = parseVal(colF);
      current._metricsRead = 4;
    } else if (colB.includes('Visits to Dealer') && current._metricsRead <= 4) {
      current.visits = parseVal(colF);
      current._metricsRead = 5;
    } else if (colB.includes('Apply') && !colB.includes('Rate') && !colB.includes('Sit') && current._metricsRead <= 5) {
      current.apply = parseVal(colF);
      current._metricsRead = 6;
    } else if (colB.includes('Approved for credit') && current._metricsRead <= 6) {
      current.approved = parseVal(colF);
      current._metricsRead = 7;
    } else if (colB.includes('Denied') && !colB.includes('Rate') && current._metricsRead <= 7) {
      current.denied = parseVal(colF);
      current._metricsRead = 8;
    } else if (colB.includes('Closes - SOLD') && current._metricsRead <= 8) {
      current.closes = parseVal(colF);
      current._metricsRead = 9;
    } else if (colB.includes('Cancels') && current._metricsRead === 9) {
      current.cancels = parseVal(colF);
    } else if (colB.includes('SOLD from ADS - 100%')) {
      current.selfGenAds = parseVal(colF);
    }
  }

  if (current) people.push(current);

  // Clean up temp fields
  people.forEach(p => { delete p._metricsRead; delete p._dateCols; });

  return people;
}

/**
 * Get names of people who have daily log entries for a given month.
 * These people's data should NOT be overwritten by the manual sheet sync.
 */
function getDailyLogPeople(cleanSpreadsheet, monthKey) {
  const names = new Set();
  const logSheet = cleanSpreadsheet.getSheetByName('DailyLog');
  if (!logSheet) return names;

  const data = logSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const rawDate = data[i][1];
    let dateStr = '';
    // Handle Date objects (Google Sheets auto-formats date strings as Date)
    if (rawDate instanceof Date) {
      const y = rawDate.getFullYear();
      const m = rawDate.getMonth() + 1;
      dateStr = y + '-' + (m < 10 ? '0' : '') + m;
    } else {
      dateStr = String(rawDate).trim().substring(0, 7);
    }
    const name = String(data[i][3]).trim();
    if (dateStr === monthKey && name) {
      names.add(name);
    }
  }
  Logger.log('getDailyLogPeople for ' + monthKey + ': found ' + names.size + ' people');
  return names;
}

/**
 * Get the last DailyLog entry date per person for a given month.
 * Returns { name: 'YYYY-MM-DD' } using the most recent entry date.
 */
function getLastLogDates(cleanSpreadsheet, monthKey) {
  const dates = {};
  const logSheet = cleanSpreadsheet.getSheetByName('DailyLog');
  if (!logSheet) return dates;

  const data = logSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const rawDate = data[i][1];
    let dateStr = '';
    if (rawDate instanceof Date) {
      const y = rawDate.getFullYear();
      const m = rawDate.getMonth() + 1;
      const d = rawDate.getDate();
      const monthStr = y + '-' + (m < 10 ? '0' : '') + m;
      if (monthStr !== monthKey) continue;
      dateStr = monthStr + '-' + (d < 10 ? '0' : '') + d;
    } else {
      const s = String(rawDate).trim();
      if (s.substring(0, 7) !== monthKey) continue;
      dateStr = s.substring(0, 10);
    }
    const name = String(data[i][3]).trim();
    if (name && dateStr) {
      if (!dates[name] || dateStr > dates[name]) dates[name] = dateStr;
    }
  }
  Logger.log('getLastLogDates for ' + monthKey + ': found ' + Object.keys(dates).length + ' people');
  return dates;
}

/**
 * Read existing rows from the clean sheet (keyed by name).
 */
function readExistingRows(cleanSpreadsheet, tabName) {
  const rows = {};
  const sheet = cleanSpreadsheet.getSheetByName(tabName);
  if (!sheet) return rows;

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const name = String(data[i][0]).trim();
    if (name) rows[name] = data[i];
  }
  return rows;
}

/**
 * Write setter data to the clean sheet tab.
 * Preserves rows for people who have daily log entries.
 */
function writeSetters(cleanSpreadsheet, tabName, setters, existingPins, dailyLogPeople, lastLogDates) {
  let sheet = cleanSpreadsheet.getSheetByName(tabName);

  // Read existing rows before clearing (to preserve daily log data)
  const existingRows = readExistingRows(cleanSpreadsheet, tabName);

  if (!sheet) {
    sheet = cleanSpreadsheet.insertSheet(tabName);
  }

  // Headers (now includes UltimaActividad)
  const headers = ['Nombre', 'PIN', 'Foto', 'LeadsAsignados', 'Contactados',
                    'CitasAgendadas', 'Shows', 'Ventas', 'Aplicaron', 'Aprobados', 'Negados', 'UltimaActividad'];

  const rows = [headers];

  setters.forEach((s, i) => {
    const pin = existingPins[s.name] || String(2001 + i);

    // If this person has daily log entries AND their row has real metric data, preserve it
    if (dailyLogPeople && dailyLogPeople.has(s.name) && existingRows[s.name]) {
      const existing = existingRows[s.name];
      const hasData = existing.slice(3, 11).some(v => Number(v) > 0);
      if (hasData) {
        const row = existing.slice();
        if (lastLogDates && lastLogDates[s.name]) row[11] = lastLogDates[s.name];
        rows.push(row);
        return;
      }
    }

    rows.push([
      s.name,
      pin,
      '', // Photo URL (empty for now)
      s.prospects,      // LeadsAsignados = Prospects Spoken
      s.prospects,      // Contactados = Prospects Spoken
      s.appts,          // CitasAgendadas = Appts Booked
      s.visits,         // Shows = Visits to Dealer
      s.closes,         // Ventas = Closes-SOLD
      s.apply,          // Aplicaron = Apply
      s.approved,       // Aprobados = Approved
      s.denied,         // Negados = Denied
      (lastLogDates && lastLogDates[s.name]) || '', // UltimaActividad from DailyLog
    ]);
  });

  // Also add any daily-log-only people not in the manual sheet
  if (dailyLogPeople) {
    const syncedNames = new Set(setters.map(s => s.name));
    for (const name of dailyLogPeople) {
      if (!syncedNames.has(name) && existingRows[name]) {
        rows.push(existingRows[name]);
      }
    }
  }

  sheet.clear();
  sheet.getRange(1, 1, rows.length, headers.length).setValues(rows);
}

/**
 * Write closer data to the clean sheet tab.
 * Preserves rows for people who have daily log entries.
 */
function writeClosers(cleanSpreadsheet, tabName, closers, existingPins, dailyLogPeople, lastLogDates) {
  let sheet = cleanSpreadsheet.getSheetByName(tabName);

  // Read existing rows before clearing (to preserve daily log data)
  const existingRows = readExistingRows(cleanSpreadsheet, tabName);

  if (!sheet) {
    sheet = cleanSpreadsheet.insertSheet(tabName);
  }

  // Headers (now includes Cancelaciones and UltimaActividad)
  const headers = ['Nombre', 'PIN', 'Foto', 'SelfGen', 'CallCenter',
                    'Sits', 'CitasPropias', 'VisitasPropias', 'Aplicaron', 'Aprobados', 'Negados', 'Cancelaciones', 'UltimaActividad'];

  const rows = [headers];

  closers.forEach((c, i) => {
    const pin = existingPins[c.name] || String(1001 + i);

    // If this person has daily log entries AND their row has real metric data, preserve it
    if (dailyLogPeople && dailyLogPeople.has(c.name) && existingRows[c.name]) {
      const existing = existingRows[c.name];
      const hasData = existing.slice(3, 12).some(v => Number(v) > 0);
      if (hasData) {
        const row = existing.slice();
        if (lastLogDates && lastLogDates[c.name]) row[12] = lastLogDates[c.name];
        rows.push(row);
        return;
      }
    }

    const selfGen = c.selfGenAds || 0;
    const callCenter = Math.max(0, c.closes - selfGen);
    rows.push([
      c.name,
      pin,
      '', // Photo URL
      selfGen,          // SelfGen = ADS sales
      callCenter,       // CallCenter = Total - SelfGen
      c.apply,          // Sits = Apply (sat down for credit app)
      c.appts,          // CitasPropias = Appts Booked
      c.visits,         // VisitasPropias = Visits to Dealer
      c.apply,          // Aplicaron = Apply
      c.approved,       // Aprobados = Approved
      c.denied,         // Negados = Denied
      c.cancels || 0,   // Cancelaciones
      (lastLogDates && lastLogDates[c.name]) || '', // UltimaActividad from DailyLog
    ]);
  });

  // Also add any daily-log-only people not in the manual sheet
  if (dailyLogPeople) {
    const syncedNames = new Set(closers.map(c => c.name));
    for (const name of dailyLogPeople) {
      if (!syncedNames.has(name) && existingRows[name]) {
        rows.push(existingRows[name]);
      }
    }
  }

  sheet.clear();
  sheet.getRange(1, 1, rows.length, headers.length).setValues(rows);
}

/**
 * Read existing PINs from the clean sheet to preserve them.
 */
function readExistingPins(cleanSpreadsheet, tabName) {
  const pins = {};
  const sheet = cleanSpreadsheet.getSheetByName(tabName);
  if (!sheet) return pins;

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const name = String(data[i][0]).trim();
    const pin = String(data[i][1]).trim();
    if (name && pin) pins[name] = pin;
  }
  return pins;
}

/**
 * Main sync function - syncs the current month.
 */
function syncCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

  syncMonth(year, month, monthKey);
}

/**
 * Sync a specific month's data.
 */
function syncMonth(year, month, monthKey) {
  const cleanSS = SpreadsheetApp.openById(CLEAN_SHEET_ID);
  const settersSS = SpreadsheetApp.openById(SETTERS_SHEET_ID);
  const closersSS = SpreadsheetApp.openById(CLOSERS_SHEET_ID);

  // Find the month tabs in manual sheets
  const settersTab = findMonthTab(settersSS, year, month);
  const closersTab = findMonthTab(closersSS, year, month);

  if (!settersTab && !closersTab) {
    Logger.log(`No tabs found for ${monthKey}`);
    return;
  }

  // Read existing PINs to preserve them
  const setterPins = readExistingPins(cleanSS, `Setters_${monthKey}`);
  const closerPins = readExistingPins(cleanSS, `Closers_${monthKey}`);

  // Get people with daily log entries (their data should NOT be overwritten)
  const dailyLogPeople = getDailyLogPeople(cleanSS, monthKey);
  if (dailyLogPeople.size > 0) {
    Logger.log(`${dailyLogPeople.size} people have daily log entries - preserving their data`);
  }

  // Get last DailyLog date per person (used as UltimaActividad)
  const lastLogDates = getLastLogDates(cleanSS, monthKey);

  // Extract and write setters
  if (settersTab) {
    const setters = extractPeople(settersTab, year, month);
    Logger.log(`Found ${setters.length} setters for ${monthKey}`);
    if (setters.length > 0) {
      writeSetters(cleanSS, `Setters_${monthKey}`, setters, setterPins, dailyLogPeople, lastLogDates);
    } else {
      Logger.log('Skipping setters write - no people extracted from manual sheet');
    }
  }

  // Extract and write closers
  if (closersTab) {
    const closers = extractPeople(closersTab, year, month);
    Logger.log(`Found ${closers.length} closers for ${monthKey}`);
    if (closers.length > 0) {
      writeClosers(cleanSS, `Closers_${monthKey}`, closers, closerPins, dailyLogPeople, lastLogDates);
    } else {
      Logger.log('Skipping closers write - no people extracted from manual sheet');
    }
  }

  Logger.log(`Sync complete for ${monthKey}`);
}

/**
 * Manual trigger: Sync all available months (run once to backfill history).
 */
function syncAllMonths() {
  const settersSS = SpreadsheetApp.openById(SETTERS_SHEET_ID);
  const sheets = settersSS.getSheets();

  for (const sheet of sheets) {
    const name = sheet.getName();
    // Match "FEB 2026" or "FEB 26" format
    const match = name.match(/^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(\d{2,4})$/i);
    if (match) {
      const monthIdx = MONTH_ABBREV.indexOf(match[1].toUpperCase());
      let year = parseInt(match[2]);
      if (year < 100) year += 2000;
      const monthKey = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;

      Logger.log(`Syncing ${name} → ${monthKey}`);
      syncMonth(year, monthIdx, monthKey);
    }
  }
}

/**
 * Create a new month's tabs with zeroed data (run at start of each month).
 */
function createNewMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

  const cleanSS = SpreadsheetApp.openById(CLEAN_SHEET_ID);

  // Check if tabs already exist
  const closersTab = `Closers_${monthKey}`;
  const settersTab = `Setters_${monthKey}`;

  if (!cleanSS.getSheetByName(closersTab)) {
    const sheet = cleanSS.insertSheet(closersTab);
    sheet.getRange(1, 1, 1, 13).setValues([
      ['Nombre', 'PIN', 'Foto', 'SelfGen', 'CallCenter',
       'Sits', 'CitasPropias', 'VisitasPropias', 'Aplicaron', 'Aprobados', 'Negados', 'Cancelaciones', 'UltimaActividad']
    ]);
    Logger.log(`Created ${closersTab}`);
  }

  if (!cleanSS.getSheetByName(settersTab)) {
    const sheet = cleanSS.insertSheet(settersTab);
    sheet.getRange(1, 1, 1, 12).setValues([
      ['Nombre', 'PIN', 'Foto', 'LeadsAsignados', 'Contactados',
       'CitasAgendadas', 'Shows', 'Ventas', 'Aplicaron', 'Aprobados', 'Negados', 'UltimaActividad']
    ]);
    Logger.log(`Created ${settersTab}`);
  }
}
