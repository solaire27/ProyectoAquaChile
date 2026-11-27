package com.duoc.aquachile.controller;
import com.duoc.aquachile.dto.*;
import com.duoc.aquachile.exception.ResourceNotFoundException;
import com.duoc.aquachile.model.*;
import com.duoc.aquachile.service.SolicitudService;
import com.duoc.aquachile.service.integration.SupabaseStorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import java.time.LocalDateTime;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SolicitudControllerTest {
    @Mock private SolicitudService solicitudService;
    @Mock private SupabaseStorageService supabaseStorageService;
    @InjectMocks private SolicitudController controller;

    private SolicitudEvaluacion demo() {
        Candidato c = new Candidato(); c.setId(10L); c.setNombre("Carlos"); c.setUrlCv("dir/cv.pdf");
        Usuario u = new Usuario(); u.setId(20L); u.setNombre("Psi");
        Evaluacion ev = new Evaluacion(); ev.setResultadoGeneral("Apto"); ev.setObservaciones("OK");
        SolicitudEvaluacion s = new SolicitudEvaluacion();
        s.setId(100L); s.setCandidato(c); s.setResponsable(u); s.setEvaluacion(ev);
        s.setCargo("Jefe"); s.setFamiliaCargo("Op"); s.setFechaSolicitud(LocalDateTime.now());
        s.setEstado(EstadoSolicitud.EN_PROCESO); s.setFechaEntrevista(LocalDateTime.of(2026, 12, 1, 10, 0));
        s.setDuracionEntrevistaMinutos(60); s.setModalidadEntrevista("Meet"); s.setNotasEntrevista("Nota");
        return s;
    }

    @Test void endpointsSolicitud() {
        SolicitudEvaluacion s = demo();
        SolicitudRequestDTO req = new SolicitudRequestDTO();
        SolicitudEstadoUpdateDTO est = new SolicitudEstadoUpdateDTO();
        EntrevistaRequestDTO ent = new EntrevistaRequestDTO();
        when(solicitudService.crearSolicitud(req)).thenReturn(s);
        when(solicitudService.obtenerTodas()).thenReturn(List.of(s));
        when(solicitudService.obtenerPorId(100L)).thenReturn(s);
        when(solicitudService.actualizarEstado(100L, est)).thenReturn(s);
        when(solicitudService.agendarEntrevista(100L, ent)).thenReturn(s);
        when(solicitudService.reintentarAnalisisIa(100L)).thenReturn(s);
        when(supabaseStorageService.descargarCv("dir/cv.pdf")).thenReturn("PDF".getBytes());

        assertEquals(HttpStatus.CREATED, controller.crear(req).getStatusCode());
        assertEquals(1, controller.listar().getBody().size());
        assertEquals(100L, controller.obtener(100L).getBody().getId());
        assertEquals(HttpStatus.OK, controller.actualizarEstado(100L, est).getStatusCode());
        assertEquals(HttpStatus.OK, controller.agendarEntrevista(100L, ent).getStatusCode());
        assertEquals(HttpStatus.OK, controller.reintentarIa(100L).getStatusCode());
        assertEquals(HttpStatus.OK, controller.obtenerCv(100L).getStatusCode());
        assertEquals(HttpStatus.NO_CONTENT, controller.eliminar(100L).getStatusCode());

        s.getCandidato().setUrlCv("");
        try {
            controller.obtenerCv(100L);
            fail("Debio lanzar ResourceNotFoundException");
        } catch (ResourceNotFoundException expected) {
            assertNotNull(expected.getMessage());
        }
    }
}
