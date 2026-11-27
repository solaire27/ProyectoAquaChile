package com.duoc.aquachile.controller;
import com.duoc.aquachile.dto.ConsultaEstadoRequestDTO;
import com.duoc.aquachile.model.*;
import com.duoc.aquachile.service.SolicitudService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import java.time.LocalDateTime;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConsultaControllerTest {
    @Mock private SolicitudService solicitudService;
    @InjectMocks private ConsultaController controller;

    @Test void consultarEstado() {
        ConsultaEstadoRequestDTO dto = new ConsultaEstadoRequestDTO();
        dto.setIdentificador("123"); dto.setCorreo("a@b.cl");
        Candidato c = new Candidato(); c.setNombre("Juan");
        SolicitudEvaluacion s = new SolicitudEvaluacion();
        s.setId(10L); s.setCandidato(c); s.setCargo("Op"); s.setFamiliaCargo("Prod");
        s.setFechaSolicitud(LocalDateTime.now()); s.setEstado(EstadoSolicitud.EN_PROCESO);
        when(solicitudService.consultarSolicitudPublica("123", "a@b.cl")).thenReturn(s);
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) controller.consultarEstado(dto).getBody();
        assertEquals("Juan", body.get("nombreCandidato"));
    }
}
