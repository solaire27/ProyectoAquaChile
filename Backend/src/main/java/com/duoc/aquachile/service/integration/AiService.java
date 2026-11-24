package com.duoc.aquachile.service.integration;

import com.duoc.aquachile.dto.PromptCargoDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.io.InputStream;
import java.text.Normalizer;
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
    private final ObjectMapper objectMapper;
    private final Map<String, PromptCargoDTO> promptsPorCargo = new HashMap<>();

    public AiService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000); // 10 segundos
        factory.setReadTimeout(120000);   // 120 segundos
        this.restTemplate = new RestTemplate(factory);
    }

    @PostConstruct
    public void cargarPromptsDesdeJson() {
        try {
            ClassPathResource resource = new ClassPathResource("prompts_cv.json");
            try (InputStream is = resource.getInputStream()) {
                PromptCargoDTO[] lista = objectMapper.readValue(is, PromptCargoDTO[].class);
                for (PromptCargoDTO item : lista) {
                    if (item.getCargo() != null) {
                        promptsPorCargo.put(normalizarClave(item.getCargo()), item);
                    }
                }
                System.out.println("Catálogo de prompts cargado correctamente: " + promptsPorCargo.size() + " cargos.");
            }
        } catch (Exception e) {
            System.err.println("Advertencia: No se pudo cargar prompts_cv.json, se usará prompt genérico: " + e.getMessage());
        }
    }

    private String normalizarClave(String texto) {
        if (texto == null) return "";
        return Normalizer.normalize(texto.trim().toLowerCase(), Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
    }

    private String construirPrompt(String cargoPostulado, String textoCv) {
        PromptCargoDTO config = promptsPorCargo.get(normalizarClave(cargoPostulado));

        if (config == null) {
            return "Eres un psicólogo laboral experto en reclutamiento para AquaChile. " +
                    "Evalúa el siguiente CV para el cargo de '" + cargoPostulado + "'. " +
                    "Sigue estrictamente este formato breve en español: " +
                    "'Puntaje orientativo: X/10. Criterios: [fortalezas (+), brechas (-)]. " +
                    "Preguntas sugeridas: 1) ... 2) ... " +
                    "Nota: Apoyo orientativo sujeto a revisión humana obligatoria.'\n\n" +
                    "CV:\n" + textoCv;
        }

        StringBuilder sb = new StringBuilder();
        sb.append("Eres un psicólogo laboral experto en reclutamiento para AquaChile.\n");
        sb.append(config.getPromptBase()).append("\n\n");

        if (config.getRequisitos() != null) {
            sb.append("Requisitos mínimos: ");
            if (config.getRequisitos().getAniosExperienciaMinimos() != null) {
                sb.append(config.getRequisitos().getAniosExperienciaMinimos()).append(" años de experiencia. ");
            }
            if (config.getRequisitos().getHabilidades() != null && !config.getRequisitos().getHabilidades().isEmpty()) {
                sb.append("Habilidades: ").append(String.join(", ", config.getRequisitos().getHabilidades())).append(".\n");
            }
        }

        if (config.getPalabrasClave() != null && !config.getPalabrasClave().isEmpty()) {
            sb.append("Palabras clave a valorar (+): ").append(String.join(", ", config.getPalabrasClave())).append(".\n");
        }

        if (config.getPuntosNegativos() != null && !config.getPuntosNegativos().isEmpty()) {
            sb.append("Alertas o puntos negativos (-): ").append(String.join(", ", config.getPuntosNegativos())).append(".\n");
        }

        if (config.getRespuestaGuiaEsperada() != null && config.getRespuestaGuiaEsperada().getEjemploSalida() != null) {
            sb.append("\nSigue estrictamente este formato y extensión de salida (sin markdown ni asteriscos):\n");
            sb.append(config.getRespuestaGuiaEsperada().getEjemploSalida()).append("\n");
        }

        sb.append("\nCV del candidato:\n").append(textoCv);
        return sb.toString();
    }

    @Retryable(
            value = {HttpStatusCodeException.class, Exception.class},
            maxAttempts = 3,
            backoff = @Backoff(delay = 5000, multiplier = 2.0)
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

            // 2. Extraer y limpiar el texto usando PDFBox
            long inicioPdf = System.currentTimeMillis();
            PDDocument document = PDDocument.load(responseDescarga.getBody());
            PDFTextStripper stripper = new PDFTextStripper();
            String textoCv = stripper.getText(document);
            document.close();

            textoCv = textoCv.replaceAll("\\s+", " ").trim();
            if (textoCv.length() > 4000) {
                textoCv = textoCv.substring(0, 4000);
            }
            System.out.println("Extraer y limpiar texto PDF tomó: " + (System.currentTimeMillis() - inicioPdf) + "ms");

            // 3. Construir el Prompt estructurado desde prompts_cv.json
            String prompt = construirPrompt(cargoPostulado, textoCv);

            // 4. Armar JSON para Gemini
            Map part = new HashMap();
            part.put("text", prompt);
            Map content = new HashMap();
            content.put("parts", List.of(part));

            Map generationConfig = new HashMap();
            generationConfig.put("maxOutputTokens", 350); // Espacio suficiente para puntaje + criterios + 2 preguntas + nota
            generationConfig.put("temperature", 0.2);

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