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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/solicitudes")
public class SolicitudController {

    private final SolicitudService solicitudService;
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        solicitudService.eliminarSolicitud(id);
        return ResponseEntity.noContent().build();
    }

    public SolicitudController(SolicitudService solicitudService) {
        this.solicitudService = solicitudService;
    }
    @PreAuthorize("hasAnyRole('ADMIN', 'PSICOLOGO', 'ANALISTA')")
    @PostMapping
    public ResponseEntity<SolicitudResponseDTO> crear(@Valid @RequestBody SolicitudRequestDTO dto) {
        SolicitudEvaluacion creada = solicitudService.crearSolicitud(dto);
        return new ResponseEntity<>(mapearAResponse(creada), HttpStatus.CREATED);
    }
    @PreAuthorize("hasAnyRole('ADMIN', 'PSICOLOGO')")
    @GetMapping
    public ResponseEntity<List<SolicitudResponseDTO>> listar() {
        List<SolicitudResponseDTO> lista = solicitudService.obtenerTodas().stream()
                .map(this::mapearAResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(lista);
    }
    @PreAuthorize("hasAnyRole('ADMIN', 'PSICOLOGO')")
    @GetMapping("/{id}")
    public ResponseEntity<SolicitudResponseDTO> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(mapearAResponse(solicitudService.obtenerPorId(id)));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'PSICOLOGO')")
    @PatchMapping("/{id}/estado")
    public ResponseEntity<SolicitudResponseDTO> actualizarEstado(@PathVariable Long id, @Valid @RequestBody SolicitudEstadoUpdateDTO dto) {
        // Tu DTO ahora trae el responsableId opcional. El servicio se encargará del resto.
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

        // --- NUEVO: Extraer datos de la evaluación si existe ---
        if (entidad.getEvaluacion() != null) {
            dto.setResultadoEvaluacion(entidad.getEvaluacion().getResultadoGeneral());
            dto.setObservacionEvaluacion(entidad.getEvaluacion().getObservaciones());
        }

        // Mapear la recomendación de la IA
        dto.setRecomendacionIa(entidad.getRecomendacionIa());

        return dto;
    }
}