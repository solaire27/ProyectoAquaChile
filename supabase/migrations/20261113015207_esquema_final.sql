-- 1. LIMPIEZA
DROP TABLE IF EXISTS Evaluacion CASCADE;
DROP TABLE IF EXISTS Solicitud_Evaluacion CASCADE;
DROP TABLE IF EXISTS Candidatos CASCADE;
DROP TABLE IF EXISTS Usuarios CASCADE;
DROP TABLE IF EXISTS Ofertas CASCADE;

-- 2. TABLA USUARIOS (Con password para JWT)
CREATE TABLE Usuarios (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL
);

-- 3. TABLA CANDIDATOS (Con RUT y Control de Edad)
CREATE TABLE Candidatos (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(15),
    cargo_postulacion VARCHAR(100),
    familia_cargo VARCHAR(100),
    url_cv VARCHAR(255),
    rut VARCHAR(12) NOT NULL UNIQUE,
    fecha_nacimiento DATE NOT NULL,
    CONSTRAINT chk_candidato_mayor_edad CHECK (EXTRACT(YEAR FROM age(CURRENT_DATE, fecha_nacimiento)) >= 18)
);

-- 4. TABLA SOLICITUD_EVALUACION (Con campo para IA)
CREATE TABLE Solicitud_Evaluacion (
    id BIGSERIAL PRIMARY KEY,
    candidato_id BIGINT NOT NULL,
    responsable_id BIGINT,
    cargo VARCHAR(100) NOT NULL,
    familia_cargo VARCHAR(100) NOT NULL,
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(30) NOT NULL,
    observaciones VARCHAR(500),
    recomendacion_ia TEXT,
    CONSTRAINT fk_solicitud_candidato FOREIGN KEY (candidato_id) REFERENCES Candidatos(id),
    CONSTRAINT fk_solicitud_usuario FOREIGN KEY (responsable_id) REFERENCES Usuarios(id)
);

-- 5. TABLA EVALUACION
CREATE TABLE Evaluacion (
    id BIGSERIAL PRIMARY KEY,
    solicitud_id BIGINT NOT NULL UNIQUE,
    fecha_evaluacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resultado_general VARCHAR(100) NOT NULL,
    observaciones VARCHAR(1000),
    CONSTRAINT fk_evaluacion_solicitud FOREIGN KEY (solicitud_id) REFERENCES Solicitud_Evaluacion(id)
);

-- 6. TABLA OFERTAS
CREATE TABLE Ofertas (
    id BIGSERIAL PRIMARY KEY,
    titulo_cargo VARCHAR(150) NOT NULL,
    familia_cargo VARCHAR(100) NOT NULL,
    descripcion TEXT,
    estado_activo BOOLEAN NOT NULL DEFAULT TRUE,
    cupos_disponibles INT NOT NULL,
    fecha_publicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);