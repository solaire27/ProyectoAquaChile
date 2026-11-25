import React, { useState } from 'react';
import {
    FiInbox, FiSearch, FiFilter, FiCalendar, FiX,
    FiCheckCircle, FiEye, FiClock, FiFileText, FiUserPlus
} from 'react-icons/fi';

const OPCIONES_FECHA = [
    { key: 'TODAS', label: 'Todas' },
    { key: 'HOY', label: 'Hoy' },
    { key: 'SEMANA', label: 'Últimos 7 días' },
    { key: 'MES', label: 'Este mes' }
];

const cumpleRangoFecha = (fechaIso, rango) => {
    if (rango === 'TODAS' || !fechaIso) return true;
    const fecha = new Date(fechaIso);
    const ahora = new Date();
    if (rango === 'HOY') return fecha.toDateString() === ahora.toDateString();
    if (rango === 'SEMANA') return (ahora - fecha) <= 7 * 86400000;
    if (rango === 'MES') {
        return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
    }
    return true;
};

const BandejaPostulaciones = ({
    solicitudesSinAsignar,
    areasDisponibles,
    obtenerColorFamilia,
    obtenerIniciales,
    tomandoId,
    onAceptarPostulacion,
    onSeleccionarSolicitud
}) => {
    const [busqueda, setBusqueda] = useState('');
    const [filtroFamilia, setFiltroFamilia] = useState('TODAS');
    const [filtroFecha, setFiltroFecha] = useState('TODAS');

    const filtradas = [...solicitudesSinAsignar]
        .filter(sol => {
            const q = busqueda.trim().toLowerCase();
            const coincideTexto =
                !q ||
                (sol.nombreCandidato || '').toLowerCase().includes(q) ||
                (sol.cargo || '').toLowerCase().includes(q) ||
                `#sol-${sol.id}`.includes(q);
            const coincideFamilia = filtroFamilia === 'TODAS' || sol.familiaCargo === filtroFamilia;
            const coincideFecha = cumpleRangoFecha(sol.fechaSolicitud, filtroFecha);
            return coincideTexto && coincideFamilia && coincideFecha;
        })
        .sort((a, b) => new Date(b.fechaSolicitud || 0) - new Date(a.fechaSolicitud || 0));

    const hayFiltros = busqueda.trim() !== '' || filtroFamilia !== 'TODAS' || filtroFecha !== 'TODAS';

    const limpiarFiltros = () => {
        setBusqueda('');
        setFiltroFamilia('TODAS');
        setFiltroFecha('TODAS');
    };

    return (
        <main className="overview-container">
            <div className="overview-welcome-pro">
                <div className="welcome-top-row">
                    <div>
                        <h1>Bandeja de Postulaciones sin Asignar</h1>
                        <p>
                            Revisa las postulaciones disponibles y acepta las que gestionarás. Al aceptar una postulación, pasará directamente a tu <strong>Tablero Kanban</strong> y se activará el análisis de IA.
                        </p>
                    </div>
                    <div className="calendar-top-stats">
                        <div className="cal-stat-chip">
                            <span>Disponibles</span>
                            <strong>{solicitudesSinAsignar.length}</strong>
                        </div>
                        <div className="cal-stat-chip">
                            <span>Mostrando</span>
                            <strong>{filtradas.length}</strong>
                        </div>
                    </div>
                </div>
            </div>

            <section className="kanban-filter-toolbar">
                <div className="toolbar-top-row">
                    <div className="board-title-group">
                        <div className="board-icon-badge"><FiInbox /></div>
                        <div>
                            <h2>Cola de Postulaciones Disponibles</h2>
                            <span className="board-subtitle-text">
                                Ordenadas de la más reciente a la más antigua
                            </span>
                        </div>
                    </div>

                    <div className="kanban-Controls-right">
                        <div className="kanban-search-box">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, cargo o #ID..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                            {busqueda && (
                                <button className="clear-input-btn" onClick={() => setBusqueda('')}>
                                    <FiX />
                                </button>
                            )}
                        </div>

                        {hayFiltros && (
                            <button className="btn-clear-filters" onClick={limpiarFiltros}>
                                <FiX /> Limpiar filtros
                            </button>
                        )}
                    </div>
                </div>

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

                <div className="filter-pills-row">
                    <span className="filter-label-tag"><FiFilter /> Filtrar por área:</span>

                    <button
                        className={`area-filter-pill ${filtroFamilia === 'TODAS' ? 'active-all' : ''}`}
                        onClick={() => setFiltroFamilia('TODAS')}
                    >
                        Todas las áreas
                        <span className="pill-counter">{solicitudesSinAsignar.length}</span>
                    </button>

                    {areasDisponibles.map(familia => {
                        const count = solicitudesSinAsignar.filter(s => s.familiaCargo === familia).length;
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

            {filtradas.length === 0 ? (
                <section className="recent-candidates-card inbox-empty-state">
                    <div className="inbox-empty-icon"><FiCheckCircle /></div>
                    <h3>
                        {solicitudesSinAsignar.length === 0
                            ? '¡Todo al día! No hay postulaciones sin asignar'
                            : 'No hay postulaciones con los filtros seleccionados'}
                    </h3>
                    <p>
                        {solicitudesSinAsignar.length === 0
                            ? 'Todas las postulaciones activas ya cuentan con un psicólogo responsable asignado.'
                            : 'Prueba limpiando los filtros de búsqueda, fecha o área.'}
                    </p>
                </section>
            ) : (
                <section className="inbox-cards-grid">
                    {filtradas.map(sol => {
                        const famColor = obtenerColorFamilia(sol.familiaCargo);
                        const estaTomando = tomandoId === sol.id;

                        return (
                            <article key={sol.id} className="inbox-card">
                                <div className="inbox-card-top">
                                    <span
                                        className="trello-label-pill"
                                        style={{ backgroundColor: famColor.bg, color: famColor.text }}
                                    >
                                        {sol.familiaCargo || 'General'}
                                    </span>
                                    <span className="inbox-id-badge">#SOL-{sol.id}</span>
                                </div>

                                <div className="inbox-candidate-header">
                                    <div className="mini-avatar inbox-avatar">
                                        {obtenerIniciales(sol.nombreCandidato)}
                                    </div>
                                    <div>
                                        <h4>{sol.nombreCandidato}</h4>
                                        <p>{sol.cargo}</p>
                                    </div>
                                </div>

                                <div className="inbox-meta-row">
                                    <span>
                                        <FiClock />{' '}
                                        {sol.fechaSolicitud
                                            ? new Date(sol.fechaSolicitud).toLocaleDateString('es-CL', {
                                                  day: '2-digit',
                                                  month: 'short',
                                                  year: 'numeric'
                                              })
                                            : 'Reciente'}
                                    </span>
                                    <span>
                                        <FiFileText /> {sol.urlCv ? 'CV PDF adjunto' : 'Sin CV adjunto'}
                                    </span>
                                </div>

                                <div className="inbox-card-actions">
                                    <button
                                        type="button"
                                        className="btn-table-view"
                                        onClick={() => onSeleccionarSolicitud(sol)}
                                    >
                                        <FiEye /> Ver Ficha
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-claim-postulacion"
                                        disabled={estaTomando}
                                        onClick={() => onAceptarPostulacion(sol)}
                                    >
                                        <FiUserPlus /> {estaTomando ? 'Asignando...' : 'Aceptar Postulación'}
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </section>
            )}
        </main>
    );
};

export default BandejaPostulaciones;