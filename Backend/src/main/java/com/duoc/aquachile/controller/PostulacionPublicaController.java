package com.duoc.aquachile.controller;

import com.duoc.aquachile.dto.CandidatoRequestDTO;
import com.duoc.aquachile.dto.SolicitudRequestDTO;
import com.duoc.aquachile.model.Candidato;
import com.duoc.aquachile.service.CandidatoService;
import com.duoc.aquachile.service.FileStorageService;
import com.duoc.aquachile.service.SolicitudService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/postulaciones/public")
public class PostulacionPublicaController {

    private final CandidatoService candidatoService;
    private final SolicitudService solicitudService;
    private final FileStorageService fileStorageService;
    private final ObjectMapper objectMapper;

    public PostulacionPublicaController(
            CandidatoService candidatoService,
            SolicitudService solicitudService,
            FileStorageService fileStorageService,
            ObjectMapper objectMapper) {
        this.candidatoService = candidatoService;
        this.solicitudService = solicitudService;
        this.fileStorageService = fileStorageService;
        this.objectMapper = objectMapper;
    }

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<String> recibirPostulacion(
            @RequestPart("candidato") String candidatoJson,
            @RequestPart("cv") MultipartFile cv) {
        
        try {
            CandidatoRequestDTO candidatoDto = objectMapper.readValue(candidatoJson, CandidatoRequestDTO.class);
           
            String rutaCv = fileStorageService.guardarArchivo(cv);

            // Se pasa la ruta del CV directamente para que quede guardada en la BD
            Candidato candidato = candidatoService.crearCandidato(candidatoDto, rutaCv);

            SolicitudRequestDTO solicitudDto = new SolicitudRequestDTO();
            solicitudDto.setCandidatoId(candidato.getId());
            solicitudDto.setCargo(candidatoDto.getCargoPostulacion());
            solicitudDto.setFamiliaCargo(candidatoDto.getFamiliaCargo());
            solicitudDto.setObservaciones("Postulación generada automáticamente desde portal público");
            
            // Se guarda directamente con estado NUEVA_POSTULACION
            solicitudService.crearSolicitudPublica(solicitudDto);

            return new ResponseEntity<>("Postulación recibida exitosamente", HttpStatus.CREATED);

        } catch (Exception e) {
            return new ResponseEntity<>("Error al procesar la postulación: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }
}