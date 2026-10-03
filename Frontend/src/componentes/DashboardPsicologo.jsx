import { useState } from 'react';
import './DashboardPsicologo.css';

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

export default function DashboardPsicologo({ usuario, alCerrarSesion }) {
  const [solicitudes, setSolicitudes] = useState(solicitudesIniciales);
  const [filtroTexto, setFiltroTexto] = useState('');
  
  // Estado para saber visualmente qué columna está recibiendo la tarjeta
  const [columnaActiva, setColumnaActiva] = useState(null);

  const columnas = [
    { id: 'NUEVA_POSTULACION', titulo: 'Evaluación Recibida', colorBarra: '#6c757d' },
    { id: 'ENTREVISTA_AGENDADA', titulo: 'Entrevista Agendada', colorBarra: '#0284c7' },
    { id: 'ENTREVISTA_REALIZADA', titulo: 'Entrevista Realizada', colorBarra: '#f97316' },
    { id: 'INFORME_ENVIADO', titulo: 'Informe Enviado', colorBarra: '#10b981' }
  ];

  // --- LÓGICA DRAG AND DROP ---
  
  const manejarDragStart = (e, idSolicitud) => {
    // Guardamos el ID de la tarjeta que se está arrastrando
    e.dataTransfer.setData('idSolicitud', idSolicitud);
    // Efecto visual al arrastrar
    setTimeout(() => {
      e.target.classList.add('oculto-al-arrastrar');
    }, 0);
  };

  const manejarDragEnd = (e) => {
    e.target.classList.remove('oculto-al-arrastrar');
    setColumnaActiva(null);
  };

  const manejarDragOver = (e, idColumna) => {
    e.preventDefault(); // Necesario para permitir el "Drop"
    setColumnaActiva(idColumna);
  };

  const manejarDragLeave = () => {
    setColumnaActiva(null);
  };

  const manejarDrop = (e, nuevoEstado) => {
    e.preventDefault();
    const idSolicitud = parseInt(e.dataTransfer.getData('idSolicitud'));
    
    // Actualizamos el estado de la solicitud para moverla de columna
    setSolicitudes(solicitudes.map(sol => {
      if (sol.id === idSolicitud) {
        return { ...sol, estado: nuevoEstado };
      }
      return sol;
    }));
    
    setColumnaActiva(null);
  };

  // -----------------------------

  const solicitudesFiltradas = solicitudes.filter(sol => 
    sol.candidato.toLowerCase().includes(filtroTexto.toLowerCase()) ||
    sol.cargo.toLowerCase().includes(filtroTexto.toLowerCase())
  );

  return (
    <div className="contenedor-dashboard">
      <header className="encabezado-dashboard">
        <div>
          <h1>Status Evaluaciones</h1>
          <p className="subtitulo">Gestión interactiva de procesos</p>
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

      <div className="tablero-kanban">
        {columnas.map(col => {
          const itemsColumna = solicitudesFiltradas.filter(s => s.estado === col.id);
          const esZonaActiva = columnaActiva === col.id;

          return (
            <div 
              key={col.id} 
              className={`columna-kanban ${esZonaActiva ? 'columna-activa' : ''}`}
              onDragOver={(e) => manejarDragOver(e, col.id)}
              onDragLeave={manejarDragLeave}
              onDrop={(e) => manejarDrop(e, col.id)}
            >
              <div className="columna-header" style={{ borderTopColor: col.colorBarra }}>
                <h3>{col.titulo}</h3>
                <span className="contador-badge">{itemsColumna.length}</span>
              </div>

              <div className="columna-body">
                {itemsColumna.length === 0 ? (
                  <p className="sin-tarjetas">Arrastra una tarjeta aquí</p>
                ) : (
                  itemsColumna.map(sol => (
                    <div 
                      key={sol.id} 
                      className="tarjeta-candidato trello-card"
                      draggable="true"
                      onDragStart={(e) => manejarDragStart(e, sol.id)}
                      onDragEnd={manejarDragEnd}
                    >
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