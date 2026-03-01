import { useState } from 'react'

const DEFAULT_PINS = {
  '1234': 'owner',
  '5678': 'manager',
  '0000': 'admin',
}

export default function AuthGate({ onAuth, onClose, adminPins }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  const pins = adminPins || DEFAULT_PINS

  const handleSubmit = (e) => {
    e.preventDefault()
    const role = pins[pin]
    if (role) {
      onAuth(role)
    } else {
      setError(true)
      setPin('')
      setTimeout(() => setError(false), 1500)
    }
  }

  return (
    <div className="kpi-overlay" onClick={onClose}>
      <div className="auth-panel" onClick={(e) => e.stopPropagation()}>
        <h2>🔐 Acceso Editor</h2>
        <p>Ingresa tu PIN para editar</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="••••"
            className={`auth-input ${error ? 'auth-error' : ''}`}
            autoFocus
          />
          <button type="submit" className="auth-btn">Entrar</button>
        </form>
        {error && <p className="auth-error-msg">PIN incorrecto</p>}
      </div>
    </div>
  )
}
