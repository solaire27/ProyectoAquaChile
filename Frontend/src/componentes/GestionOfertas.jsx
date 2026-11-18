import React, { useEffect, useState } from 'react';
import {
    FiBriefcase, FiPlus, FiEdit2, FiTrash2, FiX,
    FiToggleLeft, FiToggleRight, FiAlertCircle, FiCheckCircle
} from 'react-icons/fi';
import api from '../services/api';

const FAMILIAS = ['Operativo', 'Administrativo', 'Jefatura', 'Gerencia', 'TI'];

const estadoInicialForm = {
    tituloCargo: '',
    familiaCargo: 'Operativo',
    descripcion: '',
    cuposDisponibles: 1
};

const GestionOfertas = () => {
    const [ofertas, setOfertas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [form, setForm] = useState(estadoInicialForm);
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
    const [guardando, setGuardando] = useState(false);

    const cargarOfertas = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/ofertas');
            setOfertas(Array.isArray(data) ? data : []);
        } catch (error) {
            setMensaje({
                tipo: 'error',
                texto: error.response?.data?.message || 'No se pudieron cargar las ofertas.'
            });
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
        setMensaje({ tipo: '', texto: '' });
        setModalOpen(true);
    };

    const abrirEditar = (oferta) => {
        setEditandoId(oferta.id);
        setForm({
            tituloCargo: oferta.tituloCargo || '',
            familiaCargo: oferta.familiaCargo || 'Operativo',
            descripcion: oferta.descripcion || '',
            cuposDisponibles: oferta.cuposDisponibles || 1
        });
        setMensaje({ tipo: '', texto: '' });
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGuardando(true);
        setMensaje({ tipo: '', texto: '' });

        const payload = {
            ...form,
            cuposDisponibles: parseInt(form.cuposDisponibles, 10) || 1
        };

        try {
            if (editandoId) {
                await api.put(`/ofertas/${editandoId}`, payload);
                setMensaje({ tipo: 'ok', texto: 'Oferta actualizada correctamente.' });
            } else {
                await api.post('/ofertas', payload);
                setMensaje({ tipo: 'ok', texto: 'Oferta creada y publicada.' });
            }
            setModalOpen(false);
            await cargarOfertas();
        } catch (error) {
            setMensaje({
                tipo: 'error',
                texto: error.response?.data?.message || 'Error al guardar la oferta.'
            });
        } finally {
            setGuardando(false);
        }
    };

    const toggleEstado = async (oferta) => {
        try {
            await api.patch(`/ofertas/${oferta.id}/estado`, null, {
                params: { activo: !oferta.estadoActivo }
            });
            await cargarOfertas();
        } catch (error) {
            setMensaje({
                tipo: 'error',
                texto: error.response?.data?.message || 'No se pudo cambiar el estado de la oferta.'
            });
        }
    };

    const eliminarOferta = async (id, titulo) => {
        if (!window.confirm(`¿Eliminar definitivamente la oferta "${titulo}"?`)) return;
        try {
            await api.delete(`/ofertas/${id}`);
            setMensaje({ tipo: 'ok', texto: 'Oferta eliminada.' });
            await cargarOfertas();
        } catch (error) {
            setMensaje({
                tipo: 'error',
                texto: error.response?.data?.message || 'No se pudo eliminar la oferta.'
            });
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

            {mensaje.texto && (
                <div className={mensaje.tipo === 'error' ? 'create-error-banner' : 'module-success-banner'}>
                    {mensaje.tipo === 'error' ? <FiAlertCircle /> : <FiCheckCircle />}
                    <span>{mensaje.texto}</span>
                </div>
            )}

            <section className="recent-candidates-card">
                <div className="recent-header">
                    <h3>Vacantes Registradas ({ofertas.length})</h3>
                    <p>Las ofertas inactivas quedan ocultas en la página pública sin perder su historial.</p>
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
                                                {oferta.descripcion?.length > 70
                                                    ? `${oferta.descripcion.substring(0, 70)}...`
                                                    : oferta.descripcion}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="trello-label-pill small" style={{ backgroundColor: '#0284c7', color: '#e0f2fe' }}>
                                                {oferta.familiaCargo}
                                            </span>
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
                                                    onClick={() => eliminarOferta(oferta.id, oferta.tituloCargo)}
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

            {modalOpen && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="modern-create-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="create-modal-header">
                            <div className="create-header-title">
                                <div className="create-icon-badge"><FiBriefcase /></div>
                                <div>
                                    <h3>{editandoId ? 'Editar Oferta Laboral' : 'Nueva Oferta Laboral'}</h3>
                                    <p>Completa los detalles de la vacante para el portal.</p>
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
                                        min="1"
                                        value={form.cuposDisponibles}
                                        onChange={(e) => setForm({ ...form, cuposDisponibles: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="create-field">
                                <label>Descripción y Requisitos <span>*</span></label>
                                <textarea
                                    rows="4"
                                    value={form.descripcion}
                                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                                    placeholder="Describe funciones principales, turnos y requisitos del cargo..."
                                    required
                                />
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
        </main>
    );
};

export default GestionOfertas;