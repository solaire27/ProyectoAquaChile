package com.duoc.aquachile.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OfertaRequestDTO {

    @NotBlank(message = "El título del cargo es obligatorio")
    private String tituloCargo;

    @NotBlank(message = "La familia de cargo es obligatoria")
    private String familiaCargo;

    @NotBlank(message = "La descripción es obligatoria")
    private String descripcion;

    @NotNull(message = "Debes indicar la cantidad de cupos")
    @Min(value = 1, message = "Debe haber al menos 1 cupo disponible")
    private Integer cuposDisponibles;
}