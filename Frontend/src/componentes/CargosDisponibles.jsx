import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiHome, FiUser, FiMail, FiLock, FiCheckCircle,
  FiArrowRight, FiSearch, FiMapPin, FiBriefcase,
  FiDollarSign, FiX, FiEye
} from 'react-icons/fi';
import api from '../services/api';
import './CargosDisponibles.css';

const CargosDisponibles = () => {
  const [ofertas, setOfertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [familiaActiva, setFamiliaActiva] = useState('TODAS');
  const [ofertaDetalle, setOfertaDetalle] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    const cargarOfertasPublicas = async () => {
      try {
        const { data } = await api.get('/ofertas/public');
        setOfertas(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error al cargar ofertas públicas:', err);
        setError('No pudimos cargar las oportunidades laborales en este momento.');
      } finally {
        setCargando(false);
      }
    };

    cargarOfertasPublicas();
  }, []);

  const familiasDisponibles = Array.from(
    new Set(ofertas.map(o => o.familiaCargo || 'General'))
  );

  const ofertasFiltradas = ofertas.filter(oferta => {
    const familia = oferta.familiaCargo || 'General';
    const coincideFamilia = familiaActiva === 'TODAS' || familia === familiaActiva;
    const q = busqueda.trim().toLowerCase();
    const coincideTexto =
      !q ||
      (oferta.tituloCargo || '').toLowerCase().includes(q) ||
      familia.toLowerCase().includes(q) ||
      (oferta.ubicacion || '').toLowerCase().includes(q) ||
      (oferta.modalidad || '').toLowerCase().includes(q) ||
      (oferta.descripcion || '').toLowerCase().includes(q);

    return coincideFamilia && coincideTexto;
  });

  const ofertasPorFamilia = ofertasFiltradas.reduce((acc, oferta) => {
    const familia = oferta.familiaCargo || 'General';
    if (!acc[familia]) acc[familia] = [];
    acc[familia].push(oferta);
    return acc;
  }, {});

  const familiasVisibles = Object.keys(ofertasPorFamilia);

  return (
    <div className="cargos-page-container">
      <header className="navbar-landing dark-nav">
        <Link to="/" className="logo-section" style={{ textDecoration: 'none' }}>
          <div className="logo-icon">🌊</div>
          <span className="logo-text">AquaChile</span>
        </Link>
        <nav className="nav-menu">
          <Link to="/" className="nav-item">
            <FiHome className="nav-icon" />
            <span>Inicio</span>
          </Link>
          <Link to="/sobre-nosotros" className="nav-item">
            <FiUser className="nav-icon" />
            <span>Sobre Nosotros</span>
          </Link>
          <Link to="/#contacto" className="nav-item">
            <FiMail className="nav-icon" />
            <span>Contacto</span>
          </Link>
          <Link to="/login" className="btn-iniciar-sesion">
            <FiLock className="btn-icon" />
            <span>Iniciar Sesión</span>
          </Link>
        </nav>
      </header>

      <section className="cargos-hero">
        <div className="cargos-hero-content">
          <h1>Oportunidades Laborales</h1>
          <p>Únete a nuestro equipo. Encuentra tu lugar en nuestra familia organizada por áreas de desarrollo y sé parte del crecimiento de la acuicultura sostenible.</p>
        </div>
      </section>

      <main className="cargos-main">
        {!cargando && !error && ofertas.length > 0 && (
          <section className="cargos-filter-bar">
            <div className="cargos-search-box">
              <FiSearch className="cargos-search-icon" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por cargo, área, ubicación..."
              />
              {busqueda && (
                <button
                  type="button"
                  className="cargos-clear-search"
                  onClick={() => setBusqueda('')}
                  aria-label="Limpiar búsqueda"
                >
                  <FiX />
                </button>
              )}
            </div>

            <div className="cargos-category-pills">
              <button
                type="button"
                className={`cargos-cat-pill ${familiaActiva === 'TODAS' ? 'active' : ''}`}
                onClick={() => setFamiliaActiva('TODAS')}
              >
                Todas ({ofertas.length})
              </button>
              {familiasDisponibles.map(fam => {
                const count = ofertas.filter(o => (o.familiaCargo || 'General') === fam).length;
                return (
                  <button
                    key={fam}
                    type="button"
                    className={`cargos-cat-pill ${familiaActiva === fam ? 'active' : ''}`}
                    onClick={() => setFamiliaActiva(fam)}
                  >
                    {fam} ({count})
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {cargando ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
            Cargando oportunidades laborales...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#dc2626' }}>
            {error}
          </div>
        ) : ofertas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <h3>Actualmente no hay vacantes publicadas</h3>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>
              Puedes enviarnos igualmente tus antecedentes mediante nuestra postulación general.
            </p>
            <Link to="/postular" className="btn-postular-modern" style={{ display: 'inline-flex' }}>
              Postulación General <FiArrowRight />
            </Link>
          </div>
        ) : familiasVisibles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <h3>No encontramos vacantes con esos filtros</h3>
            <p style={{ color: '#64748b', marginBottom: '16px' }}>
              Prueba cambiando el texto de búsqueda o seleccionando otra área.
            </p>
            <button
              type="button"
              className="btn-postular-modern"
              style={{ border: 'none', cursor: 'pointer' }}
              onClick={() => {
                setBusqueda('');
                setFamiliaActiva('TODAS');
              }}
            >
              Mostrar todas las vacantes
            </button>
          </div>
        ) : (
          <div className="cargos-grid-modern">
            {familiasVisibles.map(familia => (
              <div key={familia} className="cargo-modern-card">
                <div className="cargo-card-header">
                  <h2>{familia}</h2>
                  <div className="cargo-badge">
                    {ofertasPorFamilia[familia].length}{' '}
                    {ofertasPorFamilia[familia].length === 1 ? 'vacante' : 'vacantes'}
                  </div>
                </div>
                <div className="cargo-card-body">
                  <ul className="cargo-modern-list">
                    {ofertasPorFamilia[familia].map(oferta => (
                      <li key={oferta.id}>
                        <div className="cargo-name">
                          <FiCheckCircle className="check-icon-modern" />
                          <div>
                            <span>{oferta.tituloCargo}</span>
                            <div className="cargo-meta-tags">
                              {oferta.ubicacion && (
                                <span><FiMapPin /> {oferta.ubicacion}</span>
                              )}
                              {oferta.modalidad && (
                                <span><FiBriefcase /> {oferta.modalidad}</span>
                              )}
                              {oferta.rangoSalarial && (
                                <span><FiDollarSign /> {oferta.rangoSalarial}</span>
                              )}
                              {oferta.cuposDisponibles > 0 && (
                                <span>
                                  {oferta.cuposDisponibles}{' '}
                                  {oferta.cuposDisponibles === 1 ? 'cupo' : 'cupos'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="cargo-item-actions">
                          <button
                            type="button"
                            className="btn-ver-detalle-oferta"
                            onClick={() => setOfertaDetalle(oferta)}
                          >
                            <FiEye /> Detalle
                          </button>
                          <Link
                            to={`/postular?familia=${encodeURIComponent(familia)}&cargo=${encodeURIComponent(oferta.tituloCargo)}`}
                            className="btn-postular-modern"
                          >
                            Postular <FiArrowRight />
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL DETALLE COMPLETO DE OFERTA */}
      {ofertaDetalle && (
        <div className="oferta-modal-overlay" onClick={() => setOfertaDetalle(null)}>
          <div className="oferta-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="oferta-modal-close"
              onClick={() => setOfertaDetalle(null)}
              aria-label="Cerrar detalle"
            >
              <FiX />
            </button>

            <span className="oferta-modal-badge">{ofertaDetalle.familiaCargo || 'General'}</span>
            <h2>{ofertaDetalle.tituloCargo}</h2>

            <div className="oferta-modal-meta">
              <span><FiMapPin /> {ofertaDetalle.ubicacion || 'Puerto Montt, Chile'}</span>
              <span><FiBriefcase /> {ofertaDetalle.modalidad || 'Presencial'}</span>
              {ofertaDetalle.rangoSalarial && (
                <span><FiDollarSign /> {ofertaDetalle.rangoSalarial}</span>
              )}
              <span>
                {ofertaDetalle.cuposDisponibles || 1}{' '}
                {(ofertaDetalle.cuposDisponibles || 1) === 1 ? 'cupo disponible' : 'cupos disponibles'}
              </span>
            </div>

            <div className="oferta-modal-sections">
              <div className="oferta-detail-section">
                <h4>Descripción del Cargo</h4>
                <p>{ofertaDetalle.descripcion || 'Sin descripción adicional.'}</p>
              </div>

              {ofertaDetalle.funcionesPrincipales && (
                <div className="oferta-detail-section">
                  <h4>Funciones Principales</h4>
                  <p>{ofertaDetalle.funcionesPrincipales}</p>
                </div>
              )}

              {ofertaDetalle.requisitos && (
                <div className="oferta-detail-section">
                  <h4>Requisitos</h4>
                  <p>{ofertaDetalle.requisitos}</p>
                </div>
              )}

              {ofertaDetalle.beneficios && (
                <div className="oferta-detail-section">
                  <h4>Beneficios</h4>
                  <p>{ofertaDetalle.beneficios}</p>
                </div>
              )}
            </div>

            <div className="oferta-modal-footer">
              <button
                type="button"
                className="btn-cerrar-oferta"
                onClick={() => setOfertaDetalle(null)}
              >
                Cerrar
              </button>
              <Link
                to={`/postular?familia=${encodeURIComponent(ofertaDetalle.familiaCargo || 'General')}&cargo=${encodeURIComponent(ofertaDetalle.tituloCargo)}`}
                className="btn-postular-modern"
              >
                Postular a este cargo <FiArrowRight />
              </Link>
            </div>
          </div>
        </div>
      )}

      <footer className="footer-landing light-footer">
        <p>© AquaChile S.A. — Todos los derechos reservados</p>
      </footer>
    </div>
  );
};

export default CargosDisponibles;