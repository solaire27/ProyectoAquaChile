import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardPsicologo from './DashboardPsicologo';
import CalendarioEntrevistas from './CalendarioEntrevistas';
import BandejaPostulaciones from './BandejaPostulaciones';
import DirectorioCandidatos from './DirectorioCandidatos';
import GestionOfertas from './GestionOfertas';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }
}));

const hoy = new Date();
const ayer = new Date(Date.now() - 2 * 86400000);
const sols = [
  { id: 401, nombreCandidato: 'Berta Sol', cargo: 'Desarrollador Java', familiaCargo: 'TI', estado: 'NUEVA_POSTULACION', fechaSolicitud: ayer.toISOString() },
  { id: 402, nombreCandidato: 'Raul Paz', cargo: 'Operario de Planta', familiaCargo: 'Operativo', estado: 'EN_PROCESO', responsableId: 1, nombreResponsable: 'Admin', fechaSolicitud: hoy.toISOString(), fechaEntrevista: hoy.toISOString(), duracionEntrevistaMinutos: 30, modalidadEntrevista: 'Presencial', notasEntrevista: 'Sala 2' },
  { id: 403, nombreCandidato: 'Nora Gil', cargo: 'Analista Contable', familiaCargo: 'Administrativo', estado: 'EN_PROCESO', responsableId: 2, nombreResponsable: 'Otro Psi', fechaSolicitud: hoy.toISOString(), fechaEntrevista: hoy.toISOString() }
];

describe('Cobertura Final >=85% - Funciones y Ramas de Modulos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
    api.get.mockImplementation((url) => {
      if (url === '/solicitudes') return Promise.resolve({ data: sols });
      if (url === '/metricas/psicologos') return Promise.resolve({ data: { totalPsicologos: 0, totalAsignadasPsicologos: 0, sinAsignar: 1, psicologos: [] } });
      if (url === '/ofertas') return Promise.resolve({ data: [{ id: 1, tituloCargo: 'Dev', familiaCargo: 'TI', ubicacion: 'PM', modalidad: 'Remota', cuposDisponibles: 1, estadoActivo: true, descripcion: 'Desc' }] });
      if (url === '/candidatos') return Promise.resolve({ data: [{ id: 1, nombre: 'Berta Sol', rut: '12345678-9', correo: 'b@test.cl', telefono: '+56911111111', fechaNacimiento: '1992-02-02', familiaCargo: 'TI', cargoPostulacion: 'Dev' }] });
      return Promise.resolve({ data: [] });
    });
  });

  it('cubre navegacion completa de CalendarioEntrevistas y filtro por evaluador', async () => {
    const user = userEvent.setup();
    const onSel = vi.fn();
    render(
      <CalendarioEntrevistas
        solicitudes={sols}
        esAdmin={true}
        obtenerColorFamilia={() => ({ bg: '#0284c7', text: '#fff' })}
        obtenerIniciales={(n) => n.slice(0, 2)}
        onSeleccionarSolicitud={onSel}
      />
    );

    await user.click(screen.getByTitle(/Mes anterior/i));
    await user.click(screen.getByTitle(/Mes siguiente/i));
    await user.click(screen.getByRole('button', { name: /^Hoy$/i }));

    const selectEval = screen.getByDisplayValue(/Todo el equipo/i);
    await user.selectOptions(selectEval, 'Admin');
    await user.selectOptions(selectEval, 'TODOS');

    await user.click(screen.getAllByRole('button', { name: /Ver Ficha/i })[0]);
    expect(onSel).toHaveBeenCalled();
  });

  it('cubre filtros de fecha (Semana, Mes, Area) en BandejaPostulaciones', async () => {
    const user = userEvent.setup();
    render(
      <BandejaPostulaciones
        solicitudesSinAsignar={sols}
        areasDisponibles={['TI', 'Operativo']}
        obtenerColorFamilia={() => ({ bg: '#0284c7', text: '#fff' })}
        obtenerIniciales={(n) => n.slice(0, 2)}
        tomandoId={null}
        onAceptarPostulacion={vi.fn()}
        onSeleccionarSolicitud={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /Últimos 7 días/i }));
    await user.click(screen.getByRole('button', { name: /Este mes/i }));
    await user.click(screen.getByRole('button', { name: /Operativo/i }));
    await user.click(screen.getAllByRole('button', { name: /Ver Ficha/i })[0]);
  });

  it('cubre todos los inputs de edicion en DirectorioCandidatos y GestionOfertas', async () => {
    const user = userEvent.setup();
    api.put.mockResolvedValue({ data: {} });

    render(<DirectorioCandidatos obtenerIniciales={(n) => n.slice(0, 2)} />);
    await screen.findByText('Berta Sol');
    await user.type(screen.getByPlaceholderText(/Buscar por nombre/i), 'Berta');
    await user.click(screen.getByRole('button', { name: /Editar/i }));

    fireEvent.change(screen.getByDisplayValue('12345678-9'), { target: { value: '12345678-0' } });
    fireEvent.change(screen.getByDisplayValue('b@test.cl'), { target: { value: 'nuevo@test.cl' } });
    fireEvent.change(screen.getByDisplayValue('+56911111111'), { target: { value: '+56922222222' } });
    fireEvent.change(screen.getByDisplayValue('1992-02-02'), { target: { value: '1993-03-03' } });
    fireEvent.change(screen.getByDisplayValue('Dev'), { target: { value: 'Tech Lead' } });
    await user.click(screen.getByRole('button', { name: /Guardar Cambios/i }));
    await waitFor(() => expect(api.put).toHaveBeenCalledTimes(1));

    cleanup();

    render(<GestionOfertas />);
    await screen.findByText('Dev');
    await user.click(screen.getByRole('button', { name: /Editar/i }));
    fireEvent.change(screen.getByDisplayValue('PM'), { target: { value: 'Quellón' } });
    fireEvent.change(screen.getByDisplayValue('1'), { target: { value: '3' } });
    await user.click(screen.getByRole('button', { name: /Guardar Cambios/i }));
    await waitFor(() => expect(api.put).toHaveBeenCalledTimes(2));
  });

  it('cubre error 401 en DashboardPsicologo cerrando sesion automaticamente', async () => {
    const cerrar = vi.fn();
    api.get.mockRejectedValueOnce({ response: { status: 401 } });
    render(<MemoryRouter><DashboardPsicologo usuario={{ id: 1, nombre: 'Admin', rol: 'ADMIN' }} alCerrarSesion={cerrar} /></MemoryRouter>);
    await waitFor(() => expect(cerrar).toHaveBeenCalled(), { timeout: 2500 });
  });
});
