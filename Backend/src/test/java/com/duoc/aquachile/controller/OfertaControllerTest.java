package com.duoc.aquachile.controller;
import com.duoc.aquachile.dto.OfertaRequestDTO;
import com.duoc.aquachile.model.Oferta;
import com.duoc.aquachile.service.OfertaService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OfertaControllerTest {
    @Mock private OfertaService ofertaService;
    @InjectMocks private OfertaController controller;

    @Test void endpointsOferta() {
        Oferta o = new Oferta(); o.setId(1L);
        OfertaRequestDTO dto = new OfertaRequestDTO();
        when(ofertaService.obtenerActivas()).thenReturn(List.of(o));
        when(ofertaService.crearOferta(dto)).thenReturn(o);
        when(ofertaService.obtenerTodas()).thenReturn(List.of(o));
        when(ofertaService.actualizarOferta(1L, dto)).thenReturn(o);
        when(ofertaService.cambiarEstado(1L, false)).thenReturn(o);
        assertEquals(1, controller.listarActivasPublicas().getBody().size());
        assertEquals(HttpStatus.CREATED, controller.crear(dto).getStatusCode());
        assertEquals(1, controller.listarTodas().getBody().size());
        assertEquals(HttpStatus.OK, controller.actualizar(1L, dto).getStatusCode());
        assertEquals(HttpStatus.OK, controller.cambiarEstado(1L, false).getStatusCode());
        assertEquals(HttpStatus.NO_CONTENT, controller.eliminar(1L).getStatusCode());
    }
}
