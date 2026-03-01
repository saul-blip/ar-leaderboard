import { formatMonthLabel } from '../utils/sheets'

export default function MonthSelector({ months, current, onChange }) {
  const idx = months.indexOf(current)

  const handlePrev = () => {
    if (idx < months.length - 1) onChange(months[idx + 1])
  }

  const handleNext = () => {
    if (idx > 0) onChange(months[idx - 1])
  }

  return (
    <div className="month-selector">
      <button
        className="month-btn"
        onClick={handlePrev}
        disabled={idx >= months.length - 1}
      >
        ◀
      </button>
      <span className="month-label">{formatMonthLabel(current)}</span>
      <button
        className="month-btn"
        onClick={handleNext}
        disabled={idx <= 0}
      >
        ▶
      </button>
    </div>
  )
}
