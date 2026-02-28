import { useState } from 'react'
import Header from './components/Header'
import StatsBar from './components/StatsBar'
import Column from './components/Column'
import CloserKpi from './components/CloserKpi'
import SetterKpi from './components/SetterKpi'
import AuthGate from './components/AuthGate'
import EditModal from './components/EditModal'
import { defaultClosers, defaultSetters } from './data/defaults'

export default function App() {
  const [closers, setClosers] = useState(defaultClosers)
  const [setters, setSetters] = useState(defaultSetters)
  const [selected, setSelected] = useState(null) // { person, type }
  const [showAuth, setShowAuth] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [authRole, setAuthRole] = useState(null)
  const [tvMode, setTvMode] = useState(false)

  const handleEdit = () => setShowAuth(true)

  const handleAuth = (role) => {
    setAuthRole(role)
    setShowAuth(false)
    setShowEdit(true)
  }

  const handleSave = (newClosers, newSetters) => {
    setClosers(newClosers)
    setSetters(newSetters)
  }

  const handleSelect = (person, type) => {
    setSelected({ person, type })
  }

  const handleTv = () => setTvMode(!tvMode)

  return (
    <div className={`app ${tvMode ? 'tv-mode' : ''}`}>
      <Header onEdit={handleEdit} onTv={handleTv} tvMode={tvMode} />
      <StatsBar closers={closers} setters={setters} />

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

      {authRole && !tvMode && (
        <div className="footer-role">
          Sesión: <strong>{authRole}</strong>
        </div>
      )}

      {selected && selected.type === 'closers' && (
        <CloserKpi
          person={selected.person}
          onClose={() => setSelected(null)}
        />
      )}

      {selected && selected.type === 'setters' && (
        <SetterKpi
          person={selected.person}
          onClose={() => setSelected(null)}
        />
      )}

      {showAuth && (
        <AuthGate
          onAuth={handleAuth}
          onClose={() => setShowAuth(false)}
        />
      )}

      {showEdit && (
        <EditModal
          closers={closers}
          setters={setters}
          onSave={handleSave}
          onClose={() => setShowEdit(false)}
          role={authRole}
        />
      )}
    </div>
  )
}
