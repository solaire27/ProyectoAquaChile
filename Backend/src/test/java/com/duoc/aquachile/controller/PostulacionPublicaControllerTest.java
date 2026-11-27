package com.duoc.aquachile.controller;
import com.duoc.aquachile.dto.CandidatoRequestDTO;
import com.duoc.aquachile.model.*;
import com.duoc.aquachile.service.SolicitudService;
import com.duoc.aquachile.service.integration.SupabaseStorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import java.time.LocalDateTime;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PostulacionPublicaControllerTest {
    @Mock private SolicitudService solicitudService;
    @Mock private SupabaseStorageService supabaseStorageService;
    @InjectMocks private PostulacionPublicaController controller;

    @Test void recibirYConsultar() {
        CandidatoRequestDTO dto = new CandidatoRequestDTO(); dto.setNombre("Ana");
        SolicitudEvaluacion sol = new SolicitudEvaluacion(); sol.setId(1L);
        MockMultipartFile cv = new MockMultipartFile("cv", "cv.pdf", "application/pdf", "pdf".getBytes());
        when(supabaseStorageService.subirCv(cv, "Ana")).thenReturn("cvs/ana.pdf");
        when(solicitudService.crearSolicitud(dto)).thenReturn(sol);
        assertEquals(HttpStatus.CREATED, controller.recibirPostulacion(dto, cv).getStatusCode());
        assertEquals(HttpStatus.CREATED, controller.recibirPostulacion(dto, null).getStatusCode());

        Candidato c = new Candidato(); c.setNombre("Ana"); c.setCorreo("ana@test.cl");
        sol.setCandidato(c); sol.setCargo("Analista"); sol.setFamiliaCargo("TI");
        sol.setFechaSolicitud(LocalDateTime.now()); sol.setEstado(EstadoSolicitud.PENDIENTE);
        when(solicitudService.buscarSolicitudesPublicas("ana@test.cl", null)).thenReturn(List.of(sol));
        assertEquals(1, controller.consultarEstadoPublico("ana@test.cl", null).getBody().size());
    }
}
