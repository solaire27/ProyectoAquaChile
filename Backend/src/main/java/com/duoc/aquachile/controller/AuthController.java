package com.duoc.aquachile.controller;

import com.duoc.aquachile.dto.AuthResponseDTO;
import com.duoc.aquachile.dto.UsuarioLoginDTO;
import com.duoc.aquachile.dto.UsuarioRegistroDTO;
import com.duoc.aquachile.model.Usuario;
import com.duoc.aquachile.service.UsuarioService; // Deberás crear este servicio
import com.duoc.aquachile.security.JwtService; // Servicio auxiliar para crear el string del Token
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UsuarioService usuarioService;
    private final JwtService jwtService;

    public AuthController(UsuarioService usuarioService, JwtService jwtService) {
        this.usuarioService = usuarioService;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody UsuarioLoginDTO dto) {
        // 1. Validar las credenciales contra la BD (Spring Security puede hacer esto,
        // pero delegarlo a tu servicio es más fácil para este MVP)
        Usuario usuario = usuarioService.validarCredenciales(dto.getCorreo(), dto.getPassword());

        // 2. Generar el token firmado
        String token = jwtService.generarToken(usuario);

        // 3. Devolver los datos sin exponer la contraseña
        return ResponseEntity.ok(new AuthResponseDTO(
                token,
                usuario.getId(),
                usuario.getNombre(),
                usuario.getCorreo(),
                usuario.getRol()
        ));
    }

    // Proteger este endpoint: Solo alguien con token válido y rol ADMIN puede ejecutarlo
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/registro")
    public ResponseEntity<Usuario> registrarInterno(@Valid @RequestBody UsuarioRegistroDTO dto) {
        return new ResponseEntity<>(usuarioService.crearUsuario(dto), HttpStatus.CREATED);
    }
}