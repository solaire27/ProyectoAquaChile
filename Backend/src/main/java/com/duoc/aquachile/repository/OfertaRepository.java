package com.duoc.aquachile.repository;

import com.duoc.aquachile.model.Oferta;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OfertaRepository extends JpaRepository<Oferta, Long> {

    // Este método lo usará la Landing Page para no mostrar trabajos cerrados
    List<Oferta> findByEstadoActivoTrue();
}