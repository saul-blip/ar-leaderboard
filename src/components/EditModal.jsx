import { useState } from 'react'

const CLOSER_FIELDS = [
  { key: 'name', label: 'Nombre', type: 'text' },
  { key: 'pin', label: 'PIN', type: 'text' },
  { key: 'photo', label: 'URL Foto', type: 'text' },
  { key: 'selfGen', label: 'Self-Gen', type: 'number' },
  { key: 'callCenter', label: 'Others', type: 'number' },
  { key: 'sits', label: 'Sits', type: 'number' },
  { key: 'citasPropias', label: 'Citas Propias', type: 'number' },
  { key: 'visitasPropias', label: 'Visitas Propias', type: 'number' },
  { key: 'aplicaron', label: 'Aplicaron', type: 'number' },
  { key: 'aprobados', label: 'Aprobados', type: 'number' },
  { key: 'negados', label: 'Negados', type: 'number' },
  { key: 'cancels', label: 'Cancel.', type: 'number' },
]

const SETTER_FIELDS = [
  { key: 'name', label: 'Nombre', type: 'text' },
  { key: 'pin', label: 'PIN', type: 'text' },
  { key: 'photo', label: 'URL Foto', type: 'text' },
  { key: 'leadsAsignados', label: 'Leads Asig.', type: 'number' },
  { key: 'contactados', label: 'Contactados', type: 'number' },
  { key: 'citasAgendadas', label: 'Citas Ag.', type: 'number' },
  { key: 'shows', label: 'Shows', type: 'number' },
  { key: 'ventas', label: 'Ventas', type: 'number' },
  { key: 'aplicaron', label: 'Aplicaron', type: 'number' },
  { key: 'aprobados', label: 'Aprobados', type: 'number' },
  { key: 'negados', label: 'Negados', type: 'number' },
]

function newCloser(id) {
  return { id, name: '', pin: '', photo: '', selfGen: 0, callCenter: 0, sits: 0, citasPropias: 0, visitasPropias: 0, aplicaron: 0, aprobados: 0, negados: 0, cancels: 0 }
}

function newSetter(id) {
  return { id, name: '', pin: '', photo: '', leadsAsignados: 0, contactados: 0, citasAgendadas: 0, shows: 0, ventas: 0, aplicaron: 0, aprobados: 0, negados: 0 }
}

export default function EditModal({ closers, setters, viewerPin, onSave, onClose, role }) {
  const [tab, setTab] = useState('closers')
  const [editClosers, setEditClosers] = useState(JSON.parse(JSON.stringify(closers)))
  const [editSetters, setEditSetters] = useState(JSON.parse(JSON.stringify(setters)))
  const [editViewerPin, setEditViewerPin] = useState(viewerPin)

  const data = tab === 'closers' ? editClosers : editSetters
  const setData = tab === 'closers' ? setEditClosers : setEditSetters
  const fields = tab === 'closers' ? CLOSER_FIELDS : SETTER_FIELDS

  const updateField = (idx, key, value) => {
    const copy = [...data]
    copy[idx] = { ...copy[idx], [key]: value }
    setData(copy)
  }

  const addPerson = () => {
    const maxId = data.reduce((m, p) => Math.max(m, p.id), 0)
    const person = tab === 'closers' ? newCloser(maxId + 1) : newSetter(maxId + 1)
    setData([...data, person])
  }

  const removePerson = (idx) => {
    setData(data.filter((_, i) => i !== idx))
  }

  const handleSave = () => {
    onSave(editClosers, editSetters, editViewerPin)
    onClose()
  }

  return (
    <div className="kpi-overlay" onClick={onClose}>
      <div className="edit-panel" onClick={(e) => e.stopPropagation()}>
        <button className="kpi-close" onClick={onClose}>✕</button>
        <div className="edit-header">
          <h2>Editor de Datos</h2>
          <span className="kpi-badge" style={{ background: '#54a0ff' }}>{role.toUpperCase()}</span>
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

        <div className="edit-grid-wrap">
          <div className="edit-grid">
            <div className="edit-grid-header">
              {fields.map(f => (
                <span key={f.key} className="edit-grid-th">{f.label}</span>
              ))}
              <span className="edit-grid-th"></span>
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
                    placeholder={f.key === 'pin' ? '----' : ''}
                  />
                ))}
                <button className="edit-remove" onClick={() => removePerson(idx)}>✕</button>
              </div>
            ))}
          </div>
        </div>

        <div className="edit-actions">
          <button className="edit-add" onClick={addPerson}>+ Agregar {tab === 'closers' ? 'Closer' : 'Setter'}</button>
          <button className="edit-save" onClick={handleSave}>💾 Guardar</button>
        </div>
      </div>
    </div>
  )
}
