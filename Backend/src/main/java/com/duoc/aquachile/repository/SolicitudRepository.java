package com.duoc.aquachile.repository;

import com.duoc.aquachile.model.EstadoSolicitud;
import com.duoc.aquachile.model.SolicitudEvaluacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SolicitudRepository extends JpaRepository<SolicitudEvaluacion, Long> {
    List<SolicitudEvaluacion> findByEstado(EstadoSolicitud estado);
    Optional<SolicitudEvaluacion> findFirstByCandidatoNombreIgnoreCaseAndCandidatoCorreoIgnoreCaseOrderByFechaSolicitudDesc(
            String nombre, String correo);
}