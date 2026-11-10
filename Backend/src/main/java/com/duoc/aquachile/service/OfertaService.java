package com.duoc.aquachile.service;

import com.duoc.aquachile.dto.OfertaRequestDTO;
import com.duoc.aquachile.model.Oferta;
import com.duoc.aquachile.repository.OfertaRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class OfertaService {

    private final OfertaRepository ofertaRepository;

    public OfertaService(OfertaRepository ofertaRepository) {
        this.ofertaRepository = ofertaRepository;
    }

    public Oferta crearOferta(OfertaRequestDTO dto) {
        Oferta oferta = new Oferta();
        oferta.setTituloCargo(dto.getTituloCargo());
        oferta.setFamiliaCargo(dto.getFamiliaCargo());
        oferta.setDescripcion(dto.getDescripcion());
        oferta.setCuposDisponibles(dto.getCuposDisponibles());
        // estadoActivo y fechaPublicacion se asignan solos por el modelo
        return ofertaRepository.save(oferta);
    }

    // Para el Dashboard del Admin (ve todo, activas y cerradas)
    public List<Oferta> obtenerTodas() {
        return ofertaRepository.findAll();
    }

    // Para la Landing Page de Amador (solo ve las activas)
    public List<Oferta> obtenerActivas() {
        return ofertaRepository.findByEstadoActivoTrue();
    }

    public Oferta actualizarOferta(Long id, OfertaRequestDTO dto) {
        Oferta oferta = ofertaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Oferta no encontrada"));

        oferta.setTituloCargo(dto.getTituloCargo());
        oferta.setFamiliaCargo(dto.getFamiliaCargo());
        oferta.setDescripcion(dto.getDescripcion());
        oferta.setCuposDisponibles(dto.getCuposDisponibles());

        return ofertaRepository.save(oferta);
    }

    // Método para apagar o encender una oferta sin borrarla
    public Oferta cambiarEstado(Long id, boolean nuevoEstado) {
        Oferta oferta = ofertaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Oferta no encontrada"));
        oferta.setEstadoActivo(nuevoEstado);
        return ofertaRepository.save(oferta);
    }

    public void eliminarOferta(Long id) {
        ofertaRepository.deleteById(id);
    }
}