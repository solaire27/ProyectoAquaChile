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

    @Column(columnDefinition = "TEXT")
    private String descripcion;

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
