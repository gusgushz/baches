import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar
} from 'recharts';
import styles from './Dashboard.module.css';
import Header from '../components/Header';

type Report = {
  id: string;
  severity?: string;
  status?: string;
  city?: string;
  createdAt?: string;
};

type Assignment = {
  progressStatus: string;
};

function countBy<T>(items: T[], fn: (i: T) => string | undefined) {
  const map = new Map<string, number>();
  for (const it of items) {
    const k = fn(it) ?? '—';
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
}

export default function DashboardScreen({
  token: tokenProp,
  apiBase,
  reports: initialReports
}: { token?: string; apiBase?: string; reports?: Report[] } = {}) {
  const auth = useAuth();
  const token = tokenProp ?? auth.token;

  // 👤 Usuario logueado
  const user = auth.user;
  const displayName = (() => {
    if (!user) return 'Usuario'
    const first = [user.name, user.secondName].filter(Boolean).join(' ')
    const last = [user.lastname, user.secondLastname].filter(Boolean).join(' ')
    const full = [first, last].filter(Boolean).join(' ').trim()
    return full || user.email || 'Usuario'
  })()

  // Estado
  const [reports, setReports] = useState<Report[]>(initialReports ?? []);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [vehiclesCount, setVehiclesCount] = useState<number | null>(null);
  const [workersCount, setWorkersCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getBase() {
    return import.meta.env.DEV
      ? '/api'
      : (apiBase ?? import.meta.env.VITE_API_BASE ?? 'https://baches-yucatan.onrender.com/api');
  }

  async function fetchAll(path: string) {
    const base = getBase();
    try {
      // Para reportes, cargar todos con paginación
      if (path === 'reports') {
        let allItems: unknown[] = []
        let skip = 0
        const limit = 100
        let hasMore = true
        
        while (hasMore) {
          const res = await fetch(`${base}/${path}?limit=${limit}&skip=${skip}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          if (!res.ok) {
            const txt = await res.text().catch(() => '');
            throw new Error(`API ${path} respondió ${res.status}. ${txt}`);
          }
          const data = await res.json();
          const items = Array.isArray(data) ? data : (data?.reports ?? data?.data ?? []);
          
          if (!Array.isArray(items)) {
            hasMore = false;
            break;
          }
          
          allItems = allItems.concat(items);
          console.log(`Dashboard: Cargados ${allItems.length} reportes`);
          
          if (items.length < limit) {
            hasMore = false;
          }
          
          skip += limit;
        }
        
        return allItems;
      }
      
      // Para otros endpoints, hacer un simple fetch
      const res = await fetch(`${base}/${path}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`API ${path} respondió ${res.status}. ${txt}`);
      }
      return await res.json();
    } catch (err: unknown) {
      console.error(`fetchAll(${path}) error`, err);
      throw err;
    }
  }

  useEffect(() => {
    if (initialReports !== undefined) return;
    if (!token) {
      setError('No hay token disponible para cargar métricas.');
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await fetchAll('reports');
        const arrReports = Array.isArray(r) ? r : (r?.data ?? []);
        const normalized: Report[] = (arrReports as unknown[]).map((x: unknown) => {
          const r = x as Record<string, unknown>;
          const id = (r.id ?? r._id) as string | undefined;
          const severity = (r.severity as string) ?? 'unknown';
          const status = (r.status as string) ?? 'reported';
          const city = (r.city as string) ?? (r.town as string) ?? (r.village as string) ?? 'Sin ciudad';
          const createdAt = (r.createdAt as string) ?? (r.date as string) ?? new Date().toISOString();
          return { id: String(id ?? ''), severity, status, city, createdAt };
        });
        if (!cancelled) setReports(normalized);

        const a = await fetchAll('assignments');
        const arrA = Array.isArray(a) ? a : (a?.data ?? []);
        if (!cancelled) setAssignments(arrA);

        const v = await fetchAll('vehicles');
        const arrV = Array.isArray(v) ? v : (v?.data ?? []);
        if (!cancelled) setVehiclesCount(arrV.length);

        const w = await fetchAll('workers');
        const arrW = Array.isArray(w) ? w : (w?.data ?? []);
        if (!cancelled) setWorkersCount(arrW.length);
        if (!cancelled) setLastUpdated(new Date().toISOString());
      } catch (e: unknown) {
          if (!cancelled) setError(`No se pudieron cargar datos: ${(e as Error)?.message ?? String(e)}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Exponer carga inicial
    load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, apiBase, initialReports]);

  // formatea fecha ISO a DD/MM
  const formatDM = (iso: string) => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      return `${dd}/${mm}`;
    } catch (_e: unknown) {
      return iso;
    }
  };

  // Auto-refresh cada 60 segundos
  useEffect(() => {
    if (!token) return;
    const id = setInterval(() => {
      refreshAll().catch(() => {});
    }, 60000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Función pública para recargar métricas (llamada por el auto-refresh)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const refreshAll = async () => {
    if (!token) return;
    setError(null);
    try {
      const r = await fetchAll('reports');
      const arrReports = Array.isArray(r) ? r : (r?.data ?? []);
      const normalized: Report[] = (arrReports as unknown[]).map((x: unknown) => {
        const r = x as Record<string, unknown>;
        const id = (r.id ?? r._id) as string | undefined;
        const severity = (r.severity as string) ?? 'unknown';
        const status = (r.status as string) ?? 'reported';
        const city = (r.city as string) ?? (r.town as string) ?? (r.village as string) ?? 'Sin ciudad';
        const createdAt = (r.createdAt as string) ?? (r.date as string) ?? new Date().toISOString();
        return { id: String(id ?? ''), severity, status, city, createdAt };
      });
      setReports(normalized);

      const a = await fetchAll('assignments');
      const arrA = Array.isArray(a) ? a : (a?.data ?? []);
      setAssignments(arrA);

      const v = await fetchAll('vehicles');
      const arrV = Array.isArray(v) ? v : (v?.data ?? []);
      setVehiclesCount(arrV.length);

      const w = await fetchAll('workers');
      const arrW = Array.isArray(w) ? w : (w?.data ?? []);
      setWorkersCount(arrW.length);

      setLastUpdated(new Date().toISOString());
    } catch (e: unknown) {
      setError(`No se pudieron actualizar datos: ${(e as Error)?.message ?? String(e)}`);
    }
  };

  useEffect(() => {
    if (initialReports !== undefined) setReports(initialReports);
  }, [initialReports]);

  // Métricas
  const totalReports = reports.length;
  const bySeverity = countBy(reports, (r) => r.severity ?? 'unknown');
  const byStatus = countBy(reports, (r) => r.status ?? 'unknown');

  // Función para traducir claves comunes a etiquetas en español
  const translateLabel = (key: string) => {
    const k = (key || '').toString();
    const map: Record<string, string> = {
      unknown: 'Desconocida',
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      reported: 'Reportado',
      in_progress: 'En progreso',
      assigned: 'Asignado',
      completed: 'Completada',
      pending: 'Pendiente',
    };
    return map[k] ?? (k === '—' ? '—' : k.charAt(0).toUpperCase() + k.slice(1));
  }

  // Tendencia temporal
  const trendMap = new Map<string, number>();
  reports.forEach((r) => {
    const d = r.createdAt ? new Date(r.createdAt) : null;
    if (d && !isNaN(d.getTime())) {
      const key = d.toISOString().slice(0, 10);
      trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
    }
  });
  const trendData = Array.from(trendMap.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, count]) => ({ date, count }));

  // Top ciudades
  const topCities = countBy(reports, (r) => r.city ?? 'Sin ciudad').slice(0, 5);
  const topCitiesData = topCities.map(([city, count]) => ({ city, count }));

  // Porcentaje completadas
  const completed = assignments.filter((a: Assignment) => a.progressStatus === 'completed').length;
  const totalAssignments = assignments.length;
  const completionPercent = totalAssignments ? Math.round((completed / totalAssignments) * 100) : 0;
  const gaugeData = [{ name: 'Completadas', value: completionPercent }];

  // Métrica adicional: promedio diario de reportes en los últimos N días (por defecto 7)
  const avgLastNDays = (n: number) => {
    const today = new Date();
    const values: number[] = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      values.push(trendMap.get(key) ?? 0);
    }
    const sum = values.reduce((s, v) => s + v, 0);
    return n ? +(sum / n).toFixed(1) : 0;
  };

  const avg7 = avgLastNDays(7);

  // Datos de los últimos N días (para mostrar detalle en 'Próxima métrica')
  const lastNDays = (n: number) => {
    const today = new Date();
    const arr: { date: string; count: number }[] = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      arr.push({ date: key, count: trendMap.get(key) ?? 0 });
    }
    return arr;
  };

  const last7 = lastNDays(7);

  // Saludo según la hora local (solo para el header de dashboard)
  const greeting = (() => {
    try {
      const h = new Date().getHours();
      if (h >= 5 && h < 12) return 'Buenos días';
      if (h >= 12 && h < 20) return 'Buenas tardes';
      return 'Buenas noches';
    } catch (_e) {
      return 'Hola';
    }
  })();

  // Intentar extraer el primer nombre para saludar de forma natural
  const firstName = (() => {
    try {
      const n = String(displayName || '').trim();
      if (!n) return 'Usuario';
      return n.split(' ')[0];
    } catch (_e) { return String(displayName || 'Usuario') }
  })();

  return (
    <div className="page metrics-page">
      <Header
        title="Inicio"
        leftSlot={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--fg)' }}>{`${greeting}, ${firstName}`}</div>
          </div>
        }
        centerSlot={<span />}
        rightSlot={
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="header-greeting"><span className="avatar">👤</span></div>
          </div>
        }
      />

      {/* El Header ya muestra título y acciones; saludos integrados en el header */}

      {loading && <p>Cargando métricas...</p>}
      {error && <p className="form-error">{error}</p>}

      {/* KPIs */}
      <div className={styles.kpiGrid}>
        <div className={styles.panel}><h3>Total de reportes</h3><div className={styles.kpiValue}>{totalReports}</div></div>
        <div className={styles.panel}><h3>Vehículos</h3><div className={styles.kpiValue}>{vehiclesCount ?? '—'}</div></div>
        <div className={styles.panel}><h3>Asignaciones</h3><div className={styles.kpiValue}>{totalAssignments}</div></div>
        <div className={styles.panel}><h3>Trabajadores</h3><div className={styles.kpiValue}>{workersCount ?? '—'}</div></div>
        {/* Promedio 7d movido a 'Próxima métrica' */}
      </div>

      {/* Charts */}
      <div className={styles.chartGrid}>
        <div className={styles.panel}>
          <h3>Por severidad</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={bySeverity.map(([name, value]) => ({ name: translateLabel(name), value }))} dataKey="value" nameKey="name" innerRadius={40} outerRadius={80}>
                {bySeverity.map(([k], i) => (
                  <Cell key={k} fill={['#10b981', '#f59e0b', '#ef4444'][i % 3]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.panel}>
          <h3>Por estado</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byStatus.map(([name, value]) => ({ name: translateLabel(name), value }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#0f766e" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.panel}>
          <h3>Tendencia de reportes</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}>
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.panel}>
          <h3>Top ciudades</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topCitiesData} layout="vertical" margin={{ left: 40 }}>
              <YAxis dataKey="city" type="category" width={80} />
              <XAxis type="number" allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#f97316" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.panel}>
          <h3>Asignaciones completadas</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadialBarChart innerRadius="70%" outerRadius="100%" data={gaugeData} startAngle={90} endAngle={-270}>
              {/* @ts-expect-error - tipado de Recharts puede diferir; permitimos estas props para renderizar el radial */}
              <RadialBar minAngle={15} background clockWise dataKey="value" fill="#22c55e" />
              <Tooltip />
            </RadialBarChart>
          </ResponsiveContainer>
          <p style={{ textAlign: 'center', fontWeight: 'bold', marginTop: 8 }}>{completionPercent}%</p>
        </div>

        <div className={styles.panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Promedio Diario</h3>
            <div className="muted" style={{ fontSize: 12 }}>
              {lastUpdated ? `Última actualización: ${formatDM(lastUpdated)} ${new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Última actualización: —'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 180, minWidth: 140 }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Promedio diario (últimos 7 días)</div>
              <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--accent)' }}>{avg7}</div>
              <div style={{ height: 70, marginTop: 8 }}>
                <ResponsiveContainer width="100%" height={70}>
                  <LineChart data={last7} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                    <Line type="monotone" dataKey="count" stroke="#0f766e" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div className="muted" style={{ marginBottom: 6 }}>Detalle por día</div>
              <ul style={{ margin: 0, paddingLeft: 18, columnCount: 1 }}>
                {last7.map(d => (
                  <li key={d.date} style={{ fontSize: 13, marginBottom: 4 }}>{formatDM(d.date)} — <strong>{d.count}</strong></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}