package com.duoc.aquachile.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CandidatoRequestDTO {

    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "Debe ser un formato de correo electrónico válido")
    private String correo;

    private String telefono;

    @NotBlank(message = "El cargo al que postula es obligatorio")
    private String cargoPostulacion;

    @NotBlank(message = "La familia de cargo es obligatoria")
    private String familiaCargo;
}