package com.duoc.aquachile.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class EntrevistaRequestDTO {

    @NotNull(message = "La fecha y hora de la entrevista son obligatorias")
    private LocalDateTime fechaHora;

    private Integer duracionMinutos = 45;
    private String modalidad = "Online (Google Meet)";
    private String notas;
    private Long responsableId;
    private Boolean moverAEnProceso = false;
}