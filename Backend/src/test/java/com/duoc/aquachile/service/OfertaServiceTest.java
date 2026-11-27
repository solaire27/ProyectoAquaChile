package com.duoc.aquachile.service;

import com.duoc.aquachile.dto.OfertaRequestDTO;
import com.duoc.aquachile.exception.ResourceNotFoundException;
import com.duoc.aquachile.model.Oferta;
import com.duoc.aquachile.repository.OfertaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OfertaServiceTest {

    @Mock
    private OfertaRepository ofertaRepository;

    @InjectMocks
    private OfertaService ofertaService;

    private OfertaRequestDTO dto;
    private Oferta oferta;

    @BeforeEach
    void setUp() {
        dto = new OfertaRequestDTO();
        dto.setTituloCargo("Desarrollador Java");
        dto.setFamiliaCargo("TI");
        dto.setUbicacion("Puerto Montt");
        dto.setModalidad("Híbrido");
        dto.setDescripcion("Desarrollo backend Spring Boot");
        dto.setFuncionesPrincipales("API REST");
        dto.setRequisitos("Java 21");
        dto.setBeneficios("Seguro complementario");
        dto.setRangoSalarial("$1.500.000 - $1.800.000");
        dto.setCuposDisponibles(2);

        oferta = new Oferta();
        oferta.setId(1L);
        oferta.setTituloCargo("Desarrollador Java");
        oferta.setEstadoActivo(true);
    }

    @Test
    void crearOferta_MapeaYGuardaCorrectamente() {
        when(ofertaRepository.save(any(Oferta.class))).thenAnswer(inv -> inv.getArgument(0));

        Oferta creada = ofertaService.crearOferta(dto);

        assertEquals("Desarrollador Java", creada.getTituloCargo());
        assertEquals("Puerto Montt", creada.getUbicacion());
        assertEquals(2, creada.getCuposDisponibles());
        verify(ofertaRepository).save(any(Oferta.class));
    }

    @Test
    void obtenerTodasYActivas_RetornanListas() {
        when(ofertaRepository.findAll()).thenReturn(List.of(oferta));
        when(ofertaRepository.findByEstadoActivoTrue()).thenReturn(List.of(oferta));

        assertEquals(1, ofertaService.obtenerTodas().size());
        assertEquals(1, ofertaService.obtenerActivas().size());
    }

    @Test
    void actualizarOferta_Existe_ActualizaYGuarda() {
        when(ofertaRepository.findById(1L)).thenReturn(Optional.of(oferta));
        when(ofertaRepository.save(any(Oferta.class))).thenAnswer(inv -> inv.getArgument(0));

        Oferta actualizada = ofertaService.actualizarOferta(1L, dto);

        assertEquals("Híbrido", actualizada.getModalidad());
    }

    @Test
    void actualizarOferta_NoExiste_LanzaExcepcion() {
        when(ofertaRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> ofertaService.actualizarOferta(99L, dto));
    }

    @Test
    void cambiarEstado_ActualizaEstadoActivo() {
        when(ofertaRepository.findById(1L)).thenReturn(Optional.of(oferta));
        when(ofertaRepository.save(any(Oferta.class))).thenAnswer(inv -> inv.getArgument(0));

        Oferta cerrada = ofertaService.cambiarEstado(1L, false);

        assertFalse(cerrada.getEstadoActivo());
    }

    @Test
    void eliminarOferta_Existe_EliminaDeRepositorio() {
        when(ofertaRepository.findById(1L)).thenReturn(Optional.of(oferta));

        ofertaService.eliminarOferta(1L);

        verify(ofertaRepository).delete(oferta);
    }

    @Test
    void eliminarOferta_NoExiste_LanzaExcepcion() {
        when(ofertaRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> ofertaService.eliminarOferta(99L));
    }
}