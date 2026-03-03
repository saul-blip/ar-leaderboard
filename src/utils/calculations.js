export function pct(num, den) {
  if (!den) return 0
  return Math.round((num / den) * 100)
}

export function closerSales(c) {
  return c.selfGen + c.callCenter + (c.walkIn || 0)
}

export function closerEffectiveness(c) {
  return pct(closerSales(c), c.sits)
}

export function closerAppointmentToVisit(c) {
  return pct(c.visitasPropias, c.citasPropias)
}

export function closerApprovalRate(c) {
  return pct(c.aprobados, c.aplicaron)
}

export function setterLeadToCita(s) {
  return pct(s.citasAgendadas, s.leadsNuevos ?? s.leadsAsignados)
}

export function setterShowRate(s) {
  return pct(s.shows, s.citasAgendadas)
}

export function setterApprovalRate(s) {
  return pct(s.aprobados, s.aplicaron)
}

export function sortClosers(closers) {
  return [...closers].sort((a, b) => closerSales(b) - closerSales(a))
}

export function sortSetters(setters) {
  return [...setters].sort((a, b) => b.ventas - a.ventas)
}

export function totalCloserSales(closers) {
  return closers.reduce((s, c) => s + closerSales(c), 0)
}

export function totalSetterSales(setters) {
  return setters.reduce((s, st) => s + st.ventas, 0)
}

export function avgCloserEffectiveness(closers) {
  const totalSales = closers.reduce((s, c) => s + closerSales(c), 0)
  const totalSits = closers.reduce((s, c) => s + c.sits, 0)
  return pct(totalSales, totalSits)
}

export function avgSetterLeadToCita(setters) {
  const totalCitas = setters.reduce((s, st) => s + st.citasAgendadas, 0)
  const totalLeads = setters.reduce((s, st) => s + (st.leadsNuevos ?? st.leadsAsignados), 0)
  return pct(totalCitas, totalLeads)
}

export function totalCallCenterSales(closers) {
  return closers.reduce((s, c) => s + c.callCenter, 0)
}

export function paceProjection(current, dayOfMonth, daysInMonth) {
  if (!dayOfMonth || !current) return 0
  return Math.round((current / dayOfMonth) * daysInMonth)
}

export function effectivenessColor(val) {
  if (val >= 60) return '#00e676'
  if (val >= 35) return '#f5a623'
  return '#ff5252'
}

export function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export function nameToColor(name) {
  if (!name) return 'linear-gradient(135deg, hsl(220, 70%, 45%), hsl(260, 80%, 55%))'
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = Math.abs(hash) % 360
  return `linear-gradient(135deg, hsl(${h}, 70%, 45%), hsl(${(h + 40) % 360}, 80%, 55%))`
}

export const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]
