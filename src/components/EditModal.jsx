import { useState } from 'react'
import { getCurrentMonth } from '../utils/sheets'

// For now, only allow editing photos (other fields are auto-synced from GHL)
const CLOSER_FIELDS = [
  { key: 'name', label: 'Nombre', type: 'text', disabled: true },
  { key: 'pin', label: 'PIN', type: 'text', disabled: true },
  { key: 'photo', label: 'URL Foto', type: 'text' },
]

const SETTER_FIELDS = [
  { key: 'name', label: 'Nombre', type: 'text', disabled: true },
  { key: 'pin', label: 'PIN', type: 'text', disabled: true },
  { key: 'photo', label: 'URL Foto', type: 'text' },
]

export default function EditModal({ closers, setters, viewerPin, onSave, onClose, role, adminPin, monthKey }) {
  const [tab, setTab] = useState('closers')
  const [editClosers, setEditClosers] = useState(JSON.parse(JSON.stringify(closers)))
  const [editSetters, setEditSetters] = useState(JSON.parse(JSON.stringify(setters)))
  const [editViewerPin, setEditViewerPin] = useState(viewerPin)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const data = tab === 'closers' ? editClosers : editSetters
  const setData = tab === 'closers' ? setEditClosers : setEditSetters
  const fields = tab === 'closers' ? CLOSER_FIELDS : SETTER_FIELDS
  const currentMonth = monthKey || getCurrentMonth()

  const updateField = (idx, key, value) => {
    const copy = [...data]
    copy[idx] = { ...copy[idx], [key]: value }
    setData(copy)
  }


  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      // Save photos to localStorage for persistence
      const photosKey = `ar-leaderboard-photos-${currentMonth}`
      const photoData = {
        closers: editClosers.map(c => ({ name: c.name, photo: c.photo })),
        setters: editSetters.map(s => ({ name: s.name, photo: s.photo })),
      }
      localStorage.setItem(photosKey, JSON.stringify(photoData))

      // Update local state
      onSave(editClosers, editSetters, editViewerPin)
      onClose()
    } catch (err) {
      console.error('Save error:', err)
      setError(err.message || 'Error saving photos')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="kpi-overlay" onClick={onClose}>
      <div className="edit-panel" onClick={(e) => e.stopPropagation()}>
        <button className="kpi-close" onClick={onClose}>✕</button>
        <div className="edit-header">
          <h2>Editor de Datos</h2>
          <span className="kpi-badge" style={{ background: '#54a0ff' }}>{(role || '').toUpperCase()}</span>
        </div>

        <div className="edit-viewer-pin">
          <label>PIN General de Visualización:</label>
          <input
            type="text"
            value={editViewerPin}
            onChange={(e) => setEditViewerPin(e.target.value.replace(/\D/g, ''))}
            maxLength={6}
            className="edit-input"
            style={{ width: 100, textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: 4 }}
          />
        </div>

        <div className="edit-tabs">
          <button className={`edit-tab ${tab === 'closers' ? 'active' : ''}`} onClick={() => setTab('closers')}>
            Closers
          </button>
          <button className={`edit-tab ${tab === 'setters' ? 'active' : ''}`} onClick={() => setTab('setters')}>
            Setters
          </button>
        </div>

        <div style={{ padding: '20px', fontSize: '12px', color: '#999' }}>
          📷 Agrega o actualiza las fotos (URL). Los demás datos vienen automáticamente del CRM.
        </div>

        <div className="edit-grid-wrap">
          <div className="edit-grid">
            <div className="edit-grid-header">
              {fields.map(f => (
                <span key={f.key} className="edit-grid-th">{f.label}</span>
              ))}
            </div>
            {data.map((person, idx) => (
              <div key={person.id} className="edit-grid-row">
                {fields.map(f => (
                  <input
                    key={f.key}
                    type={f.key === 'pin' ? 'text' : f.type}
                    value={person[f.key]}
                    onChange={(e) => updateField(idx, f.key, f.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                    className={`edit-input ${f.key === 'pin' ? 'edit-input-pin' : ''}`}
                    step={f.key === 'ventas' ? '0.5' : '1'}
                    maxLength={f.key === 'pin' ? 6 : undefined}
                    placeholder={f.key === 'pin' ? '----' : f.key === 'photo' ? 'https://...' : ''}
                    disabled={f.disabled || saving}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="edit-actions">
          <button className="edit-save" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
            {saving ? '⏳ Guardando...' : '💾 Guardar Fotos'}
          </button>
        </div>

        {error && (
          <div style={{ color: '#ff5252', textAlign: 'center', marginTop: '10px', fontSize: '12px' }}>
            ❌ {error}
          </div>
        )}
      </div>
    </div>
  )
}
