import { totalCloserSales, totalSetterSales, avgCloserEffectiveness, avgSetterLeadToCita } from '../utils/calculations'

export default function StatsBar({ closers, setters }) {
  return (
    <div className="stats-bar">
      <div className="global-stat">
        <span className="global-stat-value closers-accent">{totalCloserSales(closers)}</span>
        <span className="global-stat-label">Ventas Closers</span>
      </div>
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
