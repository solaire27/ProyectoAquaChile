package com.duoc.aquachile.controller;

import com.duoc.aquachile.dto.CandidatoRequestDTO;
import com.duoc.aquachile.model.Candidato;
import com.duoc.aquachile.service.CandidatoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/candidatos")
@RequiredArgsConstructor
public class CandidatoController {

    private final CandidatoService candidatoService;

    @PostMapping
    public ResponseEntity<Candidato> crear(@Valid @RequestBody CandidatoRequestDTO dto) {
        return new ResponseEntity<>(candidatoService.crearCandidato(dto), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Candidato>> listar() {
        return ResponseEntity.ok(candidatoService.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Candidato> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(candidatoService.obtenerPorId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Candidato> actualizar(@PathVariable Long id, @Valid @RequestBody CandidatoRequestDTO dto) {
        return ResponseEntity.ok(candidatoService.actualizarCandidato(id, dto));
    }
}