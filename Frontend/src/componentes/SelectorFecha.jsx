import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiCalendar, FiChevronLeft, FiChevronRight, FiClock } from 'react-icons/fi';
import './SelectorFecha.css';

const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MESES_CORTOS = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
];

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

const SLOTS_MANANA = ['08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30'];
const SLOTS_TARDE = ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'];

const pad2 = (n) => String(n).padStart(2, '0');

const toIsoDate = (date) =>
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const parseIsoDate = (valor) => {
    if (!valor || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
    const [y, m, d] = valor.split('-').map(Number);
    return new Date(y, m - 1, d);
};

const diasEnMes = (anio, mesIndex) => new Date(anio, mesIndex + 1, 0).getDate();

/* =========================================================
   1. SELECTOR DE FECHA DE NACIMIENTO (DÍA / MES / AÑO)
   ========================================================= */
export const SelectorFechaNacimiento = ({
    id,
    value = '',
    onChange,
    theme = 'light',
    hasError = false
}) => {
    const anioActual = new Date().getFullYear();
    const anios = useMemo(() => {
        const lista = [];
        for (let y = anioActual - 15; y >= 1935; y--) {
            lista.push(y);
        }
        return lista;
    }, [anioActual]);

    const [partes, setPartes] = useState({ dia: '', mes: '', anio: '' });

    useEffect(() => {
        if (!value) {
            setPartes({ dia: '', mes: '', anio: '' });
            return;
        }
        const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (match) {
            setPartes({ anio: match[1], mes: match[2], dia: match[3] });
        }
    }, [value]);

    const maxDias = partes.mes
        ? diasEnMes(Number(partes.anio) || 2000, Number(partes.mes) - 1)
        : 31;

    const actualizarParte = (campo, nuevoValor) => {
        const siguientes = { ...partes, [campo]: nuevoValor };

        if (siguientes.dia && siguientes.mes) {
            const limite = diasEnMes(Number(siguientes.anio) || 2000, Number(siguientes.mes) - 1);
            if (Number(siguientes.dia) > limite) {
                siguientes.dia = pad2(limite);
            }
        }

        setPartes(siguientes);

        if (siguientes.anio && siguientes.mes && siguientes.dia) {
            onChange(`${siguientes.anio}-${siguientes.mes}-${siguientes.dia}`);
        } else if (value) {
            onChange('');
        }
    };

    return (
        <div className={`birth-date-group theme-${theme} ${hasError ? 'is-error' : ''}`}>
            <select
                id={id}
                aria-label="Día de nacimiento"
                value={partes.dia}
                onChange={(e) => actualizarParte('dia', e.target.value)}
                className="birth-select birth-day"
            >
                <option value="">Día</option>
                {Array.from({ length: maxDias }, (_, i) => pad2(i + 1)).map(d => (
                    <option key={d} value={d}>{d}</option>
                ))}
            </select>

            <span className="birth-sep">/</span>

            <select
                aria-label="Mes de nacimiento"
                value={partes.mes}
                onChange={(e) => actualizarParte('mes', e.target.value)}
                className="birth-select birth-month"
            >
                <option value="">Mes</option>
                {MESES.map((nombre, idx) => (
                    <option key={nombre} value={pad2(idx + 1)}>{nombre}</option>
                ))}
            </select>

            <span className="birth-sep">/</span>

            <select
                aria-label="Año de nacimiento"
                value={partes.anio}
                onChange={(e) => actualizarParte('anio', e.target.value)}
                className="birth-select birth-year"
            >
                <option value="">Año</option>
                {anios.map(a => (
                    <option key={a} value={String(a)}>{a}</option>
                ))}
            </select>
        </div>
    );
};

/* =========================================================
   2. SELECTOR DE FECHA DE ENTREVISTA (MINI CALENDARIO DARK)
   ========================================================= */
export const SelectorFechaEntrevista = ({ value = '', onChange }) => {
    const [abierto, setAbierto] = useState(false);
    const ref = useRef(null);

    const hoy = useMemo(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }, []);
    const hoyIso = toIsoDate(hoy);

    const fechaSeleccionada = parseIsoDate(value);
    const [mesVista, setMesVista] = useState(() => {
        const base = fechaSeleccionada || hoy;
        return new Date(base.getFullYear(), base.getMonth(), 1);
    });

    useEffect(() => {
        if (fechaSeleccionada) {
            setMesVista(new Date(fechaSeleccionada.getFullYear(), fechaSeleccionada.getMonth(), 1));
        }
    }, [value]);

    useEffect(() => {
        const cerrarFuera = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
        };
        const cerrarEsc = (e) => {
            if (e.key === 'Escape') setAbierto(false);
        };
        document.addEventListener('mousedown', cerrarFuera);
        document.addEventListener('keydown', cerrarEsc);
        return () => {
            document.removeEventListener('mousedown', cerrarFuera);
            document.removeEventListener('keydown', cerrarEsc);
        };
    }, []);

    const celdas = useMemo(() => {
        const anio = mesVista.getFullYear();
        const mes = mesVista.getMonth();
        const primerDia = new Date(anio, mes, 1);
        const totalDias = diasEnMes(anio, mes);
        const offset = (primerDia.getDay() + 6) % 7;

        const resultado = [];
        for (let i = 0; i < offset; i++) resultado.push(null);
        for (let d = 1; d <= totalDias; d++) {
            const fecha = new Date(anio, mes, d);
            resultado.push({ fecha, iso: toIsoDate(fecha), esPasado: fecha < hoy });
        }
        return resultado;
    }, [mesVista, hoy]);

    const seleccionarFecha = (iso) => {
        onChange(iso);
        setAbierto(false);
    };

    const obtenerProximoLunes = () => {
        const d = new Date(hoy);
        const diff = (8 - d.getDay()) % 7 || 7;
        d.setDate(d.getDate() + diff);
        return toIsoDate(d);
    };

    const etiquetaMostrar = fechaSeleccionada
        ? fechaSeleccionada.toLocaleDateString('es-CL', {
              weekday: 'short',
              day: '2-digit',
              month: 'short',
              year: 'numeric'
          })
        : 'Seleccionar fecha...';

    return (
        <div className="custom-picker-wrap" ref={ref}>
            <button
                type="button"
                className={`custom-picker-trigger ${abierto ? 'is-open' : ''}`}
                onClick={() => setAbierto(prev => !prev)}
            >
                <span className="picker-trigger-text">{etiquetaMostrar}</span>
                <FiCalendar className="picker-trigger-icon" />
            </button>

            {abierto && (
                <div className="custom-picker-popover date-popover">
                    <div className="picker-quick-chips">
                        <button
                            type="button"
                            onClick={() => seleccionarFecha(hoyIso)}
                            className={value === hoyIso ? 'active' : ''}
                        >
                            Hoy
                        </button>
                        <button
                            type="button"
                            onClick={() => seleccionarFecha(toIsoDate(new Date(hoy.getTime() + 86400000)))}
                        >
                            Mañana
                        </button>
                        <button
                            type="button"
                            onClick={() => seleccionarFecha(toIsoDate(new Date(hoy.getTime() + 2 * 86400000)))}
                        >
                            En 2 días
                        </button>
                        <button
                            type="button"
                            onClick={() => seleccionarFecha(obtenerProximoLunes())}
                        >
                            Próx. Lunes
                        </button>
                    </div>

                    <div className="mini-cal-header">
                        <button
                            type="button"
                            className="mini-cal-nav"
                            onClick={() => setMesVista(new Date(mesVista.getFullYear(), mesVista.getMonth() - 1, 1))}
                        >
                            <FiChevronLeft />
                        </button>
                        <strong>{MESES[mesVista.getMonth()]} {mesVista.getFullYear()}</strong>
                        <button
                            type="button"
                            className="mini-cal-nav"
                            onClick={() => setMesVista(new Date(mesVista.getFullYear(), mesVista.getMonth() + 1, 1))}
                        >
                            <FiChevronRight />
                        </button>
                    </div>

                    <div className="mini-cal-weekdays">
                        {DIAS_SEMANA.map(d => <span key={d}>{d}</span>)}
                    </div>

                    <div className="mini-cal-grid">
                        {celdas.map((celda, idx) =>
                            celda ? (
                                <button
                                    key={celda.iso}
                                    type="button"
                                    disabled={celda.esPasado}
                                    className={`mini-cal-day ${celda.iso === value ? 'is-selected' : ''} ${celda.iso === hoyIso ? 'is-today' : ''}`}
                                    onClick={() => seleccionarFecha(celda.iso)}
                                >
                                    {celda.fecha.getDate()}
                                </button>
                            ) : (
                                <span key={`empty-${idx}`} />
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

/* =========================================================
   3. SELECTOR DE HORA DE ENTREVISTA (BLOQUES + HORA EXACTA)
   ========================================================= */
export const SelectorHoraEntrevista = ({ value = '10:00', onChange }) => {
    const [abierto, setAbierto] = useState(false);
    const ref = useRef(null);

    const [horaActual, minActual] = (value || '10:00').split(':');

    useEffect(() => {
        const cerrarFuera = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
        };
        const cerrarEsc = (e) => {
            if (e.key === 'Escape') setAbierto(false);
        };
        document.addEventListener('mousedown', cerrarFuera);
        document.addEventListener('keydown', cerrarEsc);
        return () => {
            document.removeEventListener('mousedown', cerrarFuera);
            document.removeEventListener('keydown', cerrarEsc);
        };
    }, []);

    const elegirSlot = (slot) => {
        onChange(slot);
        setAbierto(false);
    };

    return (
        <div className="custom-picker-wrap" ref={ref}>
            <button
                type="button"
                className={`custom-picker-trigger ${abierto ? 'is-open' : ''}`}
                onClick={() => setAbierto(prev => !prev)}
            >
                <span className="picker-trigger-text">{value ? `${value} hrs` : 'Seleccionar hora...'}</span>
                <FiClock className="picker-trigger-icon" />
            </button>

            {abierto && (
                <div className="custom-picker-popover time-popover">
                    <div className="time-group-label">Mañana</div>
                    <div className="time-slots-grid">
                        {SLOTS_MANANA.map(slot => (
                            <button
                                key={slot}
                                type="button"
                                className={`time-slot-pill ${value === slot ? 'is-selected' : ''}`}
                                onClick={() => elegirSlot(slot)}
                            >
                                {slot}
                            </button>
                        ))}
                    </div>

                    <div className="time-group-label" style={{ marginTop: '10px' }}>Tarde</div>
                    <div className="time-slots-grid">
                        {SLOTS_TARDE.map(slot => (
                            <button
                                key={slot}
                                type="button"
                                className={`time-slot-pill ${value === slot ? 'is-selected' : ''}`}
                                onClick={() => elegirSlot(slot)}
                            >
                                {slot}
                            </button>
                        ))}
                    </div>

                    <div className="time-exact-row">
                        <span>Hora exacta:</span>
                        <div className="time-exact-selects">
                            <select
                                value={horaActual || '10'}
                                onChange={(e) => onChange(`${e.target.value}:${minActual || '00'}`)}
                            >
                                {Array.from({ length: 14 }, (_, i) => pad2(i + 8)).map(h => (
                                    <option key={h} value={h}>{h}</option>
                                ))}
                            </select>
                            <span>:</span>
                            <select
                                value={minActual || '00'}
                                onChange={(e) => onChange(`${horaActual || '10'}:${e.target.value}`)}
                            >
                                {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};