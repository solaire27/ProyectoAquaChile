package com.duoc.aquachile.controller;

import com.duoc.aquachile.dto.AuthResponseDTO;
import com.duoc.aquachile.dto.UsuarioLoginDTO;
import com.duoc.aquachile.dto.UsuarioRegistroDTO;
import com.duoc.aquachile.model.RolUsuario;
import com.duoc.aquachile.model.Usuario;
import com.duoc.aquachile.security.JwtService;
import com.duoc.aquachile.service.UsuarioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private UsuarioService usuarioService;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthController authController;

    private Usuario usuario;

    @BeforeEach
    void setUp() {
        usuario = new Usuario();
        usuario.setId(1L);
        usuario.setNombre("Admin AquaChile");
        usuario.setCorreo("admin@aquachile.com");
        usuario.setRol(RolUsuario.ADMIN);
    }

    @Test
    void login_CredencialesValidas_RetornaOkConTokenYDatos() {
        UsuarioLoginDTO dto = new UsuarioLoginDTO();
        dto.setCorreo("admin@aquachile.com");
        dto.setPassword("123456");

        when(usuarioService.validarCredenciales("admin@aquachile.com", "123456")).thenReturn(usuario);
        when(jwtService.generarToken(usuario)).thenReturn("jwt-token-mock");

        ResponseEntity<AuthResponseDTO> respuesta = authController.login(dto);

        assertEquals(HttpStatus.OK, respuesta.getStatusCode());
        assertNotNull(respuesta.getBody());
        assertEquals("jwt-token-mock", respuesta.getBody().getToken());
        assertEquals("admin@aquachile.com", respuesta.getBody().getCorreo());
        verify(jwtService).generarToken(usuario);
    }

    @Test
    void registrarInterno_DatosValidos_RetornaCreated() {
        UsuarioRegistroDTO dto = new UsuarioRegistroDTO();
        dto.setNombre("Nuevo Psicólogo");
        dto.setCorreo("psi@aquachile.com");
        dto.setPassword("Clave123");
        dto.setRol(RolUsuario.PSICOLOGO);

        when(usuarioService.crearUsuario(dto)).thenReturn(usuario);

        ResponseEntity<Usuario> respuesta = authController.registrarInterno(dto);

        assertEquals(HttpStatus.CREATED, respuesta.getStatusCode());
        assertEquals(usuario, respuesta.getBody());
    }
}