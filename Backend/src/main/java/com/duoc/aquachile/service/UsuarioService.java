package com.duoc.aquachile.service;

import com.duoc.aquachile.dto.UsuarioRegistroDTO;
import com.duoc.aquachile.model.Usuario;
import com.duoc.aquachile.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder; // Herramienta de Spring para BCrypt

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Usuario crearUsuario(UsuarioRegistroDTO dto) {
        // 1. Evitar correos duplicados
        if (usuarioRepository.findByCorreo(dto.getCorreo()).isPresent()) {
            throw new RuntimeException("El correo ya se encuentra registrado en el sistema");
        }

        // 2. Mapear datos
        Usuario usuario = new Usuario();
        usuario.setNombre(dto.getNombre());
        usuario.setCorreo(dto.getCorreo());
        usuario.setRol(dto.getRol());

        // 3. ENCRIPTAR LA CONTRASEÑA antes de guardarla en la Base de Datos
        usuario.setPassword(passwordEncoder.encode(dto.getPassword()));

        return usuarioRepository.save(usuario);
    }

    public Usuario validarCredenciales(String correo, String passwordIngresada) {
        // 1. Buscar si el usuario existe
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new RuntimeException("Credenciales inválidas")); // Mensaje genérico por seguridad

        // 2. Comparar la contraseña limpia con el hash encriptado de la BD
        if (!passwordEncoder.matches(passwordIngresada, usuario.getPassword())) {
            throw new RuntimeException("Credenciales inválidas");
        }

        return usuario;
    }
}