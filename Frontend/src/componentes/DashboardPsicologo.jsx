import { useState } from 'react';
import './DashboardPsicologo.css';

// Datos simulados iniciales (Estructura alineada con el contrato JSON de Spring Boot)
const solicitudesIniciales = [
  {
    id: 101,
    candidato: "Juan Pérez",
    cargo: "Analista de Sistemas",
    familiaCargo: "Profesional B C",
    fechaSolicitud: "2026-09-25",
    estado: "NUEVA_POSTULACION",
    responsable: "Sin asignar",
    observaciones: "Postulación pública vía web"
  },
  {
    id: 102,
    candidato: "María Victoria Bustamante",
    cargo: "Líder Desarrollo Producción",
    familiaCargo: "Profesional A",
    fechaSolicitud: "2026-09-20",
    estado: "ENTREVISTA_AGENDADA",
    responsable: "María Victoria B.",
    fechaEntrevista: "09/10 a las 10:00",
    observaciones: "Entrevista coordinada"
  },
  {
    id: 103,
    candidato: "Carlos Muñoz",
    cargo: "Operador Sala Control",
    familiaCargo: "Técnico B C",
    fechaSolicitud: "2026-09-22",
    estado: "ENTREVISTA_REALIZADA",
    responsable: "Juan Rebolledo",
    fechaEntrevista: "09/10 a las 12:30",
    observaciones: "Pendiente redactar informe final"
  },
  {
    id: 104,
    candidato: "Ana Silva",
    cargo: "Jefe de SSO",
    familiaCargo: "Jefatura",
    fechaSolicitud: "2026-09-15",
    estado: "INFORME_ENVIADO",
    responsable: "María Victoria B.",
    observaciones: "Candidato Recomendado"
  }
];

export default function DashboardPsicologo() {
  const [solicitudes, setSolicitudes] = useState(solicitudesIniciales);
  const [filtroTexto, setFiltroTexto] = useState('');

  // Definición de las columnas del Kanban basadas en Planner
  const columnas = [
    { id: 'NUEVA_POSTULACION', titulo: 'Evaluación Recibida', colorBarra: '#6c757d' },
    { id: 'ENTREVISTA_AGENDADA', titulo: 'Entrevista Agendada', colorBarra: '#0d6efd' },
    { id: 'ENTREVISTA_REALIZADA', titulo: 'Entrevista Realizada', colorBarra: '#fd7e14' },
    { id: 'INFORME_ENVIADO', titulo: 'Informe Enviado', colorBarra: '#198754' }
  ];

  // Función para mover una tarjeta al siguiente estado
  const avanzarEstado = (idSolicitud, estadoActual) => {
    const ordenEstados = ['NUEVA_POSTULACION', 'ENTREVISTA_AGENDADA', 'ENTREVISTA_REALIZADA', 'INFORME_ENVIADO'];
    const indiceActual = ordenEstados.indexOf(estadoActual);
    
    if (indiceActual < ordenEstados.length - 1) {
      const nuevoEstado = ordenEstados[indiceActual + 1];
      
      setSolicitudes(solicitudes.map(sol => {
        if (sol.id === idSolicitud) {
          return { ...sol, estado: nuevoEstado };
        }
        return sol;
      }));
    }
  };

  // Filtrar solicitudes por nombre de candidato o cargo
  const solicitudesFiltradas = solicitudes.filter(sol => 
    sol.candidato.toLowerCase().includes(filtroTexto.toLowerCase()) ||
    sol.cargo.toLowerCase().includes(filtroTexto.toLowerCase())
  );

  return (
    <div className="contenedor-dashboard">
        <header className="encabezado-dashboard">
            <div>
                <h1>Status Evaluaciones</h1>
                <p className="subtitulo">Gestión de procesos psicolaborales AquaChile</p>
            </div>

            <div className="usuario-info-bar">
                <div className="buscador">
                <input 
                    type="text" 
                    placeholder="Buscar candidato o cargo..." 
                    value={filtroTexto}
                    onChange={(e) => setFiltroTexto(e.target.value)}
                />
            </div>
            {usuario && <span className="user-tag">👤 {usuario.nombre}</span>}
            <button className="btn-cerrar-sesion" onClick={alCerrarSesion}>Salir</button>
        </div>
    </header>

      {/* Tablero Kanban por columnas */}
      <div className="tablero-kanban">
        {columnas.map(col => {
          const itemsColumna = solicitudesFiltradas.filter(s => s.estado === col.id);

          return (
            <div key={col.id} className="columna-kanban">
              <div className="columna-header" style={{ borderTopColor: col.colorBarra }}>
                <h3>{col.titulo}</h3>
                <span className="contador-badge">{itemsColumna.length}</span>
              </div>

              <div className="columna-body">
                {itemsColumna.length === 0 ? (
                  <p className="sin-tarjetas">Sin solicitudes</p>
                ) : (
                  itemsColumna.map(sol => (
                    <div key={sol.id} className="tarjeta-candidato">
                      <div className="tarjeta-header">
                        <span className="familia-tag">{sol.familiaCargo}</span>
                        <small>{sol.fechaSolicitud}</small>
                      </div>

                      <h4>{sol.candidato}</h4>
                      <p className="cargo-texto"><strong>Cargo:</strong> {sol.cargo}</p>
                      
                      {sol.fechaEntrevista && (
                        <p className="entrevista-fecha">📅 {sol.fechaEntrevista}</p>
                      )}

                      <p className="observacion-corta">{sol.observaciones}</p>

                      <div className="tarjeta-footer">
                        <span className="responsable-tag">👤 {sol.responsable}</span>
                        
                        {col.id !== 'INFORME_ENVIADO' && (
                          <button 
                            className="btn-avanzar"
                            onClick={() => avanzarEstado(sol.id, sol.estado)}
                            title="Avanzar al siguiente estado"
                          >
                            Avanzar →
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}