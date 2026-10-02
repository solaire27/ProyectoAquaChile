import { useState } from 'react';
import './Login.css';

export default function Login({ alAutenticar }) {
  const [credenciales, setCredenciales] = useState({
    correo: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const manejarCambio = (e) => {
    setCredenciales({
      ...credenciales,
      [e.target.name]: e.target.value
    });
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      // Simulación de respuesta REST JWT de Spring Boot
      if (credenciales.correo && credenciales.password) {
        // En producción: await fetch('http://localhost:8080/api/auth/login', ...)
        const usuarioSimulado = {
          nombre: "María Victoria Bustamante",
          correo: credenciales.correo,
          rol: "EVALUADOR",
          token: "fake-jwt-token-xyz-123"
        };
        
        localStorage.setItem('token', usuarioSimulado.token);
        alAutenticar(usuarioSimulado);
      } else {
        setError('Por favor completa todos los campos.');
      }
    } catch (err) {
      setError('Credenciales inválidas o servidor no disponible.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="contenedor-login">
      <div className="tarjeta-login">
        <div className="login-header">
          <div className="logo-badge">AquaChile</div>
          <h2>Portal Psicolaboral</h2>
          <p>Ingresa con tus credenciales de evaluador</p>
        </div>

        {error && <div className="alerta-error-dark">{error}</div>}

        <form onSubmit={manejarSubmit}>
          <div className="grupo-input-dark">
            <label>Correo Institucional</label>
            <input 
              type="email" 
              name="correo" 
              placeholder="ejemplo@aquachile.com"
              value={credenciales.correo} 
              onChange={manejarCambio} 
              required 
            />
          </div>

          <div className="grupo-input-dark">
            <label>Contraseña</label>
            <input 
              type="password" 
              name="password" 
              placeholder="••••••••"
              value={credenciales.password} 
              onChange={manejarCambio} 
              required 
            />
          </div>

          <button type="submit" className="boton-login" disabled={cargando}>
            {cargando ? 'Iniciando Sesión...' : 'Ingresar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}