import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from './Login';
import App from '../App';
import CargosDisponibles from './CargosDisponibles';
import EstadoPostulacion from './EstadoPostulacion';
import SobreNosotros from './SobreNosotros';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }
}));

describe('Login y App - Autenticacion y Rutas Protegidas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    window.scrollTo = vi.fn();
  });

  it('permite iniciar sesion y muestra error con credenciales invalidas', async () => {
    const user = userEvent.setup();
    const alAutenticar = vi.fn();
    api.post.mockRejectedValueOnce(new Error('401'));

    render(<MemoryRouter><Login alAutenticar={alAutenticar} /></MemoryRouter>);

    await user.type(screen.getByPlaceholderText(/ejemplo@aquachile.com/i), 'mal@aquachile.cl');
    await user.type(screen.getByPlaceholderText(/••••••••/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /Ingresar al Sistema/i }));
    expect(await screen.findByText(/Credenciales inválidas/i)).toBeInTheDocument();

    api.post.mockResolvedValueOnce({
      data: { token: 'tok-123', id: 1, nombre: 'Admin Aqua', correo: 'admin@aquachile.cl', rol: 'ADMIN' }
    });
    await user.click(screen.getByRole('button', { name: /Ingresar al Sistema/i }));
    await waitFor(() => expect(alAutenticar).toHaveBeenCalledTimes(1));
  });

  it('protege /dashboard sin token y permite flujo login + logout', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({ data: [] });
    api.post.mockResolvedValue({
      data: { token: 'tok-999', id: 2, nombre: 'Psicologo Test', correo: 'psi@aquachile.cl', rol: 'PSICOLOGO' }
    });

    render(<MemoryRouter initialEntries={['/dashboard']}><App /></MemoryRouter>);
    expect(await screen.findByText(/Portal Psicolaboral/i)).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/ejemplo@aquachile.com/i), 'psi@aquachile.cl');
    await user.type(screen.getByPlaceholderText(/••••••••/i), 'secret');
    await user.click(screen.getByRole('button', { name: /Ingresar al Sistema/i }));

    expect(await screen.findByText(/Portal Psicólogos/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Salir/i }));
    expect(await screen.findByText(/Portal Psicolaboral/i)).toBeInTheDocument();
  });
});

describe('CargosDisponibles, EstadoPostulacion y SobreNosotros', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = vi.fn();
  });

  it('filtra ofertas y abre detalle en CargosDisponibles', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({
      data: [
        { id: 1, tituloCargo: 'Desarrollador Java', familiaCargo: 'TI', ubicacion: 'Puerto Montt', modalidad: 'Híbrida', rangoSalarial: '$1.800.000', cuposDisponibles: 2, descripcion: 'Backend Spring Boot' },
        { id: 2, tituloCargo: 'Operario de Planta', familiaCargo: 'Operativo', ubicacion: 'Quellón', modalidad: 'Presencial', cuposDisponibles: 5, descripcion: 'Línea de proceso' }
      ]
    });

    render(<MemoryRouter><CargosDisponibles /></MemoryRouter>);
    expect(await screen.findByText('Desarrollador Java')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /TI \(1\)/i }));
    expect(screen.queryByText('Operario de Planta')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Detalle/i }));
    expect(await screen.findByText(/Backend Spring Boot/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Cerrar$/i }));
  });

  it('valida y consulta estado en EstadoPostulacion', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValue({
      data: { estado: 'EN_PROCESO', familiaCargo: 'TI', cargo: 'Desarrollador Java', nombreCandidato: 'Juan Pérez', fechaSolicitud: '2026-11-20T10:00:00' }
    });

    render(<MemoryRouter><EstadoPostulacion /></MemoryRouter>);
    await user.click(screen.getByRole('button', { name: /Consultar Estado/i }));
    expect(await screen.findByText(/Por favor, ingresa tu RUT/i)).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/RUT \(ej: 12345678-9\)/i), '12345678-9');
    await user.type(screen.getByPlaceholderText(/Correo electrónico/i), 'juan@test.cl');
    await user.click(screen.getByRole('button', { name: /Consultar Estado/i }));

    expect(await screen.findByText('Desarrollador Java')).toBeInTheDocument();
  });

  it('renderiza SobreNosotros', () => {
    render(<MemoryRouter><SobreNosotros /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: /Quiénes Somos/i })).toBeInTheDocument();
  });
});

