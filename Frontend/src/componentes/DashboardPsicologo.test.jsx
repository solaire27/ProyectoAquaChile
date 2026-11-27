import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardPsicologo from './DashboardPsicologo';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }
}));

const solicitudesMock = [
  { id: 101, nombreCandidato: 'Ana Torres', cargo: 'Desarrollador Java', familiaCargo: 'TI', estado: 'NUEVA_POSTULACION', fechaSolicitud: new Date().toISOString(), urlCv: 'cv/ana.pdf', observaciones: 'Spring Boot' },
  { id: 102, nombreCandidato: 'Carlos Ruiz', cargo: 'Operario de Planta', familiaCargo: 'Operativo', estado: 'PENDIENTE', responsableId: 1, nombreResponsable: 'Admin Aqua', fechaSolicitud: new Date().toISOString(), recomendacionIa: 'Puntaje: 8.5/10. Excelente.', urlCv: 'cv/carlos.pdf' },
  { id: 103, nombreCandidato: 'Elena Gómez', cargo: 'Analista Contable', familiaCargo: 'Administrativo', estado: 'EN_PROCESO', responsableId: 1, nombreResponsable: 'Admin Aqua', fechaSolicitud: new Date().toISOString(), fechaEntrevista: new Date().toISOString(), duracionEntrevistaMinutos: 45, modalidadEntrevista: 'Online', recomendacionIa: 'Error al conectar' },
  { id: 104, nombreCandidato: 'Luis Pinto', cargo: 'Jefe de Turno', familiaCargo: 'Jefatura', estado: 'FINALIZADA', responsableId: 1, nombreResponsable: 'Admin Aqua', fechaSolicitud: new Date().toISOString(), resultadoEvaluacion: 'Apto', observacionEvaluacion: 'OK', recomendacionIa: '9/10' }
];

const metricasMock = {
  totalPsicologos: 1, totalAsignadasPsicologos: 3, sinAsignar: 1, promedioDiasEquipo: 2.5,
  psicologos: [{ psicologoId: 1, nombre: 'Admin Aqua', correo: 'admin@aquachile.cl', totalAsignadas: 3, pendientes: 1, enEvaluacion: 1, finalizadas: 1, tasaFinalizacion: 33, aptos: 1, aptosConObservaciones: 0, noAptos: 0, promedioDiasResolucion: 2.5 }]
};

describe('DashboardPsicologo y Modulos Internos - RTL + user-event', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
    window.open = vi.fn();
    window.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/cv');
    window.URL.revokeObjectURL = vi.fn();

    api.get.mockImplementation((url) => {
      if (url === '/solicitudes') return Promise.resolve({ data: solicitudesMock });
      if (url === '/metricas/psicologos') return Promise.resolve({ data: metricasMock });
      if (url === '/ofertas') return Promise.resolve({ data: [{ id: 50, tituloCargo: 'Soporte TI', familiaCargo: 'TI', ubicacion: 'Puerto Montt', modalidad: 'Presencial', cuposDisponibles: 2, estadoActivo: true, descripcion: 'Soporte' }] });
      if (url === '/candidatos') return Promise.resolve({ data: [{ id: 70, nombre: 'Ana Torres', rut: '19111222-3', correo: 'ana@test.cl', telefono: '+56911112222', fechaNacimiento: '1995-03-10', familiaCargo: 'TI', cargoPostulacion: 'Desarrollador Java', urlCv: 'cv/ana.pdf' }] });
      if (url.includes('/cv')) return Promise.resolve({ data: new Blob(['pdf']) });
      return Promise.resolve({ data: [] });
    });
  });

  const adminUser = { id: 1, nombre: 'Admin Aqua', correo: 'admin@aquachile.cl', rol: 'ADMIN' };

  it('navega por Resumen, Equipo y acepta postulacion en Bandeja', async () => {
    const user = userEvent.setup();
    api.patch.mockResolvedValue({ data: { ...solicitudesMock[0], estado: 'PENDIENTE', responsableId: 1, nombreResponsable: 'Admin Aqua' } });

    render(<MemoryRouter><DashboardPsicologo usuario={adminUser} alCerrarSesion={vi.fn()} /></MemoryRouter>);
    expect(await screen.findByText(/Panel de Control de Selección/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Rendimiento del Equipo/i }));
    expect(await screen.findByText(/Rendimiento del Equipo de Psicólogos/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Bandeja sin Asignar/i }));
    await user.click(screen.getByRole('button', { name: /Aceptar Postulación/i }));
    expect(api.patch).toHaveBeenCalledWith('/solicitudes/101/estado', { estado: 'PENDIENTE', responsableId: 1 });
  });

  it('gestiona Kanban, abre ficha, abre CV y agenda entrevista', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValue({ data: { solicitud: solicitudesMock[1], googleCalendarUrl: 'https://calendar.google.com' } });

    render(<MemoryRouter><DashboardPsicologo usuario={adminUser} alCerrarSesion={vi.fn()} /></MemoryRouter>);
    await screen.findByText(/Panel de Control de Selección/i);

    await user.click(screen.getAllByRole('button', { name: /Tablero Kanban/i })[0]);
    await user.click(screen.getByText('Carlos Ruiz'));
    expect((await screen.findAllByText(/#SOL-102/i))[0]).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Ver CV \(PDF\)/i }));
    await waitFor(() => expect(window.open).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: /Agendar Entrevista/i }));
    await user.click(screen.getByRole('button', { name: /Guardar Entrevista/i }));
    await waitFor(() => expect(api.post).toHaveBeenCalled());
  });

  it('crea postulacion interna y recorre Calendario, Candidatos, Ofertas y Equipo', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValue({ data: { id: 200, nombre: 'Nuevo User', correo: 'nuevo@aquachile.cl', rol: 'PSICOLOGO' } });
    api.put.mockResolvedValue({ data: {} });

    render(<MemoryRouter><DashboardPsicologo usuario={adminUser} alCerrarSesion={vi.fn()} /></MemoryRouter>);
    await screen.findByText(/Panel de Control de Selección/i);

    await user.click(screen.getByRole('button', { name: /Nueva Postulación/i }));
    await user.type(screen.getByPlaceholderText(/18456789-K/i), '17654321-8');
    await user.type(screen.getByPlaceholderText(/Sofía Vargas/i), 'Pedro Rojas');
    fireEvent.change(document.querySelector('input[name="fechaNacimiento"]'), { target: { name: 'fechaNacimiento', value: '1994-08-20' } });
    await user.type(screen.getByPlaceholderText(/correo@ejemplo.cl/i), 'pedro@test.cl');
    await user.click(screen.getByRole('button', { name: /Crear Postulación/i }));
    await waitFor(() => expect(api.post).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: /Agenda de Entrevistas/i }));
    expect(await screen.findByRole('heading', { name: /Agenda de Entrevistas/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Directorio Candidatos/i }));
    expect(await screen.findByText(/19111222-3/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Editar/i }));
    await user.click(screen.getByRole('button', { name: /Guardar Cambios/i }));
    await waitFor(() => expect(api.put).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: /Gestión de Ofertas/i }));
    await user.click(screen.getByRole('button', { name: /Nueva Oferta/i }));
    await user.type(screen.getByPlaceholderText(/Ej: Operario de Planta/i), 'Analista QA');
    await user.type(screen.getByPlaceholderText(/Resumen del rol/i), 'Pruebas');
    await user.click(screen.getByRole('button', { name: /Publicar Oferta/i }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/ofertas', expect.any(Object)));

    await user.click(screen.getByRole('button', { name: /Gestión de Equipo/i }));
    await user.type(screen.getByPlaceholderText(/María Victoria Bustamante/i), 'Nuevo Psicologo');
    await user.type(screen.getByPlaceholderText(/psicologa@aquachile.cl/i), 'nuevo@aquachile.cl');
    await user.type(screen.getByPlaceholderText(/Mínimo 6 caracteres/i), 'clave123');
    await user.click(screen.getByRole('button', { name: /Crear Usuario/i }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/auth/registro', expect.any(Object)));
  });
});


