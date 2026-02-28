export default function Stat({ label, value, sub, color }) {
  return (
    <div className="stat-box">
      <div className="stat-value" style={color ? { color } : {}}>
        {value}
      </div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}
