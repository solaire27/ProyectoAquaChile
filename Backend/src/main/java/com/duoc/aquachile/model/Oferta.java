package com.duoc.aquachile.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ofertas")
public class Oferta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String tituloCargo;

    @Column(nullable = false, length = 100)
    private String familiaCargo;

    @Column(length = 150)
    private String ubicacion;

    @Column(length = 50)
    private String modalidad; // Presencial, Híbrida o Remota

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "funciones_principales", columnDefinition = "TEXT")
    private String funcionesPrincipales;

    @Column(columnDefinition = "TEXT")
    private String requisitos;

    @Column(columnDefinition = "TEXT")
    private String beneficios;

    @Column(name = "rango_salarial", length = 100)
    private String rangoSalarial;

    // Se inicializa en true por defecto a nivel de BD y de Objeto
    @Column(nullable = false, columnDefinition = "boolean default true")
    private Boolean estadoActivo = true;

    @Column(nullable = false)
    private Integer cuposDisponibles;

    @Column(name = "fecha_publicacion", updatable = false)
    private LocalDateTime fechaPublicacion;

    @PrePersist
    protected void onCreate() {
        this.fechaPublicacion = LocalDateTime.now();
    }
}