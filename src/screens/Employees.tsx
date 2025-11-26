import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'

type Worker = {
  id?: string
  name?: string
  email?: string
  vehicle?: { id?: string; plate?: string; model?: string }
}

export default function EmployeesScreen() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user) return null

  const defaultBase = 'https://baches-yucatan.onrender.com/api'
  const buildApiUrl = (path: string) => {
    const envBase = import.meta.env.VITE_BACKEND_URL ?? ''
    const base = envBase || defaultBase
    const p = path || '/assignments'
    const normalizedPath = p.startsWith('/') ? p : `/${p}`
    return `${String(base).replace(/\/$/, '')}${normalizedPath}`
  }

  // Build workers list from assignments: pick assignedTo from each assignment
  const loadWorkersFromAssignments = async () => {
    setLoading(true)
    setError(null)
    try {
      const headers: Record<string,string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(buildApiUrl('/assignments'), { headers })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(`Carga fallida: ${res.status} ${txt}`)
      }
      const data = await res.json().catch(() => null)
      const list = (data && (data.assignments || data.data || data)) || []
      const map = new Map<string, Worker>()
      ;(list as any[]).forEach(a => {
        const assigned = a.assignedTo || a.worker || a.user || null
        let workerId = assigned && (assigned.id || assigned._id) ? String(assigned.id || assigned._id) : (assigned && assigned.email ? String(assigned.email) : null)
        if (!workerId && assigned && typeof assigned === 'string') workerId = assigned
        if (!workerId) return
        const existing = map.get(workerId) || { id: workerId }
        if (assigned && typeof assigned !== 'string') {
          existing.name = assigned.name || existing.name
          existing.email = assigned.email || existing.email
        }
        // vehicle info may come as a.vehicle or a.assignedVehicle
        const vehicle = a.vehicle || a.assignedVehicle || a.vehicleInfo || null
        if (vehicle) {
          existing.vehicle = existing.vehicle || {}
          existing.vehicle.id = vehicle.id || vehicle._id || existing.vehicle.id
          existing.vehicle.plate = vehicle.plate || vehicle.licensePlate || vehicle.plateNumber || existing.vehicle.plate
          existing.vehicle.model = vehicle.model || vehicle.brand || existing.vehicle.model
        }
        map.set(workerId, existing)
      })
      setWorkers(Array.from(map.values()))
    } catch (e: any) {
      console.error('Error cargando workers desde asignaciones', e)
      setError(e && e.message ? String(e.message) : 'Error cargando trabajadores')
      setWorkers([])
    } finally { setLoading(false) }
  }

  useEffect(() => { loadWorkersFromAssignments() }, [token])

  return (
    <div style={{ padding: 16 }}>
      <h1>Trabajadores</h1>
      <div style={{ marginBottom: 12 }}>
        <button className="small" onClick={() => loadWorkersFromAssignments()}>Actualizar</button>
      </div>
      {loading && <p>Cargando...</p>}
      {error && <div style={{ color: 'var(--danger, #b91c1c)' }}>{error}</div>}
      <div>
        {workers.length === 0 && !loading && <p>No hay trabajadores con asignaciones.</p>}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {workers.map(w => (
            <li key={w.id || w.email} style={{ padding: 12, border: '1px solid #e6e9ee', borderRadius: 8, marginBottom: 8, background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{w.name || w.email || '—'}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{w.email || '—'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {w.vehicle ? (
                    <div style={{ fontSize: 12 }}>
                      <div>{w.vehicle.plate || '—'}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>{w.vehicle.model || ''}</div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#666' }}>Sin vehículo asignado</div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
