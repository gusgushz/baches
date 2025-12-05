import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { getVehicles, deleteVehicle, createVehicle, updateVehicle } from '../api'
import "../styles/Vehicles.css"
import Header from '../components/Header';
import Swal from 'sweetalert2';
import { Pencil, Trash2 } from "lucide-react";

export default function VehiclesScreen() {
  const { token, isLoading } = useAuth()
  const navigate = useNavigate()

  const [vehicles, setVehicles] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)

  const [isCreating, setIsCreating] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<any | null>(null)

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

  useEffect(() => {
    if (!token) navigate('/login')
    if (!isLoading && token) load()
  }, [isLoading, token])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const menu = document.querySelector(".dropdown-opciones-vehiculos");
      const btn = document.querySelector(".btn-opciones-vehiculos");

      // Si se hace clic fuera del menú y del botón -> cerrar
      if (menu && !menu.contains(e.target as Node) && !btn?.contains(e.target as Node)) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const load = async () => {
    setLoading(true)
    try {
      const items = await getVehicles(token!)
      setVehicles(items)
    } catch {
      setError('Error cargando vehículos')
      setVehicles([])
    } finally { setLoading(false) }
  }


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

      // Try to extract created vehicle from response
      const created = res && (res.vehicle || res.data || res || null)
      const newVehicle = (created && typeof created === 'object') ? created : { id: String(Date.now()), ...payload, status: 'active' }

      setVehicles(prev => [newVehicle, ...(prev || [])])
      setIsCreating(false)
      resetVehicleForm()
      await Swal.fire({
        icon: 'success',
        title: 'Vehículo creado',
        text: 'El vehículo se registró correctamente.',
        timer: 1500,
        showConfirmButton: false,
      })
    } catch (e: any) {
      console.error('createVehicle error', e)
      await Swal.fire({ icon: 'error', title: 'Error', text: e?.message || 'No se pudo crear el vehículo' })
    }
  }

  const handleUpdate = async () => {
    if (!editingVehicle) return
    const payload = { licensePlate, model, year, color, corporation, status }
    try {
      const res = await updateVehicle(editingVehicle.id, payload, token!)

      const updated = res && (res.vehicle || res.data || res || null)
      const updatedVehicle = (updated && typeof updated === 'object') ? updated : { ...editingVehicle, ...payload }

      setVehicles(prev => prev?.map(v => v.id === editingVehicle.id ? updatedVehicle : v) || prev)
      setEditingVehicle(null)
      resetVehicleForm()
      await Swal.fire({
        icon: 'success',
        title: 'Vehículo actualizado',
        text: 'Los cambios se guardaron correctamente.',
        timer: 1500,
        showConfirmButton: false,
      })
    } catch (e: any) {
      console.error('updateVehicle error', e)
      await Swal.fire({ icon: 'error', title: 'Error', text: e?.message || 'No se pudo actualizar el vehículo' })
    }
  }

  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: '¿Eliminar este vehículo?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33'
    })

    if (!confirm.isConfirmed) return

    try {
      await deleteVehicle(id, token!)
      setVehicles(prev => prev?.filter(v => v.id !== id) || [])
      await Swal.fire({
        icon: 'success',
        title: 'Eliminado',
        text: 'El vehículo fue eliminado correctamente.',
        timer: 1500,
        showConfirmButton: false,
      })
    } catch {
      await Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar el vehículo' })
    }
  }

  const safe = (v: any) => v ?? '—'
  const filtered = (vehicles || []).filter(v => {
    const modelText = (v.model ?? '') + ' ' + (v.licensePlate ?? '')
    const matchesSearch = modelText.toLowerCase().includes((search ?? '').toLowerCase())
    const matchesStatus = statusFilter ? ((v.status ?? '') === statusFilter) : true
    return matchesSearch && matchesStatus
  })


  return (
    <div className="vehicles-page">

      <Header
        leftSlot={
          <h2 className="vehicles-title">Vehículos ({filtered.length})</h2>
        }
        centerSlot={
          <div className="header-search">
            <input
              placeholder="Buscar vehículos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        }
        rightSlot={
          <button className="button-agregar-vehiculo" onClick={() => { resetVehicleForm(); setIsCreating(true); }}>+ Agregar</button>
        }
      />

      <div className="filter-status-vehicles">
        <select value={statusFilter ?? ''} onChange={e => setStatusFilter(e.target.value === '' ? null : e.target.value)} style={{ padding: '6px 8px', borderRadius: 6 }}>
          <option value="">Todos</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
          <option value="maintenance">Mantenimiento</option>
        </select>
      </div>


      <div className="vehicles-table-wrapper">
        <table className="vehicles-table">
          <thead>
            <tr>
              <th>Placa</th>
              <th>Modelo</th>
              <th>Año</th>
              <th>Color</th>
              <th>Corporación</th>
              <th>Estado</th>
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
                <input maxLength={7} value={licensePlate} onChange={e => setLicensePlate(e.target.value)} />
              </label>
              <label>
                Modelo
                <input value={model} onChange={e => setModel(e.target.value)} />
              </label>
              <label>
                Año
                <input maxLength={4} value={year ?? ''} onChange={e => setYear(e.target.value === '' ? null : Number(e.target.value))} />
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
            </div>

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
            </div>
          </div>
        </div>
      )}

    </div>

  )
}
