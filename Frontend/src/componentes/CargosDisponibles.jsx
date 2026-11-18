import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiUser, FiMail, FiLock, FiCheckCircle, FiArrowRight } from 'react-icons/fi';
import api from '../services/api';
import './CargosDisponibles.css';

const CargosDisponibles = () => {
  const [ofertasPorFamilia, setOfertasPorFamilia] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);

    const cargarOfertasPublicas = async () => {
      try {
        const { data } = await api.get('/ofertas/public');
        const lista = Array.isArray(data) ? data : [];

        const agrupadas = lista.reduce((acc, oferta) => {
          const familia = oferta.familiaCargo || 'General';
          if (!acc[familia]) acc[familia] = [];
          acc[familia].push(oferta);
          return acc;
        }, {});

        setOfertasPorFamilia(agrupadas);
      } catch (err) {
        console.error('Error al cargar ofertas públicas:', err);
        setError('No pudimos cargar las oportunidades laborales en este momento.');
      } finally {
        setCargando(false);
      }
    };

    cargarOfertasPublicas();
  }, []);

  const familias = Object.keys(ofertasPorFamilia);

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
        {cargando ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
            Cargando oportunidades laborales...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#dc2626' }}>
            {error}
          </div>
        ) : familias.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <h3>Actualmente no hay vacantes publicadas</h3>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>
              Puedes enviarnos igualmente tus antecedentes mediante nuestra postulación general.
            </p>
            <Link to="/postular" className="btn-postular-modern" style={{ display: 'inline-flex' }}>
              Postulación General <FiArrowRight />
            </Link>
          </div>
        ) : (
          <div className="cargos-grid-modern">
            {familias.map(familia => (
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
                            {oferta.cuposDisponibles > 0 && (
                              <small style={{ display: 'block', color: '#64748b', fontSize: '12px' }}>
                                {oferta.cuposDisponibles}{' '}
                                {oferta.cuposDisponibles === 1 ? 'cupo disponible' : 'cupos disponibles'}
                              </small>
                            )}
                          </div>
                        </div>
                        <Link
                          to={`/postular?familia=${encodeURIComponent(familia)}&cargo=${encodeURIComponent(oferta.tituloCargo)}`}
                          className="btn-postular-modern"
                        >
                          Postular <FiArrowRight />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="footer-landing light-footer">
        <p>© AquaChile S.A. — Todos los derechos reservados</p>
      </footer>
    </div>
  );
};

export default CargosDisponibles;