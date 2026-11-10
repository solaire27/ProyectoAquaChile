package com.duoc.aquachile.dto;

import com.duoc.aquachile.model.RolUsuario;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponseDTO {

    private String token;
    private Long id;
    private String nombre;
    private String correo;
    private RolUsuario rol;

}