import {
  totalCloserSales, totalSetterSales,
  avgCloserEffectiveness, avgSetterLeadToCita,
  paceProjection,
} from '../utils/calculations'

export default function StatsBar({ closers, setters, accessInfo, isCurrentMonth }) {
  const isAdmin = accessInfo?.type === 'admin'

  // Pace projection: only for admin viewing current month
  let closerPace = null
  let ccPace = null
  if (isAdmin && isCurrentMonth) {
    const today = new Date()
    const day = today.getDate()
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    closerPace = paceProjection(totalCloserSales(closers), day, daysInMonth)
    ccPace     = paceProjection(totalSetterSales(setters), day, daysInMonth)
  }

  return (
    <div className="stats-bar">
      <div className="global-stat">
        <span className="global-stat-value closers-accent">{totalCloserSales(closers)}</span>
        <span className="global-stat-label">Ventas Closers</span>
        {closerPace !== null && (
          <span className="global-stat-pace">→ ~{closerPace} este mes</span>
        )}
      </div>

      {isAdmin && isCurrentMonth && (
        <div className="global-stat">
          <span className="global-stat-value" style={{ color: '#a29bfe' }}>{totalSetterSales(setters)}</span>
          <span className="global-stat-label">Call Center</span>
          {ccPace !== null && (
            <span className="global-stat-pace">→ ~{ccPace} este mes</span>
          )}
        </div>
      )}

      <div className="global-stat">
        <span className="global-stat-value setters-accent">{totalSetterSales(setters)}</span>
        <span className="global-stat-label">Ventas Setters</span>
      </div>
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
