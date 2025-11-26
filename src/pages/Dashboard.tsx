
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
    if (!user) return 'Usuario';
    const first = [user.name, user.secondName].filter(Boolean).join(' ');
    const last = [user.lastname, user.secondLastname].filter(Boolean).join(' ');
    const full = [first, last].filter(Boolean).join(' ').trim();
    return full || user.email || 'Usuario';
  })();

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
      const res = await fetch(`${base}/${path}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`API ${path} respondió ${res.status}. ${txt}`);
      }
      return await res.json();
    } catch (err: any) {
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
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const r = await fetchAll('reports');
        const arrReports = Array.isArray(r) ? r : (r?.data ?? []);
        const normalized: Report[] = arrReports.map((x: any) => ({
          id: x.id ?? x._id,
          severity: x.severity ?? 'unknown',
          status: x.status ?? 'reported',
          city: x.city ?? x.town ?? x.village ?? 'Sin ciudad',
          createdAt: x.createdAt ?? x.date ?? new Date().toISOString(),
        }));
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
      } catch (e: any) {
        if (!cancelled) setError(`No se pudieron cargar datos: ${e?.message ?? e}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, apiBase, initialReports]);

  useEffect(() => {
    if (initialReports !== undefined) setReports(initialReports);
  }, [initialReports]);

  // Métricas
  const totalReports = reports.length;
  const bySeverity = countBy(reports, (r) => r.severity ?? 'unknown');
  const byStatus = countBy(reports, (r) => r.status ?? 'unknown');

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
  const completed = assignments.filter((a: any) => a.progressStatus === 'completed').length;
  const totalAssignments = assignments.length;
  const completionPercent = totalAssignments ? Math.round((completed / totalAssignments) * 100) : 0;
  const gaugeData = [{ name: 'Completadas', value: completionPercent }];

  return (
    <div className={`${styles.page} ${styles.metricsPage}`}>
      {/* Header con saludo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Dashboard</h2>
        <div style={{ color: '#64748b', fontWeight: 600 }}>👤 Hola, {displayName}</div>
      </div>

      {loading && <p>Cargando métricas...</p>}
      {error && <p className="form-error">{error}</p>}

      {/* KPIs */}
      <div className={styles.kpiGrid}>
        <div className={styles.panel}><h3>Total de reportes</h3><div className={styles.kpiValue}>{totalReports}</div></div>
        <div className={styles.panel}><h3>Vehículos</h3><div className={styles.kpiValue}>{vehiclesCount ?? '—'}</div></div>
        <div className={styles.panel}><h3>Asignaciones</h3><div className={styles.kpiValue}>{totalAssignments}</div></div>
        <div className={styles.panel}><h3>Trabajadores</h3><div className={styles.kpiValue}>{workersCount ?? '—'}</div></div>
      </div>

      {/* Charts */}
      <div className={styles.chartGrid}>
        <div className={styles.panel}>
          <h3>Por severidad</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={bySeverity.map(([name, value]) => ({ name, value }))} dataKey="value" nameKey="name" innerRadius={40} outerRadius={80}>
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
            <BarChart data={byStatus.map(([name, value]) => ({ name, value }))}>
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
              <RadialBar minAngle={15} background clockWise dataKey="value" fill="#22c55e" />
              <Tooltip />
            </RadialBarChart>
          </ResponsiveContainer>
          <p style={{ textAlign: 'center', fontWeight: 'bold', marginTop: 8 }}>{completionPercent}%</p>
        </div>

        <div className={styles.panel}>
          <h3>Próxima métrica</h3>
          <p className="muted">Aquí podemos poner el tiempo medio de resolución, mapa de calor, etc.</p>
        </div>
      </div>
    </div>
  );
}