import Avatar from './Avatar'
import { effectivenessColor } from '../utils/calculations'

export default function Row({ person, rank, type, getSales, getDenominator, getEffectiveness, onSelect }) {
  const sales = getSales(person)
  const eff = getEffectiveness(person)
  const den = getDenominator(person)

  return (
    <div
      className={`row ${type}`}
      onClick={() => onSelect(person)}
      style={{ '--delay': `${(rank - 4) * 0.05}s` }}
    >
      <span className="row-rank">#{rank}</span>
      <Avatar name={person.name} photo={person.photo} size={36} />
      <span className="row-name">{person.name}</span>
      <span className="row-eff" style={{ color: effectivenessColor(eff) }}>{eff}%</span>
      <span className="row-sales">{sales}</span>
      <span className="row-den">/ {den}</span>
    </div>
  )
}
