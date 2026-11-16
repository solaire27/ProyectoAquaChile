package com.duoc.aquachile.service.integration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
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
            // 1. Generar nombre único para no sobreescribir CVs si se llaman igual
            String nombreUnico = UUID.randomUUID().toString() + "-" + archivo.getOriginalFilename();
            String endpoint = supabaseUrl + "/storage/v1/object/cv_candidatos/" + nombreUnico;

            // 2. Configurar cabeceras (Usando Service Role para bypass de seguridad)
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(serviceRoleKey);
            headers.setContentType(MediaType.valueOf(archivo.getContentType() != null ? archivo.getContentType() : "application/pdf"));

            // 3. Subir los bytes a Supabase
            HttpEntity<byte[]> requestEntity = new HttpEntity<>(archivo.getBytes(), headers);
            ResponseEntity<String> response = restTemplate.exchange(endpoint, HttpMethod.POST, requestEntity, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                return nombreUnico; // Retornamos solo el nombre generado
            } else {
                throw new RuntimeException("Error al subir archivo a Supabase: " + response.getStatusCode());
            }
        } catch (Exception e) {
            throw new RuntimeException("Excepción al subir el CV a Supabase: " + e.getMessage());
        }
    }
}