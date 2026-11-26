import React, { useEffect, useState } from 'react';
import {
    FiUserPlus, FiShield, FiAlertCircle, FiCheckCircle,
    FiEdit2, FiTrash2, FiX, FiSearch, FiMail, FiUsers
} from 'react-icons/fi';
import api from '../services/api';

const COLOR_ROL = {
    ADMIN: { bg: '#0284c7', text: '#e0f2fe' },
    PSICOLOGO: { bg: '#7c3aed', text: '#ede9fe' },
    ANALISTA: { bg: '#059669', text: '#d1fae5' }
};

const FORM_INICIAL = {
    nombre: '',
    correo: '',
    password: '',
    rol: 'PSICOLOGO',
    correoNotificacion: ''
};

const GestionUsuarios = ({ usuarioActual }) => {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');

    const [form, setForm] = useState(FORM_INICIAL);
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

    // Modal Editar
    const [editModal, setEditModal] = useState({ isOpen: false, id: null });
    const [editForm, setEditForm] = useState({ nombre: '', correo: '', rol: 'PSICOLOGO', password: '' });
    const [guardandoEdit, setGuardandoEdit] = useState(false);

    // Modal Eliminar
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, usuario: null });
    const [eliminando, setEliminando] = useState(false);

    const cargarUsuarios = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/usuarios');
            setUsuarios(Array.isArray(data) ? data : []);
        } catch (error) {
            setMensaje({
                tipo: 'error',
                texto: error.response?.data?.message || 'No se pudo cargar el listado de usuarios.'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarUsuarios();
    }, []);

    const handleCrear = async (e) => {
        e.preventDefault();
        setGuardando(true);
        setMensaje({ tipo: '', texto: '' });

        const payload = {
            nombre: form.nombre.trim(),
            correo: form.correo.trim(),
            password: form.password,
            rol: form.rol,
            correoNotificacion: form.correoNotificacion.trim() || null
        };

        try {
            const { data } = await api.post('/usuarios', payload);
            setMensaje({
                tipo: 'ok',
                texto: payload.correoNotificacion
                    ? `Cuenta creada para ${data.nombre} (${data.rol}). Se enviaron las credenciales a ${payload.correoNotificacion}.`
                    : `Cuenta creada para ${data.nombre} (${data.rol}). Ya puede iniciar sesión.`
            });
            setForm(FORM_INICIAL);
            await cargarUsuarios();
        } catch (error) {
            setMensaje({
                tipo: 'error',
                texto: error.response?.data?.message || 'No se pudo registrar el usuario. Verifica si el correo ya existe.'
            });
        } finally {
            setGuardando(false);
        }
    };

    const abrirEditar = (u) => {
        setEditForm({
            nombre: u.nombre || '',
            correo: u.correo || '',
            rol: u.rol || 'PSICOLOGO',
            password: ''
        });
        setEditModal({ isOpen: true, id: u.id });
    };

    const handleEditarSubmit = async (e) => {
        e.preventDefault();
        setGuardandoEdit(true);
        setMensaje({ tipo: '', texto: '' });

        const payload = {
            nombre: editForm.nombre.trim(),
            correo: editForm.correo.trim(),
            rol: editForm.rol,
            password: editForm.password.trim() || null
        };

        try {
            await api.put(`/usuarios/${editModal.id}`, payload);
            setEditModal({ isOpen: false, id: null });
            setMensaje({ tipo: 'ok', texto: 'Datos del usuario actualizados correctamente.' });
            await cargarUsuarios();
        } catch (error) {
            setMensaje({
                tipo: 'error',
                texto: error.response?.data?.message || 'No se pudo actualizar el usuario.'
            });
        } finally {
            setGuardandoEdit(false);
        }
    };

    const confirmarEliminar = async () => {
        if (!deleteModal.usuario) return;
        setEliminando(true);
        setMensaje({ tipo: '', texto: '' });

        try {
            await api.delete(`/usuarios/${deleteModal.usuario.id}`);
            setMensaje({
                tipo: 'ok',
                texto: `Usuario "${deleteModal.usuario.nombre}" eliminado correctamente.`
            });
            setDeleteModal({ isOpen: false, usuario: null });
            await cargarUsuarios();
        } catch (error) {
            setMensaje({
                tipo: 'error',
                texto: error.response?.data?.message || 'No se pudo eliminar el usuario.'
            });
        } finally {
            setEliminando(false);
        }
    };

    const usuariosFiltrados = usuarios.filter(u => {
        const q = busqueda.trim().toLowerCase();
        if (!q) return true;
        return (
            (u.nombre || '').toLowerCase().includes(q) ||
            (u.correo || '').toLowerCase().includes(q) ||
            (u.rol || '').toLowerCase().includes(q)
        );
    });

    return (
        <main className="overview-container">
            <div className="overview-welcome">
                <div>
                    <h1>Gestión de Equipo</h1>
                    <p>Administra las cuentas internas de administradores, psicólogos y analistas del portal.</p>
                </div>
            </div>

            {mensaje.texto && (
                <div className={mensaje.tipo === 'error' ? 'create-error-banner' : 'module-success-banner'}>
                    {mensaje.tipo === 'error' ? <FiAlertCircle /> : <FiCheckCircle />}
                    <span>{mensaje.texto}</span>
                </div>
            )}

            <div className="usuarios-layout-grid">
                <section className="recent-candidates-card">
                    <div className="recent-header">
                        <h3><FiUserPlus /> Registrar Nuevo Integrante</h3>
                        <p>Crea la cuenta y, si indicas un correo de notificación, enviaremos las credenciales automáticamente.</p>
                    </div>

                    <form onSubmit={handleCrear} className="create-modal-form">
                        <div className="create-field">
                            <label>Nombre Completo <span>*</span></label>
                            <input
                                type="text"
                                value={form.nombre}
                                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                                placeholder="Ej: María Victoria Bustamante"
                                required
                            />
                        </div>

                        <div className="create-field">
                            <label>Correo de Acceso (Cuenta) <span>*</span></label>
                            <input
                                type="email"
                                value={form.correo}
                                onChange={(e) => setForm({ ...form, correo: e.target.value })}
                                placeholder="psicologa@aquachile.cl"
                                required
                            />
                        </div>

                        <div className="create-form-grid-2">
                            <div className="create-field">
                                <label>Contraseña Temporal <span>*</span></label>
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    placeholder="Mínimo 6 caracteres"
                                    minLength={6}
                                    required
                                />
                            </div>
                            <div className="create-field">
                                <label>Rol en el Sistema <span>*</span></label>
                                <select
                                    value={form.rol}
                                    onChange={(e) => setForm({ ...form, rol: e.target.value })}
                                >
                                    <option value="PSICOLOGO">PSICOLOGO</option>
                                    <option value="ANALISTA">ANALISTA</option>
                                    <option value="ADMIN">ADMIN</option>
                                </select>
                            </div>
                        </div>

                        <div className="create-field">
                            <label><FiMail /> Correo para enviar credenciales (Opcional)</label>
                            <input
                                type="email"
                                value={form.correoNotificacion}
                                onChange={(e) => setForm({ ...form, correoNotificacion: e.target.value })}
                                placeholder="correo.personal@gmail.com"
                            />
                            <span className="field-helper-hint">
                                Se enviará un correo con el usuario y la contraseña temporal a esta dirección.
                            </span>
                        </div>

                        <div className="create-modal-footer">
                            <button type="submit" className="btn-guardar-modern" disabled={guardando}>
                                {guardando ? 'Registrando...' : 'Crear Usuario'}
                            </button>
                        </div>
                    </form>
                </section>

                <section className="recent-candidates-card">
                    <div className="recent-header">
                        <h3><FiShield /> Permisos por Rol</h3>
                        <p>Resumen de accesos habilitados en la plataforma.</p>
                    </div>
                    <ul className="roles-info-list">
                        <li><strong>ADMIN:</strong> Control total del sistema, métricas del equipo, ofertas laborales, usuarios y agenda global.</li>
                        <li><strong>PSICOLOGO:</strong> Acepta postulaciones desde la bandeja, gestiona su Kanban personal, agenda sus entrevistas y emite dictámenes.</li>
                        <li><strong>ANALISTA:</strong> Supervisión en modo lectura de métricas globales, tablero Kanban, directorio de candidatos y registro de postulaciones.</li>
                    </ul>
                </section>
            </div>

            {/* LISTADO COMPLETO DE USUARIOS REGISTRADOS */}
            <section className="recent-candidates-card" style={{ marginTop: '20px' }}>
                <div className="recent-header recent-header-flex">
                    <div>
                        <h3><FiUsers /> Usuarios Registrados ({usuarios.length})</h3>
                        <p>Edita roles, restablece contraseñas o elimina cuentas inactivas.</p>
                    </div>
                    <div className="kanban-search-box" style={{ minWidth: '260px' }}>
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, correo o rol..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                        {busqueda && (
                            <button className="clear-input-btn" onClick={() => setBusqueda('')}>
                                <FiX />
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <p className="module-empty-msg">Cargando cuentas del equipo...</p>
                ) : usuariosFiltrados.length === 0 ? (
                    <p className="module-empty-msg">No se encontraron usuarios con ese criterio.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="ats-table">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Correo de Acceso</th>
                                    <th>Rol</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usuariosFiltrados.map(u => {
                                    const esPropio = usuarioActual?.id && Number(usuarioActual.id) === Number(u.id);
                                    const color = COLOR_ROL[u.rol] || { bg: '#475569', text: '#f1f5f9' };

                                    return (
                                        <tr key={u.id}>
                                            <td>
                                                <div className="candidate-strong">
                                                    {u.nombre}{' '}
                                                    {esPropio && <span className="self-user-tag">Tú</span>}
                                                </div>
                                            </td>
                                            <td>{u.correo}</td>
                                            <td>
                                                <span
                                                    className="trello-label-pill small"
                                                    style={{ backgroundColor: color.bg, color: color.text }}
                                                >
                                                    {u.rol}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="table-action-group">
                                                    <button
                                                        type="button"
                                                        className="btn-table-view"
                                                        onClick={() => abrirEditar(u)}
                                                    >
                                                        <FiEdit2 /> Editar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn-table-danger"
                                                        disabled={esPropio}
                                                        title={esPropio ? 'No puedes eliminar tu propia cuenta' : 'Eliminar usuario'}
                                                        onClick={() => setDeleteModal({ isOpen: true, usuario: u })}
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* MODAL EDITAR USUARIO */}
            {editModal.isOpen && (
                <div className="modal-overlay" onClick={() => setEditModal({ isOpen: false, id: null })}>
                    <div className="modern-create-modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="create-modal-header">
                            <div className="create-header-title">
                                <div className="create-icon-badge"><FiEdit2 /></div>
                                <div>
                                    <h3>Editar Usuario</h3>
                                    <p>Actualiza los datos o asigna una nueva contraseña si es necesario.</p>
                                </div>
                            </div>
                            <button className="trello-modal-close" onClick={() => setEditModal({ isOpen: false, id: null })}>
                                <FiX />
                            </button>
                        </div>

                        <form onSubmit={handleEditarSubmit} className="create-modal-form">
                            <div className="create-field">
                                <label>Nombre Completo <span>*</span></label>
                                <input
                                    type="text"
                                    value={editForm.nombre}
                                    onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="create-field">
                                <label>Correo de Acceso <span>*</span></label>
                                <input
                                    type="email"
                                    value={editForm.correo}
                                    onChange={(e) => setEditForm({ ...editForm, correo: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="create-form-grid-2">
                                <div className="create-field">
                                    <label>Rol <span>*</span></label>
                                    <select
                                        value={editForm.rol}
                                        onChange={(e) => setEditForm({ ...editForm, rol: e.target.value })}
                                    >
                                        <option value="PSICOLOGO">PSICOLOGO</option>
                                        <option value="ANALISTA">ANALISTA</option>
                                        <option value="ADMIN">ADMIN</option>
                                    </select>
                                </div>
                                <div className="create-field">
                                    <label>Nueva Contraseña (Opcional)</label>
                                    <input
                                        type="password"
                                        value={editForm.password}
                                        onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                        placeholder="Dejar vacío para mantener"
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <div className="create-modal-footer">
                                <button
                                    type="button"
                                    className="btn-cancelar"
                                    onClick={() => setEditModal({ isOpen: false, id: null })}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-guardar-modern" disabled={guardandoEdit}>
                                    {guardandoEdit ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL CONFIRMAR ELIMINACIÓN DE USUARIO */}
            {deleteModal.isOpen && deleteModal.usuario && (
                <div className="modal-overlay" onClick={() => setDeleteModal({ isOpen: false, usuario: null })}>
                    <div className="modal-content" style={{ textAlign: 'center', maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
                        <FiTrash2 style={{ fontSize: '40px', color: '#f87171', marginBottom: '12px' }} />
                        <h3 style={{ marginBottom: '10px', fontSize: '19px' }}>¿Eliminar usuario?</h3>
                        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
                            Se eliminará la cuenta de <strong>{deleteModal.usuario.nombre}</strong> ({deleteModal.usuario.correo}). Las postulaciones que tenía asignadas quedarán nuevamente disponibles en la Bandeja sin Asignar.
                        </p>
                        <div className="modal-buttons" style={{ justifyContent: 'center', gap: '14px' }}>
                            <button
                                type="button"
                                className="btn-cancelar"
                                onClick={() => setDeleteModal({ isOpen: false, usuario: null })}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="btn-eliminar-confirm"
                                disabled={eliminando}
                                onClick={confirmarEliminar}
                            >
                                {eliminando ? 'Eliminando...' : 'Sí, Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default GestionUsuarios;