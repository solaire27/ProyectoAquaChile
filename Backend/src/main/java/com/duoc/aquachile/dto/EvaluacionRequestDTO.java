package com.duoc.aquachile.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class EvaluacionRequestDTO {

    @NotNull(message = "El ID de la solicitud es obligatorio")
    private Long solicitudId;

    @NotBlank(message = "El resultado general es obligatorio")
    private String resultadoGeneral;

    private String observaciones;
}