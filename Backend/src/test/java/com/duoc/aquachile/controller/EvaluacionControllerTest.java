package com.duoc.aquachile.controller;

import com.duoc.aquachile.dto.EvaluacionRequestDTO;
import com.duoc.aquachile.model.Evaluacion;
import com.duoc.aquachile.service.EvaluacionService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EvaluacionControllerTest {

    @Mock
    private EvaluacionService evaluacionService;

    @InjectMocks
    private EvaluacionController evaluacionController;

    @Test
    void registrar_RetornaCreatedConEvaluacion() {
        EvaluacionRequestDTO dto = new EvaluacionRequestDTO();
        dto.setSolicitudId(10L);
        dto.setResultadoGeneral("Apto");

        Evaluacion evaluacion = new Evaluacion();
        evaluacion.setId(1L);
        evaluacion.setResultadoGeneral("Apto");

        when(evaluacionService.registrarEvaluacion(dto)).thenReturn(evaluacion);

        ResponseEntity<Evaluacion> res = evaluacionController.registrar(dto);

        assertEquals(HttpStatus.CREATED, res.getStatusCode());
        assertEquals("Apto", res.getBody().getResultadoGeneral());
    }
}