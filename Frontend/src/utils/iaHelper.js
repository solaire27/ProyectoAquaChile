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

export const parsearAnalisisIa = (texto) => {
    if (!texto || !texto.trim()) {
        return { resumen: '', preguntas: [] };
    }

    const estado = analizarEstadoIa(texto).estado;
    if (estado !== 'ok') {
        return { resumen: texto.trim(), preguntas: [] };
    }

    // Quita la nota final si la IA la incluyó, porque ya mostramos el aviso fijo de revisión humana
    const sinNota = texto.replace(/\n?\s*Nota\s*:[\s\S]*$/i, '').trim();

    const matchPreguntas = sinNota.match(/Preguntas\s+sugeridas\s*:/i);
    if (!matchPreguntas) {
        return { resumen: sinNota, preguntas: [] };
    }

    const idx = matchPreguntas.index;
    const resumen = sinNota.slice(0, idx).trim();
    const bloquePreguntas = sinNota.slice(idx + matchPreguntas[0].length).trim();

    // Soporta tanto formato numerado en varias líneas como en una sola línea (1) ... 2) ... 3) ...)
    let preguntas = bloquePreguntas
        .split(/(?:^|\n|\s)(?=\d+[\)\.\-]\s)/)
        .map(p => p.replace(/^\d+[\)\.\-]\s*/, '').trim())
        .filter(Boolean);

    // Respaldo si el modelo respondió con viñetas en vez de números
    if (preguntas.length <= 1 && bloquePreguntas.includes('\n')) {
        const porLinea = bloquePreguntas
            .split('\n')
            .map(l => l.replace(/^[\-•*]\s*/, '').replace(/^\d+[\)\.\-]\s*/, '').trim())
            .filter(Boolean);
        if (porLinea.length > 0) {
            preguntas = porLinea;
        }
    }

    return { resumen, preguntas };
};