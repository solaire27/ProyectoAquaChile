import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardPsicologo from './DashboardPsicologo';
import PostulacionPublica from './PostulacionPublica';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }
}));

const hoyIso = new Date().toISOString();
const sols = [
  { id: 301, nombreCandidato: 'Mario Luna', cargo: 'Desarrollador Java', familiaCargo: 'TI', estado: 'NUEVA_POSTULACION', fechaSolicitud: hoyIso },
  { id: 302, nombreCandidato: 'Sara Vega', cargo: 'Operario de Planta', familiaCargo: 'Operativo', estado: 'PENDIENTE', responsableId: 5, nombreResponsable: 'Psicologo Local', fechaSolicitud: hoyIso, recomendacionIa: null, urlCv: 'cv/sara.pdf' },
  { id: 303, nombreCandidato: 'Diego Mora', cargo: 'Analista Contable', familiaCargo: 'Administrativo', estado: 'EN_PROCESO', responsableId: 5, nombreResponsable: 'Psicologo Local', fechaSolicitud: hoyIso, fechaEntrevista: hoyIso }
];

describe('Cobertura Meta >=85% - Flujos Psicologo, Validaciones y Errores', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = vi.fn();
    window.confirm = vi.fn(() => true);
    api.get.mockImplementation((url) => {
      if (url === '/solicitudes') return Promise.resolve({ data: sols });
      if (url === '/ofertas/public') return Promise.resolve({ data: [{ familiaCargo: 'TI', tituloCargo: 'Desarrollador Java' }] });
      if (url === '/ofertas') return Promise.resolve({ data: [{ id: 10, tituloCargo: 'Dev', familiaCargo: 'TI', ubicacion: 'PM', modalidad: 'Remota', cuposDisponibles: 1, estadoActivo: true, descripcion: 'Desc' }] });
      if (url === '/candidatos') return Promise.resolve({ data: [{ id: 20, nombre: 'Mario Luna', rut: '12345678-9', correo: 'm@test.cl', telefono: '+56911111111', fechaNacimiento: '1990-01-01', familiaCargo: 'TI', cargoPostulacion: 'Dev' }] });
      return Promise.resolve({ data: [] });
    });
  });

  it('cubre vista rol PSICOLOGO, reintento IA manual, validaciones modal crear y errores', async () => {
    const user = userEvent.setup();
    const psiUser = { id: 5, nombre: 'Psicologo Local', correo: 'psi@aquachile.cl', rol: 'PSICOLOGO' };
    api.post.mockResolvedValue({ data: { ...sols[1], recomendacionIa: '8/10' } });
    api.patch.mockResolvedValue({ data: sols[1] });

    render(<MemoryRouter><DashboardPsicologo usuario={psiUser} alCerrarSesion={vi.fn()} /></MemoryRouter>);
    expect(await screen.findByText(/Mi Tablero Kanban/i)).toBeInTheDocument();

    // Abrir modal crear y probar validaciones de campos vacios/invalidos + archivo invalido
    await user.click(screen.getByRole('button', { name: /Nueva Postulación/i }));
    await user.click(screen.getByRole('button', { name: /Crear Postulación/i }));
    expect(await screen.findByText(/Ingresa un RUT válido/i)).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/18456789-K/i), '12345678-9');
    await user.click(screen.getByRole('button', { name: /Crear Postulación/i }));
    expect(await screen.findByText(/El nombre completo del candidato es obligatorio/i)).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/Sofía Vargas/i), 'Test User');
    await user.click(screen.getByRole('button', { name: /Crear Postulación/i }));
    expect(await screen.findByText(/La fecha de nacimiento es obligatoria/i)).toBeInTheDocument();

    const modalFile = document.getElementById('modal-cv-upload');
    fireEvent.change(modalFile, { target: { files: [new File(['x'], 'bad.txt', { type: 'text/plain' })] } });
    expect(await screen.findByText(/Solo se permiten archivos en formato PDF/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Cancelar$/i }));

    // Ir a Mi Tablero Kanban, abrir Sara Vega (sin IA) y presionar "Analizar ahora"
    await user.click(screen.getAllByRole('button', { name: /Mi Tablero Kanban/i })[0]);
    await user.click(screen.getByText('Sara Vega'));
    await user.click(screen.getByRole('button', { name: /Analizar ahora/i }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/solicitudes/302/reintentar-ia'));

    // Mover a Nuevas Postulaciones desde modal
    await user.click(screen.getByRole('button', { name: /Nuevas Postulaciones/i }));
    await waitFor(() => expect(api.patch).toHaveBeenCalled());
  });

  it('cubre campos de edicion completos en DirectorioCandidatos y GestionOfertas', async () => {
    const user = userEvent.setup();
    const adminUser = { id: 1, nombre: 'Admin', correo: 'a@aquachile.cl', rol: 'ADMIN' };
    api.put.mockRejectedValueOnce({ response: { data: { message: 'Error al actualizar' } } });

    render(<MemoryRouter><DashboardPsicologo usuario={adminUser} alCerrarSesion={vi.fn()} /></MemoryRouter>);
    await screen.findByText(/Panel de Control de Selección/i);

    await user.click(screen.getByRole('button', { name: /Directorio Candidatos/i }));
    await screen.findByText('Mario Luna');
    await user.click(screen.getByRole('button', { name: /Editar/i }));
    const nombreInput = screen.getByDisplayValue('Mario Luna');
    await user.clear(nombreInput);
    await user.type(nombreInput, 'Mario Editado');
    await user.click(screen.getByRole('button', { name: /Guardar Cambios/i }));
    expect(await screen.findByText(/Error al actualizar/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Cancelar$/i }));

    // PostulacionPublica cargando ofertas desde API
    render(<MemoryRouter><PostulacionPublica /></MemoryRouter>);
    expect(await screen.findByRole('option', { name: 'Desarrollador Java' })).toBeInTheDocument();
  });
});
