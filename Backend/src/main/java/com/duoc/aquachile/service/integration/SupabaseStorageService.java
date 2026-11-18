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

    public String subirCv(MultipartFile archivo) {
        try {
            String nombreOriginal = archivo.getOriginalFilename() != null ? archivo.getOriginalFilename() : "cv.pdf";
            String nombreLimpio = Normalizer.normalize(nombreOriginal, Normalizer.Form.NFD)
                    .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                    .replaceAll("[^a-zA-Z0-9._-]", "_");

            String nombreUnico = UUID.randomUUID().toString() + "-" + nombreLimpio;
            String endpoint = supabaseUrl + "/storage/v1/object/cv_candidatos/" + nombreUnico;

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(serviceRoleKey);
            headers.setContentType(MediaType.valueOf(archivo.getContentType() != null ? archivo.getContentType() : "application/pdf"));

            HttpEntity<byte[]> requestEntity = new HttpEntity<>(archivo.getBytes(), headers);
            ResponseEntity<String> response = restTemplate.exchange(endpoint, HttpMethod.POST, requestEntity, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                return nombreUnico;
            } else {
                throw new RuntimeException("Error al subir archivo a Supabase: " + response.getStatusCode());
            }
        } catch (Exception e) {
            throw new RuntimeException("Excepción al subir el CV a Supabase: " + e.getMessage());
        }
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