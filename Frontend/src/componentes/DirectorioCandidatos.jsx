import React, { useEffect, useMemo, useState } from 'react';
import {
    FiSearch, FiEdit2, FiX, FiUser, FiAlertCircle, FiCheckCircle,
    FiFileText, FiFilter, FiCalendar, FiUsers, FiClock
} from 'react-icons/fi';
import api from '../services/api';
import { SelectorFechaNacimiento } from './SelectorFecha';

const FAMILIAS_BASE = ['Operativo', 'Administrativo', 'Jefatura', 'Gerencia', 'TI'];

const OPCIONES_FECHA = [
    { key: 'TODAS', label: 'Todas' },
    { key: 'HOY', label: 'Hoy' },
    { key: 'SEMANA', label: 'Últimos 7 días' },
    { key: 'MES', label: 'Este mes' }
];

const COLORES_FALLBACK = {
    Operativo: { bg: '#0284c7', text: '#e0f2fe' },
    Administrativo: { bg: '#d97706', text: '#fef3c7' },
    Jefatura: { bg: '#7c3aed', text: '#ede9fe' },
    Gerencia: { bg: '#059669', text: '#d1fae5' },
    TI: { bg: '#0891b2', text: '#cffafe' }
};

const cumpleRangoFecha = (fechaIso, rango) => {
    if (rango === 'TODAS') return true;
    if (!fechaIso) return false;
    const fecha = new Date(fechaIso);
    if (Number.isNaN(fecha.getTime())) return false;
    const ahora = new Date();
    if (rango === 'HOY') return fecha.toDateString() === ahora.toDateString();
    if (rango === 'SEMANA') return (ahora - fecha) <= 7 * 86400000;
    if (rango === 'MES') {
        return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
    }
    return true;
};

const DirectorioCandidatos = ({
    obtenerIniciales,
    solicitudes = [],
    areasDisponibles,
    obtenerColorFamilia
}) => {
    const [candidatos, setCandidatos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [filtroFamilia, setFiltroFamilia] = useState('TODAS');
    const [filtroFecha, setFiltroFecha] = useState('TODAS');

    const [editando, setEditando] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

    const colorFamilia = (fam) => {
        if (typeof obtenerColorFamilia === 'function') return obtenerColorFamilia(fam);
        return COLORES_FALLBACK[fam] || { bg: '#475569', text: '#f1f5f9' };
    };

    const cargarCandidatos = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/candidatos');
            setCandidatos(Array.isArray(data) ? data : []);
        } catch (error) {
            setMensaje({
                tipo: 'error',
                texto: error.response?.data?.message || 'No se pudo cargar el directorio de candidatos.'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarCandidatos();
    }, []);

    // Cruza cada candidato con la fecha de su postulación más reciente
    const ultimaFechaPorCandidato = useMemo(() => {
        const mapa = {};
        if (!Array.isArray(solicitudes)) return mapa;

        solicitudes.forEach(sol => {
            if (!sol?.candidatoId || !sol?.fechaSolicitud) return;
            const actual = mapa[sol.candidatoId];
            if (!actual || new Date(sol.fechaSolicitud) > new Date(actual)) {
                mapa[sol.candidatoId] = sol.fechaSolicitud;
            }
        });
        return mapa;
    }, [solicitudes]);

    const obtenerFechaPostulacion = (cand) =>
        ultimaFechaPorCandidato[cand.id] || cand.fechaRegistro || cand.fechaCreacion || null;

    const areas = useMemo(() => {
        return Array.from(
            new Set([
                ...(Array.isArray(areasDisponibles) ? areasDisponibles : FAMILIAS_BASE),
                ...candidatos.map(c => c.familiaCargo).filter(Boolean)
            ])
        );
    }, [areasDisponibles, candidatos]);

    const abrirEdicion = (cand) => {
        setMensaje({ tipo: '', texto: '' });
        setEditando({
            id: cand.id,
            nombre: cand.nombre || '',
            rut: cand.rut || '',
            correo: cand.correo || '',
            telefono: cand.telefono || '',
            fechaNacimiento: cand.fechaNacimiento || '',
            familiaCargo: cand.familiaCargo || 'Operativo',
            cargoPostulacion: cand.cargoPostulacion || '',
            urlCv: cand.urlCv || ''
        });
    };

    const guardarEdicion = async (e) => {
        e.preventDefault();
        if (!editando.fechaNacimiento) {
            setMensaje({ tipo: 'error', texto: 'La fecha de nacimiento es obligatoria.' });
            return;
        }

        setGuardando(true);
        setMensaje({ tipo: '', texto: '' });

        try {
            await api.put(`/candidatos/${editando.id}`, {
                nombre: editando.nombre,
                rut: editando.rut,
                correo: editando.correo,
                telefono: editando.telefono,
                fechaNacimiento: editando.fechaNacimiento,
                familiaCargo: editando.familiaCargo,
                cargoPostulacion: editando.cargoPostulacion,
                urlCv: editando.urlCv
            });
            setEditando(null);
            setMensaje({ tipo: 'ok', texto: 'Datos del candidato actualizados.' });
            await cargarCandidatos();
        } catch (error) {
            setMensaje({
                tipo: 'error',
                texto: error.response?.data?.message || 'No se pudieron actualizar los datos.'
            });
        } finally {
            setGuardando(false);
        }
    };

    const filtrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return [...candidatos]
            .filter(c => {
                const coincideTexto =
                    !q ||
                    (c.nombre || '').toLowerCase().includes(q) ||
                    (c.rut || '').toLowerCase().includes(q) ||
                    (c.correo || '').toLowerCase().includes(q) ||
                    (c.cargoPostulacion || '').toLowerCase().includes(q);
                const coincideFamilia =
                    filtroFamilia === 'TODAS' || c.familiaCargo === filtroFamilia;
                const coincideFecha = cumpleRangoFecha(
                    obtenerFechaPostulacion(c),
                    filtroFecha
                );
                return coincideTexto && coincideFamilia && coincideFecha;
            })
            .sort((a, b) => {
                const fa = obtenerFechaPostulacion(a);
                const fb = obtenerFechaPostulacion(b);
                if (fa && fb) return new Date(fb) - new Date(fa);
                if (fb) return 1;
                if (fa) return -1;
                return (b.id || 0) - (a.id || 0);
            });
    }, [candidatos, busqueda, filtroFamilia, filtroFecha, ultimaFechaPorCandidato]);

    const hayFiltrosActivos =
        busqueda.trim() !== '' || filtroFamilia !== 'TODAS' || filtroFecha !== 'TODAS';

    const limpiarFiltros = () => {
        setBusqueda('');
        setFiltroFamilia('TODAS');
        setFiltroFecha('TODAS');
    };

    return (
        <main className="overview-container">
            <div className="overview-welcome">
                <div>
                    <h1>Directorio de Candidatos</h1>
                    <p>Base histórica de postulantes registrados con acceso rápido a sus datos de contacto y edición.</p>
                </div>
            </div>

            {mensaje.texto && (
                <div className={mensaje.tipo === 'error' ? 'create-error-banner' : 'module-success-banner'}>
                    {mensaje.tipo === 'error' ? <FiAlertCircle /> : <FiCheckCircle />}
                    <span>{mensaje.texto}</span>
                </div>
            )}

            {/* BARRA DE FILTROS (BUSCADOR + FECHA + ÁREA) */}
            <section className="kanban-filter-toolbar">
                <div className="toolbar-top-row">
                    <div className="board-title-group">
                        <div className="board-icon-badge"><FiUsers /></div>
                        <div>
                            <h2>Postulantes Registrados</h2>
                            <span className="board-subtitle-text">
                                Mostrando <strong>{filtrados.length}</strong> de {candidatos.length} candidatos registrados
                            </span>
                        </div>
                    </div>

                    <div className="kanban-Controls-right">
                        <div className="kanban-search-box">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, RUT, correo o cargo..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                            {busqueda && (
                                <button className="clear-input-btn" onClick={() => setBusqueda('')}>
                                    <FiX />
                                </button>
                            )}
                        </div>

                        {hayFiltrosActivos && (
                            <button className="btn-clear-filters" onClick={limpiarFiltros}>
                                <FiX /> Limpiar filtros
                            </button>
                        )}
                    </div>
                </div>

                {/* FILTRO POR FECHA */}
                <div className="filter-pills-row date-filter-row">
                    <span className="filter-label-tag"><FiCalendar /> Última postulación:</span>
                    <div className="date-segmented-group">
                        {OPCIONES_FECHA.map(op => (
                            <button
                                key={op.key}
                                type="button"
                                className={`date-pill-btn ${filtroFecha === op.key ? 'active' : ''}`}
                                onClick={() => setFiltroFecha(op.key)}
                            >
                                {op.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* FILTRO POR ÁREA */}
                <div className="filter-pills-row">
                    <span className="filter-label-tag"><FiFilter /> Filtrar por área:</span>

                    <button
                        type="button"
                        className={`area-filter-pill ${filtroFamilia === 'TODAS' ? 'active-all' : ''}`}
                        onClick={() => setFiltroFamilia('TODAS')}
                    >
                        Todas las áreas
                        <span className="pill-counter">{candidatos.length}</span>
                    </button>

                    {areas.map(familia => {
                        const count = candidatos.filter(c => c.familiaCargo === familia).length;
                        const famColor = colorFamilia(familia);
                        const isSelected = filtroFamilia === familia;

                        return (
                            <button
                                key={familia}
                                type="button"
                                className={`area-filter-pill ${isSelected ? 'active' : ''} ${count === 0 && !isSelected ? 'pill-empty' : ''}`}
                                style={
                                    isSelected
                                        ? { backgroundColor: famColor.bg, color: '#ffffff', borderColor: famColor.bg }
                                        : {}
                                }
                                onClick={() => setFiltroFamilia(isSelected ? 'TODAS' : familia)}
                            >
                                <span
                                    className="pill-color-dot"
                                    style={{ backgroundColor: isSelected ? '#ffffff' : famColor.bg }}
                                ></span>
                                {familia}
                                <span className="pill-counter">{count}</span>
                            </button>
                        );
                    })}
                </div>
            </section>

            <section className="recent-candidates-card">
                {loading ? (
                    <p className="module-empty-msg">Cargando directorio...</p>
                ) : filtrados.length === 0 ? (
                    <p className="module-empty-msg">No se encontraron candidatos con los filtros seleccionados.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="ats-table">
                            <thead>
                                <tr>
                                    <th>Candidato / RUT</th>
                                    <th>Contacto</th>
                                    <th>Fecha Nac.</th>
                                    <th>Cargo / Área</th>
                                    <th>Últ. Postulación</th>
                                    <th>CV</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtrados.map(cand => {
                                    const famColor = colorFamilia(cand.familiaCargo);
                                    const fechaPost = obtenerFechaPostulacion(cand);

                                    return (
                                        <tr key={cand.id}>
                                            <td>
                                                <div className="table-candidate-cell">
                                                    <div className="mini-avatar">{obtenerIniciales(cand.nombre)}</div>
                                                    <div>
                                                        <div className="candidate-strong">{cand.nombre}</div>
                                                        <div className="candidate-sub">{cand.rut || 'Sin RUT'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div>{cand.correo}</div>
                                                <div className="candidate-sub">{cand.telefono || 'Sin teléfono'}</div>
                                            </td>
                                            <td>{cand.fechaNacimiento || '—'}</td>
                                            <td>
                                                <span
                                                    className="trello-label-pill small"
                                                    style={{ backgroundColor: famColor.bg, color: famColor.text }}
                                                >
                                                    {cand.familiaCargo || 'General'}
                                                </span>
                                                <div className="table-cargo-text">{cand.cargoPostulacion}</div>
                                            </td>
                                            <td className="date-cell">
                                                {fechaPost ? (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                                        <FiClock />
                                                        {new Date(fechaPost).toLocaleDateString('es-CL')}
                                                    </span>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td>
                                                {cand.urlCv ? (
                                                    <span className="trello-badge ia-badge" title={cand.urlCv}>
                                                        <FiFileText /> Adjunto
                                                    </span>
                                                ) : (
                                                    <span className="no-ia-text">Sin CV</span>
                                                )}
                                            </td>
                                            <td>
                                                <button className="btn-table-view" onClick={() => abrirEdicion(cand)}>
                                                    <FiEdit2 /> Editar
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {editando && (
                <div className="modal-overlay" onClick={() => setEditando(null)}>
                    <div className="modern-create-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="create-modal-header">
                            <div className="create-header-title">
                                <div className="create-icon-badge"><FiUser /></div>
                                <div>
                                    <h3>Editar Candidato #{editando.id}</h3>
                                    <p>Actualiza los datos personales o el cargo asociado.</p>
                                </div>
                            </div>
                            <button className="trello-modal-close" onClick={() => setEditando(null)}>
                                <FiX />
                            </button>
                        </div>

                        <form onSubmit={guardarEdicion} className="create-modal-form">
                            <div className="create-form-grid-2">
                                <div className="create-field">
                                    <label>RUT <span>*</span></label>
                                    <input
                                        type="text"
                                        value={editando.rut}
                                        onChange={(e) => setEditando({ ...editando, rut: e.target.value })}
                                        maxLength={12}
                                        required
                                    />
                                </div>
                                <div className="create-field">
                                    <label>Nombre Completo <span>*</span></label>
                                    <input
                                        type="text"
                                        value={editando.nombre}
                                        onChange={(e) => setEditando({ ...editando, nombre: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="create-form-grid-2">
                                <div className="create-field">
                                    <label>Correo Electrónico <span>*</span></label>
                                    <input
                                        type="email"
                                        value={editando.correo}
                                        onChange={(e) => setEditando({ ...editando, correo: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="create-field">
                                    <label>Teléfono</label>
                                    <input
                                        type="text"
                                        value={editando.telefono}
                                        onChange={(e) => setEditando({ ...editando, telefono: e.target.value })}
                                        maxLength={15}
                                    />
                                </div>
                            </div>

                            <div className="create-form-grid-2">
                                <div className="create-field">
                                    <label>Fecha de Nacimiento <span>*</span></label>
                                    <SelectorFechaNacimiento
                                        value={editando.fechaNacimiento}
                                        theme="dark"
                                        onChange={(val) => setEditando(prev => ({ ...prev, fechaNacimiento: val }))}
                                    />
                                </div>
                                <div className="create-field">
                                    <label>Familia de Cargo <span>*</span></label>
                                    <select
                                        value={editando.familiaCargo}
                                        onChange={(e) => setEditando({ ...editando, familiaCargo: e.target.value })}
                                    >
                                        {FAMILIAS_BASE.map(fam => (
                                            <option key={fam} value={fam}>{fam}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="create-field">
                                <label>Cargo de Postulación <span>*</span></label>
                                <input
                                    type="text"
                                    value={editando.cargoPostulacion}
                                    onChange={(e) => setEditando({ ...editando, cargoPostulacion: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="create-modal-footer">
                                <button type="button" className="btn-cancelar" onClick={() => setEditando(null)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-guardar-modern" disabled={guardando}>
                                    {guardando ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
};

export default DirectorioCandidatos;