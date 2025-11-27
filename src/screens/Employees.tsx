import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import type { Employee } from '../models'
import { getWorkers, deleteWorker, updateWorker, createWorker } from '../api'
import './Employees.css'
import Header from '../components/Header'

class ModalErrorBoundary extends React.Component<any, { hasError: boolean; error?: any }> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: undefined }
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error }
  }
  componentDidCatch(error: any, info: any) {
    console.error('Error rendering modal:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="modal-overlay">
          <div className="modal-content">
            <h4>Error mostrando datos</h4>
            <p>Ocurrió un error al mostrar los detalles del trabajador.</p>
            <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}>{String(this.state.error)}</pre>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="close-btn" onClick={() => { if (this.props.onClose) this.props.onClose() }}>Cerrar</button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function EmployeesScreen() {
  const { token, isLoading } = useAuth()
  const navigate = useNavigate()

  const [workers, setWorkers] = useState<Employee[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchWorkers, setSearchWorkers] = useState('')

  // Modal
  const [modalWorker, setModalWorker] = useState<Employee | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editName, setEditName] = useState('')
  const [editSecondName, setEditSecondName] = useState<string | null>(null)
  const [editLastname, setEditLastname] = useState('')
  const [editSecondLastname, setEditSecondLastname] = useState<string | null>(null)
  const [editRole, setEditRole] = useState('')
  const [editEmail, setEditEmail] = useState<string | null>(null)
  const [editPhoneNumber, setEditPhoneNumber] = useState<string | number | null>(null)
  const [editFechaNacimiento, setEditFechaNacimiento] = useState<string | null>(null)
  const [editStatus, setEditStatus] = useState<string | null>(null)
  const [editPhotoUrl, setEditPhotoUrl] = useState<string | null>(null)
  const [editAssignedVehicleId, setEditAssignedVehicleId] = useState<string | null>(null)

  // Cargar trabajadores
  useEffect(() => {
    if (isLoading) return
    if (!token) {
      navigate('/login')
      return
    }

    const loadWorkers = async () => {
      setLoading(true)
      setError(null)
      try {
        const items = await getWorkers(token)
        setWorkers(items)
      } catch (e: any) {
        setError(e?.message || 'Error cargando trabajadores')
        setWorkers([])
      } finally {
        setLoading(false)
      }
    }

    loadWorkers()
  }, [token, isLoading, navigate])

  const safeWorkers = workers || []
  const renderVal = (v: any) => {
    if (v === null || v === undefined) return '—'
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v)
    if (Array.isArray(v)) return v.map(i => (typeof i === 'object' ? JSON.stringify(i) : String(i))).join(', ')
    try {
      return JSON.stringify(v)
    } catch {
      return String(v)
    }
  }

  const filteredWorkers = safeWorkers.filter(w =>
    w.name.toLowerCase().includes(searchWorkers.toLowerCase()) ||
    (w.email || '').toLowerCase().includes(searchWorkers.toLowerCase())
  )

  // Eliminar
  const handleDelete = async (id: string) => {
    if (!token) return alert('No autorizado')
    if (!confirm('¿Seguro que deseas eliminar este trabajador?')) return

    try {
      await deleteWorker(id, token)
      setWorkers(prev => (prev ? prev.filter(w => w.id !== id) : prev))
      setModalWorker(null)
      alert('Trabajador eliminado correctamente')
    } catch (e: any) {
      alert(e?.message || 'No se pudo eliminar el trabajador')
    }
  }

  // edit initialization and save
  useEffect(() => {
    if (!modalWorker) {
      setEditMode(false)
      setEditName('')
      setEditSecondName(null)
      setEditLastname('')
      setEditSecondLastname(null)
      setEditRole('')
      setEditEmail(null)
      setEditPhoneNumber(null)
      setEditFechaNacimiento(null)
      setEditStatus(null)
      setEditPhotoUrl(null)
      setEditAssignedVehicleId(null)
      return
    }
    setEditMode(false)
    setEditName(modalWorker.name || '')
    setEditSecondName((modalWorker as any).secondName ?? null)
    setEditLastname((modalWorker as any).lastname || '')
    setEditSecondLastname((modalWorker as any).secondLastname ?? null)
    setEditRole(modalWorker.role || '')
    setEditEmail(modalWorker.email ?? null)
    setEditPhoneNumber((modalWorker as any).phoneNumber ?? null)
    setEditFechaNacimiento((modalWorker as any).fechaNacimiento ?? null)
    setEditStatus((modalWorker as any).status ?? null)
    setEditPhotoUrl((modalWorker as any).photoUrl ?? null)
    setEditAssignedVehicleId(modalWorker.assignedVehicleId ?? null)
  }, [modalWorker])

  const handleSave = async () => {
    if (!modalWorker) return
    if (!token) return alert('No autorizado')
    try {
      const payload = {
        name: editName,
        secondName: editSecondName,
        lastname: editLastname,
        secondLastname: editSecondLastname,
        role: editRole,
        email: editEmail,
        phoneNumber: editPhoneNumber,
        fechaNacimiento: editFechaNacimiento,
        status: editStatus,
        photoUrl: editPhotoUrl,
        assignedVehicleId: editAssignedVehicleId,
      }
      const updated = await updateWorker(modalWorker.id, payload, token)
      const updatedItem = (updated && (updated.data || updated.worker || updated)) || { ...modalWorker, ...payload }
      setWorkers(prev => (prev ? prev.map(w => (w.id === modalWorker.id ? { ...w, ...updatedItem } : w)) : prev))
      setModalWorker({ ...(modalWorker || {}), ...updatedItem } as Employee)
      setEditMode(false)
      alert('Trabajador actualizado')
    } catch (e: any) {
      alert(e?.message || 'No se pudo actualizar el trabajador')
    }
  }

  if (isLoading) return <div>Cargando sesión...</div>

  return (
    <div className="panel">
      <Header
        title="Trabajadores"
        centerSlot={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="tab tab-active">Activos</button>
            <button className="tab">Inactivos</button>
          </div>
        }
        rightSlot={<button className="btn">Invitar</button>}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h3>
          {workers === null ? 'Trabajadores (cargando...)'
            : `Trabajadores (mostrados: ${filteredWorkers.length} / total: ${workers.length})`}
        </h3>

        <input
          placeholder="Buscar trabajadores..."
          value={searchWorkers}
          onChange={e => setSearchWorkers(e.target.value)}
          style={{ padding: '6px 8px' }}
        />

        <button className="card-button" onClick={() => {
          // abrir modal en modo crear
          setCreating(true)
          setModalWorker(null)
          setEditMode(true)
          // inicializar campos vacíos
          setEditName('')
          setEditSecondName(null)
          setEditLastname('')
          setEditSecondLastname(null)
          setEditRole('')
          setEditEmail(null)
          setEditPhoneNumber(null)
          setEditFechaNacimiento(null)
          setEditStatus(null)
          setEditPhotoUrl(null)
          setEditAssignedVehicleId(null)
        }}>Agregar trabajador</button>
      </div>

      {loading && <p>Cargando trabajadores...</p>}
      {error && <p className="form-error">{error}</p>}

      <div className="card-grid" style={{ marginTop: 12 }}>
        {filteredWorkers.map(w => (
          <div key={w.id} className="worker-card">
            <div className="card-role">{renderVal(w.role)}</div>
            <div className="card-name">{renderVal(w.name)}</div>
            <div className="card-assignment">Asignación: {renderVal(w.assignedVehicleId) || 'Ninguno'}</div>
            <div className="card-id">{renderVal(w.id)}</div>

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="card-button" onClick={() => setModalWorker(w)}>Ver más</button>
              <button className="danger-btn" onClick={() => handleDelete(w.id)}>Eliminar</button>
            </div>
          </div>
        ))}

        {filteredWorkers.length === 0 && !loading && (
          <p className="muted">No se encontraron trabajadores.</p>
        )}
      </div>

      {/* Modal */}
      {(modalWorker || creating) && (
        <ModalErrorBoundary onClose={() => { setModalWorker(null); setCreating(false); }}>
          <div className="modal-overlay" onClick={() => { setModalWorker(null); setCreating(false); }}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              {(!editMode && !creating) ? (
              <>
                {typeof (modalWorker as any).photoUrl === 'string' && (modalWorker as any).photoUrl.trim() !== '' && (
                  <div style={{ textAlign: 'center', marginBottom: 8 }}>
                    <img src={(modalWorker as any).photoUrl} alt={String((modalWorker as any).name || '')} style={{ maxWidth: 160, borderRadius: 8 }} />
                  </div>
                )}
                <h4>{renderVal([modalWorker!.name, (modalWorker as any)!.secondName, (modalWorker as any)!.lastname, (modalWorker as any)!.secondLastname].filter(Boolean).join(' '))}</h4>
                <p><strong>Rol:</strong> {renderVal(modalWorker!.role)}</p>
                <p><strong>Email:</strong> {renderVal(modalWorker!.email)}</p>
                <p><strong>Teléfono:</strong> {renderVal((modalWorker as any)!.phoneNumber)}</p>
                <p><strong>Fecha de nacimiento:</strong> {((modalWorker as any)!.fechaNacimiento) ? (() => { try { return new Date((modalWorker as any)!.fechaNacimiento).toLocaleDateString() } catch { return renderVal((modalWorker as any)!.fechaNacimiento) } })() : '—'}</p>
                <p><strong>Estado:</strong> {renderVal((modalWorker as any)!.status)}</p>
                <p><strong>Asignación:</strong> {renderVal(modalWorker!.assignedVehicleId) || 'Ninguno'}</p>
                <p><strong>ID:</strong> {renderVal(modalWorker!.id)}</p>
                <p className="muted"><strong>Creado:</strong> {renderVal(modalWorker!.createdAt)}</p>

                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="card-button" onClick={() => setEditMode(true)}>Actualizar</button>
                  <button className="danger-btn" onClick={() => handleDelete(modalWorker!.id)}>Eliminar</button>
                  <button className="close-btn" onClick={() => { setModalWorker(null); setCreating(false); }}>Cerrar</button>
                </div>
              </>
            ) : (
              <>
                <h4>{creating ? 'Agregar trabajador' : 'Editar trabajador'}</h4>
                <div className="modal-form">
                  <label>
                    Nombre
                    <input value={editName} onChange={e => setEditName(e.target.value)} />
                  </label>
                  <label>
                    Segundo nombre
                    <input value={editSecondName ?? ''} onChange={e => setEditSecondName(e.target.value || null)} />
                  </label>
                  <label>
                    Apellido
                    <input value={editLastname} onChange={e => setEditLastname(e.target.value)} />
                  </label>
                  <label>
                    Segundo apellido
                    <input value={editSecondLastname ?? ''} onChange={e => setEditSecondLastname(e.target.value || null)} />
                  </label>
                  <label>
                    Rol
                    <input value={editRole} onChange={e => setEditRole(e.target.value)} />
                  </label>
                  <label>
                    Email
                    <input value={editEmail ?? ''} onChange={e => setEditEmail(e.target.value || null)} />
                  </label>
                  <label>
                    Teléfono
                    <input value={editPhoneNumber ?? ''} onChange={e => setEditPhoneNumber(e.target.value || null)} />
                  </label>
                  <label>
                    Fecha de nacimiento
                    <input type="date" value={editFechaNacimiento ? editFechaNacimiento.split('T')[0] : ''} onChange={e => setEditFechaNacimiento(e.target.value || null)} />
                  </label>
                  <label>
                    Estado
                    <input value={editStatus ?? ''} onChange={e => setEditStatus(e.target.value || null)} />
                  </label>
                  <label>
                    Photo URL
                    <input value={editPhotoUrl ?? ''} onChange={e => setEditPhotoUrl(e.target.value || null)} />
                  </label>
                  <label>
                    Asignación (vehicle id)
                    <input value={editAssignedVehicleId ?? ''} onChange={e => setEditAssignedVehicleId(e.target.value || null)} />
                  </label>
                </div>

                <div className="modal-actions">
                  {creating ? (
                    <>
                      <button className="card-button" onClick={async () => {
                        if (!token) return alert('No autorizado')
                        try {
                          const payload = {
                            name: editName,
                            secondName: editSecondName,
                            lastname: editLastname,
                            secondLastname: editSecondLastname,
                            role: editRole,
                            email: editEmail,
                            phoneNumber: editPhoneNumber,
                            fechaNacimiento: editFechaNacimiento,
                            status: editStatus,
                            photoUrl: editPhotoUrl,
                            assignedVehicleId: editAssignedVehicleId,
                          }
                          const created = await createWorker(payload as any, token)
                          const createdItem = (created && (created.data || created.worker || created)) || { ...payload, id: (created && created.id) || '' }
                          setWorkers(prev => (prev ? [createdItem as Employee, ...prev] : [createdItem as Employee]))
                          setModalWorker(createdItem as Employee)
                          setCreating(false)
                          setEditMode(false)
                          alert('Trabajador creado')
                        } catch (e: any) {
                          alert(e?.message || 'No se pudo crear el trabajador')
                        }
                      }}>Crear</button>
                      <button className="close-btn" onClick={() => { setCreating(false); setModalWorker(null); setEditMode(false); }}>Cancelar</button>
                    </>
                  ) : (
                    <>
                      <button className="card-button" onClick={() => handleSave()}>Guardar</button>
                      <button className="close-btn" onClick={() => setEditMode(false)}>Cancelar</button>
                      <button className="danger-btn" onClick={() => modalWorker && handleDelete(modalWorker.id)}>Eliminar</button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        </ModalErrorBoundary>
      )}
    </div>
  )
}
