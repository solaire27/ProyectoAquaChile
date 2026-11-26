import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    FiTrello, FiPieChart, FiPlus, FiLogOut,
    FiClock, FiCheckCircle, FiAlertCircle,
    FiCpu, FiTrash2, FiX, FiAlignLeft,
    FiUserCheck, FiFileText, FiUploadCloud,
    FiUser, FiMail, FiPhone, FiCreditCard, FiBriefcase,
    FiCalendar, FiRefreshCw, FiUsers, FiUserPlus,
    FiExternalLink, FiPrinter, FiInfo, FiShield, FiInbox,
    FiCornerUpLeft, FiMessageSquare
} from 'react-icons/fi';
import api from '../services/api';
import { analizarEstadoIa, parsearAnalisisIa } from '../utils/iaHelper';
import MetricasPsicologo from './MetricasPsicologo';
import TableroKanban from './TableroKanban';
import GestionOfertas from './GestionOfertas';
import DirectorioCandidatos from './DirectorioCandidatos';
import GestionUsuarios from './GestionUsuarios';
import CalendarioEntrevistas from './CalendarioEntrevistas';
import BandejaPostulaciones from './BandejaPostulaciones';
import {
    SelectorFechaNacimiento,
    SelectorFechaEntrevista,
    SelectorHoraEntrevista
} from './SelectorFecha';
import './DashboardPsicologo.css';
import AquaLoader from './AquaLoader';
import LogoAquaChile from './LogoAquaChile';

const MAX_PDF_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

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

const escaparHtml = (texto) => {
    if (!texto) return '';
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
};

const construirUrlGoogleCalendarDesdeSolicitud = (sol) => {
    if (!sol || !sol.fechaEntrevista) return '';
    const inicio = new Date(sol.fechaEntrevista);
    const duracion = parseInt(sol.duracionEntrevistaMinutos, 10) || 45;
    const fin = new Date(inicio.getTime() + duracion * 60000);

    const formatearUtc = (date) =>
        date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const titulo = `Entrevista Psicolaboral AquaChile — ${sol.nombreCandidato} (${sol.cargo})`;
    const detalle = [
        `Candidato: ${sol.nombreCandidato}`,
        `Cargo: ${sol.cargo} (${sol.familiaCargo || 'General'})`,
        `Solicitud: #SOL-${sol.id}`,
        sol.notasEntrevista ? `Notas: ${sol.notasEntrevista}` : ''
    ]
        .filter(Boolean)
        .join('\n');

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: titulo,
        dates: `${formatearUtc(inicio)}/${formatearUtc(fin)}`,
        details: detalle,
        location: sol.modalidadEntrevista || 'Online'
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

const resolverVistaDesdeRuta = (pathname) => {
    const limpia = pathname.replace(/\/+$/, '');
    if (limpia === '/dashboard/bandeja') return 'bandeja';
    if (limpia === '/dashboard/kanban') return 'board';
    if (limpia === '/dashboard/calendario') return 'calendario';
    if (limpia === '/dashboard/candidatos') return 'candidatos';
    if (limpia === '/dashboard/ofertas') return 'ofertas';
    if (limpia === '/dashboard/equipo') return 'usuarios';
    return 'overview';
};

const DashboardPsicologo = ({ usuario, alCerrarSesion }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const [solicitudes, setSolicitudes] = useState([]);
    const [metricasEquipo, setMetricasEquipo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [analizandoIaId, setAnalizandoIaId] = useState(null);
    const [tomandoId, setTomandoId] = useState(null);
    const [desasignando, setDesasignando] = useState(false);
    const [cargandoCv, setCargandoCv] = useState(false);
    const [toasts, setToasts] = useState([]);

    const [busqueda, setBusqueda] = useState('');
    const [filtroFamilia, setFiltroFamilia] = useState('TODAS');
    const [filtroFecha, setFiltroFecha] = useState('TODAS');

    const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
    const [confirmarModal, setConfirmarModal] = useState({ isOpen: false, solicitudId: null });
    const [eliminarModal, setEliminarModal] = useState({ isOpen: false, id: null, nombre: '' });
    const [desasignarModal, setDesasignarModal] = useState({ isOpen: false, solicitud: null });
    const [evaluacionModal, setEvaluacionModal] = useState({ isOpen: false, solicitudId: null });
    const [datosEvaluacion, setDatosEvaluacion] = useState({ resultadoGeneral: 'Apto', observaciones: '' });

    const [entrevistaModal, setEntrevistaModal] = useState({
        isOpen: false,
        solicitud: null,
        moverAEnProceso: false
    });
    const [datosEntrevista, setDatosEntrevista] = useState({
        fecha: '',
        hora: '10:00',
        duracionMinutos: 45,
        modalidad: 'Online (Google Meet)',
        notas: ''
    });
    const [agendandoEntrevista, setAgendandoEntrevista] = useState(false);

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

    const rolActual = usuario?.rol || 'PSICOLOGO';
    const esAdmin = rolActual === 'ADMIN';
    const esAnalista = rolActual === 'ANALISTA';
    const puedeGestionarFlujo = !esAnalista;

    const vistaActiva = resolverVistaDesdeRuta(location.pathname);

    // Protección de rutas internas por rol
    useEffect(() => {
        if (!esAdmin && (vistaActiva === 'ofertas' || vistaActiva === 'usuarios')) {
            navigate('/dashboard', { replace: true });
        } else if (esAnalista && (vistaActiva === 'bandeja' || vistaActiva === 'calendario')) {
            navigate('/dashboard', { replace: true });
        }
    }, [vistaActiva, esAdmin, esAnalista, navigate]);

    const columnas = [
        { key: 'NUEVA_POSTULACION', titulo: 'Nuevas Postulaciones', color: '#38bdf8' },
        { key: 'PENDIENTE', titulo: 'Pendientes de Revisión', color: '#f59e0b' },
        { key: 'EN_PROCESO', titulo: 'En Evaluación Psicológica', color: '#a855f7' },
        { key: 'FINALIZADA', titulo: 'Finalizadas', color: '#10b981' }
    ];

    const esResponsableActual = (sol) => {
        if (!sol) return false;
        if (usuario?.id && sol.responsableId !== null && sol.responsableId !== undefined) {
            return Number(sol.responsableId) === Number(usuario.id);
        }
        if (usuario?.nombre && sol.nombreResponsable) {
            return sol.nombreResponsable.trim().toLowerCase() === usuario.nombre.trim().toLowerCase();
        }
        return false;
    };

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

    const cargarMetricasEquipo = async () => {
        if (!esAdmin && !esAnalista) return;
        try {
            const resMetricas = await api.get('/metricas/psicologos');
            setMetricasEquipo(resMetricas.data);
        } catch (errMetricas) {
            console.error('Error al cargar métricas del equipo:', errMetricas);
        }
    };

    const fetchSolicitudes = async (silencioso = false) => {
        if (!silencioso) setLoading(true);

        try {
            const response = await api.get('/solicitudes');
            if (Array.isArray(response.data)) {
                setSolicitudes(response.data);
                setSolicitudSeleccionada(prev => {
                    if (!prev) return null;
                    return response.data.find(item => item.id === prev.id) || prev;
                });
            }

            await cargarMetricasEquipo();
        } catch (error) {
            console.error('Error al cargar solicitudes:', error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                mostrarToast('Tu sesión expiró o no tienes permisos suficientes.', 'error');
                if (error.response?.status === 401) {
                    setTimeout(() => alCerrarSesion(), 1200);
                }
            } else {
                mostrarToast('No se pudieron actualizar las solicitudes.', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSolicitudes();
    }, []);

    useEffect(() => {
        const hayPendientesIa = solicitudes.some(
            s => (s.estado === 'PENDIENTE' || s.estado === 'EN_PROCESO') && !s.recomendacionIa
        );
        if (!hayPendientesIa) return;

        const intervalo = setInterval(() => {
            fetchSolicitudes(true);
        }, 3000);

        return () => clearInterval(intervalo);
    }, [solicitudes]);

    const aceptarPostulacion = async (sol) => {
        if (!usuario?.id) {
            mostrarToast('No se pudo identificar tu usuario para asignar el caso.', 'error');
            return;
        }

        setTomandoId(sol.id);

        try {
            // Mantiene el estado original (NUEVA_POSTULACION) al pasar al Kanban propio
            const { data } = await api.patch(`/solicitudes/${sol.id}/estado`, {
                estado: sol.estado,
                responsableId: usuario.id
            });

            if (data && data.id) {
                setSolicitudes(prev => prev.map(s => (s.id === data.id ? data : s)));
                setSolicitudSeleccionada(prev => (prev && prev.id === data.id ? data : prev));
            } else {
                await fetchSolicitudes(true);
            }

            await cargarMetricasEquipo();
            mostrarToast(
                `Aceptaste a ${sol.nombreCandidato}. Ya aparece en tu Tablero Kanban en "Nuevas Postulaciones".`,
                'success'
            );
        } catch (error) {
            console.error('Error al aceptar postulación:', error);
            mostrarToast(
                error.response?.data?.message || 'No se pudo asignar la postulación.',
                'error'
            );
        } finally {
            setTomandoId(null);
        }
    };

    const confirmarDevolverABandeja = async () => {
        const sol = desasignarModal.solicitud;
        if (!sol) return;
        setDesasignando(true);

        try {
            const { data } = await api.patch(`/solicitudes/${sol.id}/desasignar`);
            if (data && data.id) {
                setSolicitudes(prev => prev.map(s => (s.id === data.id ? data : s)));
            } else {
                await fetchSolicitudes(true);
            }
            setDesasignarModal({ isOpen: false, solicitud: null });
            setSolicitudSeleccionada(null);
            await cargarMetricasEquipo();
            mostrarToast(
                `La postulación de ${sol.nombreCandidato} fue devuelta a la Bandeja sin Asignar.`,
                'success'
            );
        } catch (error) {
            console.error('Error al devolver postulación a la bandeja:', error);
            mostrarToast(
                error.response?.data?.message || 'No se pudo devolver la postulación a la bandeja.',
                'error'
            );
        } finally {
            setDesasignando(false);
        }
    };

    const abrirCvPdf = async (solicitudId) => {
        setCargandoCv(true);
        try {
            const response = await api.get(`/solicitudes/${solicitudId}/cv`, {
                responseType: 'blob'
            });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank', 'noopener,noreferrer');
            setTimeout(() => window.URL.revokeObjectURL(url), 60000);
        } catch (error) {
            console.error('Error al abrir CV:', error);
            mostrarToast('No se pudo abrir el CV. Verifica que el archivo exista en Supabase.', 'error');
        } finally {
            setCargandoCv(false);
        }
    };

    const reintentarIa = async (solicitudId) => {
        setAnalizandoIaId(solicitudId);
        try {
            const { data } = await api.post(`/solicitudes/${solicitudId}/reintentar-ia`);
            if (data && data.id) {
                setSolicitudes(prev =>
                    prev.map(s => (s.id === data.id ? data : s))
                );
                setSolicitudSeleccionada(prev =>
                    prev && prev.id === data.id ? data : prev
                );
            }
            mostrarToast('Análisis de IA lanzado en segundo plano.', 'info');
        } catch (error) {
            console.error('Error al reintentar análisis de IA:', error);
            mostrarToast('No se pudo lanzar el análisis de IA.', 'error');
        } finally {
            setAnalizandoIaId(null);
        }
    };

    const abrirModalEntrevista = (sol, moverAEnProceso = false) => {
        const fechaBase = sol.fechaEntrevista
            ? new Date(sol.fechaEntrevista)
            : new Date(Date.now() + 86400000);
        const anio = fechaBase.getFullYear();
        const mes = String(fechaBase.getMonth() + 1).padStart(2, '0');
        const dia = String(fechaBase.getDate()).padStart(2, '0');
        const fechaStr = `${anio}-${mes}-${dia}`;
        const horaStr = sol.fechaEntrevista
            ? fechaBase.toTimeString().slice(0, 5)
            : '10:00';

        setDatosEntrevista({
            fecha: fechaStr,
            hora: horaStr,
            duracionMinutos: sol.duracionEntrevistaMinutos || 45,
            modalidad: sol.modalidadEntrevista || 'Online (Google Meet)',
            notas: sol.notasEntrevista || ''
        });
        setEntrevistaModal({ isOpen: true, solicitud: sol, moverAEnProceso });
    };

    const cerrarModalEntrevista = () => {
        setEntrevistaModal({ isOpen: false, solicitud: null, moverAEnProceso: false });
    };

    const agendarEntrevista = async (e) => {
        e.preventDefault();
        const sol = entrevistaModal.solicitud;
        if (!sol || !datosEntrevista.fecha || !datosEntrevista.hora) {
            mostrarToast('Selecciona la fecha y hora de la entrevista.', 'error');
            return;
        }

        setAgendandoEntrevista(true);

        try {
            const payload = {
                fechaHora: `${datosEntrevista.fecha}T${datosEntrevista.hora}:00`,
                duracionMinutos: parseInt(datosEntrevista.duracionMinutos, 10) || 45,
                modalidad: datosEntrevista.modalidad,
                notas: datosEntrevista.notas.trim(),
                responsableId: sol.responsableId || usuario?.id || null,
                moverAEnProceso: entrevistaModal.moverAEnProceso
            };

            const { data } = await api.post(`/solicitudes/${sol.id}/entrevista`, payload);

            if (data?.solicitud) {
                setSolicitudes(prev =>
                    prev.map(s => (s.id === data.solicitud.id ? data.solicitud : s))
                );
                setSolicitudSeleccionada(prev =>
                    prev && prev.id === data.solicitud.id ? data.solicitud : prev
                );
            } else {
                await fetchSolicitudes(true);
            }

            await cargarMetricasEquipo();
            const movido = entrevistaModal.moverAEnProceso;
            cerrarModalEntrevista(); // Cierre automático al agendar con éxito
            mostrarToast(
                movido
                    ? 'Entrevista agendada y candidato movido a "En Evaluación Psicológica".'
                    : 'Entrevista agendada y notificación enviada correctamente.',
                'success'
            );
        } catch (error) {
            console.error('Error al agendar entrevista:', error);
            mostrarToast(
                error.response?.data?.message || 'No se pudo guardar la entrevista en el servidor.',
                'error'
            );
        } finally {
            setAgendandoEntrevista(false);
        }
    };

    const imprimirFicha = (sol) => {
        const ventana = window.open('', '_blank', 'width=850,height=900');
        if (!ventana) {
            mostrarToast('Permite las ventanas emergentes para exportar el informe a PDF.', 'error');
            return;
        }

        const etapa = columnas.find(c => c.key === sol.estado)?.titulo || sol.estado;
        const fechaSol = sol.fechaSolicitud
            ? new Date(sol.fechaSolicitud).toLocaleDateString('es-CL')
            : 'Reciente';
        const fechaHoy = new Date().toLocaleDateString('es-CL', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        ventana.document.write(`
            <!doctype html>
            <html lang="es">
            <head>
                <meta charset="UTF-8" />
                <title>Ficha Psicolaboral - ${escaparHtml(sol.nombreCandidato)}</title>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 40px; line-height: 1.55; }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0284c7; padding-bottom: 16px; margin-bottom: 24px; }
                    .brand { font-size: 22px; font-weight: 800; color: #0284c7; }
                    .meta-doc { text-align: right; font-size: 12px; color: #475569; }
                    h1 { font-size: 20px; margin: 0 0 4px 0; }
                    .subtitle { color: #475569; font-size: 14px; margin: 0 0 22px 0; }
                    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 22px; }
                    .field-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; }
                    .field-val { font-size: 14px; font-weight: 600; color: #0f172a; }
                    .section { margin-bottom: 22px; }
                    .section h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.4px; color: #0284c7; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 10px; }
                    .box { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; font-size: 13.5px; white-space: pre-wrap; }
                    .disclaimer { margin-top: 8px; font-size: 11.5px; color: #92400e; background: #fffbeb; border: 1px solid #fde68a; padding: 8px 10px; border-radius: 6px; }
                    .verdict { background: #f0fdf4; border: 1px solid #86efac; }
                    .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; display: flex; justify-content: space-between; }
                    @media print { body { margin: 20px; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="brand">AquaChile — Selección y Evaluación Psicolaboral</div>
                    <div class="meta-doc">
                        <div>Solicitud #SOL-${escaparHtml(sol.id)}</div>
                        <div>Emitido el ${escaparHtml(fechaHoy)}</div>
                    </div>
                </div>

                <h1>${escaparHtml(sol.nombreCandidato)}</h1>
                <p class="subtitle">Postulación al cargo de <strong>${escaparHtml(sol.cargo)}</strong> (${escaparHtml(sol.familiaCargo || 'General')})</p>

                <div class="grid">
                    <div>
                        <div class="field-label">Etapa Actual</div>
                        <div class="field-val">${escaparHtml(etapa)}</div>
                    </div>
                    <div>
                        <div class="field-label">Fecha de Postulación</div>
                        <div class="field-val">${escaparHtml(fechaSol)}</div>
                    </div>
                    <div>
                        <div class="field-label">Evaluador Responsable</div>
                        <div class="field-val">${escaparHtml(sol.nombreResponsable || 'Sin asignar')}</div>
                    </div>
                    <div>
                        <div class="field-label">Resultado Final</div>
                        <div class="field-val">${escaparHtml(sol.resultadoEvaluacion || 'Pendiente de evaluación')}</div>
                    </div>
                </div>

                <div class="section">
                    <h2>Antecedentes y Notas de Postulación</h2>
                    <div class="box">${escaparHtml(sol.observaciones || 'Sin observaciones registradas.')}</div>
                </div>

                <div class="section">
                    <h2>Análisis Automático de CV (IA)</h2>
                    <div class="box">${escaparHtml(sol.recomendacionIa || 'Sin análisis de IA registrado.')}</div>
                    <div class="disclaimer">Nota: El análisis generado por IA es un apoyo orientativo y está sujeto a revisión humana obligatoria por parte del equipo de selección.</div>
                </div>

                <div class="section">
                    <h2>Dictamen Psicolaboral</h2>
                    <div class="box verdict">
                        <strong>Dictamen: ${escaparHtml(sol.resultadoEvaluacion || 'Pendiente')}</strong><br/><br/>
                        ${escaparHtml(sol.observacionEvaluacion || 'Aún no se han registrado conclusiones finales.')}
                    </div>
                </div>

                <div class="footer">
                    <span>Documento confidencial de uso interno — AquaChile S.A.</span>
                    <span>Generado por ${escaparHtml(usuario?.nombre || 'Portal Psicólogos')}</span>
                </div>
            </body>
            </html>
        `);
        ventana.document.close();
        ventana.focus();
        setTimeout(() => ventana.print(), 300);
    };

    const handleDropTarjeta = (id, estadoActual, nuevoEstado) => {
        if (!puedeGestionarFlujo || !id || estadoActual === nuevoEstado) return;
        if (nuevoEstado === 'FINALIZADA') {
            setConfirmarModal({ isOpen: true, solicitudId: id });
        } else if (nuevoEstado === 'EN_PROCESO') {
            const sol = solicitudes.find(s => s.id.toString() === id.toString());
            if (sol && !sol.fechaEntrevista) {
                abrirModalEntrevista(sol, true);
                return;
            }
            actualizarEstado(id, nuevoEstado);
        } else {
            actualizarEstado(id, nuevoEstado);
        }
    };

    const cambiarEstadoDesdeModal = (id, nuevoEstado) => {
        if (!puedeGestionarFlujo) return;
        if (nuevoEstado === 'FINALIZADA') {
            setSolicitudSeleccionada(null);
            setConfirmarModal({ isOpen: true, solicitudId: id });
        } else if (nuevoEstado === 'EN_PROCESO') {
            const sol = solicitudes.find(s => s.id.toString() === id.toString());
            if (sol && !sol.fechaEntrevista) {
                setSolicitudSeleccionada(null);
                abrirModalEntrevista(sol, true);
                return;
            }
            actualizarEstado(id, nuevoEstado);
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
        const disparaIa = nuevoEstado === 'PENDIENTE' || nuevoEstado === 'EN_PROCESO';
        if (disparaIa) {
            setAnalizandoIaId(id);
        }

        try {
            const solActual = solicitudes.find(s => s.id.toString() === id.toString());
            const payload = { estado: nuevoEstado };
            if (!solActual?.responsableId && usuario?.id) {
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
                await cargarMetricasEquipo();
            } else {
                await fetchSolicitudes(true);
            }

            const nombreEtapa = columnas.find(c => c.key === nuevoEstado)?.titulo || nuevoEstado;
            mostrarToast(
                disparaIa
                    ? `Movido a "${nombreEtapa}". La IA está analizando el CV en segundo plano.`
                    : `Candidato movido a "${nombreEtapa}".`,
                'success'
            );
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            mostrarToast(
                error.response?.data?.message || 'No se pudo actualizar el estado de la solicitud.',
                'error'
            );
        } finally {
            setAnalizandoIaId(null);
        }
    };

    const enviarEvaluacion = async () => {
        if (!datosEvaluacion.resultadoGeneral.trim()) {
            mostrarToast('El resultado general es obligatorio.', 'error');
            return;
        }

        try {
            await api.post('/evaluaciones', {
                solicitudId: parseInt(evaluacionModal.solicitudId, 10),
                resultadoGeneral: datosEvaluacion.resultadoGeneral,
                observaciones: datosEvaluacion.observaciones
            });
            cerrarModalEvaluacion();
            mostrarToast('Dictamen psicolaboral guardado y proceso finalizado.', 'success');
            await fetchSolicitudes(true);
        } catch (error) {
            console.error('Error al registrar evaluación:', error);
            mostrarToast(
                error.response?.data?.message || 'Error al guardar la evaluación psicolaboral.',
                'error'
            );
        }
    };

    const cerrarModalEvaluacion = () => {
        setEvaluacionModal({ isOpen: false, solicitudId: null });
        setDatosEvaluacion({ resultadoGeneral: 'Apto', observaciones: '' });
    };

    const solicitarEliminar = (id, nombre) => {
        setEliminarModal({ isOpen: true, id, nombre });
    };

    const confirmarEliminarSolicitud = async () => {
        const { id, nombre } = eliminarModal;
        setEliminarModal({ isOpen: false, id: null, nombre: '' });

        try {
            await api.delete(`/solicitudes/${id}`);
            setSolicitudSeleccionada(null);
            mostrarToast(`Solicitud de ${nombre} eliminada correctamente.`, 'success');
            await fetchSolicitudes(true);
        } catch (error) {
            console.error('Error al eliminar solicitud:', error);
            if (error.response?.status === 403) {
                mostrarToast('Solo los usuarios con rol ADMIN pueden eliminar solicitudes.', 'error');
            } else {
                mostrarToast(
                    error.response?.data?.message || 'No se pudo eliminar la solicitud.',
                    'error'
                );
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

    const handleModalCvChange = (e) => {
        const archivo = e.target.files[0];
        setErrorCrear('');
        if (!archivo) {
            setCvFile(null);
            return;
        }

        const esPdf =
            archivo.type === 'application/pdf' ||
            archivo.name.toLowerCase().endsWith('.pdf');

        if (!esPdf) {
            setCvFile(null);
            e.target.value = '';
            setErrorCrear('Solo se permiten archivos en formato PDF.');
            return;
        }

        if (archivo.size > MAX_PDF_SIZE_BYTES) {
            setCvFile(null);
            e.target.value = '';
            setErrorCrear('El archivo PDF supera el tamaño máximo permitido de 5 MB.');
            return;
        }

        setCvFile(archivo);
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
        if (cvFile && cvFile.size > MAX_PDF_SIZE_BYTES) {
            setErrorCrear('El archivo PDF supera el tamaño máximo permitido de 5 MB.');
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
            mostrarToast('Postulación registrada en la Bandeja sin Asignar.', 'success');
            await fetchSolicitudes(true);
        } catch (error) {
            console.error('Error al crear postulación:', error);
            setErrorCrear(
                error.response?.data?.message ||
                'No se pudo registrar la postulación. Verifica que el RUT no tenga ya una solicitud para este mismo cargo.'
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
        return <AquaLoader mensaje="Cargando espacio de trabajo de AquaChile..." />;
    }

    const listaSegura = Array.isArray(solicitudes) ? solicitudes : [];

    // Cola compartida de postulaciones activas sin responsable asignado
    const solicitudesSinAsignar = listaSegura.filter(
        s => !s.responsableId && !s.nombreResponsable && s.estado !== 'FINALIZADA'
    );

    // Espacio según rol: ADMIN y ANALISTA ven todo; PSICOLOGO solo sus casos asignados
    const solicitudesEspacio = (esAdmin || esAnalista)
        ? listaSegura
        : listaSegura.filter(esResponsableActual);

    const areasDisponibles = Array.from(
        new Set([
            ...Object.keys(opcionesCargos),
            ...listaSegura.map(s => s.familiaCargo).filter(Boolean)
        ])
    );

    const coincideFiltroFecha = (fechaIso) => {
        if (filtroFecha === 'TODAS' || !fechaIso) return true;
        const fecha = new Date(fechaIso);
        const ahora = new Date();
        if (filtroFecha === 'HOY') {
            return fecha.toDateString() === ahora.toDateString();
        }
        if (filtroFecha === 'SEMANA') {
            return (ahora - fecha) <= 7 * 86400000;
        }
        if (filtroFecha === 'MES') {
            return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
        }
        return true;
    };

    const solicitudesFiltradasKanban = solicitudesEspacio.filter(sol => {
        const query = busqueda.toLowerCase();
        const coincideTexto =
            (sol.nombreCandidato || '').toLowerCase().includes(query) ||
            (sol.cargo || '').toLowerCase().includes(query) ||
            `#sol-${sol.id}`.includes(query);
        const coincideFamilia = filtroFamilia === 'TODAS' || sol.familiaCargo === filtroFamilia;
        return coincideTexto && coincideFamilia && coincideFiltroFecha(sol.fechaSolicitud);
    });

    const totalEntrevistasVisibles = solicitudesEspacio.filter(s => Boolean(s.fechaEntrevista)).length;

    const infoIaModal = solicitudSeleccionada
        ? analizarEstadoIa(solicitudSeleccionada.recomendacionIa)
        : null;

    const contenidoIaModal = solicitudSeleccionada
        ? parsearAnalisisIa(solicitudSeleccionada.recomendacionIa)
        : { resumen: '', preguntas: [] };

    const etapaModalConIa =
        solicitudSeleccionada &&
        (solicitudSeleccionada.estado === 'PENDIENTE' ||
            solicitudSeleccionada.estado === 'EN_PROCESO' ||
            solicitudSeleccionada.estado === 'FINALIZADA');

    const puedeDevolverModal =
        solicitudSeleccionada &&
        puedeGestionarFlujo &&
        Boolean(solicitudSeleccionada.responsableId || solicitudSeleccionada.nombreResponsable) &&
        solicitudSeleccionada.estado !== 'FINALIZADA' &&
        (esAdmin || esResponsableActual(solicitudSeleccionada));

    const badgePortal = esAdmin
        ? 'Portal Administración'
        : esAnalista
            ? 'Portal Analista'
            : 'Portal Psicólogos';

    return (
        <div className="trello-workspace">
            {/* BARRA SUPERIOR GLOBAL */}
            <header className="trello-topbar">
                <div className="topbar-left">
                    <Link to="/" className="trello-brand" style={{ textDecoration: 'none' }}>
                        <div className="brand-wave" aria-hidden="true">
                            <LogoAquaChile size={20} />
                        </div>
                        <span className="brand-name">AquaChile</span>
                    </Link>
                    <span className="workspace-badge">{badgePortal}</span>
                </div>

                <div className="topbar-right">
                    <button onClick={abrirModalCrear} className="btn-trello-create">
                        <FiPlus /> Nueva Postulación
                    </button>

                    <div className="user-profile-chip">
                        <div className="user-avatar">
                            {obtenerIniciales(usuario?.nombre || 'Evaluador')}
                        </div>
                        <span className="user-name">
                            {usuario?.nombre || 'Evaluador'} ({rolActual})
                        </span>
                    </div>

                    <button onClick={alCerrarSesion} className="btn-trello-logout" title="Cerrar Sesión">
                        <FiLogOut /> Salir
                    </button>
                </div>
            </header>

            {/* ESTRUCTURA CON SIDEBAR FIJO + CONTENIDO PRINCIPAL */}
            <div className="portal-shell">
                <aside className="portal-sidebar">
                    <div className="sidebar-group-title">Selección</div>
                    <button
                        className={`sidebar-nav-item ${vistaActiva === 'overview' ? 'active' : ''}`}
                        onClick={() => navigate('/dashboard')}
                    >
                        <FiPieChart /> <span>Resumen y Métricas</span>
                    </button>

                    {!esAnalista && (
                        <button
                            className={`sidebar-nav-item ${vistaActiva === 'bandeja' ? 'active' : ''}`}
                            onClick={() => navigate('/dashboard/bandeja')}
                        >
                            <FiInbox /> <span>Bandeja sin Asignar</span>
                            <span className={`sidebar-pill ${solicitudesSinAsignar.length > 0 ? 'pill-alert' : ''}`}>
                                {solicitudesSinAsignar.length}
                            </span>
                        </button>
                    )}

                    <button
                        className={`sidebar-nav-item ${vistaActiva === 'board' ? 'active' : ''}`}
                        onClick={() => navigate('/dashboard/kanban')}
                    >
                        <FiTrello /> <span>{esAdmin || esAnalista ? 'Tablero Kanban' : 'Mi Tablero Kanban'}</span>
                        <span className="sidebar-pill">{solicitudesEspacio.length}</span>
                    </button>

                    {!esAnalista && (
                        <button
                            className={`sidebar-nav-item ${vistaActiva === 'calendario' ? 'active' : ''}`}
                            onClick={() => navigate('/dashboard/calendario')}
                        >
                            <FiCalendar /> <span>{esAdmin ? 'Agenda de Entrevistas' : 'Mis Entrevistas'}</span>
                            <span className="sidebar-pill">{totalEntrevistasVisibles}</span>
                        </button>
                    )}

                    <button
                        className={`sidebar-nav-item ${vistaActiva === 'candidatos' ? 'active' : ''}`}
                        onClick={() => navigate('/dashboard/candidatos')}
                    >
                        <FiUsers /> <span>Directorio Candidatos</span>
                    </button>

                    {esAdmin && (
                        <>
                            <div className="sidebar-group-title">Administración</div>
                            <button
                                className={`sidebar-nav-item ${vistaActiva === 'ofertas' ? 'active' : ''}`}
                                onClick={() => navigate('/dashboard/ofertas')}
                            >
                                <FiBriefcase /> <span>Gestión de Ofertas</span>
                            </button>
                            <button
                                className={`sidebar-nav-item ${vistaActiva === 'usuarios' ? 'active' : ''}`}
                                onClick={() => navigate('/dashboard/equipo')}
                            >
                                <FiUserPlus /> <span>Gestión de Equipo</span>
                            </button>
                        </>
                    )}

                    <div className="sidebar-aqua-footer" aria-hidden="true">
                        <svg className="sidebar-footer-wave" viewBox="0 0 260 64" preserveAspectRatio="none">
                            <path
                                d="M0,28 C48,48 92,8 145,26 C192,42 228,16 260,24 L260,64 L0,64 Z"
                                fill="rgba(2, 132, 199, 0.22)"
                            />
                            <path
                                d="M0,40 C58,20 112,56 172,36 C212,23 238,34 260,38 L260,64 L0,64 Z"
                                fill="rgba(56, 189, 248, 0.16)"
                            />
                        </svg>
                        <div className="sidebar-footer-caption">
                            <span className="sidebar-footer-dot" />
                            <div>
                                <strong>AquaChile</strong>
                                <span>Selección Psicolaboral</span>
                            </div>
                        </div>
                    </div>
                </aside>

                <div className="portal-content-area">
                    {vistaActiva === 'overview' && (
                        <MetricasPsicologo
                            esAdmin={esAdmin || esAnalista}
                            metricasEquipo={metricasEquipo}
                            solicitudes={solicitudesEspacio}
                            solicitudesFiltradas={solicitudesEspacio}
                            columnas={columnas}
                            areasDisponibles={areasDisponibles}
                            obtenerColorFamilia={obtenerColorFamilia}
                            obtenerIniciales={obtenerIniciales}
                            onIrAlTablero={() => navigate('/dashboard/kanban')}
                            onSeleccionarSolicitud={setSolicitudSeleccionada}
                        />
                    )}

                    {vistaActiva === 'bandeja' && !esAnalista && (
                        <BandejaPostulaciones
                            solicitudesSinAsignar={solicitudesSinAsignar}
                            areasDisponibles={areasDisponibles}
                            obtenerColorFamilia={obtenerColorFamilia}
                            obtenerIniciales={obtenerIniciales}
                            tomandoId={tomandoId}
                            onAceptarPostulacion={aceptarPostulacion}
                            onSeleccionarSolicitud={setSolicitudSeleccionada}
                        />
                    )}

                    {vistaActiva === 'board' && (
                        <TableroKanban
                            solicitudes={solicitudesEspacio}
                            solicitudesFiltradas={solicitudesFiltradasKanban}
                            columnas={columnas}
                            areasDisponibles={areasDisponibles}
                            obtenerColorFamilia={obtenerColorFamilia}
                            busqueda={busqueda}
                            setBusqueda={setBusqueda}
                            filtroFamilia={filtroFamilia}
                            setFiltroFamilia={setFiltroFamilia}
                            filtroFecha={filtroFecha}
                            setFiltroFecha={setFiltroFecha}
                            analizandoIaId={analizandoIaId}
                            obtenerIniciales={obtenerIniciales}
                            soloLectura={esAnalista}
                            onSeleccionarSolicitud={setSolicitudSeleccionada}
                            onAbrirCrearEnColumna={abrirModalCrear}
                            onDropTarjeta={handleDropTarjeta}
                        />
                    )}

                    {vistaActiva === 'calendario' && !esAnalista && (
                        <CalendarioEntrevistas
                            solicitudes={solicitudesEspacio}
                            esAdmin={esAdmin}
                            obtenerColorFamilia={obtenerColorFamilia}
                            obtenerIniciales={obtenerIniciales}
                            onSeleccionarSolicitud={setSolicitudSeleccionada}
                        />
                    )}

                    {vistaActiva === 'candidatos' && (
                        <DirectorioCandidatos
                            obtenerIniciales={obtenerIniciales}
                            solicitudes={listaSegura}
                            areasDisponibles={areasDisponibles}
                            obtenerColorFamilia={obtenerColorFamilia}
                        />
                    )}

                    {vistaActiva === 'ofertas' && esAdmin && <GestionOfertas />}

                    {vistaActiva === 'usuarios' && esAdmin && (
                        <GestionUsuarios usuarioActual={usuario} />
                    )}
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
                                    <p>Ingresará en la <strong>Bandeja sin Asignar</strong> lista para ser tomada por un psicólogo.</p>
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
                                    <SelectorFechaNacimiento
                                        value={nuevaPostulacion.fechaNacimiento}
                                        theme="dark"
                                        onChange={(val) => {
                                            setErrorCrear('');
                                            setNuevaPostulacion(prev => ({ ...prev, fechaNacimiento: val }));
                                        }}
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
                                <label><FiUploadCloud /> Currículum Vitae (PDF, máx. 5 MB)</label>
                                <label htmlFor="modal-cv-upload" className="modern-cv-dropzone">
                                    <input
                                        id="modal-cv-upload"
                                        type="file"
                                        accept=".pdf,application/pdf"
                                        onChange={handleModalCvChange}
                                        style={{ display: 'none' }}
                                    />
                                    <FiUploadCloud className="dropzone-icon" />
                                    <div className="dropzone-texts">
                                        <strong>
                                            {cvFile
                                                ? `${cvFile.name} (${(cvFile.size / (1024 * 1024)).toFixed(2)} MB)`
                                                : 'Haz clic aquí para adjuntar el CV en PDF (máx. 5 MB)'}
                                        </strong>
                                        <span>La IA evaluará este PDF cuando el candidato pase a "Pendientes de Revisión"</span>
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
                                    {infoIaModal?.puntaje !== null && (
                                        <span className="trello-badge ia-score-badge">
                                            IA: {infoIaModal.puntaje}/10
                                        </span>
                                    )}
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

                                {solicitudSeleccionada.fechaEntrevista && (
                                    <div className="modal-interview-summary">
                                        <div className="modal-interview-info">
                                            <FiCalendar />
                                            <div>
                                                <strong>
                                                    Entrevista agendada:{' '}
                                                    {new Date(solicitudSeleccionada.fechaEntrevista).toLocaleDateString('es-CL', {
                                                        day: '2-digit',
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })}{' '}
                                                    a las{' '}
                                                    {new Date(solicitudSeleccionada.fechaEntrevista).toLocaleTimeString('es-CL', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </strong>
                                                <span>
                                                    {solicitudSeleccionada.modalidadEntrevista || 'Online'} ·{' '}
                                                    {solicitudSeleccionada.duracionEntrevistaMinutos || 45} min
                                                </span>
                                            </div>
                                        </div>
                                        <a
                                            href={construirUrlGoogleCalendarDesdeSolicitud(solicitudSeleccionada)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-agenda-gcal"
                                        >
                                            <FiExternalLink /> Google Calendar
                                        </a>
                                    </div>
                                )}

                                <div className="trello-section-block ia-block">
                                    <div className="section-block-title" style={{ justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <FiCpu className="icon-cyan" />
                                            <h4>Evaluación de CV con IA</h4>
                                        </div>

                                        {puedeGestionarFlujo && etapaModalConIa && !solicitudSeleccionada.recomendacionIa && (
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button
                                                    className="btn-mini-refresh"
                                                    onClick={() => reintentarIa(solicitudSeleccionada.id)}
                                                    disabled={analizandoIaId === solicitudSeleccionada.id}
                                                >
                                                    <FiCpu /> Analizar ahora
                                                </button>
                                                <button
                                                    className="btn-mini-refresh"
                                                    onClick={() => fetchSolicitudes(true)}
                                                >
                                                    <FiRefreshCw /> Comprobar
                                                </button>
                                            </div>
                                        )}

                                        {puedeGestionarFlujo && etapaModalConIa && infoIaModal?.estado === 'error' && (
                                            <button
                                                className="btn-mini-refresh"
                                                onClick={() => reintentarIa(solicitudSeleccionada.id)}
                                                disabled={analizandoIaId === solicitudSeleccionada.id}
                                            >
                                                <FiRefreshCw className={analizandoIaId === solicitudSeleccionada.id ? 'spin-refresh' : ''} />
                                                Reintentar análisis
                                            </button>
                                        )}
                                    </div>

                                    {etapaModalConIa ? (
                                        <p className="ia-content-box" style={{ whiteSpace: 'pre-line' }}>
                                            {contenidoIaModal.resumen ||
                                                'La IA está analizando el CV en segundo plano. Se actualizará automáticamente en unos segundos.'}
                                        </p>
                                    ) : (
                                        <div className="eval-pending-box">
                                            <p>
                                                La evaluación automática de IA se ejecuta cuando el candidato avanza a la etapa{' '}
                                                <strong>Pendientes de Revisión</strong>.
                                            </p>
                                        </div>
                                    )}

                                    {/* APARTADO DEDICADO PARA PREGUNTAS SUGERIDAS POR LA IA */}
                                    {etapaModalConIa && contenidoIaModal.preguntas.length > 0 && (
                                        <div className="ia-questions-box">
                                            <div className="ia-questions-header">
                                                <FiMessageSquare />
                                                <h5>Preguntas Sugeridas para la Entrevista ({contenidoIaModal.preguntas.length})</h5>
                                            </div>
                                            <ol className="ia-questions-list">
                                                {contenidoIaModal.preguntas.map((pregunta, idx) => (
                                                    <li key={idx} className="ia-question-item">
                                                        <span className="ia-question-num">{idx + 1}</span>
                                                        <span>{pregunta}</span>
                                                    </li>
                                                ))}
                                            </ol>
                                        </div>
                                    )}

                                    <div className="ia-human-review-notice">
                                        <FiShield />
                                        <span>
                                            <strong>Nota:</strong> Este análisis de IA es un apoyo orientativo y está sujeto a <strong>revisión humana obligatoria</strong> por parte del psicólogo evaluador.
                                        </span>
                                    </div>
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
                                {puedeGestionarFlujo && !solicitudSeleccionada.responsableId && !solicitudSeleccionada.nombreResponsable && (
                                    <>
                                        <h5>Asignación</h5>
                                        <button
                                            className="sidebar-action-btn claim-sidebar-btn"
                                            disabled={tomandoId === solicitudSeleccionada.id}
                                            onClick={() => aceptarPostulacion(solicitudSeleccionada)}
                                        >
                                            <FiUserPlus />{' '}
                                            {tomandoId === solicitudSeleccionada.id ? 'Asignando...' : 'Aceptar Postulación'}
                                        </button>
                                    </>
                                )}

                                {puedeGestionarFlujo && (
                                    <>
                                        <h5 style={{ marginTop: !solicitudSeleccionada.responsableId ? '18px' : '0' }}>Mover a etapa</h5>
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
                                    </>
                                )}

                                <h5 style={{ marginTop: puedeGestionarFlujo ? '20px' : '0' }}>Acciones</h5>

                                {solicitudSeleccionada.urlCv ? (
                                    <button
                                        className="sidebar-action-btn"
                                        onClick={() => abrirCvPdf(solicitudSeleccionada.id)}
                                        disabled={cargandoCv}
                                    >
                                        <FiExternalLink /> {cargandoCv ? 'Abriendo CV...' : 'Ver CV (PDF)'}
                                    </button>
                                ) : (
                                    <button className="sidebar-action-btn current-stage" disabled>
                                        <FiFileText /> Sin CV adjunto
                                    </button>
                                )}

                                {puedeGestionarFlujo && (
                                    <button
                                        className="sidebar-action-btn calendar-action-btn"
                                        onClick={() => abrirModalEntrevista(solicitudSeleccionada, false)}
                                    >
                                        <FiCalendar /> {solicitudSeleccionada.fechaEntrevista ? 'Reagendar Entrevista' : 'Agendar Entrevista'}
                                    </button>
                                )}

                                <button
                                    className="sidebar-action-btn"
                                    onClick={() => imprimirFicha(solicitudSeleccionada)}
                                >
                                    <FiPrinter /> Exportar Ficha PDF
                                </button>

                                {puedeGestionarFlujo && (
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
                                )}

                                {puedeDevolverModal && (
                                    <button
                                        className="sidebar-action-btn return-inbox-btn"
                                        onClick={() => setDesasignarModal({ isOpen: true, solicitud: solicitudSeleccionada })}
                                    >
                                        <FiCornerUpLeft /> Devolver a Bandeja
                                    </button>
                                )}

                                {esAdmin && (
                                    <button
                                        className="sidebar-action-btn danger-btn"
                                        onClick={() => solicitarEliminar(solicitudSeleccionada.id, solicitudSeleccionada.nombreCandidato)}
                                    >
                                        <FiTrash2 /> Eliminar Solicitud
                                    </button>
                                )}
                            </aside>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= MODAL AGENDAR ENTREVISTA (CALENDAR) ================= */}
            {entrevistaModal.isOpen && entrevistaModal.solicitud && (
                <div className="modal-overlay" onClick={cerrarModalEntrevista}>
                    <div
                        className="modern-create-modal modal-picker-safe"
                        style={{ maxWidth: '540px' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="create-modal-header">
                            <div className="create-header-title">
                                <div className="create-icon-badge"><FiCalendar /></div>
                                <div>
                                    <h3>
                                        {entrevistaModal.moverAEnProceso
                                            ? 'Agendar Entrevista Obligatoria'
                                            : entrevistaModal.solicitud.fechaEntrevista
                                                ? 'Reagendar Entrevista'
                                                : 'Agendar Entrevista'}
                                    </h3>
                                    <p>
                                        Candidato: <strong>{entrevistaModal.solicitud.nombreCandidato}</strong> ({entrevistaModal.solicitud.cargo})
                                    </p>
                                </div>
                            </div>
                            <button className="trello-modal-close" onClick={cerrarModalEntrevista}>
                                <FiX />
                            </button>
                        </div>

                        {entrevistaModal.moverAEnProceso && (
                            <div className="mandatory-interview-banner">
                                <FiInfo />
                                <span>
                                    Para mover al candidato a <strong>En Evaluación Psicológica</strong> debes asignar primero la fecha y hora de su entrevista.
                                </span>
                            </div>
                        )}

                        <form onSubmit={agendarEntrevista} className="create-modal-form">
                            <div className="create-form-grid-2">
                                <div className="create-field">
                                    <label><FiCalendar /> Fecha <span>*</span></label>
                                    <SelectorFechaEntrevista
                                        value={datosEntrevista.fecha}
                                        onChange={(val) => setDatosEntrevista(prev => ({ ...prev, fecha: val }))}
                                    />
                                </div>
                                <div className="create-field">
                                    <label><FiClock /> Hora <span>*</span></label>
                                    <SelectorHoraEntrevista
                                        value={datosEntrevista.hora}
                                        onChange={(val) => setDatosEntrevista(prev => ({ ...prev, hora: val }))}
                                    />
                                </div>
                            </div>

                            <div className="create-form-grid-2">
                                <div className="create-field">
                                    <label>Duración (minutos)</label>
                                    <select
                                        value={datosEntrevista.duracionMinutos}
                                        onChange={(e) => setDatosEntrevista({ ...datosEntrevista, duracionMinutos: e.target.value })}
                                    >
                                        <option value={30}>30 minutos</option>
                                        <option value={45}>45 minutos</option>
                                        <option value={60}>60 minutos</option>
                                    </select>
                                </div>
                                <div className="create-field">
                                    <label>Modalidad / Lugar</label>
                                    <input
                                        type="text"
                                        value={datosEntrevista.modalidad}
                                        onChange={(e) => setDatosEntrevista({ ...datosEntrevista, modalidad: e.target.value })}
                                        placeholder="Online (Google Meet) o Planta"
                                    />
                                </div>
                            </div>

                            <div className="create-field">
                                <label>Notas o enlace de videollamada</label>
                                <textarea
                                    rows="3"
                                    value={datosEntrevista.notas}
                                    onChange={(e) => setDatosEntrevista({ ...datosEntrevista, notas: e.target.value })}
                                    placeholder="Instrucciones para el postulante o enlace de reunión..."
                                />
                            </div>

                            <div className="create-modal-footer">
                                <button type="button" onClick={cerrarModalEntrevista} className="btn-cancelar">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={agendandoEntrevista} className="btn-guardar-modern">
                                    {agendandoEntrevista
                                        ? 'Agendando...'
                                        : entrevistaModal.moverAEnProceso
                                            ? 'Agendar y Pasar a Evaluación'
                                            : 'Guardar Entrevista'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ================= MODAL CONFIRMAR DEVOLVER A BANDEJA ================= */}
            {desasignarModal.isOpen && desasignarModal.solicitud && (
                <div className="modal-overlay" onClick={() => setDesasignarModal({ isOpen: false, solicitud: null })}>
                    <div className="modal-content" style={{ textAlign: 'center', maxWidth: '410px' }} onClick={(e) => e.stopPropagation()}>
                        <FiCornerUpLeft style={{ fontSize: '40px', color: '#fbbf24', marginBottom: '12px' }} />
                        <h3 style={{ marginBottom: '10px', fontSize: '19px' }}>¿Devolver a Bandeja sin Asignar?</h3>
                        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
                            La postulación de <strong>{desasignarModal.solicitud.nombreCandidato}</strong> saldrá de tu tablero y volverá a estar disponible para otro psicólogo.
                        </p>
                        <div className="modal-buttons" style={{ justifyContent: 'center', gap: '15px' }}>
                            <button
                                type="button"
                                onClick={() => setDesasignarModal({ isOpen: false, solicitud: null })}
                                className="btn-cancelar"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                disabled={desasignando}
                                onClick={confirmarDevolverABandeja}
                                className="btn-guardar"
                            >
                                {desasignando ? 'Devolviendo...' : 'Sí, Devolver'}
                            </button>
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

            {/* ================= MODAL CONFIRMAR ELIMINACIÓN ================= */}
            {eliminarModal.isOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ textAlign: 'center', maxWidth: '390px' }}>
                        <FiTrash2 style={{ fontSize: '40px', color: '#f87171', marginBottom: '12px' }} />
                        <h3 style={{ marginBottom: '10px', fontSize: '19px' }}>¿Eliminar solicitud?</h3>
                        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
                            Se eliminará permanentemente la solicitud de <strong>{eliminarModal.nombre}</strong> y su evaluación asociada.
                        </p>
                        <div className="modal-buttons" style={{ justifyContent: 'center', gap: '15px' }}>
                            <button
                                onClick={() => setEliminarModal({ isOpen: false, id: null, nombre: '' })}
                                className="btn-cancelar"
                            >
                                Cancelar
                            </button>
                            <button onClick={confirmarEliminarSolicitud} className="btn-eliminar-confirm">
                                Sí, Eliminar
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

            {/* ================= NOTIFICACIONES TOAST ================= */}
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
        </div>
    );
};

export default DashboardPsicologo;