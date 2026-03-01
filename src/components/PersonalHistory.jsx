import { useState, useEffect } from 'react'
import { fetchPersonHistory } from '../utils/sheets'
import { formatMonthLabel } from '../utils/sheets'
import { closerSales, effectivenessColor } from '../utils/calculations'

export default function PersonalHistory({ personName, personType, onClose }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await fetchPersonHistory(personName, personType)
        if (!cancelled) {
          setHistory(data)
          setLoading(false)
        }
      } catch (err) {
        console.error('Error loading history:', err)
        if (!cancelled) {
          setError(true)
          setLoading(false)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [personName, personType])

  if (loading) {
    return (
      <div className="history-section">
        <p className="history-loading">Cargando historial...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="history-section">
        <h3>Mi Historial</h3>
        <p className="history-empty">No se pudo cargar el historial.</p>
      </div>
    )
  }

  if (history.length <= 1) {
    return (
      <div className="history-section">
        <h3>Mi Historial</h3>
        <p className="history-empty">Solo hay datos del mes actual.</p>
      </div>
    )
  }

  return (
    <div className="history-section">
      <h3>Mi Historial Mensual</h3>
      <div className="history-table-wrap">
        <table className="history-table">
          <thead>
            <tr>
              <th>Mes</th>
              {personType === 'closers' ? (
                <>
                  <th>Citas</th>
                  <th>Visitas</th>
                  <th>Aplic.</th>
                  <th>Aprob.</th>
                  <th>💰 Ventas</th>
                  <th>Canc.</th>
                </>
              ) : (
                <>
                  <th>Citas</th>
                  <th>Shows</th>
                  <th>Aplic.</th>
                  <th>Aprob.</th>
                  <th>💰 Ventas</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {history.map(({ month, data }) => {
              if (personType === 'closers') {
                return (
                  <tr key={month}>
                    <td>{formatMonthLabel(month)}</td>
                    <td className="history-val">{data.citasPropias}</td>
                    <td className="history-val">{data.visitasPropias}</td>
                    <td className="history-val">{data.aplicaron}</td>
                    <td className="history-val" style={{ color: effectivenessColor(data.aprobados ? (data.aprobados / (data.aplicaron || 1)) * 100 : 0) }}>
                      {data.aprobados}
                    </td>
                    <td className="history-val history-ventas">
                      <span className="ventas-total">{data.selfGen + data.callCenter}</span>
                      <span className="ventas-breakdown">{data.selfGen} self-gen<br/>{data.callCenter} others</span>
                    </td>
                    <td className="history-val" style={{ color: data.cancels ? '#ff9800' : undefined }}>{data.cancels}</td>
                  </tr>
                )
              } else {
                return (
                  <tr key={month}>
                    <td>{formatMonthLabel(month)}</td>
                    <td className="history-val">{data.citasAgendadas}</td>
                    <td className="history-val">{data.shows}</td>
                    <td className="history-val">{data.aplicaron}</td>
                    <td className="history-val" style={{ color: effectivenessColor(data.aprobados ? (data.aprobados / (data.aplicaron || 1)) * 100 : 0) }}>{data.aprobados}</td>
                    <td className="history-val">{data.ventas}</td>
                  </tr>
                )
              }
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
