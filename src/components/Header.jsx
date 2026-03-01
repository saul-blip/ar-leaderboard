import { formatMonthLabel } from '../utils/sheets'

export default function Header({ onEdit, onTv, tvMode, currentMonth, isLive }) {
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
          {isLive ? (
            <span className="badge-live">
              <span className="live-dot"></span>
              LIVE
            </span>
          ) : (
            <span className="badge-past">ARCHIVO</span>
          )}
          <span className="header-date">{formatMonthLabel(currentMonth)}</span>
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
