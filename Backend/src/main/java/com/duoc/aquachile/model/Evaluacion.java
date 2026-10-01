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
@Table(name = "evaluacion")
public class Evaluacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relación 1 a 1 con la Solicitud
    @OneToOne(optional = false)
    @JoinColumn(name = "solicitud_id", nullable = false, unique = true)
    private SolicitudEvaluacion solicitud;

    @CreationTimestamp
    @Column(name = "fecha_evaluacion", updatable = false)
    private LocalDateTime fechaEvaluacion;

    @Column(name = "resultado_general", nullable = false, length = 100)
    private String resultadoGeneral;

    @Column(length = 1000)
    private String observaciones;
}