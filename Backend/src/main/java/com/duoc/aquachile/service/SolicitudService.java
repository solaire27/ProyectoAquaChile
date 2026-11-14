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

        // Guarda el estado INMEDIATAMENTE
        solicitud = solicitudRepository.save(solicitud);

        // Si el estado es EN_PROCESO, dispara el análisis de la IA en segundo plano
        if (dto.getEstado() == EstadoSolicitud.EN_PROCESO && solicitud.getRecomendacionIa() == null) {
            if (solicitud.getCandidato() != null && solicitud.getCandidato().getUrlCv() != null) {
                String urlCv = solicitud.getCandidato().getUrlCv();
                String cargo = solicitud.getCargo();
                // Esta llamada no bloquea el hilo principal
                procesarEvaluacionEnSegundoPlano(solicitud.getId(), urlCv, cargo);
            } else {
                solicitud.setRecomendacionIa("El candidato no adjuntó un archivo CV para analizar.");
                solicitudRepository.save(solicitud);
            }
        }

        return solicitud;
    }

    // --- NUEVO MÉTODO: Ejecución Asíncrona de IA ---
    @Async
    public void procesarEvaluacionEnSegundoPlano(Long solicitudId, String urlCv, String cargo) {
        try {
            // Llama al servicio lento (Supabase + Gemini)
            String recomendacion = aiService.evaluarCvConIA(urlCv, cargo);

            // Refresca la entidad de la base de datos
            SolicitudEvaluacion solicitud = obtenerPorId(solicitudId);
            solicitud.setRecomendacionIa(recomendacion);

            // Guarda el resultado final
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

    public String consultarEstadoPublico( String identificador, String correo) {
        SolicitudEvaluacion solicitud = solicitudRepository
                .findFirstByCandidatoNombreIgnoreCaseAndCandidatoCorreoIgnoreCaseOrderByFechaSolicitudDesc(identificador, correo)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontraron postulaciones asociadas a los datos ingresados"));

        return solicitud.getEstado().name();
    }
}