package com.duoc.aquachile.service;

import com.duoc.aquachile.dto.EvaluacionRequestDTO;
import com.duoc.aquachile.model.EstadoSolicitud;
import com.duoc.aquachile.model.Evaluacion;
import com.duoc.aquachile.model.SolicitudEvaluacion;
import com.duoc.aquachile.repository.EvaluacionRepository;
import com.duoc.aquachile.repository.SolicitudRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EvaluacionService {

    private final EvaluacionRepository evaluacionRepository;
    private final SolicitudService solicitudService; 
    private final SolicitudRepository solicitudRepository;

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

        return evaluacionGuardada;
    }
}