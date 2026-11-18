import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FiTrello, FiPieChart, FiPlus, FiLogOut,
    FiClock, FiCheckCircle, FiAlertCircle,
    FiCpu, FiTrash2, FiX, FiAlignLeft,
    FiUserCheck, FiFileText, FiUploadCloud,
    FiUser, FiMail, FiPhone, FiCreditCard, FiBriefcase,
    FiCalendar, FiRefreshCw, FiUsers, FiUserPlus
} from 'react-icons/fi';
import api from '../services/api';
import MetricasPsicologo from './MetricasPsicologo';
import TableroKanban from './TableroKanban';
import GestionOfertas from './GestionOfertas';
import DirectorioCandidatos from './DirectorioCandidatos';
import GestionUsuarios from './GestionUsuarios';
import './DashboardPsicologo.css';

const opcionesCargos = {
    Operativo: ['Operario de Planta', 'Asistente de Producción', 'Técnico de Mantenimiento', 'Operario de Grúa'],
    Administrativo: ['Asistente Administrativo', 'Analista Contable', 'Recepcionista', 'Ejecutivo de RRHH'],
    Jefatura: ['Jefe de Turno', 'Jefe de Planta', 'Supervisor de Área', 'Jefe de Logística'],
    Gerencia: ['Gerente de Operaciones', 'Gerente Comercial', 'Gerente de Finanzas'],
    TI: ['Desarrollador Java', 'Analista de Sistemas', 'Soporte TI', 'Ingeniero DevOps']
};

const COLORES_FAMILIA = {
    Operativo: { bg: '#0284c7', text: '#e0f2fe' },
    Administrativo: { bg: '#d97706', text: '#fef3c7' },
    Jefatura: { bg: '#7c3aed', text: '#ede9fe' },
    Gerencia: { bg: '#059669', text: '#d1fae5' },
    TI: { bg: '#0891b2', text: '#cffafe' }
};

const obtenerColorFamilia = (familia) => {
    return COLORES_FAMILIA[familia] || { bg: '#475569', text: '#f1f5f9' };
};

const obtenerIniciales = (nombre) => {
    if (!nombre) return 'AC';
    const partes = nombre.trim().split(' ');
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
};

const DashboardPsicologo = ({ usuario, alCerrarSesion }) => {
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [analizandoIaId, setAnalizandoIaId] = useState(null);

    // Vistas: 'overview' | 'board' | 'candidatos' | 'ofertas' | 'usuarios'
    const [vistaActiva, setVistaActiva] = useState('overview');
    const [busqueda, setBusqueda] = useState('');
    const [filtroFamilia, setFiltroFamilia] = useState('TODAS');

    const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
    const [confirmarModal, setConfirmarModal] = useState({ isOpen: false, solicitudId: null });
    const [evaluacionModal, setEvaluacionModal] = useState({ isOpen: false, solicitudId: null });
    const [datosEvaluacion, setDatosEvaluacion] = useState({ resultadoGeneral: 'Apto', observaciones: '' });

    const [crearModalOpen, setCrearModalOpen] = useState(false);
    const [errorCrear, setErrorCrear] = useState('');
    const [nuevaPostulacion, setNuevaPostulacion] = useState({
        rut: '',
        nombre: '',
        fechaNacimiento: '',
        correo: '',
        telefono: '',
        familiaCargo: 'Operativo',
        cargoPostulacion: opcionesCargos['Operativo'][0]
    });
    const [cvFile, setCvFile] = useState(null);
    const [guardandoPostulacion, setGuardandoPostulacion] = useState(false);

    const esAdmin = usuario?.rol === 'ADMIN';

    const columnas = [
        { key: 'NUEVA_POSTULACION', titulo: 'Nuevas Postulaciones', color: '#38bdf8' },
        { key: 'PENDIENTE', titulo: 'Pendientes de Revisión', color: '#f59e0b' },
        { key: 'EN_PROCESO', titulo: 'En Evaluación Psicológica', color: '#a855f7' },
        { key: 'FINALIZADA', titulo: 'Finalizadas', color: '#10b981' }
    ];

    const fetchSolicitudes = async (silencioso = false) => {
        if (!silencioso) setLoading(true);
        else setRefrescando(true);

        try {
            const response = await api.get('/solicitudes');
            if (Array.isArray(response.data)) {
                setSolicitudes(response.data);
                setSolicitudSeleccionada(prev => {
                    if (!prev) return null;
                    return response.data.find(item => item.id === prev.id) || prev;
                });
            }
        } catch (error) {
            console.error('Error al cargar solicitudes:', error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                alert('Tu sesión expiró o no tienes permisos. Por favor vuelve a iniciar sesión.');
                alCerrarSesion();
            }
        } finally {
            setLoading(false);
            setRefrescando(false);
        }
    };

    useEffect(() => {
        fetchSolicitudes();
    }, []);

    // Polling automático cada 12s solo si hay solicitudes en EN_PROCESO esperando respuesta de Gemini
    useEffect(() => {
        const hayPendientesIa = solicitudes.some(
            s => s.estado === 'EN_PROCESO' && !s.recomendacionIa
        );
        if (!hayPendientesIa) return;

        const intervalo = setInterval(() => {
            fetchSolicitudes(true);
        }, 12000);

        return () => clearInterval(intervalo);
    }, [solicitudes]);

    const handleDropTarjeta = (id, estadoActual, nuevoEstado) => {
        if (!id || estadoActual === nuevoEstado) return;
        if (nuevoEstado === 'FINALIZADA') {
            setConfirmarModal({ isOpen: true, solicitudId: id });
        } else {
            actualizarEstado(id, nuevoEstado);
        }
    };

    const cambiarEstadoDesdeModal = (id, nuevoEstado) => {
        if (nuevoEstado === 'FINALIZADA') {
            setSolicitudSeleccionada(null);
            setConfirmarModal({ isOpen: true, solicitudId: id });
        } else {
            actualizarEstado(id, nuevoEstado);
        }
    };

    const aceptarConfirmacion = () => {
        const id = confirmarModal.solicitudId;
        setConfirmarModal({ isOpen: false, solicitudId: null });
        setEvaluacionModal({ isOpen: true, solicitudId: id });
    };

    const actualizarEstado = async (id, nuevoEstado) => {
        const pasaAEvaluacion = nuevoEstado === 'EN_PROCESO';
        if (pasaAEvaluacion) {
            setAnalizandoIaId(id);
        }

        try {
            const payload = { estado: nuevoEstado };
            if (usuario?.id) {
                payload.responsableId = usuario.id;
            }

            const response = await api.patch(`/solicitudes/${id}/estado`, payload);
            const solicitudActualizada = response?.data;

            if (solicitudActualizada && solicitudActualizada.id) {
                setSolicitudes(prev =>
                    prev.map(s => (s.id.toString() === id.toString() ? solicitudActualizada : s))
                );
                setSolicitudSeleccionada(prev =>
                    prev && prev.id.toString() === id.toString() ? solicitudActualizada : prev
                );
            } else {
                await fetchSolicitudes(true);
            }
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            alert(error.response?.data?.message || 'No se pudo actualizar el estado de la solicitud.');
        } finally {
            setAnalizandoIaId(null);
        }
    };

    const enviarEvaluacion = async () => {
        if (!datosEvaluacion.resultadoGeneral.trim()) {
            alert('El resultado general es obligatorio.');
            return;
        }

        try {
            await api.post('/evaluaciones', {
                solicitudId: parseInt(evaluacionModal.solicitudId, 10),
                resultadoGeneral: datosEvaluacion.resultadoGeneral,
                observaciones: datosEvaluacion.observaciones
            });
            cerrarModalEvaluacion();
            await fetchSolicitudes(true);
        } catch (error) {
            console.error('Error al registrar evaluación:', error);
            alert(error.response?.data?.message || 'Error al guardar la evaluación psicolaboral.');
        }
    };

    const cerrarModalEvaluacion = () => {
        setEvaluacionModal({ isOpen: false, solicitudId: null });
        setDatosEvaluacion({ resultadoGeneral: 'Apto', observaciones: '' });
    };

    const eliminarSolicitud = async (id, nombre) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar la solicitud de ${nombre}?`)) return;

        try {
            await api.delete(`/solicitudes/${id}`);
            setSolicitudSeleccionada(null);
            await fetchSolicitudes(true);
        } catch (error) {
            console.error('Error al eliminar solicitud:', error);
            if (error.response?.status === 403) {
                alert('Solo los usuarios con rol ADMIN pueden eliminar solicitudes.');
            } else {
                alert(error.response?.data?.message || 'No se pudo eliminar la solicitud.');
            }
        }
    };

    const abrirModalCrear = () => {
        setErrorCrear('');
        setCrearModalOpen(true);
    };

    const handleCrearChange = (e) => {
        const { name, value } = e.target;
        setErrorCrear('');
        if (name === 'familiaCargo') {
            setNuevaPostulacion({
                ...nuevaPostulacion,
                familiaCargo: value,
                cargoPostulacion: opcionesCargos[value][0]
            });
        } else {
            setNuevaPostulacion({ ...nuevaPostulacion, [name]: value });
        }
    };

    const handleCrearSubmit = async (e) => {
        e.preventDefault();
        const rutLimpio = nuevaPostulacion.rut.trim();
        const rutRegex = /^[0-9.]+-[0-9kK]{1}$/;

        if (!rutLimpio || !rutRegex.test(rutLimpio)) {
            setErrorCrear('Ingresa un RUT válido con guion y dígito verificador (Ej: 12345678-9).');
            return;
        }
        if (!nuevaPostulacion.nombre.trim()) {
            setErrorCrear('El nombre completo del candidato es obligatorio.');
            return;
        }
        if (!nuevaPostulacion.fechaNacimiento) {
            setErrorCrear('La fecha de nacimiento es obligatoria.');
            return;
        }
        if (!nuevaPostulacion.correo.trim()) {
            setErrorCrear('El correo electrónico es obligatorio.');
            return;
        }

        setGuardandoPostulacion(true);

        try {
            const data = new FormData();
            data.append('candidato', new Blob([JSON.stringify(nuevaPostulacion)], { type: 'application/json' }));
            if (cvFile) {
                data.append('cv', cvFile);
            }

            await api.post('/postulaciones/public', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            limpiarFormulario();
            await fetchSolicitudes(true);
        } catch (error) {
            console.error('Error al crear postulación:', error);
            setErrorCrear(
                error.response?.data?.message ||
                'No se pudo registrar la postulación. Verifica que el RUT y correo no estén duplicados.'
            );
            setGuardandoPostulacion(false);
        }
    };

    const limpiarFormulario = () => {
        setGuardandoPostulacion(false);
        setCrearModalOpen(false);
        setErrorCrear('');
        setNuevaPostulacion({
            rut: '',
            nombre: '',
            fechaNacimiento: '',
            correo: '',
            telefono: '',
            familiaCargo: 'Operativo',
            cargoPostulacion: opcionesCargos['Operativo'][0]
        });
        setCvFile(null);
    };

    if (loading && solicitudes.length === 0) {
        return <div className="trello-loading">Cargando espacio de trabajo de AquaChile...</div>;
    }

    const listaSegura = Array.isArray(solicitudes) ? solicitudes : [];

    const areasDisponibles = Array.from(
        new Set([
            ...Object.keys(opcionesCargos),
            ...listaSegura.map(s => s.familiaCargo).filter(Boolean)
        ])
    );

    const solicitudesFiltradas = listaSegura.filter(sol => {
        const query = busqueda.toLowerCase();
        const coincideTexto =
            (sol.nombreCandidato || '').toLowerCase().includes(query) ||
            (sol.cargo || '').toLowerCase().includes(query) ||
            `#sol-${sol.id}`.includes(query);
        const coincideFamilia = filtroFamilia === 'TODAS' || sol.familiaCargo === filtroFamilia;
        return coincideTexto && coincideFamilia;
    });

    return (
        <div className="trello-workspace">
            {/* BARRA SUPERIOR GLOBAL */}
            <header className="trello-topbar">
                <div className="topbar-left">
                    <Link to="/" className="trello-brand" style={{ textDecoration: 'none' }}>
                        <div className="brand-wave">🌊</div>
                        <span className="brand-name">AquaChile</span>
                    </Link>
                    <span className="workspace-badge">Portal Psicólogos</span>
                </div>

                <div className="topbar-right">
                    <button
                        onClick={() => fetchSolicitudes(true)}
                        className="btn-trello-refresh"
                        title="Actualizar datos y revisar respuestas de IA"
                        disabled={refrescando}
                    >
                        <FiRefreshCw className={refrescando ? 'spin-refresh' : ''} />
                        {refrescando ? 'Actualizando...' : 'Actualizar'}
                    </button>

                    <button onClick={abrirModalCrear} className="btn-trello-create">
                        <FiPlus /> Nueva Postulación
                    </button>

                    <div className="user-profile-chip">
                        <div className="user-avatar">
                            {obtenerIniciales(usuario?.nombre || 'Evaluador')}
                        </div>
                        <span className="user-name">
                            {usuario?.nombre || 'Evaluador'} ({usuario?.rol || 'USER'})
                        </span>
                    </div>

                    <button onClick={alCerrarSesion} className="btn-trello-logout" title="Cerrar Sesión">
                        <FiLogOut /> Salir
                    </button>
                </div>
            </header>

            {/* ESTRUCTURA CON SIDEBAR + CONTENIDO PRINCIPAL */}
            <div className="portal-shell">
                <aside className="portal-sidebar">
                    <div className="sidebar-group-title">Selección</div>
                    <button
                        className={`sidebar-nav-item ${vistaActiva === 'overview' ? 'active' : ''}`}
                        onClick={() => setVistaActiva('overview')}
                    >
                        <FiPieChart /> <span>Resumen y Métricas</span>
                    </button>
                    <button
                        className={`sidebar-nav-item ${vistaActiva === 'board' ? 'active' : ''}`}
                        onClick={() => setVistaActiva('board')}
                    >
                        <FiTrello /> <span>Tablero Kanban</span>
                        <span className="sidebar-pill">{listaSegura.length}</span>
                    </button>
                    <button
                        className={`sidebar-nav-item ${vistaActiva === 'candidatos' ? 'active' : ''}`}
                        onClick={() => setVistaActiva('candidatos')}
                    >
                        <FiUsers /> <span>Directorio Candidatos</span>
                    </button>

                    {esAdmin && (
                        <>
                            <div className="sidebar-group-title">Administración</div>
                            <button
                                className={`sidebar-nav-item ${vistaActiva === 'ofertas' ? 'active' : ''}`}
                                onClick={() => setVistaActiva('ofertas')}
                            >
                                <FiBriefcase /> <span>Gestión de Ofertas</span>
                            </button>
                            <button
                                className={`sidebar-nav-item ${vistaActiva === 'usuarios' ? 'active' : ''}`}
                                onClick={() => setVistaActiva('usuarios')}
                            >
                                <FiUserPlus /> <span>Gestión de Equipo</span>
                            </button>
                        </>
                    )}
                </aside>

                <div className="portal-content-area">
                    {vistaActiva === 'overview' && (
                        <MetricasPsicologo
                            solicitudes={listaSegura}
                            solicitudesFiltradas={solicitudesFiltradas}
                            columnas={columnas}
                            areasDisponibles={areasDisponibles}
                            obtenerColorFamilia={obtenerColorFamilia}
                            obtenerIniciales={obtenerIniciales}
                            onIrAlTablero={() => setVistaActiva('board')}
                            onSeleccionarSolicitud={setSolicitudSeleccionada}
                        />
                    )}

                    {vistaActiva === 'board' && (
                        <TableroKanban
                            solicitudes={listaSegura}
                            solicitudesFiltradas={solicitudesFiltradas}
                            columnas={columnas}
                            areasDisponibles={areasDisponibles}
                            obtenerColorFamilia={obtenerColorFamilia}
                            busqueda={busqueda}
                            setBusqueda={setBusqueda}
                            filtroFamilia={filtroFamilia}
                            setFiltroFamilia={setFiltroFamilia}
                            analizandoIaId={analizandoIaId}
                            obtenerIniciales={obtenerIniciales}
                            onSeleccionarSolicitud={setSolicitudSeleccionada}
                            onAbrirCrearEnColumna={abrirModalCrear}
                            onDropTarjeta={handleDropTarjeta}
                        />
                    )}

                    {vistaActiva === 'candidatos' && (
                        <DirectorioCandidatos obtenerIniciales={obtenerIniciales} />
                    )}

                    {vistaActiva === 'ofertas' && esAdmin && <GestionOfertas />}

                    {vistaActiva === 'usuarios' && esAdmin && <GestionUsuarios />}
                </div>
            </div>

            {/* ================= MODAL CREAR NUEVA POSTULACIÓN ================= */}
            {crearModalOpen && (
                <div className="modal-overlay" onClick={() => setCrearModalOpen(false)}>
                    <div className="modern-create-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="create-modal-header">
                            <div className="create-header-title">
                                <div className="create-icon-badge"><FiPlus /></div>
                                <div>
                                    <h3>Registrar Nueva Postulación</h3>
                                    <p>Ingresará en <strong>Nuevas Postulaciones</strong> lista para revisión.</p>
                                </div>
                            </div>
                            <button className="trello-modal-close" onClick={() => setCrearModalOpen(false)}>
                                <FiX />
                            </button>
                        </div>

                        {errorCrear && (
                            <div className="create-error-banner">
                                <FiAlertCircle />
                                <span>{errorCrear}</span>
                            </div>
                        )}

                        <form onSubmit={handleCrearSubmit} className="create-modal-form" noValidate>
                            <div className="create-form-grid-2">
                                <div className="create-field">
                                    <label><FiCreditCard /> RUT del Candidato <span>*</span></label>
                                    <input
                                        type="text"
                                        name="rut"
                                        value={nuevaPostulacion.rut}
                                        onChange={handleCrearChange}
                                        placeholder="Ej: 18456789-K"
                                        maxLength={12}
                                        required
                                    />
                                </div>
                                <div className="create-field">
                                    <label><FiUser /> Nombre Completo <span>*</span></label>
                                    <input
                                        type="text"
                                        name="nombre"
                                        value={nuevaPostulacion.nombre}
                                        onChange={handleCrearChange}
                                        placeholder="Ej: Sofía Vargas"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="create-form-grid-2">
                                <div className="create-field">
                                    <label><FiCalendar /> Fecha de Nacimiento <span>*</span></label>
                                    <input
                                        type="date"
                                        name="fechaNacimiento"
                                        value={nuevaPostulacion.fechaNacimiento}
                                        onChange={handleCrearChange}
                                        required
                                    />
                                </div>
                                <div className="create-field">
                                    <label><FiPhone /> Teléfono de Contacto</label>
                                    <input
                                        type="text"
                                        name="telefono"
                                        value={nuevaPostulacion.telefono}
                                        onChange={handleCrearChange}
                                        placeholder="+56912345678"
                                        maxLength={15}
                                    />
                                </div>
                            </div>

                            <div className="create-field">
                                <label><FiMail /> Correo Electrónico <span>*</span></label>
                                <input
                                    type="email"
                                    name="correo"
                                    value={nuevaPostulacion.correo}
                                    onChange={handleCrearChange}
                                    placeholder="correo@ejemplo.cl"
                                    required
                                />
                            </div>

                            <div className="create-form-grid-2">
                                <div className="create-field">
                                    <label><FiBriefcase /> Familia de Cargo</label>
                                    <select
                                        name="familiaCargo"
                                        value={nuevaPostulacion.familiaCargo}
                                        onChange={handleCrearChange}
                                    >
                                        {Object.keys(opcionesCargos).map(fam => (
                                            <option key={fam} value={fam}>{fam}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="create-field">
                                    <label><FiBriefcase /> Cargo Específico</label>
                                    <select
                                        name="cargoPostulacion"
                                        value={nuevaPostulacion.cargoPostulacion}
                                        onChange={handleCrearChange}
                                    >
                                        {opcionesCargos[nuevaPostulacion.familiaCargo].map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="create-field">
                                <label><FiUploadCloud /> Currículum Vitae (PDF)</label>
                                <label htmlFor="modal-cv-upload" className="modern-cv-dropzone">
                                    <input
                                        id="modal-cv-upload"
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => setCvFile(e.target.files[0])}
                                        style={{ display: 'none' }}
                                    />
                                    <FiUploadCloud className="dropzone-icon" />
                                    <div className="dropzone-texts">
                                        <strong>
                                            {cvFile ? cvFile.name : 'Haz clic aquí para adjuntar el CV en PDF'}
                                        </strong>
                                        <span>Gemini IA evaluará este PDF cuando el candidato pase a "En Evaluación Psicológica"</span>
                                    </div>
                                </label>
                            </div>

                            <div className="create-modal-footer">
                                <button type="button" onClick={() => setCrearModalOpen(false)} className="btn-cancelar">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={guardandoPostulacion} className="btn-guardar-modern">
                                    {guardandoPostulacion ? 'Registrando...' : 'Crear Postulación'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ================= MODAL DETALLE ESTILO TARJETA TRELLO ================= */}
            {solicitudSeleccionada && (
                <div className="modal-overlay" onClick={() => setSolicitudSeleccionada(null)}>
                    <div className="trello-detail-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="trello-modal-close" onClick={() => setSolicitudSeleccionada(null)}>
                            <FiX />
                        </button>

                        <div className="trello-modal-header">
                            <div className="modal-avatar-large">
                                {obtenerIniciales(solicitudSeleccionada.nombreCandidato)}
                            </div>
                            <div>
                                <div className="modal-title-row">
                                    <h2>{solicitudSeleccionada.nombreCandidato}</h2>
                                    <span className="modal-id-tag">#SOL-{solicitudSeleccionada.id}</span>
                                </div>
                                <p className="modal-subtitle-list">
                                    Postulando a <strong>{solicitudSeleccionada.cargo}</strong> en la lista{' '}
                                    <span className="underline-stage">
                                        {columnas.find(c => c.key === solicitudSeleccionada.estado)?.titulo}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="trello-modal-body">
                            <div className="trello-modal-main">
                                <div className="trello-meta-row">
                                    <div className="meta-item">
                                        <span className="meta-label">Área / Familia</span>
                                        <span
                                            className="trello-label-pill"
                                            style={{
                                                backgroundColor: obtenerColorFamilia(solicitudSeleccionada.familiaCargo).bg,
                                                color: obtenerColorFamilia(solicitudSeleccionada.familiaCargo).text
                                            }}
                                        >
                                            {solicitudSeleccionada.familiaCargo || 'General'}
                                        </span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">Responsable</span>
                                        <span className="meta-val">
                                            <FiUserCheck /> {solicitudSeleccionada.nombreResponsable || 'Sin asignar'}
                                        </span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">Fecha Postulación</span>
                                        <span className="meta-val">
                                            <FiClock />{' '}
                                            {solicitudSeleccionada.fechaSolicitud
                                                ? new Date(solicitudSeleccionada.fechaSolicitud).toLocaleDateString('es-CL')
                                                : 'Reciente'}
                                        </span>
                                    </div>
                                </div>

                                <div className="trello-section-block ia-block">
                                    <div className="section-block-title" style={{ justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <FiCpu className="icon-cyan" />
                                            <h4>Evaluación de CV con IA (Gemini)</h4>
                                        </div>
                                        {solicitudSeleccionada.estado === 'EN_PROCESO' && !solicitudSeleccionada.recomendacionIa && (
                                            <button
                                                className="btn-mini-refresh"
                                                onClick={() => fetchSolicitudes(true)}
                                            >
                                                <FiRefreshCw /> Comprobar resultado
                                            </button>
                                        )}
                                    </div>
                                    {solicitudSeleccionada.estado === 'EN_PROCESO' || solicitudSeleccionada.estado === 'FINALIZADA' ? (
                                        <p className="ia-content-box">
                                            {solicitudSeleccionada.recomendacionIa ||
                                                'Gemini está analizando el CV en segundo plano. Se actualizará automáticamente en unos segundos.'}
                                        </p>
                                    ) : (
                                        <div className="eval-pending-box">
                                            <p>
                                                La evaluación automática de IA se ejecuta cuando el candidato avanza a la etapa{' '}
                                                <strong>En Evaluación Psicológica</strong>.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="trello-section-block">
                                    <div className="section-block-title">
                                        <FiAlignLeft />
                                        <h4>Antecedentes y Notas de Postulación</h4>
                                    </div>
                                    <div className="description-box">
                                        {solicitudSeleccionada.observaciones || 'Sin observaciones adicionales registradas.'}
                                    </div>
                                </div>

                                <div className="trello-section-block">
                                    <div className="section-block-title">
                                        <FiFileText />
                                        <h4>Dictamen de Evaluación Psicolaboral</h4>
                                    </div>
                                    {solicitudSeleccionada.estado === 'FINALIZADA' || solicitudSeleccionada.resultadoEvaluacion ? (
                                        <div className="eval-result-card">
                                            <div className="eval-status-line">
                                                <span>Estado de Aprobación:</span>
                                                <strong className="eval-highlight">
                                                    {solicitudSeleccionada.resultadoEvaluacion || 'Completado'}
                                                </strong>
                                            </div>
                                            <p>{solicitudSeleccionada.observacionEvaluacion || 'Sin comentarios finales.'}</p>
                                        </div>
                                    ) : (
                                        <div className="eval-pending-box">
                                            <p>La evaluación final aún está pendiente. Mueve la tarjeta a <strong>Finalizadas</strong> o presiona el botón lateral para registrar el dictamen.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <aside className="trello-modal-sidebar">
                                <h5>Mover a etapa</h5>
                                {columnas.map(col => (
                                    <button
                                        key={col.key}
                                        disabled={solicitudSeleccionada.estado === col.key}
                                        className={`sidebar-action-btn ${solicitudSeleccionada.estado === col.key ? 'current-stage' : ''}`}
                                        onClick={() => cambiarEstadoDesdeModal(solicitudSeleccionada.id, col.key)}
                                    >
                                        <span className="dot" style={{ backgroundColor: col.color }}></span>
                                        {col.titulo}
                                    </button>
                                ))}

                                <h5 style={{ marginTop: '20px' }}>Acciones</h5>
                                <button
                                    className="sidebar-action-btn primary-eval-btn"
                                    onClick={() => {
                                        const id = solicitudSeleccionada.id;
                                        setSolicitudSeleccionada(null);
                                        setEvaluacionModal({ isOpen: true, solicitudId: id });
                                    }}
                                >
                                    <FiCheckCircle /> Evaluar y Finalizar
                                </button>

                                {esAdmin && (
                                    <button
                                        className="sidebar-action-btn danger-btn"
                                        onClick={() => eliminarSolicitud(solicitudSeleccionada.id, solicitudSeleccionada.nombreCandidato)}
                                    >
                                        <FiTrash2 /> Eliminar Solicitud
                                    </button>
                                )}
                            </aside>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= MODAL CONFIRMAR PASO A FINALIZADO ================= */}
            {confirmarModal.isOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ textAlign: 'center', maxWidth: '380px' }}>
                        <FiAlertCircle style={{ fontSize: '42px', color: '#38bdf8', marginBottom: '12px' }} />
                        <h3 style={{ marginBottom: '10px', fontSize: '19px' }}>¿Finalizar proceso del candidato?</h3>
                        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
                            Al mover la tarjeta a <strong>Finalizadas</strong>, registrarás el resultado psicolaboral definitivo.
                        </p>
                        <div className="modal-buttons" style={{ justifyContent: 'center', gap: '15px' }}>
                            <button onClick={() => setConfirmarModal({ isOpen: false, solicitudId: null })} className="btn-cancelar">
                                Cancelar
                            </button>
                            <button onClick={aceptarConfirmacion} className="btn-guardar">
                                Continuar y Evaluar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= MODAL REGISTRAR RESULTADO EVALUACIÓN ================= */}
            {evaluacionModal.isOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Registrar Dictamen Psicolaboral</h3>
                        <div className="modal-actions">
                            <label>Resultado General:</label>
                            <select
                                value={datosEvaluacion.resultadoGeneral}
                                onChange={(e) => setDatosEvaluacion({ ...datosEvaluacion, resultadoGeneral: e.target.value })}
                                className="modal-select"
                            >
                                <option value="Apto">Apto</option>
                                <option value="Apto con Observaciones">Apto con Observaciones</option>
                                <option value="No Apto">No Apto</option>
                            </select>
                            <label style={{ marginTop: '10px' }}>Conclusiones e Informe Psicológico:</label>
                            <textarea
                                value={datosEvaluacion.observaciones}
                                onChange={(e) => setDatosEvaluacion({ ...datosEvaluacion, observaciones: e.target.value })}
                                className="modal-textarea"
                                rows="4"
                                placeholder="Escribe las fortalezas, brechas detectadas o comentarios de la entrevista..."
                            />
                        </div>
                        <div className="modal-buttons">
                            <button onClick={cerrarModalEvaluacion} className="btn-cancelar">Cancelar</button>
                            <button onClick={enviarEvaluacion} className="btn-guardar">Guardar y Finalizar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardPsicologo;