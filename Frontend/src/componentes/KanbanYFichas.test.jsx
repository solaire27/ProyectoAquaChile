import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardPsicologo from './DashboardPsicologo';
import InicioPublico from './InicioPublico';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }
}));

const hoyIso = new Date().toISOString();
const solicitudesMock = [
  { id: 101, nombreCandidato: 'Ana Torres', cargo: 'Desarrollador Java', familiaCargo: 'TI', estado: 'NUEVA_POSTULACION', fechaSolicitud: hoyIso, urlCv: 'cv/ana.pdf', observaciones: 'Spring Boot' },
  { id: 102, nombreCandidato: 'Carlos Ruiz', cargo: 'Operario de Planta', familiaCargo: 'Operativo', estado: 'PENDIENTE', responsableId: 1, nombreResponsable: 'Admin Aqua', fechaSolicitud: hoyIso, recomendacionIa: 'Puntaje: 8.5/10. Excelente.', urlCv: 'cv/carlos.pdf' },
  { id: 103, nombreCandidato: 'Elena Gómez', cargo: 'Analista Contable', familiaCargo: 'Administrativo', estado: 'EN_PROCESO', responsableId: 1, nombreResponsable: 'Admin Aqua', fechaSolicitud: hoyIso, fechaEntrevista: hoyIso, duracionEntrevistaMinutos: 45, modalidadEntrevista: 'Online', notasEntrevista: 'Link Meet', recomendacionIa: 'Error al conectar' },
  { id: 104, nombreCandidato: 'Luis Pinto', cargo: 'Jefe de Turno', familiaCargo: 'Jefatura', estado: 'FINALIZADA', responsableId: 1, nombreResponsable: 'Admin Aqua', fechaSolicitud: hoyIso, resultadoEvaluacion: 'Apto', observacionEvaluacion: 'OK', recomendacionIa: '9/10' }
];

const metricasMock = {
  totalPsicologos: 1, totalAsignadasPsicologos: 3, sinAsignar: 1, promedioDiasEquipo: 2.5,
  psicologos: [{ psicologoId: 1, nombre: 'Admin Aqua', correo: 'admin@aquachile.cl', totalAsignadas: 3, pendientes: 1, enEvaluacion: 1, finalizadas: 1, tasaFinalizacion: 33, aptos: 1, aptosConObservaciones: 0, noAptos: 0, promedioDiasResolucion: 2.5 }]
};

describe('Cobertura extendida Dashboard, Kanban, Ofertas, Bandeja e Inicio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
    window.scrollTo = vi.fn();
    window.open = vi.fn(() => ({ document: { write: vi.fn(), close: vi.fn() }, focus: vi.fn(), print: vi.fn() }));
    window.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/cv');
    window.URL.revokeObjectURL = vi.fn();

    api.get.mockImplementation((url) => {
      if (url === '/solicitudes') return Promise.resolve({ data: solicitudesMock });
      if (url === '/metricas/psicologos') return Promise.resolve({ data: metricasMock });
      if (url === '/ofertas') return Promise.resolve({ data: [{ id: 50, tituloCargo: 'Soporte TI', familiaCargo: 'TI', ubicacion: 'Puerto Montt', modalidad: 'Presencial', cuposDisponibles: 2, estadoActivo: true, descripcion: 'Soporte' }] });
      if (url === '/candidatos') return Promise.resolve({ data: [{ id: 70, nombre: 'Ana Torres', rut: '19111222-3', correo: 'ana@test.cl', telefono: '+56911112222', fechaNacimiento: '1995-03-10', familiaCargo: 'TI', cargoPostulacion: 'Desarrollador Java' }] });
      if (url.includes('/cv')) return Promise.resolve({ data: new Blob(['pdf']) });
      return Promise.resolve({ data: [] });
    });
  });

  const adminUser = { id: 1, nombre: 'Admin Aqua', correo: 'admin@aquachile.cl', rol: 'ADMIN' };

  it('cubre drag and drop en Kanban, filtros por fecha/area, evaluar/finalizar, exportar PDF y eliminar', async () => {
    const user = userEvent.setup();
    api.patch.mockResolvedValue({ data: solicitudesMock[1] });
    api.post.mockResolvedValue({ data: solicitudesMock[2] });
    api.delete.mockResolvedValue({ data: {} });

    render(<MemoryRouter><DashboardPsicologo usuario={adminUser} alCerrarSesion={vi.fn()} /></MemoryRouter>);
    await screen.findByText(/Panel de Control de Selección/i);

    await user.click(screen.getAllByRole('button', { name: /Tablero Kanban/i })[0]);

    // Filtros en Kanban
    await user.click(screen.getByRole('button', { name: /^Hoy$/i }));
    await user.click(screen.getByRole('button', { name: /Operativo/i }));
    await user.click(screen.getByRole('button', { name: /Limpiar filtros/i }));

    // Drag & drop de tarjeta hacia Finalizadas
    const tarjeta = screen.getByText('Carlos Ruiz').closest('.trello-card');
    const columnaFinalizadas = screen.getByText('Finalizadas').closest('.trello-list');
    const dt = { data: {}, setData(k, v) { this.data[k] = v; }, getData(k) { return this.data[k]; } };
    fireEvent.dragStart(tarjeta, { dataTransfer: dt });
    fireEvent.dragOver(columnaFinalizadas, { dataTransfer: dt });
    fireEvent.drop(columnaFinalizadas, { dataTransfer: dt });

    expect(await screen.findByText(/¿Finalizar proceso del candidato?/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Continuar y Evaluar/i }));
    await user.type(screen.getByPlaceholderText(/Escribe las fortalezas/i), 'Excelente desempeño');
    await user.click(screen.getByRole('button', { name: /Guardar y Finalizar/i }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/evaluaciones', expect.any(Object)));

    // Abrir ficha con error IA, reintentar IA, exportar PDF y eliminar solicitud
    await user.click(screen.getByText('Elena Gómez'));
    await user.click(screen.getByRole('button', { name: /Reintentar análisis/i }));
    await user.click(screen.getByRole('button', { name: /Exportar Ficha PDF/i }));
    await user.click(screen.getByRole('button', { name: /Eliminar Solicitud/i }));
    await user.click(screen.getByRole('button', { name: /Sí, Eliminar/i }));
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/solicitudes/103'));
  });

  it('cubre filtros en BandejaPostulaciones y acciones en GestionOfertas', async () => {
    const user = userEvent.setup();
    api.patch.mockResolvedValue({ data: {} });
    api.put.mockResolvedValue({ data: {} });
    api.delete.mockResolvedValue({ data: {} });

    render(<MemoryRouter><DashboardPsicologo usuario={adminUser} alCerrarSesion={vi.fn()} /></MemoryRouter>);
    await screen.findByText(/Panel de Control de Selección/i);

    // Bandeja: busqueda, fecha, area y limpiar
    await user.click(screen.getByRole('button', { name: /Bandeja sin Asignar/i }));
    await user.type(screen.getByPlaceholderText(/Buscar por nombre, cargo/i), 'Ana');
    await user.click(screen.getByRole('button', { name: /^Hoy$/i }));
    await user.click(screen.getByRole('button', { name: /Limpiar filtros/i }));

    // GestionOfertas: editar, cambiar estado y eliminar
    await user.click(screen.getByRole('button', { name: /Gestión de Ofertas/i }));
    await screen.findByText('Soporte TI');
    await user.click(screen.getByRole('button', { name: /Activa/i }));
    await user.click(screen.getByRole('button', { name: /Editar/i }));
    await user.click(screen.getByRole('button', { name: /Guardar Cambios/i }));
    await waitFor(() => expect(api.put).toHaveBeenCalled());
  });

  it('cubre InicioPublico y navegacion a contacto', async () => {
    const user = userEvent.setup();
    window.history.pushState = vi.fn();
    render(<MemoryRouter initialEntries={['/#contacto']}><InicioPublico /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: /AquaChile/i })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /Contacto/i }));
  });
});
