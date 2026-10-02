import { useState } from 'react';
import PostulacionPublica from './componentes/PostulacionPublica';
import DashboardPsicologo from './componentes/DashboardPsicologo';
import Login from './componentes/Login';

function App() {
  // Selector de aplicación: 'publica' | 'psicologos'
  const [moduloActual, setModuloActual] = useState('publica');
  
  // Estado de autenticación para el portal de psicólogos
  const [usuario, setUsuario] = useState(null);

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    setUsuario(null);
  };

  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh' }}>
      {/* Selector superior para alternar entre las 2 aplicaciones independientes */}
      <div style={{
        display: 'flex', 
        justifyContent: 'center', 
        gap: '10px', 
        padding: '12px', 
        backgroundColor: '#1e293b', 
        borderBottom: '1px solid #334155'
      }}>
        <button 
          onClick={() => setModuloActual('publica')}
          style={{
            padding: '8px 16px',
            backgroundColor: moduloActual === 'publica' ? '#38bdf8' : '#0f172a',
            color: moduloActual === 'publica' ? '#0f172a' : '#94a3b8',
            border: '1px solid #334155',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          🌐 Sitio Público (Postulación)
        </button>

        <button 
          onClick={() => setModuloActual('psicologos')}
          style={{
            padding: '8px 16px',
            backgroundColor: moduloActual === 'psicologos' ? '#38bdf8' : '#0f172a',
            color: moduloActual === 'psicologos' ? '#0f172a' : '#94a3b8',
            border: '1px solid #334155',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          🔒 Portal Psicólogos (Interno)
        </button>
      </div>

      {/* Renderizado de Módulos */}
      {moduloActual === 'publica' ? (
        <PostulacionPublica />
      ) : (
        /* Si está en el módulo de Psicólogos, exige Login */
        !usuario ? (
          <Login alAutenticar={(user) => setUsuario(user)} />
        ) : (
          <DashboardPsicologo usuario={usuario} alCerrarSesion={cerrarSesion} />
        )
      )}
    </div>
  );
}

export default App;