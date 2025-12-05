import { useEffect, useState } from 'react'
import Header from '../components/Header'
import { useAuth } from '../contexts/AuthContext'
import type { Employee } from '../models/Employees'
import getWorkers from '../api/getWorkers'
import deleteWorker from '../api/deleteWorker'
import createWorker from '../api/createWorker'
import updateWorker from '../api/updateWorker'
import "../styles/Employees.css"
import Swal from 'sweetalert2';
import { Pencil, Trash2 } from "lucide-react";

export default function EmployeesScreen() {
    const { token } = useAuth()
    const [workers, setWorkers] = useState<Employee[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [dropdownOpen, setDropdownOpen] = useState<Employee['id'] | null>(null)
    const [deletingId, setDeletingId] = useState<Employee['id'] | null>(null)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string | null>(null)
    //Agregar trabajador
    const [createOpen, setCreateOpen] = useState(false)
    const [creating, setCreating] = useState(false)
    const [createError, setCreateError] = useState<string | null>(null)
    const [newName, setNewName] = useState('')
    const [newSecondName, setNewSecondName] = useState<string | null>(null)
    const [newLastname, setNewLastname] = useState('')
    const [newSecondLastname, setNewSecondLastname] = useState<string | null>(null)
    const [newRole, setNewRole] = useState('')
    const [newEmail, setNewEmail] = useState<string | null>(null)
    const [newPhone, setNewPhone] = useState<string | number | null>(null)
    const [newFechaNacimiento, setNewFechaNacimiento] = useState<string | null>(null)
    const [newPassword, setNewPassword] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false);
    const [passwordErrorList, setPasswordErrorList] = useState<string[]>([]);
    
    const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
    const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);
    // Edit worker
    const [editOpen, setEditOpen] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)
    const [editCreating, setEditCreating] = useState(false)
    const [editError, setEditError] = useState<string | null>(null)
    const [editName, setEditName] = useState('')
    const [editSecondName, setEditSecondName] = useState<string | null>(null)
    const [editLastname, setEditLastname] = useState('')
    const [editSecondLastname, setEditSecondLastname] = useState<string | null>(null)
    const [editRole, setEditRole] = useState<string | null>(null)
    const [editEmail, setEditEmail] = useState<string | null>(null)
    const [editPhone, setEditPhone] = useState<string | number | null>(null)
    const [editFechaNacimiento, setEditFechaNacimiento] = useState<string | null>(null)
    const [editStatus, setEditStatus] = useState<string | null>('active')
    const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
    const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
    const [editPassword, setEditPassword] = useState<string | null>(null)
    const [editShowPassword, setEditShowPassword] = useState(false)
    const [editPasswordErrorList, setEditPasswordErrorList] = useState<string[]>([])


    const resetCreateForm = () => {
        setNewName(''); setNewSecondName(null); setNewLastname(''); setNewSecondLastname(null); setNewRole(''); setNewEmail(null); setNewPhone(null); setNewFechaNacimiento(null); setNewPassword(null); setNewPhotoFile(null); setNewPhotoPreview(null); setPasswordErrorList([]); setShowPassword(false); setCreateError(null); setCreating(false);
    }

    const resetEditForm = () => {
        setEditId(null); setEditName(''); setEditSecondName(null); setEditLastname(''); setEditSecondLastname(null); setEditRole(null); setEditEmail(null); setEditPhone(null); setEditFechaNacimiento(null); setEditPassword(null); setEditStatus('active'); setEditPhotoFile(null); setEditPhotoPreview(null); setEditPasswordErrorList([]); setEditShowPassword(false); setEditError(null); setEditCreating(false);
    }

    const openEdit = (w: Employee) => {
        // populate edit form
        setEditId(w.id || null)
        setEditName(w.name || '')
        setEditSecondName((w as any).secondName ?? null)
        setEditLastname(w.lastname || '')
        setEditSecondLastname((w as any).secondLastname ?? null)
        setEditRole((w as any).role ?? null)
        setEditEmail(w.email ?? null)
        setEditPhone((w as any).phoneNumber ?? null)
        setEditFechaNacimiento((w as any).fechaNacimiento ?? null)
        setEditStatus((w as any).status ?? 'active')
        setEditPhotoFile(null);
        setEditPhotoPreview((w as any).photoUrl ?? null)
        setEditPassword(null)
        setEditPasswordErrorList([])
        setEditShowPassword(false)
        setEditError(null)
        setEditOpen(true)
        setDropdownOpen(null)
    }

    const handleDelete = async (id: Employee['id']) => {
        const confirm = await Swal.fire({
            title: '¿Eliminar este trabajador?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#d33',
        });

        // Si el usuario cancela
        if (!confirm.isConfirmed) return;
        if (!id) return;

        try {
            setDeletingId(id);
            setError(null);

            await deleteWorker(id, token);

            // Actualizar UI
            setWorkers(prev => prev.filter(w => w.id !== id));

            // Éxito
            await Swal.fire({
                icon: 'success',
                title: 'Eliminado',
                text: 'El trabajador fue eliminado correctamente.',
                timer: 1500,
                showConfirmButton: false
            });

        } catch (e: any) {
            console.error('deleteWorker error', e);

            const message = e?.message || 'Error eliminando trabajador';

            setError(message);

            // Error visual
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: message
            });

        } finally {
            setDeletingId(null);
            setDropdownOpen(null);
        }
    };

    const handleCreate = async () => {
        // simple validation
        setCreateError(null)
        if (!newName || !newLastname) { setCreateError('Nombre y apellido son obligatorios'); return }
        if (!token) { setCreateError('No autorizado'); return }
        setCreating(true)
        setCreateError(null)
        setError(null)

        try {
            const payload: any = {}
            if (newName) payload.name = newName
            if (newSecondName) payload.secondName = newSecondName
            if (newLastname) payload.lastname = newLastname
            if (newSecondLastname) payload.secondLastname = newSecondLastname
            if (newRole && newRole !== '') payload.role = newRole === 'NULL' ? null : newRole
            if (newEmail) payload.email = newEmail
            if (newPhone) payload.phoneNumber = newPhone
            if (newFechaNacimiento) payload.fechaNacimiento = newFechaNacimiento
            if (newPassword) {
                const pwdError = validatePassword(newPassword);
                if (pwdError) {
                    setCreateError('La contraseña debe tener al menos 8 caracteres, incluyendo mayúsculas, minúsculas, números y símbolos.');
                    setCreating(false);
                    return;
                }
                payload.password = newPassword;
            }
            // No enviar el `status` al crear: el servidor debe asignar 'active' por defecto
            if (newPhotoFile && newPhotoPreview) {
                payload.photoUrl = newPhotoPreview;
            }

            const res = await createWorker(payload, token)

            // try extract created worker
            const created = (res && (res.worker || res.data || res || null))
            const newWorker = (created && typeof created === 'object') ? created : payload
            // normalize id
            const id = newWorker.id || newWorker._id || String(Date.now())
            setWorkers(prev => [{ id, role: newWorker.role || payload.role || '', email: newWorker.email || payload.email || '', name: newWorker.name || payload.name || '', secondName: newWorker.secondName ?? null, lastname: newWorker.lastname || payload.lastname || '', secondLastname: newWorker.secondLastname ?? null, phoneNumber: newWorker.phoneNumber ?? payload.phoneNumber ?? null, fechaNacimiento: newWorker.fechaNacimiento ?? payload.fechaNacimiento ?? null, passwordHash: newWorker.passwordHash ?? payload.passwordHash ?? null, status: newWorker.status ?? payload.status ?? 'active', photoUrl: newWorker.photoUrl ?? payload.photoUrl ?? null }, ...prev])

            // Mostrar éxito similar a tu ejemplo
            await Swal.fire({
                icon: 'success',
                title: 'Trabajador creado',
                text: 'El trabajador se registró correctamente.',
                timer: 1800,
                showConfirmButton: false,
            });

            // Cerrar modal
            setCreateOpen(false)

            // Refrescar lista desde servidor (opcional pero más fiable)
            try {
                const updated = await getWorkers(token)
                setWorkers(updated)
            } catch (_) {
                // si falla la recarga, mantener la inserción local ya hecha
            }

            // reset form
            setNewName(''); setNewSecondName(null); setNewLastname(''); setNewSecondLastname(null); setNewRole(''); setNewEmail(null); setNewPhone(null); setNewFechaNacimiento(null); setNewPassword(null); setNewPhotoFile(null); setNewPhotoPreview(null);

        } catch (e: any) {
            console.error('createWorker error', e)
            let userMessage = e?.message || 'Trabajador no creado'
            try {
                const body = e?.body ?? e?.response ?? null
                if (body) {
                    if (Array.isArray(body.details) && body.details.length > 0) {
                        const lines = body.details.map((d: any) => {
                            if (!d) return String(d)
                            if (typeof d === 'string') return d
                            if (d.message) return d.message
                            if (d.path && d.message) return `${d.path}: ${d.message}`
                            return JSON.stringify(d)
                        })
                        userMessage = `${body.error || body.message || 'Error de validación'}: ${lines.join('; ')}`
                    } else if (body.error || body.message) {
                        userMessage = body.error || body.message
                    }
                }
            } catch (_parseErr) {
                /* ignore parse error */
            }

            // Mostrar alerta de error (coincide con tu ejemplo)
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: userMessage,
            });

            setCreateError(userMessage)
        } finally {
            setCreating(false)
        }
    }

    const handleUpdate = async (id: Employee['id'] | null) => {
        if (!id) return;

        setEditError(null);
        setEditCreating(true);

        try {
            const payload: any = {}
            if (editPassword) {
                const pwdErr = validatePassword(editPassword)
                if (pwdErr) {
                    setEditError('La contraseña no cumple los requisitos: ' + pwdErr)
                    setEditCreating(false)
                    return
                }
            }

            payload.name = editName
            payload.secondName = editSecondName
            payload.lastname = editLastname
            payload.secondLastname = editSecondLastname
            payload.role = editRole === 'NULL' ? null : editRole
            payload.email = editEmail
            payload.phoneNumber = editPhone
            payload.fechaNacimiento = editFechaNacimiento
            payload.status = editStatus
            if (editPhotoFile && editPhotoPreview) payload.photoUrl = editPhotoPreview
            else if (editPhotoPreview === null && editPhotoFile === null) payload.photoUrl = editPhotoPreview
            if (editPassword) payload.password = editPassword

            await updateWorker(id, payload, token)

            // Éxito
            await Swal.fire({
                icon: 'success',
                title: 'Trabajador actualizado',
                text: 'La información fue guardada correctamente.',
                timer: 1800,
                showConfirmButton: false,
            })

            // Cerrar modal y refrescar lista
            setEditOpen(false)
            try {
                const updated = await getWorkers(token)
                setWorkers(updated)
            } catch (_) {
                // si falla la recarga, confiar en la actualización local previa
            }

        } catch (e: any) {
            console.error('updateWorker error', e)

            let message = e?.message || 'Error al actualizar'

            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: message,
            })

            setEditError(message)

        } finally {
            setEditCreating(false)
        }
    }


    useEffect(() => {
        let cancelled = false

        const load = async () => {
            setLoading(true)
            setError(null)
            try {
                const arr = await getWorkers(token)
                if (!cancelled) setWorkers(arr)
            } catch (e: any) {
                if (!cancelled) setError(e.message || "Error al cargar trabajadores")
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => { cancelled = true }
    }, [token])

    function validatePassword(pwd: string): string | null {
        if (pwd.length < 8) return "La contraseña debe tener al menos 8 caracteres";
        if (!/[A-Z]/.test(pwd)) return "La contraseña debe contener al menos una letra mayúscula";
        if (!/[a-z]/.test(pwd)) return "La contraseña debe contener al menos una letra minúscula";
        if (!/[0-9]/.test(pwd)) return "La contraseña debe contener al menos un número";
        if (!/[!*()\-_=+\[\]|;:,./]/.test(pwd)) return "La contraseña debe contener al menos un símbolo";
        return null;
    }

    const validatePasswordLive = (value: string) => {
        const error: string[] = [];
        if (value.length < 8) error.push("La contraseña debe tener al menos 8 caracteres");
        if (!/[A-Z]/.test(value)) error.push("La contraseña debe contener al menos una letra mayúscula");
        if (!/[a-z]/.test(value)) error.push("La contraseña debe contener al menos una letra minúscula");
        if (!/[0-9]/.test(value)) error.push("La contraseña debe contener al menos un número");
        if (!/[!*()\-_=+[\]|;:,./]/.test(value)) error.push("La contraseña debe contener al menos un símbolo");

        setPasswordErrorList(error);
    }

    const filtered = (workers || []).filter(w => {
        const modelText = `${w.name ?? ''} ${w.secondName ?? ''} ${w.lastname ?? ''} ${w.email ?? ''}`
        const matchesSearch = modelText.toLowerCase().includes((search ?? '').toLowerCase())
        const matchesStatus = statusFilter ? ((w.status ?? '') === statusFilter) : true
        return matchesSearch && matchesStatus
    })



    return (
        <div className="employees-page">
            <Header
                leftSlot={<h2 className="vehicles-title">Trabajadores ({filtered.length})</h2>}
                centerSlot={
                    <div className="header-search">
                        <input
                            placeholder="Buscar trabajadores..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                }
                rightSlot={<button className="button-agregar-employees" onClick={() => setCreateOpen(true)}>+ Agregar</button>}
            />

            <div className="filter-status-employees" style={{ margin: '10px 0' }}>
                <select value={statusFilter ?? ''} onChange={e => setStatusFilter(e.target.value === '' ? null : e.target.value)} style={{ padding: '6px 8px', borderRadius: 6 }}>
                    <option value="">Todos</option>
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                    <option value="suspended">Suspendido</option>
                </select>
            </div>

            {/* Modal (crear + editar) */}
            {(createOpen || editOpen) && (
                <div className={createOpen ? 'modal-overlay' : 'modal-overlay'} onClick={() => {
                        if (createOpen) {
                        setCreateOpen(false);
                        // reset create form
                        setNewName(''); setNewSecondName(null); setNewLastname(''); setNewSecondLastname(null); setNewRole(''); setNewEmail(null); setNewPhone(null); setNewFechaNacimiento(null); setNewPassword(null); setNewPhotoFile(null); setNewPhotoPreview(null); setPasswordErrorList([]); setShowPassword(false); setCreateError(null);
                    }
                    if (editOpen) {
                        setEditOpen(false);
                        // reset edit form
                        setEditId(null); setEditName(''); setEditSecondName(null); setEditLastname(''); setEditSecondLastname(null); setEditRole(null); setEditEmail(null); setEditPhone(null); setEditFechaNacimiento(null); setEditPassword(null); setEditStatus('active'); setEditPhotoFile(null); setEditPhotoPreview(null); setEditPasswordErrorList([]); setEditShowPassword(false); setEditError(null);
                    }
                }}>
                    <div className={createOpen ? 'modal-content' : 'modal-content'} onClick={e => e.stopPropagation()}>
                        <h3>{createOpen ? 'Agregar trabajador' : 'Editar trabajador'}</h3>
                        <div className="form-grid-3">
                            <label>
                                Nombre
                                <input value={createOpen ? newName : editName} onChange={e => createOpen ? setNewName(e.target.value) : setEditName(e.target.value)} />
                            </label>
                            <label>
                                Segundo nombre
                                <input value={(createOpen ? newSecondName : editSecondName) ?? ''} onChange={e => createOpen ? setNewSecondName(e.target.value || null) : setEditSecondName(e.target.value || null)} />
                            </label>
                            <label>
                                Apellido
                                <input value={createOpen ? newLastname : editLastname} onChange={e => createOpen ? setNewLastname(e.target.value) : setEditLastname(e.target.value)} />
                            </label>
                            <label>
                                Segundo apellido
                                <input value={(createOpen ? newSecondLastname : editSecondLastname) ?? ''} onChange={e => createOpen ? setNewSecondLastname(e.target.value || null) : setEditSecondLastname(e.target.value || null)} />
                            </label>
                            <label>
                                Rol
                                {createOpen ? (
                                    <select value={newRole} onChange={e => setNewRole(e.target.value)}>
                                        <option value="">Seleccionar</option>
                                        <option value="admin">admin</option>
                                        <option value="supervisor">supervisor</option>
                                        <option value="worker">worker</option>
                                    </select>
                                ) : (
                                    <select value={editRole ?? ''} onChange={e => setEditRole(e.target.value || null)}>
                                        <option value="">Seleccionar</option>
                                        <option value="admin">admin</option>
                                        <option value="supervisor">supervisor</option>
                                        <option value="worker">worker</option>
                                    </select>
                                )}
                            </label>
                            <label>
                                Email
                                <input value={(createOpen ? newEmail : editEmail) ?? ''} onChange={e => createOpen ? setNewEmail(e.target.value || null) : setEditEmail(e.target.value || null)} />
                            </label>
                            <label>
                                Teléfono
                                <input maxLength={10} value={(createOpen ? newPhone : editPhone) ?? ''} onChange={e => { const value = e.target.value.replace(/\D/g, ''); createOpen ? setNewPhone(value || null) : setEditPhone(value || null) }} />
                            </label>
                            <label>
                                Fecha de nacimiento
                                <input type="date" value={(createOpen ? (newFechaNacimiento ? newFechaNacimiento.split('T')[0] : '') : (editFechaNacimiento ? editFechaNacimiento.split('T')[0] : ''))} onChange={e => createOpen ? setNewFechaNacimiento(e.target.value || null) : setEditFechaNacimiento(e.target.value || null)} />
                            </label>

                            <label>
                                Contraseña{!createOpen && ' (dejar en blanco para no modificar)'}
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={createOpen ? (showPassword ? 'text' : 'password') : (editShowPassword ? 'text' : 'password')}
                                        value={(createOpen ? newPassword : editPassword) ?? ''}
                                        onChange={e => {
                                            const val = e.target.value
                                            if (createOpen) {
                                                setNewPassword(val || null);
                                                validatePasswordLive(val);
                                            } else {
                                                setEditPassword(val || null)
                                                const errs: string[] = []
                                                if (val.length < 8) errs.push('La contraseña debe tener al menos 8 caracteres')
                                                if (!/[A-Z]/.test(val)) errs.push('Debe contener al menos una letra mayúscula')
                                                if (!/[a-z]/.test(val)) errs.push('Debe contener al menos una letra minúscula')
                                                if (!/[0-9]/.test(val)) errs.push('Debe contener al menos un número')
                                                if (!/[!*()\-_=+\[\]|;:,./]/.test(val)) errs.push('Debe contener al menos un símbolo')
                                                setEditPasswordErrorList(errs)
                                            }
                                        }}
                                        style={{ paddingRight: 35 }}
                                    />

                                    <span
                                        onClick={() => { createOpen ? setShowPassword(!showPassword) : setEditShowPassword(!editShowPassword) }}
                                        style={{
                                            position: 'absolute',
                                            right: 10,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            cursor: 'pointer',
                                            opacity: 0.85,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        role="button"
                                        aria-label={(createOpen ? showPassword : editShowPassword) ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    >
                                        {(createOpen ? showPassword : editShowPassword) ? (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        ) : (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                                <path d="M17.94 17.94A10.94 10.94 0 0112 19c-7 0-11-7-11-7a20.3 20.3 0 014.12-5.05" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M1 1l22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M9.88 9.88A3 3 0 0012 15c1.03 0 1.96-.5 2.56-1.28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M14.12 14.12A3 3 0 019.88 9.88" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </span>
                                </div>

                            </label>

                            {/* ERRORES DE CONTRASEÑA EN TIEMPO REAL */}
                            {createOpen ? (
                                passwordErrorList.length > 0 && (
                                    <ul style={{ color: 'red', fontSize: 13, marginTop: 4, paddingLeft: 18 }}>
                                        {passwordErrorList.map((e, i) => (
                                            <li key={i}>{e}</li>
                                        ))}
                                    </ul>
                                )
                            ) : (
                                editPasswordErrorList.length > 0 && (
                                    <ul style={{ color: 'red', fontSize: 13, marginTop: 4, paddingLeft: 18 }}>
                                        {editPasswordErrorList.map((e, i) => <li key={i}>{e}</li>)}
                                    </ul>
                                )
                            )}

                            {!createOpen && (
                                <label>
                                    Estado
                                    <select value={editStatus ?? ''} onChange={e => setEditStatus(e.target.value || null)}>
                                        <option value="active">active</option>
                                        <option value="inactive">inactive</option>
                                        <option value="suspended">suspended</option>
                                    </select>
                                </label>
                            )}

                            <label>
                                Foto
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] || null;
                                        if (createOpen) {
                                            setNewPhotoFile(file);
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => { setNewPhotoPreview(reader.result as string); };
                                                reader.readAsDataURL(file);
                                            } else { setNewPhotoPreview(null); }
                                        } else {
                                            setEditPhotoFile(file);
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => { setEditPhotoPreview(reader.result as string); };
                                                reader.readAsDataURL(file);
                                            } else { setEditPhotoPreview(null); }
                                        }
                                    }}
                                />
                            </label>

                            {(createOpen ? newPhotoPreview : editPhotoPreview) && (
                                <img
                                    src={createOpen ? newPhotoPreview as string : editPhotoPreview as string}
                                    alt="Previsualización"
                                    style={{ width: 100, height: 100, borderRadius: 10, marginTop: 8 }}
                                />
                            )}

                        </div>
                        {createOpen ? (createError && <div style={{ color: '#b91c1c', marginTop: 8 }}>{createError}</div>) : (editError && <div style={{ color: '#b91c1c', marginTop: 8 }}>{editError}</div>)}

                        <div className="modal-actions">
                            {createOpen ? (
                                <>
                                    <button className="card-button" onClick={async () => { await handleCreate(); /* reset handled inside handler */ }}>{creating ? 'Creando…' : 'Crear'}</button>
                                    <button className="close-btn" onClick={() => { setCreateOpen(false); setCreateError(null); resetCreateForm(); }}>Cancelar</button>
                                </>
                            ) : (
                                <>
                                    <button className="card-button" onClick={async () => { await handleUpdate(editId); }}>{editCreating ? 'Guardando…' : 'Guardar'}</button>
                                    <button className="close-btn" onClick={() => { setEditOpen(false); setEditError(null); resetEditForm(); }}>Cancelar</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {loading && <p>Cargando trabajadores…</p>}
            {error && <p className="error">Error: {error}</p>}
            {!loading && !error && workers.length === 0 && <p>No hay empleados registrados.</p>}

            {!loading && !error && workers.length > 0 && (
                <div className="employees-table-container">
                    <table className="employees-table">
                        <thead>
                            <tr>
                                <th>Foto</th>
                                <th>Nombre</th>
                                <th>Rol</th>
                                <th>Correo</th>
                                <th>Teléfono</th>
                                <th>Estado</th>
                                <th>Opciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: 16 }}>No hay resultados que coincidan.</td>
                                </tr>
                            ): 
                                filtered.map(w => (
                                <tr key={w.id}>
                                    <td>
                                        <div className="empleado-foto">
                                            {w.photoUrl
                                                ? <img src={w.photoUrl} loading="lazy" />
                                                : <span>{w.name?.charAt(0) ?? "👤"}</span>}
                                        </div>
                                    </td>

                                    <td>{`${w.name ?? ""} ${w.secondName ?? ""} ${w.lastname}`}</td>
                                    <td>{w.role ?? "—"}</td>
                                    <td>{w.email}</td>
                                    <td>{w.phoneNumber ?? "—"}</td>

                                    <td>
                                        <span className={`status ${w.status}`}>
                                            {w.status}
                                        </span>
                                    </td>

                                    <td style={{ position: "relative", overflow: "visible" }}>
                                        <button
                                            className='btn-opciones-worker'
                                            onClick={() => setDropdownOpen(dropdownOpen === w.id ? null : w.id)}
                                        >...</button>

                                        {dropdownOpen === w.id && (
                                            <div className="dropdown-opciones-worker">

                                                <button className='btn-put-worker' onClick={() => openEdit(w)}>
                                                    <Pencil size={16} style={{ marginRight: 6 }} />
                                                    Actualizar
                                                </button>

                                                
                                                <button
                                                    className="btn-delete-worker"
                                                    onClick={() => handleDelete(w.id)}
                                                    disabled={deletingId === w.id}
                                                >
                                                    {deletingId === w.id ? "Eliminando..." : <Trash2 size={16} style={{ marginRight: 6 }} />}
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
            )}
        </div>
    
    );
}
