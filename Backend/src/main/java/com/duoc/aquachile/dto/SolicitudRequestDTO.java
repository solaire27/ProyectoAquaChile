package com.duoc.aquachile.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SolicitudRequestDTO {

    @NotNull(message = "El ID del candidato es obligatorio")
    private Long candidatoId;

    // El responsable puede ser nulo al crear la solicitud si aún no se asigna
    private Long responsableId;

    @NotBlank(message = "El cargo es obligatorio")
    private String cargo;

    @NotBlank(message = "La familia de cargo es obligatoria")
    private String familiaCargo;

    private String observaciones;
}