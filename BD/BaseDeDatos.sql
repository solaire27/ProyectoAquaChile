-- =============================================================================
-- 1. LIMPIEZA DEL ESQUEMA
-- =============================================================================
DROP TABLE Evaluacion CASCADE CONSTRAINTS;
DROP TABLE Solicitud_Evaluacion CASCADE CONSTRAINTS;
DROP TABLE Candidatos CASCADE CONSTRAINTS;
DROP TABLE Usuarios CASCADE CONSTRAINTS;

-- =============================================================================
-- 2. CREACIÓN DE TABLAS (ADAPTADAS PARA SPRING BOOT MVP)
-- =============================================================================

CREATE TABLE Usuarios (
    ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Nombre VARCHAR2(100) NOT NULL,
    Correo VARCHAR2(100) NOT NULL UNIQUE,
    Rol VARCHAR2(50) NOT NULL -- Ej: 'ANALISTA', 'EVALUADOR', 'ADMIN'
);

CREATE TABLE Candidatos (
    ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Nombre VARCHAR2(100) NOT NULL,
    Correo VARCHAR2(100) NOT NULL UNIQUE,
    Telefono VARCHAR2(15),
    Cargo_Postulacion VARCHAR2(100),
    Familia_Cargo VARCHAR2(100),
    URL_CV VARCHAR2(255) -- Ruta local o URL del bucket donde se guarde el PDF
);

CREATE TABLE Solicitud_Evaluacion (
    ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Candidato_ID NUMBER NOT NULL,
    Responsable_ID NUMBER, -- Puede ser NULL al inicio hasta que se asigne a un Evaluador
    Cargo VARCHAR2(100) NOT NULL,
    Familia_Cargo VARCHAR2(100) NOT NULL,
    Fecha_Solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Estado VARCHAR2(30) NOT NULL, -- Ej: 'NUEVA_POSTULACION', 'PENDIENTE', 'EN_PROCESO', 'FINALIZADA'
    Observaciones VARCHAR2(500),
    CONSTRAINT FK_Solicitud_Candidato FOREIGN KEY (Candidato_ID) REFERENCES Candidatos(ID),
    CONSTRAINT FK_Solicitud_Usuario FOREIGN KEY (Responsable_ID) REFERENCES Usuarios(ID)
);

CREATE TABLE Evaluacion (
    ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Solicitud_ID NUMBER NOT NULL UNIQUE, -- Relación 1 a 1: Una solicitud tiene una evaluación final
    Fecha_Evaluacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Resultado_General VARCHAR2(100) NOT NULL,
    Observaciones VARCHAR2(1000),
    CONSTRAINT FK_Evaluacion_Solicitud FOREIGN KEY (Solicitud_ID) REFERENCES Solicitud_Evaluacion(ID)
);