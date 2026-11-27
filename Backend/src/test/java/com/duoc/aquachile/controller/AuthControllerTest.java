package com.duoc.aquachile.controller;
import com.duoc.aquachile.dto.*;
import com.duoc.aquachile.model.*;
import com.duoc.aquachile.security.JwtService;
import com.duoc.aquachile.service.UsuarioService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {
    @Mock private UsuarioService usuarioService;
    @Mock private JwtService jwtService;
    @InjectMocks private AuthController authController;

    @Test void loginYRegistro() {
        UsuarioLoginDTO dto = new UsuarioLoginDTO();
        dto.setCorreo("admin@aquachile.cl"); dto.setPassword("123456");
        Usuario u = new Usuario(); u.setId(1L); u.setNombre("Admin"); u.setCorreo("admin@aquachile.cl"); 
        when(usuarioService.validarCredenciales("admin@aquachile.cl", "123456")).thenReturn(u);
        when(jwtService.generarToken(u)).thenReturn("tok");
        assertEquals("tok", authController.login(dto).getBody().getToken());

        UsuarioRegistroDTO reg = new UsuarioRegistroDTO();
        when(usuarioService.crearUsuario(reg)).thenReturn(u);
        assertEquals(HttpStatus.CREATED, authController.registrarInterno(reg).getStatusCode());
    }
}
