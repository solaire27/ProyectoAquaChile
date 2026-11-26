package com.duoc.aquachile.service;

import com.duoc.aquachile.dto.EvaluacionRequestDTO;
import com.duoc.aquachile.model.EstadoSolicitud;
import com.duoc.aquachile.model.Evaluacion;
import com.duoc.aquachile.model.SolicitudEvaluacion;
import com.duoc.aquachile.repository.EvaluacionRepository;
import com.duoc.aquachile.repository.OfertaRepository;
import com.duoc.aquachile.repository.SolicitudRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EvaluacionService {

    private final EvaluacionRepository evaluacionRepository;
    private final SolicitudService solicitudService;
    private final SolicitudRepository solicitudRepository;
    private final OfertaRepository ofertaRepository;

    public EvaluacionService(EvaluacionRepository evaluacionRepository,
                             SolicitudService solicitudService,
                             SolicitudRepository solicitudRepository,
                             OfertaRepository ofertaRepository) {
        this.evaluacionRepository = evaluacionRepository;
        this.solicitudService = solicitudService;
        this.solicitudRepository = solicitudRepository;
        this.ofertaRepository = ofertaRepository;
    }

    @Transactional
    public Evaluacion registrarEvaluacion(EvaluacionRequestDTO dto) {
        SolicitudEvaluacion solicitud = solicitudService.obtenerPorId(dto.getSolicitudId());

        Evaluacion evaluacion = new Evaluacion();
        evaluacion.setSolicitud(solicitud);
        evaluacion.setResultadoGeneral(dto.getResultadoGeneral());
        evaluacion.setObservaciones(dto.getObservaciones());

        Evaluacion evaluacionGuardada = evaluacionRepository.save(evaluacion);

        solicitud.setEstado(EstadoSolicitud.FINALIZADA);
        solicitudRepository.save(solicitud);

        // Si el candidato resulta "Apto", descontar 1 cupo de la oferta activa y desactivarla si llega a 0
        if (dto.getResultadoGeneral() != null
                && "Apto".equalsIgnoreCase(dto.getResultadoGeneral().trim())
                && solicitud.getCargo() != null
                && !solicitud.getCargo().isBlank()) {
            ofertaRepository.findFirstByTituloCargoIgnoreCaseAndEstadoActivoTrue(solicitud.getCargo().trim())
                    .ifPresent(oferta -> {
                        int cuposActuales = oferta.getCuposDisponibles() != null ? oferta.getCuposDisponibles() : 0;
                        int nuevosCupos = Math.max(0, cuposActuales - 1);
                        oferta.setCuposDisponibles(nuevosCupos);
                        if (nuevosCupos <= 0) {
                            oferta.setEstadoActivo(false);
                        }
                        ofertaRepository.save(oferta);
                    });
        }

        return evaluacionGuardada;
    }
}