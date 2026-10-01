package com.duoc.aquachile.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "solicitud_evaluacion")
public class SolicitudEvaluacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relación con el Candidato
    @ManyToOne(optional = false)
    @JoinColumn(name = "candidato_id", nullable = false)
    private Candidato candidato;

    // Relación con el Usuario (Puede ser nulo cuando recién entra la postulación)
    @ManyToOne
    @JoinColumn(name = "responsable_id")
    private Usuario responsable;

    @Column(nullable = false, length = 100)
    private String cargo;

    @Column(name = "familia_cargo", nullable = false, length = 100)
    private String familiaCargo;

    // Se asigna la fecha automáticamente al crear el registro
    @CreationTimestamp
    @Column(name = "fecha_solicitud", updatable = false)
    private LocalDateTime fechaSolicitud;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EstadoSolicitud estado;

    @Column(length = 500)
    private String observaciones;
}