import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './Assignments.css'
import Header from '../components/Header'

type Assignment = {
  id: string
  title?: string
  description?: string
  status?: string
  // normalized field: may come from `assignedWorker`, `worker`, `assignedTo`, etc.
  assignedTo?: { id?: string; name?: string; lastname?: string; email?: string } | string
  // optional vehicle info
  vehicle?: { id?: string; plate?: string; licensePlate?: string; model?: string } | null
  scheduledAt?: string
  createdAt?: string
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleString() } catch { return iso }
}

export default function AssignmentsScreen() {
  const { user, token } = useAuth()
  const [items, setItems] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Assignment | null>(null)
  const [creating, setCreating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // create flow state
  const [createStep, setCreateStep] = useState<'selectWorker'|'selectVehicle'|'confirm'>('selectWorker')
  const [workersList, setWorkersList] = useState<Array<any>>([])
  const [vehiclesList, setVehiclesList] = useState<Array<any>>([])
  const [selectedWorker, setSelectedWorker] = useState<any | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null)
  const [createLoadingWorkers, setCreateLoadingWorkers] = useState(false)
  const [createLoadingVehicles, setCreateLoadingVehicles] = useState(false)

  if (!user) return null

  const isSupervisor = String(user.role || '').toLowerCase() === 'supervisor'
  const isAdmin = String(user.role || '').toLowerCase() === 'admin'
  const canManage = isSupervisor || isAdmin

  const defaultBase = 'https://baches-yucatan.onrender.com/api'
  const buildApiUrl = (path: string) => {
    const envBase = import.meta.env.VITE_BACKEND_URL ?? ''
    const base = envBase || defaultBase
    const p = path || '/assignments'
    const normalizedPath = p.startsWith('/') ? p : `/${p}`
    return `${String(base).replace(/\/$/, '')}${normalizedPath}`
  }

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const headers: Record<string,string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const endpoint = (String(user.role || '').toLowerCase() === 'worker') ? '/assignments/my' : '/assignments'
      const res = await fetch(buildApiUrl(endpoint), { headers })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(`Carga fallida: ${res.status} ${txt}`)
      }
      const data = await res.json().catch(() => null)
      const list = (data && (data.assignments || data.data || data)) || []
      const normalized: Assignment[] = (list as any[]).map(a => {
        // Try many possible shapes from the backend
        const assignedObj = a.assignedWorker || a.assignedTo || a.worker || a.user || null
        const assignedId = a.assignedWorkerId || a.assignedToId || a.workerId || a.userId || null
        const assigned = assignedObj || (assignedId ? { id: assignedId } : null)
        const vehicle = a.vehicle || a.assignedVehicle || a.vehicleInfo || (a.data && a.data.vehicle) || null
        return ({
          id: a.id || a._id,
          title: a.title || a.summary || a.description || '—',
          description: a.description || a.summary || '',
          status: a.status || 'pending',
          assignedTo: assigned ? (typeof assigned === 'string' ? assigned : { id: assigned.id || assigned._id || assignedId || undefined, name: assigned.name || assigned.nombre || undefined, lastname: assigned.lastname || assigned.lastName || assigned.apellido || undefined, email: assigned.email || undefined }) : undefined,
          vehicle: vehicle ? (typeof vehicle === 'string' ? { plate: vehicle } : { id: vehicle.id || vehicle._id || undefined, plate: vehicle.licensePlate || vehicle.plate || vehicle.plateNumber || undefined, model: vehicle.model || vehicle.brand || undefined }) : null,
          scheduledAt: a.scheduledAt || a.date || a.due || undefined,
          createdAt: a.createdAt || a.created || undefined,
        })
      })
      setItems(normalized)
    } catch (e: any) {
      console.error('Error cargando asignaciones', e)
      setError(e && e.message ? String(e.message) : 'Error cargando asignaciones')
      setItems([])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [user, token])
  // prefetch workers and vehicles so lists are available before the modal opens
  useEffect(() => {
    if (!user) return
    ;(async () => {
      try { await fetchWorkers() } catch {};
      try { await fetchVehicles() } catch {};
    })()
  }, [user, token])

  const handleCreate = async () => {
    setSubmitting(true)
    try {
      const headers: Record<string,string> = { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const payload: any = {}

      // attach selected worker identifier
      if (selectedWorker) {
        const id = (selectedWorker as any).id || (selectedWorker as any)._id || (typeof selectedWorker === 'string' ? selectedWorker : undefined)
        if (id) payload.assignedWorkerId = id
        else payload.assignedTo = selectedWorker
      }

      // attach selected vehicle identifier only if selected worker is a 'worker'
      const selRole = String((selectedWorker as any)?.role || '').toLowerCase()
      if (selRole === 'worker' && selectedVehicle) {
        const vid = (selectedVehicle as any).id || (selectedVehicle as any)._id || (selectedVehicle as any).vehicleId
        if (vid) payload.vehicleId = vid
        else if ((selectedVehicle as any).licensePlate) payload.vehicle = { licensePlate: (selectedVehicle as any).licensePlate }
        else payload.vehicle = selectedVehicle
      }

      // no title/description/scheduledAt per requested changes

      const res = await fetch(buildApiUrl('/assignments'), { method: 'POST', headers, body: JSON.stringify(payload) })
      if (!res.ok) {
        let body = ''
        try { const j = await res.json(); body = JSON.stringify(j) } catch { body = await res.text().catch(() => '') }
        throw new Error(`Crear falló: ${res.status} ${body}`)
      }

      await load()
      setCreating(false)
    } catch (e: any) {
      console.error(e)
      setError(e && e.message ? String(e.message) : 'No se pudo crear asignación')
    } finally { setSubmitting(false) }
  }

  const handleUpdate = async (id: string, payload: Partial<Assignment>) => {
    setSubmitting(true)
    try {
      const headers: Record<string,string> = { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(buildApiUrl(`/assignments/${id}`), { method: 'PUT', headers, body: JSON.stringify(payload) })
      if (!res.ok) {
        let body = ''
        try { const j = await res.json(); body = JSON.stringify(j) } catch { body = await res.text().catch(() => '') }
        throw new Error(`Actualizar falló: ${res.status} ${body}`)
      }
      await load()
      setSelected(prev => prev && prev.id === id ? { ...prev, ...(payload as any) } : prev)
    } catch (e: any) {
      console.error(e)
      setError(e && e.message ? String(e.message) : 'No se pudo actualizar')
    } finally { setSubmitting(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta asignación? Esta acción no se puede deshacer.')) return
    setSubmitting(true)
    try {
      const headers: Record<string,string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(buildApiUrl(`/assignments/${id}`), { method: 'DELETE', headers })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`Eliminar falló: ${res.status} ${text}`)
      }
      await load()
      setSelected(null)
    } catch (e: any) {
      console.error(e)
      setError(e && e.message ? String(e.message) : 'No se pudo eliminar')
    } finally { setSubmitting(false) }
  }

  // Fetch workers with fallbacks
  const fetchWorkers = async () => {
    try {
      const headers: Record<string,string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      setCreateLoadingWorkers(true)
      const candidates = ['/workers', '/users', '/employees', '/people']
      for (const p of candidates) {
        try {
          const res = await fetch(buildApiUrl(p), { headers })
          if (!res.ok) continue
          const data = await res.json().catch(() => null)
          const list = (data && (data.users || data.workers || data.data || data)) || []
          // filter only users with role 'worker'
          const onlyWorkers = Array.isArray(list) ? (list as any[]).filter(u => String((u && (u.role || u.tipo || u.type)) || '').toLowerCase() === 'worker') : []
          if (onlyWorkers.length > 0) { setWorkersList(onlyWorkers); return onlyWorkers }
        } catch (e) { /* ignore and try next */ }
      }
      // fallback: extract from loaded assignments
      const byKey = new Map<string, any>()
      items.forEach(a => {
        const asg = (a as any).assignedTo
        if (!asg) return
        const id = typeof asg === 'string' ? asg : (asg.id || asg._id || asg.email)
        if (!id) return
        if (!byKey.has(id)) byKey.set(String(id), typeof asg === 'string' ? { id: asg, name: asg } : asg)
      })
      const fallbackAll = Array.from(byKey.values())
      // filter fallback to role === 'worker' when possible
      const fallbackWorkers = fallbackAll.filter(u => String((u && (u.role || u.tipo || u.type)) || '').toLowerCase() === 'worker')
      setWorkersList(fallbackWorkers)
      return fallbackWorkers
    } catch (e) { console.error('fetchWorkers', e); setWorkersList([]); return [] }
    finally { setCreateLoadingWorkers(false) }
  }

  const fetchVehicles = async () => {
    try {
      const headers: Record<string,string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      setCreateLoadingVehicles(true)
      const res = await fetch(buildApiUrl('/vehicles'), { headers })
      if (!res.ok) { setVehiclesList([]); return [] }
      const data = await res.json().catch(() => null)
      const list = (data && (data.vehicles || data.data || data)) || []
      setVehiclesList(list)
      return list
    } catch (e) { console.error('fetchVehicles', e); setVehiclesList([]); return [] }
    finally { setCreateLoadingVehicles(false) }
  }

  const findAssignedVehicleFor = (worker: any) => {
    if (!worker) return null
    const wid = worker.id || worker._id || worker._id || worker.email
    if (!vehiclesList || vehiclesList.length === 0) return null
    return vehiclesList.find(v => {
      // check many possible shapes
      if (v.assignedWorkerId && String(v.assignedWorkerId) === String(wid)) return true
      const aw = v.assignedWorker || v.assignedTo || v.worker || null
      if (aw) {
        const aid = (aw.id || aw._id || aw.email)
        if (aid && String(aid) === String(wid)) return true
        if (aw.email && worker.email && String(aw.email) === String(worker.email)) return true
      }
      return false
    }) || null
  }

  const openCreate = async () => {
    setSelectedWorker(null)
    setSelectedVehicle(null)
    setCreateStep('selectWorker')
    setCreating(true)
    setCreateLoadingWorkers(true)
    setCreateLoadingVehicles(true)
    try { await fetchWorkers() } catch {}
    finally { setCreateLoadingWorkers(false) }
    try { await fetchVehicles() } catch {}
    finally { setCreateLoadingVehicles(false) }
  }

  return (
    <div className="page assignments-page">
      <Header
        title="Asignaciones"
        centerSlot={<span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Asignaciones</span>}
        centered={true}
      />

      {loading && <p>Cargando asignaciones…</p>}
      {error && <div style={{ color: 'var(--danger, #b91c1c)' }}>{error}</div>}
      {/* Grid of employees who have vehicles assigned (built from vehiclesList) */}
      {(!vehiclesList || vehiclesList.length === 0) && !loading && <p>No hay empleados con vehículos asignados.</p>}
      <div className="assignments-grid">
        {(() => {
          const map = new Map<string, { role?: string; name?: string; plate?: string; assignmentSummary?: string }>()
          ;(vehiclesList || []).forEach(v => {
            const aw = v.assignedWorker || v.assignedTo || v.worker || null
            const awId = v.assignedWorkerId || (aw && (aw.id || aw._id || aw.email))
            if (!awId) return

            // try to resolve worker info from the assigned object or workersList
            let worker: any = null
            if (aw && typeof aw === 'object') worker = aw
            else worker = (workersList || []).find(w => {
              const wid = w.id || w._id || w.email
              return wid && String(wid) === String(awId)
            })
            if (!worker) return

            const key = String(worker.id || worker._id || worker.email || awId)
            if (map.has(key)) return
            const name = worker.name || worker.nombre || worker.email || '—'
            const role = worker.role || 'Empleado'
            const plate = v.licensePlate || v.plate || v.plateNumber || ''
            const summary = `Vehículo: ${plate}`
            map.set(key, { role, name, plate, assignmentSummary: summary })
          })
          return Array.from(map.entries()).map(([k, v]) => (
            <div key={k} className="assignment-card">
              <div className="card-header">{v.role}</div>
              <div className="card-body">
                <div className="card-name">{v.name}</div>
                {v.plate && <div className="card-plate">{v.plate}</div>}
                <div style={{ marginTop: 12 }}>
                  <button className="small" onClick={() => {/* TODO: open details for this worker */}}>Ver mas</button>
                </div>
              </div>
            </div>
          ))
        })()}
      </div>

      {creating && (
        <div className="report-detail-modal" onClick={() => setCreating(false)}>
          <div className="report-detail-card" onClick={(e) => e.stopPropagation()}>
            <h3>Nueva asignación</h3>
                <div style={{ display: 'grid', gap: 8 }}>

                  {/* Step: select worker */}
                  {createStep === 'selectWorker' && (
                    <div>
                      <div style={{ marginBottom: 8, fontWeight: 600 }}>Selecciona un trabajador</div>
                      {createLoadingWorkers && <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>Cargando trabajadores…</div>}
                      {!createLoadingWorkers && workersList.length === 0 && <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>No se han encontrado trabajadores.</div>}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 8 }}>
                        {workersList.map((w:any) => {
                          const assignedVeh = findAssignedVehicleFor(w)
                          return (
                            <div key={w.id || w._id || w.email} onClick={() => { setSelectedWorker(w); setSelectedVehicle(assignedVeh || null) }} style={{ padding: 8, border: selectedWorker && (selectedWorker.id === (w.id || w._id) || selectedWorker.email === w.email) ? '2px solid #0b4ea2' : '1px solid #e6e9ee', borderRadius: 6, cursor: 'pointer' }}>
                              <div style={{ fontWeight: 700 }}>{w.name || w.nombre || w.email}</div>
                              <div style={{ fontSize: 12, color: '#666' }}>{w.email || ''}{w.role ? ` · ${String(w.role)}` : ''}</div>
                              {assignedVeh && (
                                <div style={{ marginTop: 6, fontSize: 12, color: '#0b4ea2' }}>Vehículo asignado: {assignedVeh.licensePlate || assignedVeh.plate || assignedVeh.plateNumber || '—'}</div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                      {/* manual ID/email input removed per request */}
                    </div>
                  )}

                  {/* Step: select vehicle */}
                  {createStep === 'selectVehicle' && (
                    <div>
                      <div style={{ marginBottom: 8, fontWeight: 600 }}>Selecciona un vehículo</div>
                      {createLoadingVehicles && <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>Cargando vehículos…</div>}
                      {!createLoadingVehicles && vehiclesList.length === 0 && <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>No hay vehículos disponibles.</div>}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 8 }}>
                        {vehiclesList.map((v:any) => (
                          <div key={v.id || v._id || v.licensePlate} onClick={() => setSelectedVehicle(v)} style={{ padding: 8, border: selectedVehicle && (selectedVehicle.id === (v.id || v._id) || selectedVehicle.licensePlate === v.licensePlate) ? '2px solid #0b4ea2' : '1px solid #e6e9ee', borderRadius: 6, cursor: 'pointer' }}>
                            <div style={{ fontWeight: 700 }}>{v.licensePlate || v.plate || v.plateNumber}</div>
                            <div style={{ fontSize: 12, color: '#666' }}>{v.model || v.brand || ''}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* scheduled date removed per request */}
                </div>

                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button className="small" onClick={() => setCreating(false)} disabled={submitting}>Cancelar</button>
                  {createStep === 'selectWorker' && (
                    <button className="small" onClick={async () => {
                      if (!selectedWorker) { await fetchWorkers(); return }
                      const role = String((selectedWorker as any).role || '').toLowerCase()
                      if (role === 'worker') {
                        setCreateStep('selectVehicle')
                        await fetchVehicles()
                      } else {
                        // Non-workers cannot have vehicles assigned, skip to confirm
                        setCreateStep('confirm')
                      }
                    }} disabled={submitting || !selectedWorker}>Siguiente</button>
                  )}
                  {createStep === 'selectVehicle' && (
                    <>
                      <button className="small" onClick={() => setCreateStep('selectWorker')} disabled={submitting}>Atrás</button>
                      <button className="small" onClick={() => setCreateStep('confirm')} disabled={submitting || !selectedVehicle}>Siguiente</button>
                    </>
                  )}
                  {createStep === 'confirm' && (
                    <button className="small" onClick={() => handleCreate()} disabled={submitting}>{submitting ? 'Guardando…' : 'Crear'}</button>
                  )}
                </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="report-detail-modal" onClick={() => setSelected(null)}>
          <div className="report-detail-card" onClick={(e) => e.stopPropagation()}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{selected.title}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{formatDate(selected.createdAt)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12 }}>{selected.status}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{typeof selected.assignedTo === 'string' ? selected.assignedTo : (selected.assignedTo?.name || selected.assignedTo?.email || '—')}</div>
              </div>
            </header>

            <div style={{ marginTop: 12 }}>
              <p style={{ margin: 0 }}>{selected.description}</p>
              {selected.scheduledAt && <div style={{ marginTop: 8 }}><strong>Programada:</strong> {formatDate(selected.scheduledAt)}</div>}
            </div>

            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="small" onClick={() => setSelected(null)}>Cerrar</button>
              {/* Worker actions */}
              {String(user.role || '').toLowerCase() === 'worker' && (
                <>
                  {selected.status !== 'in_progress' && <button className="small" onClick={async () => await handleUpdate(selected.id, { status: 'in_progress' })}>Marcar en progreso</button>}
                  {selected.status !== 'completed' && <button className="small" onClick={async () => await handleUpdate(selected.id, { status: 'completed' })}>Marcar completada</button>}
                </>
              )}

              {/* Admin/Supervisor actions */}
              {canManage && (
                <>
                  <button className="small" onClick={async () => {
                    const next = selected.status === 'pending' ? 'in_progress' : selected.status === 'in_progress' ? 'completed' : 'pending'
                    await handleUpdate(selected.id, { status: next })
                  }}>Cambiar estado</button>
                  {selected.status !== 'in_progress' && <button className="small" onClick={async () => await handleDelete(selected.id)}>Eliminar</button>}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
