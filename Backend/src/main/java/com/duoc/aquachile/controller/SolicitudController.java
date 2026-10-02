package com.duoc.aquachile.controller;

import com.duoc.aquachile.dto.SolicitudEstadoUpdateDTO;
import com.duoc.aquachile.dto.SolicitudRequestDTO;
import com.duoc.aquachile.dto.SolicitudResponseDTO;
import com.duoc.aquachile.model.SolicitudEvaluacion;
import com.duoc.aquachile.service.SolicitudService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/solicitudes")
@RequiredArgsConstructor
public class SolicitudController {

    private final SolicitudService solicitudService;

    @PostMapping
    public ResponseEntity<SolicitudResponseDTO> crear(@Valid @RequestBody SolicitudRequestDTO dto) {
        SolicitudEvaluacion creada = solicitudService.crearSolicitud(dto);
        return new ResponseEntity<>(mapearAResponse(creada), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<SolicitudResponseDTO>> listar() {
        List<SolicitudResponseDTO> lista = solicitudService.obtenerTodas().stream()
                .map(this::mapearAResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SolicitudResponseDTO> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(mapearAResponse(solicitudService.obtenerPorId(id)));
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<SolicitudResponseDTO> actualizarEstado(@PathVariable Long id, @Valid @RequestBody SolicitudEstadoUpdateDTO dto) {
        return ResponseEntity.ok(mapearAResponse(solicitudService.actualizarEstado(id, dto)));
    }

    private SolicitudResponseDTO mapearAResponse(SolicitudEvaluacion entidad) {
        SolicitudResponseDTO dto = new SolicitudResponseDTO();
        dto.setId(entidad.getId());
        dto.setCandidatoId(entidad.getCandidato().getId());
        dto.setNombreCandidato(entidad.getCandidato().getNombre());
        if (entidad.getResponsable() != null) {
            dto.setResponsableId(entidad.getResponsable().getId());
            dto.setNombreResponsable(entidad.getResponsable().getNombre());
        }
        dto.setCargo(entidad.getCargo());
        dto.setFamiliaCargo(entidad.getFamiliaCargo());
        dto.setFechaSolicitud(entidad.getFechaSolicitud());
        dto.setEstado(entidad.getEstado());
        dto.setObservaciones(entidad.getObservaciones());
        return dto;
    }
}