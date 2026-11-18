import React from 'react';
import {
    FiTrello, FiUsers, FiActivity, FiCheckCircle,
    FiCpu, FiBriefcase, FiAward, FiAlertTriangle
} from 'react-icons/fi';
import { analizarEstadoIa } from '../utils/iaHelper';

const MetricasPsicologo = ({
    solicitudes,
    solicitudesFiltradas,
    columnas,
    areasDisponibles,
    obtenerColorFamilia,
    obtenerIniciales,
    onIrAlTablero,
    onSeleccionarSolicitud
}) => {
    const totalSolicitudes = solicitudes.length;
    const totalNuevas = solicitudes.filter(s => s.estado === 'NUEVA_POSTULACION').length;
    const totalPendientes = solicitudes.filter(s => s.estado === 'PENDIENTE').length;
    const totalEnProceso = solicitudes.filter(s => s.estado === 'EN_PROCESO').length;
    const totalFinalizadas = solicitudes.filter(s => s.estado === 'FINALIZADA').length;
    const tasaFinalizacion = totalSolicitudes > 0 ? Math.round((totalFinalizadas / totalSolicitudes) * 100) : 0;

    const conIaExitosa = solicitudes.filter(
        s => (s.estado === 'EN_PROCESO' || s.estado === 'FINALIZADA') &&
            analizarEstadoIa(s.recomendacionIa).estado === 'ok'
    ).length;

    const conErrorIa = solicitudes.filter(
        s => (s.estado === 'EN_PROCESO' || s.estado === 'FINALIZADA') &&
            analizarEstadoIa(s.recomendacionIa).estado === 'error'
    ).length;

    const aptosCount = solicitudes.filter(s => s.resultadoEvaluacion === 'Apto').length;
    const aptosObsCount = solicitudes.filter(s => s.resultadoEvaluacion === 'Apto con Observaciones').length;
    const noAptosCount = solicitudes.filter(s => s.resultadoEvaluacion === 'No Apto').length;

    return (
        <main className="overview-container">
            <div className="overview-welcome">
                <div>
                    <h1>Panel de Control de Selección</h1>
                    <p>Resumen en tiempo real del flujo de postulaciones, evaluaciones psicológicas y análisis de CV con IA.</p>
                </div>
                <button className="btn-go-board" onClick={onIrAlTablero}>
                    <FiTrello /> Ir al Tablero Kanban
                </button>
            </div>

            {/* TARJETAS KPI SUPERIORES */}
            <section className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-icon-box blue"><FiUsers /></div>
                    <div className="kpi-details">
                        <span className="kpi-label">Total Postulaciones</span>
                        <h2 className="kpi-value">{totalSolicitudes}</h2>
                        <span className="kpi-sub">{totalNuevas} nuevas sin revisar</span>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-icon-box purple"><FiActivity /></div>
                    <div className="kpi-details">
                        <span className="kpi-label">En Evaluación Activa</span>
                        <h2 className="kpi-value">{totalEnProceso}</h2>
                        <span className="kpi-sub">{totalPendientes} pendientes de revisión</span>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-icon-box green"><FiCheckCircle /></div>
                    <div className="kpi-details">
                        <span className="kpi-label">Tasa de Finalización</span>
                        <h2 className="kpi-value">{tasaFinalizacion}%</h2>
                        <span className="kpi-sub">{totalFinalizadas} procesos cerrados</span>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-icon-box cyan"><FiCpu /></div>
                    <div className="kpi-details">
                        <span className="kpi-label">CVs Evaluados con IA</span>
                        <h2 className="kpi-value">{conIaExitosa}</h2>
                        <span className="kpi-sub">
                            {conErrorIa > 0
                                ? `${conErrorIa} con error al procesar`
                                : 'Análisis exitosos de Gemini'}
                        </span>
                    </div>
                </div>
            </section>

            {/* FILA DE GRÁFICOS Y DISTRIBUCIÓN */}
            <section className="charts-grid">
                <div className="chart-card">
                    <div className="chart-header">
                        <h3><FiActivity /> Embudo del Proceso (Pipeline)</h3>
                        <span className="chart-subtitle">Candidatos por etapa actual</span>
                    </div>
                    <div className="pipeline-bars">
                        {columnas.map(col => {
                            const count = solicitudes.filter(s => s.estado === col.key).length;
                            const pct = totalSolicitudes > 0 ? Math.round((count / totalSolicitudes) * 100) : 0;
                            return (
                                <div key={col.key} className="pipeline-row">
                                    <div className="pipeline-row-label">
                                        <div className="pipeline-label-left">
                                            <span className="dot" style={{ backgroundColor: col.color }}></span>
                                            <span>{col.titulo}</span>
                                        </div>
                                        <strong>{count} ({pct}%)</strong>
                                    </div>
                                    <div className="pipeline-track">
                                        <div
                                            className="pipeline-fill"
                                            style={{ width: `${Math.max(pct, 6)}%`, backgroundColor: col.color }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-header">
                        <h3><FiBriefcase /> Postulaciones por Área</h3>
                        <span className="chart-subtitle">Volumen según familia de cargo</span>
                    </div>
                    <div className="familia-distribution">
                        {areasDisponibles.map(familia => {
                            const count = solicitudes.filter(s => s.familiaCargo === familia).length;
                            const pct = totalSolicitudes > 0 ? Math.round((count / totalSolicitudes) * 100) : 0;
                            const colorInfo = obtenerColorFamilia(familia);
                            return (
                                <div key={familia} className="familia-stat-item">
                                    <div className="familia-stat-top">
                                        <span
                                            className="trello-label-pill"
                                            style={{ backgroundColor: colorInfo.bg, color: colorInfo.text }}
                                        >
                                            {familia}
                                        </span>
                                        <span className="familia-stat-number">{count} candidatos</span>
                                    </div>
                                    <div className="pipeline-track">
                                        <div
                                            className="pipeline-fill"
                                            style={{ width: `${Math.max(pct, 6)}%`, backgroundColor: colorInfo.bg }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-header">
                        <h3><FiAward /> Dictámenes Psicolaborales</h3>
                        <span className="chart-subtitle">Desglose de candidatos evaluados</span>
                    </div>
                    <div className="evaluation-summary-boxes">
                        <div className="eval-stat-box apto">
                            <span className="eval-num">{aptosCount}</span>
                            <span className="eval-title">Aptos</span>
                        </div>
                        <div className="eval-stat-box obs">
                            <span className="eval-num">{aptosObsCount}</span>
                            <span className="eval-title">Con Observaciones</span>
                        </div>
                        <div className="eval-stat-box no-apto">
                            <span className="eval-num">{noAptosCount}</span>
                            <span className="eval-title">No Aptos</span>
                        </div>
                    </div>
                    <p className="eval-helper-note">
                        Al mover un candidato a <strong>En Evaluación Psicológica</strong>, Gemini analiza su CV automáticamente en segundo plano.
                    </p>
                </div>
            </section>

            {/* TABLA DE CANDIDATOS RECIENTES */}
            <section className="recent-candidates-card">
                <div className="recent-header">
                    <div>
                        <h3>Candidatos en Seguimiento ({solicitudesFiltradas.length})</h3>
                        <p>Haz clic sobre una fila para abrir la ficha detallada del postulante.</p>
                    </div>
                </div>
                <div className="table-responsive">
                    <table className="ats-table">
                        <thead>
                            <tr>
                                <th>Candidato</th>
                                <th>Cargo / Familia</th>
                                <th>Etapa Actual</th>
                                <th>Análisis IA (Gemini)</th>
                                <th>Fecha</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {solicitudesFiltradas.map(sol => {
                                const colInfo = columnas.find(c => c.key === sol.estado) || columnas[0];
                                const famColor = obtenerColorFamilia(sol.familiaCargo);
                                const enEvaluacionOFinalizada = sol.estado === 'EN_PROCESO' || sol.estado === 'FINALIZADA';
                                const infoIa = analizarEstadoIa(sol.recomendacionIa);

                                return (
                                    <tr key={sol.id} onClick={() => onSeleccionarSolicitud(sol)}>
                                        <td>
                                            <div className="table-candidate-cell">
                                                <div className="mini-avatar">{obtenerIniciales(sol.nombreCandidato)}</div>
                                                <div>
                                                    <div className="candidate-strong">{sol.nombreCandidato}</div>
                                                    <div className="candidate-sub">#SOL-{sol.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span
                                                className="trello-label-pill small"
                                                style={{ backgroundColor: famColor.bg, color: famColor.text }}
                                            >
                                                {sol.familiaCargo || 'General'}
                                            </span>
                                            <div className="table-cargo-text">{sol.cargo}</div>
                                        </td>
                                        <td>
                                            <span className="stage-badge" style={{ borderColor: colInfo.color, color: colInfo.color }}>
                                                <span className="dot" style={{ backgroundColor: colInfo.color }}></span>
                                                {colInfo.titulo}
                                            </span>
                                        </td>
                                        <td className="ia-snippet-cell">
                                            {!enEvaluacionOFinalizada ? (
                                                <span className="no-ia-text">Se genera al pasar a "En Evaluación"</span>
                                            ) : infoIa.estado === 'error' ? (
                                                <span className="ia-error-preview">
                                                    <FiAlertTriangle className="ia-inline-icon error" />
                                                    Error al procesar CV con IA
                                                </span>
                                            ) : infoIa.estado === 'sin_cv' ? (
                                                <span className="no-ia-text">Sin CV adjunto para analizar</span>
                                            ) : infoIa.estado === 'ok' ? (
                                                <span className="ia-preview-text">
                                                    {infoIa.puntaje !== null && (
                                                        <span className="trello-badge ia-score-badge">
                                                            {infoIa.puntaje}/10
                                                        </span>
                                                    )}
                                                    {sol.recomendacionIa.length > 70
                                                        ? `${sol.recomendacionIa.substring(0, 70)}...`
                                                        : sol.recomendacionIa}
                                                </span>
                                            ) : (
                                                <span className="no-ia-text">Analizando CV en segundo plano...</span>
                                            )}
                                        </td>
                                        <td className="date-cell">
                                            {sol.fechaSolicitud ? new Date(sol.fechaSolicitud).toLocaleDateString('es-CL') : 'Reciente'}
                                        </td>
                                        <td>
                                            <button
                                                className="btn-table-view"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSeleccionarSolicitud(sol);
                                                }}
                                            >
                                                Ver Ficha
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
};

export default MetricasPsicologo;