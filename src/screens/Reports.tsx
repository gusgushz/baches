import { useCallback, useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './Reports.css'
import { useAuth } from '../contexts/AuthContext'
import Header from '../components/Header';

type Location = { lat: number; lng: number }

type DetailedReport = {
  id: string
  description?: string
  severity?: string
  status?: string
  comments?: string
  street?: string
  neighborhood?: string
  city?: string
  state?: string
  postalCode?: string
  images?: string[]
  location?: Location | null
  // optional relations that may come from the API
  reportedByVehicle?: {
    id?: string
    licensePlate?: string
    plate?: string
    model?: string
    brand?: string
  }
  reportedByWorker?: {
    id?: string
    name?: string
    lastname?: string
    email?: string
  }
  createdAt?: string
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch (e) {
    return iso
  }
}

function normalizeSeverity(raw?: string): 'low' | 'medium' | 'high' | null {
  if (!raw) return null
  const v = String(raw).trim().toLowerCase()
  if (v === 'low' || v === 'l') return 'low'
  if (v === 'medium' || v === 'med' || v === 'm') return 'medium'
  if (v === 'high' || v === 'h') return 'high'
  if (v === 'baja' || v === 'b' || v === 'bajo') return 'low'
  if (v === 'media' || v === 'm') return 'medium'
  if (v === 'alta' || v === 'a' || v === 'alto') return 'high'
  if (v.includes('low') || v.includes('baj')) return 'low'
  if (v.includes('med')) return 'medium'
  if (v.includes('high') || v.includes('alt')) return 'high'
  return null
}

function mapStatus(s?: string) {
  if (!s) return '—'
  const key = String(s).trim().toLowerCase()
  switch (key) {
    case 'reported':
      return 'Reportado'
    case 'in_progress':
      return 'En progreso'
    case 'completed':
      return 'Completado'
    case 'on_hold':
      return 'En pausa'
    case 'resolved':
      return 'Resuelto'
    default:
      return key.replace(/_/g, ' ')
  }
}

function severityRank(s?: string) {
  const norm = normalizeSeverity(s)
  if (norm === 'low') return 1
  if (norm === 'medium') return 2
  if (norm === 'high') return 3
  return 2
}

function mapSeverity(s?: string) {
  const norm = normalizeSeverity(s)
  switch (norm) {
    case 'low':
      return 'Baja'
    case 'medium':
      return 'Media'
    case 'high':
      return 'Alta'
    default:
      return '—'
  }
}

function ReportList({ reports, onDelete, onSelect, onEdit }: { reports: DetailedReport[]; onDelete?: (id: string) => Promise<void>; onSelect?: (r: DetailedReport) => void; onEdit?: (id: string, payload: Partial<DetailedReport>) => Promise<void> }) {
  const [preview, setPreview] = useState<string | null>(null)
  const [detailReport, setDetailReport] = useState<DetailedReport | null>(null)
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('date_desc')
  const { user } = useAuth()
  const isSupervisor = String(user?.role || '').toLowerCase() === 'supervisor'
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<DetailedReport> | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string,string>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function isoToInputDatetime(iso?: string) {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      const off = d.getTimezoneOffset()
      const local = new Date(d.getTime() - off * 60000)
      return local.toISOString().slice(0,16)
    } catch (e) { return '' }
  }

  function inputDatetimeToIso(val: string) {
    if (!val) return undefined
    try {
      const d = new Date(val)
      return d.toISOString()
    } catch (e) { return undefined }
  }

  const filtered = reports.filter(r => {
    if (filterSeverity === 'all') return true
    const candidate = r.severity || r.status || ''
    const norm = normalizeSeverity(candidate)
    return norm === filterSeverity
  })

  const displayed = filtered.slice().sort((a, b) => {
    switch (sortBy) {
      case 'date_asc':
        return (new Date(a.createdAt || 0).getTime() || 0) - (new Date(b.createdAt || 0).getTime() || 0)
      case 'date_desc':
        return (new Date(b.createdAt || 0).getTime() || 0) - (new Date(a.createdAt || 0).getTime() || 0)
      case 'alpha_asc':
        return String(a.description || '').localeCompare(String(b.description || ''))
      case 'alpha_desc':
        return String(b.description || '').localeCompare(String(a.description || ''))
      case 'worker_asc': {
        const an = ((a.reportedByWorker?.name || '') + ' ' + (a.reportedByWorker?.lastname || '')).trim()
        const bn = ((b.reportedByWorker?.name || '') + ' ' + (b.reportedByWorker?.lastname || '')).trim()
        return an.localeCompare(bn)
      }
      case 'worker_desc': {
        const an = ((a.reportedByWorker?.name || '') + ' ' + (a.reportedByWorker?.lastname || '')).trim()
        const bn = ((b.reportedByWorker?.name || '') + ' ' + (b.reportedByWorker?.lastname || '')).trim()
        return bn.localeCompare(an)
      }
      case 'vehicle_asc': {
        const av = (a.reportedByVehicle?.licensePlate || a.reportedByVehicle?.plate || '').toString()
        const bv = (b.reportedByVehicle?.licensePlate || b.reportedByVehicle?.plate || '').toString()
        return av.localeCompare(bv)
      }
      case 'vehicle_desc': {
        const av = (a.reportedByVehicle?.licensePlate || a.reportedByVehicle?.plate || '').toString()
        const bv = (b.reportedByVehicle?.licensePlate || b.reportedByVehicle?.plate || '').toString()
        return bv.localeCompare(av)
      }
      case 'severity_asc':
        return severityRank(a.severity) - severityRank(b.severity)
      case 'severity_desc':
        return severityRank(b.severity) - severityRank(a.severity)
      default:
        return 0
    }
  })

  return (
    <div className="report-list">
      <h2>Reportes ({reports.length})</h2>

      <div className="report-controls" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <small>Filtrar:</small>
          <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
            <option value="all">Todos</option>
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <small>Orden:</small>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="date_desc">Fecha (más recientes)</option>
            <option value="date_asc">Fecha (más antiguos)</option>
            <option value="alpha_asc">A → Z (descripción)</option>
            <option value="alpha_desc">Z → A (descripción)</option>
              <option value="worker_asc">Trabajador A → Z</option>
              <option value="worker_desc">Trabajador Z → A</option>
              <option value="vehicle_asc">Vehículo 0 → 9 (placa)</option>
              <option value="vehicle_desc">Vehículo 9 → 0 (placa)</option>
            <option value="severity_desc">Severidad (Alta → Baja)</option>
            <option value="severity_asc">Severidad (Baja → Alta)</option>
          </select>
        </label>
      </div>

      {reports.length === 0 && <p>No hay reportes aún.</p>}

      <ul>
        {displayed.map((r) => (
          <li key={r.id} className={`report-item ${r.severity || ''}`} style={{ cursor: onSelect ? 'pointer' : 'default' }} onClick={() => onSelect && onSelect(r)}>
            <div className="meta">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <small style={{ color: 'var(--muted)', fontSize: 12 }}>Severidad:</small>
                  <strong>{mapSeverity(r.severity)}</strong>
                </div>
                <span className={`status-badge ${r.status || ''}`}>{mapStatus(r.status)}</span>
              </div>
              <time>{formatDate(r.createdAt)}</time>
            </div>

            <p className="desc">{String(r.description || '').length > 140 ? String(r.description || '').slice(0, 140) + '…' : r.description}</p>

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="small" onClick={(e) => { e.stopPropagation(); setDetailReport(r) }}>Ver más</button>
            </div>
          </li>
        ))}
      </ul>

      {preview && (
        <div className="image-modal" onClick={() => setPreview(null)}>
          <img src={preview} alt="preview large" />
        </div>
      )}

      {detailReport && (
        <div className="report-detail-modal" onClick={() => setDetailReport(null)}>
          <div className="report-detail-card" onClick={(e) => e.stopPropagation()}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <small style={{ color: 'var(--muted)' }}>Severidad:</small>
                <div style={{ fontWeight: 700 }}>{mapSeverity(detailReport.severity)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className={`status-badge ${detailReport.status || ''}`} style={{ fontSize: 12 }}>{mapStatus(detailReport.status)}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{formatDate(detailReport.createdAt)}</div>
              </div>
            </header>

            <div style={{ marginTop: 12 }}>
              {!isEditing && (
                <>
                  <p style={{ margin: 0 }}>{detailReport.description}</p>
                  {detailReport.comments && <div style={{ marginTop: 8 }}><strong>Comentarios:</strong> {detailReport.comments}</div>}

                  {(detailReport.street || detailReport.neighborhood || detailReport.city || detailReport.state || detailReport.postalCode) && (
                    <div className="address" style={{ marginTop: 8 }}>
                      <strong>Dirección:</strong>
                      <div>{detailReport.street || ''}{detailReport.street && detailReport.neighborhood ? ', ' : ''}{detailReport.neighborhood || ''}</div>
                      <div>{detailReport.city || ''}{detailReport.city && detailReport.state ? ', ' : ''}{detailReport.state || ''} {detailReport.postalCode || ''}</div>
                    </div>
                  )}

                  {detailReport.location && (
                    <div className="location" style={{ marginTop: 8 }}>Ubicación: {detailReport.location.lat}, {detailReport.location.lng}</div>
                  )}

                  {detailReport.reportedByVehicle && (
                    <div className="reported-by-vehicle" style={{marginTop:8}}>
                      <strong>Reportado por vehículo:</strong>
                      <div>
                        {detailReport.reportedByVehicle.licensePlate || detailReport.reportedByVehicle.plate || ''} {detailReport.reportedByVehicle.model ? `— ${detailReport.reportedByVehicle.model}` : ''}
                      </div>
                    </div>
                  )}

                  {detailReport.reportedByWorker && (
                    <div className="reported-by-worker" style={{marginTop:8}}>
                      <strong>Reportado por trabajador:</strong>
                      <div>
                        {((detailReport.reportedByWorker.name || '') + (detailReport.reportedByWorker.lastname ? ' ' + detailReport.reportedByWorker.lastname : '')).trim() || detailReport.reportedByWorker.email || '—'}
                      </div>
                      {detailReport.reportedByWorker.email && <div style={{fontSize:12,color:'#666'}}>{detailReport.reportedByWorker.email}</div>}
                    </div>
                  )}

                  {detailReport.images && detailReport.images.length > 0 && (
                    <div className="image-row" style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {detailReport.images.map((img, idx) => (
                        <div key={idx} className="photo-thumb" style={{ cursor: 'pointer' }}>
                          <img src={img} alt={`foto-${idx}`} onClick={() => setPreview(img || null)} />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {isEditing && editData && (
                <form onSubmit={async (e) => {
                  e.preventDefault()
                  setFormErrors({})
                  setSuccessMessage(null)
                  setErrorMessage(null)
                  if (!onEdit || !detailReport) return
                  setSubmitting(true)
                  // Validations
                  const errs: Record<string,string> = {}
                  if (!editData.description || String(editData.description).trim().length === 0) errs.description = 'La descripción es requerida.'
                  const sev = String(editData.severity || '').toLowerCase()
                  if (!['low','medium','high'].includes(sev)) errs.severity = 'Selecciona una severidad válida.'
                  const st = String(editData.status || '')
                  if (!st) errs.status = 'Selecciona un estado.'
                  if (editData.postalCode && !/^[0-9\- ]{3,10}$/.test(String(editData.postalCode))) errs.postalCode = 'Código postal inválido.'
                  if (editData.createdAt) {
                    const d = new Date(String(editData.createdAt))
                    if (isNaN(d.getTime())) errs.createdAt = 'Fecha inválida.'
                  }
                  if (Object.keys(errs).length > 0) { setFormErrors(errs); return }

                  try {
                    await onEdit(detailReport.id, editData)
                    setSuccessMessage('Reporte actualizado correctamente.')
                    // update modal detail with local changes
                    setDetailReport(prev => prev ? { ...prev, ...(editData || {}) } : prev)
                    setIsEditing(false)
                    setTimeout(() => setSuccessMessage(null), 3500)
                  } catch (err: unknown) {
                    console.error(err)
                    const msg = (err as Error)?.message ? String((err as Error).message) : 'No se pudo actualizar el reporte. Intenta de nuevo.'
                    setErrorMessage(msg)
                    setTimeout(() => setErrorMessage(null), 7000)
                  }
                  finally {
                    setSubmitting(false)
                  }
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                    <label>
                      Descripción
                      <textarea value={String(editData.description || '')} onChange={e => setEditData({ ...editData, description: e.target.value })} rows={4} style={{ width: '100%', padding: 8 }} />
                      {formErrors.description && <div className="form-error">{formErrors.description}</div>}
                    </label>

                    <label>
                      Severidad
                      <select value={String(editData.severity || '')} onChange={e => setEditData({ ...editData, severity: e.target.value })}>
                        <option value="low">Baja</option>
                        <option value="medium">Media</option>
                        <option value="high">Alta</option>
                      </select>
                      {formErrors.severity && <div className="form-error">{formErrors.severity}</div>}
                    </label>

                    <label>
                      Estado
                      <select value={String(editData.status || '')} onChange={e => setEditData({ ...editData, status: e.target.value })}>
                        <option value="reported">Reportado</option>
                        <option value="in_progress">En progreso</option>
                        <option value="completed">Completado</option>
                        <option value="resolved">Resuelto</option>
                        <option value="on_hold">En pausa</option>
                      </select>
                      {formErrors.status && <div className="form-error">{formErrors.status}</div>}
                    </label>

                    <label>
                      Comentarios
                      <input value={String(editData.comments || '')} onChange={e => setEditData({ ...editData, comments: e.target.value })} style={{ width: '100%', padding: 8 }} />
                    </label>

                    <label>
                      Calle
                      <input value={String(editData.street || '')} onChange={e => setEditData({ ...editData, street: e.target.value })} style={{ width: '100%', padding: 8 }} />
                    </label>

                    <label>
                      Colonia
                      <input value={String(editData.neighborhood || '')} onChange={e => setEditData({ ...editData, neighborhood: e.target.value })} style={{ width: '100%', padding: 8 }} />
                    </label>

                    <label style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        Ciudad
                        <input value={String(editData.city || '')} onChange={e => setEditData({ ...editData, city: e.target.value })} style={{ width: '100%', padding: 8 }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        Estado
                        <input value={String(editData.state || '')} onChange={e => setEditData({ ...editData, state: e.target.value })} style={{ width: '100%', padding: 8 }} />
                      </div>
                    </label>

                    <label>
                      Código postal
                      <input value={String(editData.postalCode || '')} onChange={e => setEditData({ ...editData, postalCode: e.target.value })} style={{ width: '100%', padding: 8 }} />
                      {formErrors.postalCode && <div className="form-error">{formErrors.postalCode}</div>}
                    </label>
                    <label>
                      Fecha
                      <input type="datetime-local" value={isoToInputDatetime(String(editData.createdAt || ''))} onChange={e => setEditData({ ...editData, createdAt: inputDatetimeToIso(e.target.value) })} style={{ width: '100%', padding: 8 }} />
                      {formErrors.createdAt && <div className="form-error">{formErrors.createdAt}</div>}
                    </label>
                  </div>

                  {successMessage && <div className="form-message success">{successMessage}</div>}
                  {errorMessage && <div className="form-message error">{errorMessage}</div>}
                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button type="button" className="small" onClick={() => { setIsEditing(false); setFormErrors({}); setErrorMessage(null); setSuccessMessage(null); }} disabled={submitting}>Cancelar</button>
                    <button type="submit" className="small" disabled={submitting}>{submitting ? 'Guardando...' : 'Guardar'}</button>
                  </div>
                </form>
              )}
            </div>

            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="small" onClick={() => setDetailReport(null)}>Cerrar</button>
              <button className="small" onClick={() => { setIsEditing(true); setEditData(detailReport) }}>Editar</button>
                  {onDelete && !isSupervisor && (
                    <button className="small" onClick={async () => { if (!confirm('¿Eliminar este reporte? Esta acción no se puede deshacer.')) return; await onDelete(detailReport.id); setDetailReport(null) }}>Eliminar</button>
                  )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Map controller: pans the map and opens a popup when a report is selected
function MapController({ selected }: { selected: DetailedReport | null }) {
  const map = useMap()
  useEffect(() => {
    if (!selected || !selected.location) {
      try { map.closePopup() } catch (e) { /* ignore */ }
      return
    }
    const lat = selected.location.lat
    const lng = selected.location.lng
    try {
      map.flyTo([lat, lng], 15, { duration: 0.6 })
      const html = `<div style="min-width:200px"><strong>${mapSeverity(selected.severity)}</strong><div>${String(selected.description || '')}</div><div style="font-size:12px;color:#666">${formatDate(selected.createdAt)}</div></div>`
      L.popup({ maxWidth: 320, offset: [0, -10] }).setLatLng([lat, lng]).setContent(html).openOn(map)
    } catch (e) {
      /* ignore map errors */
    }
  }, [map, selected])
  return null
}

export default function ReportsScreen() {
  const { token } = useAuth()
  const [reports, setReports] = useState<DetailedReport[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState<DetailedReport | null>(null)
  
  // Edit handler passed to ReportList to update a report inline
  const handleEdit = async (id: string, payload: Partial<DetailedReport>) => {
    try {
      const headers: Record<string,string> = { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const url = buildApiUrl(`/reports/${id}`)
      const res = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(payload) })
      if (!res.ok) {
        // Try to parse JSON error body if provided by backend
        let errText = `Status ${res.status}`
        try {
          const json = await res.json()
          if (json) errText += ` - ${JSON.stringify(json)}`
        } catch (parseErr) {
          const text = await res.text().catch(() => '')
          if (text) errText += ` - ${text}`
        }
        throw new Error(`Edit failed: ${errText}`)
      }
      // Refresh list and update selection
      await loadReports()
      setSelectedReport(prev => prev && prev.id === id ? { ...prev, ...(payload || {}) } : prev)
    } catch (e) {
      console.error('Error editando reporte', e)
      throw e
    }
  }

  // Construye la URL final para las llamadas a la API.
  // Si `VITE_BACKEND_URL` está definido, lo usa como base.
  // Si no, sigue usando `/api` como prefijo para mantener compatibilidad.
  const buildApiUrl = (path: string) => {
    const envBase = import.meta.env.VITE_BACKEND_URL ?? ''
    // Fallback to the known production API if no env var is provided
    const defaultBase = 'https://baches-yucatan.onrender.com/api'
    const base = envBase || defaultBase
    const p = path || '/reports'
    const normalizedPath = p.startsWith('/') ? p : `/${p}`
    return `${String(base).replace(/\/$/, '')}${normalizedPath}`
  }

  const loadReports = useCallback(async () => {
    setLoading(true)
    try {
      const headers: Record<string,string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      
      // Intentar cargar todos los reportes con paginación
      let allItems: any[] = []
      let skip = 0
      const limit = 100
      let hasMore = true
      
      while (hasMore) {
        const res = await fetch(buildApiUrl(`/reports?limit=${limit}&skip=${skip}`), { headers })
        if (!res.ok) {
          console.warn('Carga de reportes respondio:', res.status)
          hasMore = false
          break
        }
        const data = await res.json().catch(() => null)
        const items = (data && (data.reports || data.data || data)) || []
        
        if (!Array.isArray(items)) {
          console.warn('Respuesta no es un array:', items)
          hasMore = false
          break
        }
        
        allItems = allItems.concat(items)
        console.log(`Cargados ${allItems.length} reportes (última página: ${items.length} items)`)
        
        // Si obtuvimos menos items que el limit, no hay más páginas
        if (items.length < limit) {
          hasMore = false
        }
        
        skip += limit
      }
      
      const items = allItems
      const normalized = (items as unknown[]).map((r: unknown) => {
        const rr = r as Record<string, unknown>
        const id = (rr.id ?? rr._id) as string | undefined
        const description = (rr.description as string) ?? (rr.comments as string) ?? ''
        const severity = (rr.severity as string) ?? 'medium'
        const status = (rr.status as string) ?? 'reported'
        const comments = (rr.comments as string) ?? ''
        const street = (rr.street as string) ?? ''
        const neighborhood = (rr.neighborhood as string) ?? ''
        const city = (rr.city as string) ?? ''
        const state = (rr.state as string) ?? (rr.stateName as string) ?? ''
        const postalCode = (rr.postalCode as string) ?? (rr.postal_code as string) ?? ''
        const maybeLoc = rr.location as unknown
        let location: Location | null = null
        if (maybeLoc && typeof maybeLoc === 'object' && 'lat' in (maybeLoc as Record<string, unknown>) && 'lng' in (maybeLoc as Record<string, unknown>)) {
          const m = maybeLoc as Record<string, unknown>
          const lat = Number(m.lat as any)
          const lng = Number(m.lng as any)
          if (!Number.isNaN(lat) && !Number.isNaN(lng)) location = { lat, lng }
        } else if (rr.latitude !== undefined && rr.longitude !== undefined) {
          const lat = Number(rr.latitude as any)
          const lng = Number(rr.longitude as any)
          if (!Number.isNaN(lat) && !Number.isNaN(lng)) location = { lat, lng }
        }
        const images = Array.isArray(rr.images) ? (rr.images as string[]) : ((rr.photo as string) ? [rr.photo as string] : [])
        const reportedByVehicle = (rr.reportedByVehicle as any) || (rr.vehicle as any) || ((rr.vehicleId || rr.plate || rr.licensePlate) ? {
          id: rr.vehicleId as string | undefined,
          licensePlate: rr.licensePlate as string | undefined,
          plate: rr.plate as string | undefined,
          model: (rr.vehicleModel as string) ?? (rr.model as string) ?? undefined,
          brand: (rr.vehicleBrand as string) ?? (rr.brand as string) ?? undefined,
        } : undefined)
        const reportedByWorker = (rr.reportedByWorker as any) || (rr.worker as any) || (rr.reporter as any) || ((rr.workerId || rr.workerName || rr.email) ? {
          id: rr.workerId as string | undefined,
          name: rr.workerName as string | undefined,
          lastname: rr.workerLastname as string | undefined,
          email: rr.email as string | undefined,
        } : undefined)
        const createdAt = (rr.createdAt as string) ?? (rr.date as string) ?? new Date().toISOString()
        return {
          id: String(id ?? Math.random()),
          description,
          severity,
          status,
          comments,
          street,
          neighborhood,
          city,
          state,
          postalCode,
          location,
          images,
          reportedByVehicle,
          reportedByWorker,
          createdAt
        };
      });
      setReports(normalized)
    } catch (e) {
      console.error('Error cargando reportes', e)
      setReports([])
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  async function handleDelete(id: string) {
    try {
      const headers: Record<string,string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(buildApiUrl(`/reports/${id}`), { method: 'DELETE', headers })
      if (!res.ok) throw new Error(`Status ${res.status}`)
      await loadReports()
      setSelectedReport(prev => (prev && prev.id === id ? null : prev))
    } catch (e) {
      throw e
    }
  }

  return (
    <div className="page">
      <Header
        title="Reportes"
        centerSlot={<span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Reportes</span>}
        centered={true}
      />
      {loading && <p>Cargando...</p>}
      <div className="report-section">
        <div className="report-list-column">
          {!loading && <ReportList reports={reports} onDelete={handleDelete} onSelect={setSelectedReport} onEdit={handleEdit} />}
        </div>

        <div className="report-map-column">
          <div className="map-placeholder">
            {reports.length === 0 && !loading && (
              <div className="map-inner">No hay ubicaciones para mostrar</div>
            )}
            {reports.length >= 0 && (
              <MapContainer
                center={[21.02470634812052, -89.6220316074694]}
                zoom={10}
                style={{ height: '100%', width: '100%', display: 'block' }}
                scrollWheelZoom={true}
                zoomControl={true}
                attributionControl={true}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                <MapResizeFix />
                <MapController selected={selectedReport} />
                {reports.map((r) => (
                  r.location ? (
                    <Marker key={r.id} position={[r.location.lat, r.location.lng]} eventHandlers={{ click: () => setSelectedReport(r) }}>
                      <Popup>
                        <div style={{ minWidth: 200 }}>
                          <strong>{r.severity}</strong>
                          <div>{r.description}</div>
                          <div style={{ fontSize: 12, color: '#666' }}>{formatDate(r.createdAt)}</div>
                        </div>
                      </Popup>
                    </Marker>
                  ) : null
                ))}
              </MapContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper component: forces a map.invalidateSize() after mount to fix render issues
function MapResizeFix() {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => { try { map.invalidateSize() } catch (e) { /* ignore */ } }, 200)
    return () => clearTimeout(t)
  }, [map])
  return null
}
