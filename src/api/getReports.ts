const getReports = async (token?: string) => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://baches-yucatan.onrender.com/api'
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  
  // Intentar con limit muy grande primero
  const res = await fetch(`${BACKEND_URL}/reports?limit=10000&skip=0`, { headers })
  if (!res.ok) throw new Error(`Error: ${res.status}`)
  
  const data = await res.json()
  const items = (data && (data.reports || data.data || data)) || []
  
  return items
}

export default getReports
