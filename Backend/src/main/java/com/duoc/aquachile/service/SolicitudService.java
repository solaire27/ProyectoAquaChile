package com.duoc.aquachile.service;

import com.duoc.aquachile.dto.SolicitudEstadoUpdateDTO;
import com.duoc.aquachile.dto.SolicitudRequestDTO;
import com.duoc.aquachile.exception.ResourceNotFoundException;
import com.duoc.aquachile.model.Candidato;
import com.duoc.aquachile.model.EstadoSolicitud;
import com.duoc.aquachile.model.SolicitudEvaluacion;
import com.duoc.aquachile.model.Usuario;
import com.duoc.aquachile.repository.SolicitudRepository;
import com.duoc.aquachile.repository.UsuarioRepository;
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

    public SolicitudEvaluacion crearSolicitud(SolicitudRequestDTO dto) {
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

        // --- 1. Lógica de Asignación Dinámica (Semana 2) ---
        // Si el frontend envía un responsableId (Admin asignando o Psicólogo auto-asignándose),
        // se busca en la BD y se asocia a la solicitud.
        if (dto.getResponsableId() != null) {
            Usuario responsable = usuarioRepository.findById(dto.getResponsableId())
                    .orElseThrow(() -> new ResourceNotFoundException("Usuario responsable no encontrado con ID: " + dto.getResponsableId()));
            solicitud.setResponsable(responsable);
        }

        // --- 2. Integración de Agente de IA (Semana 3) ---
        // Se dispara al pasar a etapa de evaluación (verifica si en tu Enum se llama EN_PROCESO o EN_EVALUACION)
        // y solo si aún no tiene una recomendación generada para no gastar peticiones duplicadas.
        if (dto.getEstado() == EstadoSolicitud.EN_PROCESO && solicitud.getRecomendacionIa() == null) {
            if (solicitud.getCandidato() != null && solicitud.getCandidato().getUrlCv() != null) {
                String recomendacion = aiService.evaluarCvConIA(
                        solicitud.getCandidato().getUrlCv(),
                        solicitud.getCargo()
                );
                solicitud.setRecomendacionIa(recomendacion);
            } else {
                solicitud.setRecomendacionIa("El candidato no adjuntó un archivo CV para analizar.");
            }
        }

        return solicitudRepository.save(solicitud);
    }

    public SolicitudEvaluacion crearSolicitudAutomatica(Long candidatoId, String cargo, String familiaCargo) {
        Candidato candidato = candidatoService.obtenerPorId(candidatoId);

        SolicitudEvaluacion solicitud = new SolicitudEvaluacion();
        solicitud.setCandidato(candidato);
        solicitud.setCargo(cargo);
        solicitud.setFamiliaCargo(familiaCargo);
        solicitud.setObservaciones("Postulación generada automáticamente desde portal público");
        solicitud.setEstado(EstadoSolicitud.NUEVA_POSTULACION);

        // Responsable_ID queda NULL por defecto según el diseño de la base de datos

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