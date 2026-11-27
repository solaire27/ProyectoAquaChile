package com.duoc.aquachile.service;

import com.duoc.aquachile.dto.EvaluacionRequestDTO;
import com.duoc.aquachile.model.EstadoSolicitud;
import com.duoc.aquachile.model.Evaluacion;
import com.duoc.aquachile.model.SolicitudEvaluacion;
import com.duoc.aquachile.repository.EvaluacionRepository;
import com.duoc.aquachile.repository.SolicitudRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EvaluacionServiceTest {

    @Mock
    private EvaluacionRepository evaluacionRepository;

    @Mock
    private SolicitudService solicitudService;

    @Mock
    private SolicitudRepository solicitudRepository;

    @InjectMocks
    private EvaluacionService evaluacionService;

    @Test
    void registrarEvaluacion_GuardaEvaluacionYFinalizaSolicitud() {
        SolicitudEvaluacion solicitud = new SolicitudEvaluacion();
        solicitud.setId(10L);
        solicitud.setEstado(EstadoSolicitud.EN_PROCESO);

        EvaluacionRequestDTO dto = new EvaluacionRequestDTO();
        dto.setSolicitudId(10L);
        dto.setResultadoGeneral("APROBADO");
        dto.setObservaciones("Cumple con todos los requisitos técnicos");

        when(solicitudService.obtenerPorId(10L)).thenReturn(solicitud);
        when(evaluacionRepository.save(any(Evaluacion.class))).thenAnswer(inv -> inv.getArgument(0));
        when(solicitudRepository.save(any(SolicitudEvaluacion.class))).thenAnswer(inv -> inv.getArgument(0));

        Evaluacion resultado = evaluacionService.registrarEvaluacion(dto);

        assertNotNull(resultado);
        assertEquals("APROBADO", resultado.getResultadoGeneral());
        assertEquals("Cumple con todos los requisitos técnicos", resultado.getObservaciones());
        assertEquals(EstadoSolicitud.FINALIZADA, solicitud.getEstado());
        verify(evaluacionRepository).save(any(Evaluacion.class));
        verify(solicitudRepository).save(solicitud);
    }
}