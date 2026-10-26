package com.duoc.aquachile.service;

import com.duoc.aquachile.dto.CandidatoRequestDTO;
import com.duoc.aquachile.exception.ResourceNotFoundException;
import com.duoc.aquachile.model.Candidato;
import com.duoc.aquachile.repository.CandidatoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CandidatoService {

    private final CandidatoRepository candidatoRepository;

    public CandidatoService(CandidatoRepository candidatoRepository) {
        this.candidatoRepository = candidatoRepository;
    }

    public Candidato crearCandidato(CandidatoRequestDTO dto, String rutaCv) {
        Candidato candidato = new Candidato();
        candidato.setNombre(dto.getNombre());
        candidato.setCorreo(dto.getCorreo());
        candidato.setTelefono(dto.getTelefono());
        candidato.setCargoPostulacion(dto.getCargoPostulacion());
        candidato.setFamiliaCargo(dto.getFamiliaCargo());
        candidato.setUrlCv(rutaCv);

        return candidatoRepository.save(candidato);
    }


    public Candidato crearCandidato(CandidatoRequestDTO dto) {
        return crearCandidato(dto, null);
    }

    public Candidato obtenerPorId(Long id) {
        return candidatoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidato no encontrado con ID: " + id));
    }


    public List<Candidato> obtenerTodos() {
        return candidatoRepository.findAll();
    }


    public Candidato actualizarCandidato(Long id, CandidatoRequestDTO dto) {
        Candidato candidato = obtenerPorId(id);
        candidato.setNombre(dto.getNombre());
        candidato.setCorreo(dto.getCorreo());
        candidato.setTelefono(dto.getTelefono());
        candidato.setCargoPostulacion(dto.getCargoPostulacion());
        candidato.setFamiliaCargo(dto.getFamiliaCargo());

        return candidatoRepository.save(candidato);
    }
}