import React, { useEffect, useState } from 'react';
import api from '../services/api';
import './DashboardPsicologo.css';

// Opciones de cargos para el formulario de creación
const opcionesCargos = {
    Operativo: ['Operario de Planta', 'Asistente de Producción', 'Técnico de Mantenimiento', 'Operario de Grúa'],
    Administrativo: ['Asistente Administrativo', 'Analista Contable', 'Recepcionista', 'Ejecutivo de RRHH'],
    Jefatura: ['Jefe de Turno', 'Jefe de Planta', 'Supervisor de Área', 'Jefe de Logística'],
    Gerencia: ['Gerente de Operaciones', 'Gerente Comercial', 'Gerente de Finanzas']
};

const DashboardPsicologo = ({ usuario, alCerrarSesion }) => {
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Estado para el modal de detalles normal
    const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
    
    // Estado para el modal de confirmación antes de finalizar
    const [confirmarModal, setConfirmarModal] = useState({ isOpen: false, solicitudId: null });

    // Estado para el modal de evaluación
    const [evaluacionModal, setEvaluacionModal] = useState({ isOpen: false, solicitudId: null });
    const [datosEvaluacion, setDatosEvaluacion] = useState({ resultadoGeneral: 'Apto', observaciones: '' });

    // --- NUEVO: Estado para el modal de Crear Postulación ---
    const [crearModalOpen, setCrearModalOpen] = useState(false);
    const [nuevaPostulacion, setNuevaPostulacion] = useState({
        nombre: '',
        correo: '',
        telefono: '',
        familiaCargo: 'Operativo',
        cargoPostulacion: opcionesCargos['Operativo'][0]
    });
    const [cvFile, setCvFile] = useState(null);
    const [guardandoPostulacion, setGuardandoPostulacion] = useState(false);

    const fetchSolicitudes = async () => {
        setLoading(true);
        try {
            const response = await api.get('/solicitudes');
            setSolicitudes(response.data);
        } catch (error) {
            console.error("Error al obtener solicitudes:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSolicitudes();
    }, []);

    const columnas = [
        { key: 'NUEVA_POSTULACION', titulo: 'Nuevas Postulaciones', color: '#38bdf8' },
        { key: 'PENDIENTE', titulo: 'Pendientes', color: '#f59e0b' },
        { key: 'EN_PROCESO', titulo: 'En Evaluación', color: '#8b5cf6' },
        { key: 'FINALIZADA', titulo: 'Finalizadas', color: '#10b981' }
    ];

    const handleDragStart = (e, id, estadoActual) => {
        e.dataTransfer.setData("solicitudId", id.toString());
        e.dataTransfer.setData("estadoActual", estadoActual);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = async (e, nuevoEstado) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("solicitudId");
        const estadoActual = e.dataTransfer.getData("estadoActual");

        if (!id || estadoActual === nuevoEstado) return;

        if (nuevoEstado === 'FINALIZADA') {
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

    const cancelarConfirmacion = () => {
        setConfirmarModal({ isOpen: false, solicitudId: null });
    };

    const actualizarEstado = async (id, estado) => {
        try {
            await api.patch(`/solicitudes/${id}/estado`, { estado });
            fetchSolicitudes();
        } catch (error) {
            console.error("Error al mover la tarjeta:", error);
            alert("No se pudo actualizar el estado.");
        }
    };

    const enviarEvaluacion = async () => {
        if (!datosEvaluacion.resultadoGeneral.trim()) {
            alert("El resultado general es obligatorio");
            return;
        }

        try {
            await api.post('/evaluaciones', {
                solicitudId: parseInt(evaluacionModal.solicitudId),
                resultadoGeneral: datosEvaluacion.resultadoGeneral,
                observaciones: datosEvaluacion.observaciones
            });
            
            await actualizarEstado(evaluacionModal.solicitudId, 'FINALIZADA');
            cerrarModalEvaluacion();
        } catch (error) {
            console.error("Error al registrar la evaluación:", error);
            alert("No se pudo registrar la evaluación.");
        }
    };

    const cerrarModalEvaluacion = () => {
        setEvaluacionModal({ isOpen: false, solicitudId: null });
        setDatosEvaluacion({ resultadoGeneral: 'Apto', observaciones: '' });
    };

    const eliminarSolicitud = async (id, nombre) => {
        if(window.confirm(`¿Estás seguro de que deseas eliminar la solicitud de ${nombre}?`)) {
            try {
                await api.delete(`/solicitudes/${id}`);
                setSolicitudSeleccionada(null);
                fetchSolicitudes();
            } catch (error) {
                console.error("Error al eliminar:", error);
                alert("No se pudo eliminar la solicitud.");
            }
        }
    };

    // --- NUEVO: Lógica para Crear Postulación desde el Dashboard ---
    const handleCrearChange = (e) => {
        const { name, value } = e.target;
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
        setGuardandoPostulacion(true);

        try {
            const data = new FormData();
            data.append("candidato", new Blob([JSON.stringify(nuevaPostulacion)], { type: "application/json" }));
            if (cvFile) data.append("cv", cvFile);

            await api.post('/postulaciones/public', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Limpiar y cerrar
            setCrearModalOpen(false);
            setNuevaPostulacion({
                nombre: '', correo: '', telefono: '',
                familiaCargo: 'Operativo', cargoPostulacion: opcionesCargos['Operativo'][0]
            });
            setCvFile(null);
            
            // Recargar tablero
            fetchSolicitudes();
        } catch (error) {
            console.error("Error al crear postulación:", error);
            alert("Ocurrió un error al crear la postulación.");
        } finally {
            setGuardandoPostulacion(false);
        }
    };

    if (loading && solicitudes.length === 0) {
        return <div className="kanban-loading">Cargando tablero Kanban...</div>;
    }

    return (
        <div className="kanban-page">
            <header className="kanban-header">
                <div className="kanban-branding">
                    <span className="kanban-logo">AquaChile</span>
                    <span className="kanban-badge">Portal Psicólogos</span>
                </div>
                <div className="user-info">
                    {/* Botón para crear nueva postulación */}
                    <button onClick={() => setCrearModalOpen(true)} className="btn-crear">
                        + Nueva Postulación
                    </button>
                    <span>{usuario?.nombre || 'Psicólogo Evaluador'}</span>
                    <button onClick={alCerrarSesion} className="btn-logout">Cerrar Sesión</button>
                </div>
            </header>

            <main className="kanban-board">
                {columnas.map(col => {
                    const tarjetas = solicitudes.filter(sol => sol.estado === col.key);
                    return (
                        <div 
                            key={col.key} 
                            className="kanban-column"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, col.key)}
                        >
                            <div className="column-header">
                                <div className="column-title-group">
                                    <span className="status-dot" style={{ backgroundColor: col.color }}></span>
                                    <h3>{col.titulo}</h3>
                                </div>
                                <span className="card-count">{tarjetas.length}</span>
                            </div>

                            <div className="cards-container">
                                {tarjetas.map(sol => (
                                    <div 
                                        key={sol.id} 
                                        className="kanban-card"
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, sol.id, sol.estado)}
                                        onClick={() => setSolicitudSeleccionada(sol)}
                                        title="Haz clic para detalles o arrastra para cambiar de estado"
                                    >
                                        <div className="card-tag">{sol.familiaCargo || 'General'}</div>
                                        <h4 className="card-candidate-name">{sol.nombreCandidato}</h4>
                                        <p className="card-position">{sol.cargo}</p>
                                        <div className="card-footer">
                                            <span className="card-id">#SOL-{sol.id}</span>
                                            <span className="card-date">
                                                {sol.fechaSolicitud ? new Date(sol.fechaSolicitud).toLocaleDateString() : 'Reciente'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {tarjetas.length === 0 && (
                                    <div className="empty-column">Suelta tarjetas aquí</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </main>

            {/* NUEVO: MODAL CREAR POSTULACIÓN */}
            {crearModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <h3>Crear Nueva Postulación</h3>
                        <form onSubmit={handleCrearSubmit} className="modal-actions" style={{ gap: '12px' }}>
                            <label>Nombre Completo:</label>
                            <input 
                                type="text" 
                                name="nombre" 
                                value={nuevaPostulacion.nombre} 
                                onChange={handleCrearChange} 
                                required 
                                className="modal-select"
                                placeholder="Ej: María González"
                            />

                            <label>Correo Electrónico:</label>
                            <input 
                                type="email" 
                                name="correo" 
                                value={nuevaPostulacion.correo} 
                                onChange={handleCrearChange} 
                                required 
                                className="modal-select"
                                placeholder="correo@ejemplo.com"
                            />

                            <label>Teléfono:</label>
                            <input 
                                type="text" 
                                name="telefono" 
                                value={nuevaPostulacion.telefono} 
                                onChange={handleCrearChange} 
                                className="modal-select"
                                placeholder="+56 9 1234 5678"
                            />

                            <label>Familia de Cargo:</label>
                            <select 
                                name="familiaCargo" 
                                value={nuevaPostulacion.familiaCargo} 
                                onChange={handleCrearChange}
                                className="modal-select"
                            >
                                {Object.keys(opcionesCargos).map(fam => (
                                    <option key={fam} value={fam}>{fam}</option>
                                ))}
                            </select>

                            <label>Cargo al que postula:</label>
                            <select 
                                name="cargoPostulacion" 
                                value={nuevaPostulacion.cargoPostulacion} 
                                onChange={handleCrearChange}
                                className="modal-select"
                            >
                                {opcionesCargos[nuevaPostulacion.familiaCargo].map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>

                            <label>Adjuntar CV (PDF/Word):</label>
                            <input 
                                type="file" 
                                onChange={(e) => setCvFile(e.target.files[0])} 
                                accept=".pdf,.doc,.docx"
                                className="modal-select"
                            />

                            <div className="modal-buttons" style={{ marginTop: '15px' }}>
                                <button type="button" onClick={() => setCrearModalOpen(false)} className="btn-cancelar">Cancelar</button>
                                <button type="submit" disabled={guardandoPostulacion} className="btn-guardar">
                                    {guardandoPostulacion ? 'Guardando...' : 'Crear Postulación'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL CONFIRMACIÓN AL FINALIZAR */}
            {confirmarModal.isOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ textAlign: 'center', maxWidth: '350px' }}>
                        <h3 style={{ marginBottom: '25px', fontSize: '18px' }}>¿Estás seguro de pasar la tarjeta a finalizado?</h3>
                        <div className="modal-buttons" style={{ justifyContent: 'center', gap: '15px' }}>
                            <button onClick={cancelarConfirmacion} className="btn-cancelar">Cancelar</button>
                            <button onClick={aceptarConfirmacion} className="btn-guardar">Aceptar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DETALLES Y ELIMINAR */}
            {solicitudSeleccionada && (
                <div className="modal-overlay" onClick={() => setSolicitudSeleccionada(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Detalles de la Solicitud #{solicitudSeleccionada.id}</h3>
                        <div className="modal-info">
                            <p><strong>Candidato:</strong> {solicitudSeleccionada.nombreCandidato}</p>
                            <p><strong>Cargo:</strong> {solicitudSeleccionada.cargo}</p>
                            <p><strong>Estado Actual:</strong> {solicitudSeleccionada.estado}</p>
                            <p>
                                <strong>Estado de Aprobación:</strong>{' '}
                                {solicitudSeleccionada.estado === 'FINALIZADA' 
                                    ? (solicitudSeleccionada.resultadoEvaluacion || 'Completado') 
                                    : 'Pendiente'}
                            </p>
                            <p>
                                <strong>Observación:</strong>{' '}
                                {solicitudSeleccionada.estado === 'FINALIZADA' 
                                    ? (solicitudSeleccionada.observacionEvaluacion || 'Sin observaciones') 
                                    : 'Pendiente'}
                            </p>
                        </div>
                        <div className="modal-buttons" style={{ marginTop: '20px' }}>
                            <button 
                                onClick={() => eliminarSolicitud(solicitudSeleccionada.id, solicitudSeleccionada.nombreCandidato)} 
                                className="btn-eliminar"
                            >
                                Eliminar Solicitud
                            </button>
                            <button onClick={() => setSolicitudSeleccionada(null)} className="btn-cancelar">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL EVALUACIÓN AL FINALIZAR */}
            {evaluacionModal.isOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Registrar Resultado de Evaluación</h3>
                        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '15px' }}>
                            Por favor ingresa el resultado final antes de cerrar la solicitud.
                        </p>
                        
                        <div className="modal-actions">
                            <label>Resultado General:</label>
                            <select 
                                value={datosEvaluacion.resultadoGeneral}
                                onChange={(e) => setDatosEvaluacion({...datosEvaluacion, resultadoGeneral: e.target.value})}
                                className="modal-select"
                            >
                                <option value="Apto">Apto</option>
                                <option value="Apto con Observaciones">Apto con Observaciones</option>
                                <option value="No Apto">No Apto</option>
                            </select>

                            <label style={{ marginTop: '10px' }}>Observaciones:</label>
                            <textarea 
                                value={datosEvaluacion.observaciones}
                                onChange={(e) => setDatosEvaluacion({...datosEvaluacion, observaciones: e.target.value})}
                                className="modal-textarea"
                                placeholder="Ingresa los comentarios de la evaluación psicotécnica..."
                                rows="4"
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