import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { getVehicles, deleteVehicle, createVehicle, updateVehicle } from '../api'
import './Vehicles.css'
import './Employees.css'
import Header from '../components/Header';

export default function VehiclesScreen() {
  const { token, isLoading } = useAuth()
  const navigate = useNavigate()

  const [vehicles, setVehicles] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)

  const [isCreating, setIsCreating] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<any | null>(null)

  const [licensePlate, setLicensePlate] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState<number | string | null>(null)
  const [color, setColor] = useState<string | null>('')
  const [corporation, setCorporation] = useState<string | null>('')

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
    const payload = { licensePlate, model, year, color, corporation }
    try {
      const res = await updateVehicle(editingVehicle.id, payload, token!)
      setVehicles(prev => prev?.map(v => v.id === editingVehicle.id ? res : v) || prev)
      setEditingVehicle(null)
      alert('Vehículo actualizado')
    } catch { alert('Error actualizando') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este vehículo?')) return
    try {
      await deleteVehicle(id, token!)
      setVehicles(prev => prev?.filter(v => v.id !== id) || [])
      alert('Vehículo eliminado')
    } catch { alert('Error eliminando') }
  }

  const safe = (v: any) => v ?? '—'
  const filtered = (vehicles || []).filter(v => (v.model + ' ' + v.licensePlate).toLowerCase().includes(search.toLowerCase()))


  return (
    <div className="vehicles-page">

      <Header
        title="Vehículos"
        centerSlot={
          <div className="header-search">
            <input
              placeholder="Buscar vehículos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        }

      />

      <h3 className="vehicles-title">Vehículos ({filtered.length})</h3>

      <button className="button-agregar-vehiculo" onClick={() => setIsCreating(true)}>
        + Agregar
      </button>

      {/* 🔥 TABLA A LO ANCHO */}
      <div className="vehicles-table-wrapper">
        <table className="vehicles-table">
          <thead>
            <tr>
              <th>Placa</th><th>Modelo</th><th>Año</th><th>Color</th>
              <th>Corporación</th><th>Estatus</th><th>Opciones</th>
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
                <td>{safe(v.status)}</td>

                <td style={{ position: "relative" }}>
                  <button className='btn-opciones-vehiculos' onClick={() => setDropdownOpen(dropdownOpen === v.id ? null : v.id)}>...</button>

                  {dropdownOpen === v.id && (
                    <div className="dropdown-opciones-vehiculos">
                      <button onClick={() => openEdit(v)}>Actualizar</button>
                      <button className="btn-delete-vehiculos" onClick={() => handleDelete(v.id)}>Eliminar</button>
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
        <div className="modal-overlay" onClick={() => { setEditingVehicle(null); setIsCreating(false); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
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
            </div>

            <div className="modal-actions">
              {isCreating ? (
                <>
                  <button className="card-button" onClick={async () => { await handleCreate() }}>Crear</button>
                  <button className="close-btn" onClick={() => { setIsCreating(false) }}>Cancelar</button>
                </>
              ) : (
                <>
                  <button className="card-button" onClick={async () => { await handleUpdate() }}>Guardar</button>
                  <button className="close-btn" onClick={() => setEditingVehicle(null)}>Cancelar</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>

  )
}
