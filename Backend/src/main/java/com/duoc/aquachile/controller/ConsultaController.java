package com.duoc.aquachile.controller;

import com.duoc.aquachile.dto.ConsultaEstadoRequestDTO;
import com.duoc.aquachile.service.SolicitudService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/solicitudes")
public class ConsultaController {

    private final SolicitudService solicitudService;

    public ConsultaController(SolicitudService solicitudService) {
        this.solicitudService = solicitudService;
    }

    // Endpoint público: POST /api/solicitudes/estado
    @PostMapping("/estado")
    public ResponseEntity<Object> consultarEstado(@Valid @RequestBody ConsultaEstadoRequestDTO dto) {
        String estadoActual = solicitudService.consultarEstadoPublico(dto.getIdentificador(), dto.getCorreo());

        Map<String, String> respuesta = new HashMap<>();
        respuesta.put("estado", estadoActual);

        return ResponseEntity.ok(respuesta);
    }
}