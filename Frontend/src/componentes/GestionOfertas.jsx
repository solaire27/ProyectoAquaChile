import React, { useEffect, useState } from 'react';
import {
    FiBriefcase, FiPlus, FiEdit2, FiTrash2, FiX,
    FiToggleLeft, FiToggleRight, FiAlertCircle, FiCheckCircle,
    FiMapPin, FiInfo
} from 'react-icons/fi';
import api from '../services/api';

const FAMILIAS = ['Operativo', 'Administrativo', 'Jefatura', 'Gerencia', 'TI'];
const MODALIDADES = ['Presencial', 'Híbrida', 'Remota'];

const estadoInicialForm = {
    tituloCargo: '',
    familiaCargo: 'Operativo',
    descripcion: '',
    cuposDisponibles: 1,
    ubicacion: '',
    modalidad: 'Presencial',
    funcionesPrincipales: '',
    requisitos: '',
    beneficios: '',
    rangoSalarial: ''
};

const GestionOfertas = () => {
    const [ofertas, setOfertas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [form, setForm] = useState(estadoInicialForm);
    const [guardando, setGuardando] = useState(false);

    // Modal propio de eliminación + toasts
    const [eliminarModal, setEliminarModal] = useState({ isOpen: false, oferta: null });
    const [eliminando, setEliminando] = useState(false);
    const [toasts, setToasts] = useState([]);

    const mostrarToast = (texto, tipo = 'info') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, texto, tipo }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4200);
    };

    const cerrarToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const cargarOfertas = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/ofertas');
            setOfertas(Array.isArray(data) ? data : []);
        } catch (error) {
            mostrarToast(
                error.response?.data?.message || 'No se pudieron cargar las ofertas.',
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarOfertas();
    }, []);

    const abrirCrear = () => {
        setEditandoId(null);
        setForm(estadoInicialForm);
        setModalOpen(true);
    };

    const abrirEditar = (oferta) => {
        setEditandoId(oferta.id);
        setForm({
            tituloCargo: oferta.tituloCargo || '',
            familiaCargo: oferta.familiaCargo || 'Operativo',
            descripcion: oferta.descripcion || '',
            cuposDisponibles: oferta.cuposDisponibles ?? 1,
            ubicacion: oferta.ubicacion || '',
            modalidad: oferta.modalidad || 'Presencial',
            funcionesPrincipales: oferta.funcionesPrincipales || '',
            requisitos: oferta.requisitos || '',
            beneficios: oferta.beneficios || '',
            rangoSalarial: oferta.rangoSalarial || ''
        });
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGuardando(true);

        const cuposNum = parseInt(form.cuposDisponibles, 10);
        const payload = {
            ...form,
            tituloCargo: form.tituloCargo.trim(),
            ubicacion: form.ubicacion.trim(),
            rangoSalarial: form.rangoSalarial.trim(),
            cuposDisponibles: Number.isNaN(cuposNum) ? 0 : Math.max(0, cuposNum)
        };

        try {
            if (editandoId) {
                await api.put(`/ofertas/${editandoId}`, payload);
                mostrarToast('Oferta actualizada correctamente.', 'success');
            } else {
                await api.post('/ofertas', payload);
                mostrarToast('Oferta creada y publicada correctamente.', 'success');
            }
            setModalOpen(false);
            await cargarOfertas();
        } catch (error) {
            mostrarToast(
                error.response?.data?.message || 'Error al guardar la oferta.',
                'error'
            );
        } finally {
            setGuardando(false);
        }
    };

    const toggleEstado = async (oferta) => {
        try {
            const nuevoEstado = !oferta.estadoActivo;
            await api.patch(`/ofertas/${oferta.id}/estado`, null, {
                params: { activo: nuevoEstado }
            });
            mostrarToast(
                nuevoEstado
                    ? `Oferta "${oferta.tituloCargo}" activada en el portal.`
                    : `Oferta "${oferta.tituloCargo}" cerrada en el portal.`,
                'info'
            );
            await cargarOfertas();
        } catch (error) {
            mostrarToast(
                error.response?.data?.message || 'No se pudo cambiar el estado de la oferta.',
                'error'
            );
        }
    };

    const confirmarEliminarOferta = async () => {
        const oferta = eliminarModal.oferta;
        if (!oferta) return;
        setEliminando(true);

        try {
            await api.delete(`/ofertas/${oferta.id}`);
            setEliminarModal({ isOpen: false, oferta: null });
            mostrarToast(`Oferta "${oferta.tituloCargo}" eliminada correctamente.`, 'success');
            await cargarOfertas();
        } catch (error) {
            mostrarToast(
                error.response?.data?.message || 'No se pudo eliminar la oferta.',
                'error'
            );
        } finally {
            setEliminando(false);
        }
    };

    return (
        <main className="overview-container">
            <div className="overview-welcome">
                <div>
                    <h1>Gestión de Ofertas Laborales</h1>
                    <p>Administra las vacantes activas que se muestran en el portal público de AquaChile.</p>
                </div>
                <button className="btn-go-board" onClick={abrirCrear}>
                    <FiPlus /> Nueva Oferta
                </button>
            </div>

            <section className="recent-candidates-card">
                <div className="recent-header">
                    <h3>Vacantes Registradas ({ofertas.length})</h3>
                    <p>Las ofertas sin cupos o cerradas quedan ocultas en la página pública sin perder su historial.</p>
                </div>

                {loading ? (
                    <p className="module-empty-msg">Cargando ofertas...</p>
                ) : ofertas.length === 0 ? (
                    <p className="module-empty-msg">No hay ofertas creadas aún. Usa el botón "Nueva Oferta" para publicar la primera.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="ats-table">
                            <thead>
                                <tr>
                                    <th>Cargo</th>
                                    <th>Área / Familia</th>
                                    <th>Ubicación / Modalidad</th>
                                    <th>Cupos</th>
                                    <th>Estado</th>
                                    <th>Publicación</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ofertas.map(oferta => (
                                    <tr key={oferta.id}>
                                        <td>
                                            <div className="candidate-strong">{oferta.tituloCargo}</div>
                                            <div className="candidate-sub">
                                                {oferta.rangoSalarial ? `💰 ${oferta.rangoSalarial} · ` : ''}
                                                {oferta.descripcion?.length > 60
                                                    ? `${oferta.descripcion.substring(0, 60)}...`
                                                    : oferta.descripcion}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="trello-label-pill small" style={{ backgroundColor: '#0284c7', color: '#e0f2fe' }}>
                                                {oferta.familiaCargo}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="candidate-strong" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <FiMapPin /> {oferta.ubicacion || 'Puerto Montt'}
                                            </div>
                                            <div className="candidate-sub">{oferta.modalidad || 'Presencial'}</div>
                                        </td>
                                        <td><strong>{oferta.cuposDisponibles}</strong></td>
                                        <td>
                                            <button
                                                className={`status-toggle-btn ${oferta.estadoActivo ? 'is-active' : 'is-inactive'}`}
                                                onClick={() => toggleEstado(oferta)}
                                                title="Clic para activar o desactivar"
                                            >
                                                {oferta.estadoActivo ? <FiToggleRight /> : <FiToggleLeft />}
                                                {oferta.estadoActivo ? 'Activa' : 'Cerrada'}
                                            </button>
                                        </td>
                                        <td>
                                            {oferta.fechaPublicacion
                                                ? new Date(oferta.fechaPublicacion).toLocaleDateString('es-CL')
                                                : 'Reciente'}
                                        </td>
                                        <td>
                                            <div className="table-action-group">
                                                <button className="btn-table-view" onClick={() => abrirEditar(oferta)}>
                                                    <FiEdit2 /> Editar
                                                </button>
                                                <button
                                                    className="btn-table-danger"
                                                    onClick={() => setEliminarModal({ isOpen: true, oferta })}
                                                    title="Eliminar oferta"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* MODAL CREAR / EDITAR OFERTA */}
            {modalOpen && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div
                        className="modern-create-modal"
                        style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="create-modal-header">
                            <div className="create-header-title">
                                <div className="create-icon-badge"><FiBriefcase /></div>
                                <div>
                                    <h3>{editandoId ? 'Editar Oferta Laboral' : 'Nueva Oferta Laboral'}</h3>
                                    <p>Completa todos los detalles de la vacante para el portal público.</p>
                                </div>
                            </div>
                            <button className="trello-modal-close" onClick={() => setModalOpen(false)}>
                                <FiX />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="create-modal-form">
                            <div className="create-field">
                                <label>Título del Cargo <span>*</span></label>
                                <input
                                    type="text"
                                    value={form.tituloCargo}
                                    onChange={(e) => setForm({ ...form, tituloCargo: e.target.value })}
                                    placeholder="Ej: Operario de Planta"
                                    required
                                />
                            </div>

                            <div className="create-form-grid-2">
                                <div className="create-field">
                                    <label>Familia de Cargo <span>*</span></label>
                                    <select
                                        value={form.familiaCargo}
                                        onChange={(e) => setForm({ ...form, familiaCargo: e.target.value })}
                                    >
                                        {FAMILIAS.map(fam => (
                                            <option key={fam} value={fam}>{fam}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="create-field">
                                    <label>Cupos Disponibles <span>*</span></label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.cuposDisponibles}
                                        onChange={(e) => setForm({ ...form, cuposDisponibles: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="create-form-grid-2">
                                <div className="create-field">
                                    <label>Ubicación</label>
                                    <input
                                        type="text"
                                        value={form.ubicacion}
                                        onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
                                        placeholder="Ej: Puerto Montt, Región de Los Lagos"
                                    />
                                </div>
                                <div className="create-field">
                                    <label>Modalidad</label>
                                    <select
                                        value={form.modalidad}
                                        onChange={(e) => setForm({ ...form, modalidad: e.target.value })}
                                    >
                                        {MODALIDADES.map(mod => (
                                            <option key={mod} value={mod}>{mod}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="create-field">
                                <label>Rango Salarial (Opcional)</label>
                                <input
                                    type="text"
                                    value={form.rangoSalarial}
                                    onChange={(e) => setForm({ ...form, rangoSalarial: e.target.value })}
                                    placeholder="Ej: $750.000 - $900.000 líquido / Acorde al mercado"
                                />
                            </div>

                            <div className="create-field">
                                <label>Descripción General <span>*</span></label>
                                <textarea
                                    rows="3"
                                    value={form.descripcion}
                                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                                    placeholder="Resumen del rol y propósito del cargo dentro de AquaChile..."
                                    required
                                />
                            </div>

                            <div className="create-field">
                                <label>Funciones Principales</label>
                                <textarea
                                    rows="3"
                                    value={form.funcionesPrincipales}
                                    onChange={(e) => setForm({ ...form, funcionesPrincipales: e.target.value })}
                                    placeholder="Detalla las responsabilidades diarias del puesto..."
                                />
                            </div>

                            <div className="create-form-grid-2">
                                <div className="create-field">
                                    <label>Requisitos</label>
                                    <textarea
                                        rows="3"
                                        value={form.requisitos}
                                        onChange={(e) => setForm({ ...form, requisitos: e.target.value })}
                                        placeholder="Formación, experiencia mínima, licencias o certificaciones..."
                                    />
                                </div>
                                <div className="create-field">
                                    <label>Beneficios</label>
                                    <textarea
                                        rows="3"
                                        value={form.beneficios}
                                        onChange={(e) => setForm({ ...form, beneficios: e.target.value })}
                                        placeholder="Buses de acercamiento, casino, seguro complementario, bonos..."
                                    />
                                </div>
                            </div>

                            <div className="create-modal-footer">
                                <button type="button" className="btn-cancelar" onClick={() => setModalOpen(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-guardar-modern" disabled={guardando}>
                                    {guardando ? 'Guardando...' : editandoId ? 'Guardar Cambios' : 'Publicar Oferta'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL PROPIO CONFIRMAR ELIMINACIÓN DE OFERTA */}
            {eliminarModal.isOpen && eliminarModal.oferta && (
                <div className="modal-overlay" onClick={() => setEliminarModal({ isOpen: false, oferta: null })}>
                    <div className="modal-content" style={{ textAlign: 'center', maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
                        <FiTrash2 style={{ fontSize: '40px', color: '#f87171', marginBottom: '12px' }} />
                        <h3 style={{ marginBottom: '10px', fontSize: '19px' }}>¿Eliminar oferta laboral?</h3>
                        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
                            Se eliminará definitivamente la vacante <strong>{eliminarModal.oferta.tituloCargo}</strong> del portal de AquaChile.
                        </p>
                        <div className="modal-buttons" style={{ justifyContent: 'center', gap: '14px' }}>
                            <button
                                type="button"
                                className="btn-cancelar"
                                onClick={() => setEliminarModal({ isOpen: false, oferta: null })}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="btn-eliminar-confirm"
                                disabled={eliminando}
                                onClick={confirmarEliminarOferta}
                            >
                                {eliminando ? 'Eliminando...' : 'Sí, Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* NOTIFICACIONES TOAST PROPIAS */}
            <div className="toast-stack">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast-item toast-${toast.tipo}`}>
                        <span className="toast-icon">
                            {toast.tipo === 'success' ? (
                                <FiCheckCircle />
                            ) : toast.tipo === 'error' ? (
                                <FiAlertCircle />
                            ) : (
                                <FiInfo />
                            )}
                        </span>
                        <span className="toast-text">{toast.texto}</span>
                        <button className="toast-close" onClick={() => cerrarToast(toast.id)}>
                            <FiX />
                        </button>
                    </div>
                ))}
            </div>
        </main>
    );
};

export default GestionOfertas;