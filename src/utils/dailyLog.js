/**
 * Frontend API client for the Daily Production Log web app.
 */

export async function submitDailyLog(webAppUrl, { pin, date, personType, personName, metrics, adminPin }) {
  const body = {
    action: 'submit',
    pin,
    date,
    personType,
    personName,
    metrics,
  }
  if (adminPin) body.adminPin = adminPin

  const res = await fetch(webAppUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(body),
  })

  // Apps Script web apps redirect; fetch follows redirects automatically
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return { ok: false, error: 'Invalid response from server' }
  }
}

export async function fetchTodayEntry(webAppUrl, pin) {
  try {
    const url = `${webAppUrl}?action=today&pin=${encodeURIComponent(pin)}`
    const res = await fetch(url)
    const text = await res.text()
    const data = JSON.parse(text)
    return data.entry || null
  } catch {
    return null
  }
}

export async function fetchDailyHistory(webAppUrl, pin) {
  try {
    const url = `${webAppUrl}?action=history&pin=${encodeURIComponent(pin)}`
    const res = await fetch(url)
    const text = await res.text()
    const data = JSON.parse(text)
    return data.entries || []
  } catch {
    return []
  }
}
