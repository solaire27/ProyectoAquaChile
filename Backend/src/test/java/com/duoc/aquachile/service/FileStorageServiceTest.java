package com.duoc.aquachile.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import static org.junit.jupiter.api.Assertions.*;

class FileStorageServiceTest {

    private final FileStorageService fileStorageService = new FileStorageService();
    private Path archivoCreado;

    @AfterEach
    void limpiarArchivo() throws IOException {
        if (archivoCreado != null && Files.exists(archivoCreado)) {
            Files.delete(archivoCreado);
        }
    }

    @Test
    void guardarArchivo_ArchivoVacio_RetornaNull() throws IOException {
        MockMultipartFile vacio = new MockMultipartFile("cv", "vacio.pdf", "application/pdf", new byte[0]);

        String ruta = fileStorageService.guardarArchivo(vacio);

        assertNull(ruta);
    }

    @Test
    void guardarArchivo_ArchivoValido_GuardaYRetornaRuta() throws IOException {
        MockMultipartFile pdf = new MockMultipartFile(
                "cv",
                "curriculum.pdf",
                "application/pdf",
                "Contenido de prueba PDF".getBytes()
        );

        String ruta = fileStorageService.guardarArchivo(pdf);

        assertNotNull(ruta);
        assertTrue(ruta.contains("curriculum.pdf"));
        archivoCreado = Paths.get(ruta);
        assertTrue(Files.exists(archivoCreado));
    }
}