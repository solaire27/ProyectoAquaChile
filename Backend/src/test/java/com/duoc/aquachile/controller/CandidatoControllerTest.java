package com.duoc.aquachile.controller;

import com.duoc.aquachile.dto.CandidatoRequestDTO;
import com.duoc.aquachile.model.Candidato;
import com.duoc.aquachile.service.CandidatoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CandidatoControllerTest {

    @Mock
    private CandidatoService candidatoService;

    @InjectMocks
    private CandidatoController candidatoController;

    private Candidato candidato;
    private CandidatoRequestDTO dto;

    @BeforeEach
    void setUp() {
        candidato = new Candidato();
        candidato.setId(1L);
        candidato.setNombre("Juan Pérez");

        dto = new CandidatoRequestDTO();
        dto.setNombre("Juan Pérez");
    }

    @Test
    void crear_RetornaCreated() {
        when(candidatoService.crearCandidato(dto)).thenReturn(candidato);

        ResponseEntity<Candidato> res = candidatoController.crear(dto);

        assertEquals(HttpStatus.CREATED, res.getStatusCode());
        assertEquals(candidato, res.getBody());
    }

    @Test
    void listar_RetornaListaCandidatos() {
        when(candidatoService.obtenerTodos()).thenReturn(List.of(candidato));

        ResponseEntity<List<Candidato>> res = candidatoController.listar();

        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertEquals(1, res.getBody().size());
    }

    @Test
    void obtener_RetornaCandidatoPorId() {
        when(candidatoService.obtenerPorId(1L)).thenReturn(candidato);

        ResponseEntity<Candidato> res = candidatoController.obtener(1L);

        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertEquals("Juan Pérez", res.getBody().getNombre());
    }

    @Test
    void actualizar_RetornaCandidatoActualizado() {
        when(candidatoService.actualizarCandidato(1L, dto)).thenReturn(candidato);

        ResponseEntity<Candidato> res = candidatoController.actualizar(1L, dto);

        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertEquals(candidato, res.getBody());
    }
}