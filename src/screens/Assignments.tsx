import { useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import './Assignments.css'

export default function AssignmentsScreen() {
  const { user } = useAuth()
  const navigate = useNavigate()
  if (!user) return null

  // Placeholder data for now
  const items = [] as { id: string; title: string; assignedTo?: string; due?: string }[]

  return (
    <div className="assignments-page">
      <h1>Asignaciones</h1>
      <div className="assignments-controls">
        <button className="small" onClick={() => navigate('/assignments/new')}>Nueva asignación</button>
      </div>

      <div className="assignment-list">
        {items.length === 0 && <p>No hay asignaciones aún.</p>}
        <ul>
          {items.map(it => (
            <li key={it.id} className="assignment-item">
              <div className="assignment-title">{it.title}</div>
              <div className="assignment-meta">{it.assignedTo || '—'} • {it.due || '—'}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
