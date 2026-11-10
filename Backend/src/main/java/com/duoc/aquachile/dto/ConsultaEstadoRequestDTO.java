package com.duoc.aquachile.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ConsultaEstadoRequestDTO {

    // Puede ser el RUT (si lo agregas a Candidato) o el Nombre completo
    @NotBlank(message = "El identificador (RUT o Nombre) es obligatorio")
    private String identificador;

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "Formato de correo inválido")
    private String correo;
}