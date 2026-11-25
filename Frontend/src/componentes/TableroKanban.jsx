import React, { useState } from 'react';
import {
    FiSearch, FiPlus, FiClock, FiCpu, FiAlignLeft,
    FiFilter, FiX, FiLayers, FiAlertTriangle, FiInbox, FiCalendar
} from 'react-icons/fi';
import { analizarEstadoIa } from '../utils/iaHelper';

const OPCIONES_FECHA = [
    { key: 'TODAS', label: 'Todas' },
    { key: 'HOY', label: 'Hoy' },
    { key: 'SEMANA', label: 'Últimos 7 días' },
    { key: 'MES', label: 'Este mes' }
];

const TableroKanban = ({
    solicitudes,
    solicitudesFiltradas,
    columnas,
    areasDisponibles,
    obtenerColorFamilia,
    busqueda,
    setBusqueda,
    filtroFamilia,
    setFiltroFamilia,
    filtroFecha,
    setFiltroFecha,
    analizandoIaId,
    obtenerIniciales,
    onSeleccionarSolicitud,
    onAbrirCrearEnColumna,
    onDropTarjeta
}) => {
    const [columnaDragOver, setColumnaDragOver] = useState(null);

    const handleDragStart = (e, id, estadoActual) => {
        e.dataTransfer.setData('solicitudId', id.toString());
        e.dataTransfer.setData('estadoActual', estadoActual);
    };

    const handleDragOver = (e, colKey) => {
        e.preventDefault();
        if (columnaDragOver !== colKey) {
            setColumnaDragOver(colKey);
        }
    };

    const handleDragLeave = () => {
        setColumnaDragOver(null);
    };

    const handleDrop = (e, nuevoEstado) => {
        e.preventDefault();
        setColumnaDragOver(null);
        const id = e.dataTransfer.getData('solicitudId');
        const estadoActual = e.dataTransfer.getData('estadoActual');
        onDropTarjeta(id, estadoActual, nuevoEstado);
    };

    const hayFiltrosActivos =
        busqueda.trim() !== '' || filtroFamilia !== 'TODAS' || filtroFecha !== 'TODAS';

    const limpiarFiltros = () => {
        setBusqueda('');
        setFiltroFamilia('TODAS');
        setFiltroFecha('TODAS');
    };

    return (
        <div className="trello-board-wrapper">
            <section className="kanban-filter-toolbar">
                <div className="toolbar-top-row">
                    <div className="board-title-group">
                        <div className="board-icon-badge"><FiLayers /></div>
                        <div>
                            <h2>Tablero de Gestión de Candidatos</h2>
                            <span className="board-subtitle-text">
                                Mostrando <strong>{solicitudesFiltradas.length}</strong> de {solicitudes.length} postulaciones activas
                            </span>
                        </div>
                    </div>

                    <div className="kanban-Controls-right">
                        <div className="kanban-search-box">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Filtrar por nombre, cargo o #ID..."
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
                    <span className="filter-label-tag"><FiCalendar /> Fecha de postulación:</span>
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
                        className={`area-filter-pill ${filtroFamilia === 'TODAS' ? 'active-all' : ''}`}
                        onClick={() => setFiltroFamilia('TODAS')}
                    >
                        Todas las áreas
                        <span className="pill-counter">{solicitudes.length}</span>
                    </button>

                    {areasDisponibles.map(familia => {
                        const count = solicitudes.filter(s => s.familiaCargo === familia).length;
                        const famColor = obtenerColorFamilia(familia);
                        const isSelected = filtroFamilia === familia;

                        return (
                            <button
                                key={familia}
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

            <main className="trello-lists-canvas">
                {columnas.map(col => {
                    const tarjetas = solicitudesFiltradas.filter(sol => sol.estado === col.key);
                    const isOver = columnaDragOver === col.key;

                    return (
                        <div
                            key={col.key}
                            className={`trello-list ${isOver ? 'drag-over-list' : ''}`}
                            onDragOver={(e) => handleDragOver(e, col.key)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, col.key)}
                        >
                            <div className="trello-list-header" style={{ borderTop: `3px solid ${col.color}` }}>
                                <div className="list-title-wrap">
                                    <span className="list-color-bar" style={{ backgroundColor: col.color }}></span>
                                    <h3>{col.titulo}</h3>
                                </div>
                                <span className="trello-list-count">{tarjetas.length}</span>
                            </div>

                            <div className="trello-cards-stack">
                                {tarjetas.map(sol => {
                                    const famColor = obtenerColorFamilia(sol.familiaCargo);
                                    const etapaConIa =
                                        sol.estado === 'PENDIENTE' ||
                                        sol.estado === 'EN_PROCESO' ||
                                        sol.estado === 'FINALIZADA';
                                    const infoIa = analizarEstadoIa(sol.recomendacionIa);
                                    const estaAnalizandoIa =
                                        analizandoIaId?.toString() === sol.id.toString() ||
                                        ((sol.estado === 'PENDIENTE' || sol.estado === 'EN_PROCESO') &&
                                            infoIa.estado === 'pendiente');

                                    return (
                                        <div
                                            key={sol.id}
                                            className="trello-card"
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, sol.id, sol.estado)}
                                            onClick={() => onSeleccionarSolicitud(sol)}
                                        >
                                            <div className="trello-card-labels">
                                                <span
                                                    className="trello-label-pill"
                                                    style={{ backgroundColor: famColor.bg, color: famColor.text }}
                                                >
                                                    {sol.familiaCargo || 'General'}
                                                </span>
                                                {sol.resultadoEvaluacion && (
                                                    <span
                                                        className={`trello-eval-pill ${
                                                            sol.resultadoEvaluacion === 'No Apto' ? 'eval-red' : 'eval-green'
                                                        }`}
                                                    >
                                                        {sol.resultadoEvaluacion}
                                                    </span>
                                                )}
                                            </div>

                                            <h4 className="trello-card-title">{sol.nombreCandidato}</h4>
                                            <p className="trello-card-subtitle">{sol.cargo}</p>

                                            {sol.fechaEntrevista && (
                                                <div className="kanban-interview-chip" title="Entrevista agendada">
                                                    <FiCalendar />
                                                    <span>
                                                        Entrevista:{' '}
                                                        {new Date(sol.fechaEntrevista).toLocaleDateString('es-CL', {
                                                            day: '2-digit',
                                                            month: 'short'
                                                        })}{' '}
                                                        ·{' '}
                                                        {new Date(sol.fechaEntrevista).toLocaleTimeString('es-CL', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            )}

                                            {estaAnalizandoIa && (
                                                <div className="ia-analyzing-banner">
                                                    <FiCpu className="spin-icon" /> Analizando CV con IA...
                                                </div>
                                            )}

                                            <div className="trello-card-footer">
                                                <div className="trello-card-badges">
                                                    <span className="trello-badge" title="Identificador de solicitud">
                                                        #SOL-{sol.id}
                                                    </span>
                                                    <span className="trello-badge" title="Fecha de postulación">
                                                        <FiClock />
                                                        {sol.fechaSolicitud
                                                            ? new Date(sol.fechaSolicitud).toLocaleDateString('es-CL', {
                                                                  day: '2-digit',
                                                                  month: 'short'
                                                              })
                                                            : 'Hoy'}
                                                    </span>

                                                    {etapaConIa && infoIa.estado === 'ok' && (
                                                        <span className="trello-badge ia-badge" title="CV evaluado por Gemini IA">
                                                            <FiCpu /> {infoIa.puntaje !== null ? `IA: ${infoIa.puntaje}/10` : 'IA'}
                                                        </span>
                                                    )}

                                                    {etapaConIa && infoIa.estado === 'error' && (
                                                        <span className="trello-badge ia-error-badge" title="Error al analizar el CV">
                                                            <FiAlertTriangle /> Error IA
                                                        </span>
                                                    )}

                                                    {(sol.observaciones || sol.observacionEvaluacion) && (
                                                        <span className="trello-badge" title="Contiene observaciones">
                                                            <FiAlignLeft />
                                                        </span>
                                                    )}
                                                </div>

                                                <div
                                                    className="trello-card-avatar"
                                                    title={`Candidato: ${sol.nombreCandidato}`}
                                                >
                                                    {obtenerIniciales(sol.nombreCandidato)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {tarjetas.length === 0 && (
                                    <div className="trello-empty-slot">
                                        <FiInbox className="empty-slot-icon" />
                                        <span>Sin candidatos en esta etapa. Arrastra una tarjeta aquí.</span>
                                    </div>
                                )}
                            </div>

                            <button
                                className="trello-add-card-btn"
                                onClick={() => onAbrirCrearEnColumna(col.key)}
                            >
                                <FiPlus /> Añadir candidato
                            </button>
                        </div>
                    );
                })}
            </main>
        </div>
    );
};

export default TableroKanban;