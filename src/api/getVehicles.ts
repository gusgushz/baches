import type { Vehicle } from '../models'

const DEFAULT_URL = 'https://baches-yucatan.onrender.com/api/vehicles'

async function extractArrayFromResponse(resp: any): Promise<any[]> {
  if (!resp) return []
  if (Array.isArray(resp)) return resp
  if (Array.isArray(resp.data)) return resp.data
  if (Array.isArray(resp.items)) return resp.items
  if (Array.isArray(resp.vehicles)) return resp.vehicles
  if (Array.isArray(resp.results)) return resp.results
  for (const k of Object.keys(resp || {})) {
    if (Array.isArray((resp as any)[k])) return (resp as any)[k]
  }
  return []
}

export default async function getVehicles(token?: string): Promise<Vehicle[]> {
  const envBase = (import.meta as any).env?.VITE_BACKEND_URL
  const base = envBase || DEFAULT_URL
  const normalized = base.replace(/\/+$/, '')
  let url: string
  if (normalized.endsWith('/api/vehicles') || normalized.endsWith('/vehicles')) {
    url = normalized
  } else if (normalized.endsWith('/api')) {
    // env contains base/.../api -> append /vehicles (avoid /api/api)
    url = `${normalized}/vehicles`
  } else {
    // base is host-only or other path -> append /api/vehicles
    url = `${normalized}/api/vehicles`
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(url, { method: 'GET', headers })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`getVehicles failed: ${res.status} ${res.statusText} ${text}`)
  }

  let json: any
  try {
    json = await res.json()
  } catch (e) {
    return []
  }

  const arr = await extractArrayFromResponse(json)

  const mapped: Vehicle[] = arr.map((it: any) => ({
    id: it.id || it._id || it.vehicleId || it.vin || '',
    licensePlate: it.plate || it.licensePlate || it.plateNumber || '',
    model: it.model || null,
    year: it.year ?? null,
    color: it.color ?? null,
    corporation: it.corporation ?? null,
    status: (it.status || it.state || it.condition || 'unknown'),
    assignedWorkerId: it.assignedWorker || it.workerId || it.employeeId || it.driverId || null,
  }))

  return mapped
}
