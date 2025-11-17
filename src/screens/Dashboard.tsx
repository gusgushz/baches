import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

type Report = {
  id: string
  description?: string
  severity?: string
  status?: string
  location?: { lat: number; lng: number } | null
  city?: string
  createdAt?: string
}

function countBy<T>(items: T[], fn: (i: T) => string | undefined) {
  const map = new Map<string, number>()
  for (const it of items) {
    const k = fn(it) || '—'
    map.set(k, (map.get(k) || 0) + 1)
  }
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
}

export default function DashboardScreen({ token: tokenProp, apiBase, reports: initialReports }: { token?: string; apiBase?: string; reports?: Report[] } = {}) {
  const auth = useAuth()
  const token = tokenProp ?? auth.token
  const [reports, setReports] = useState<Report[]>(initialReports || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If parent provided `reports` (even an empty array), do not fetch here.
    if (initialReports !== undefined) return

    if (!token) {
      setError('No hay token disponible para cargar métricas.')
      setReports([])
      return
    }

    let cancelled = false
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 7000)

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const finalApiBase = apiBase ?? (import.meta.env.VITE_BACKEND_URL as string) ?? (import.meta.env.VITE_API_BASE as string) ?? 'https://baches-yucatan-1.onrender.com/api'
        const res = await fetch(`${String(finalApiBase).replace(/\/$/, '')}/reports`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
        if (!res.ok) throw new Error(`Error ${res.status}`)
        const data = await res.json().catch(() => null)
        const items = (data && (data.reports || data.data || data) || []) as any[]
        const normalized = items.map((r) => ({
          id: r.id || r._id,
          description: r.description || r.comments || '',
          severity: (r.severity || 'medium').toString(),
          status: r.status || 'reported',
          location: r.location ? r.location : (r.latitude !== undefined && r.longitude !== undefined ? { lat: r.latitude, lng: r.longitude } : null),
          city: r.city || r.town || r.village || r.city || '',
          reportedByWorker: r.reportedByWorker,
          reportedByVehicle: r.reportedByVehicle,
          createdAt: r.createdAt || r.date || new Date().toISOString()
        })) as Report[]
        if (cancelled) return
        setReports(normalized)
      } catch (e: any) {
        if (e?.name === 'AbortError') {
          if (!cancelled) setError('Tiempo de espera agotado al cargar métricas.')
        } else {
          setError(String(e?.message || e))
        }
        setReports([])
      } finally {
        clearTimeout(timeout)
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true; clearTimeout(timeout); controller.abort() }
  }, [token, apiBase, initialReports])

  // Keep local state in sync if parent passes reports later
  useEffect(() => {
    if (initialReports !== undefined) setReports(initialReports)
  }, [initialReports])

  const total = reports.length
  const bySeverity = countBy(reports, (r) => (r.severity || 'unknown').toString())
  const byStatus = countBy(reports, (r) => (r as any).status || 'unknown')
  const byCity = countBy(reports, (r) => (r as any).city || 'Sin ciudad')

  // Distribution by hour (0-23)
  const hours = new Array(24).fill(0)
  // Days: Sunday(0) ... Saturday(6)
  const days = new Array(7).fill(0)
  for (const r of reports) {
    try {
      const d = new Date(r.createdAt as string)
      if (!isNaN(d.getTime())) {
        const h = d.getHours()
        const wd = d.getDay()
        hours[h] = (hours[h] || 0) + 1
        days[wd] = (days[wd] || 0) + 1
      }
    } catch (e) {
      // ignore malformed dates
    }
  }

  const maxHour = Math.max(...hours, 1)
  const maxDay = Math.max(...days, 1)

  // Top workers and vehicles
  function topByKey(getKey: (r: Report) => string | null, top = 10) {
    const m = new Map<string, number>()
    for (const r of reports) {
      const k = getKey(r)
      if (!k) continue
      m.set(k, (m.get(k) || 0) + 1)
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, top)
  }

  const topWorkers = topByKey((r) => {
    const w = (r as any).reportedByWorker
    if (!w) return null
    const name = ((w.name || '') + (w.lastname ? ' ' + w.lastname : '')).trim()
    return name || w.email || null
  })

  const topVehicles = topByKey((r) => {
    const v = (r as any).reportedByVehicle
    if (!v) return null
    return (v.licensePlate || v.plate || v.id || null)
  })

  return (
    <div className="page metrics-page">
      <h2>Dashboard</h2>
      {loading && <p>Cargando métricas...</p>}
      {error && <p className="form-error">{error}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="panel">
          <h3>Total de reportes</h3>
          <div style={{ fontSize: 36, fontWeight: 700 }}>{total}</div>
        </div>

        <div className="panel">
          <h3>Por severidad</h3>
          {bySeverity.map(([k, v]) => {
            const pct = total ? Math.round((v / total) * 100) : 0
            return (
              <div key={k} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><small>{k}</small><small>{v} ({pct}%)</small></div>
                <div style={{ background: '#eee', height: 10, borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: '#14b39a' }} />
                </div>
              </div>
            )
          })}
        </div>

        <div className="panel">
          <h3>Por estado</h3>
          {byStatus.map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}><div>{k}</div><div>{v}</div></div>
          ))}
        </div>

        <div className="panel">
          <h3>Ciudades principales</h3>
          <ol>
            {byCity.slice(0, 8).map(([city, v]) => <li key={city}>{city} — {v}</li>)}
          </ol>
        </div>
      </div>

      {/* hourly / weekday distributions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <div className="panel">
          <h3>Distribución por hora del día</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {hours.map((count, h) => {
              const pct = Math.round((count / maxHour) * 100)
              return (
                <div key={h} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 40 }}><small>{String(h).padStart(2, '0')}:00</small></div>
                  <div style={{ flex: 1, background: '#eee', height: 12, borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#3b82f6' }} />
                  </div>
                  <div style={{ width: 48, textAlign: 'right' }}><small>{count}</small></div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="panel">
          <h3>Distribución por día de la semana</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((label, i) => {
              const count = days[i] || 0
              const pct = Math.round((count / maxDay) * 100)
              return (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 40 }}><small>{label}</small></div>
                  <div style={{ flex: 1, background: '#eee', height: 12, borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#ef4444' }} />
                  </div>
                  <div style={{ width: 48, textAlign: 'right' }}><small>{count}</small></div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Top reporters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <div className="panel">
          <h3>Top 10 — Trabajadores</h3>
          {topWorkers.length === 0 && <p className="muted">No hay datos de trabajadores.</p>}
          <ol>
            {topWorkers.map(([name, cnt]) => (
              <li key={name}>{name} — {cnt}</li>
            ))}
          </ol>
        </div>

        <div className="panel">
          <h3>Top 10 — Vehículos</h3>
          {topVehicles.length === 0 && <p className="muted">No hay datos de vehículos.</p>}
          <ol>
            {topVehicles.map(([plate, cnt]) => (
              <li key={plate}>{plate} — {cnt}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
