package com.duoc.aquachile.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CandidatoRequestDTO {

    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    @NotBlank(message = "El correo es obligatorio")
    @Pattern(regexp = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$", message = "Formato de correo inválido")
    private String correo;

    private String telefono;

    @NotBlank(message = "El cargo al que postula es obligatorio")
    private String cargoPostulacion;

    @NotBlank(message = "La familia de cargo es obligatoria")
    private String familiaCargo;

    @NotBlank(message = "El RUT es obligatorio")
    private String rut;

    @NotNull(message = "La fecha de nacimiento es obligatoria")
    private LocalDate fechaNacimiento;

    private String urlCv;
}