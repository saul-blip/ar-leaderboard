import { MONTHS_ES } from '../utils/calculations'

export default function Header({ onEdit, onTv, tvMode }) {
  const now = new Date()
  const month = MONTHS_ES[now.getMonth()]
  const year = now.getFullYear()

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <span className="logo-ar">AR</span>
          <span className="logo-text">AUTO REPUBLIC</span>
        </div>
      </div>
      <div className="header-center">
        <h1 className="title">GLOBAL SALES SCORE</h1>
        <div className="header-meta">
          <span className="badge-live">
            <span className="live-dot"></span>
            LIVE
          </span>
          <span className="header-date">{month} {year}</span>
        </div>
      </div>
      <div className="header-right">
        {!tvMode && (
          <button className="btn-icon" onClick={onEdit} title="Editar">
            🔐
          </button>
        )}
        <button className="btn-icon" onClick={onTv} title={tvMode ? 'Salir TV' : 'Modo TV'}>
          {tvMode ? '✕' : '📺'}
        </button>
      </div>
    </header>
  )
}
