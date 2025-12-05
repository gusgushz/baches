const DEFAULT_URL = 'https://baches-yucatan.onrender.com/api/workers' 

const deleteWorker = async (id: string, token?: string): Promise<any> => {
  if (!id) throw new Error('deleteWorker: id is required')

  const envBase = (import.meta as any).env?.VITE_BACKEND_URL
  const base = String(envBase ?? DEFAULT_URL).replace(/\/+$/, '')

  let url: string
  if (base.endsWith('/api/workers') || base.endsWith('/workers')) {
    url = `${base}/${encodeURIComponent(id)}`
  } else if (base.endsWith('/api')) {
    url = `${base}/workers/${encodeURIComponent(id)}`
  } else {
    url = `${base}/api/workers/${encodeURIComponent(id)}`
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(url, { method: 'DELETE', headers })

  // Si el servidor responde 204 No Content, devolver un objeto simple
  if (res.status === 204) {
    return { status: 204, ok: true }
  }

  // ⛔️ VALIDACIÓN ESPECIAL: ASIGNACIÓN ACTIVA (código 400)
  if (res.status === 400) {
    let message = "No se puede eliminar este trabajador porque tiene una asignación activa.";
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {}
    const err: any = new Error(message);
    err.status = 400;
    throw err;
  }

  // Manejo general de errores
  if (!res.ok) {
    let parsedBody: any = null
    let rawBody = ''
    try {
      parsedBody = await res.json()
      rawBody = JSON.stringify(parsedBody)
    } catch {
      rawBody = await res.text().catch(() => '')
    }

    let msg = `deleteWorker failed: ${res.status} ${res.statusText}`
    try {
      if (parsedBody) {
        if (parsedBody.error) msg += ` - ${parsedBody.error}`
        else if (parsedBody.message) msg += ` - ${parsedBody.message}`
        else msg += ` - ${rawBody}`
      } else if (rawBody) {
        msg += ` - ${rawBody}`
      }
    } catch (_) { }

    const err: any = new Error(msg)
    err.status = res.status
    err.statusText = res.statusText
    err.url = url
    err.body = parsedBody ?? rawBody
    throw err
  }

  // Intentar devolver JSON (si existe)
  try {
    return await res.json()
  } catch {
    return { status: res.status, ok: res.ok }
  }
}

export default deleteWorker
