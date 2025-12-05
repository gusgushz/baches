import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { updateWorker, deleteWorker } from '../api'
import './Assignments.css'
import './Employees.css'
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
  const [workerDetail, setWorkerDetail] = useState<any | null>(null)
  const [editModeWorker, setEditModeWorker] = useState(false)
  const [creatingWorker, setCreatingWorker] = useState(false)
  const [editName, setEditName] = useState('')
  const [editSecondName, setEditSecondName] = useState<string | null>(null)
  const [editLastname, setEditLastname] = useState('')
  const [editSecondLastname, setEditSecondLastname] = useState<string | null>(null)
  const [editRole, setEditRole] = useState('')
  const [editEmail, setEditEmail] = useState<string | null>(null)
  const [editPhoneNumber, setEditPhoneNumber] = useState<string | number | null>(null)
  const [editFechaNacimiento, setEditFechaNacimiento] = useState<string | null>(null)
  const [editStatus, setEditStatus] = useState<string | null>(null)
  const [editPhotoUrl, setEditPhotoUrl] = useState<string | null>(null)
  const [editAssignedVehicleId, setEditAssignedVehicleId] = useState<string | null>(null)

  // Filtrado/Orden: 'all' | 'workerAZ' | 'vehicleAZ'
  const [filterBy, setFilterBy] = useState<'all'|'workerAZ'|'vehicleAZ'>('all')
  const [showFilterMenu, setShowFilterMenu] = useState(false)

  const renderVal = (v: any) => {
    if (v === null || v === undefined) return '—'
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v)
    if (Array.isArray(v)) return v.map(i => (typeof i === 'object' ? JSON.stringify(i) : String(i))).join(', ')
    try { return JSON.stringify(v) } catch { return String(v) }
  }

  // Initialize edit fields when workerDetail changes
  useEffect(() => {
    if (!workerDetail) {
      setEditModeWorker(false)
      setEditName('')
      setEditSecondName(null)
      setEditLastname('')
      setEditSecondLastname(null)
      setEditRole('')
      setEditEmail(null)
      setEditPhoneNumber(null)
      setEditFechaNacimiento(null)
      setEditStatus(null)
      setEditPhotoUrl(null)
      setEditAssignedVehicleId(null)
      return
    }
    setEditModeWorker(false)
    setEditName(workerDetail.name || '')
    setEditSecondName((workerDetail as any).secondName ?? null)
    setEditLastname((workerDetail as any).lastname || '')
    setEditSecondLastname((workerDetail as any).secondLastname ?? null)
    setEditRole(workerDetail.role || '')
    setEditEmail(workerDetail.email ?? null)
    setEditPhoneNumber((workerDetail as any).phoneNumber ?? null)
    setEditFechaNacimiento((workerDetail as any).fechaNacimiento ?? null)
    setEditStatus((workerDetail as any).status ?? null)
    setEditPhotoUrl((workerDetail as any).photoUrl ?? null)
    setEditAssignedVehicleId(workerDetail.assignedVehicleId ?? null)
  }, [workerDetail])

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
      try { console.debug('[Assignments] load start') } catch(e){}
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
      try { console.debug('[Assignments] loaded items', normalized.length) } catch(e){}
    } catch (e: any) {
      console.error('Error cargando asignaciones', e)
      setError(e && e.message ? String(e.message) : 'Error cargando asignaciones')
      // No limpiar `items` aquí para evitar que la UI parpadee si una recarga falla.
      try { console.debug('[Assignments] keeping previous items after load error') } catch (e) {}
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

  const handleCreate = async (payload: Partial<Assignment>) => {
    setSubmitting(true)

    try {
      // --- VALIDAR ---
      if (!(payload as any).assignedTo?.id && !(payload as any).workerId) {
        throw new Error("Debes seleccionar un trabajador")
      }

      const workerId =
        (payload as any).workerId ??
        (payload as any).assignedTo?.id

      const vehicleId =
        (payload as any).vehicleId ??
        (payload as any).vehicle?.id ??
        null

      // --- PAYLOAD COMPLETO Y CORRECTO ---
      const fullPayload = {
        workerId,               // requerido por DB
        vehicleId,              // opcional
        notes: (payload as any).notes ?? "",
        progressStatus: "not_started",
        priority: "medium",
        // Estos los rellena el backend (tienen default), no los mandamos:
        // assignedAt
        // completedAt
      }

      console.log("CREATING ASSIGNMENT →", fullPayload)

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      }
      if (token) headers.Authorization = `Bearer ${token}`

      const res = await fetch(buildApiUrl("/assignments"), {
        method: "POST",
        headers,
        body: JSON.stringify(fullPayload),
      })

      if (!res.ok) {
        let body = ""
        try { body = JSON.stringify(await res.json()) }
        catch { body = await res.text().catch(() => "") }
        throw new Error(`Crear falló: ${res.status} ${body}`)
      }

      await load()
      setCreating(false)

    } catch (e: any) {
      console.error("Error creando asignación", e)
      setError(e?.message ?? "No se pudo crear la asignación")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (id: string, payload: Partial<Assignment>) => {
    setSubmitting(true)
    try {
      const original = items.find(a => a.id === id)
      if (!original) throw new Error("Asignación no encontrada en memoria")

      // Reconstruir payload COMPLETO
      const fullPayload: any = {
        // worker asignado
        assignedWorkerId:
          (payload.assignedTo as any)?.id ??
          (original.assignedTo as any)?.id ??
          original.assignedTo,

        // vehículo asignado
        vehicleId:
          (payload.vehicle as any)?.id ??
          (original.vehicle as any)?.id ??
          null,

        // status
        status: payload.status ?? original.status,

        // metadatos importantes
        title: payload.title ?? original.title,
        description: payload.description ?? original.description,
        scheduledAt: payload.scheduledAt ?? original.scheduledAt,
        createdAt: original.createdAt,
        updatedAt: new Date().toISOString()
      }

      console.log("[Assignments] ENVIANDO FULL PAYLOAD:", fullPayload)

      const headers: Record<string,string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      }
      if (token) headers.Authorization = `Bearer ${token}`

      const res = await fetch(buildApiUrl(`/assignments/${id}`), {
        method: "PUT",
        headers,
        body: JSON.stringify(fullPayload),
      })

      if (!res.ok) {
        let body = ""
        try { body = JSON.stringify(await res.json()) }
        catch { body = await res.text().catch(()=> "") }
        throw new Error(`Actualizar falló: ${res.status} ${body}`)
      }

      await load()
      setSelected(prev => prev && prev.id === id ? { ...prev, ...payload } : prev)

    } catch (e: any) {
      console.error(e)
      setError(e?.message ?? "No se pudo actualizar")
    } finally {
      setSubmitting(false)
    }
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
    // First, try to resolve from vehiclesList if available
    if (vehiclesList && vehiclesList.length > 0) {
      const found = vehiclesList.find(v => {
        // check many possible shapes
        if (v.assignedWorkerId && String(v.assignedWorkerId) === String(wid)) return true
        const aw = v.assignedWorker || v.assignedTo || v.worker || null
        if (aw) {
          const aid = (aw.id || aw._id || aw.email)
          if (aid && String(aid) === String(wid)) return true
          if (aw.email && worker.email && String(aw.email) === String(worker.email)) return true
        }
        return false
      })
      if (found) return found
    }

    // Fallback: inspect current assignments (`items`) to find a vehicle assigned to this worker
    if (items && items.length > 0) {
      const assignment = items.find(a => {
        const asg: any = (a as any).assignedTo || null
        const awId = asg && (typeof asg === 'string' ? asg : (asg.id || asg._id || asg.email))
        if (!awId) return false
        if (String(awId) === String(wid)) return !!(a as any).vehicle
        return false
      })
      if (assignment && (assignment as any).vehicle) return (assignment as any).vehicle
    }
    return null
  }

  // Open worker detail: try to resolve a full worker object from `workersList`
  // or by refetching workers so the modal shows complete fields (email, phone, createdAt, etc.).
  const [loadingWorkerDetail, setLoadingWorkerDetail] = useState(false)

  const openWorkerDetail = async (workerObj: any | null, fallbackId: string, fallbackName?: string, fallbackRole?: string, fallbackPlate?: string) => {
    // quick early return if we already have rich data
    if (workerObj && (workerObj.email || workerObj.phoneNumber || workerObj.createdAt || workerObj.lastname || workerObj.rank)) {
      setWorkerDetail(workerObj)
      return
    }

    setLoadingWorkerDetail(true)
    try {
      const id = (workerObj && (workerObj.id || workerObj._id)) || fallbackId || null
      const candidates = [] as any[]
      if (id) candidates.push(String(id))
      if (workerObj && workerObj.email) candidates.push(String(workerObj.email))

      // Try direct GET endpoints for a single worker
      const endpoints = ['/workers', '/users', '/employees', '/people']
      for (const key of candidates) {
        for (const base of endpoints) {
          try {
            const url = buildApiUrl(`${base}/${encodeURIComponent(String(key))}`)
            const headers: Record<string,string> = { 'Content-Type': 'application/json' }
            if (token) headers['Authorization'] = `Bearer ${token}`
            const res = await fetch(url, { headers })
            if (!res.ok) continue
            const json = await res.json().catch(() => null)
            if (!json) continue
            // Try to find worker data in common shapes
            const candidate = json.worker || json.user || json.data || json || null
            if (!candidate) continue
            // normalize fields similar to getWorkers
            const normalized = {
              id: candidate.id || candidate._id || String(candidate.id || key),
              name: candidate.name || candidate.fullname || candidate.username || fallbackName || 'Sin nombre',
              role: candidate.role || candidate.position || fallbackRole || 'trabajador',
              email: candidate.email ?? null,
              lastname: candidate.lastname || candidate.lastName || candidate.last_name || candidate.surname || '',
              secondName: candidate.secondName || candidate.middleName || candidate.second_name || null,
              secondLastname: candidate.secondLastname || candidate.second_lastname || null,
              phoneNumber: candidate.phoneNumber ?? candidate.phone ?? candidate.phone_number ?? null,
              fechaNacimiento: candidate.fechaNacimiento || candidate.birthdate || candidate.birth_date || null,
              status: candidate.status || candidate.state || null,
              photoUrl: candidate.photoUrl || candidate.photo_url || candidate.avatar || null,
              assignedVehicleId: candidate.assignedVehicleId || candidate.vehicleId || fallbackPlate || null,
              createdAt: candidate.createdAt || candidate.created_at || null,
              // extra optional fields
              badgeNumber: candidate.badgeNumber || candidate.badge_number || candidate.badge || null,
              rank: candidate.rank || null,
              yearsOfService: candidate.yearsOfService ?? candidate.years_of_service ?? null,
              specialization: candidate.specialization || candidate.specialities || candidate.skills || null,
              languagesSpoken: candidate.languagesSpoken || candidate.languages || null,
              certifications: candidate.certifications || null,
              awards: candidate.awards || null,
              notes: candidate.notes || null,
            }
            setWorkerDetail(normalized)
            return
          } catch (e) {
            // ignore and try next
          }
        }
      }

      // If direct fetches failed, try to refresh the full list and search there
      try {
        const refreshed = await fetchWorkers()
        const keyCandidates = [] as string[]
        if (workerObj) {
          if (workerObj.id) keyCandidates.push(String(workerObj.id))
          if ((workerObj as any)._id) keyCandidates.push(String((workerObj as any)._id))
          if (workerObj.email) keyCandidates.push(String(workerObj.email))
        }
        if (fallbackId) keyCandidates.push(String(fallbackId))

        let found: any = null
        for (const c of keyCandidates) {
          if (!c) continue
          found = (refreshed || workersList || []).find(w => {
            const wid = w.id || w._id || w.email
            return wid && String(wid) === String(c)
          })
          if (found) break
        }
        if (found) { setWorkerDetail(found); return }
      } catch (e) {
        // ignore
      }

      // Fallback: show a minimal object with available info
      setWorkerDetail(workerObj || { id: fallbackId, name: fallbackName || '—', role: fallbackRole || 'Empleado', assignedVehicleId: fallbackPlate || null })
    } finally {
      setLoadingWorkerDetail(false)
    }
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
    <div className="assignments-page">
      <Header
        title="Asignaciones"
        centerSlot={
          <div style={{ position: 'relative', display: 'flex', gap: 8 }}>
            <button className="filter-btn" onClick={() => setShowFilterMenu(s => !s)}>
              {filterBy === 'all' ? 'Filtrar' : filterBy === 'workerAZ' ? 'Trabajador A-Z' : 'Vehículo A-Z'}
            </button>
            {showFilterMenu && (
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: '#fff', border: '1px solid #e6e9ee', padding: 8, borderRadius: 6, zIndex: 60 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button className="small" onClick={() => { setFilterBy('all'); setShowFilterMenu(false) }}>Todos</button>
                  <button className="small" onClick={() => { setFilterBy('workerAZ'); setShowFilterMenu(false) }}>Trabajador A-Z</button>
                  <button className="small" onClick={() => { setFilterBy('vehicleAZ'); setShowFilterMenu(false) }}>Vehículo A-Z</button>
                </div>
              </div>
            )}
          </div>
        }
        rightSlot={canManage ? <button className="add-btn" onClick={() => openCreate()}>+ Agregar</button> : null}
      />

      {loading && <p>Cargando asignaciones…</p>}
      {error && <div style={{ color: 'var(--danger, #b91c1c)' }}>{error}</div>}
      {/* Grid of employees who have vehicles assigned (built from vehiclesList) */}
      {/* Mensaje removido: la lista de asignaciones se mostrará usando `vehiclesList` o `items` como fallback */}
      <div className="assignments-grid">
        {(() => {
          const map = new Map<string, { role?: string; name?: string; plate?: string; assignmentSummary?: string; workerObj?: any }>()

          // First, try to build entries from vehiclesList when available
          if (vehiclesList && vehiclesList.length > 0) {
            ;(vehiclesList || []).forEach(v => {
              const aw = v.assignedWorker || v.assignedTo || v.worker || null
              const awId = v.assignedWorkerId || (aw && (aw.id || aw._id || aw.email))
              if (!awId) return

              // vehiclesList entries represent assigned vehicles (no skipping here)

              // try to resolve worker info from the assigned object or workersList
              let worker: any = null
              if (aw && typeof aw === 'object') worker = aw
              else worker = (workersList || []).find(w => {
                const wid = w.id || w._id || w.email
                return wid && String(wid) === String(awId)
              })

              // If no worker details, still create an entry using available awId
              const key = String((worker && (worker.id || worker._id || worker.email)) || awId)
              if (map.has(key)) return
              const name = (worker && (worker.name || worker.nombre || worker.email)) || (aw && (aw.name || aw.nombre || aw.email)) || '—'
              const role = (worker && worker.role) || (aw && aw.role) || 'Empleado'
              const plate = v.licensePlate || v.plate || v.plateNumber || ''
              const summary = plate ? `Vehículo: ${plate}` : ''
              map.set(key, { role, name, plate, assignmentSummary: summary, workerObj: worker || aw || null })
            })
          }

          // Always merge assignments (`items`) to ensure workers show even if vehiclesList mapping missed them
          ;(items || []).forEach(a => {
            const asg: any = (a as any).assignedTo || null
            const awId = asg && (typeof asg === 'string' ? asg : (asg.id || asg._id || asg.email))
            if (!awId) return
            const key = String(awId)
            if (map.has(key)) return
            const name = typeof asg === 'string' ? asg : (asg.name || asg.nombre || asg.email || '—')
            const role = (asg && asg.role) || 'Empleado'
            const plate = (a as any).vehicle ? ((a as any).vehicle.licensePlate || (a as any).vehicle.plate || '') : ''
            const summary = plate ? `Vehículo: ${plate}` : ''
            map.set(key, { role, name, plate, assignmentSummary: summary, workerObj: asg || null })
          })

          // Convert map to array and apply ordering according to `filterBy`
          const entries = Array.from(map.entries()).map(([k, v]) => ({ key: k, val: v }))
          if (filterBy === 'workerAZ') {
            entries.sort((a, b) => String(a.val.name || '').localeCompare(String(b.val.name || '')))
          } else if (filterBy === 'vehicleAZ') {
            entries.sort((a, b) => {
              const pa = String(a.val.plate || '')
              const pb = String(b.val.plate || '')
              if (!pa && !pb) return 0
              if (!pa) return 1
              if (!pb) return -1
              return pa.localeCompare(pb)
            })
          }

          return entries.map(e => (
            <div key={e.key} className="assignment-card">
              <div className="card-header">{e.val.role}</div>
              <div className="card-body">
                <div className="card-name">{e.val.name}</div>
                {e.val.plate && <div className="card-plate">{e.val.plate}</div>}
                <div style={{ marginTop: 12 }}>
                  <button className="small" onClick={async () => await openWorkerDetail(e.val.workerObj || null, e.key, e.val.name, e.val.role, e.val.plate)}>Ver mas</button>
                </div>
              </div>
            </div>
          ))
        })()}
      </div>

      {workerDetail && (
        <div className="modal-overlay" onClick={() => { setWorkerDetail(null); setEditModeWorker(false); setCreatingWorker(false) }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            {(!editModeWorker && !creatingWorker) ? (
              <>
                {loadingWorkerDetail ? (
                  <div style={{ padding: 16, textAlign: 'center' }}>Cargando datos…</div>
                ) : (
                  typeof workerDetail.photoUrl === 'string' && workerDetail.photoUrl.trim() !== '' && (
                  <div style={{ textAlign: 'center', marginBottom: 8 }}>
                    <img src={workerDetail.photoUrl} alt={String(workerDetail.name || '')} style={{ maxWidth: 160, borderRadius: 8 }} />
                  </div>
                  )
                )}
                {!loadingWorkerDetail && (
                  <>
                    <h4>{[workerDetail.name, (workerDetail as any).secondName, (workerDetail as any).lastname, (workerDetail as any).secondLastname].filter(Boolean).join(' ')}</h4>
                    <p><strong>Rol:</strong> {renderVal(workerDetail.role)}</p>
                    <p><strong>Email:</strong> {renderVal(workerDetail.email)}</p>
                    <p><strong>Teléfono:</strong> {renderVal((workerDetail as any).phoneNumber)}</p>
                    <p><strong>Fecha de nacimiento:</strong> {((workerDetail as any).fechaNacimiento) ? (() => { try { return new Date((workerDetail as any).fechaNacimiento).toLocaleDateString() } catch { return renderVal((workerDetail as any).fechaNacimiento) } })() : '—'}</p>
                    <p><strong>Estado:</strong> {renderVal((workerDetail as any).status)}</p>
                    <p><strong>Asignación:</strong> {renderVal(workerDetail.assignedVehicleId) || '—'}</p>
                    <p><strong>ID:</strong> {renderVal(workerDetail.id)}</p>
                    <p className="muted"><strong>Creado:</strong> {renderVal(workerDetail.createdAt)}</p>

                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button className="card-button" onClick={() => setEditModeWorker(true)}>Actualizar</button>
                      <button className="danger-btn" onClick={async () => {
                        if (!confirm('¿Eliminar este trabajador?')) return
                        try {
                          if (!token) return alert('No autorizado')
                          await deleteWorker(workerDetail.id, token)
                          alert('Trabajador eliminado')
                          setWorkerDetail(null)
                        } catch (e: any) { alert(e?.message || 'Error al eliminar') }
                      }}>Eliminar</button>
                      <button className="close-btn" onClick={() => { setWorkerDetail(null); setEditModeWorker(false); setCreatingWorker(false) }}>Cerrar</button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <h4>{creatingWorker ? 'Agregar trabajador' : 'Editar trabajador'}</h4>
                <div className="modal-form">
                  <label>
                    Nombre
                    <input value={editName} onChange={e => setEditName(e.target.value)} />
                  </label>
                  <label>
                    Segundo nombre
                    <input value={editSecondName ?? ''} onChange={e => setEditSecondName(e.target.value || null)} />
                  </label>
                  <label>
                    Apellido
                    <input value={editLastname} onChange={e => setEditLastname(e.target.value)} />
                  </label>
                  <label>
                    Segundo apellido
                    <input value={editSecondLastname ?? ''} onChange={e => setEditSecondLastname(e.target.value || null)} />
                  </label>
                  <label>
                    Rol
                    <input value={editRole} onChange={e => setEditRole(e.target.value)} />
                  </label>
                  <label>
                    Email
                    <input value={editEmail ?? ''} onChange={e => setEditEmail(e.target.value || null)} />
                  </label>
                  <label>
                    Teléfono
                    <input value={editPhoneNumber ?? ''} onChange={e => setEditPhoneNumber(e.target.value || null)} />
                  </label>
                  <label>
                    Fecha de nacimiento
                    <input type="date" value={editFechaNacimiento ? editFechaNacimiento.split('T')[0] : ''} onChange={e => setEditFechaNacimiento(e.target.value || null)} />
                  </label>
                  <label>
                    Estado
                    <input value={editStatus ?? ''} onChange={e => setEditStatus(e.target.value || null)} />
                  </label>
                  <label>
                    Photo URL
                    <input value={editPhotoUrl ?? ''} onChange={e => setEditPhotoUrl(e.target.value || null)} />
                  </label>
                  <label>
                    Asignación (vehicle id)
                    <input value={editAssignedVehicleId ?? ''} onChange={e => setEditAssignedVehicleId(e.target.value || null)} />
                  </label>
                </div>

                <div className="modal-actions">
                  <>
                    <button className="card-button" onClick={async () => {
                      if (!workerDetail) return
                      try {
                        if (!token) return alert('No autorizado')
                        const payload = {
                          name: editName,
                          secondName: editSecondName,
                          lastname: editLastname,
                          secondLastname: editSecondLastname,
                          role: editRole,
                          email: editEmail,
                          phoneNumber: editPhoneNumber,
                          fechaNacimiento: editFechaNacimiento,
                          status: editStatus,
                          photoUrl: editPhotoUrl,
                          assignedVehicleId: editAssignedVehicleId,
                        }
                        const updated = await updateWorker(workerDetail.id, payload as any, token)
                        const updatedItem = (updated && (updated.data || updated.worker || updated)) || { ...workerDetail, ...payload }
                        setWorkerDetail({ ...(workerDetail || {}), ...updatedItem })
                        setEditModeWorker(false)
                        alert('Trabajador actualizado')
                      } catch (e: any) { alert(e?.message || 'No se pudo actualizar') }
                    }}>Guardar</button>
                    <button className="close-btn" onClick={() => setEditModeWorker(false)}>Cancelar</button>
                    <button className="danger-btn" onClick={async () => {
                      if (!workerDetail) return
                      if (!confirm('¿Eliminar este trabajador?')) return
                      try {
                        if (!token) return alert('No autorizado')
                        await deleteWorker(workerDetail.id, token)
                        alert('Trabajador eliminado')
                        setWorkerDetail(null)
                      } catch (e: any) { alert(e?.message || 'No se pudo eliminar') }
                    }}>Eliminar</button>
                  </>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
                          const isAssigned = !!assignedVeh
                          const isSelected = selectedWorker && (selectedWorker.id === (w.id || w._id) || selectedWorker.email === w.email)
                          return (
                            <div
                              key={w.id || w._id || w.email}
                              onClick={() => {
                                if (isAssigned) {
                                  alert('No puedes seleccionar a este trabajador porque ya tiene un vehículo asignado.')
                                  return
                                }
                                setSelectedWorker(w)
                                setSelectedVehicle(assignedVeh || null)
                              }}
                              style={{
                                padding: 8,
                                border: isSelected ? '2px solid #0b4ea2' : '1px solid #e6e9ee',
                                borderRadius: 6,
                                cursor: isAssigned ? 'not-allowed' : 'pointer',
                                opacity: isAssigned ? 0.6 : 1,
                                position: 'relative'
                              }}
                              aria-disabled={isAssigned}
                            >
                              <div style={{ fontWeight: 700 }}>{w.name || w.nombre || w.email}</div>
                              <div style={{ fontSize: 12, color: '#666' }}>{w.email || ''}{w.role ? ` · ${String(w.role)}` : ''}</div>
                              {assignedVeh ? (
                                <div style={{ marginTop: 6, fontSize: 12, color: '#0b4ea2' }}>Vehículo asignado: {assignedVeh.licensePlate || assignedVeh.plate || assignedVeh.plateNumber || '—'}</div>
                              ) : (
                                <div style={{ marginTop: 6, fontSize: 12, color: '#999' }}>Vehículo sin asignar</div>
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
                      // Prevent moving forward if the worker already has a vehicle assigned
                      if (role === 'worker') {
                        const assignedVeh = findAssignedVehicleFor(selectedWorker)
                        if (assignedVeh) {
                          alert('Este trabajador ya tiene un vehículo asignado. No puedes crear otra asignación para él.')
                          return
                        }
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
                    <button className="small" onClick={() => handleCreate({ assignedTo: selectedWorker, vehicle: selectedVehicle })} disabled={submitting}>{submitting ? 'Guardando…' : 'Crear'}</button>
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
