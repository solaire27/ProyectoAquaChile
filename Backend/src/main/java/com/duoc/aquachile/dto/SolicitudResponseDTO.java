package com.duoc.aquachile.dto;

import com.duoc.aquachile.model.EstadoSolicitud;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SolicitudResponseDTO {

    private Long id;

    // Datos del candidato asociado
    private Long candidatoId;
    private String nombreCandidato;

    // Datos del responsable (puede ser null)
    private Long responsableId;
    private String nombreResponsable;

    private String cargo;
    private String familiaCargo;
    private LocalDateTime fechaSolicitud;
    private EstadoSolicitud estado;
    private String observaciones;
}