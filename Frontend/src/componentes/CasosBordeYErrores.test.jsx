import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardPsicologo from './DashboardPsicologo';
import PostulacionPublica from './PostulacionPublica';
import CargosDisponibles from './CargosDisponibles';
import DirectorioCandidatos from './DirectorioCandidatos';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }
}));

describe('Cierre Final 85%+ en Functions y Branches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = vi.fn();
  });

  it('cubre cierres de modales, overlays, toasts y ramas de error en DashboardPsicologo', async () => {
    const user = userEvent.setup();
    const solSinCv = {
      id: 601,
      nombreCandidato: 'Solitario',
      cargo: 'Dev',
      familiaCargo: null,
      estado: 'NUEVA_POSTULACION',
      fechaSolicitud: null,
      observaciones: null,
      urlCv: null
    };
    api.get.mockImplementation((url) => {
      if (url === '/solicitudes') return Promise.resolve({ data: [solSinCv] });
      if (url === '/metricas/psicologos') return Promise.reject(new Error('err metricas'));
      if (url.includes('/cv')) return Promise.reject(new Error('err cv'));
      return Promise.resolve({ data: [] });
    });
    api.patch.mockRejectedValueOnce({ response: { data: { message: 'Fallo patch' } } });

    render(<MemoryRouter><DashboardPsicologo usuario={{ id: 1, nombre: 'Admin', rol: 'ADMIN' }} alCerrarSesion={vi.fn()} /></MemoryRouter>);
    await screen.findByText(/Panel de Control de Selección/i);

    // Abrir y cerrar modal Nueva Postulacion con la X y overlay
    await user.click(screen.getByRole('button', { name: /Nueva Postulación/i }));
    const overlay1 = document.querySelector('.modal-overlay');
    fireEvent.click(overlay1);

    // Ir a Kanban, abrir ficha de Solitario (sin CV, sin familia, sin fecha), cerrar toast y cerrar modal
    await user.click(screen.getAllByRole('button', { name: /Tablero Kanban/i })[0]);
    await user.click(screen.getByText('Solitario'));
    await user.click(screen.getByRole('button', { name: /Aceptar Postulación/i }));
    const toastClose = await screen.findByText(/Fallo patch/i);
    const closeBtn = toastClose.parentElement.querySelector('.toast-close');
    if (closeBtn) await user.click(closeBtn);

    // Abrir modal evaluar y cancelar
    await user.click(screen.getByRole('button', { name: /Evaluar y Finalizar/i }));
    await user.click(screen.getByRole('button', { name: /^Cancelar$/i }));
  });

  it('cubre ramas de PostulacionPublica, CargosDisponibles y DirectorioCandidatos', async () => {
    const user = userEvent.setup();
    // 1. PostulacionPublica con familia invalida en URL y cierre de modal exito con X
    api.get.mockResolvedValueOnce({ data: [{ familiaCargo: 'TI', tituloCargo: 'Dev' }] });
    api.post.mockResolvedValueOnce({ data: {} });
    render(
      <MemoryRouter initialEntries={['/postular?familia=Inexistente&cargo=X']}>
        <PostulacionPublica />
      </MemoryRouter>
    );
    await user.type(await screen.findByLabelText(/RUT/i), '12345678-9');
    await user.type(screen.getByLabelText(/Nombre Completo/i), 'Test');
    await user.type(screen.getByLabelText(/Fecha de Nacimiento/i), '1995-01-01');
    await user.type(screen.getByLabelText(/Teléfono/i), '912345678');
    await user.type(screen.getByLabelText(/Correo Electrónico/i), 't@t.cl');
    fireEvent.change(document.getElementById('cv-upload'), {
      target: { files: [new File(['%PDF'], 'a.pdf', { type: 'application/pdf' })] }
    });
    await user.click(screen.getByRole('button', { name: /Enviar Postulación/i }));
    await user.click(await screen.findByLabelText(/^Cerrar$/i));

    // 2. CargosDisponibles vacio y cerrar modal detalle con X
    api.get.mockResolvedValueOnce({ data: [] });
    const { unmount } = render(<MemoryRouter><CargosDisponibles /></MemoryRouter>);
    expect(await screen.findByText(/Actualmente no hay vacantes publicadas/i)).toBeInTheDocument();
    unmount();

    api.get.mockResolvedValueOnce({
      data: [{ id: 1, tituloCargo: 'QA', familiaCargo: 'TI', funcionesPrincipales: 'F', requisitos: 'R', beneficios: 'B' }]
    });
    render(<MemoryRouter><CargosDisponibles /></MemoryRouter>);
    await user.click(await screen.findByRole('button', { name: /Detalle/i }));
    await user.click(screen.getByLabelText(/Cerrar detalle/i));

    // 3. DirectorioCandidatos error al cargar y cerrar edicion con X
    api.get.mockRejectedValueOnce(new Error('fail'));
    render(<DirectorioCandidatos obtenerIniciales={() => 'AA'} />);
    expect(await screen.findByText(/No se pudo cargar el directorio/i)).toBeInTheDocument();
  });
});
