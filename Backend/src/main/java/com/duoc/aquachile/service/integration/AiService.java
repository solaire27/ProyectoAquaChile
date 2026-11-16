package com.duoc.aquachile.service.integration;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    @Value("${supabase.project.url}")
    private String supabaseUrl;

    @Value("${supabase.service.role.key}")
    private String serviceRoleKey;

    private final RestTemplate restTemplate;

    public AiService() {
        // Usar la fábrica estándar nativa para configurar los tiempos de espera
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000); // 10 segundos
        factory.setReadTimeout(120000);   // 120 segundos
        this.restTemplate = new RestTemplate(factory);
    }

    @Retryable(
            value = {HttpStatusCodeException.class, Exception.class}, // Captura errores HTTP (como el 503) y timeouts
            maxAttempts = 3, // Intenta 3 veces en total
            backoff = @Backoff(delay = 5000, multiplier = 2.0) // Espera 5s, luego 10s
    )
    @SuppressWarnings({"rawtypes", "unchecked"})
    public String evaluarCvConIA(String nombreArchivoSupabase, String cargoPostulado) {
        try {
            long inicioGeneral = System.currentTimeMillis();

            // 1. Descargar el PDF desde Supabase hacia la memoria
            long inicioDescarga = System.currentTimeMillis();
            String endpoint = supabaseUrl + "/storage/v1/object/cv_candidatos/" + nombreArchivoSupabase;
            HttpHeaders headersDescarga = new HttpHeaders();
            headersDescarga.setBearerAuth(serviceRoleKey);
            HttpEntity<Void> requestDescarga = new HttpEntity<>(headersDescarga);

            ResponseEntity<byte[]> responseDescarga = restTemplate.exchange(
                    endpoint, HttpMethod.GET, requestDescarga, byte[].class);

            System.out.println("Descarga Supabase tomó: " + (System.currentTimeMillis() - inicioDescarga) + "ms");

            if (!responseDescarga.getStatusCode().is2xxSuccessful() || responseDescarga.getBody() == null) {
                return "Error: No se pudo descargar el CV de Supabase para analizarlo.";
            }
// ver si está en caché o descargar para otros usos
            // 2. Extraer y limpiar el texto usando PDFBox
            long inicioPdf = System.currentTimeMillis();
            PDDocument document = PDDocument.load(responseDescarga.getBody());
            PDFTextStripper stripper = new PDFTextStripper();
            String textoCv = stripper.getText(document);
            document.close();

            // Limpiar espacios en blanco excesivos y saltos de línea múltiples
            textoCv = textoCv.replaceAll("\\s+", " ").trim();

            // Truncar a los primeros 4000 caracteres (suficiente para evaluar cualquier CV estándar)
            if (textoCv.length() > 4000) {
                textoCv = textoCv.substring(0, 4000);
            }
            System.out.println("Extraer y limpiar texto PDF tomó: " + (System.currentTimeMillis() - inicioPdf) + "ms");

            // 3. Construir el Prompt para Gemini
            String prompt = "Eres un psicólogo laboral experto en reclutamiento. " +
                    "Evalúa el siguiente CV para el cargo de '" + cargoPostulado + "'. " +
                    "Dame un puntaje del 1 al 10 y una justificación técnica breve (máximo 3 líneas). CV: \n\n" + textoCv;

            // 4. Armar JSON para Gemini con límites estrictos
            Map part = new HashMap();
            part.put("text", prompt);
            Map content = new HashMap();
            content.put("parts", List.of(part));

            // Configurar límites para forzar respuesta rápida de la IA
            Map generationConfig = new HashMap();
            generationConfig.put("maxOutputTokens", 150); // Límite estricto de palabras
            generationConfig.put("temperature", 0.2);     // Baja temperatura = respuestas más directas y rápidas

            Map requestBody = new HashMap();
            requestBody.put("contents", List.of(content));
            requestBody.put("generationConfig", generationConfig);

            HttpHeaders headersGemini = new HttpHeaders();
            headersGemini.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity requestGemini = new HttpEntity(requestBody, headersGemini);

            // 5. Llamar a la API de Gemini
            long inicioGemini = System.currentTimeMillis();
            String urlCompleta = apiUrl + "?key=" + apiKey;
            Map response = restTemplate.postForObject(urlCompleta, requestGemini, Map.class);
            System.out.println("Consulta a Gemini tomó: " + (System.currentTimeMillis() - inicioGemini) + "ms");

            System.out.println("Tiempo total del proceso completo: " + (System.currentTimeMillis() - inicioGeneral) + "ms");

            // 6. Extraer el texto de la respuesta
            if (response != null && response.containsKey("candidates")) {
                List candidates = (List) response.get("candidates");
                Map firstCandidate = (Map) candidates.get(0);
                Map contentRes = (Map) firstCandidate.get("content");
                List partsRes = (List) contentRes.get("parts");
                Map firstPart = (Map) partsRes.get(0);

                return (String) firstPart.get("text");
            }

            return "No se recibió respuesta válida del modelo de IA.";

        } catch (Exception e) {
            e.printStackTrace();
            return "Error procesando IA o descargando el documento: " + e.getMessage();
        }
    }
}