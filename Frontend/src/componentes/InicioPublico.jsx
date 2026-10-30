import React from 'react';
import { Link } from 'react-router-dom';
import './InicioPublico.css';

const InicioPublico = () => {
  return (
    <div className="landing-container">
      {/* Barra superior */}
      <header className="navbar-landing">
        <div className="logo-section">
          <span className="logo-text">AquaChile</span>
        </div>

        <nav className="nav-menu">
          <a href="#contacto" className="nav-item">Contáctanos</a>
          <a href="#sobre-nosotros" className="nav-item">Sobre Nosotros</a>
          <Link to="/login" className="btn-iniciar-sesion">Iniciar Sesión</Link>
        </nav>
      </header>

      {/* Contenido principal Hero */}
      <main className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">AquaChile</h1>
          <p className="hero-subtitle">
            Líderes en acuicultura sostenible. Comprometidos con el desarrollo de nuestro equipo.
          </p>

          <div className="primary-action">
            <Link to="/postular" className="btn-trabaja-nosotros">
              Trabaja Con Nosotros
            </Link>
          </div>

          <div className="secondary-section">
            <p className="dudas-label">¿Tienes dudas con tu postulación?</p>
            <div className="btn-group">
              <Link to="/postular" className="btn-secondary">
                Ver cargos disponibles
              </Link>
              <Link to="/login" className="btn-secondary">
                Revisa el Estado
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer-landing">
        <p>© AquaChile S.A. — Todos los derechos reservados</p>
      </footer>
    </div>
  );
};

export default InicioPublico;