package com.duoc.aquachile.controller;

import com.duoc.aquachile.dto.CandidatoRequestDTO;
import com.duoc.aquachile.model.EstadoSolicitud;
import com.duoc.aquachile.model.SolicitudEvaluacion;
import com.duoc.aquachile.repository.SolicitudRepository;
import com.duoc.aquachile.service.CandidatoService;
import com.duoc.aquachile.service.FileStorageService;
import com.duoc.aquachile.service.SolicitudService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/postulaciones/public")
@RequiredArgsConstructor
public class PostulacionPublicaController {

    private final CandidatoService candidatoService;
    private final SolicitudService solicitudService;
    private final FileStorageService fileStorageService;
    private final SolicitudRepository solicitudRepository;

    public record EstadoPostulacionResponse(
            Long id,
            String nombreCandidato,
            String correoCandidato,
            String cargo,
            String familiaCargo,
            LocalDateTime fechaSolicitud,
            EstadoSolicitud estado
    ) {}

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<String> recibirPostulacion(
            @RequestPart("candidato") CandidatoRequestDTO candidatoDto,
            @RequestPart(value = "cv", required = false) MultipartFile cv) {

        try {
            String rutaCv = null;
            if (cv != null && !cv.isEmpty()) {
                rutaCv = fileStorageService.guardarArchivo(cv);
            }

            var candidato = candidatoService.crearCandidato(candidatoDto, rutaCv);
            solicitudService.crearSolicitudAutomatica(
                    candidato.getId(),
                    candidatoDto.getCargoPostulacion(),
                    candidatoDto.getFamiliaCargo()
            );

            return new ResponseEntity<>("Postulación recibida exitosamente", HttpStatus.CREATED);

        } catch (Exception e) {
            return new ResponseEntity<>("Error al procesar la postulación: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
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