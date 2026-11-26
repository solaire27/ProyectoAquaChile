package com.duoc.aquachile.dto;

import com.duoc.aquachile.model.RolUsuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UsuarioUpdateDTO {

    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "Debe tener un formato de correo válido")
    private String correo;

    @NotNull(message = "El rol es obligatorio")
    private RolUsuario rol;

    // Opcional: si viene vacío o null, se conserva la contraseña actual
    private String password;
}