package com.duoc.aquachile.controller;

import com.duoc.aquachile.dto.EntrevistaRequestDTO;
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
import org.springframework.security.core.Authentication;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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

    @PreAuthorize("hasAnyRole('ADMIN', 'PSICOLOGO', 'ANALISTA')")
    @GetMapping
    public ResponseEntity<List<SolicitudResponseDTO>> listar(){
        List<SolicitudResponseDTO> lista = solicitudService.obtenerTodas().stream()
                .map(this::mapearAResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(lista);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'PSICOLOGO', 'ANALISTA')")
    @GetMapping("/{id}")
    public ResponseEntity<SolicitudResponseDTO> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(mapearAResponse(solicitudService.obtenerPorId(id)));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'PSICOLOGO')")
    @PatchMapping("/{id}/desasignar")
    public ResponseEntity<SolicitudResponseDTO> desasignar(
            @PathVariable Long id,
            Authentication authentication) {
        String correoUsuario = authentication != null ? authentication.getName() : null;
        boolean esAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        return ResponseEntity.ok(mapearAResponse(solicitudService.desasignarSolicitud(id, correoUsuario, esAdmin)));
    }
    @PreAuthorize("hasAnyRole('ADMIN', 'PSICOLOGO')")
    @PatchMapping("/{id}/estado")
    public ResponseEntity<SolicitudResponseDTO> actualizarEstado(@PathVariable Long id, @Valid @RequestBody SolicitudEstadoUpdateDTO dto) {
        return ResponseEntity.ok(mapearAResponse(solicitudService.actualizarEstado(id, dto)));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'PSICOLOGO')")
    @PostMapping("/{id}/entrevista")
    public ResponseEntity<Object> agendarEntrevista(
            @PathVariable Long id,
            @Valid @RequestBody EntrevistaRequestDTO dto) {

        SolicitudEvaluacion actualizada = solicitudService.agendarEntrevista(id, dto);
        String googleCalendarUrl = construirUrlGoogleCalendar(actualizada);

        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("mensaje", "Entrevista agendada correctamente");
        respuesta.put("googleCalendarUrl", googleCalendarUrl);
        respuesta.put("solicitud", mapearAResponse(actualizada));

        return ResponseEntity.ok(respuesta);
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

    private String construirUrlGoogleCalendar(SolicitudEvaluacion sol) {
        if (sol.getFechaEntrevista() == null) return "";
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss");
        LocalDateTime inicio = sol.getFechaEntrevista();
        int duracion = sol.getDuracionEntrevistaMinutos() != null ? sol.getDuracionEntrevistaMinutos() : 45;
        LocalDateTime fin = inicio.plusMinutes(duracion);

        String titulo = "Entrevista Psicolaboral AquaChile — " + sol.getCandidato().getNombre() + " (" + sol.getCargo() + ")";
        String detalles = "Candidato: " + sol.getCandidato().getNombre()
                + "\nCargo: " + sol.getCargo() + " (" + sol.getFamiliaCargo() + ")"
                + "\nSolicitud: #SOL-" + sol.getId()
                + (sol.getNotasEntrevista() != null && !sol.getNotasEntrevista().isBlank()
                ? "\nNotas: " + sol.getNotasEntrevista() : "");
        String ubicacion = sol.getModalidadEntrevista() != null ? sol.getModalidadEntrevista() : "Online";

        return "https://calendar.google.com/calendar/render?action=TEMPLATE"
                + "&text=" + URLEncoder.encode(titulo, StandardCharsets.UTF_8)
                + "&dates=" + inicio.format(fmt) + "/" + fin.format(fmt)
                + "&ctz=America/Santiago"
                + "&details=" + URLEncoder.encode(detalles, StandardCharsets.UTF_8)
                + "&location=" + URLEncoder.encode(ubicacion, StandardCharsets.UTF_8);
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
        dto.setFechaEntrevista(entidad.getFechaEntrevista());
        dto.setDuracionEntrevistaMinutos(entidad.getDuracionEntrevistaMinutos());
        dto.setModalidadEntrevista(entidad.getModalidadEntrevista());
        dto.setNotasEntrevista(entidad.getNotasEntrevista());

        return dto;
    }
}