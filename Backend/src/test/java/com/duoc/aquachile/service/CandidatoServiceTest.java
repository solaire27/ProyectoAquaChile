package com.duoc.aquachile.service;

import com.duoc.aquachile.dto.CandidatoRequestDTO;
import com.duoc.aquachile.exception.ConflictException;
import com.duoc.aquachile.exception.ResourceNotFoundException;
import com.duoc.aquachile.model.Candidato;
import com.duoc.aquachile.repository.CandidatoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CandidatoServiceTest {

    @Mock
    private CandidatoRepository candidatoRepository;

    @InjectMocks
    private CandidatoService candidatoService;

    private CandidatoRequestDTO dto;
    private Candidato candidato;

    @BeforeEach
    void setUp() {
        dto = new CandidatoRequestDTO();
        dto.setRut(" 12345678-9 ");
        dto.setNombre("Juan Pérez");
        dto.setCorreo(" juan@test.cl ");
        dto.setTelefono("+56912345678");
        dto.setFechaNacimiento(LocalDate.of(1995, 5, 10));
        dto.setCargoPostulacion("Operario de Planta");
        dto.setFamiliaCargo("Operativo");
        dto.setUrlCv("uploads/cv_dto.pdf");

        candidato = new Candidato();
        candidato.setId(1L);
        candidato.setRut("12345678-9");
        candidato.setNombre("Juan Pérez");
        candidato.setCorreo("juan@test.cl");
        candidato.setUrlCv("uploads/cv_antiguo.pdf");
    }

    @Test
    void crearCandidato_NuevoConRutaCv_GuardaCorrectamente() {
        when(candidatoRepository.findByRut("12345678-9")).thenReturn(Optional.empty());
        when(candidatoRepository.save(any(Candidato.class))).thenAnswer(inv -> inv.getArgument(0));

        Candidato resultado = candidatoService.crearCandidato(dto, "uploads/cv_nuevo.pdf");

        assertEquals("12345678-9", resultado.getRut());
        assertEquals("juan@test.cl", resultado.getCorreo());
        assertEquals("uploads/cv_nuevo.pdf", resultado.getUrlCv());
        verify(candidatoRepository).save(any(Candidato.class));
    }

    @Test
    void crearCandidato_ExistentePorRut_ReutilizaYActualizaDatos() {
        when(candidatoRepository.findByRut("12345678-9")).thenReturn(Optional.of(candidato));
        when(candidatoRepository.save(any(Candidato.class))).thenAnswer(inv -> inv.getArgument(0));

        Candidato resultado = candidatoService.crearCandidato(dto);

        assertEquals(1L, resultado.getId());
        assertEquals("uploads/cv_dto.pdf", resultado.getUrlCv());
        verify(candidatoRepository).save(candidato);
    }

    @Test
    void crearCandidato_ExistenteSinNuevoCv_MantieneCvAnterior() {
        dto.setUrlCv(null);
        when(candidatoRepository.findByRut("12345678-9")).thenReturn(Optional.of(candidato));
        when(candidatoRepository.save(any(Candidato.class))).thenAnswer(inv -> inv.getArgument(0));

        Candidato resultado = candidatoService.crearCandidato(dto, "  ");

        assertEquals("uploads/cv_antiguo.pdf", resultado.getUrlCv());
    }

    @Test
    void obtenerPorId_Existe_RetornaCandidato() {
        when(candidatoRepository.findById(1L)).thenReturn(Optional.of(candidato));

        Candidato resultado = candidatoService.obtenerPorId(1L);

        assertEquals("Juan Pérez", resultado.getNombre());
    }

    @Test
    void obtenerPorId_NoExiste_LanzaResourceNotFoundException() {
        when(candidatoRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> candidatoService.obtenerPorId(99L));
    }

    @Test
    void obtenerTodos_RetornaLista() {
        when(candidatoRepository.findAll()).thenReturn(List.of(candidato));

        List<Candidato> lista = candidatoService.obtenerTodos();

        assertEquals(1, lista.size());
    }

    @Test
    void actualizarCandidato_Exitoso_ActualizaCampos() {
        when(candidatoRepository.findById(1L)).thenReturn(Optional.of(candidato));
        when(candidatoRepository.findByRut("12345678-9")).thenReturn(Optional.of(candidato));
        when(candidatoRepository.save(any(Candidato.class))).thenAnswer(inv -> inv.getArgument(0));

        Candidato actualizado = candidatoService.actualizarCandidato(1L, dto);

        assertEquals("uploads/cv_dto.pdf", actualizado.getUrlCv());
        verify(candidatoRepository).save(candidato);
    }

    @Test
    void actualizarCandidato_RutDeOtroCandidato_LanzaConflictException() {
        Candidato otro = new Candidato();
        otro.setId(2L);
        otro.setRut("12345678-9");

        when(candidatoRepository.findById(1L)).thenReturn(Optional.of(candidato));
        when(candidatoRepository.findByRut("12345678-9")).thenReturn(Optional.of(otro));

        assertThrows(ConflictException.class, () -> candidatoService.actualizarCandidato(1L, dto));
        verify(candidatoRepository, never()).save(any());
    }
}