const API_BASE = (import.meta as any).env?.VITE_BACKEND_URL;

type CreatePayload = {
  name: string;
  secondName?: string | null;
  lastname: string;
  secondLastname?: string | null;
  role?: string;
  email?: string | null;
  phoneNumber?: number | string | null;
  fechaNacimiento?: string | null;
  status?: string | null;
  photoUrl?: string | null;
  assignedVehicleId?: string | null;
};

export default async function createWorker(data: CreatePayload, token?: string) {
  if (!token) throw new Error('No autorizado');
  if (!API_BASE) throw new Error('VITE_BACKEND_URL no está configurada');

  const base = String(API_BASE).replace(/\/+$/, '');
  const url = base.endsWith('/api/workers') || base.endsWith('/workers')
    ? base
    : base.endsWith('/api')
      ? `${base}/workers`
      : `${base}/api/workers`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => null);
    const text = await res.text().catch(() => '');
    const msg = (json && (json.message || json.error)) || text || `Error ${res.status}`;
    throw new Error(msg);
  }

  return res.json().catch(() => ({}));
}
