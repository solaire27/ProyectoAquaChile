package com.duoc.aquachile.controller;
import com.duoc.aquachile.dto.CandidatoRequestDTO;
import com.duoc.aquachile.model.Candidato;
import com.duoc.aquachile.service.CandidatoService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CandidatoControllerTest {
    @Mock private CandidatoService candidatoService;
    @InjectMocks private CandidatoController controller;

    @Test void crudBasico() {
        CandidatoRequestDTO dto = new CandidatoRequestDTO();
        Candidato c = new Candidato(); c.setId(1L);
        when(candidatoService.crearCandidato(dto)).thenReturn(c);
        when(candidatoService.obtenerTodos()).thenReturn(List.of(c));
        when(candidatoService.obtenerPorId(1L)).thenReturn(c);
        when(candidatoService.actualizarCandidato(1L, dto)).thenReturn(c);
        assertEquals(HttpStatus.CREATED, controller.crear(dto).getStatusCode());
        assertEquals(1, controller.listar().getBody().size());
        assertEquals(1L, controller.obtener(1L).getBody().getId());
        assertEquals(HttpStatus.OK, controller.actualizar(1L, dto).getStatusCode());
    }
}
