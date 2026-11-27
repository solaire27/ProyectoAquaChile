import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PostulacionPublica from './PostulacionPublica';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn() }
}));

describe('PostulacionPublica - RTL + user-event', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = vi.fn();
    api.get.mockResolvedValue({ data: [] });
  });

  it('cambia las opciones de cargo automaticamente al cambiar la familia', async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<MemoryRouter><PostulacionPublica /></MemoryRouter>);

    const familiaSelect = await screen.findByLabelText(/Familia de Cargo/i);
    const cargoSelect = screen.getByLabelText(/Cargo al que Postula/i);

    expect(familiaSelect).toHaveValue('Operativo');
    expect(cargoSelect).toHaveValue('Operario de Planta');

    await user.selectOptions(familiaSelect, 'Administrativo');

    expect(familiaSelect).toHaveValue('Administrativo');
    expect(cargoSelect).toHaveValue('Asistente Administrativo');
    expect(screen.getByRole('option', { name: 'Analista Contable' })).toBeInTheDocument();
  });

  it('muestra errores de validacion cuando se envia vacio', async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<MemoryRouter><PostulacionPublica /></MemoryRouter>);

    await user.click(screen.getByRole('button', { name: /Enviar Postulación/i }));

    expect(await screen.findByText(/El RUT es obligatorio/i)).toBeInTheDocument();
    expect(screen.getByText(/El nombre es obligatorio/i)).toBeInTheDocument();
    expect(screen.getByText(/Debes adjuntar tu Currículum Vitae en PDF/i)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('rechaza archivos que no sean PDF o que superen 5 MB', async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<MemoryRouter><PostulacionPublica /></MemoryRouter>);

    const inputArchivo = document.getElementById('cv-upload');
    await user.upload(inputArchivo, new File(['hola'], 'cv.txt', { type: 'text/plain' }));
    expect(await screen.findByText(/Solo se permiten archivos en formato PDF/i)).toBeInTheDocument();

    await user.upload(inputArchivo, new File([new ArrayBuffer(6 * 1024 * 1024)], 'grande.pdf', { type: 'application/pdf' }));
    expect(await screen.findByText(/supera el tamaño máximo permitido de 5 MB/i)).toBeInTheDocument();
  });

  it('envia postulacion valida con CV en PDF y muestra modal de exito', async () => {
    const user = userEvent.setup({ applyAccept: false });
    api.post.mockResolvedValue({ data: { id: 10 } });

    render(
      <MemoryRouter initialEntries={['/postular?familia=TI&cargo=Desarrollador%20Java']}>
        <PostulacionPublica />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/RUT/i), '18456789-K');
    await user.type(screen.getByLabelText(/Nombre Completo/i), 'Camila Soto');
    await user.type(screen.getByLabelText(/Fecha de Nacimiento/i), '1996-05-14');
    await user.type(screen.getByLabelText(/Teléfono/i), '+56987654321');
    await user.type(screen.getByLabelText(/Correo Electrónico/i), 'camila@test.cl');
    await user.upload(document.getElementById('cv-upload'), new File(['%PDF-1.4'], 'cv_camila.pdf', { type: 'application/pdf' }));

    await user.click(screen.getByRole('button', { name: /Enviar Postulación/i }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /¡Postulación enviada con éxito!/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Entendido/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});

