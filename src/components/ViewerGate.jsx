import { useState } from 'react'

export default function ViewerGate({ viewerPin, closers, setters, adminPins, onAccess }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()

    // Check admin PINs first (owner/manager/admin)
    const adminRole = adminPins[pin]
    if (adminRole) {
      onAccess({ type: 'admin', role: adminRole, pin })
      return
    }

    // Check general viewer PIN
    if (pin === viewerPin) {
      onAccess({ type: 'viewer' })
      return
    }

    // Check individual PINs (closers + setters)
    const closer = closers.find(p => p.pin && p.pin === pin)
    if (closer) {
      onAccess({ type: 'individual', name: closer.name, pin: closer.pin, personType: 'closer' })
      return
    }
    const setter = setters.find(p => p.pin && p.pin === pin)
    if (setter) {
      onAccess({ type: 'individual', name: setter.name, pin: setter.pin, personType: 'setter' })
      return
    }

    setError(true)
    setPin('')
    setTimeout(() => setError(false), 1500)
  }

  return (
    <div className="viewer-gate">
      <div className="viewer-gate-panel">
        <div className="viewer-gate-logo">
          <span className="logo-ar" style={{ fontSize: 48 }}>AR</span>
        </div>
        <h1 className="viewer-gate-title">GLOBAL SALES SCORE</h1>
        <p className="viewer-gate-sub">Ingresa tu PIN de acceso</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            maxLength={6}
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
