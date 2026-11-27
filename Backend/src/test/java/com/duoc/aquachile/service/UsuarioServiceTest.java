package com.duoc.aquachile.service;

import com.duoc.aquachile.dto.UsuarioRegistroDTO;
import com.duoc.aquachile.model.RolUsuario;
import com.duoc.aquachile.model.Usuario;
import com.duoc.aquachile.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UsuarioService usuarioService;

    private UsuarioRegistroDTO registroDTO;
    private Usuario usuario;

    @BeforeEach
    void setUp() {
        registroDTO = new UsuarioRegistroDTO();
        registroDTO.setNombre("Admin AquaChile");
        registroDTO.setCorreo("admin@aquachile.com");
        registroDTO.setPassword("ClaveSegura123");
        registroDTO.setRol(RolUsuario.ADMIN);

        usuario = new Usuario();
        usuario.setId(1L);
        usuario.setNombre("Admin AquaChile");
        usuario.setCorreo("admin@aquachile.com");
        usuario.setPassword("$2a$10$hashedPassword");
        usuario.setRol(RolUsuario.ADMIN);
    }

    @Test
    void crearUsuario_CorreoNuevo_EncriptaPasswordYGuarda() {
        when(usuarioRepository.findByCorreo("admin@aquachile.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("ClaveSegura123")).thenReturn("$2a$10$hashedPassword");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        Usuario creado = usuarioService.crearUsuario(registroDTO);

        assertEquals("admin@aquachile.com", creado.getCorreo());
        assertEquals("$2a$10$hashedPassword", creado.getPassword());
        verify(usuarioRepository).save(any(Usuario.class));
    }

    @Test
    void crearUsuario_CorreoDuplicado_LanzaRuntimeException() {
        when(usuarioRepository.findByCorreo("admin@aquachile.com")).thenReturn(Optional.of(usuario));

        assertThrows(RuntimeException.class, () -> usuarioService.crearUsuario(registroDTO));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void validarCredenciales_Correctas_RetornaUsuario() {
        when(usuarioRepository.findByCorreo("admin@aquachile.com")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("ClaveSegura123", "$2a$10$hashedPassword")).thenReturn(true);

        Usuario validado = usuarioService.validarCredenciales("admin@aquachile.com", "ClaveSegura123");

        assertEquals("Admin AquaChile", validado.getNombre());
    }

    @Test
    void validarCredenciales_UsuarioNoExiste_LanzaRuntimeException() {
        when(usuarioRepository.findByCorreo("otro@aquachile.com")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
                () -> usuarioService.validarCredenciales("otro@aquachile.com", "ClaveSegura123"));
    }

    @Test
    void validarCredenciales_PasswordIncorrecta_LanzaRuntimeException() {
        when(usuarioRepository.findByCorreo("admin@aquachile.com")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("Incorrecta", "$2a$10$hashedPassword")).thenReturn(false);

        assertThrows(RuntimeException.class,
                () -> usuarioService.validarCredenciales("admin@aquachile.com", "Incorrecta"));
    }
}