import Avatar from './Avatar'
import FunnelChart from './FunnelChart'
import Stat from './Stat'
import {
  setterLeadToCita, setterShowRate, setterApprovalRate, effectivenessColor,
} from '../utils/calculations'

export default function SetterKpi({ person, onClose }) {
  const leadCita = setterLeadToCita(person)
  const showRate = setterShowRate(person)
  const approval = setterApprovalRate(person)

  const funnelSteps = [
    { label: 'Leads Asignados', value: person.leadsAsignados, color: '#74b9ff' },
    { label: 'Contactados', value: person.contactados, color: '#54a0ff' },
    { label: 'Citas Agendadas', value: person.citasAgendadas, color: '#f5a623' },
    { label: 'Shows', value: person.shows, color: '#e94560' },
    { label: 'Aplicaron Crédito', value: person.aplicaron, color: '#f5a623' },
    { label: 'Aprobados', value: person.aprobados, color: '#00e676' },
    { label: 'Ventas', value: person.ventas, color: '#e94560' },
  ]

  return (
    <div className="kpi-overlay" onClick={onClose}>
      <div className="kpi-panel" onClick={(e) => e.stopPropagation()}>
        <button className="kpi-close" onClick={onClose}>✕</button>

        <div className="kpi-header">
          <Avatar name={person.name} photo={person.photo} size={80} />
          <div>
            <h2 className="kpi-name">{person.name}</h2>
            <span className="kpi-badge setters">SETTER</span>
          </div>
        </div>

        <div className="kpi-hero">
          <div className="kpi-hero-value" style={{ color: effectivenessColor(leadCita) }}>
            {leadCita}%
          </div>
          <div className="kpi-hero-label">Lead → Cita</div>
        </div>

        <div className="kpi-section">
          <h3>Volumen</h3>
          <div className="kpi-grid">
            <Stat label="Leads Asignados" value={person.leadsAsignados} />
            <Stat label="Contactados" value={person.contactados} />
            <Stat label="Ventas" value={person.ventas} color="#e94560" />
          </div>
        </div>

        <div className="kpi-section">
          <h3>Pipeline</h3>
          <div className="kpi-grid">
            <Stat label="Citas Agendadas" value={person.citasAgendadas} />
            <Stat label="Shows" value={person.shows} />
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
            <Stat label="Lead→Cita" value={`${leadCita}%`} color={effectivenessColor(leadCita)} />
            <Stat label="Show Rate" value={`${showRate}%`} color={effectivenessColor(showRate)} />
            <Stat label="Aprobación" value={`${approval}%`} color={effectivenessColor(approval)} />
          </div>
        </div>

        <FunnelChart steps={funnelSteps} />
      </div>
    </div>
  )
}
