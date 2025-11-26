const API_BASE = (import.meta as any).env?.VITE_BACKEND_URL

export default async function createVehicle(payload: Record<string, any>, token?: string) {
  if (!token) throw new Error('No autorizado')
  if (!API_BASE) throw new Error('VITE_BACKEND_URL no está configurada')
  const base = API_BASE.replace(/\/+$/, '')
  const url = base.endsWith('/api/vehicles') || base.endsWith('/vehicles') ? `${base}` : base.endsWith('/api') ? `${base}/vehicles` : `${base}/api/vehicles`
  console.debug('createVehicle ->', { url, payload })

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    // try to parse JSON error otherwise get text
    const json = await res.json().catch(() => null)
    const text = await res.text().catch(() => '')
    console.error('createVehicle error response:', { status: res.status, json, text })
    const msg = (json && (json.message || json.error)) || text || `Error ${res.status}`
    throw new Error(msg)
  }

  const json = await res.json().catch(() => null)
  console.debug('createVehicle response json:', json)
  return json || true
}
