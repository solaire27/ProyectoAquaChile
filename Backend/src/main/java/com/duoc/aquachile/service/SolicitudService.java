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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SolicitudService {

    private final SolicitudRepository solicitudRepository;
    private final CandidatoService candidatoService; 
    private final UsuarioRepository usuarioRepository;

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
        return solicitudRepository.save(solicitud);
    }
}