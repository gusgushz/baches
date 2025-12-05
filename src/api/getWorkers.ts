import type { Employee } from '../models/Employees'

const DEFAULT_URL = 'https://baches-yucatan.onrender.com/api/workers'

async function extractArrayFromResponse(resp: any): Promise<any[]> {
  if (!resp) return []
  if (Array.isArray(resp)) return resp
  if (Array.isArray(resp.data)) return resp.data
  if (Array.isArray(resp.items)) return resp.items
  if (Array.isArray(resp.workers)) return resp.workers
  if (Array.isArray(resp.results)) return resp.results
  for (const k of Object.keys(resp || {})) {
    if (Array.isArray((resp as any)[k])) return (resp as any)[k]
  }
  return []
}

export default async function getWorkers(token?: string): Promise<Employee[]> {
  const envBase = (import.meta as any).env?.VITE_BACKEND_URL
  const base = envBase || DEFAULT_URL
  const normalized = base.replace(/\/+$/, '')
  let url: string
  if (normalized.endsWith('/api/workers') || normalized.endsWith('/workers')) {
    url = normalized
  } else if (normalized.endsWith('/api')) {
    url = `${normalized}/workers`
  } else {
    url = `${normalized}/api/workers`
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(url, { method: 'GET', headers })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`getWorkers failed: ${res.status} ${res.statusText} ${text}`)
  }

  let json: any
  try {
    json = await res.json()
  } catch (e) {
    return []
  }

  const arr = await extractArrayFromResponse(json)

  const mapped: Employee[] = arr.map((it: any) => ({
    id: it.id || it._id || it.workerId || '',
    role: it.role || it.position || '' ,
    email: it.email || it.username || '',
    name: it.name || it.firstName || it.nombre || '',
    secondName: it.secondName || it.middleName || null,
    lastname: it.lastname || it.lastName || it.apellido || '',
    secondLastname: it.secondLastname || null,
    phoneNumber: it.phoneNumber ?? it.phone ?? null,
    fechaNacimiento: it.fechaNacimiento || it.birthDate || null,
    passwordHash: it.passwordHash || null,
    status: it.status || it.state || 'active',
    photoUrl: it.photoUrl || it.avatar || null,
  }))

  return mapped
}
