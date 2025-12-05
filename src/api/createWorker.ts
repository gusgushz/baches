// src/api/createWorker.ts
const API_BASE = (import.meta as any).env?.VITE_BACKEND_URL
const DEFAULT_URL = 'https://bachesyucatan.onrender.com/api/workers' // dominio unificado

export default async function createWorker(payload: Record<string, any>, token?: string) {
  if (!token) throw new Error('No autorizado')
  const baseRaw = API_BASE ?? DEFAULT_URL
  const base = String(baseRaw).replace(/\/+$/, '')
  const url = base.endsWith('/api/workers') || base.endsWith('/workers')
    ? `${base}`
    : base.endsWith('/api')
      ? `${base}/workers`
      : `${base}/api/workers`

  console.debug('createWorker ->', { url, payload })

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  // manejo de error robusto
  if (!res.ok) {
    // intentar parsear JSON, si no, texto
    const json = await res.json().catch(() => null)
    const text = await res.text().catch(() => '')
    console.error('createWorker error response:', { status: res.status, json, text })
    // preferir mensaje del JSON
    const msg = (json && (json.message || json.error)) || text || `Error ${res.status}`
    const err: any = new Error(msg)
    err.status = res.status
    err.body = json ?? text
    throw err
  }

  // devolver JSON si hay, o true si es 204
  if (res.status === 204) return true
  const json = await res.json().catch(() => null)
  console.debug('createWorker response json:', json)
  return json || true
}
