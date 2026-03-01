import { useState, useEffect } from 'react'
import { submitDailyLog, fetchTodayEntry } from '../utils/dailyLog'

const CLOSER_FIELDS = [
  { key: 'VentasSelfGen', label: 'Ventas Self-Gen', step: 1 },
  { key: 'VentasOthers', label: 'Ventas Others', step: 1 },
  { key: 'CitasPropias', label: 'Citas Propias', step: 1 },
  { key: 'VisitasPropias', label: 'Visitas Propias (Sits)', step: 1 },
  { key: 'AplicaronPropias', label: 'Aplicaron Propias', step: 1 },
  { key: 'AplicaronOthers', label: 'Aplicaron Others', step: 1 },
  { key: 'AprobadosPropias', label: 'Aprobados Propias', step: 1 },
  { key: 'AprobadosOthers', label: 'Aprobados Others', step: 1 },
  { key: 'Cancelaciones', label: 'Cancelaciones', step: 1 },
]

const SETTER_FIELDS = [
  { key: 'LeadsAsignados', label: 'Leads Asignados', step: 1 },
  { key: 'Contactados', label: 'Contactados', step: 1 },
  { key: 'CitasAgendadas', label: 'Citas Agendadas', step: 1 },
  { key: 'Shows', label: 'Shows', step: 1 },
  { key: 'Ventas', label: 'Ventas', step: 0.5 },
  { key: 'Aplicaron', label: 'Aplicaron', step: 1 },
  { key: 'Aprobados', label: 'Aprobados', step: 1 },
  { key: 'Negados', label: 'Negados', step: 1 },
]

// Map daily log field keys to the person object keys for MTD context
const MTD_MAP_CLOSER = {
  VentasSelfGen: 'selfGen',
  VentasOthers: 'callCenter',
  CitasPropias: 'citasPropias',
  VisitasPropias: 'visitasPropias',
  AplicaronPropias: 'aplicaron',
  AplicaronOthers: 'aplicaron',
  AprobadosPropias: 'aprobados',
  AprobadosOthers: 'aprobados',
  Cancelaciones: 'cancels',
}

const MTD_MAP_SETTER = {
  LeadsAsignados: 'leadsAsignados',
  Contactados: 'contactados',
  CitasAgendadas: 'citasAgendadas',
  Shows: 'shows',
  Ventas: 'ventas',
  Aplicaron: 'aplicaron',
  Aprobados: 'aprobados',
  Negados: 'negados',
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDateLabel(dateStr) {
  const [y, m, d] = dateStr.split('-')
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`
}

function getWarnings(fields, values, personType) {
  const w = []
  if (personType === 'closer') {
    if (values.AprobadosPropias > values.AplicaronPropias && values.AplicaronPropias > 0) {
      w.push('Aprobados Propias es mayor que Aplicaron Propias')
    }
    if (values.AprobadosOthers > values.AplicaronOthers && values.AplicaronOthers > 0) {
      w.push('Aprobados Others es mayor que Aplicaron Others')
    }
  } else {
    if (values.Aprobados + values.Negados > values.Aplicaron && values.Aplicaron > 0) {
      w.push('Aprobados + Negados es mayor que Aplicaron')
    }
    if (values.Shows > values.CitasAgendadas && values.CitasAgendadas > 0) {
      w.push('Shows es mayor que Citas Agendadas')
    }
    if (values.CitasAgendadas > values.Contactados && values.Contactados > 0) {
      w.push('Citas Agendadas es mayor que Contactados')
    }
  }
  return w
}

export default function DailyLogModal({ personName, personType, personPin, personData, dailyLogUrl, onClose, onSuccess, adminPin, closers, setters }) {
  const isAdmin = !!adminPin
  const [selectedPerson, setSelectedPerson] = useState(
    isAdmin ? null : { name: personName, type: personType, pin: personPin }
  )
  const [date, setDate] = useState(todayStr())
  const [values, setValues] = useState({})
  const [step, setStep] = useState(isAdmin ? 'select' : 'form') // select | form | confirm | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('')
  const [loadingToday, setLoadingToday] = useState(false)
  const [alreadyLogged, setAlreadyLogged] = useState(false)

  const activeType = selectedPerson?.type || personType
  const fields = activeType === 'closer' ? CLOSER_FIELDS : SETTER_FIELDS
  const mtdMap = activeType === 'closer' ? MTD_MAP_CLOSER : MTD_MAP_SETTER

  // Find the MTD data for the selected person
  const mtdPerson = selectedPerson
    ? (activeType === 'closer'
        ? (closers || []).find(c => c.name === selectedPerson.name)
        : (setters || []).find(s => s.name === selectedPerson.name))
    : personData

  // Initialize values when person is selected
  useEffect(() => {
    if (!selectedPerson || step === 'confirm' || step === 'submitting' || step === 'success') return

    const initial = {}
    const f = selectedPerson.type === 'closer' ? CLOSER_FIELDS : SETTER_FIELDS
    f.forEach(field => { initial[field.key] = 0 })
    setValues(initial)

    // Try to fetch today's entry for pre-fill
    if (dailyLogUrl) {
      setLoadingToday(true)
      fetchTodayEntry(dailyLogUrl, selectedPerson.pin).then(entry => {
        if (entry) {
          setAlreadyLogged(true)
          const prefill = {}
          f.forEach(field => {
            prefill[field.key] = parseFloat(entry[field.key]) || 0
          })
          setValues(prefill)
        } else {
          setAlreadyLogged(false)
        }
        setLoadingToday(false)
      }).catch(() => setLoadingToday(false))
    }

    if (step === 'select') setStep('form')
  }, [selectedPerson]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateValue = (key, val) => {
    setValues(prev => ({ ...prev, [key]: val }))
  }

  const warnings = getWarnings(fields, values, activeType)

  const handleConfirm = () => setStep('confirm')

  const handleSubmit = async () => {
    if (!selectedPerson) return
    setStep('submitting')
    setErrorMsg('')

    const result = await submitDailyLog(dailyLogUrl, {
      pin: selectedPerson.pin,
      date,
      personType: selectedPerson.type,
      personName: selectedPerson.name,
      metrics: values,
      adminPin: isAdmin ? adminPin : undefined,
    })

    if (result.ok) {
      setStep('success')
      if (onSuccess) onSuccess()
    } else {
      setErrorMsg(result.error || 'Error desconocido')
      setStep('error')
    }
  }

  const handleBack = () => {
    if (step === 'confirm') setStep('form')
    else if (step === 'error') setStep('form')
  }

  // Admin person selector
  if (step === 'select') {
    const allPeople = [
      ...(closers || []).map(c => ({ ...c, type: 'closer' })),
      ...(setters || []).map(s => ({ ...s, type: 'setter' })),
    ]

    return (
      <div className="kpi-overlay" onClick={onClose}>
        <div className="daily-log-panel" onClick={e => e.stopPropagation()}>
          <button className="kpi-close" onClick={onClose}>✕</button>
          <h2 className="daily-log-title">Registrar Produccion</h2>
          <p className="daily-log-subtitle">Selecciona la persona:</p>
          <div className="daily-log-people-list">
            {allPeople.map(p => (
              <button
                key={p.pin}
                className="daily-log-person-btn"
                onClick={() => setSelectedPerson({ name: p.name, type: p.type, pin: p.pin })}
              >
                <span className={`daily-log-person-badge ${p.type}`}>
                  {p.type === 'closer' ? 'C' : 'S'}
                </span>
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Success screen
  if (step === 'success') {
    return (
      <div className="kpi-overlay" onClick={onClose}>
        <div className="daily-log-panel daily-log-success" onClick={e => e.stopPropagation()}>
          <h2 className="daily-log-title">Registrado</h2>
          <p className="daily-log-subtitle">
            {alreadyLogged ? 'Entrada actualizada' : 'Produccion registrada'} para {selectedPerson.name}
          </p>
          <p className="daily-log-date">{formatDateLabel(date)}</p>
          <button className="daily-log-btn" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    )
  }

  // Confirmation screen
  if (step === 'confirm') {
    return (
      <div className="kpi-overlay" onClick={onClose}>
        <div className="daily-log-panel" onClick={e => e.stopPropagation()}>
          <button className="kpi-close" onClick={onClose}>✕</button>
          <h2 className="daily-log-title">Confirmar Datos</h2>
          <p className="daily-log-subtitle">{selectedPerson.name} - {formatDateLabel(date)}</p>

          {alreadyLogged && (
            <div className="daily-log-warning-box">
              Ya registraste hoy. Esto reemplazara la entrada anterior.
            </div>
          )}

          <div className="daily-log-summary">
            {fields.map(f => (
              <div key={f.key} className="daily-log-summary-row">
                <span>{f.label}</span>
                <strong>{values[f.key]}</strong>
              </div>
            ))}
          </div>

          {warnings.length > 0 && (
            <div className="daily-log-warnings">
              {warnings.map((w, i) => (
                <div key={i} className="daily-log-warning">⚠ {w}</div>
              ))}
            </div>
          )}

          <div className="daily-log-actions">
            <button className="daily-log-btn-secondary" onClick={handleBack}>Corregir</button>
            <button className="daily-log-btn" onClick={handleSubmit}>Confirmar</button>
          </div>
        </div>
      </div>
    )
  }

  // Submitting
  if (step === 'submitting') {
    return (
      <div className="kpi-overlay">
        <div className="daily-log-panel" onClick={e => e.stopPropagation()}>
          <h2 className="daily-log-title">Enviando...</h2>
          <div className="daily-log-spinner" />
        </div>
      </div>
    )
  }

  // Error
  if (step === 'error') {
    return (
      <div className="kpi-overlay" onClick={onClose}>
        <div className="daily-log-panel" onClick={e => e.stopPropagation()}>
          <button className="kpi-close" onClick={onClose}>✕</button>
          <h2 className="daily-log-title" style={{ color: 'var(--bad)' }}>Error</h2>
          <p className="daily-log-subtitle">{errorMsg}</p>
          <button className="daily-log-btn-secondary" onClick={handleBack}>Reintentar</button>
        </div>
      </div>
    )
  }

  // Form screen
  return (
    <div className="kpi-overlay" onClick={onClose}>
      <div className="daily-log-panel" onClick={e => e.stopPropagation()}>
        <button className="kpi-close" onClick={onClose}>✕</button>

        <h2 className="daily-log-title">Registrar Produccion</h2>
        <p className="daily-log-subtitle">
          {selectedPerson.name}
          <span className={`kpi-badge ${activeType === 'closer' ? 'closers' : 'setters'}`} style={{ marginLeft: 8 }}>
            {activeType === 'closer' ? 'CLOSER' : 'SETTER'}
          </span>
        </p>

        <div className="daily-log-date-row">
          <label>Fecha:</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            max={todayStr()}
            className="daily-log-date-input"
          />
        </div>

        {alreadyLogged && (
          <div className="daily-log-warning-box">
            Ya existe un registro para hoy. Los valores se reemplazaran.
          </div>
        )}

        {loadingToday ? (
          <div className="daily-log-loading">Cargando datos del dia...</div>
        ) : (
          <div className="daily-log-fields">
            {fields.map(f => {
              const mtdVal = mtdPerson ? mtdPerson[mtdMap[f.key]] : null
              return (
                <div key={f.key} className="daily-log-field">
                  <label className="daily-log-field-label">{f.label}</label>
                  <div className="daily-log-field-input-wrap">
                    <input
                      type="number"
                      min="0"
                      step={f.step}
                      value={values[f.key] || 0}
                      onChange={e => updateValue(f.key, parseFloat(e.target.value) || 0)}
                      className="daily-log-field-input"
                    />
                    {mtdVal !== null && mtdVal !== undefined && (
                      <span className="daily-log-field-mtd">MTD: {mtdVal}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {warnings.length > 0 && (
          <div className="daily-log-warnings">
            {warnings.map((w, i) => (
              <div key={i} className="daily-log-warning">⚠ {w}</div>
            ))}
          </div>
        )}

        <button className="daily-log-btn" onClick={handleConfirm} disabled={loadingToday}>
          Revisar y Confirmar
        </button>
      </div>
    </div>
  )
}
