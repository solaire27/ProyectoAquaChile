package com.duoc.aquachile.dto;

import com.duoc.aquachile.model.EstadoSolicitud;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SolicitudEstadoUpdateDTO {

    @NotNull(message = "El nuevo estado es obligatorio")
    private EstadoSolicitud estado;
}