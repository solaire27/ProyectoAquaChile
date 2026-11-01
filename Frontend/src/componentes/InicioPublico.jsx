import React from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiUser, FiLock, FiList, FiSearch } from 'react-icons/fi';
import { FaHandshake } from 'react-icons/fa';
// Importamos la nueva imagen
import bgImage from '../assets/pexels-jimmy-10436677.jpg';
import './InicioPublico.css';

const InicioPublico = () => {
  return (
    <div className="landing-container" style={{ backgroundImage: `url(${bgImage})` }}>
      {/* Barra superior flotante */}
      <header className="navbar-landing">
        <div className="logo-section">
          <div className="logo-icon">🌊</div>
          <span className="logo-text">AquaChile</span>
        </div>

        <nav className="nav-menu">
          <a href="#contacto" className="nav-item">
            <FiMail className="nav-icon" />
            <span>Contáctanos</span>
            <div className="nav-waves">≈≈≈</div>
          </a>
          <a href="#sobre-nosotros" className="nav-item">
            <FiUser className="nav-icon" />
            <span>Sobre Nosotros</span>
            <div className="nav-waves">≈≈≈</div>
          </a>
          <Link to="/login" className="btn-iniciar-sesion">
            <FiLock className="btn-icon" />
            <span>Iniciar Sesión</span>
          </Link>
        </nav>
      </header>

      {/* Contenido principal */}
      <main className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">AquaChile</h1>
          <p className="hero-subtitle">
            Compromiso y excelencia en la acuicultura sostenible.
          </p>

          <div className="primary-action">
            <Link to="/postular" className="btn-trabaja-nosotros">
              <FaHandshake className="btn-icon-large" /> Trabaja Con Nosotros
            </Link>
          </div>

          <div className="secondary-section">
            <p className="dudas-label">¿Tienes dudas con tu postulación?</p>
            <div className="btn-group">
              <Link to="/postular" className="btn-secondary">
                <FiList className="btn-icon-dark" /> Ver cargos disponibles
              </Link>
              <Link to="/login" className="btn-secondary">
                <FiSearch className="btn-icon-dark" /> Revisa el Estado
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer restaurado al original */}
      <footer className="footer-landing">
        <p>© AquaChile S.A. — Todos los derechos reservados</p>
      </footer>
    </div>
  );
};

export default InicioPublico;