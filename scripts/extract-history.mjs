#!/usr/bin/env node
/**
 * Extract historical month data from manual KPI sheets
 * and output clean CSV data for the AR Leaderboard Data sheet.
 *
 * Usage: node scripts/extract-history.mjs
 */

const SETTERS_SHEET_ID = '1DiUl2tTZX1hgNeeM6nE2bZBt4bcOe44P9urS9ezsjg8'
const CLOSERS_SHEET_ID = '1zGi2-WY3aXTpLJLr-3aB6bam89ds35x3_f8iRpf1Qxc'

const MONTHS_TO_EXTRACT = [
  { key: '2025-09', setterTab: 'SEP 2025', closerTab: 'SEP 25' },
  { key: '2025-10', setterTab: 'OCT 2025', closerTab: null }, // No Oct closer tab exists
  { key: '2025-11', setterTab: 'NOV 2025', closerTab: 'NOV 2025' },
  { key: '2025-12', setterTab: 'DEC 2025', closerTab: 'DEC 2025' },
  { key: '2026-01', setterTab: 'JAN 2026', closerTab: 'JAN 26' },
]

function sheetCsvUrl(sheetId, tabName) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`
}

async function fetchCsv(sheetId, tabName) {
  const url = sheetCsvUrl(sheetId, tabName)
  const res = await fetch(url)
  if (!res.ok) return null
  return await res.text()
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
        result.push(current)
        current = ''
      } else {
        current += ch
      }
    }
  }
  result.push(current)
  return result
}

function parseVal(val) {
  if (!val && val !== 0) return 0
  const s = String(val).trim().replace(/,/g, '')
  if (s === '-' || s === '' || s === 'N/A' || s === '#DIV/0!') return 0
  const n = parseFloat(s)
  return isNaN(n) ? 0 : Math.round(n)
}

function isNameRow(cols) {
  const colA = (cols[0] || '').trim()
  const colB = (cols[1] || '').trim()
  // Name row: col A has a non-empty name (at least 3 chars, not a header like "Setter")
  // col B has a date like "17/Aug/2023" or "2/Sep/2025" or "3/May/2024"
  if (!colA || colA.length < 3) return false
  if (colA === 'Setter' || colA === 'Closer' || colA === 'Closers' || colA === 'Setters') return false
  // Check if colB matches a date pattern: d/Mon/YYYY or dd/Mon/YYYY
  if (/^\d{1,2}\/\w{3}\/\d{4}$/.test(colB)) return true
  return false
}

function extractSetters(csv) {
  const lines = csv.split('\n').filter(l => l.trim())
  const people = []
  let current = null

  for (const line of lines) {
    const cols = parseCsvLine(line)

    if (isNameRow(cols)) {
      if (current) people.push(current)
      current = {
        name: cols[0].trim(),
        prospects: 0,
        appts: 0,
        visits: 0,
        apply: 0,
        approved: 0,
        denied: 0,
        closes: 0,
      }
      continue
    }

    if (!current) continue

    const colB = (cols[1] || '').trim()
    const colF = cols[5] || ''

    if (colB.includes('Prospects Spoken')) {
      current.prospects = parseVal(colF)
    } else if (colB.includes('Appts Booked')) {
      current.appts = parseVal(colF)
    } else if (colB.includes('Visits to Dealer')) {
      current.visits = parseVal(colF)
    } else if (colB.includes('Apply') && !colB.includes('Rate') && !colB.includes('Sit')) {
      current.apply = parseVal(colF)
    } else if (colB.includes('Approved for credit') || colB.includes('Got Approved')) {
      current.approved = parseVal(colF)
    } else if (colB.includes('Denied') && !colB.includes('Rate')) {
      current.denied = parseVal(colF)
    } else if (colB.includes('Closes - SOLD')) {
      current.closes = parseVal(colF)
    }
  }

  if (current) people.push(current)
  return people
}

function extractClosers(csv) {
  const lines = csv.split('\n').filter(l => l.trim())
  const people = []
  let current = null
  let seen = {} // Track which metrics we've already captured per person

  for (const line of lines) {
    const cols = parseCsvLine(line)

    if (isNameRow(cols)) {
      if (current) people.push(current)
      seen = {}
      current = {
        name: cols[0].trim(),
        appts: 0,
        visits: 0,
        apply: 0,
        approved: 0,
        denied: 0,
        closes: 0,
        selfGenAds: 0,
        cancels: 0,
      }
      continue
    }

    if (!current) continue

    const colB = (cols[1] || '').trim()
    const colF = cols[5] || ''

    // Only capture first occurrence of each metric (avoids self-gen section overwriting main values)
    if (colB.includes('Appts Booked') && !seen.appts) {
      current.appts = parseVal(colF)
      seen.appts = true
    } else if (colB.includes('Visits to Dealer') && !seen.visits) {
      current.visits = parseVal(colF)
      seen.visits = true
    } else if (colB.includes('Apply') && !colB.includes('Rate') && !colB.includes('Sit') && !seen.apply) {
      current.apply = parseVal(colF)
      seen.apply = true
    } else if ((colB.includes('Approved for credit') || colB.includes('Got Approved')) && !seen.approved) {
      current.approved = parseVal(colF)
      seen.approved = true
    } else if (colB.includes('Denied') && !colB.includes('Rate') && !seen.denied) {
      current.denied = parseVal(colF)
      seen.denied = true
    } else if (colB.includes('Closes - SOLD') && !seen.closes) {
      current.closes = parseVal(colF)
      seen.closes = true
    } else if (colB.includes('SOLD from ADS - 100%')) {
      current.selfGenAds = parseVal(colF)
    } else if (colB.includes('Cancels')) {
      current.cancels = parseVal(colF)
    }
  }

  if (current) people.push(current)
  return people
}

// Existing PINs from defaults.js (preserve across months)
const CLOSER_PINS = {
  'Fabiola Iorio': '1001',
  'Laura Indriago': '1002',
  'Christopher Cepeda': '1003',
  'Juan Rodriguez': '1004',
  'Maria De Gouveia': '1005',
  'Fady Zahr Chacon': '1006',
  'Eleazar Hidalgo': '1007',
  'Miguel Reyes': '1008',
  'Giovanni Martinez': '1009',
  'Nickol Montero': '1010',
}

const SETTER_PINS = {
  'Moises Gutierrez': '2001',
  'Juviany Padron': '2002',
  'Isiley Melendez': '2003',
  'Rene Peña': '2004',
  'Elvis Pacheco': '2005',
  'Katherine Atencio': '2006',
  'David Mendoza': '2007',
  'Odimar Vasquez': '2008',
  'David Santos': '2009',
  'Kener Ortega': '2010',
  'Kevin Aranguren': '2011',
  'Anthony Patiño': '2012',
  'Carlos Bermudez': '2013',
  'Esther Alvarado': '2014',
  'Ulises Mendez': '2015',
  'Geziel Tovar': '2016',
  'Daniel Alvarez': '2017',
  'Gabriel Zambrano': '2018',
  'Keila Ojeda': '2019',
}

let nextCloserPin = 1100
let nextSetterPin = 2100

function getCloserPin(name) {
  // Try exact match first
  if (CLOSER_PINS[name]) return CLOSER_PINS[name]
  // Try case-insensitive match
  for (const [k, v] of Object.entries(CLOSER_PINS)) {
    if (k.toLowerCase() === name.toLowerCase()) return v
  }
  return String(nextCloserPin++)
}

function getSetterPin(name) {
  if (SETTER_PINS[name]) return SETTER_PINS[name]
  for (const [k, v] of Object.entries(SETTER_PINS)) {
    if (k.toLowerCase() === name.toLowerCase()) return v
  }
  return String(nextSetterPin++)
}

function formatSetterCsv(setters) {
  const headers = 'Nombre,PIN,Foto,LeadsAsignados,Contactados,CitasAgendadas,Shows,Ventas,Aplicaron,Aprobados,Negados,UltimaActividad'
  const rows = setters.map(s => {
    const pin = getSetterPin(s.name)
    return `${s.name},${pin},,${s.prospects},${s.prospects},${s.appts},${s.visits},${s.closes},${s.apply},${s.approved},${s.denied},`
  })
  return [headers, ...rows].join('\n')
}

function formatCloserCsv(closers) {
  const headers = 'Nombre,PIN,Foto,SelfGen,CallCenter,Sits,CitasPropias,VisitasPropias,Aplicaron,Aprobados,Negados,Cancelaciones,UltimaActividad'
  const rows = closers.map(c => {
    const pin = getCloserPin(c.name)
    const selfGen = c.selfGenAds || 0
    const callCenter = Math.max(0, c.closes - selfGen)
    return `${c.name},${pin},,${selfGen},${callCenter},${c.apply},${c.appts},${c.visits},${c.apply},${c.approved},${c.denied},${c.cancels},`
  })
  return [headers, ...rows].join('\n')
}

async function main() {
  console.log('=== Historical Data Extraction ===\n')

  for (const month of MONTHS_TO_EXTRACT) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`MONTH: ${month.key}`)
    console.log('='.repeat(60))

    // Fetch setters
    const setterCsv = await fetchCsv(SETTERS_SHEET_ID, month.setterTab)
    if (setterCsv) {
      const setters = extractSetters(setterCsv)
      console.log(`\n--- Setters_${month.key} (${setters.length} people) ---`)
      for (const s of setters) {
        console.log(`  ${s.name}: Leads=${s.prospects} Citas=${s.appts} Shows=${s.visits} Ventas=${s.closes} Apply=${s.apply} Appr=${s.approved} Neg=${s.denied}`)
      }
      console.log(`\n--- CSV for Setters_${month.key} ---`)
      console.log(formatSetterCsv(setters))
    } else {
      console.log(`  [NO DATA] Could not fetch setter tab: ${month.setterTab}`)
    }

    // Fetch closers
    const closerCsv = month.closerTab ? await fetchCsv(CLOSERS_SHEET_ID, month.closerTab) : null
    if (closerCsv) {
      const closers = extractClosers(closerCsv)
      console.log(`\n--- Closers_${month.key} (${closers.length} people) ---`)
      for (const c of closers) {
        const selfGen = c.selfGenAds || 0
        const cc = Math.max(0, c.closes - selfGen)
        console.log(`  ${c.name}: SelfGen=${selfGen} CC=${cc} Sits=${c.apply} Citas=${c.appts} Vis=${c.visits} Appr=${c.approved} Neg=${c.denied} Cancels=${c.cancels}`)
      }
      console.log(`\n--- CSV for Closers_${month.key} ---`)
      console.log(formatCloserCsv(closers))
    } else {
      console.log(`  [NO DATA] Could not fetch closer tab: ${month.closerTab}`)
    }
  }
}

main().catch(console.error)
