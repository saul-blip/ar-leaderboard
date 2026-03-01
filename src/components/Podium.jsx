import Avatar from './Avatar'
import { effectivenessColor } from '../utils/calculations'

const MEDALS = ['🥇', '🥈', '🥉']
const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32']

export default function Podium({ people, type, getSales, getDenominator, getEffectiveness, onSelect }) {
  if (people.length === 0) return null

  // Show podium with available people (1, 2, or 3)
  const order = people.length >= 3 ? [1, 0, 2] : people.length === 2 ? [1, 0] : [0]

  return (
    <div className="podium">
      {order.map((idx) => {
        const p = people[idx]
        if (!p) return null
        const sales = getSales(p)
        const eff = getEffectiveness(p)
        const den = getDenominator(p)
        const isFirst = idx === 0

        return (
          <div
            key={p.id}
            className={`podium-item podium-${idx + 1} ${type}`}
            onClick={() => onSelect(p)}
            style={{ '--delay': `${idx * 0.1}s` }}
          >
            {isFirst && <div className="crown">👑</div>}
            <div className="podium-medal" style={{ color: MEDAL_COLORS[idx] }}>
              {MEDALS[idx]}
            </div>
            <div className="podium-avatar-wrap">
              <Avatar name={p.name} photo={p.photo} size={isFirst ? 72 : 56} />
            </div>
            <div className="podium-name">{p.name.split(' ')[0]}</div>
            <div className="podium-sales">{sales}</div>
            <div className="podium-denominator">/ {den}</div>
            <div className="podium-eff" style={{ color: effectivenessColor(eff) }}>
              {eff}%
            </div>
            <div className={`podium-bar podium-bar-${idx + 1}`}></div>
          </div>
        )
      })}
    </div>
  )
}
