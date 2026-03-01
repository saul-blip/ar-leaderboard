export default function FunnelChart({ steps }) {
  if (!steps || steps.length === 0) return null
  const maxVal = Math.max(...steps.map(s => s.value), 1)

  return (
    <div className="funnel">
      <h3 className="funnel-title">FUNNEL</h3>
      {steps.map((step, i) => {
        const width = Math.max((step.value / maxVal) * 100, 8)
        const prevVal = i > 0 ? steps[i - 1].value : null
        const convRate = prevVal ? Math.round((step.value / prevVal) * 100) : null

        return (
          <div key={step.label} className="funnel-step" style={{ '--delay': `${i * 0.06}s` }}>
            <div className="funnel-step-header">
              <span className="funnel-step-label">{step.label}</span>
              <span className="funnel-step-value">{step.value}</span>
            </div>
            <div className="funnel-bar-track">
              <div
                className="funnel-bar-fill"
                style={{ width: `${width}%`, background: step.color || '#54a0ff' }}
              ></div>
            </div>
            {convRate !== null && (
              <span className="funnel-conv">{convRate}% conv.</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
