package com.duoc.aquachile.controller;

import com.duoc.aquachile.dto.CandidatoRequestDTO;
import com.duoc.aquachile.service.CandidatoService;
import com.duoc.aquachile.service.FileStorageService;
import com.duoc.aquachile.service.SolicitudService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/postulaciones/public")
@RequiredArgsConstructor
public class PostulacionPublicaController {

    private final CandidatoService candidatoService;
    private final SolicitudService solicitudService;
    private final FileStorageService fileStorageService;

    // ¡Eliminamos el ObjectMapper de aquí!

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<String> recibirPostulacion(
            // Dejamos que Spring convierta automáticamente el JSON al DTO
            @RequestPart("candidato") CandidatoRequestDTO candidatoDto,
            @RequestPart(value = "cv", required = false) MultipartFile cv) {

        try {
            // 1. Guardar el archivo (si viene)
            String rutaCv = null;
            if (cv != null && !cv.isEmpty()) {
                rutaCv = fileStorageService.guardarArchivo(cv);
            }

            // 2. Crear el candidato
            var candidato = candidatoService.crearCandidato(candidatoDto, rutaCv);

            // 3. Delegar la creación de la solicitud automática al servicio
            solicitudService.crearSolicitudAutomatica(candidato.getId(), candidatoDto.getCargoPostulacion(), candidatoDto.getFamiliaCargo());

            return new ResponseEntity<>("Postulación recibida exitosamente", HttpStatus.CREATED);

        } catch (Exception e) {
            return new ResponseEntity<>("Error al procesar la postulación: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }
}