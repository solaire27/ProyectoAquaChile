package com.duoc.aquachile.repository;

import com.duoc.aquachile.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    // Spring Data JPA crea la consulta SQL automáticamente basándose en el nombre del método
    Optional<Usuario> findByCorreo(String correo);
}