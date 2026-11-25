package com.duoc.aquachile.dto;

import com.duoc.aquachile.model.EstadoSolicitud;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SolicitudResponseDTO {

    private Long id;

    private Long candidatoId;
    private String nombreCandidato;
    private String urlCv;

    private Long responsableId;
    private String nombreResponsable;

    private String cargo;
    private String familiaCargo;
    private LocalDateTime fechaSolicitud;
    private EstadoSolicitud estado;
    private String observaciones;

    private String resultadoEvaluacion;
    private String observacionEvaluacion;

    private String recomendacionIa;

    // --- Entrevista Agendada ---
    private LocalDateTime fechaEntrevista;
    private Integer duracionEntrevistaMinutos;
    private String modalidadEntrevista;
    private String notasEntrevista;
}