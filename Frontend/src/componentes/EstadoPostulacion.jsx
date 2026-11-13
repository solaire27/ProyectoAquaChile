import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowLeft,
  FiSearch,
  FiMail,
  FiUser,
  FiCalendar,
  FiCheck,
  FiClock,
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo
} from 'react-icons/fi';
import api from '../services/api';
import './EstadoPostulacion.css';

const ETAPAS_PROCESO = [
  {
    key: 'NUEVA_POSTULACION',
    titulo: 'Postulación Recibida',
    descripcion: 'Tu currículum y antecedentes ingresaron correctamente a nuestro portal.'
  },
  {
    key: 'PENDIENTE',
    titulo: 'En Revisión',
    descripcion: 'Nuestro equipo de selección está revisando tu perfil y experiencia.'
  },
  {
    key: 'EN_PROCESO',
    titulo: 'En Evaluación',
    descripcion: 'Tu perfil avanzó a etapa de entrevistas y evaluación psicolaboral.'
  },
  {
    key: 'FINALIZADA',
    titulo: 'Finalizada',
    descripcion: 'El proceso de selección para esta postulación ha concluido.'
  }
];

const DATOS_PRUEBA_OFFLINE = [
  {
    id: 101,
    nombreCandidato: 'María González',
    correoCandidato: 'maria@correo.com',
    cargo: 'Operario de Planta',
    familiaCargo: 'Operativo',
    fechaSolicitud: '2026-11-10T10:30:00',
    estado: 'NUEVA_POSTULACION'
  },
  {
    id: 102,
    nombreCandidato: 'Juan Pérez',
    correoCandidato: 'juan.perez@correo.com',
    cargo: 'Analista Contable',
    familiaCargo: 'Administrativo',
    fechaSolicitud: '2026-11-08T15:20:00',
    estado: 'PENDIENTE'
  },
  {
    id: 103,
    nombreCandidato: 'Camila Silva',
    correoCandidato: 'camila.silva@correo.com',
    cargo: 'Jefe de Turno',
    familiaCargo: 'Jefatura',
    fechaSolicitud: '2026-11-04T09:15:00',
    estado: 'EN_PROCESO'
  },
  {
    id: 104,
    nombreCandidato: 'Carlos Ruiz',
    correoCandidato: 'carlos.ruiz@correo.com',
    cargo: 'Gerente de Operaciones',
    familiaCargo: 'Gerencia',
    fechaSolicitud: '2026-10-28T14:00:00',
    estado: 'FINALIZADA'
  }
];

const EstadoPostulacion = () => {
  const [tipoBusqueda, setTipoBusqueda] = useState('correo');
  const [valorBusqueda, setValorBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);
  const [modoOffline, setModoOffline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const cambiarTipoBusqueda = (nuevoTipo) => {
    setTipoBusqueda(nuevoTipo);
    setValorBusqueda('');
    setErrorMsg('');
  };

  const filtrarDatosOffline = (tipo, termino) => {
    return DATOS_PRUEBA_OFFLINE.filter((item) =>
      tipo === 'correo'
        ? item.correoCandidato.toLowerCase() === termino.toLowerCase()
        : item.nombreCandidato.toLowerCase().includes(termino.toLowerCase())
    );
  };

  const ejecutarBusqueda = async (tipo, valor) => {
    setErrorMsg('');
    const termino = valor.trim();

    if (!termino) {
      setErrorMsg(
        tipo === 'correo'
          ? 'Por favor, ingresa el correo electrónico con el que postulaste.'
          : 'Por favor, ingresa tu nombre completo.'
      );
      return;
    }

    if (tipo === 'correo' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(termino)) {
      setErrorMsg('Ingresa un formato de correo electrónico válido (ej: nombre@correo.com).');
      return;
    }

    setLoading(true);
    try {
      const params = tipo === 'correo' ? { correo: termino } : { nombre: termino };
      const response = await api.get('/postulaciones/public/estado', { params, timeout: 2500 });

      // Si Vite devolvió HTML en vez de un arreglo JSON, forzamos el modo offline
      if (!Array.isArray(response.data)) {
        throw new Error('Respuesta no válida del backend');
      }

      setResultados(response.data);
      setModoOffline(false);
      setBusquedaRealizada(true);
    } catch (error) {
      const filtrados = filtrarDatosOffline(tipo, termino);
      setResultados(filtrados);
      setModoOffline(true);
      setBusquedaRealizada(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = (e) => {
    e.preventDefault();
    ejecutarBusqueda(tipoBusqueda, valorBusqueda);
  };

  const probarEjemplo = (correoEjemplo) => {
    setTipoBusqueda('correo');
    setValorBusqueda(correoEjemplo);
    ejecutarBusqueda('correo', correoEjemplo);
  };

  const obtenerIndiceEtapa = (estadoActual) => {
    const index = ETAPAS_PROCESO.findIndex((etapa) => etapa.key === estadoActual);
    return index === -1 ? 0 : index;
  };

  const formatearFecha = (fechaIso) => {
    if (!fechaIso) return 'Fecha registrada';
    const fecha = new Date(fechaIso);
    return fecha.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const listaSegura = Array.isArray(resultados) ? resultados : [];

  return (
    <div className="estado-page">
      <header className="estado-header">
        <Link to="/" className="logo-brand">
          <div className="logo-icon-small">🌊</div>
          <span>AquaChile</span>
        </Link>
        <Link to="/" className="link-volver">
          <FiArrowLeft /> Volver al Inicio
        </Link>
      </header>

      <main className="estado-container">
        <div className="estado-search-card">
          <div className="estado-title-block">
            <h1>Seguimiento de Postulación</h1>
            <p>Consulta en línea la etapa actual de tu proceso de selección en AquaChile.</p>
          </div>

          <div className="search-tabs">
            <button
              type="button"
              className={`search-tab ${tipoBusqueda === 'correo' ? 'active' : ''}`}
              onClick={() => cambiarTipoBusqueda('correo')}
            >
              <FiMail /> Buscar por Correo
            </button>
            <button
              type="button"
              className={`search-tab ${tipoBusqueda === 'nombre' ? 'active' : ''}`}
              onClick={() => cambiarTipoBusqueda('nombre')}
            >
              <FiUser /> Buscar por Nombre
            </button>
          </div>

          <form onSubmit={handleBuscar} className="estado-search-form" noValidate>
            <div className="search-input-box">
              {tipoBusqueda === 'correo' ? (
                <FiMail className="search-field-icon" />
              ) : (
                <FiUser className="search-field-icon" />
              )}
              <input
                type={tipoBusqueda === 'correo' ? 'email' : 'text'}
                value={valorBusqueda}
                onChange={(e) => {
                  setValorBusqueda(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder={
                  tipoBusqueda === 'correo'
                    ? 'Ingresa tu correo electrónico (ej: maria@correo.com)'
                    : 'Ingresa tu nombre completo (ej: María González)'
                }
              />
            </div>

            <button type="submit" disabled={loading} className="btn-consultar-estado">
              <FiSearch />
              <span>{loading ? 'Buscando...' : 'Consultar Estado'}</span>
            </button>
          </form>

          <div className="demo-chips-bar">
            <span>Pruebas rápidas (sin BD):</span>
            <button type="button" className="demo-chip" onClick={() => probarEjemplo('maria@correo.com')}>
              Etapa 1: Recibida
            </button>
            <button type="button" className="demo-chip" onClick={() => probarEjemplo('juan.perez@correo.com')}>
              Etapa 2: En Revisión
            </button>
            <button type="button" className="demo-chip" onClick={() => probarEjemplo('camila.silva@correo.com')}>
              Etapa 3: En Evaluación
            </button>
            <button type="button" className="demo-chip" onClick={() => probarEjemplo('carlos.ruiz@correo.com')}>
              Etapa 4: Finalizada
            </button>
          </div>

          {errorMsg && (
            <div className="estado-error-alert">
              <FiAlertCircle />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {busquedaRealizada && !loading && (
          <div className="estado-results-wrapper">
            {modoOffline && listaSegura.length > 0 && (
              <div className="offline-preview-banner">
                Mostrando datos de vista previa (Backend desconectado).
              </div>
            )}

            {listaSegura.length === 0 ? (
              <div className="estado-empty-card">
                <div className="empty-icon-circle">
                  <FiFileText />
                </div>
                <h3>No encontramos postulaciones asociadas</h3>
                <p>
                  Verifica que el {tipoBusqueda === 'correo' ? 'correo electrónico' : 'nombre'} esté escrito
                  tal como lo ingresaste al postular, o explora nuestras vacantes disponibles.
                </p>
                <Link to="/cargos" className="btn-ir-cargos">
                  Ver Oportunidades Laborales
                </Link>
              </div>
            ) : (
              listaSegura.map((postulacion) => {
                const estadoSeguro = postulacion.estado || 'NUEVA_POSTULACION';
                const indiceActual = obtenerIndiceEtapa(estadoSeguro);
                const infoEtapaActual = ETAPAS_PROCESO[indiceActual];

                return (
                  <div key={postulacion.id} className="postulacion-result-card">
                    <div className="result-card-top">
                      <div className="result-cargo-info">
                        <span className="result-familia-badge">{postulacion.familiaCargo}</span>
                        <h2>{postulacion.cargo}</h2>
                        <div className="result-meta">
                          <span>
                            <FiUser /> {postulacion.nombreCandidato}
                          </span>
                          <span>
                            <FiCalendar /> Postulado el {formatearFecha(postulacion.fechaSolicitud)}
                          </span>
                        </div>
                      </div>

                      <div className={`status-pill status-${estadoSeguro.toLowerCase()}`}>
                        {estadoSeguro === 'FINALIZADA' ? <FiCheckCircle /> : <FiClock />}
                        <span>{infoEtapaActual.titulo}</span>
                      </div>
                    </div>

                    <div className="stepper-container">
                      {ETAPAS_PROCESO.map((etapa, idx) => {
                        const completado =
                          idx < indiceActual || (idx === indiceActual && estadoSeguro === 'FINALIZADA');
                        const activo = idx === indiceActual && estadoSeguro !== 'FINALIZADA';

                        return (
                          <div
                            key={etapa.key}
                            className={`stepper-step ${completado ? 'completed' : ''} ${activo ? 'active' : ''}`}
                          >
                            {idx !== 0 && (
                              <div className={`step-connector ${idx <= indiceActual ? 'filled' : ''}`} />
                            )}
                            <div className="step-circle">
                              {completado ? <FiCheck /> : <span>{idx + 1}</span>}
                            </div>
                            <span className="step-label">{etapa.titulo}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="stage-detail-box">
                      <FiInfo className="stage-detail-icon" />
                      <div>
                        <strong>Estado actual: {infoEtapaActual.titulo}</strong>
                        <p>{infoEtapaActual.descripcion}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default EstadoPostulacion;