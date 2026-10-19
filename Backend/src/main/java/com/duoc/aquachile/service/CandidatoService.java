package com.duoc.aquachile.service;

import com.duoc.aquachile.dto.CandidatoRequestDTO;
import com.duoc.aquachile.exception.ResourceNotFoundException;
import com.duoc.aquachile.model.Candidato;
import com.duoc.aquachile.repository.CandidatoRepository;
import org.springframework.stereotype.Service;

@Service
public class CandidatoService {

    private final CandidatoRepository candidatoRepository;

    // Constructor explícito para inyectar el repositorio sin depender de Lombok
    public CandidatoService(CandidatoRepository candidatoRepository) {
        this.candidatoRepository = candidatoRepository;
    }

    public Candidato crearCandidato(CandidatoRequestDTO dto, String rutaCv) {
        Candidato candidato = new Candidato();
        
        // Mapeo de los atributos del DTO hacia la entidad
        candidato.setNombre(dto.getNombre());
        candidato.setCorreo(dto.getCorreo());
        candidato.setTelefono(dto.getTelefono());
        
        // Guardar la ruta del CV
        candidato.setUrlCv(rutaCv);
        
        // Nota: 'cargoPostulacion' y 'familiaCargo' se utilizan en PostulacionPublicaController
        // para crear la SolicitudEvaluacion, por lo que normalmente no se guardan en la entidad Candidato.
        
        return candidatoRepository.save(candidato);
    }

    public Candidato obtenerPorId(Long id) {
        return candidatoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidato no encontrado con ID: " + id));
    }
}