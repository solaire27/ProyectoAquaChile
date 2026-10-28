-- 1. LIMPIEZA DEL ESQUEMA
DROP TABLE IF EXISTS Evaluacion CASCADE;
DROP TABLE IF EXISTS Solicitud_Evaluacion CASCADE;
DROP TABLE IF EXISTS Candidatos CASCADE;
DROP TABLE IF EXISTS Usuarios CASCADE;

-- 2. CREACIÓN DE TABLAS
CREATE TABLE Usuarios (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    rol VARCHAR(50) NOT NULL
);

CREATE TABLE Candidatos (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(15),
    cargo_postulacion VARCHAR(100),
    familia_cargo VARCHAR(100),
    url_cv VARCHAR(255)
);

CREATE TABLE Solicitud_Evaluacion (
    id BIGSERIAL PRIMARY KEY,
    candidato_id BIGINT NOT NULL,
    responsable_id BIGINT,
    cargo VARCHAR(100) NOT NULL,
    familia_cargo VARCHAR(100) NOT NULL,
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(30) NOT NULL,
    observaciones VARCHAR(500),
    CONSTRAINT fk_solicitud_candidato FOREIGN KEY (candidato_id) REFERENCES Candidatos(id),
    CONSTRAINT fk_solicitud_usuario FOREIGN KEY (responsable_id) REFERENCES Usuarios(id)
);

CREATE TABLE Evaluacion (
    id BIGSERIAL PRIMARY KEY,
    solicitud_id BIGINT NOT NULL UNIQUE,
    fecha_evaluacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resultado_general VARCHAR(100) NOT NULL,
    observaciones VARCHAR(1000),
    CONSTRAINT fk_evaluacion_solicitud FOREIGN KEY (solicitud_id) REFERENCES Solicitud_Evaluacion(id)
);