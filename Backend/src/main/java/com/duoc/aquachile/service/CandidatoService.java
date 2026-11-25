package com.duoc.aquachile.service;

import com.duoc.aquachile.dto.CandidatoRequestDTO;
import com.duoc.aquachile.exception.ConflictException;
import com.duoc.aquachile.exception.ResourceNotFoundException;
import com.duoc.aquachile.model.Candidato;
import com.duoc.aquachile.repository.CandidatoRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CandidatoService {

    private final CandidatoRepository candidatoRepository;

    public CandidatoService(CandidatoRepository candidatoRepository) {
        this.candidatoRepository = candidatoRepository;
    }

    public Candidato crearCandidato(CandidatoRequestDTO dto, String rutaCv) {
        String rutLimpio = dto.getRut() != null ? dto.getRut().trim() : "";
        String correoLimpio = dto.getCorreo() != null ? dto.getCorreo().trim() : "";
        String cvFinal = (rutaCv != null && !rutaCv.isBlank()) ? rutaCv : dto.getUrlCv();

        Optional<Candidato> porRut = candidatoRepository.findByRut(rutLimpio);


        // Si el RUT ya existe, reutilizamos al candidato para que pueda postular a otros cargos
        if (porRut.isPresent()) {
            Candidato existente = porRut.get();

            existente.setNombre(dto.getNombre());
            existente.setCorreo(correoLimpio);
            existente.setTelefono(dto.getTelefono());
            existente.setFechaNacimiento(dto.getFechaNacimiento());
            existente.setCargoPostulacion(dto.getCargoPostulacion());
            existente.setFamiliaCargo(dto.getFamiliaCargo());

            if (cvFinal != null && !cvFinal.isBlank()) {
                existente.setUrlCv(cvFinal);
            }

            return candidatoRepository.save(existente);
        }

        // Si es un RUT nuevo, verificamos que el correo no pertenezca a otra persona

        Candidato candidato = new Candidato();
        candidato.setNombre(dto.getNombre());
        candidato.setCorreo(correoLimpio);
        candidato.setTelefono(dto.getTelefono());
        candidato.setCargoPostulacion(dto.getCargoPostulacion());
        candidato.setFamiliaCargo(dto.getFamiliaCargo());
        candidato.setRut(rutLimpio);
        candidato.setFechaNacimiento(dto.getFechaNacimiento());
        candidato.setUrlCv(cvFinal);

        return candidatoRepository.save(candidato);
    }

    public Candidato crearCandidato(CandidatoRequestDTO dto) {
        return crearCandidato(dto, dto.getUrlCv());
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
        String rutLimpio = dto.getRut() != null ? dto.getRut().trim() : "";
        String correoLimpio = dto.getCorreo() != null ? dto.getCorreo().trim() : "";

        candidatoRepository.findByRut(rutLimpio)
                .filter(c -> !c.getId().equals(id))
                .ifPresent(c -> {
                    throw new ConflictException("El RUT ingresado ya pertenece a otro candidato.");
                });


        candidato.setNombre(dto.getNombre());
        candidato.setCorreo(correoLimpio);
        candidato.setTelefono(dto.getTelefono());
        candidato.setCargoPostulacion(dto.getCargoPostulacion());
        candidato.setFamiliaCargo(dto.getFamiliaCargo());
        candidato.setRut(rutLimpio);
        candidato.setFechaNacimiento(dto.getFechaNacimiento());

        if (dto.getUrlCv() != null && !dto.getUrlCv().isEmpty()) {
            candidato.setUrlCv(dto.getUrlCv());
        }

        return candidatoRepository.save(candidato);
    }
}