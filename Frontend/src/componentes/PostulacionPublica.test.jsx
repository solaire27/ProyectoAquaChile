import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import PostulacionPublica from './PostulacionPublica';

describe('PostulacionPublica', () => {
    it('cambia las opciones de cargo automáticamente al cambiar la familia', async () => {
        const user = userEvent.setup();
        
        render(
            <MemoryRouter>
                <PostulacionPublica />
            </MemoryRouter>
        );

        // Identificamos los menús desplegables
        const familiaSelect = screen.getByRole('combobox', { name: /Familia de Cargo/i });
        const cargoSelect = screen.getByRole('combobox', { name: /Cargo al que postulas/i });
        
        // 1. Verificamos el estado por defecto
        expect(familiaSelect).toHaveValue('Operativo');
        expect(cargoSelect).toHaveValue('Operario de Planta');

        // 2. Simulamos que el usuario selecciona "Administrativo"
        await user.selectOptions(familiaSelect, 'Administrativo');

        // 3. Verificamos que el select de Familia cambió
        expect(familiaSelect).toHaveValue('Administrativo');
        
        // 4. Verificamos que el select de Cargo se actualizó al primer valor de la nueva familia
        expect(cargoSelect).toHaveValue('Asistente Administrativo');
        
        // 5. Verificamos que las opciones secundarias también se actualizaron
        expect(screen.getByRole('option', { name: 'Analista Contable' })).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: 'Operario de Planta' })).not.toBeInTheDocument();
    });
});