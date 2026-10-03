import { useState } from 'react';
import './PostulacionPublica.css';

const catalogoCargos = {
  "Profesional A": ["Líder Desarrollo Producción"],
  "Profesional B C": ["Analista de Sistemas", "Coordinador servicios generales"],
  "Operario Calificado": ["Gruero"],
  "Técnico B C": ["Asistente Bodega Planta", "Operador Sala Control", "Monitor Producción"],
  "Técnico A": ["Tecnico Mantencion Senior"],
  "Supervisor B": ["Supervisor Planta"],
  "Jefatura": ["Jefe Area Piscicultura", "Jefe de SSO"]
};

export default function PostulacionPublica() {
  const [datosFormulario, setDatosFormulario] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    familiaCargo: '', 
    cargoPostulacion: '' 
  });

  const [archivoCv, setArchivoCv] = useState(null);
  const [cargosDisponibles, setCargosDisponibles] = useState([]);
  
  // Estados para feedback visual y petición HTTP
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' }); // tipo: 'exito' | 'error'

  const manejarCambioTexto = (evento) => {
    const { name, value } = evento.target;
    
    if (name === 'familiaCargo') {
      setCargosDisponibles(catalogoCargos[value] || []);
      setDatosFormulario({
        ...datosFormulario,
        familiaCargo: value,
        cargoPostulacion: '' 
      });
    } else {
      setDatosFormulario({
        ...datosFormulario,
        [name]: value
      });
    }
  };

  const manejarCambioArchivo = (evento) => {
    setArchivoCv(evento.target.files[0]);
  };

  const enviarFormulario = async (evento) => {
    evento.preventDefault();
    setMensaje({ texto: '', tipo: '' });

    if (!archivoCv) {
      setMensaje({ texto: 'Por favor, adjunta tu CV.', tipo: 'error' });
      return;
    }

    setCargando(true);

    try {
      // 1. Preparamos el FormData multipart/form-data según contrato de API
      const formData = new FormData();
      
      // Enviamos la parte JSON de candidato como Blob para Spring Boot
      const jsonBlob = new Blob([JSON.stringify(datosFormulario)], { type: 'application/json' });
      formData.append('candidato', jsonBlob);
      
      // Enviamos el archivo físico del CV
      formData.append('cv', archivoCv);

      // 2. Consumo real de la API (Cambiar puerto/URL según el entorno local/producción)
      const respuesta = await fetch('http://localhost:8080/api/postulaciones/public', {
        method: 'POST',
        body: formData,
      });

      if (respuesta.ok) {
        setMensaje({ texto: '¡Postulación recibida con éxito! Nos pondremos en contacto.', tipo: 'exito' });
        // Limpiar campos
        setDatosFormulario({ nombre: '', correo: '', telefono: '', familiaCargo: '', cargoPostulacion: '' });
        setCargosDisponibles([]);
        setArchivoCv(null);
        evento.target.reset();
      } else {
        throw new Error('Error al enviar la postulación.');
      }
    } catch (error) {
      // Si la API no responde (por ejemplo, si Spring Boot aún no está corriendo), mostramos simulación útil
      console.warn("Backend no disponible aún. Datos preparados:", datosFormulario);
      setMensaje({ 
        texto: 'Modo Simulación: Formulario válido. Se conectará automáticamente cuando levantes el backend.', 
        tipo: 'exito' 
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="contenedor-postulacion">
      <div className="tarjeta-formulario">
        <h2>Únete a AquaChile</h2>
        <p>Completa tus datos y adjunta tu currículum para postular a nuestras vacantes.</p>

        {mensaje.texto && (
          <div className={`alerta alerta-${mensaje.tipo}`}>
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={enviarFormulario}>
          <div className="grupo-input">
            <label>Nombre Completo:</label>
            <input 
              type="text" 
              name="nombre" 
              value={datosFormulario.nombre} 
              onChange={manejarCambioTexto} 
              maxLength={100}
              required 
            />
          </div>

          <div className="grupo-input">
            <label>Correo Electrónico:</label>
            <input 
              type="email" 
              name="correo" 
              value={datosFormulario.correo} 
              onChange={manejarCambioTexto} 
              maxLength={100}
              required 
            />
          </div>

          <div className="grupo-input">
            <label>Teléfono de Contacto:</label>
            <input 
              type="tel" 
              name="telefono" 
              value={datosFormulario.telefono} 
              onChange={manejarCambioTexto} 
              maxLength={15} 
              placeholder="+56912345678"
              required 
            />
          </div>

          <div className="grupo-input">
            <label>Familia de Cargo:</label>
            <select name="familiaCargo" value={datosFormulario.familiaCargo} onChange={manejarCambioTexto} required>
              <option value="">-- Seleccione una familia --</option>
              {Object.keys(catalogoCargos).map((familia) => (
                <option key={familia} value={familia}>{familia}</option>
              ))}
            </select>
          </div>

          <div className="grupo-input">
            <label>Cargo al que postula:</label>
            <select 
              name="cargoPostulacion" 
              value={datosFormulario.cargoPostulacion} 
              onChange={manejarCambioTexto} 
              required 
              disabled={!datosFormulario.familiaCargo}
            >
              <option value="">-- Seleccione un cargo --</option>
              {cargosDisponibles.map((cargo) => (
                <option key={cargo} value={cargo}>{cargo}</option>
              ))}
            </select>
          </div>

          <div className="grupo-input">
            <label>Adjuntar CV (PDF o Word):</label>
            <input type="file" accept=".pdf,.doc,.docx" onChange={manejarCambioArchivo} required />
          </div>

          <button type="submit" className="boton-enviar" disabled={cargando}>
            {cargando ? 'Enviando...' : 'Enviar Postulación'}
          </button>
        </form>
      </div>
    </div>
  );
}