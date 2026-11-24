package com.duoc.aquachile.controller;

import com.duoc.aquachile.dto.CandidatoRequestDTO;
import com.duoc.aquachile.model.SolicitudEvaluacion;
import com.duoc.aquachile.service.SolicitudService;
import com.duoc.aquachile.service.integration.SupabaseStorageService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/postulaciones/public")
public class PostulacionPublicaController {

    private final SolicitudService solicitudService;
    private final SupabaseStorageService supabaseStorageService;

    public PostulacionPublicaController(SolicitudService solicitudService, SupabaseStorageService supabaseStorageService) {
        this.solicitudService = solicitudService;
        this.supabaseStorageService = supabaseStorageService;
    }

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<SolicitudEvaluacion> recibirPostulacion(
            @RequestPart("candidato") @Valid CandidatoRequestDTO dto,
            @RequestPart(value = "cv", required = false) MultipartFile cv) {

        // Si el candidato adjuntó un CV, lo subimos a Supabase
        if (cv != null && !cv.isEmpty()) {
            String rutaArchivoEnSupabase = supabaseStorageService.subirCv(cv, dto.getNombre());
            dto.setUrlCv(rutaArchivoEnSupabase);
        }

        SolicitudEvaluacion nuevaSolicitud = solicitudService.crearSolicitud(dto);
        return new ResponseEntity<>(nuevaSolicitud, HttpStatus.CREATED);
    }
    @GetMapping("/estado")
    public ResponseEntity<List<Map<String, Object>>> consultarEstadoPublico(
            @RequestParam(required = false) String correo,
            @RequestParam(required = false) String nombre) {

        List<SolicitudEvaluacion> solicitudes = solicitudService.buscarSolicitudesPublicas(correo, nombre);

        List<java.util.Map<String, Object>> respuesta = solicitudes.stream().map(s -> {
            java.util.Map<String, Object> item = new java.util.HashMap<>();
            item.put("id", s.getId());
            item.put("nombreCandidato", s.getCandidato().getNombre());
            item.put("correoCandidato", s.getCandidato().getCorreo());
            item.put("cargo", s.getCargo());
            item.put("familiaCargo", s.getFamiliaCargo());
            item.put("fechaSolicitud", s.getFechaSolicitud());
            item.put("estado", s.getEstado().name());
            return item;
        }).toList();

        return ResponseEntity.ok(respuesta);
    }
}