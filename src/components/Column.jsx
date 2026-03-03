import Podium from './Podium'
import Row from './Row'
import Stat from './Stat'
import {
  closerSales, closerEffectiveness, setterLeadToCita, setterShowRate,
  totalCloserSales, totalSetterSales, avgCloserEffectiveness, avgSetterLeadToCita,
  sortClosers, sortSetters, effectivenessColor,
} from '../utils/calculations'

export default function Column({ type, data, onSelect }) {
  const isCloser = type === 'closers'
  const sorted = isCloser ? sortClosers(data) : sortSetters(data)
  const top3 = sorted.slice(0, 3)
  const rest = sorted.slice(3)

  const totalSales = isCloser ? totalCloserSales(data) : totalSetterSales(data)
  const avgEff = isCloser ? avgCloserEffectiveness(data) : avgSetterLeadToCita(data)

  const getSales = isCloser ? closerSales : (s) => s.ventas
  const getDenominator = isCloser ? (c) => c.sits : (s) => s.shows
  const getEffectiveness = isCloser ? closerEffectiveness : setterLeadToCita

  const totalDen = isCloser
    ? data.reduce((s, c) => s + c.sits, 0)
    : data.reduce((s, st) => s + st.shows, 0)

  return (
    <div className={`column ${type}`}>
      <div className="column-header">
        <h2 className="column-title">{isCloser ? 'CLOSERS' : 'SETTERS'}</h2>
        <div className="column-total">
          <span className="column-total-num">{totalSales}</span>
          <span className="column-total-label">ventas</span>
        </div>
      </div>

      <div className="column-stats">
        <Stat
          label={isCloser ? 'Sits' : 'Shows'}
          value={isCloser ? data.reduce((s, c) => s + c.sits, 0) : data.reduce((s, st) => s + st.shows, 0)}
        />
        <Stat
          label={isCloser ? 'Efectividad' : 'Lead→Cita'}
          value={`${avgEff}%`}
          color={effectivenessColor(avgEff)}
        />
        {!isCloser && (() => {
          const totalShows = data.reduce((s, st) => s + st.shows, 0)
          const totalCitas = data.reduce((s, st) => s + st.citasAgendadas, 0)
          const showRate = totalCitas > 0 ? Math.round((totalShows / totalCitas) * 100) : 0
          return <Stat label="Show Rate" value={`${showRate}%`} />
        })()}
      </div>

      <Podium
        people={top3}
        type={type}
        getSales={getSales}
        getDenominator={getDenominator}
        getEffectiveness={getEffectiveness}
        onSelect={onSelect}
      />

      <div className="row-list">
        {rest.map((p, i) => (
          <Row
            key={p.id}
            person={p}
            rank={i + 4}
            type={type}
            getSales={getSales}
            getDenominator={getDenominator}
            getEffectiveness={getEffectiveness}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}
