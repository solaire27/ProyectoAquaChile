package com.duoc.aquachile.controller;

import com.duoc.aquachile.dto.ConsultaEstadoRequestDTO;
import com.duoc.aquachile.model.Candidato;
import com.duoc.aquachile.model.EstadoSolicitud;
import com.duoc.aquachile.model.SolicitudEvaluacion;
import com.duoc.aquachile.service.SolicitudService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConsultaControllerTest {

    @Mock
    private SolicitudService solicitudService;

    @InjectMocks
    private ConsultaController consultaController;

    @Test
    @SuppressWarnings("unchecked")
    void consultarEstado_RetornaMapaConDatosDeSolicitud() {
        Candidato candidato = new Candidato();
        candidato.setNombre("María González");

        SolicitudEvaluacion solicitud = new SolicitudEvaluacion();
        solicitud.setId(50L);
        solicitud.setCandidato(candidato);
        solicitud.setCargo("Operario de Planta");
        solicitud.setFamiliaCargo("Operativo");
        solicitud.setFechaSolicitud(LocalDateTime.of(2026, 11, 20, 10, 0));
        solicitud.setEstado(EstadoSolicitud.EN_PROCESO);

        ConsultaEstadoRequestDTO dto = new ConsultaEstadoRequestDTO();
        dto.setIdentificador("12345678-9");
        dto.setCorreo("maria@test.cl");

        when(solicitudService.consultarSolicitudPublica("12345678-9", "maria@test.cl")).thenReturn(solicitud);

        ResponseEntity<Object> res = consultaController.consultarEstado(dto);

        assertEquals(HttpStatus.OK, res.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) res.getBody();
        assertNotNull(body);
        assertEquals(50L, body.get("id"));
        assertEquals("María González", body.get("nombreCandidato"));
        assertEquals("EN_PROCESO", body.get("estado"));
    }
}