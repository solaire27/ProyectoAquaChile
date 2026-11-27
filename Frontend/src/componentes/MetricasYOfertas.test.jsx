import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardPsicologo from './DashboardPsicologo';
import CargosDisponibles from './CargosDisponibles';
import EstadoPostulacion from './EstadoPostulacion';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }
}));

const hoyIso = new Date().toISOString();
const solicitudesExt = Array.from({ length: 8 }, (_, idx) => ({
  id: 200 + idx,
  nombreCandidato: idx % 2 === 0 ? `Postulante ${idx}` : 'MonoNombre',
  cargo: 'Desarrollador Java',
  familiaCargo: idx % 2 === 0 ? 'TI' : 'OtraArea',
  estado: idx === 0 ? 'NUEVA_POSTULACION' : idx === 1 ? 'PENDIENTE' : idx === 2 ? 'EN_PROCESO' : 'FINALIZADA',
  responsableId: idx === 0 ? null : 2,
  nombreResponsable: idx === 0 ? null : 'Psicologo Uno',
  fechaSolicitud: hoyIso,
  fechaEntrevista: idx === 2 ? hoyIso : null,
  resultadoEvaluacion: idx === 3 ? 'No Apto' : idx === 4 ? 'Apto con Observaciones' : idx >= 5 ? 'Apto' : null,
  recomendacionIa: idx === 1 ? 'Sin CV: no adjuntó un archivo cv' : idx === 2 ? null : '8/10'
}));

const metricasExt = {
  totalPsicologos: 2, totalAsignadasPsicologos: 7, sinAsignar: 1, promedioDiasEquipo: 3.2,
  psicologos: [
    { psicologoId: 2, nombre: 'Psicologo Uno', correo: 'p1@aquachile.cl', totalAsignadas: 6, pendientes: 2, enEvaluacion: 4, finalizadas: 0, tasaFinalizacion: 0, aptos: 0, aptosConObservaciones: 0, noAptos: 0, promedioDiasResolucion: null },
    { psicologoId: 3, nombre: 'Psicologo Dos', correo: 'p2@aquachile.cl', totalAsignadas: 12, pendientes: 6, enEvaluacion: 6, finalizadas: 0, tasaFinalizacion: 0, aptos: 1, aptosConObservaciones: 1, noAptos: 1, promedioDiasResolucion: 4.0 }
  ]
};

describe('Cobertura Final - Ramas y Funciones Restantes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
    window.scrollTo = vi.fn();
    api.get.mockImplementation((url) => {
      if (url === '/solicitudes') return Promise.resolve({ data: solicitudesExt });
      if (url === '/metricas/psicologos') return Promise.resolve({ data: metricasExt });
      if (url === '/ofertas') return Promise.resolve({ data: [{ id: 1, tituloCargo: 'Cargo X', familiaCargo: 'TI', cuposDisponibles: 1, estadoActivo: false, descripcion: 'Descripcion larga de mas de sesenta caracteres para cubrir el recorte en la tabla' }] });
      if (url === '/candidatos') return Promise.resolve({ data: [{ id: 1, nombre: 'Cand Uno', rut: '11222333-4', correo: 'c@test.cl', familiaCargo: 'TI', cargoPostulacion: 'Dev' }] });
      return Promise.resolve({ data: [] });
    });
  });

  const adminUser = { id: 1, nombre: 'Admin', correo: 'admin@aquachile.cl', rol: 'ADMIN' };

  it('cubre ordenamiento en Equipo, ver todas filas en Metricas, mover etapa desde modal y eliminar oferta', async () => {
    const user = userEvent.setup();
    api.patch.mockResolvedValue({ data: solicitudesExt[0] });
    api.delete.mockResolvedValue({ data: {} });

    render(<MemoryRouter><DashboardPsicologo usuario={adminUser} alCerrarSesion={vi.fn()} /></MemoryRouter>);
    await screen.findByText(/Panel de Control de Selección/i);

    // Ver todas las filas y filtrar por fecha en actividad reciente
    await user.click(screen.getByRole('button', { name: /Ver todas las postulaciones/i }));
    await user.click(screen.getByRole('button', { name: /^7 días$/i }));

    // Rendimiento equipo: buscar y cambiar orden
    await user.click(screen.getByRole('button', { name: /Rendimiento del Equipo/i }));
    const sortSelect = screen.getByDisplayValue(/Mayor carga activa/i);
    await user.selectOptions(sortSelect, 'finalizadas');
    await user.selectOptions(sortSelect, 'tasa');
    await user.selectOptions(sortSelect, 'nombre');
    await user.type(screen.getByPlaceholderText(/Buscar psicólogo/i), 'Uno');

    // Tablero Kanban: abrir modal de Postulante 0 y mover a En Evaluacion (dispara modal entrevista obligatoria)
    await user.click(screen.getAllByRole('button', { name: /Tablero Kanban/i })[0]);
    await user.click(screen.getByText('Postulante 0'));
    await user.click(screen.getByRole('button', { name: /En Evaluación Psicológica/i }));
    expect(await screen.findByText(/Agendar Entrevista Obligatoria/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Cerrar$/i }));

    // Gestion Ofertas: eliminar oferta cerrada
    await user.click(screen.getByRole('button', { name: /Gestión de Ofertas/i }));
    await screen.findByText('Cargo X');
    const deleteBtns = document.querySelectorAll('.btn-table-danger');
    await user.click(deleteBtns[0]);
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/ofertas/1'));
  });

  it('cubre errores de API y estados vacios en CargosDisponibles y EstadoPostulacion', async () => {
    const user = userEvent.setup();
    api.get.mockRejectedValueOnce(new Error('Network'));
    render(<MemoryRouter><CargosDisponibles /></MemoryRouter>);
    expect(await screen.findByText(/No pudimos cargar las oportunidades/i)).toBeInTheDocument();

    api.post.mockRejectedValueOnce({ response: { status: 404 } });
    render(<MemoryRouter><EstadoPostulacion /></MemoryRouter>);
    await user.type(screen.getByPlaceholderText(/RUT \(ej: 12345678-9\)/i), '12345678-9');
    await user.type(screen.getByPlaceholderText(/Correo electrónico/i), 'noexiste@test.cl');
    await user.click(screen.getByRole('button', { name: /Consultar Estado/i }));
    expect(await screen.findByText(/No encontramos postulaciones asociadas/i)).toBeInTheDocument();
  });
});
