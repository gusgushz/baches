const API_BASE = (import.meta as any).env?.VITE_BACKEND_URL

const deleteVehicle = async (id: string, token?: string) => {
  if (!token) throw new Error('No autorizado')
  if (!API_BASE) throw new Error('VITE_BACKEND_URL no está configurada')
  const base = API_BASE.replace(/\/+$/, '')
  // build url that always targets /api/vehicles/:id (handles cases where VITE_BACKEND_URL may end with '/', '/api' or '/api/vehicles')
  let url: string
  if (base.endsWith('/api/vehicles') || base.endsWith('/vehicles')) {
    url = `${base}/${id}`
  } else if (base.endsWith('/api')) {
    url = `${base}/vehicles/${id}`
  } else {
    url = `${base}/api/vehicles/${id}`
  }

  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Error ${res.status}`)
  }

  return true
}

export default deleteVehicle
