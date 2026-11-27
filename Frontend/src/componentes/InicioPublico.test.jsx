import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import InicioPublico from './InicioPublico';

describe('InicioPublico', () => {
    it('renderiza el título principal de AquaChile', () => {
        render(
            <MemoryRouter>
                <InicioPublico />
            </MemoryRouter>
        );

        const heading = screen.getByRole('heading', { level: 1, name: 'AquaChile' });
        expect(heading).toBeInTheDocument();
    });

    it('navega a la ruta "/cargos" al hacer clic en Trabaja Con Nosotros', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter initialEntries={['/']}>
                <Routes>
                    <Route path="/" element={<InicioPublico />} />
                    <Route path="/cargos" element={<h1>Listado de Cargos</h1>} />
                </Routes>
            </MemoryRouter>
        );

        const botonPostular = screen.getByRole('link', { name: 'Trabaja Con Nosotros' });
        expect(botonPostular).toHaveAttribute('href', '/cargos');

        await user.click(botonPostular);

        expect(screen.getByRole('heading', { name: 'Listado de Cargos' })).toBeInTheDocument();
    });
});