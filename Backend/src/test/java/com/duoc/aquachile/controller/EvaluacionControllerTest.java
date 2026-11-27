package com.duoc.aquachile.controller;
import com.duoc.aquachile.dto.EvaluacionRequestDTO;
import com.duoc.aquachile.model.Evaluacion;
import com.duoc.aquachile.service.EvaluacionService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EvaluacionControllerTest {
    @Mock private EvaluacionService evaluacionService;
    @InjectMocks private EvaluacionController controller;

    @Test void registrar() {
        EvaluacionRequestDTO dto = new EvaluacionRequestDTO();
        Evaluacion ev = new Evaluacion(); ev.setId(5L);
        when(evaluacionService.registrarEvaluacion(dto)).thenReturn(ev);
        assertEquals(HttpStatus.CREATED, controller.registrar(dto).getStatusCode());
    }
}
