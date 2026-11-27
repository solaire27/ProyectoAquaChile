import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardPsicologo from './DashboardPsicologo';
import GestionOfertas from './GestionOfertas';
import GestionUsuarios from './GestionUsuarios';
import CargosDisponibles from './CargosDisponibles';
import TableroKanban from './TableroKanban';
import api from '../services/api';

vi.mock('../services/api', () => {
  const actual = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: { request: { handlers: [{ rejected: (err) => Promise.reject(err) }] } }
  };
  return { default: actual };
});

describe('Cobertura Final Functions y Branches >= 85%', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
    window.scrollTo = vi.fn();
  });

  it('cubre todos los inputs y errores de GestionOfertas y GestionUsuarios', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValueOnce({ data: [] });
    api.post.mockRejectedValueOnce({ response: { data: { message: 'Error al crear oferta' } } });

    render(<GestionOfertas />);
    expect(await screen.findByText(/No hay ofertas creadas aún/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Nueva Oferta/i }));
    fireEvent.change(screen.getByPlaceholderText(/Ej: Operario de Planta/i), { target: { value: 'Jefe Planta' } });
    fireEvent.change(screen.getByDisplayValue('Operativo'), { target: { value: 'Jefatura' } });
    fireEvent.change(screen.getByDisplayValue('Presencial'), { target: { value: 'Híbrida' } });
    fireEvent.change(screen.getByPlaceholderText(/\$750.000/i), { target: { value: '$1.500.000' } });
    fireEvent.change(screen.getByPlaceholderText(/Resumen del rol/i), { target: { value: 'Liderar planta' } });
    fireEvent.change(screen.getByPlaceholderText(/Detalla las responsabilidades/i), { target: { value: 'Supervisión' } });
    fireEvent.change(screen.getByPlaceholderText(/Formación, experiencia/i), { target: { value: 'Ingeniería' } });
    fireEvent.change(screen.getByPlaceholderText(/Buses de acercamiento/i), { target: { value: 'Bonos' } });

    await user.click(screen.getByRole('button', { name: /Publicar Oferta/i }));
    expect(await screen.findByText(/Error al crear oferta/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Cancelar$/i }));

    api.post.mockRejectedValueOnce({ response: { data: { message: 'Correo duplicado' } } });
    render(<GestionUsuarios />);
    fireEvent.change(screen.getByPlaceholderText(/María Victoria Bustamante/i), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByPlaceholderText(/psicologa@aquachile.cl/i), { target: { value: 'ana@aquachile.cl' } });
    fireEvent.change(screen.getByPlaceholderText(/Mínimo 6 caracteres/i), { target: { value: '123456' } });
    fireEvent.change(screen.getByDisplayValue('PSICOLOGO'), { target: { value: 'ANALISTA' } });
    await user.click(screen.getByRole('button', { name: /Crear Usuario/i }));
    expect(await screen.findByText(/Correo duplicado/i)).toBeInTheDocument();
  });

  it('cubre busqueda vacia en CargosDisponibles y controles de TableroKanban', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValueOnce({
      data: [{ id: 1, tituloCargo: 'Soldador', familiaCargo: 'Operativo', ubicacion: 'Chiloé', modalidad: 'Presencial', cuposDisponibles: 1, descripcion: 'Trabajo en taller' }]
    });

    render(<MemoryRouter><CargosDisponibles /></MemoryRouter>);
    await screen.findByText('Soldador');
    const search = screen.getByPlaceholderText(/Buscar por cargo/i);
    await user.type(search, 'InexistenteXYZ');
    expect(await screen.findByText(/No encontramos vacantes con esos filtros/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Mostrar todas las vacantes/i }));
    expect(screen.getByText('Soldador')).toBeInTheDocument();

    const setBusq = vi.fn();
    const setFam = vi.fn();
    const setFec = vi.fn();
    render(
      <TableroKanban
        solicitudes={[]}
        solicitudesFiltradas={[]}
        columnas={[{ key: 'PENDIENTE', titulo: 'Pendientes', color: '#f59e0b' }]}
        areasDisponibles={['TI']}
        obtenerColorFamilia={() => ({ bg: '#0284c7', text: '#fff' })}
        busqueda="abc"
        setBusqueda={setBusq}
        filtroFamilia="TI"
        setFiltroFamilia={setFam}
        filtroFecha="HOY"
        setFiltroFecha={setFec}
        analizandoIaId={null}
        obtenerIniciales={() => 'AA'}
        onSeleccionarSolicitud={vi.fn()}
        onAbrirCrearEnColumna={vi.fn()}
        onDropTarjeta={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /Todas las áreas/i }));
    await user.click(screen.getByRole('button', { name: /Añadir candidato/i }));
    await user.click(screen.getByRole('button', { name: /Limpiar filtros/i }));
    expect(setBusq).toHaveBeenCalledWith('');
  });

  it('cubre campos restantes en modales de DashboardPsicologo (familia, entrevista, evaluacion)', async () => {
    const user = userEvent.setup();
    const sol = { id: 501, nombreCandidato: 'Hugo Paz', cargo: 'Dev', familiaCargo: 'TI', estado: 'PENDIENTE', responsableId: 1, nombreResponsable: 'Admin' };
    api.get.mockResolvedValue({ data: [sol] });
    api.post.mockRejectedValueOnce({ response: { data: { message: 'Fallo entrevista' } } });
    api.delete.mockRejectedValueOnce({ response: { status: 403 } });

    render(<MemoryRouter><DashboardPsicologo usuario={{ id: 1, nombre: 'Admin', rol: 'ADMIN' }} alCerrarSesion={vi.fn()} /></MemoryRouter>);
    await screen.findByText(/Panel de Control de Selección/i);

    // Cambiar selects en modal Nueva Postulacion
    await user.click(screen.getByRole('button', { name: /Nueva Postulación/i }));
    fireEvent.change(screen.getByDisplayValue('Operativo'), { target: { name: 'familiaCargo', value: 'TI' } });
    fireEvent.change(screen.getByDisplayValue('Desarrollador Java'), { target: { name: 'cargoPostulacion', value: 'Soporte TI' } });
    fireEvent.change(screen.getByPlaceholderText(/\+56912345678/i), { target: { name: 'telefono', value: '+56988887777' } });
    await user.click(screen.getByRole('button', { name: /^Cancelar$/i }));

    // Abrir ficha, probar error al agendar entrevista y error 403 al eliminar
    await user.click(screen.getByText('Hugo Paz'));
    await user.click(screen.getByRole('button', { name: /Agendar Entrevista/i }));
    fireEvent.change(screen.getByDisplayValue('45 minutos'), { target: { value: '60' } });
    fireEvent.change(screen.getByPlaceholderText(/Online \(Google Meet\)/i), { target: { value: 'Planta' } });
    fireEvent.change(screen.getByPlaceholderText(/Instrucciones para el postulante/i), { target: { value: 'Traer CI' } });
    await user.click(screen.getByRole('button', { name: /Guardar Entrevista/i }));
    await waitFor(() => expect(api.post).toHaveBeenCalled());
    await user.click(screen.getByRole('button', { name: /^Cerrar$/i }));

    await user.click(screen.getByRole('button', { name: /Eliminar Solicitud/i }));
    await user.click(screen.getByRole('button', { name: /Sí, Eliminar/i }));
    await waitFor(() => expect(api.delete).toHaveBeenCalled());
  });
});
