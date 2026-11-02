import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import InicioPublico from './componentes/InicioPublico';
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

  // Validamos si hay usuario en el estado O si existe un token guardado
  const estaAutenticado = usuario || localStorage.getItem('token');

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#0b192c' }}>
      <Routes>
        <Route path="/" element={<InicioPublico />} />
        <Route path="/postular" element={<PostulacionPublica />} />
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