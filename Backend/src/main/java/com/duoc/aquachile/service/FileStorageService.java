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

    // Directorio donde se guardarán los CVs localmente
    private final String uploadDir = "uploads/";

    public String guardarArchivo(MultipartFile archivo) throws IOException {
        if (archivo.isEmpty()) {
            return null;
        }

        // Crear la carpeta si no existe
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Generar un nombre único para evitar sobreescribir archivos con el mismo nombre
        String nombreOriginal = archivo.getOriginalFilename();
        String nombreUnico = UUID.randomUUID().toString() + "_" + nombreOriginal;

        Path filePath = uploadPath.resolve(nombreUnico);
        Files.copy(archivo.getInputStream(), filePath);

        // Retornar la ruta relativa o nombre del archivo para guardarlo en la base de datos
        return filePath.toString();
    }
}