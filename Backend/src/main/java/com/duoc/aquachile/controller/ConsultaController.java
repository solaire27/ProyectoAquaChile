package com.duoc.aquachile.controller;

import com.duoc.aquachile.dto.ConsultaEstadoRequestDTO;
import com.duoc.aquachile.model.SolicitudEvaluacion;
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
        SolicitudEvaluacion solicitud = solicitudService.consultarSolicitudPublica(dto.getIdentificador(), dto.getCorreo());

        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("id", solicitud.getId());
        respuesta.put("nombreCandidato", solicitud.getCandidato().getNombre());
        respuesta.put("cargo", solicitud.getCargo());
        respuesta.put("familiaCargo", solicitud.getFamiliaCargo());
        respuesta.put("fechaSolicitud", solicitud.getFechaSolicitud());
        respuesta.put("estado", solicitud.getEstado().name());

        return ResponseEntity.ok(respuesta);
    }
}