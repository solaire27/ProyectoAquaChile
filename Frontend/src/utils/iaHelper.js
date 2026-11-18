export const analizarEstadoIa = (texto) => {
    if (!texto || !texto.trim()) {
        return { estado: 'pendiente', puntaje: null };
    }

    const lower = texto.toLowerCase();

    if (
        lower.startsWith('error') ||
        lower.includes('no se recibió respuesta válida') ||
        lower.includes('404 not found')
    ) {
        return { estado: 'error', puntaje: null };
    }

    if (lower.includes('no adjuntó un archivo cv')) {
        return { estado: 'sin_cv', puntaje: null };
    }

    // Extrae puntajes como "8/10", "8.5/10", "8 de 10" o "Puntaje: 8"
    const match =
        texto.match(/(\d{1,2}(?:[.,]\d)?)\s*(?:\/\s*10|de\s*10)/i) ||
        texto.match(/puntaje[:\s*]+(\d{1,2}(?:[.,]\d)?)/i);

    let puntaje = null;
    if (match) {
        const num = parseFloat(match[1].replace(',', '.'));
        if (!Number.isNaN(num) && num >= 0 && num <= 10) {
            puntaje = num;
        }
    }

    return { estado: 'ok', puntaje };
};