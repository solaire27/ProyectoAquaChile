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
            String nombreArchivoEnSupabase = supabaseStorageService.subirCv(cv);
            dto.setUrlCv(nombreArchivoEnSupabase); // Asignamos el nombre al DTO antes de guardarlo
        }

        SolicitudEvaluacion nuevaSolicitud = solicitudService.crearSolicitud(dto);
        return new ResponseEntity<>(nuevaSolicitud, HttpStatus.CREATED);
    }
}