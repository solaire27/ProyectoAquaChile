package com.duoc.aquachile.controller;

import com.duoc.aquachile.model.*;
import com.duoc.aquachile.repository.SolicitudRepository;
import com.duoc.aquachile.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MetricaControllerTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private SolicitudRepository solicitudRepository;

    @InjectMocks
    private MetricaController metricaController;

    @Test
    @SuppressWarnings("unchecked")
    void obtenerMetricasPsicologos_CalculaIndicadoresCorrectamente() {
        Usuario psi1 = new Usuario();
        psi1.setId(1L);
        psi1.setNombre("Psicóloga Ana");
        psi1.setCorreo("ana@aquachile.com");
        psi1.setRol(RolUsuario.PSICOLOGO);

        Usuario psi2 = new Usuario();
        psi2.setId(2L);
        psi2.setNombre("Psicólogo Luis");
        psi2.setCorreo("luis@aquachile.com");
        psi2.setRol(RolUsuario.PSICOLOGO);

        Usuario admin = new Usuario();
        admin.setId(3L);
        admin.setRol(RolUsuario.ADMIN);

        // Solicitud 1: Finalizada, Apto (48 horas = 2.0 días)
        Evaluacion eval1 = new Evaluacion();
        eval1.setResultadoGeneral("Apto");
        eval1.setFechaEvaluacion(LocalDateTime.of(2026, 11, 12, 10, 0));

        SolicitudEvaluacion s1 = new SolicitudEvaluacion();
        s1.setResponsable(psi1);
        s1.setEstado(EstadoSolicitud.FINALIZADA);
        s1.setFechaSolicitud(LocalDateTime.of(2026, 11, 10, 10, 0));
        s1.setEvaluacion(eval1);

        // Solicitud 2: Finalizada, Apto con Observaciones
        Evaluacion eval2 = new Evaluacion();
        eval2.setResultadoGeneral("Apto con Observaciones");
        eval2.setFechaEvaluacion(LocalDateTime.of(2026, 11, 11, 10, 0));

        SolicitudEvaluacion s2 = new SolicitudEvaluacion();
        s2.setResponsable(psi1);
        s2.setEstado(EstadoSolicitud.FINALIZADA);
        s2.setFechaSolicitud(LocalDateTime.of(2026, 11, 10, 10, 0));
        s2.setEvaluacion(eval2);

        // Solicitud 3: En proceso, No Apto
        Evaluacion eval3 = new Evaluacion();
        eval3.setResultadoGeneral("No Apto");

        SolicitudEvaluacion s3 = new SolicitudEvaluacion();
        s3.setResponsable(psi1);
        s3.setEstado(EstadoSolicitud.EN_PROCESO);
        s3.setEvaluacion(eval3);

        // Solicitud 4: Pendiente
        SolicitudEvaluacion s4 = new SolicitudEvaluacion();
        s4.setResponsable(psi1);
        s4.setEstado(EstadoSolicitud.PENDIENTE);

        // Solicitud 5: Sin asignar
        SolicitudEvaluacion s5 = new SolicitudEvaluacion();
        s5.setResponsable(null);
        s5.setEstado(EstadoSolicitud.NUEVA_POSTULACION);

        when(usuarioRepository.findAll()).thenReturn(List.of(psi1, psi2, admin));
        when(solicitudRepository.findAll()).thenReturn(List.of(s1, s2, s3, s4, s5));

ResponseEntity<Map<String, Object>> res = metricaController.obtenerMetricasPsicologos();

        assertEquals(HttpStatus.OK, res.getStatusCode());
        Map<String, Object> body = res.getBody();
        assertNotNull(body);
        assertEquals(2, body.get("totalPsicologos"));
        assertEquals(4, body.get("totalAsignadasPsicologos"));
        assertEquals(1L, body.get("sinAsignar"));
        assertEquals(1.5, body.get("promedioDiasEquipo"));

List<Map<String, Object>> lista = (List<Map<String, Object>>) body.get("psicologos");
        assertEquals(2, lista.size());
        assertEquals(50, lista.get(0).get("tasaFinalizacion"));
        assertEquals(1L, lista.get(0).get("aptos"));
        assertEquals(1L, lista.get(0).get("aptosConObservaciones"));
        assertEquals(1L, lista.get(0).get("noAptos"));
        assertNull(lista.get(1).get("promedioDiasResolucion"));
    }
}