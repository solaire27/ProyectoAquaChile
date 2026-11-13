import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowLeft,
  FiSearch,
  FiMail,
  FiUser,
  FiBriefcase,
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

const EstadoPostulacion = () => {
  const [tipoBusqueda, setTipoBusqueda] = useState('correo'); // 'correo' | 'nombre'
  const [valorBusqueda, setValorBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);
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

  const handleBuscar = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const termino = valorBusqueda.trim();
    if (!termino) {
      setErrorMsg(
        tipoBusqueda === 'correo'
          ? 'Por favor, ingresa el correo electrónico con el que postulaste.'
          : 'Por favor, ingresa tu nombre completo.'
      );
      return;
    }

    if (tipoBusqueda === 'correo' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(termino)) {
      setErrorMsg('Ingresa un formato de correo electrónico válido (ej: nombre@correo.com).');
      return;
    }

    setLoading(true);
    try {
      const params = tipoBusqueda === 'correo' ? { correo: termino } : { nombre: termino };
      const response = await api.get('/postulaciones/public/estado', { params });
      setResultados(response.data || []);
      setBusquedaRealizada(true);
    } catch (error) {
      setErrorMsg('No se pudo realizar la consulta en este momento. Inténtalo nuevamente.');
      setResultados([]);
    } finally {
      setLoading(false);
    }
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
        {/* TARJETA BUSCADOR */}
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

          {errorMsg && (
            <div className="estado-error-alert">
              <FiAlertCircle />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* RESULTADOS */}
        {busquedaRealizada && !loading && (
          <div className="estado-results-wrapper">
            {resultados.length === 0 ? (
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
              resultados.map((postulacion) => {
                const indiceActual = obtenerIndiceEtapa(postulacion.estado);
                const infoEtapaActual = ETAPAS_PROCESO[indiceActual];

                return (
                  <div key={postulacion.id} className="postulacion-result-card">
                    {/* CABECERA DE LA POSTULACIÓN */}
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

                      <div className={`status-pill status-${postulacion.estado.toLowerCase()}`}>
                        {postulacion.estado === 'FINALIZADA' ? <FiCheckCircle /> : <FiClock />}
                        <span>{infoEtapaActual.titulo}</span>
                      </div>
                    </div>

                    {/* LÍNEA DE TIEMPO (STEPPER DE 4 ETAPAS) */}
                    <div className="stepper-container">
                      {ETAPAS_PROCESO.map((etapa, idx) => {
                        const completado = idx < indiceActual || (idx === indiceActual && postulacion.estado === 'FINALIZADA');
                        const activo = idx === indiceActual && postulacion.estado !== 'FINALIZADA';

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

                    {/* DETALLE DESCRIPTIVO DE LA ETAPA ACTUAL */}
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