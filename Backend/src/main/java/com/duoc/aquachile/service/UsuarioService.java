package com.duoc.aquachile.service;

import com.duoc.aquachile.dto.UsuarioRegistroDTO;
import com.duoc.aquachile.dto.UsuarioResponseDTO;
import com.duoc.aquachile.dto.UsuarioUpdateDTO;
import com.duoc.aquachile.exception.ConflictException;
import com.duoc.aquachile.model.SolicitudEvaluacion;
import com.duoc.aquachile.model.Usuario;
import com.duoc.aquachile.repository.SolicitudRepository;
import com.duoc.aquachile.repository.UsuarioRepository;
import com.duoc.aquachile.service.integration.EmailService;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final SolicitudRepository solicitudRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public UsuarioService(
            UsuarioRepository usuarioRepository,
            SolicitudRepository solicitudRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService) {
        this.usuarioRepository = usuarioRepository;
        this.solicitudRepository = solicitudRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    public List<UsuarioResponseDTO> listarUsuarios() {
        return usuarioRepository.findAll(Sort.by(Sort.Direction.ASC, "id"))
                .stream()
                .map(UsuarioResponseDTO::fromEntity)
                .toList();
    }

    public Usuario crearUsuario(UsuarioRegistroDTO dto) {
        String correoLimpio = dto.getCorreo().trim();

        if (usuarioRepository.findByCorreo(correoLimpio).isPresent()) {
            throw new ConflictException("El correo ya se encuentra registrado en el sistema");
        }

        String passwordPlano = dto.getPassword();

        Usuario usuario = new Usuario();
        usuario.setNombre(dto.getNombre().trim());
        usuario.setCorreo(correoLimpio);
        usuario.setRol(dto.getRol());
        usuario.setPassword(passwordEncoder.encode(passwordPlano));

        Usuario guardado = usuarioRepository.save(usuario);

        if (dto.getCorreoNotificacion() != null && !dto.getCorreoNotificacion().isBlank()) {
            emailService.enviarCredencialesNuevoUsuario(
                    dto.getCorreoNotificacion().trim(),
                    guardado.getNombre(),
                    guardado.getCorreo(),
                    passwordPlano,
                    guardado.getRol().name()
            );
        }

        return guardado;
    }

    public UsuarioResponseDTO actualizarUsuario(Long id, UsuarioUpdateDTO dto) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        String correoLimpio = dto.getCorreo().trim();
        Optional<Usuario> existentePorCorreo = usuarioRepository.findByCorreo(correoLimpio);
        if (existentePorCorreo.isPresent() && !existentePorCorreo.get().getId().equals(id)) {
            throw new ConflictException("El correo ya está en uso por otro usuario");
        }

        usuario.setNombre(dto.getNombre().trim());
        usuario.setCorreo(correoLimpio);
        usuario.setRol(dto.getRol());

        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            usuario.setPassword(passwordEncoder.encode(dto.getPassword()));
        }

        return UsuarioResponseDTO.fromEntity(usuarioRepository.save(usuario));
    }

    @Transactional
    public void eliminarUsuario(Long id, String correoAdminActual) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        if (correoAdminActual != null && usuario.getCorreo().equalsIgnoreCase(correoAdminActual.trim())) {
            throw new ConflictException("No puedes eliminar tu propia cuenta de administrador");
        }

        // Desvincular solicitudes asociadas para evitar error de llave foránea en PostgreSQL
        List<SolicitudEvaluacion> solicitudesAsignadas = solicitudRepository.findByResponsableId(id);
        if (!solicitudesAsignadas.isEmpty()) {
            for (SolicitudEvaluacion sol : solicitudesAsignadas) {
                sol.setResponsable(null);
            }
            solicitudRepository.saveAll(solicitudesAsignadas);
        }

        usuarioRepository.delete(usuario);
    }

    public Usuario validarCredenciales(String correo, String passwordIngresada) {
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new RuntimeException("Credenciales inválidas"));

        if (!passwordEncoder.matches(passwordIngresada, usuario.getPassword())) {
            throw new RuntimeException("Credenciales inválidas");
        }

        return usuario;
    }
}