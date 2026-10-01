package com.duoc.aquachile.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "candidatos")
public class Candidato {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, unique = true, length = 100)
    private String correo;

    @Column(length = 15)
    private String telefono;

    @Column(name = "cargo_postulacion", length = 100)
    private String cargoPostulacion;

    @Column(name = "familia_cargo", length = 100)
    private String familiaCargo;

    @Column(name = "url_cv", length = 255)
    private String urlCv;
}