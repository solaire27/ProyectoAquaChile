import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiUser, FiMail, FiLock, FiCheckCircle, FiArrowRight } from 'react-icons/fi';
import './CargosDisponibles.css';

const opcionesCargos = {
    Operativo: ['Operario de Planta', 'Asistente de Producción', 'Técnico de Mantenimiento', 'Operario de Grúa'],
    Administrativo: ['Asistente Administrativo', 'Analista Contable', 'Recepcionista', 'Ejecutivo de RRHH'],
    Jefatura: ['Jefe de Turno', 'Jefe de Planta', 'Supervisor de Área', 'Jefe de Logística'],
    Gerencia: ['Gerente de Operaciones', 'Gerente Comercial', 'Gerente de Finanzas']
};

const CargosDisponibles = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="cargos-page-container">
      <header className="navbar-landing dark-nav">
        {/* LOGO ACTUALIZADO */}
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
        <div className="cargos-grid-modern">
          {Object.keys(opcionesCargos).map(familia => (
            <div key={familia} className="cargo-modern-card">
              <div className="cargo-card-header">
                <h2>{familia}</h2>
                <div className="cargo-badge">{opcionesCargos[familia].length} vacantes</div>
              </div>
              <div className="cargo-card-body">
                <ul className="cargo-modern-list">
                  {opcionesCargos[familia].map(cargo => (
                    <li key={cargo}>
                      <div className="cargo-name">
                        <FiCheckCircle className="check-icon-modern"/> 
                        <span>{cargo}</span>
                      </div>
                      <Link 
                        to={`/postular?familia=${encodeURIComponent(familia)}&cargo=${encodeURIComponent(cargo)}`} 
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
      </main>

      <footer className="footer-landing light-footer">
        <p>© AquaChile S.A. — Todos los derechos reservados</p>
      </footer>
    </div>
  );
};

export default CargosDisponibles;