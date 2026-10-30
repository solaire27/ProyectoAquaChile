import { useState } from 'react';
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import PostulacionPublica from './componentes/PostulacionPublica';
import DashboardPsicologo from './componentes/DashboardPsicologo';
import Login from './componentes/Login';

function App() {
  const [usuario, setUsuario] = useState(null);
  
  const navigate = useNavigate();

  const manejarAutenticacion = (user) => {
    setUsuario(user);
    navigate('/dashboard'); 
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    setUsuario(null);
    navigate('/login'); 
  };

  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh' }}>
      
      {/* Menú de Navegación Global */}
      <nav style={{
        display: 'flex', 
        justifyContent: 'center', 
        gap: '20px', 
        padding: '15px', 
        backgroundColor: '#1e293b', 
        borderBottom: '1px solid #334155'
      }}>
        {/* Usamos Link en lugar de etiquetas <a> para que la página no recargue */}
        <Link to="/" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 'bold' }}>
          🌐 Sitio Público
        </Link>
        <Link to="/dashboard" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 'bold' }}>
          🔒 Portal Psicólogos
        </Link>
      </nav>

      {/* Definición de las Rutas (Páginas) */}
      <Routes>
        {/* Ruta 1: Portal de Postulación (Cualquiera puede entrar) */}
        <Route path="/" element={<PostulacionPublica />} />

        {/* Ruta 2: Pantalla de Login */}
        <Route path="/login" element={<Login alAutenticar={manejarAutenticacion} />} />

        {/* Ruta 3: Dashboard Kanban (Ruta Protegida) */}
        <Route 
          path="/dashboard" 
          element={
            usuario ? (
              <DashboardPsicologo usuario={usuario} alCerrarSesion={cerrarSesion} />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        {/* Ruta comodín: Si escriben una URL que no existe, los mandamos al inicio */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

    </div>
  );
}

export default App;