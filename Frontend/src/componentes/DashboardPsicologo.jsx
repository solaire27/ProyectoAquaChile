import React, { useEffect, useState } from 'react';
import api from '../services/api';
import './DashboardPsicologo.css';

const DashboardPsicologo = ({ usuario, alCerrarSesion }) => {
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Estados para el Modal
    const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
    const [estadoNuevo, setEstadoNuevo] = useState('');

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

    const abrirModal = (sol) => {
        setSolicitudSeleccionada(sol);
        setEstadoNuevo(sol.estado);
    };

    const cerrarModal = () => {
        setSolicitudSeleccionada(null);
    };

    const guardarCambios = async () => {
        try {
            await api.patch(`/solicitudes/${solicitudSeleccionada.id}/estado`, {
                estado: estadoNuevo
            });
            cerrarModal();
            fetchSolicitudes();
        } catch (error) {
            console.error("Error al actualizar el estado:", error);
            alert("No se pudo actualizar el estado. Revisa la consola.");
        }
    };

    const eliminarSolicitud = async () => {
        if(window.confirm(`¿Estás seguro de que deseas eliminar la solicitud de ${solicitudSeleccionada.nombreCandidato}?`)) {
            try {
                await api.delete(`/solicitudes/${solicitudSeleccionada.id}`);
                cerrarModal();
                fetchSolicitudes();
            } catch (error) {
                console.error("Error al eliminar la solicitud:", error);
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
                        <div key={col.key} className="kanban-column">
                            <div className="column-header">
                                <div className="column-title-group">
                                    <span className="status-dot" style={{ backgroundColor: col.color }}></span>
                                    <h3>{col.titulo}</h3>
                                </div>
                                <span className="card-count">{tarjetas.length}</span>
                            </div>
                            <div className="cards-container">
                                {tarjetas.map(sol => (
                                    <div key={sol.id} className="kanban-card" onClick={() => abrirModal(sol)}>
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
                                    <div className="empty-column">Sin tarjetas aquí</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </main>
            {solicitudSeleccionada && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Detalles de la Solicitud #{solicitudSeleccionada.id}</h3>
                        <div className="modal-info">
                            <p><strong>Candidato:</strong> {solicitudSeleccionada.nombreCandidato}</p>
                            <p><strong>Cargo:</strong> {solicitudSeleccionada.cargo}</p>
                            <p><strong>Fecha:</strong> {new Date(solicitudSeleccionada.fechaSolicitud).toLocaleDateString()}</p>
                        </div>
                        <div className="modal-actions">
                            <label>Cambiar Estado:</label>
                            <select 
                                value={estadoNuevo} 
                                onChange={(e) => setEstadoNuevo(e.target.value)}
                                className="modal-select"
                            >
                                {columnas.map(col => (
                                    <option key={col.key} value={col.key}>{col.titulo}</option>
                                ))}
                            </select>
                        </div>
                        <div className="modal-buttons">
                            <button onClick={eliminarSolicitud} className="btn-eliminar" style={{ marginRight: 'auto', backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>Eliminar</button>
                            <button onClick={cerrarModal} className="btn-cancelar">Cancelar</button>
                            <button onClick={guardarCambios} className="btn-guardar">Guardar Cambios</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default DashboardPsicologo;