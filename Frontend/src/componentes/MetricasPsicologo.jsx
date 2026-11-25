import React, { useState } from 'react';
import {
    FiTrello, FiUsers, FiActivity, FiCheckCircle,
    FiCpu, FiBriefcase, FiAward, FiAlertTriangle,
    FiClock, FiUserCheck, FiSearch, FiBarChart2,
    FiAlertCircle, FiArrowRight, FiTrendingUp
} from 'react-icons/fi';
import { analizarEstadoIa } from '../utils/iaHelper';

const obtenerEstadoCarga = (cargaActiva) => {
    if (cargaActiva === 0) return { label: 'Disponible', clase: 'load-free' };
    if (cargaActiva <= 5) return { label: 'Carga Óptima', clase: 'load-ok' };
    if (cargaActiva <= 10) return { label: 'Carga Alta', clase: 'load-warn' };
    return { label: 'Sobrecargado', clase: 'load-high' };
};

const AnilloProgreso = ({ porcentaje }) => {
    const pct = Math.min(100, Math.max(0, Number(porcentaje) || 0));
    const radio = 36;
    const circunferencia = 2 * Math.PI * radio;
    const offset = circunferencia - (pct / 100) * circunferencia;

    return (
        <div className="ring-container">
            <svg width="92" height="92" viewBox="0 0 92 92" className="ring-svg">
                <circle
                    cx="46"
                    cy="46"
                    r={radio}
                    className="ring-track"
                    strokeWidth="8"
                    fill="none"
                />
                <circle
                    cx="46"
                    cy="46"
                    r={radio}
                    className="ring-progress"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={circunferencia}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                />
            </svg>
            <div className="ring-center-text">
                <strong>{pct}%</strong>
                <span>Cierre</span>
            </div>
        </div>
    );
};

const MetricasPsicologo = ({
    esAdmin,
    metricasEquipo,
    solicitudes,
    solicitudesFiltradas,
    columnas,
    areasDisponibles,
    obtenerColorFamilia,
    obtenerIniciales,
    onIrAlTablero,
    onSeleccionarSolicitud
}) => {
    const [subVista, setSubVista] = useState('general'); // 'general' | 'equipo'
    const [busquedaPsi, setBusquedaPsi] = useState('');
    const [ordenPsi, setOrdenPsi] = useState('carga'); // 'carga' | 'finalizadas' | 'tasa' | 'nombre'
    const [filtroFechaTabla, setFiltroFechaTabla] = useState('TODAS');
    const [mostrarTodosTabla, setMostrarTodosTabla] = useState(false);

    const cumpleFecha = (fechaIso, rango) => {
        if (rango === 'TODAS' || !fechaIso) return true;
        const fecha = new Date(fechaIso);
        const ahora = new Date();
        if (rango === 'HOY') {
            return fecha.toDateString() === ahora.toDateString();
        }
        if (rango === 'SEMANA') {
            return (ahora - fecha) <= 7 * 86400000;
        }
        if (rango === 'MES') {
            return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
        }
        return true;
    };

    const candidatosRecientes = [...solicitudesFiltradas]
        .filter(s => cumpleFecha(s.fechaSolicitud, filtroFechaTabla))
        .sort((a, b) => new Date(b.fechaSolicitud || 0) - new Date(a.fechaSolicitud || 0));

    const candidatosVisibles = mostrarTodosTabla
        ? candidatosRecientes
        : candidatosRecientes.slice(0, 6);

    const totalSolicitudes = solicitudes.length;
    const totalNuevas = solicitudes.filter(s => s.estado === 'NUEVA_POSTULACION').length;
    const totalPendientes = solicitudes.filter(s => s.estado === 'PENDIENTE').length;
    const totalEnProceso = solicitudes.filter(s => s.estado === 'EN_PROCESO').length;
    const totalFinalizadas = solicitudes.filter(s => s.estado === 'FINALIZADA').length;
    const tasaFinalizacion = totalSolicitudes > 0 ? Math.round((totalFinalizadas / totalSolicitudes) * 100) : 0;

    const conIaExitosa = solicitudes.filter(
        s => (s.estado === 'PENDIENTE' || s.estado === 'EN_PROCESO' || s.estado === 'FINALIZADA') &&
            analizarEstadoIa(s.recomendacionIa).estado === 'ok'
    ).length;

    const conErrorIa = solicitudes.filter(
        s => (s.estado === 'PENDIENTE' || s.estado === 'EN_PROCESO' || s.estado === 'FINALIZADA') &&
            analizarEstadoIa(s.recomendacionIa).estado === 'error'
    ).length;

    const aptosCount = solicitudes.filter(s => s.resultadoEvaluacion === 'Apto').length;
    const aptosObsCount = solicitudes.filter(s => s.resultadoEvaluacion === 'Apto con Observaciones').length;
    const noAptosCount = solicitudes.filter(s => s.resultadoEvaluacion === 'No Apto').length;

    const listaPsicologos = Array.isArray(metricasEquipo?.psicologos) ? metricasEquipo.psicologos : [];
    const totalPsicologos = metricasEquipo?.totalPsicologos ?? listaPsicologos.length;
    const totalAsignadasEquipo = metricasEquipo?.totalAsignadasPsicologos ?? 0;
    const sinAsignar = metricasEquipo?.sinAsignar ?? 0;
    const promedioDiasEquipo = metricasEquipo?.promedioDiasEquipo;
    const pctAsignacionGlobal = totalSolicitudes > 0
        ? Math.round((totalAsignadasEquipo / totalSolicitudes) * 100)
        : 0;

    const psicologosFiltrados = listaPsicologos
        .filter(psi => {
            const q = busquedaPsi.trim().toLowerCase();
            if (!q) return true;
            return (
                (psi.nombre || '').toLowerCase().includes(q) ||
                (psi.correo || '').toLowerCase().includes(q)
            );
        })
        .sort((a, b) => {
            if (ordenPsi === 'finalizadas') return (b.finalizadas || 0) - (a.finalizadas || 0);
            if (ordenPsi === 'tasa') return (b.tasaFinalizacion || 0) - (a.tasaFinalizacion || 0);
            if (ordenPsi === 'nombre') return (a.nombre || '').localeCompare(b.nombre || '');
            const cargaA = (a.pendientes || 0) + (a.enEvaluacion || 0);
            const cargaB = (b.pendientes || 0) + (b.enEvaluacion || 0);
            return cargaB - cargaA;
        });

    const maxCargaEquipo = Math.max(
        1,
        ...listaPsicologos.map(p => (p.totalAsignadas || 0))
    );

    return (
        <main className="overview-container">
            {/* CABECERA PRINCIPAL + SELECTOR DE SUBVISTAS PARA ADMIN */}
            <div className="overview-welcome-pro">
                <div className="welcome-top-row">
                    <div>
                        <h1>
                            {subVista === 'equipo' && esAdmin
                                ? 'Rendimiento del Equipo de Psicólogos'
                                : 'Panel de Control de Selección'}
                        </h1>
                        <p>
                            {subVista === 'equipo' && esAdmin
                                ? 'Supervisa la distribución de carga laboral, velocidad de cierre y calidad de dictámenes por psicólogo.'
                                : 'Resumen en tiempo real del flujo de postulaciones, evaluaciones psicológicas y análisis de CV con IA.'}
                        </p>
                    </div>
                    <button className="btn-go-board" onClick={onIrAlTablero}>
                        <FiTrello /> Ir al Tablero Kanban
                    </button>
                </div>

                {esAdmin && (
                    <div className="metrics-subtabs">
                        <button
                            className={`metrics-subtab-btn ${subVista === 'general' ? 'active' : ''}`}
                            onClick={() => setSubVista('general')}
                        >
                            <FiBarChart2 /> Panorama General
                        </button>
                        <button
                            className={`metrics-subtab-btn ${subVista === 'equipo' ? 'active' : ''}`}
                            onClick={() => setSubVista('equipo')}
                        >
                            <FiUserCheck /> Rendimiento del Equipo
                            <span className="subtab-count">{totalPsicologos}</span>
                            {sinAsignar > 0 && (
                                <span className="subtab-alert-dot" title={`${sinAsignar} postulaciones sin asignar`}>
                                    {sinAsignar} sin asignar
                                </span>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* =========================================================
                SUBVISTA A: PANORAMA GENERAL
               ========================================================= */}
            {(subVista === 'general' || !esAdmin) && (
                <>
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
                                Al mover un candidato a <strong>Pendientes de Revisión</strong>, Gemini analiza su CV automáticamente en segundo plano.
                            </p>
                        </div>
                    </section>

                    <section className="recent-candidates-card">
                        <div className="recent-header recent-header-flex">
                            <div>
                                <h3>Actividad Reciente ({candidatosRecientes.length})</h3>
                                <p>Últimas postulaciones ordenadas por fecha más reciente. Haz clic en una fila para abrir la ficha.</p>
                            </div>
                            <div className="date-segmented-group">
                                {[
                                    { key: 'TODAS', label: 'Todas' },
                                    { key: 'HOY', label: 'Hoy' },
                                    { key: 'SEMANA', label: '7 días' },
                                    { key: 'MES', label: 'Este mes' }
                                ].map(op => (
                                    <button
                                        key={op.key}
                                        type="button"
                                        className={`date-pill-btn ${filtroFechaTabla === op.key ? 'active' : ''}`}
                                        onClick={() => {
                                            setFiltroFechaTabla(op.key);
                                            setMostrarTodosTabla(false);
                                        }}
                                    >
                                        {op.label}
                                    </button>
                                ))}
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
                                    {candidatosVisibles.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                                                No hay postulaciones registradas en el rango de fecha seleccionado.
                                            </td>
                                        </tr>
                                    ) : (
                                        candidatosVisibles.map(sol => {
                                            const colInfo = columnas.find(c => c.key === sol.estado) || columnas[0];
                                            const famColor = obtenerColorFamilia(sol.familiaCargo);
                                            const etapaConIa =
                                                sol.estado === 'PENDIENTE' ||
                                                sol.estado === 'EN_PROCESO' ||
                                                sol.estado === 'FINALIZADA';
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
                                                        {!etapaConIa ? (
                                                            <span className="no-ia-text">Se genera al pasar a "Pendientes de Revisión"</span>
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
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {candidatosRecientes.length > 6 && (
                            <div className="table-show-more-wrap">
                                <button
                                    type="button"
                                    className="btn-show-more-rows"
                                    onClick={() => setMostrarTodosTabla(!mostrarTodosTabla)}
                                >
                                    {mostrarTodosTabla
                                        ? 'Mostrar solo las 6 más recientes'
                                        : `Ver todas las postulaciones (${candidatosRecientes.length})`}
                                </button>
                            </div>
                        )}
                    </section>
                </>
            )}

            {/* =========================================================
                SUBVISTA B: RENDIMIENTO DEL EQUIPO (EXCLUSIVA ADMIN)
               ========================================================= */}
            {subVista === 'equipo' && esAdmin && (
                <>
                    {/* ALERTA ACCIONABLE DE POSTULACIONES SIN ASIGNAR */}
                    {sinAsignar > 0 && (
                        <div className="unassigned-alert-banner">
                            <div className="unassigned-alert-left">
                                <div className="unassigned-icon-circle"><FiAlertCircle /></div>
                                <div>
                                    <h4>
                                        Tienes {sinAsignar} {sinAsignar === 1 ? 'postulación sin psicólogo asignado' : 'postulaciones sin psicólogo asignado'}
                                    </h4>
                                    <p>
                                        Cuando un psicólogo mueve una tarjeta en el tablero, queda registrado automáticamente como responsable de ese proceso.
                                    </p>
                                </div>
                            </div>
                            <button className="btn-assign-now" onClick={onIrAlTablero}>
                                Revisar en Tablero <FiArrowRight />
                            </button>
                        </div>
                    )}

                    {/* 4 KPIs GRANDES DEL EQUIPO */}
                    <section className="kpi-grid">
                        <div className="kpi-card">
                            <div className="kpi-icon-box blue"><FiUsers /></div>
                            <div className="kpi-details">
                                <span className="kpi-label">Psicólogos Activos</span>
                                <h2 className="kpi-value">{totalPsicologos}</h2>
                                <span className="kpi-sub">Con rol PSICOLOGO en sistema</span>
                            </div>
                        </div>

                        <div className="kpi-card">
                            <div className="kpi-icon-box purple"><FiUserCheck /></div>
                            <div className="kpi-details">
                                <span className="kpi-label">Cartera Asignada</span>
                                <h2 className="kpi-value">{totalAsignadasEquipo}</h2>
                                <span className="kpi-sub">{pctAsignacionGlobal}% del total de postulaciones</span>
                            </div>
                        </div>

                        <div className={`kpi-card ${sinAsignar > 0 ? 'kpi-card-warn' : ''}`}>
                            <div className="kpi-icon-box amber"><FiAlertTriangle /></div>
                            <div className="kpi-details">
                                <span className="kpi-label">Sin Asignar</span>
                                <h2 className="kpi-value">{sinAsignar}</h2>
                                <span className="kpi-sub">
                                    {sinAsignar > 0 ? 'Requieren responsable' : 'Todas las solicitudes asignadas'}
                                </span>
                            </div>
                        </div>

                        <div className="kpi-card">
                            <div className="kpi-icon-box green"><FiClock /></div>
                            <div className="kpi-details">
                                <span className="kpi-label">Tiempo Prom. Cierre</span>
                                <h2 className="kpi-value">
                                    {promedioDiasEquipo !== null && promedioDiasEquipo !== undefined
                                        ? `${promedioDiasEquipo} d`
                                        : '—'}
                                </h2>
                                <span className="kpi-sub">Desde postulación a dictamen</span>
                            </div>
                        </div>
                    </section>

                    {/* BARRA DE BÚSQUEDA Y ORDENAMIENTO DEL EQUIPO */}
                    <section className="team-controls-bar">
                        <div className="team-controls-title">
                            <h3><FiTrendingUp /> Desempeño Individual ({psicologosFiltrados.length})</h3>
                            <span>Cada tarjeta refleja carga activa, velocidad de cierre y distribución de dictámenes.</span>
                        </div>
                        <div className="team-controls-actions">
                            <div className="kanban-search-box">
                                <FiSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Buscar psicólogo por nombre o correo..."
                                    value={busquedaPsi}
                                    onChange={(e) => setBusquedaPsi(e.target.value)}
                                />
                            </div>
                            <select
                                className="team-sort-select"
                                value={ordenPsi}
                                onChange={(e) => setOrdenPsi(e.target.value)}
                            >
                                <option value="carga">Ordenar: Mayor carga activa</option>
                                <option value="finalizadas">Ordenar: Más finalizadas</option>
                                <option value="tasa">Ordenar: Mayor % de cierre</option>
                                <option value="nombre">Ordenar: Nombre (A-Z)</option>
                            </select>
                        </div>
                    </section>

                    {/* GRID DE TARJETAS EJECUTIVAS POR PSICÓLOGO */}
                    {psicologosFiltrados.length === 0 ? (
                        <div className="recent-candidates-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
                            <p className="module-empty-msg" style={{ margin: 0 }}>
                                {listaPsicologos.length === 0
                                    ? 'Aún no hay usuarios con rol PSICOLOGO registrados. Puedes crearlos desde Gestión de Equipo en el menú lateral.'
                                    : 'No se encontraron psicólogos con ese criterio de búsqueda.'}
                            </p>
                        </div>
                    ) : (
                        <section className="psychologist-cards-grid">
                            {psicologosFiltrados.map(psi => {
                                const cargaActiva = (psi.pendientes || 0) + (psi.enEvaluacion || 0);
                                const estadoCarga = obtenerEstadoCarga(cargaActiva);
                                const totalDictamenes =
                                    (psi.aptos || 0) + (psi.aptosConObservaciones || 0) + (psi.noAptos || 0);
                                const tasaAprobacion = totalDictamenes > 0
                                    ? Math.round((((psi.aptos || 0) + (psi.aptosConObservaciones || 0)) / totalDictamenes) * 100)
                                    : null;

                                const pctApto = totalDictamenes > 0 ? ((psi.aptos || 0) / totalDictamenes) * 100 : 0;
                                const pctObs = totalDictamenes > 0 ? ((psi.aptosConObservaciones || 0) / totalDictamenes) * 100 : 0;
                                const pctNoApto = totalDictamenes > 0 ? ((psi.noAptos || 0) / totalDictamenes) * 100 : 0;

                                return (
                                    <article key={psi.psicologoId} className="psi-scorecard">
                                        {/* Cabecera del Psicólogo */}
                                        <div className="psi-card-header">
                                            <div className="psi-identity">
                                                <div className="psi-avatar-xl">{obtenerIniciales(psi.nombre)}</div>
                                                <div>
                                                    <h4>{psi.nombre}</h4>
                                                    <span>{psi.correo}</span>
                                                </div>
                                            </div>
                                            <span className={`workload-pill ${estadoCarga.clase}`}>
                                                <span className="workload-dot"></span>
                                                {estadoCarga.label}
                                            </span>
                                        </div>

                                        {/* Cuerpo Visual: Anillo de Cierre + 4 Métricas Clave */}
                                        <div className="psi-card-metrics-body">
                                            <AnilloProgreso porcentaje={psi.tasaFinalizacion} />

                                            <div className="psi-stat-quad">
                                                <div className="psi-mini-tile">
                                                    <span className="psi-tile-label">Asignadas</span>
                                                    <strong className="psi-tile-value">{psi.totalAsignadas}</strong>
                                                </div>
                                                <div className="psi-mini-tile">
                                                    <span className="psi-tile-label">Pendientes</span>
                                                    <strong className="psi-tile-value amber">{psi.pendientes}</strong>
                                                </div>
                                                <div className="psi-mini-tile">
                                                    <span className="psi-tile-label">En Evaluación</span>
                                                    <strong className="psi-tile-value purple">{psi.enEvaluacion}</strong>
                                                </div>
                                                <div className="psi-mini-tile">
                                                    <span className="psi-tile-label">Finalizadas</span>
                                                    <strong className="psi-tile-value green">{psi.finalizadas}</strong>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Barra Apilada de Dictámenes con Leyenda Clara */}
                                        <div className="psi-verdicts-section">
                                            <div className="psi-verdicts-top">
                                                <span>Distribución de Dictámenes</span>
                                                <strong>{totalDictamenes} emitidos</strong>
                                            </div>

                                            <div className="verdict-stacked-bar">
                                                {totalDictamenes > 0 ? (
                                                    <>
                                                        {pctApto > 0 && <div className="vbar-seg apto" style={{ width: `${pctApto}%` }} />}
                                                        {pctObs > 0 && <div className="vbar-seg obs" style={{ width: `${pctObs}%` }} />}
                                                        {pctNoApto > 0 && <div className="vbar-seg no-apto" style={{ width: `${pctNoApto}%` }} />}
                                                    </>
                                                ) : (
                                                    <div className="vbar-empty" />
                                                )}
                                            </div>

                                            <div className="verdict-legend-row">
                                                <span className="vlegend-item">
                                                    <i className="vdot apto"></i> Aptos: <strong>{psi.aptos}</strong>
                                                </span>
                                                <span className="vlegend-item">
                                                    <i className="vdot obs"></i> Con Obs.: <strong>{psi.aptosConObservaciones}</strong>
                                                </span>
                                                <span className="vlegend-item">
                                                    <i className="vdot no-apto"></i> No Aptos: <strong>{psi.noAptos}</strong>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Pie de Tarjeta: Aprobación y Velocidad */}
                                        <div className="psi-card-footer">
                                            <div className="psi-footer-metric">
                                                <span>Tasa de Aprobación</span>
                                                <strong>{tasaAprobacion !== null ? `${tasaAprobacion}%` : 'Sin datos'}</strong>
                                            </div>
                                            <div className="psi-footer-divider" />
                                            <div className="psi-footer-metric">
                                                <span>Tiempo Prom. de Cierre</span>
                                                <strong>
                                                    <FiClock />{' '}
                                                    {psi.promedioDiasResolucion !== null && psi.promedioDiasResolucion !== undefined
                                                        ? `${psi.promedioDiasResolucion} días`
                                                        : 'Sin cierres aún'}
                                                </strong>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </section>
                    )}

                    {/* GRÁFICO COMPARATIVO DE CARGA DEL EQUIPO */}
                    {listaPsicologos.length > 0 && (
                        <section className="recent-candidates-card">
                            <div className="recent-header">
                                <h3><FiBarChart2 /> Comparativa de Carga Laboral</h3>
                                <p>Volumen total de casos asignados (activos vs. cerrados) por psicólogo.</p>
                            </div>
                            <div className="workload-comparison-list">
                                {listaPsicologos.map(psi => {
                                    const activas = (psi.pendientes || 0) + (psi.enEvaluacion || 0);
                                    const pctActivas = Math.round((activas / maxCargaEquipo) * 100);
                                    const pctCerradas = Math.round(((psi.finalizadas || 0) / maxCargaEquipo) * 100);

                                    return (
                                        <div key={psi.psicologoId} className="workload-comp-row">
                                            <div className="workload-comp-name">
                                                <div className="mini-avatar">{obtenerIniciales(psi.nombre)}</div>
                                                <span>{psi.nombre}</span>
                                            </div>
                                            <div className="workload-comp-track">
                                                <div
                                                    className="workload-bar-active"
                                                    style={{ width: `${pctActivas}%` }}
                                                    title={`${activas} activas`}
                                                />
                                                <div
                                                    className="workload-bar-closed"
                                                    style={{ width: `${pctCerradas}%` }}
                                                    title={`${psi.finalizadas} finalizadas`}
                                                />
                                            </div>
                                            <div className="workload-comp-totals">
                                                <span className="comp-tag-active">{activas} activas</span>
                                                <span className="comp-tag-closed">{psi.finalizadas} cerradas</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                </>
            )}
        </main>
    );
};

export default MetricasPsicologo;