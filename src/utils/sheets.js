const SHEET_ID = '16LaMfxt2SLhYyBTKpHOthvxupr-fT2v5TiOBbtDaUls'

function csvToArray(csv) {
  const lines = csv.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  const headers = parseCsvLine(lines[0])
  return lines.slice(1).map(line => {
    const values = parseCsvLine(line)
    const obj = {}
    headers.forEach((h, i) => {
      obj[h] = values[i] || ''
    })
    return obj
  })
}

function parseCsvLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        result.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
  }
  result.push(current.trim())
  return result
}

function sheetUrl(tabName) {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`
}

async function fetchRawCsv(tabName) {
  try {
    const res = await fetch(sheetUrl(tabName))
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

async function fetchTab(tabName) {
  const csv = await fetchRawCsv(tabName)
  if (!csv) return null
  return csvToArray(csv)
}

// Safe number parser: rejects date-like strings (e.g. "1899-12-30")
// that parseFloat would incorrectly parse as 1899
function safeNum(val) {
  if (!val && val !== 0) return 0
  const s = String(val).trim()
  if (s === '' || s.includes('-')) return 0
  const n = Number(s)
  return isNaN(n) ? 0 : n
}

function parseCloser(row, id) {
  return {
    id,
    name: row.Nombre || '',
    pin: row.PIN || '',
    photo: row.Foto || '',
    selfGen: safeNum(row.SelfGen),
    callCenter: safeNum(row.CallCenter),
    walkIn: safeNum(row.WalkIn),
    sits: safeNum(row.Sits),
    citasPropias: safeNum(row.CitasPropias),
    visitasPropias: safeNum(row.VisitasPropias),
    aplicaron: safeNum(row.Aplicaron),
    aprobados: safeNum(row.Aprobados),
    negados: safeNum(row.Negados),
    cancels: safeNum(row.Cancelaciones),
    ultimaActividad: row.UltimaActividad || '',
  }
}

function parseSetter(row, id) {
  return {
    id,
    name: row.Nombre || '',
    pin: row.PIN || '',
    photo: row.Foto || '',
    leadsNuevos: safeNum(row.LeadsAsignados),    // hot leads created this month, assigned via rotation
    leadsAsignados: safeNum(row.LeadsAsignados), // same source, kept for secondary display
    contactados: safeNum(row.Contactados),
    citasAgendadas: safeNum(row.CitasAgendadas),
    shows: safeNum(row.Shows),
    ventas: safeNum(row.Ventas),
    aplicaron: safeNum(row.Aplicaron),
    aprobados: safeNum(row.Aprobados),
    negados: safeNum(row.Negados),
    ultimaActividad: row.UltimaActividad || '',
  }
}

function parseConfig(rows) {
  const config = {}
  rows.forEach(row => {
    config[row.Clave] = row.Valor
  })
  return config
}

export function getCurrentMonth() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-')
  const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  return `${MONTHS[parseInt(month) - 1]} ${year}`
}

export async function fetchMonthData(monthKey) {
  const [closerRows, setterRows] = await Promise.all([
    fetchTab(`Closers_${monthKey}`),
    fetchTab(`Setters_${monthKey}`),
  ])

  const closers = closerRows ? closerRows.map((r, i) => parseCloser(r, i + 1)) : null
  const setters = setterRows ? setterRows.map((r, i) => parseSetter(r, i + 1)) : null

  return { closers, setters }
}

export async function fetchConfig() {
  const rows = await fetchTab('Config')
  if (!rows) return null
  return parseConfig(rows)
}

export async function fetchAvailableMonths() {
  const now = new Date()
  const currentKey = getCurrentMonth()

  // First, fetch the current month's raw CSV as a fingerprint.
  // Google Sheets returns this SAME data for any non-existent tab,
  // so we can use it to detect ghost tabs.
  const currentCsv = await fetchRawCsv(`Closers_${currentKey}`)
  if (!currentCsv) return [currentKey]

  // Build probe list (skip current month - we know it exists)
  const probes = []
  for (let i = 1; i < 13; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    probes.push(key)
  }

  // Fetch all in parallel
  const results = await Promise.allSettled(
    probes.map(async (key) => {
      const csv = await fetchRawCsv(`Closers_${key}`)
      if (!csv) return null
      // If the CSV is identical to the current month, it's a ghost tab
      // (Google returned the default tab's data for a non-existent tab)
      if (csv === currentCsv) return null
      // Must have actual data
      if (!csv.includes('Nombre')) return null
      return key
    })
  )

  const months = [currentKey]
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value !== null) {
      months.push(r.value)
    }
  }

  return months.sort((a, b) => b.localeCompare(a))
}

// Cache available months to avoid re-probing for each person's history
let _monthsCache = null
let _monthsCacheTime = 0
const MONTHS_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

async function getCachedAvailableMonths() {
  const now = Date.now()
  if (_monthsCache && (now - _monthsCacheTime) < MONTHS_CACHE_TTL) {
    return _monthsCache
  }
  _monthsCache = await fetchAvailableMonths()
  _monthsCacheTime = now
  return _monthsCache
}

export async function fetchPersonHistory(personName, personType) {
  const months = await getCachedAvailableMonths()

  // Fetch all months for this person IN PARALLEL
  const results = await Promise.allSettled(
    months.map(async (monthKey) => {
      const tabName = personType === 'closers' ? `Closers_${monthKey}` : `Setters_${monthKey}`
      const rows = await fetchTab(tabName)
      if (!rows) return null
      const row = rows.find(r => r.Nombre === personName)
      if (!row) return null
      const parsed = personType === 'closers'
        ? parseCloser(row, 1)
        : parseSetter(row, 1)
      return { month: monthKey, data: parsed }
    })
  )

  const sorted = results
    .filter(r => r.status === 'fulfilled' && r.value !== null)
    .map(r => r.value)
    .sort((a, b) => b.month.localeCompare(a.month))

  // Deduplicate: skip older months whose metrics are identical to a newer one
  const seen = new Set()
  return sorted.filter(({ data }) => {
    const key = JSON.stringify(data)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Fetch CRM data from serverless functions (GHL-first approach)
 * Falls back to Google Sheets if serverless APIs are unavailable
 */

async function fetchCRMSetterData() {
  try {
    const response = await fetch('/api/ghl/setters')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    return data.setters || {}
  } catch (error) {
    console.warn('CRM setter fetch failed, falling back to Google Sheets:', error.message)
    return null
  }
}

async function fetchCRMCloserSits() {
  try {
    const response = await fetch('/api/ghl/closers-sits')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    return data.closers || {}
  } catch (error) {
    console.warn('CRM closer sits fetch failed, falling back to Google Sheets:', error.message)
    return null
  }
}

/**
 * Merge CRM data with sheet data
 * CRM data takes precedence, but we keep sheet data as fallback
 */
export async function fetchMonthDataWithCRM(monthKey) {
  const sheetData = await fetchMonthData(monthKey)

  // For current month, also try to fetch from CRM
  if (monthKey === getCurrentMonth()) {
    const [crmSetters, crmCloserSits] = await Promise.all([
      fetchCRMSetterData(),
      fetchCRMCloserSits(),
    ])

    // Merge CRM data into sheet data
    if (crmSetters && sheetData.setters) {
      for (const setter of sheetData.setters) {
        const crmData = crmSetters[setter.name]
        if (crmData) {
          setter.leadsAsignados = crmData.leadsAsignados || setter.leadsAsignados
          setter.leadsNuevos = crmData.leadsNuevos || setter.leadsNuevos
          setter.contactados = crmData.contactados || setter.contactados
          setter.citasAgendadas = crmData.citasAgendadas || setter.citasAgendadas
          setter.shows = crmData.shows || setter.shows
          // Ventas come from Discord, not CRM (handled separately)
        }
      }
    }

    if (crmCloserSits && sheetData.closers) {
      for (const closer of sheetData.closers) {
        const crmData = crmCloserSits[closer.name]
        if (crmData !== undefined) {
          closer.sits = crmData
        }
      }
    }
  }

  return sheetData
}
