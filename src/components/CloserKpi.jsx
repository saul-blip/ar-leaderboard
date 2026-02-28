import Avatar from './Avatar'
import FunnelChart from './FunnelChart'
import Stat from './Stat'
import {
  closerSales, closerEffectiveness, closerAppointmentToVisit,
  closerApprovalRate, effectivenessColor,
} from '../utils/calculations'

export default function CloserKpi({ person, onClose }) {
  const sales = closerSales(person)
  const eff = closerEffectiveness(person)
  const citaVisita = closerAppointmentToVisit(person)
  const approval = closerApprovalRate(person)

  const funnelSteps = [
    { label: 'Citas Propias', value: person.citasPropias, color: '#74b9ff' },
    { label: 'Visitas Propias', value: person.visitasPropias, color: '#54a0ff' },
    { label: 'Sits (Aprobados Sentados)', value: person.sits, color: '#e94560' },
    { label: 'Aplicaron Crédito', value: person.aplicaron, color: '#f5a623' },
    { label: 'Aprobados', value: person.aprobados, color: '#00e676' },
    { label: 'Ventas Cerradas', value: sales, color: '#e94560' },
  ]

  return (
    <div className="kpi-overlay" onClick={onClose}>
      <div className="kpi-panel" onClick={(e) => e.stopPropagation()}>
        <button className="kpi-close" onClick={onClose}>✕</button>

        <div className="kpi-header">
          <Avatar name={person.name} photo={person.photo} size={80} />
          <div>
            <h2 className="kpi-name">{person.name}</h2>
            <span className="kpi-badge closers">CLOSER</span>
          </div>
        </div>

        <div className="kpi-hero">
          <div className="kpi-hero-value" style={{ color: effectivenessColor(eff) }}>
            {eff}%
          </div>
          <div className="kpi-hero-label">Efectividad de Cierre</div>
        </div>

        <div className="kpi-section">
          <h3>Ventas</h3>
          <div className="kpi-grid">
            <Stat label="Total" value={sales} color="#e94560" />
            <Stat label="Self-Gen" value={person.selfGen} />
            <Stat label="Call Center" value={person.callCenter} />
          </div>
        </div>

        <div className="kpi-section">
          <h3>Actividad</h3>
          <div className="kpi-grid">
            <Stat label="Sits" value={person.sits} />
            <Stat label="Citas Propias" value={person.citasPropias} />
            <Stat label="Visitas Propias" value={person.visitasPropias} />
          </div>
        </div>

        <div className="kpi-section">
          <h3>Calidad</h3>
          <div className="kpi-grid">
            <Stat label="Aplicaron" value={person.aplicaron} color="#54a0ff" />
            <Stat label="Aprobados" value={person.aprobados} color="#00e676" />
            <Stat label="Negados" value={person.negados} color="#ff5252" />
          </div>
        </div>

        <div className="kpi-section">
          <h3>Efectividad</h3>
          <div className="kpi-grid">
            <Stat label="Cierre" value={`${eff}%`} color={effectivenessColor(eff)} />
            <Stat label="Cita→Visita" value={`${citaVisita}%`} color={effectivenessColor(citaVisita)} />
            <Stat label="Aprobación" value={`${approval}%`} color={effectivenessColor(approval)} />
          </div>
        </div>

        <FunnelChart steps={funnelSteps} />
      </div>
    </div>
  )
}
