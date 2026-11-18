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

const EstadoPostulacion = () => {
  const [identificador, setIdentificador] = useState('');
  const [correo, setCorreo] = useState('');
  const [resultado, setResultado] = useState(null);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleBuscar = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const idLimpio = identificador.trim();
    const correoLimpio = correo.trim();

    if (!idLimpio) {
      setErrorMsg('Por favor, ingresa tu RUT (sin puntos, con guion) o tu nombre completo.');
      return;
    }

    if (!correoLimpio || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio)) {
      setErrorMsg('Ingresa un formato de correo electrónico válido (ej: nombre@correo.com).');
      return;
    }

    setLoading(true);
    setResultado(null);
    setBusquedaRealizada(false);

    try {
      const { data } = await api.post('/solicitudes/estado', {
        identificador: idLimpio,
        correo: correoLimpio
      });

      setResultado(data);
      setBusquedaRealizada(true);
    } catch (error) {
      if (error.response?.status === 404) {
        setResultado(null);
        setBusquedaRealizada(true);
      } else {
        setErrorMsg(
          error.response?.data?.message ||
            'No pudimos consultar el estado en este momento. Inténtalo nuevamente.'
        );
      }
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

  const estadoSeguro = resultado?.estado || 'NUEVA_POSTULACION';
  const indiceActual = obtenerIndiceEtapa(estadoSeguro);
  const infoEtapaActual = ETAPAS_PROCESO[indiceActual];

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
            <p>Ingresa tu RUT o nombre completo junto a tu correo electrónico para consultar tu etapa actual.</p>
          </div>

          <form
            onSubmit={handleBuscar}
            className="estado-search-form"
            style={{ flexWrap: 'wrap' }}
            noValidate
          >
            <div className="search-input-box" style={{ minWidth: '240px' }}>
              <FiUser className="search-field-icon" />
              <input
                type="text"
                value={identificador}
                onChange={(e) => {
                  setIdentificador(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="RUT (ej: 12345678-9) o Nombre completo"
              />
            </div>

            <div className="search-input-box" style={{ minWidth: '240px' }}>
              <FiMail className="search-field-icon" />
              <input
                type="email"
                value={correo}
                onChange={(e) => {
                  setCorreo(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Correo electrónico con el que postulaste"
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

        {busquedaRealizada && !loading && (
          <div className="estado-results-wrapper">
            {!resultado ? (
              <div className="estado-empty-card">
                <div className="empty-icon-circle">
                  <FiFileText />
                </div>
                <h3>No encontramos postulaciones asociadas</h3>
                <p>
                  Verifica que tu RUT (o nombre completo) y tu correo electrónico coincidan exactamente
                  con los datos ingresados al postular.
                </p>
                <Link to="/cargos" className="btn-ir-cargos">
                  Ver Oportunidades Laborales
                </Link>
              </div>
            ) : (
              <div className="postulacion-result-card">
                <div className="result-card-top">
                  <div className="result-cargo-info">
                    <span className="result-familia-badge">{resultado.familiaCargo || 'General'}</span>
                    <h2>{resultado.cargo || 'Postulación Activa'}</h2>
                    <div className="result-meta">
                      <span>
                        <FiUser /> {resultado.nombreCandidato || identificador}
                      </span>
                      <span>
                        <FiCalendar /> Postulado el {formatearFecha(resultado.fechaSolicitud)}
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
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default EstadoPostulacion;