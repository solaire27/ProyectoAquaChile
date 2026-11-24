package com.duoc.aquachile.service;

import com.duoc.aquachile.dto.CandidatoRequestDTO;
import com.duoc.aquachile.dto.SolicitudEstadoUpdateDTO;
import com.duoc.aquachile.dto.SolicitudRequestDTO;
import com.duoc.aquachile.exception.ResourceNotFoundException;
import com.duoc.aquachile.model.Candidato;
import com.duoc.aquachile.model.EstadoSolicitud;
import com.duoc.aquachile.model.SolicitudEvaluacion;
import com.duoc.aquachile.model.Usuario;
import com.duoc.aquachile.repository.SolicitudRepository;
import com.duoc.aquachile.repository.UsuarioRepository;
import com.duoc.aquachile.service.integration.AiService;
import jakarta.validation.Valid;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
public class SolicitudService {

    private final SolicitudRepository solicitudRepository;
    private final CandidatoService candidatoService;
    private final UsuarioRepository usuarioRepository;
    private final AiService aiService;

    public SolicitudService(
            SolicitudRepository solicitudRepository,
            CandidatoService candidatoService,
            UsuarioRepository usuarioRepository,
            AiService aiService) {
        this.solicitudRepository = solicitudRepository;
        this.candidatoService = candidatoService;
        this.usuarioRepository = usuarioRepository;
        this.aiService = aiService;
    }

    public SolicitudEvaluacion crearSolicitud(@Valid CandidatoRequestDTO dto) {
        Candidato candidato = candidatoService.crearCandidato(dto, dto.getUrlCv());
        SolicitudEvaluacion solicitud = new SolicitudEvaluacion();
        solicitud.setCandidato(candidato);
        solicitud.setCargo(dto.getCargoPostulacion());
        solicitud.setFamiliaCargo(dto.getFamiliaCargo());
        solicitud.setObservaciones("Postulación ingresada automáticamente desde el portal público");
        solicitud.setEstado(EstadoSolicitud.NUEVA_POSTULACION);

        return solicitudRepository.save(solicitud);
    }

    public SolicitudEvaluacion crearSolicitud(@Valid SolicitudRequestDTO dto) {
        Candidato candidato = candidatoService.obtenerPorId(dto.getCandidatoId());
        SolicitudEvaluacion solicitud = new SolicitudEvaluacion();
        solicitud.setCandidato(candidato);
        solicitud.setCargo(dto.getCargo());
        solicitud.setFamiliaCargo(dto.getFamiliaCargo());
        solicitud.setObservaciones(dto.getObservaciones());
        solicitud.setEstado(EstadoSolicitud.PENDIENTE);

        if (dto.getResponsableId() != null) {
            Usuario responsable = usuarioRepository.findById(dto.getResponsableId())
                    .orElseThrow(() -> new ResourceNotFoundException("Usuario responsable no encontrado con ID: " + dto.getResponsableId()));
            solicitud.setResponsable(responsable);
        }

        return solicitudRepository.save(solicitud);
    }

    public List<SolicitudEvaluacion> obtenerTodas() {
        return solicitudRepository.findAll();
    }

    public SolicitudEvaluacion obtenerPorId(Long id) {
        return solicitudRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitud no encontrada con ID: " + id));
    }

    public SolicitudEvaluacion actualizarEstado(Long id, SolicitudEstadoUpdateDTO dto) {
        SolicitudEvaluacion solicitud = obtenerPorId(id);
        solicitud.setEstado(dto.getEstado());

        if (dto.getResponsableId() != null) {
            Usuario responsable = usuarioRepository.findById(dto.getResponsableId())
                    .orElseThrow(() -> new ResourceNotFoundException("Usuario responsable no encontrado con ID: " + dto.getResponsableId()));
            solicitud.setResponsable(responsable);
        }

        solicitud = solicitudRepository.save(solicitud);

        boolean sinAnalisisValido = solicitud.getRecomendacionIa() == null
                || solicitud.getRecomendacionIa().startsWith("Error")
                || solicitud.getRecomendacionIa().contains("No se recibió respuesta válida");

        if (dto.getEstado() == EstadoSolicitud.EN_PROCESO && sinAnalisisValido) {
            dispararAnalisisSiCorresponde(solicitud);
        }

        return solicitud;
    }

    public SolicitudEvaluacion reintentarAnalisisIa(Long id) {
        SolicitudEvaluacion solicitud = obtenerPorId(id);
        solicitud.setRecomendacionIa(null);
        solicitud = solicitudRepository.save(solicitud);
        dispararAnalisisSiCorresponde(solicitud);
        return solicitud;
    }

    private void dispararAnalisisSiCorresponde(SolicitudEvaluacion solicitud) {
        if (solicitud.getCandidato() != null && solicitud.getCandidato().getUrlCv() != null && !solicitud.getCandidato().getUrlCv().isBlank()) {
            Long solicitudId = solicitud.getId();
            String urlCv = solicitud.getCandidato().getUrlCv();
            String cargo = solicitud.getCargo();
            CompletableFuture.runAsync(() -> procesarEvaluacionEnSegundoPlano(solicitudId, urlCv, cargo));
        } else {
            solicitud.setRecomendacionIa("El candidato no adjuntó un archivo CV para analizar.");
            solicitudRepository.save(solicitud);
        }
    }

    @Async
    public void procesarEvaluacionEnSegundoPlano(Long solicitudId, String urlCv, String cargo) {
        try {
            String recomendacion = aiService.evaluarCvConIA(urlCv, cargo);
            SolicitudEvaluacion solicitud = obtenerPorId(solicitudId);
            solicitud.setRecomendacionIa(recomendacion);
            solicitudRepository.save(solicitud);
        } catch (Exception e) {
            System.err.println("Error procesando IA en segundo plano para la solicitud " + solicitudId + ": " + e.getMessage());
        }
    }

    public SolicitudEvaluacion crearSolicitudAutomatica(Long candidatoId, String cargo, String familiaCargo) {
        Candidato candidato = candidatoService.obtenerPorId(candidatoId);

        SolicitudEvaluacion solicitud = new SolicitudEvaluacion();
        solicitud.setCandidato(candidato);
        solicitud.setCargo(cargo);
        solicitud.setFamiliaCargo(familiaCargo);
        solicitud.setObservaciones("Postulación generada automáticamente desde portal público");
        solicitud.setEstado(EstadoSolicitud.NUEVA_POSTULACION);

        return solicitudRepository.save(solicitud);
    }

    public void eliminarSolicitud(Long id) {
        SolicitudEvaluacion solicitud = obtenerPorId(id);
        solicitudRepository.delete(solicitud);
    }

    public SolicitudEvaluacion consultarSolicitudPublica(String identificador, String correo) {
        String idLimpio = identificador.trim();
        String correoLimpio = correo.trim();

        return solicitudRepository
                .findFirstByCandidatoRutIgnoreCaseAndCandidatoCorreoIgnoreCaseOrderByFechaSolicitudDesc(idLimpio, correoLimpio)
                .or(() -> solicitudRepository
                        .findFirstByCandidatoNombreIgnoreCaseAndCandidatoCorreoIgnoreCaseOrderByFechaSolicitudDesc(idLimpio, correoLimpio))
                .orElseThrow(() -> new ResourceNotFoundException("No se encontraron postulaciones asociadas a los datos ingresados"));
    }

    public String consultarEstadoPublico(String identificador, String correo) {
        SolicitudEvaluacion solicitud = solicitudRepository
                .findFirstByCandidatoNombreIgnoreCaseAndCandidatoCorreoIgnoreCaseOrderByFechaSolicitudDesc(identificador, correo)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontraron postulaciones asociadas a los datos ingresados"));

        return solicitud.getEstado().name();
    }
    public List<SolicitudEvaluacion> buscarSolicitudesPublicas(String correo, String nombre) {
        if (correo != null && !correo.isBlank()) {
            return solicitudRepository.findByCandidatoCorreoIgnoreCaseOrderByFechaSolicitudDesc(correo.trim());
        }
        if (nombre != null && !nombre.isBlank()) {
            return solicitudRepository.findByCandidatoNombreContainingIgnoreCaseOrderByFechaSolicitudDesc(nombre.trim());
        }
        return List.of();
    }
}