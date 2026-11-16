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

import java.time.LocalDateTime;
import java.util.List;

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

    @GetMapping("/estado")
    public ResponseEntity<?> consultarEstadoPostulacion(
            @RequestParam(required = false) String correo,
            @RequestParam(required = false) String nombre) {

        List<SolicitudEvaluacion> resultados;

        if (correo != null && !correo.trim().isEmpty()) {
            resultados = solicitudRepository.findByCandidatoCorreoIgnoreCaseOrderByFechaSolicitudDesc(correo.trim());
        } else if (nombre != null && !nombre.trim().isEmpty()) {
            resultados = solicitudRepository.findByCandidatoNombreContainingIgnoreCaseOrderByFechaSolicitudDesc(nombre.trim());
        } else {
            return ResponseEntity.badRequest().body("Debes ingresar un correo electrónico o nombre para realizar la búsqueda.");
        }

        List<EstadoPostulacionResponse> respuesta = resultados.stream()
                .map(s -> new EstadoPostulacionResponse(
                        s.getId(),
                        s.getCandidato().getNombre(),
                        s.getCandidato().getCorreo(),
                        s.getCargo(),
                        s.getFamiliaCargo(),
                        s.getFechaSolicitud(),
                        s.getEstado()
                ))
                .toList();

        return ResponseEntity.ok(respuesta);
    }
}