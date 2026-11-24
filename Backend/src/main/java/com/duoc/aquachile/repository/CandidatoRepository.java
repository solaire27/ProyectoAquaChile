package com.duoc.aquachile.repository;

import com.duoc.aquachile.model.Candidato;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CandidatoRepository extends JpaRepository<Candidato, Long> {
    Optional<Candidato> findByRut(String rut);
    Optional<Candidato> findByCorreoIgnoreCase(String correo);
}