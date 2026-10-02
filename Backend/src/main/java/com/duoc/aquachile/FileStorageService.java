package com.duoc.aquachile.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileStorageService {

    private final String uploadDir = "uploads/";

    public String guardarArchivo(MultipartFile archivo) throws IOException {
        if (archivo.isEmpty()) {
            throw new RuntimeException("El archivo de CV está vacío");
        }

        
        Path directorioPath = Paths.get(uploadDir);
        if (!Files.exists(directorioPath)) {
            Files.createDirectories(directorioPath);
        }

        String nombreArchivoOriginal = archivo.getOriginalFilename();
        String nombreUnico = UUID.randomUUID().toString() + "_" + nombreArchivoOriginal;

        Path rutaDestino = directorioPath.resolve(nombreUnico);
        Files.copy(archivo.getInputStream(), rutaDestino);

        return rutaDestino.toString(); 
    }
}