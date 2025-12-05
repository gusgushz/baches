const API_BASE = (import.meta as any).env?.VITE_BACKEND_URL
const DEFAULT_URL = 'https://baches-yucatan.onrender.com/api/workers'

export default async function updateWorker(id: string, payload: Record<string, any>, token?: string) {
  if (!id) throw new Error('updateWorker: id is required')
  if (!token) throw new Error('No autorizado')

  const baseRaw = API_BASE ?? DEFAULT_URL
  const base = String(baseRaw).replace(/\/+$/, '')
  const url = base.endsWith('/api/workers') || base.endsWith('/workers') ? `${base}/${encodeURIComponent(id)}` : base.endsWith('/api') ? `${base}/workers/${encodeURIComponent(id)}` : `${base}/api/workers/${encodeURIComponent(id)}`
  console.debug('updateWorker ->', { url, id, payload })

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    let parsedBody: any = null
    let rawText = ''
    try {
      parsedBody = await res.json()
      rawText = JSON.stringify(parsedBody)
    } catch {
      rawText = await res.text().catch(() => '')
    }
    console.error('updateWorker error response:', { status: res.status, body: parsedBody ?? rawText })
    const msg = (parsedBody && (parsedBody.message || parsedBody.error)) || rawText || `Error ${res.status}`
    const err: any = new Error(msg)
    err.status = res.status
    err.url = url
    err.body = parsedBody ?? rawText
    throw err
  }

  const json = await res.json().catch(() => null)
  console.debug('updateWorker response json:', json)
  return json || true
}
