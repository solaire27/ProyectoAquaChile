package com.duoc.aquachile.repository;

import com.duoc.aquachile.model.Oferta;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface OfertaRepository extends JpaRepository<Oferta, Long> {

    // Este metodo lo usará la Landing Page para no mostrar trabajos cerrados
    List<Oferta> findByEstadoActivoTrue();

    // Para evitar duplicados al precargar las ofertas base en DataInitializer
    boolean existsByTituloCargoIgnoreCase(String tituloCargo);

    Optional<Oferta> findFirstByTituloCargoIgnoreCaseAndEstadoActivoTrue(String tituloCargo);
}