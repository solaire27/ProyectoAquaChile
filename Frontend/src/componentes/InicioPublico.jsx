import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiMail, FiUser, FiLock, FiSearch, FiBriefcase, FiPhone, FiMapPin, FiArrowRight } from 'react-icons/fi';
import { FaHandshake } from 'react-icons/fa';
import bgImage from '../assets/pexels-jimmy-10436677.jpg';
import './InicioPublico.css';

const InicioPublico = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);

  const handleScrollContacto = (e) => {
    e.preventDefault();
    const element = document.getElementById('contacto');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.pushState(null, '', '#contacto');
    }
  };

  return (
    <div className="landing-container" style={{ backgroundImage: `url(${bgImage})` }}>
      <header className="navbar-landing">
        <Link to="/" className="logo-section">
          <div className="logo-icon">🌊</div>
          <span className="logo-text">AquaChile</span>
        </Link>
        <nav className="nav-menu">
          <Link to="/cargos" className="nav-item">
            <FiBriefcase className="nav-icon" />
            <span>Cargos</span>
          </Link>
          <Link to="/sobre-nosotros" className="nav-item">
            <FiUser className="nav-icon" />
            <span>Sobre Nosotros</span>
          </Link>
          <a href="#contacto" onClick={handleScrollContacto} className="nav-item">
            <FiMail className="nav-icon" />
            <span>Contacto</span>
          </a>
          <Link to="/login" className="btn-iniciar-sesion">
            <FiLock className="btn-icon" />
            <span>Iniciar Sesión</span>
          </Link>
        </nav>
      </header>

      <main className="hero-section">
        <div className="hero-wrapper">
          <h1 className="hero-title">AquaChile</h1>

          <div className="hero-glass-card">
            <p className="hero-subtitle">
              Compromiso, innovación y excelencia en la acuicultura sostenible desde el sur de Chile hacia el mundo.
            </p>
            
            <div className="hero-actions">
              <Link to="/cargos" className="btn-trabaja-nosotros">
                <FaHandshake className="btn-icon-large" />
                <span>Trabaja Con Nosotros</span>
                <FiArrowRight className="btn-arrow" />
              </Link>
            </div>
          </div>

          <div className="status-check-bar">
            <span className="status-question">¿Ya postulaste con nosotros?</span>
            <Link to="/estado" className="btn-revisa-estado" style={{ textDecoration: 'none' }}>
              <FiSearch className="btn-icon-search" />
              <span>Revisa tu Estado</span>
            </Link>
          </div>
        </div>
      </main>

      <section id="contacto" className="info-section">
        <div className="glass-container contact-glass">
          <h2 className="section-title">Contáctanos</h2>
          <p className="section-desc">Estamos aquí para resolver tus dudas y ayudarte en tu proceso de postulación.</p>
          
          <div className="contact-grid">
            <div className="contact-item">
              <div className="contact-icon-wrapper"><FiPhone /></div>
              <div className="contact-text">
                <h3>Teléfono</h3>
                <p>+56 65 2433500</p>
              </div>
            </div>
            
            <div className="contact-item">
              <div className="contact-icon-wrapper"><FiMapPin /></div>
              <div className="contact-text">
                <h3>Dirección</h3>
                <p>Cardonal S/N, Lote B</p>
                <p className="sub-text">Puerto Montt, Los Lagos</p>
              </div>
            </div>
            
            <div className="contact-item">
              <div className="contact-icon-wrapper"><FiMail /></div>
              <div className="contact-text">
                <h3>Email</h3>
                <p>contacto@aquachile.com</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer-landing">
        <p>© AquaChile S.A. — Todos los derechos reservados</p>
      </footer>
    </div>
  );
};

export default InicioPublico;