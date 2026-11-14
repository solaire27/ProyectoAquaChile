package com.duoc.aquachile.config;

import com.duoc.aquachile.model.RolUsuario;
import com.duoc.aquachile.model.Usuario;
import com.duoc.aquachile.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner cargarDatos(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Verificamos si no hay usuarios en la base de datos
            if (usuarioRepository.count() == 0) {
                Usuario admin = new Usuario();
                admin.setNombre("Admin General");
                admin.setCorreo("admin@aquachile.cl");

                // Spring Security exige que las contraseñas en la BD estén encriptadas (BCrypt)
                admin.setPassword(passwordEncoder.encode("admin123"));

                admin.setRol(RolUsuario.ADMIN); // Asegúrate de usar el valor correcto de tu Enum

                usuarioRepository.save(admin);
                System.out.println("✅ Usuario administrador creado automáticamente: admin@aquachile.cl / admin123");
            }
        };
    }
}