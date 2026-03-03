import { useState, useEffect, useCallback, useMemo } from 'react'
import Header from './components/Header'
import StatsBar from './components/StatsBar'
import Column from './components/Column'
import CloserKpi from './components/CloserKpi'
import SetterKpi from './components/SetterKpi'
import AuthGate from './components/AuthGate'
import EditModal from './components/EditModal'
import DailyLogModal from './components/DailyLogModal'
import ViewerGate from './components/ViewerGate'
import MonthSelector from './components/MonthSelector'
import { defaultClosers, defaultSetters, defaultViewerPin } from './data/defaults'
import { fetchMonthData, fetchConfig, fetchAvailableMonths, getCurrentMonth } from './utils/sheets'

const DEFAULT_ADMIN_PINS = {
  '1234': 'owner',
  '5678': 'manager',
  '0000': 'admin',
}


export default function App() {
  const [closers, setClosers] = useState(defaultClosers)
  const [setters, setSetters] = useState(defaultSetters)
  const [viewerPin, setViewerPin] = useState(defaultViewerPin)
  const [adminPins, setAdminPins] = useState(DEFAULT_ADMIN_PINS)
  const [authenticated, setAuthenticated] = useState(false)
  const [accessInfo, setAccessInfo] = useState(null)
  const [selected, setSelected] = useState(null)
  const [showAuth, setShowAuth] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [authRole, setAuthRole] = useState(null)
  const [tvMode, setTvMode] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth())
  const [availableMonths, setAvailableMonths] = useState([getCurrentMonth()])
  const [loading, setLoading] = useState(true)
  const [useSheets, setUseSheets] = useState(true)
  const [showDailyLog, setShowDailyLog] = useState(false)
  const [dailyLogUrl, setDailyLogUrl] = useState(null)

  const isCurrentMonth = currentMonth === getCurrentMonth()


  const loadData = useCallback(async (monthKey) => {
    setLoading(true)
    try {
      const data = await fetchMonthData(monthKey)
      if (data.closers && data.closers.length > 0) {
        setClosers(data.closers)
      } else if (monthKey === getCurrentMonth()) {
        setClosers(defaultClosers)
      } else {
        setClosers([])
      }
      if (data.setters && data.setters.length > 0) {
        setSetters(data.setters)
      } else if (monthKey === getCurrentMonth()) {
        setSetters(defaultSetters)
      } else {
        setSetters([])
      }
    } catch {
      if (monthKey === getCurrentMonth()) {
        setClosers(defaultClosers)
        setSetters(defaultSetters)
      }
      setUseSheets(false)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    async function init() {
      try {
        const [config, months] = await Promise.all([
          fetchConfig(),
          fetchAvailableMonths(),
        ])
        if (config) {
          if (config.ViewerPIN) setViewerPin(config.ViewerPIN)
          if (config.DailyLogURL) setDailyLogUrl(config.DailyLogURL)
          // Build admin PINs from config, replacing defaults entirely
          const newPins = {}
          if (config.AdminPIN_owner) newPins[config.AdminPIN_owner] = 'owner'
          if (config.AdminPIN_manager) newPins[config.AdminPIN_manager] = 'manager'
          if (config.AdminPIN_admin) newPins[config.AdminPIN_admin] = 'admin'
          if (Object.keys(newPins).length > 0) {
            setAdminPins(newPins)
          }
        }
        if (months.length > 0) {
          setAvailableMonths(months)
        }
        await loadData(getCurrentMonth())
      } catch {
        setUseSheets(false)
        setLoading(false)
      }
    }
    init()
  }, [loadData])

  // Auto-refresh every 60 seconds for current month
  useEffect(() => {
    if (!useSheets || currentMonth !== getCurrentMonth()) return
    const interval = setInterval(() => loadData(currentMonth), 60000)
    return () => clearInterval(interval)
  }, [useSheets, currentMonth, loadData])

  const handleMonthChange = async (monthKey) => {
    setCurrentMonth(monthKey)
    setSelected(null)
    await loadData(monthKey)
  }

  const canNavigateMonths = accessInfo?.type === 'admin'

  const handleAccess = (info) => {
    setAuthenticated(true)
    setAccessInfo(info)
    if (info.type === 'admin') {
      setAuthRole(info.role)
    }
  }

  const handleEdit = () => setShowAuth(true)

  const handleAuth = (role) => {
    setAuthRole(role)
    setShowAuth(false)
    setShowEdit(true)
  }

  const handleSave = (newClosers, newSetters, newViewerPin) => {
    setClosers(newClosers)
    setSetters(newSetters)
    setViewerPin(newViewerPin)
  }

  const handleSelect = (person, type) => {
    setSelected({ person, type })
  }

  const handleTv = () => setTvMode(!tvMode)

  const handleLogout = () => {
    setAuthenticated(false)
    setAccessInfo(null)
    setAuthRole(null)
    setSelected(null)
    setCurrentMonth(getCurrentMonth())
    loadData(getCurrentMonth())
  }

  if (!authenticated) {
    return (
      <ViewerGate
        viewerPin={viewerPin}
        closers={closers}
        setters={setters}
        adminPins={adminPins}
        onAccess={handleAccess}
      />
    )
  }

  return (
    <div className={`app ${tvMode ? 'tv-mode' : ''}`}>
      <Header
        onEdit={handleEdit}
        onTv={handleTv}
        tvMode={tvMode}
        currentMonth={currentMonth}
        isLive={isCurrentMonth}
      />

      {canNavigateMonths && !tvMode && (
        <MonthSelector
          months={availableMonths}
          current={currentMonth}
          onChange={handleMonthChange}
        />
      )}

      <StatsBar closers={closers} setters={setters} accessInfo={accessInfo} isCurrentMonth={isCurrentMonth} />

      {loading ? (
        <div className="loading-state">Cargando datos...</div>
      ) : (
        <main className="board">
          <Column
            type="closers"
            data={closers}
            onSelect={(p) => handleSelect(p, 'closers')}
          />
          <Column
            type="setters"
            data={setters}
            onSelect={(p) => handleSelect(p, 'setters')}
          />
        </main>
      )}

      {!tvMode && (
        <div className="footer-role">
          {accessInfo?.type === 'admin' && <>Sesión: <strong>{authRole}</strong> · </>}
          {accessInfo?.type === 'individual' && <>Hola, <strong>{accessInfo.name}</strong> · </>}
          {!isCurrentMonth && <span className="viewing-past">Viendo: {currentMonth} · </span>}
          {dailyLogUrl && isCurrentMonth && (accessInfo?.type === 'individual' || accessInfo?.type === 'admin') && (
            <button className="btn-daily-log" onClick={() => setShowDailyLog(true)}>Registrar Produccion</button>
          )}
          {dailyLogUrl && isCurrentMonth && (accessInfo?.type === 'individual' || accessInfo?.type === 'admin') && ' · '}
          <button className="btn-logout" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      )}

      {selected && selected.type === 'closers' && (
        <CloserKpi
          person={selected.person}
          onClose={() => setSelected(null)}
          accessInfo={accessInfo}
        />
      )}

      {selected && selected.type === 'setters' && (
        <SetterKpi
          person={selected.person}
          onClose={() => setSelected(null)}
          accessInfo={accessInfo}
        />
      )}

      {showAuth && (
        <AuthGate
          onAuth={handleAuth}
          onClose={() => setShowAuth(false)}
          adminPins={adminPins}
        />
      )}

      {showEdit && (
        <EditModal
          closers={closers}
          setters={setters}
          viewerPin={viewerPin}
          onSave={handleSave}
          onClose={() => setShowEdit(false)}
          role={authRole}
        />
      )}

      {showDailyLog && dailyLogUrl && (
        <DailyLogModal
          personName={accessInfo?.name}
          personType={accessInfo?.personType}
          personPin={accessInfo?.pin}
          personData={
            accessInfo?.personType === 'closer'
              ? closers.find(c => c.name === accessInfo.name)
              : setters.find(s => s.name === accessInfo.name)
          }
          dailyLogUrl={dailyLogUrl}
          onClose={() => setShowDailyLog(false)}
          onSuccess={() => loadData(currentMonth)}
          adminPin={accessInfo?.type === 'admin' ? accessInfo.pin : undefined}
          closers={closers}
          setters={setters}
        />
      )}
    </div>
  )
}
