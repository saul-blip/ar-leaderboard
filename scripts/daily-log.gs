/**
 * Google Apps Script: Daily Production Log Web App
 *
 * Deployed as a web app on the clean AR Leaderboard sheet.
 * Receives daily production entries from closers/setters,
 * stores them in a DailyLog tab, and aggregates into monthly tabs.
 *
 * SETUP:
 * 1. Open the clean AR Leaderboard sheet (16LaMfxt2SLhYyBTKpHOthvxupr-fT2v5TiOBbtDaUls)
 * 2. Go to Extensions > Apps Script
 * 3. Create a new script file (daily-log.gs) and paste this
 * 4. Deploy > New deployment > Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the web app URL and add it to the Config tab as DailyLogURL
 */

const SHEET_ID_ = '16LaMfxt2SLhYyBTKpHOthvxupr-fT2v5TiOBbtDaUls';

const CLOSER_COLUMNS = ['SelfGen', 'Others', 'Sits', 'CitasPropias', 'VisitasPropias', 'Aplicaron', 'Aprobados', 'Negados', 'Cancelaciones'];
const SETTER_COLUMNS = ['LeadsAsignados', 'Contactados', 'CitasAgendadas', 'Shows', 'Ventas', 'Aplicaron', 'Aprobados', 'Negados'];

const LOG_HEADERS = ['Timestamp', 'Date', 'PIN', 'Name', 'PersonType',
  // Closer fields
  'SelfGen', 'Others', 'Sits', 'CitasPropias', 'VisitasPropias',
  // Shared fields
  'Aplicaron', 'Aprobados', 'Negados', 'Cancelaciones',
  // Setter fields
  'LeadsAsignados', 'Contactados', 'CitasAgendadas', 'Shows', 'Ventas'];

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const { action } = body;

    if (action === 'submit') {
      return handleSubmit(body);
    }

    return jsonResponse({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message });
  }
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    const pin = e.parameter.pin;

    if (action === 'today' && pin) {
      return handleGetToday(pin);
    }
    if (action === 'history' && pin) {
      return handleGetHistory(pin);
    }

    return jsonResponse({ ok: false, error: 'Unknown action or missing params' });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Ensure DailyLog tab exists with proper headers.
 */
function ensureDailyLogTab(ss) {
  let sheet = ss.getSheetByName('DailyLog');
  if (!sheet) {
    sheet = ss.insertSheet('DailyLog');
    sheet.getRange(1, 1, 1, LOG_HEADERS.length).setValues([LOG_HEADERS]);
  }
  return sheet;
}

/**
 * Find the person's name and type by PIN.
 */
function findPersonByPin(ss, pin) {
  const now = new Date();
  const monthKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevKey = prevDate.getFullYear() + '-' + String(prevDate.getMonth() + 1).padStart(2, '0');
  const monthsToTry = [monthKey, prevKey];

  for (const mk of monthsToTry) {
    const closersTab = ss.getSheetByName('Closers_' + mk);
    if (closersTab) {
      const data = closersTab.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][1]).trim() === pin) {
          return { name: String(data[i][0]).trim(), type: 'closer' };
        }
      }
    }

    const settersTab = ss.getSheetByName('Setters_' + mk);
    if (settersTab) {
      const data = settersTab.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][1]).trim() === pin) {
          return { name: String(data[i][0]).trim(), type: 'setter' };
        }
      }
    }
  }

  return null;
}

/**
 * Check if a PIN is an admin PIN.
 */
function isAdminPin(ss, pin) {
  const configTab = ss.getSheetByName('Config');
  if (!configTab) return false;
  const data = configTab.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const key = String(data[i][0]).trim();
    const val = String(data[i][1]).trim();
    if ((key === 'AdminPIN_owner' || key === 'AdminPIN_manager' || key === 'AdminPIN_admin') && val === pin) {
      return true;
    }
  }
  return false;
}

/**
 * Handle a daily log submission.
 * Body: { action: 'submit', pin, date, personType, personName, metrics: { ... }, adminPin? }
 */
function handleSubmit(body) {
  const { pin, date, personType, personName, metrics, adminPin } = body;

  if (!pin || !date || !personType || !metrics) {
    return jsonResponse({ ok: false, error: 'Missing required fields' });
  }

  const ss = SpreadsheetApp.openById(SHEET_ID_);

  // Validate: either the person is logging their own data, or an admin is logging for them
  const person = findPersonByPin(ss, pin);
  let logName = '';
  let logType = personType;

  if (person) {
    // Person logging their own data
    logName = person.name;
    logType = person.type;
  } else if (adminPin && isAdminPin(ss, adminPin)) {
    // Admin logging for someone else
    logName = personName || '';
    logType = personType;
    if (!logName) {
      return jsonResponse({ ok: false, error: 'Admin must provide personName' });
    }
  } else {
    return jsonResponse({ ok: false, error: 'Invalid PIN' });
  }

  // Validate metrics are numbers
  const columns = logType === 'closer' ? CLOSER_COLUMNS : SETTER_COLUMNS;
  for (const col of columns) {
    const val = metrics[col];
    if (val !== undefined && val !== null && (typeof val !== 'number' || val < 0)) {
      return jsonResponse({ ok: false, error: 'Invalid value for ' + col });
    }
  }

  const logSheet = ensureDailyLogTab(ss);
  const now = new Date();
  const timestamp = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');

  // Build the row
  // Support both old field names (SelfGen, Others, Aplicaron, Aprobados)
  // and new split field names (VentasSelfGen, VentasOthers,
  // AplicaronPropias+AplicaronOthers, AprobadosPropias+AprobadosOthers)
  const selfGen   = metrics.VentasSelfGen    !== undefined ? (metrics.VentasSelfGen    || 0) : (metrics.SelfGen   || 0);
  const others    = metrics.VentasOthers     !== undefined ? (metrics.VentasOthers     || 0) : (metrics.Others    || 0);
  const aplicaron = (metrics.AplicaronPropias !== undefined || metrics.AplicaronOthers !== undefined)
    ? ((metrics.AplicaronPropias || 0) + (metrics.AplicaronOthers || 0))
    : (metrics.Aplicaron || 0);
  const aprobados = (metrics.AprobadosPropias !== undefined || metrics.AprobadosOthers !== undefined)
    ? ((metrics.AprobadosPropias || 0) + (metrics.AprobadosOthers || 0))
    : (metrics.Aprobados || 0);

  const row = [
    timestamp,
    date,
    pin,
    logName,
    logType,
    // Closer fields
    selfGen,
    others,
    metrics.Sits || metrics.VisitasPropias || 0,
    metrics.CitasPropias || 0,
    metrics.VisitasPropias || 0,
    // Shared
    aplicaron,
    aprobados,
    metrics.Negados || 0,
    metrics.Cancelaciones || 0,
    // Setter fields
    metrics.LeadsAsignados || 0,
    metrics.Contactados || 0,
    metrics.CitasAgendadas || 0,
    metrics.Shows || 0,
    metrics.Ventas || 0,
  ];

  // Upsert: check if entry for same date + PIN already exists
  const logData = logSheet.getDataRange().getValues();
  let existingRow = -1;
  for (let i = 1; i < logData.length; i++) {
    if (String(logData[i][1]).trim() === date && String(logData[i][2]).trim() === pin) {
      existingRow = i + 1; // 1-indexed for sheet
      break;
    }
  }

  if (existingRow > 0) {
    // Overwrite existing row
    logSheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
  } else {
    // Append new row
    logSheet.appendRow(row);
  }

  // Aggregate this person's data for the month
  aggregatePersonMonth(ss, pin, logName, logType, date);

  return jsonResponse({ ok: true, name: logName, date: date, updated: existingRow > 0 });
}

/**
 * Aggregate all daily log entries for a person in a given month
 * and write the totals to the monthly tab.
 */
function aggregatePersonMonth(ss, pin, name, personType, dateStr) {
  const monthKey = dateStr.substring(0, 7); // "2026-02" from "2026-02-28"

  const logSheet = ss.getSheetByName('DailyLog');
  if (!logSheet) return;

  const logData = logSheet.getDataRange().getValues();
  const headers = logData[0];

  // Find column indices
  const colIdx = {};
  headers.forEach(function(h, i) { colIdx[String(h).trim()] = i; });

  // Sum all entries for this PIN in this month
  const totals = {};
  const allColumns = personType === 'closer' ? CLOSER_COLUMNS : SETTER_COLUMNS;
  allColumns.forEach(function(c) { totals[c] = 0; });

  let daysLogged = 0;
  let lastDate = '';

  for (let i = 1; i < logData.length; i++) {
    const rowDate = String(logData[i][colIdx['Date']]).trim();
    const rowPin = String(logData[i][colIdx['PIN']]).trim();

    if (rowPin === pin && rowDate.startsWith(monthKey)) {
      daysLogged++;
      if (rowDate > lastDate) lastDate = rowDate;

      allColumns.forEach(function(col) {
        const idx = colIdx[col];
        if (idx !== undefined) {
          totals[col] += parseFloat(logData[i][idx]) || 0;
        }
      });
    }
  }

  if (daysLogged === 0) return;

  // Write aggregated data to the monthly tab
  const tabName = (personType === 'closer' ? 'Closers_' : 'Setters_') + monthKey;
  let monthSheet = ss.getSheetByName(tabName);

  if (!monthSheet) {
    // Create the tab with headers
    monthSheet = ss.insertSheet(tabName);
    if (personType === 'closer') {
      monthSheet.getRange(1, 1, 1, 13).setValues([
        ['Nombre', 'PIN', 'Foto', 'SelfGen', 'CallCenter', 'Sits', 'CitasPropias', 'VisitasPropias', 'Aplicaron', 'Aprobados', 'Negados', 'Cancelaciones', 'UltimaActividad']
      ]);
    } else {
      monthSheet.getRange(1, 1, 1, 12).setValues([
        ['Nombre', 'PIN', 'Foto', 'LeadsAsignados', 'Contactados', 'CitasAgendadas', 'Shows', 'Ventas', 'Aplicaron', 'Aprobados', 'Negados', 'UltimaActividad']
      ]);
    }
  }

  // Find the person's row in the monthly tab
  const monthData = monthSheet.getDataRange().getValues();
  let personRow = -1;
  for (let i = 1; i < monthData.length; i++) {
    if (String(monthData[i][1]).trim() === pin || String(monthData[i][0]).trim() === name) {
      personRow = i + 1;
      break;
    }
  }

  if (personType === 'closer') {
    const rowData = [
      name, pin, '', // Nombre, PIN, Foto
      totals.SelfGen,
      totals.Others,
      totals.Sits,
      totals.CitasPropias,
      totals.VisitasPropias,
      totals.Aplicaron,
      totals.Aprobados,
      totals.Negados,
      totals.Cancelaciones,
      lastDate
    ];
    if (personRow > 0) {
      monthSheet.getRange(personRow, 1, 1, rowData.length).setValues([rowData]);
    } else {
      monthSheet.appendRow(rowData);
    }
  } else {
    const rowData = [
      name, pin, '', // Nombre, PIN, Foto
      totals.LeadsAsignados,
      totals.Contactados,
      totals.CitasAgendadas,
      totals.Shows,
      totals.Ventas,
      totals.Aplicaron,
      totals.Aprobados,
      totals.Negados,
      lastDate
    ];
    if (personRow > 0) {
      monthSheet.getRange(personRow, 1, 1, rowData.length).setValues([rowData]);
    } else {
      monthSheet.appendRow(rowData);
    }
  }
}

/**
 * GET: Return today's entry for a PIN (for pre-fill).
 */
function handleGetToday(pin) {
  const ss = SpreadsheetApp.openById(SHEET_ID_);
  const logSheet = ss.getSheetByName('DailyLog');
  if (!logSheet) return jsonResponse({ ok: true, entry: null });

  const now = new Date();
  const today = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');

  const data = logSheet.getDataRange().getValues();
  const headers = data[0];

  for (let i = 1; i < data.length; i++) {
    const rowDate = String(data[i][1]).trim();
    const rowPin = String(data[i][2]).trim();
    if (rowDate === today && rowPin === pin) {
      const entry = {};
      headers.forEach(function(h, j) {
        entry[String(h).trim()] = data[i][j];
      });
      return jsonResponse({ ok: true, entry: entry });
    }
  }

  return jsonResponse({ ok: true, entry: null });
}

/**
 * GET: Return all entries for a PIN in the current month.
 */
function handleGetHistory(pin) {
  const ss = SpreadsheetApp.openById(SHEET_ID_);
  const logSheet = ss.getSheetByName('DailyLog');
  if (!logSheet) return jsonResponse({ ok: true, entries: [] });

  const now = new Date();
  const monthKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

  const data = logSheet.getDataRange().getValues();
  const headers = data[0];
  const entries = [];

  for (let i = 1; i < data.length; i++) {
    const rowDate = String(data[i][1]).trim();
    const rowPin = String(data[i][2]).trim();
    if (rowPin === pin && rowDate.startsWith(monthKey)) {
      const entry = {};
      headers.forEach(function(h, j) {
        entry[String(h).trim()] = data[i][j];
      });
      entries.push(entry);
    }
  }

  return jsonResponse({ ok: true, entries: entries });
}

/**
 * Test function: run manually to verify the script works.
 */
function testDailyLog() {
  const ss = SpreadsheetApp.openById(SHEET_ID_);
  const sheet = ensureDailyLogTab(ss);
  Logger.log('DailyLog tab ready with ' + sheet.getLastRow() + ' rows');

  const person = findPersonByPin(ss, '1001');
  Logger.log('PIN 1001: ' + JSON.stringify(person));

  Logger.log('Admin check for 1234: ' + isAdminPin(ss, '1234'));
}
