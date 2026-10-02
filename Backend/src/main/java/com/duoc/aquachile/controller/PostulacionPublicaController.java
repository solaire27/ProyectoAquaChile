package com.duoc.aquachile.controller;

import com.duoc.aquachile.dto.CandidatoRequestDTO;
import com.duoc.aquachile.dto.SolicitudRequestDTO;
import com.duoc.aquachile.model.Candidato;
import com.duoc.aquachile.model.EstadoSolicitud;
import com.duoc.aquachile.model.SolicitudEvaluacion;
import com.duoc.aquachile.service.CandidatoService;
import com.duoc.aquachile.service.FileStorageService;
import com.duoc.aquachile.service.SolicitudService;
import com.fasterxml.jackson.databind.ObjectMapper;
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
    private final ObjectMapper objectMapper;

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<String> recibirPostulacion(
            @RequestPart("candidato") String candidatoJson,
            @RequestPart("cv") MultipartFile cv) {
        
        try {
            CandidatoRequestDTO candidatoDto = objectMapper.readValue(candidatoJson, CandidatoRequestDTO.class);
           
            String rutaCv = fileStorageService.guardarArchivo(cv);

            Candidato candidato = candidatoService.crearCandidato(candidatoDto);
            candidato.setUrlCv(rutaCv);
        

            SolicitudRequestDTO solicitudDto = new SolicitudRequestDTO();
            solicitudDto.setCandidatoId(candidato.getId());
            solicitudDto.setCargo(candidatoDto.getCargoPostulacion());
            solicitudDto.setFamiliaCargo(candidatoDto.getFamiliaCargo());
            solicitudDto.setObservaciones("Postulación generada automáticamente desde portal público");
            
            SolicitudEvaluacion solicitud = solicitudService.crearSolicitud(solicitudDto);
            solicitud.setEstado(EstadoSolicitud.NUEVA_POSTULACION);

            return new ResponseEntity<>("Postulación recibida exitosamente", HttpStatus.CREATED);

        } catch (Exception e) {
            return new ResponseEntity<>("Error al procesar la postulación: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }
}