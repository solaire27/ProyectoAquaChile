import React, { useMemo, useState } from 'react';
import {
    FiCalendar, FiChevronLeft, FiChevronRight, FiClock,
    FiUserCheck, FiMapPin, FiExternalLink, FiEye, FiFilter
} from 'react-icons/fi';

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const toKeyFecha = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const construirLinkCalendar = (sol) => {
    if (!sol.fechaEntrevista) return '#';
    const inicio = new Date(sol.fechaEntrevista);
    const duracion = sol.duracionEntrevistaMinutos || 45;
    const fin = new Date(inicio.getTime() + duracion * 60000);
    const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: `Entrevista Psicolaboral AquaChile — ${sol.nombreCandidato} (${sol.cargo})`,
        dates: `${fmt(inicio)}/${fmt(fin)}`,
        details: `Candidato: ${sol.nombreCandidato}\nCargo: ${sol.cargo}\nSolicitud: #SOL-${sol.id}${sol.notasEntrevista ? `\nNotas: ${sol.notasEntrevista}` : ''}`,
        location: sol.modalidadEntrevista || 'Online'
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

const CalendarioEntrevistas = ({
    solicitudes,
    esAdmin,
    obtenerColorFamilia,
    obtenerIniciales,
    onSeleccionarSolicitud
}) => {
    const hoy = new Date();
    const hoyKey = toKeyFecha(hoy);

    const [mesActual, setMesActual] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    const [diaSeleccionado, setDiaSeleccionado] = useState(hoyKey);
    const [filtroResponsable, setFiltroResponsable] = useState('TODOS');

    const entrevistasTotales = useMemo(() => {
        return solicitudes
            .filter(s => Boolean(s.fechaEntrevista))
            .sort((a, b) => new Date(a.fechaEntrevista) - new Date(b.fechaEntrevista));
    }, [solicitudes]);

    const responsablesUnicos = useMemo(() => {
        return Array.from(
            new Set(entrevistasTotales.map(s => s.nombreResponsable).filter(Boolean))
        );
    }, [entrevistasTotales]);

    const entrevistasFiltradas = useMemo(() => {
        if (filtroResponsable === 'TODOS') return entrevistasTotales;
        return entrevistasTotales.filter(s => s.nombreResponsable === filtroResponsable);
    }, [entrevistasTotales, filtroResponsable]);

    const mapaPorDia = useMemo(() => {
        const mapa = {};
        entrevistasFiltradas.forEach(sol => {
            const fecha = new Date(sol.fechaEntrevista);
            const key = toKeyFecha(fecha);
            if (!mapa[key]) mapa[key] = [];
            mapa[key].push(sol);
        });
        return mapa;
    }, [entrevistasFiltradas]);

    // Estadísticas rápidas
    const entrevistasHoy = (mapaPorDia[hoyKey] || []).length;
    const limite7Dias = new Date(hoy.getTime() + 7 * 86400000);
    const proximos7Dias = entrevistasFiltradas.filter(s => {
        const f = new Date(s.fechaEntrevista);
        return f >= new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()) && f <= limite7Dias;
    }).length;

    // Construcción de la grilla mensual (iniciando en lunes)
    const celdasCalendario = useMemo(() => {
        const anio = mesActual.getFullYear();
        const mes = mesActual.getMonth();
        const primerDia = new Date(anio, mes, 1);
        const ultimoDia = new Date(anio, mes + 1, 0);

        const offsetLunes = (primerDia.getDay() + 6) % 7; // 0 = Lun ... 6 = Dom
        const celdas = [];

        // Días del mes anterior
        for (let i = offsetLunes - 1; i >= 0; i--) {
            const d = new Date(anio, mes, -i);
            celdas.push({ fecha: d, key: toKeyFecha(d), esMesActual: false });
        }

        // Días del mes actual
        for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
            const d = new Date(anio, mes, dia);
            celdas.push({ fecha: d, key: toKeyFecha(d), esMesActual: true });
        }

        // Relleno hasta completar semanas de 7 días
        while (celdas.length % 7 !== 0) {
            const d = new Date(anio, mes + 1, celdas.length - (offsetLunes + ultimoDia.getDate()) + 1);
            celdas.push({ fecha: d, key: toKeyFecha(d), esMesActual: false });
        }

        return celdas;
    }, [mesActual]);

    const irMesAnterior = () =>
        setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1, 1));

    const irMesSiguiente = () =>
        setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 1));

    const irAHoy = () => {
        setMesActual(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
        setDiaSeleccionado(hoyKey);
    };

    const entrevistasDelDia = mapaPorDia[diaSeleccionado] || [];
    const proximasEntrevistas = entrevistasFiltradas
        .filter(s => new Date(s.fechaEntrevista) >= new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()))
        .slice(0, 5);

    const formatearTituloDia = (key) => {
        const [y, m, d] = key.split('-').map(Number);
        const fecha = new Date(y, m - 1, d);
        return fecha.toLocaleDateString('es-CL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    };

    return (
        <main className="overview-container">
            <div className="overview-welcome-pro">
                <div className="welcome-top-row">
                    <div>
                        <h1>Agenda de Entrevistas</h1>
                        <p>
                            {esAdmin
                                ? 'Vista consolidada de todas las entrevistas psicolaborales programadas por el equipo.'
                                : 'Revisa tus entrevistas psicolaborales programadas.'}
                        </p>
                    </div>

                    <div className="calendar-top-stats">
                        <div className="cal-stat-chip">
                            <span>Hoy</span>
                            <strong>{entrevistasHoy}</strong>
                        </div>
                        <div className="cal-stat-chip">
                            <span>Próximos 7 días</span>
                            <strong>{proximos7Dias}</strong>
                        </div>
                        <div className="cal-stat-chip">
                            <span>Total agendadas</span>
                            <strong>{entrevistasFiltradas.length}</strong>
                        </div>
                    </div>
                </div>

                {esAdmin && responsablesUnicos.length > 0 && (
                    <div className="calendar-admin-filter">
                        <span className="filter-label-tag"><FiFilter /> Filtrar por evaluador:</span>
                        <select
                            className="team-sort-select"
                            value={filtroResponsable}
                            onChange={(e) => setFiltroResponsable(e.target.value)}
                        >
                            <option value="TODOS">Todo el equipo ({entrevistasTotales.length})</option>
                            {responsablesUnicos.map(resp => (
                                <option key={resp} value={resp}>{resp}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="calendar-layout-grid">
                {/* PANEL IZQUIERDO: GRILLA MENSUAL */}
                <section className="calendar-main-card">
                    <div className="calendar-nav-header">
                        <h2>
                            <FiCalendar /> {MESES[mesActual.getMonth()]} {mesActual.getFullYear()}
                        </h2>
                        <div className="calendar-nav-btns">
                            <button type="button" className="cal-nav-btn" onClick={irMesAnterior} title="Mes anterior">
                                <FiChevronLeft />
                            </button>
                            <button type="button" className="cal-today-btn" onClick={irAHoy}>
                                Hoy
                            </button>
                            <button type="button" className="cal-nav-btn" onClick={irMesSiguiente} title="Mes siguiente">
                                <FiChevronRight />
                            </button>
                        </div>
                    </div>

                    <div className="calendar-weekdays-row">
                        {DIAS_SEMANA.map(d => (
                            <div key={d} className="calendar-weekday-cell">{d}</div>
                        ))}
                    </div>

                    <div className="calendar-days-grid">
                        {celdasCalendario.map(celda => {
                            const eventos = mapaPorDia[celda.key] || [];
                            const esHoy = celda.key === hoyKey;
                            const estaSeleccionado = celda.key === diaSeleccionado;

                            return (
                                <button
                                    key={celda.key}
                                    type="button"
                                    className={`calendar-day-cell ${!celda.esMesActual ? 'other-month' : ''} ${esHoy ? 'is-today' : ''} ${estaSeleccionado ? 'is-selected' : ''}`}
                                    onClick={() => setDiaSeleccionado(celda.key)}
                                >
                                    <div className="day-number-row">
                                        <span className="day-number">{celda.fecha.getDate()}</span>
                                        {eventos.length > 0 && (
                                            <span className="day-event-count">{eventos.length}</span>
                                        )}
                                    </div>

                                    <div className="day-events-preview">
                                        {eventos.slice(0, 2).map(ev => (
                                            <span key={ev.id} className="day-event-pill">
                                                {new Date(ev.fechaEntrevista).toLocaleTimeString('es-CL', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}{' '}
                                                {ev.nombreCandidato.split(' ')[0]}
                                            </span>
                                        ))}
                                        {eventos.length > 2 && (
                                            <span className="day-event-more">+{eventos.length - 2} más</span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* PANEL DERECHO: DETALLE DEL DÍA + PRÓXIMAS */}
                <aside className="calendar-side-panel">
                    <div className="calendar-side-card">
                        <div className="calendar-side-header">
                            <h3>{formatearTituloDia(diaSeleccionado)}</h3>
                            <span>{entrevistasDelDia.length} {entrevistasDelDia.length === 1 ? 'entrevista' : 'entrevistas'}</span>
                        </div>

                        {entrevistasDelDia.length === 0 ? (
                            <p className="calendar-empty-day">
                                No hay entrevistas agendadas para este día. Haz clic en cualquier día marcado del calendario o agenda una desde el Tablero Kanban.
                            </p>
                        ) : (
                            <div className="calendar-agenda-list">
                                {entrevistasDelDia.map(sol => {
                                    const famColor = obtenerColorFamilia(sol.familiaCargo);
                                    const hora = new Date(sol.fechaEntrevista).toLocaleTimeString('es-CL', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    });

                                    return (
                                        <div key={sol.id} className="agenda-item-card">
                                            <div className="agenda-item-top">
                                                <span className="agenda-time-badge">
                                                    <FiClock /> {hora} ({sol.duracionEntrevistaMinutos || 45} min)
                                                </span>
                                                <span
                                                    className="trello-label-pill small"
                                                    style={{ backgroundColor: famColor.bg, color: famColor.text }}
                                                >
                                                    {sol.familiaCargo}
                                                </span>
                                            </div>

                                            <div className="agenda-candidate-row">
                                                <div className="mini-avatar">{obtenerIniciales(sol.nombreCandidato)}</div>
                                                <div>
                                                    <strong>{sol.nombreCandidato}</strong>
                                                    <span>{sol.cargo}</span>
                                                </div>
                                            </div>

                                            <div className="agenda-meta-lines">
                                                <span><FiMapPin /> {sol.modalidadEntrevista || 'Online'}</span>
                                                <span><FiUserCheck /> {sol.nombreResponsable || 'Sin responsable'}</span>
                                            </div>

                                            {sol.notasEntrevista && (
                                                <p className="agenda-notes">{sol.notasEntrevista}</p>
                                            )}

                                            <div className="agenda-item-actions">
                                                <button
                                                    type="button"
                                                    className="btn-table-view"
                                                    onClick={() => onSeleccionarSolicitud(sol)}
                                                >
                                                    <FiEye /> Ver Ficha
                                                </button>
                                                <a
                                                    href={construirLinkCalendar(sol)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn-agenda-gcal"
                                                >
                                                    <FiExternalLink /> Google Calendar
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="calendar-side-card">
                        <div className="calendar-side-header">
                            <h3>Próximas Entrevistas</h3>
                            <span>Siguientes 5</span>
                        </div>

                        {proximasEntrevistas.length === 0 ? (
                            <p className="calendar-empty-day">Aún no hay entrevistas futuras programadas.</p>
                        ) : (
                            <div className="upcoming-mini-list">
                                {proximasEntrevistas.map(sol => (
                                    <button
                                        key={sol.id}
                                        type="button"
                                        className="upcoming-mini-row"
                                        onClick={() => {
                                            const f = new Date(sol.fechaEntrevista);
                                            setMesActual(new Date(f.getFullYear(), f.getMonth(), 1));
                                            setDiaSeleccionado(toKeyFecha(f));
                                        }}
                                    >
                                        <div className="upcoming-date-box">
                                            <strong>
                                                {new Date(sol.fechaEntrevista).toLocaleDateString('es-CL', { day: '2-digit' })}
                                            </strong>
                                            <span>
                                                {new Date(sol.fechaEntrevista).toLocaleDateString('es-CL', { month: 'short' })}
                                            </span>
                                        </div>
                                        <div className="upcoming-info">
                                            <strong>{sol.nombreCandidato}</strong>
                                            <span>
                                                {sol.cargo} ·{' '}
                                                {new Date(sol.fechaEntrevista).toLocaleTimeString('es-CL', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </main>
    );
};

export default CalendarioEntrevistas;