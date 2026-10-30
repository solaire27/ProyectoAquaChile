import React, { useEffect, useState } from 'react';
import api from '../services/api';
import './DashboardPsicologo.css';

const DashboardPsicologo = ({ usuario, alCerrarSesion }) => {
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSolicitudes = async () => {
            try {
                const response = await api.get('/solicitudes');
                setSolicitudes(response.data);
            } catch (error) {
                console.error("Error al obtener solicitudes:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSolicitudes();
    }, []);

    const columnas = [
        { key: 'NUEVA_POSTULACION', titulo: 'Nuevas Postulaciones', color: '#38bdf8' },
        { key: 'PENDIENTE', titulo: 'Pendientes', color: '#f59e0b' },
        { key: 'EN_PROCESO', titulo: 'En Evaluación', color: '#8b5cf6' },
        { key: 'FINALIZADA', titulo: 'Finalizadas', color: '#10b981' }
    ];

    if (loading) {
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
                                    <div key={sol.id} className="kanban-card">
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
        </div>
    );
};

export default DashboardPsicologo;