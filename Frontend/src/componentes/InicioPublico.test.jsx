import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import InicioPublico from './InicioPublico';

describe('InicioPublico', () => {
    it('renderiza el título principal de AquaChile', () => {
        // Envolvemos en MemoryRouter porque InicioPublico usa <Link>
        render(
            <MemoryRouter>
                <InicioPublico />
            </MemoryRouter>
        );

        // Busca el texto "AquaChile" que pusimos como h1 en el componente
        const heading = screen.getByRole('heading', { level: 1, name: 'AquaChile' });
        expect(heading).toBeInTheDocument();
    });

    it('navega a la ruta "/postular" al hacer clic en Trabaja Con Nosotros', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter initialEntries={['/']}>
                <Routes>
                    <Route path="/" element={<InicioPublico />} />
                    <Route path="/postular" element={<h1>Formulario de Postulación</h1>} />
                </Routes>
            </MemoryRouter>
        );

        // Simula el clic en el botón
        const botonPostular = screen.getByRole('link', { name: 'Trabaja Con Nosotros' });
        await user.click(botonPostular);

        // Verifica que la navegación funcionó leyendo el h1 de destino
        expect(screen.getByRole('heading', { name: 'Formulario de Postulación' })).toBeInTheDocument();
    });
});