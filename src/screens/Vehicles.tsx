import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
<<<<<<< HEAD
import { getVehicles, deleteVehicle, createVehicle} from '../api'
import './Vehicles.css'
=======
import { getVehicles, deleteVehicle, createVehicle, updateVehicle } from '../api'
import "../styles/Vehicles.css"
>>>>>>> 107fa45616f1412b7f53602e8dd0fd9ad9a9f790
import Header from '../components/Header';
import Swal from 'sweetalert2';
import { Pencil, Trash2 } from "lucide-react";

export default function VehiclesScreen() {
  const { token, isLoading } = useAuth()
  const navigate = useNavigate()

  const [vehicles, setVehicles] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search] = useState('')

  const [modalVehicle, setModalVehicle] = useState<any | null>(null)
  const [isCreating, setIsCreating] = useState(false)

<<<<<<< HEAD
  // Campos SOLO para crear
  const [newLicensePlate, setNewLicensePlate] = useState<string>('')
  const [newModel, setNewModel] = useState<string>('')
  const [newYear, setNewYear] = useState<number | string | null>(null)
  const [newColor, setNewColor] = useState<string | null>(null)
  const [newCorporation, setNewCorporation] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState<string>('')
=======
  const [licensePlate, setLicensePlate] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState<number | string | null>(null)
  const [color, setColor] = useState<string | null>('')
  const [corporation, setCorporation] = useState<string | null>('')
  const [status, setStatus] = useState<string | null>('active')

  const resetVehicleForm = () => {
    setLicensePlate('')
    setModel('')
    setYear(null)
    setColor(null)
    setCorporation(null)
    setStatus('active')
  }
>>>>>>> 107fa45616f1412b7f53602e8dd0fd9ad9a9f790

  useEffect(() => {
    if (isLoading) return
    if (!token) {
      navigate('/login')
      return
    }

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const items = await getVehicles(token)
        setVehicles(items)
      } catch (e: any) {
        setError(e?.message || 'Error cargando vehículos')
        setVehicles([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [token, isLoading, navigate])

  

  const safe = (v: any) => {
    if (v === null || v === undefined) return '—'
    return String(v)
  }

<<<<<<< HEAD
  const list = vehicles || []
  const filtered = list.filter(v => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      (String(v.make || '') + ' ' + String(v.model || '') + ' ' + String(v.licensePlate || '')).toLowerCase().includes(q) ||
      String(v.id || '').toLowerCase().includes(q)
    )
  })
=======
  const openEdit = (v: any) => {
    setEditingVehicle(v)
    setLicensePlate(v.licensePlate)
    setModel(v.model)
    setYear(v.year)
    setColor(v.color)
    setCorporation(v.corporation)
    setStatus(v.status ?? 'active')
  }

  const handleCreate = async () => {
    const payload = { licensePlate, model, year, color, corporation }
    try {
      const res = await createVehicle(payload, token!)
      setVehicles(prev => [res, ...(prev || [])])
      setIsCreating(false)
      alert('Vehículo creado')
    } catch { alert('Error creando') }
  }

  const handleUpdate = async () => {
    if (!editingVehicle) return
    const payload = { licensePlate, model, year, color, corporation, status }
    try {
      const res = await updateVehicle(editingVehicle.id, payload, token!)
      setVehicles(prev => prev?.map(v => v.id === editingVehicle.id ? res : v) || prev)
      setEditingVehicle(null)
      alert('Vehículo actualizado')
    } catch { alert('Error actualizando') }
  }
>>>>>>> 107fa45616f1412b7f53602e8dd0fd9ad9a9f790

  const handleDelete = async (id: string) => {
    if (!token) return alert('No autorizado')
    if (!confirm('¿Seguro que deseas eliminar este vehículo?')) return
    try {
      await deleteVehicle(id, token)
      setVehicles(prev => prev ? prev.filter(x => x.id !== id) : prev)
      setModalVehicle(null)
      alert('Vehículo eliminado')
    } catch (e: any) {
      alert(e?.message || 'Error eliminando vehículo')
    }
  }

  // openCreate removed from header (creation modal still available via other UI)

  //Agregar vehículo
  const handleCreate = async () => {
    if (!token) return alert('No autorizado')

    const payload = {
      licensePlate: newLicensePlate,
      model: newModel || null,
      year: newYear ?? null,
      color: newColor ?? null,
      corporation: newCorporation ?? null,
    }

    try {
      const res = await createVehicle(payload, token)
      console.debug('createVehicle result:', res)
      let created = res?.data || res?.vehicle || res
      if (!created || typeof created !== 'object') {
        created = { ...payload, id: String(Date.now()) }
      }

      setVehicles(prev => prev ? [created, ...prev] : [created])
      setIsCreating(false)
      alert('Vehículo creado')
    } catch (e: any) {
      console.error('handleCreate error:', e)
      alert(e?.message || 'Error creando vehículo')
    }
  }

  return (
    <div className="page">
      <Header
        title="Vehículos"
        centerSlot={<span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Vehículos</span>}
        centered={true}
      />

      <div className="panel">
        <div className="panel__meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <h3 style={{ margin: 0 }}>{vehicles === null ? 'Vehículos (cargando...)' : `Vehículos (mostrados: ${filtered.length} / total: ${vehicles.length})`}</h3>
        </div>

<<<<<<< HEAD
        {loading && <p>Cargando vehículos...</p>}
        {error && <p className="form-error">{error}</p>}

        <div className="card-grid" style={{ marginTop: 12 }}>
          {filtered.map(v => (
            <div key={v.id} className="vehicle-card">
              <div className="card-title">{safe(v.model)}</div>
              <div className="card-sub">Placa: {safe(v.licensePlate)}</div>
              <div className="card-sub">Asignado: {safe(v.assignedTo)}</div>

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="card-button" onClick={() => setModalVehicle(v)}>Ver más</button>
              </div>
=======
      <button className="button-agregar-vehiculo" onClick={() => { resetVehicleForm(); setIsCreating(true); }}>
        + Agregar
      </button>

      {/* 🔥 TABLA A LO ANCHO */}
      <div className="vehicles-table-wrapper">
        <table className="vehicles-table">
          <thead>
            <tr>
              <th>Placa</th>
              <th>Modelo</th>
              <th>Año</th>
              <th>Color</th>
              <th>Corporación</th>
              <th>Estatus</th>
              <th>Opciones</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map(v => (
              <tr key={v.id}>
                <td>{safe(v.licensePlate)}</td>
                <td>{safe(v.model)}</td>
                <td>{safe(v.year)}</td>
                <td>{safe(v.color)}</td>
                <td>{safe(v.corporation)}</td>
                <td>
                  <span className={`status ${v.status ?? ''}`}>{safe(v.status)}</span>
                </td>

                <td style={{ position: "relative" }}>
                  <button className='btn-opciones-vehiculos' onClick={(e) => { e.stopPropagation(); setDropdownOpen(dropdownOpen === v.id ? null : v.id); }}>...</button>

                  {dropdownOpen === v.id && (
                    <div className="dropdown-opciones-vehiculos">
                      <button className='btn-put-vehiculos' onClick={() => { openEdit(v); setDropdownOpen(null); }}>
                        <Pencil size={16} style={{ marginRight: 6 }} />
                        Actualizar
                      </button>

                      <button className="btn-delete-vehiculos" onClick={async () => { await handleDelete(v.id); setDropdownOpen(null); }}>
                        <Trash2 size={16} style={{ marginRight: 6 }} />
                        Eliminar
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal para crear/editar vehículo */}
      {(editingVehicle || isCreating) && (
        <div className="modal-overlay-vehicle" onClick={() => { setEditingVehicle(null); setIsCreating(false); resetVehicleForm(); }}>
          <div className="modal-content-vehicle" onClick={e => e.stopPropagation()}>
            <h4>{isCreating ? 'Agregar vehículo' : 'Editar vehículo'}</h4>

            <div className="modal-form">
              <label>
                Placa
                <input value={licensePlate} onChange={e => setLicensePlate(e.target.value)} />
              </label>
              <label>
                Modelo
                <input value={model} onChange={e => setModel(e.target.value)} />
              </label>
              <label>
                Año
                <input type="number" value={year ?? ''} onChange={e => setYear(e.target.value === '' ? null : Number(e.target.value))} />
              </label>
              <label>
                Color
                <input value={color ?? ''} onChange={e => setColor(e.target.value || null)} />
              </label>
              <label>
                Corporación
                <input value={corporation ?? ''} onChange={e => setCorporation(e.target.value || null)} />
              </label>
              {!isCreating && (
                <label>
                  Estado
                  <select value={status ?? 'active'} onChange={e => setStatus(e.target.value || null)}>
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                    <option value="maintenance">maintenance</option>
                  </select>
                </label>
              )}
>>>>>>> 107fa45616f1412b7f53602e8dd0fd9ad9a9f790
            </div>
          ))}

<<<<<<< HEAD
          {filtered.length === 0 && !loading && (
            <p className="muted">No se encontraron vehículos.</p>
          )}
        </div>

        {/* Modal de Ver */}
        {modalVehicle && !isCreating && (
          <div className="modal-overlay" onClick={() => setModalVehicle(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h4>{safe(modalVehicle.model)}</h4>
              <p><strong>Placa:</strong> {safe(modalVehicle.licensePlate)}</p>
              <p><strong>Año:</strong> {safe(modalVehicle.year)}</p>
              <p><strong>Color:</strong> {safe(modalVehicle.color)}</p>
              <p><strong>Coorporacion:</strong> {safe(modalVehicle.corporation)}</p>
              <p><strong>Estatus:</strong> {safe(modalVehicle.status)}</p>

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="delete-btn" onClick={() => handleDelete(modalVehicle.id)}>Eliminar</button>
                <button className="close-btn" onClick={() => setModalVehicle(null)}>Cerrar</button>
              </div>
=======
            <div className="modal-actions">
                  {isCreating ? (
                <>
                  <button className="card-button" onClick={async () => { await handleCreate(); resetVehicleForm(); }}>Crear</button>
                  <button className="close-btn" onClick={() => { setIsCreating(false); resetVehicleForm(); }}>Cancelar</button>
                </>
              ) : (
                <>
                  <button className="card-button" onClick={async () => { await handleUpdate() }}>Guardar</button>
                  <button className="close-btn" onClick={() => { setEditingVehicle(null); resetVehicleForm(); }}>Cancelar</button>
                </>
              )}
>>>>>>> 107fa45616f1412b7f53602e8dd0fd9ad9a9f790
            </div>
          </div>
        )}

        {/* Modal de Crear */}
        {isCreating && (
          <div className="modal-overlay" onClick={() => setIsCreating(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h4>Crear vehículo</h4>

              <div style={{ display: 'grid', gap: 8 }}>
                <label>Placa
                  <input value={newLicensePlate} onChange={e => setNewLicensePlate(e.target.value)} />
                </label>

                <label>Modelo
                  <input value={newModel} onChange={e => setNewModel(e.target.value)} />
                </label>

                <label>Año
                  <input type="number" value={newYear ?? ''} onChange={e => setNewYear(e.target.value ? Number(e.target.value) : null)} />
                </label>

                <label>Color
                  <input value={newColor ?? ''} onChange={e => setNewColor(e.target.value || null)} />
                </label>

                <label>Corporación
                  <input value={newCorporation ?? ''} onChange={e => setNewCorporation(e.target.value || null)} />
                </label>

                <label>Estatus
                  <input value={newStatus} onChange={e => setNewStatus(e.target.value)} />
                </label>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="card-button" onClick={handleCreate}>Crear</button>
                <button className="close-btn" onClick={() => setIsCreating(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
