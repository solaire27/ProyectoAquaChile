package com.duoc.aquachile.service.integration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.text.Normalizer;
import java.util.UUID;

@Service
public class SupabaseStorageService {

    @Value("${supabase.project.url}")
    private String supabaseUrl;

    @Value("${supabase.service.role.key}")
    private String serviceRoleKey;

    private final RestTemplate restTemplate;

    public SupabaseStorageService() {
        this.restTemplate = new RestTemplate();
    }

    private static final long MAX_CV_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

    public String subirCv(MultipartFile archivo, String nombrePostulante) {
        validarArchivoPdf(archivo);

        try {
            String nombreOriginal = archivo.getOriginalFilename() != null ? archivo.getOriginalFilename() : "cv.pdf";
            String nombreLimpio = limpiarTexto(nombreOriginal);

            String basePostulante = (nombrePostulante != null && !nombrePostulante.isBlank())
                    ? limpiarTexto(nombrePostulante).toLowerCase()
                    : "postulante";

            String idUnico = UUID.randomUUID().toString().substring(0, 8);
            String rutaCarpeta = basePostulante + "_" + idUnico + "/" + nombreLimpio;

            String endpoint = supabaseUrl + "/storage/v1/object/cv_candidatos/" + rutaCarpeta;

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(serviceRoleKey);
            headers.setContentType(MediaType.APPLICATION_PDF);

            HttpEntity<byte[]> requestEntity = new HttpEntity<>(archivo.getBytes(), headers);
            ResponseEntity<String> response = restTemplate.exchange(endpoint, HttpMethod.POST, requestEntity, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                return rutaCarpeta;
            } else {
                throw new RuntimeException("Error al subir archivo a Supabase: " + response.getStatusCode());
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Excepción al subir el CV a Supabase: " + e.getMessage());
        }
    }

    private void validarArchivoPdf(MultipartFile archivo) {
        if (archivo == null || archivo.isEmpty()) {
            throw new IllegalArgumentException("El archivo CV está vacío.");
        }
        if (archivo.getSize() > MAX_CV_SIZE_BYTES) {
            throw new IllegalArgumentException("El archivo CV supera el tamaño máximo permitido de 5 MB.");
        }
        String contentType = archivo.getContentType();
        String nombre = archivo.getOriginalFilename() != null ? archivo.getOriginalFilename().toLowerCase() : "";
        boolean esPdf = "application/pdf".equalsIgnoreCase(contentType) || nombre.endsWith(".pdf");
        if (!esPdf) {
            throw new IllegalArgumentException("Formato no permitido. Solo se aceptan archivos PDF.");
        }
    }

    private String limpiarTexto(String texto) {
        return Normalizer.normalize(texto.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    public byte[] descargarCv(String nombreArchivo) {
        try {
            String endpoint = supabaseUrl + "/storage/v1/object/cv_candidatos/" + nombreArchivo;

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(serviceRoleKey);

            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
            ResponseEntity<byte[]> response = restTemplate.exchange(endpoint, HttpMethod.GET, requestEntity, byte[].class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            } else {
                throw new RuntimeException("No se pudo descargar el CV desde Supabase: " + response.getStatusCode());
            }
        } catch (Exception e) {
            throw new RuntimeException("Error al descargar el CV desde Supabase: " + e.getMessage());
        }
    }
}