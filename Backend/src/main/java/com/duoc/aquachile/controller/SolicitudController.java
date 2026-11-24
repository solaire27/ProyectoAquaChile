package com.duoc.aquachile.controller;

import com.duoc.aquachile.dto.SolicitudEstadoUpdateDTO;
import com.duoc.aquachile.dto.SolicitudRequestDTO;
import com.duoc.aquachile.dto.SolicitudResponseDTO;
import com.duoc.aquachile.exception.ResourceNotFoundException;
import com.duoc.aquachile.model.SolicitudEvaluacion;
import com.duoc.aquachile.service.SolicitudService;
import com.duoc.aquachile.service.integration.SupabaseStorageService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/solicitudes")
public class SolicitudController {

    private final SolicitudService solicitudService;
    private final SupabaseStorageService supabaseStorageService;

    public SolicitudController(SolicitudService solicitudService, SupabaseStorageService supabaseStorageService) {
        this.solicitudService = solicitudService;
        this.supabaseStorageService = supabaseStorageService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        solicitudService.eliminarSolicitud(id);
        return ResponseEntity.noContent().build();
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
        return ResponseEntity.ok(mapearAResponse(solicitudService.actualizarEstado(id, dto)));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'PSICOLOGO')")
    @PostMapping("/{id}/reintentar-ia")
    public ResponseEntity<SolicitudResponseDTO> reintentarIa(@PathVariable Long id) {
        return ResponseEntity.ok(mapearAResponse(solicitudService.reintentarAnalisisIa(id)));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'PSICOLOGO', 'ANALISTA')")
    @GetMapping("/{id}/cv")
    public ResponseEntity<byte[]> obtenerCv(@PathVariable Long id) {
        SolicitudEvaluacion solicitud = solicitudService.obtenerPorId(id);
        String urlCv = solicitud.getCandidato() != null ? solicitud.getCandidato().getUrlCv() : null;

        if (urlCv == null || urlCv.isBlank()) {
            throw new ResourceNotFoundException("El candidato no tiene un CV adjunto.");
        }

        byte[] pdfBytes = supabaseStorageService.descargarCv(urlCv);

        String soloNombreArchivo = urlCv.contains("/")
                ? urlCv.substring(urlCv.lastIndexOf("/") + 1)
                : urlCv;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.inline().filename(soloNombreArchivo).build());

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    private SolicitudResponseDTO mapearAResponse(SolicitudEvaluacion entidad) {
        SolicitudResponseDTO dto = new SolicitudResponseDTO();
        dto.setId(entidad.getId());
        dto.setCandidatoId(entidad.getCandidato().getId());
        dto.setNombreCandidato(entidad.getCandidato().getNombre());
        dto.setUrlCv(entidad.getCandidato().getUrlCv());
        if (entidad.getResponsable() != null) {
            dto.setResponsableId(entidad.getResponsable().getId());
            dto.setNombreResponsable(entidad.getResponsable().getNombre());
        }
        dto.setCargo(entidad.getCargo());
        dto.setFamiliaCargo(entidad.getFamiliaCargo());
        dto.setFechaSolicitud(entidad.getFechaSolicitud());
        dto.setEstado(entidad.getEstado());
        dto.setObservaciones(entidad.getObservaciones());

        if (entidad.getEvaluacion() != null) {
            dto.setResultadoEvaluacion(entidad.getEvaluacion().getResultadoGeneral());
            dto.setObservacionEvaluacion(entidad.getEvaluacion().getObservaciones());
        }

        dto.setRecomendacionIa(entidad.getRecomendacionIa());

        return dto;
    }
}