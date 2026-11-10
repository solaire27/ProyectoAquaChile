package com.duoc.aquachile.controller;

import com.duoc.aquachile.dto.OfertaRequestDTO;
import com.duoc.aquachile.model.Oferta;
import com.duoc.aquachile.service.OfertaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ofertas")
public class OfertaController {

    private final OfertaService ofertaService;

    public OfertaController(OfertaService ofertaService) {
        this.ofertaService = ofertaService;
    }

    // ==========================================
    // RUTA PÚBLICA (Para el Landing de Amador)
    // ==========================================

    // Amador debe llamar a: GET /api/ofertas/public
    @GetMapping("/public")
    public ResponseEntity<List<Oferta>> listarActivasPublicas() {
        return ResponseEntity.ok(ofertaService.obtenerActivas());
    }

    // ==========================================
    // RUTAS PRIVADAS (Solo para el Admin)
    // ==========================================

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<Oferta> crear(@Valid @RequestBody OfertaRequestDTO dto) {
        return new ResponseEntity<>(ofertaService.crearOferta(dto), HttpStatus.CREATED);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<Oferta>> listarTodas() {
        return ResponseEntity.ok(ofertaService.obtenerTodas());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<Oferta> actualizar(@PathVariable Long id, @Valid @RequestBody OfertaRequestDTO dto) {
        return ResponseEntity.ok(ofertaService.actualizarOferta(id, dto));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/estado")
    public ResponseEntity<Oferta> cambiarEstado(@PathVariable Long id, @RequestParam boolean activo) {
        // Ejemplo llamada: PATCH /api/ofertas/1/estado?activo=false
        return ResponseEntity.ok(ofertaService.cambiarEstado(id, activo));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        ofertaService.eliminarOferta(id);
        return ResponseEntity.noContent().build();
    }
}