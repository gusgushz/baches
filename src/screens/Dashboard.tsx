import { useLocation } from 'react-router'
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

export default function DashboardScreen() {
  const { token } = useAuth()
  const location = useLocation()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // if no token, set an error and skip
    if (!token) {
      setError('No hay token disponible para cargar métricas.')
      setReports([])
      return
    }

    let cancelled = false
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 7000)

    const buildApiUrl = (path: string) => {
      const base = import.meta.env.VITE_BACKEND_URL ?? ''
      const dashboardPath = (import.meta.env.VITE_DASHBOARD_PATH as string) ?? '/dashboard'
      const p = path || dashboardPath
      const normalizedPath = p.startsWith('/') ? p : `/${p}`
      if (base) return `${String(base).replace(/\/$/, '')}${normalizedPath}`
      return `/api${normalizedPath}`
    }

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(buildApiUrl('/reports'), { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
        if (!res.ok) throw new Error(`Error ${res.status}`)
        const data = await res.json()
        const items = (data.reports || data.data || data || []) as any[]
        const normalized = items.map((r) => ({
          id: r.id || r._id,
          description: r.description || r.comments || '',
          severity: (r.severity || 'medium').toString(),
          status: r.status || 'reported',
          location: r.location ? r.location : (r.latitude !== undefined && r.longitude !== undefined ? { lat: r.latitude, lng: r.longitude } : null),
          city: r.city || r.town || r.village || '',
          createdAt: r.createdAt || r.date || new Date().toISOString()
        })) as Report[]
        if (cancelled) return
        setReports(normalized)
      } catch (e: any) {
        if (e?.name === 'AbortError') setError('Tiempo de espera agotado al cargar métricas.')
        else setError(String(e?.message || e))
        setReports([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true; clearTimeout(timeout); controller.abort() }
  }, [token])

  const total = reports.length
  const bySeverity = countBy(reports, (r) => (r.severity || 'unknown').toString())
  const byStatus = countBy(reports, (r) => (r as any).status || 'unknown')
  const byCity = countBy(reports, (r) => (r as any).city || 'Sin ciudad')

  return (
    <div className="page metrics-page">
      <h2>Dashboard</h2>
      <div style={{ marginBottom: 8 }}><small>Ruta actual: {location.pathname}</small></div>
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
    </div>
  )
}
