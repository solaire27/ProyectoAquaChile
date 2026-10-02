package com.duoc.aquachile.controller;

import com.duoc.aquachile.dto.EvaluacionRequestDTO;
import com.duoc.aquachile.model.Evaluacion;
import com.duoc.aquachile.service.EvaluacionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/evaluaciones")
@RequiredArgsConstructor
public class EvaluacionController {

    private final EvaluacionService evaluacionService;

    @PostMapping
    public ResponseEntity<Evaluacion> registrar(@Valid @RequestBody EvaluacionRequestDTO dto) {
        return new ResponseEntity<>(evaluacionService.registrarEvaluacion(dto), HttpStatus.CREATED);
    }
}