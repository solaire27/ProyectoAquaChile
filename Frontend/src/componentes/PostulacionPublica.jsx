import { useState } from 'react';
import './PostulacionPublica.css';

// Simulamos la base de datos de cargos basada en la tabla de Excel
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
  
  // Estado derivado: Lista de cargos disponibles según la familia seleccionada
  const [cargosDisponibles, setCargosDisponibles] = useState([]);

  const manejarCambioTexto = (evento) => {
    const { name, value } = evento.target;
    
    // Si el usuario cambia la Familia de Cargo, actualizamos la lista de cargos
    if (name === 'familiaCargo') {
      setCargosDisponibles(catalogoCargos[value] || []);
      // Reseteamos el cargo seleccionado porque la familia cambió
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

  const enviarFormulario = (evento) => {
    evento.preventDefault();
    console.log("Datos a enviar:", datosFormulario);
    console.log("Archivo CV:", archivoCv);
    alert("¡Postulación enviada exitosamente!");
    
    setDatosFormulario({ nombre: '', correo: '', telefono: '', familiaCargo: '', cargoPostulacion: '' });
    setCargosDisponibles([]);
    setArchivoCv(null);
    evento.target.reset();
  };

  return (
    <div className="contenedor-postulacion">
      <div className="tarjeta-formulario">
        <h2>Únete a AquaChile</h2>
        <p>Completa tus datos y adjunta tu currículum para postular a nuestras vacantes.</p>

        <form onSubmit={enviarFormulario}>
          {/* Campos de texto normales */}
          <div className="grupo-input">
            <label>Nombre Completo:</label>
            <input type="text" name="nombre" value={datosFormulario.nombre} onChange={manejarCambioTexto} required />
          </div>

          <div className="grupo-input">
            <label>Correo Electrónico:</label>
            <input type="email" name="correo" value={datosFormulario.correo} onChange={manejarCambioTexto} required />
          </div>

          <div className="grupo-input">
            <label>Teléfono de Contacto:</label>
            <input type="tel" name="telefono" value={datosFormulario.telefono} onChange={manejarCambioTexto} required />
          </div>

          {/* Select: Familia de Cargo */}
          <div className="grupo-input">
            <label>Familia de Cargo:</label>
            <select name="familiaCargo" value={datosFormulario.familiaCargo} onChange={manejarCambioTexto} required>
              <option value="">-- Seleccione una familia --</option>
              {Object.keys(catalogoCargos).map((familia) => (
                <option key={familia} value={familia}>{familia}</option>
              ))}
            </select>
          </div>

          {/* Select: Cargo (Dependiente) */}
          <div className="grupo-input">
            <label>Cargo al que postula:</label>
            <select name="cargoPostulacion" value={datosFormulario.cargoPostulacion} onChange={manejarCambioTexto} required disabled={!datosFormulario.familiaCargo}>
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

          <button type="submit" className="boton-enviar">Enviar Postulación</button>
        </form>
      </div>
    </div>
  );
}