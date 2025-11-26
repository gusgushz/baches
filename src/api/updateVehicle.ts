const API_BASE = (import.meta as any).env?.VITE_BACKEND_URL

export default async function updateVehicle(id: string, payload: Record<string, any>, token?: string) {
  if (!token) throw new Error('No autorizado')
  if (!API_BASE) throw new Error('VITE_BACKEND_URL no está configurada')
  const base = API_BASE.replace(/\/+$/, '')
  const url = base.endsWith('/api/vehicles') || base.endsWith('/vehicles') ? `${base}/${id}` : base.endsWith('/api') ? `${base}/vehicles/${id}` : `${base}/api/vehicles/${id}`

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Error ${res.status}`)
  }

  const json = await res.json().catch(() => null)
  return json || true
}
