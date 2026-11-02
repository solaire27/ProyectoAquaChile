import React, { useEffect, useState } from 'react';
import api from '../services/api';
import './DashboardPsicologo.css';

const DashboardPsicologo = ({ usuario, alCerrarSesion }) => {
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Estado para el modal de detalles normal
    const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
    
    // Estado para el modal de evaluación (al mover a FINALIZADA)
    const [evaluacionModal, setEvaluacionModal] = useState({ isOpen: false, solicitudId: null });
    const [datosEvaluacion, setDatosEvaluacion] = useState({ resultadoGeneral: 'Apto', observaciones: '' });

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

    // --- LÓGICA DRAG & DROP NATIVO ---
    const handleDragStart = (e, id, estadoActual) => {
        e.dataTransfer.setData("solicitudId", id.toString());
        e.dataTransfer.setData("estadoActual", estadoActual);
    };

    const handleDragOver = (e) => {
        e.preventDefault(); // Necesario para permitir el drop
    };

    const handleDrop = async (e, nuevoEstado) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("solicitudId");
        const estadoActual = e.dataTransfer.getData("estadoActual");

        if (!id || estadoActual === nuevoEstado) return;

        if (nuevoEstado === 'FINALIZADA') {
            // Cuadro de confirmación antes de proceder
            const confirmar = window.confirm("¿Estás seguro de que deseas mover esta solicitud a Finalizadas? Deberás registrar un resultado de evaluación.");
            
            if (confirmar) {
                // Si acepta, abre el modal para registrar evaluación
                setEvaluacionModal({ isOpen: true, solicitudId: id });
            }
            // Si cancela, no hace nada y la tarjeta vuelve a su lugar original
        } else {
            // Movimiento normal a otras columnas
            actualizarEstado(id, nuevoEstado);
        }
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

    // --- LÓGICA DE EVALUACIÓN ---
    const enviarEvaluacion = async () => {
        if (!datosEvaluacion.resultadoGeneral.trim()) {
            alert("El resultado general es obligatorio");
            return;
        }

        try {
            // 1. Registramos la evaluación
            await api.post('/evaluaciones', {
                solicitudId: parseInt(evaluacionModal.solicitudId),
                resultadoGeneral: datosEvaluacion.resultadoGeneral,
                observaciones: datosEvaluacion.observaciones
            });
            
            // 2. Actualizamos el estado de la solicitud a FINALIZADA
            await actualizarEstado(evaluacionModal.solicitudId, 'FINALIZADA');
            
            // 3. Cerramos el modal y limpiamos
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

    // --- LÓGICA DE DETALLES Y ELIMINACIÓN ---
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

            {/* MODAL DETALLES Y ELIMINAR */}
            {solicitudSeleccionada && (
                <div className="modal-overlay" onClick={() => setSolicitudSeleccionada(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Detalles de la Solicitud #{solicitudSeleccionada.id}</h3>
                        <div className="modal-info">
                            <p><strong>Candidato:</strong> {solicitudSeleccionada.nombreCandidato}</p>
                            <p><strong>Cargo:</strong> {solicitudSeleccionada.cargo}</p>
                            <p><strong>Estado Actual:</strong> {solicitudSeleccionada.estado}</p>
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