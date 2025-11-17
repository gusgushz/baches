import { useCallback, useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import '../Reports.css'
import { useAuth } from '../contexts/AuthContext'

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
  switch (String(s)) {
    case 'not_started':
      return 'No iniciado'
    case 'in_progress':
      return 'En progreso'
    case 'completed':
      return 'Completado'
    case 'on_hold':
      return 'En pausa'
    default:
      return String(s).replace(/_/g, ' ')
  }
}

function severityRank(s?: string) {
  const norm = normalizeSeverity(s)
  if (norm === 'low') return 1
  if (norm === 'medium') return 2
  if (norm === 'high') return 3
  return 2
}

function ReportList({ reports, onDelete }: { reports: DetailedReport[]; onDelete?: (id: string) => Promise<void> }) {
  const [preview, setPreview] = useState<string | null>(null)
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('date_desc')

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
          <li key={r.id} className={`report-item ${r.severity || ''}`}>
            <div className="meta">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <strong>{(r.severity || '').toUpperCase()}</strong>
                <span className={`status-badge ${r.status || ''}`}>{mapStatus(r.status)}</span>
              </div>
              <time>{formatDate(r.createdAt)}</time>
            </div>

            <p className="desc">{r.description}</p>

            {r.comments && <div className="comments"><strong>Comentarios:</strong> {r.comments}</div>}

            {(r.street || r.neighborhood || r.city || r.state || r.postalCode) && (
              <div className="address" style={{ marginTop: 8 }}>
                <strong>Dirección:</strong>
                <div>{r.street || ''}{r.street && r.neighborhood ? ', ' : ''}{r.neighborhood || ''}</div>
                <div>{r.city || ''}{r.city && r.state ? ', ' : ''}{r.state || ''} {r.postalCode || ''}</div>
              </div>
            )}

            {r.location && (
              <div className="location">Ubicación: {r.location.lat}, {r.location.lng}</div>
            )}

            {r.reportedByVehicle && (
              <div className="reported-by-vehicle" style={{marginTop:8}}>
                <strong>Reportado por vehículo:</strong>
                <div>
                  {r.reportedByVehicle.licensePlate || r.reportedByVehicle.plate || ''} {r.reportedByVehicle.model ? `— ${r.reportedByVehicle.model}` : ''}
                </div>
              </div>
            )}

            {r.reportedByWorker && (
              <div className="reported-by-worker" style={{marginTop:8}}>
                <strong>Reportado por trabajador:</strong>
                <div>
                  {((r.reportedByWorker.name || '') + (r.reportedByWorker.lastname ? ' ' + r.reportedByWorker.lastname : '')).trim() || r.reportedByWorker.email || '—'}
                </div>
                {r.reportedByWorker.email && <div style={{fontSize:12,color:'#666'}}>{r.reportedByWorker.email}</div>}
              </div>
            )}

            {r.images && r.images.length > 0 && (
              <div className="image-row" style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {r.images.map((img, idx) => (
                  <div key={idx} className="photo-thumb" style={{ cursor: 'pointer' }}>
                    <img src={img} alt={`foto-${idx}`} onClick={() => setPreview(img || null)} />
                  </div>
                ))}
              </div>
            )}

            {onDelete && (
              <div style={{ marginTop: 8 }}>
                <button className="small" onClick={async () => {
                  if (!confirm('¿Eliminar este reporte? Esta acción no se puede deshacer.')) return
                  try {
                    await onDelete(r.id)
                  } catch (e) {
                    console.error('Eliminar reporte falló', e)
                    alert('No se pudo eliminar el reporte')
                  }
                }}>Eliminar</button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {preview && (
        <div className="image-modal" onClick={() => setPreview(null)}>
          <img src={preview} alt="preview large" />
        </div>
      )}
    </div>
  )
}

export default function ReportsScreen() {
  const { token } = useAuth()
  const [reports, setReports] = useState<DetailedReport[]>([])
  const [loading, setLoading] = useState(false)

  // Construye la URL final para las llamadas a la API.
  // Si `VITE_BACKEND_URL` está definido, lo usa como base.
  // Si no, sigue usando `/api` como prefijo para mantener compatibilidad.
  const buildApiUrl = (path: string) => {
    const base = import.meta.env.VITE_BACKEND_URL ?? ''
    const reportsPath = (import.meta.env.VITE_REPORTS_PATH as string) ?? '/reports'
    const p = path || reportsPath
    const normalizedPath = p.startsWith('/') ? p : `/${p}`
    if (base) return `${String(base).replace(/\/$/, '')}${normalizedPath}`
    return `/api${normalizedPath}`
  }

  const loadReports = useCallback(async () => {
    setLoading(true)
    try {
      const headers: Record<string,string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(buildApiUrl('/reports'), { headers })
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        console.warn('Carga de reportes respondio:', res.status, body)
        setReports([])
        return
      }
      const data = await res.json().catch(() => null)
      const items = (data && (data.reports || data.data || data)) || []
      const normalized = (items as any[]).map(r => ({
        id: r.id || r._id || String(r.id || Math.random()),
        description: r.description || r.comments || '',
        severity: r.severity || 'medium',
        status: r.status || 'reported',
        comments: r.comments || '',
        street: r.street || '',
        neighborhood: r.neighborhood || '',
        city: r.city || '',
        state: r.state || r.stateName || '',
        postalCode: r.postalCode || r.postal_code || '',
        location: r.location ? r.location : (r.latitude !== undefined && r.longitude !== undefined ? { lat: r.latitude, lng: r.longitude } : null),
        images: Array.isArray(r.images) ? r.images : (r.photo ? [r.photo] : []),
        // support variations returned by different backends
        reportedByVehicle: r.reportedByVehicle || r.vehicle || (r.vehicleId || r.plate || r.licensePlate ? {
          id: r.vehicleId || undefined,
          licensePlate: r.licensePlate || r.plate || undefined,
          plate: r.plate || r.licensePlate || undefined,
          model: r.vehicleModel || r.model || undefined,
          brand: r.vehicleBrand || r.brand || undefined,
        } : undefined),
        reportedByWorker: r.reportedByWorker || r.worker || r.reporter || (r.workerId || r.workerName || r.email ? {
          id: r.workerId || undefined,
          name: r.workerName || r.name || undefined,
          lastname: r.workerLastname || r.lastname || undefined,
          email: r.email || r.workerEmail || undefined,
        } : undefined),
        createdAt: r.createdAt || r.date || new Date().toISOString()
      }))
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
    } catch (e) {
      throw e
    }
  }

  return (
    <div className="page">
      <h1>Reportes</h1>
      {loading && <p>Cargando...</p>}
      <div className="report-section">
        <div className="report-list-column">
          {!loading && <ReportList reports={reports} onDelete={handleDelete} />}
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
                {reports.map((r) => (
                  r.location ? (
                    <Marker key={r.id} position={[r.location.lat, r.location.lng]}>
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
