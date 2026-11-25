package com.duoc.aquachile.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "solicitud_evaluacion")
public class SolicitudEvaluacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "candidato_id", nullable = false)
    private Candidato candidato;

    @ManyToOne
    @JoinColumn(name = "responsable_id")
    private Usuario responsable;

    @OneToOne(mappedBy = "solicitud", cascade = CascadeType.ALL, orphanRemoval = true)
    private Evaluacion evaluacion;

    @Column(nullable = false, length = 100)
    private String cargo;

    @Column(name = "familia_cargo", nullable = false, length = 100)
    private String familiaCargo;

    @CreationTimestamp
    @Column(name = "fecha_solicitud", updatable = false)
    private LocalDateTime fechaSolicitud;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EstadoSolicitud estado;

    @Column(length = 500)
    private String observaciones;

    @Column(name = "recomendacion_ia", columnDefinition = "TEXT")
    private String recomendacionIa;

    // --- Datos de Entrevista Agendada ---
    @Column(name = "fecha_entrevista")
    private LocalDateTime fechaEntrevista;

    @Column(name = "duracion_entrevista_minutos")
    private Integer duracionEntrevistaMinutos;

    @Column(name = "modalidad_entrevista", length = 120)
    private String modalidadEntrevista;

    @Column(name = "notas_entrevista", length = 500)
    private String notasEntrevista;
}