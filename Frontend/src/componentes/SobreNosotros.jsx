import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiBriefcase, FiMail, FiLock, FiTarget, FiEye, FiAward } from 'react-icons/fi';
import './SobreNosotros.css';

const SobreNosotros = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="sobre-nosotros-page">
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
          <Link to="/cargos" className="nav-item">
            <FiBriefcase className="nav-icon" />
            <span>Cargos</span>
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

      <section className="about-hero">
        <div className="about-hero-content">
          <h1>Quiénes Somos</h1>
          <p>Orgullosos de nuestras raíces en el sur de Chile, llevando lo mejor de la Patagonia al mundo.</p>
        </div>
      </section>

      <main className="about-main">
        <div className="about-card main-about-card">
          <h2>Nuestra Empresa</h2>
          <p>
            Somos una empresa nacida y comprometida con el sur de Chile. Como resultado de la integración de 
            AquaChile, Los Fiordos, Salmones Magallanes y Friosur, nos hemos consolidado como la empresa productora 
            más grande en Chile y la segunda a nivel mundial en la industria del salmón.
          </p>
          <p>
            Nos caracteriza nuestro espíritu emprendedor, la sencillez, la austeridad y la pasión que ponemos en cada 
            detalle. Actualmente contamos con 320 concesiones, 15 pisciculturas, 6 plantas de proceso y nuestra propia 
            planta de alimentos.
          </p>
        </div>

        <div className="about-grid">
          <div className="about-card grid-card">
            <div className="card-icon-wrapper mission-icon">
              <FiTarget />
            </div>
            <h3>Nuestra Misión</h3>
            <p>Alimentar de forma rica y saludable a millones de personas en todo el mundo, cuidando el entorno y nuestras comunidades.</p>
          </div>
          
          <div className="about-card grid-card">
            <div className="card-icon-wrapper vision-icon">
              <FiEye />
            </div>
            <h3>Nuestra Visión</h3>
            <p>Ser un referente global en acuicultura sostenible, destacando por la calidad de nuestros productos y nuestra eficiencia operativa.</p>
          </div>

          <div className="about-card grid-card">
            <div className="card-icon-wrapper values-icon">
              <FiAward />
            </div>
            <h3>Nuestros Valores</h3>
            <p>Compromiso, excelencia, trabajo en equipo, respeto por el medio ambiente e integridad en cada paso de nuestro proceso productivo.</p>
          </div>
        </div>
      </main>

      <footer className="footer-landing light-footer">
        <p>© AquaChile S.A. — Todos los derechos reservados</p>
      </footer>
    </div>
  );
};

export default SobreNosotros;