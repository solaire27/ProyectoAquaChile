import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import InicioPublico from './componentes/InicioPublico';
import PostulacionPublica from './componentes/PostulacionPublica';
import DashboardPsicologo from './componentes/DashboardPsicologo';
import Login from './componentes/Login';
import SobreNosotros from './componentes/SobreNosotros';
import CargosDisponibles from './componentes/CargosDisponibles';
import EstadoPostulacion from './componentes/EstadoPostulacion';

// Cambia a false cuando conectes el backend real
const MODO_DISENO_OFFLINE = true;

function App() {
  const [usuario, setUsuario] = useState(
    MODO_DISENO_OFFLINE ? { nombre: 'Psicólogo Demo', correo: 'psicologo@aquachile.com', rol: 'PSICOLOGO' } : null
  );
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

  const estaAutenticado = MODO_DISENO_OFFLINE || usuario || localStorage.getItem('token');

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#0b192c' }}>
      <Routes>
        <Route path="/" element={<InicioPublico />} />
        <Route path="/postular" element={<PostulacionPublica />} />
        <Route path="/sobre-nosotros" element={<SobreNosotros />} />
        <Route path="/cargos" element={<CargosDisponibles />} />
        <Route path="/estado" element={<EstadoPostulacion />} />

        <Route path="/login" element={<Login alAutenticar={manejarAutenticacion} />} />
        <Route
          path="/dashboard"
          element={
            estaAutenticado ? (
              <DashboardPsicologo usuario={usuario} alCerrarSesion={cerrarSesion} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;