import {
  totalSelfGenSales, totalCallCenterSales, totalWalkInSales,
  avgCloserEffectiveness, avgSetterLeadToCita,
  paceProjection, salesByLocation,
} from '../utils/calculations'

export default function StatsBar({ closers, setters, accessInfo, isCurrentMonth }) {
  const isAdmin = accessInfo?.type === 'admin'

  const selfGen    = totalSelfGenSales(closers)
  const callCenter = totalCallCenterSales(closers)
  const walkIn     = totalWalkInSales(closers)

  // Pace projections + location breakdown — admin + current month only
  let paces  = null
  let byLoc  = null
  if (isAdmin && isCurrentMonth) {
    const today      = new Date()
    const day        = today.getDate()
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    paces = {
      selfGen:    paceProjection(selfGen,    day, daysInMonth),
      callCenter: paceProjection(callCenter, day, daysInMonth),
      walkIn:     paceProjection(walkIn,     day, daysInMonth),
    }
    byLoc = salesByLocation(closers)
  }

  return (
    <div className="stats-bar">

      {/* ── SelfGen ── */}
      <div className="global-stat">
        <span className="global-stat-value" style={{ color: '#e94560' }}>{selfGen}</span>
        <span className="global-stat-label">SelfGen</span>
        {paces && <span className="global-stat-pace">→ ~{paces.selfGen} este mes</span>}
        {byLoc && (
          <span className="global-stat-loc">ORL {byLoc.ORL.selfGen} / KSS {byLoc.KSS.selfGen}</span>
        )}
      </div>

      {/* ── Call Center ── */}
      <div className="global-stat">
        <span className="global-stat-value" style={{ color: '#a29bfe' }}>{callCenter}</span>
        <span className="global-stat-label">Call Center</span>
        {paces && <span className="global-stat-pace">→ ~{paces.callCenter} este mes</span>}
        {byLoc && (
          <span className="global-stat-loc">ORL {byLoc.ORL.callCenter} / KSS {byLoc.KSS.callCenter}</span>
        )}
      </div>

      {/* ── Walk-In ── */}
      <div className="global-stat">
        <span className="global-stat-value" style={{ color: '#00cec9' }}>{walkIn}</span>
        <span className="global-stat-label">Walk-In</span>
        {paces && <span className="global-stat-pace">→ ~{paces.walkIn} este mes</span>}
        {byLoc && (
          <span className="global-stat-loc">ORL {byLoc.ORL.walkIn} / KSS {byLoc.KSS.walkIn}</span>
        )}
      </div>

      {/* ── Métricas de ratio ── */}
      <div className="global-stat">
        <span className="global-stat-value">{avgCloserEffectiveness(closers)}%</span>
        <span className="global-stat-label">Efect. Closers</span>
      </div>

      <div className="global-stat">
        <span className="global-stat-value">{avgSetterLeadToCita(setters)}%</span>
        <span className="global-stat-label">Lead→Cita</span>
      </div>

    </div>
  )
}
