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

    private static final String OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
    private static final List<String> MODELOS_OPENROUTER = List.of(
            "nvidia/nemotron-3.5-lightning:free",
            "nvidia/nemotron-3.5-super-vl:free",
            "openrouter/free"
    );

    @Value("${openrouter.api.key:}")
    private String openRouterApiKey;

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
        factory.setReadTimeout(60000);    // 60 segundos
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

        String formatoSalida = """
                Sigue estrictamente este formato en español (sin markdown, sin asteriscos y sin corchetes):

                Puntaje orientativo: X/10

                Fortalezas:
                - Punto breve 1
                - Punto breve 2

                Brechas:
                - Punto breve 1
                - Punto breve 2

                Preguntas sugeridas:
                                1) Pregunta 1
                                2) Pregunta 2
                                3) Pregunta 3

                Nota: Apoyo orientativo sujeto a revisión humana obligatoria.
                """;

        if (config == null) {
            return "Eres un psicólogo laboral experto en reclutamiento para AquaChile. " +
                    "Evalúa el siguiente CV para el cargo de '" + cargoPostulado + "'.\n\n" +
                    formatoSalida + "\nCV:\n" + textoCv;
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
            sb.append("Palabras clave a valorar: ").append(String.join(", ", config.getPalabrasClave())).append(".\n");
        }

        if (config.getPuntosNegativos() != null && !config.getPuntosNegativos().isEmpty()) {
            sb.append("Alertas o brechas a considerar: ").append(String.join(", ", config.getPuntosNegativos())).append(".\n");
        }

        sb.append("\n").append(formatoSalida);
        sb.append("\nCV del candidato:\n").append(textoCv);
        return sb.toString();
    }
    @Retryable(
            value = {HttpStatusCodeException.class},
            maxAttempts = 3,
            backoff = @Backoff(delay = 3000, multiplier = 2.0)
    )
    @SuppressWarnings({"rawtypes", "unchecked"})
    public String evaluarCvConIA(String nombreArchivoSupabase, String cargoPostulado) {
        if (openRouterApiKey == null || openRouterApiKey.isBlank()) {
            return "Error: OPENROUTER_API_KEY no configurada en el servidor.";
        }

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
        String textoCv;
        try {
            long inicioPdf = System.currentTimeMillis();
            try (PDDocument document = PDDocument.load(responseDescarga.getBody())) {
                PDFTextStripper stripper = new PDFTextStripper();
                textoCv = stripper.getText(document);
            }
            textoCv = textoCv.replaceAll("\\s+", " ").trim();
            if (textoCv.length() > 4000) {
                textoCv = textoCv.substring(0, 4000);
            }
            System.out.println("Extraer y limpiar texto PDF tomó: " + (System.currentTimeMillis() - inicioPdf) + "ms");
        } catch (Exception e) {
            return "Error al leer el archivo PDF del CV: " + e.getMessage();
        }

        // 3. Construir el Prompt estructurado desde prompts_cv.json
        String prompt = construirPrompt(cargoPostulado, textoCv);

        // 4. Armar JSON para OpenRouter (formato OpenAI compatible + lista de fallback)
        Map<String, Object> mensajeUsuario = new HashMap<>();
        mensajeUsuario.put("role", "user");
        mensajeUsuario.put("content", prompt);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("models", MODELOS_OPENROUTER);
        requestBody.put("messages", List.of(mensajeUsuario));
        requestBody.put("max_tokens", 4000);
        requestBody.put("temperature", 0.2);
        requestBody.put("reasoning", Map.of("enabled", false));

        HttpHeaders headersOpenRouter = new HttpHeaders();
        headersOpenRouter.setContentType(MediaType.APPLICATION_JSON);
        headersOpenRouter.setBearerAuth(openRouterApiKey.trim());
        headersOpenRouter.set("HTTP-Referer", "https://aquachile-portal.cl");
        headersOpenRouter.set("X-Title", "AquaChile Portal Seleccion");

        HttpEntity<Map<String, Object>> requestOpenRouter = new HttpEntity<>(requestBody, headersOpenRouter);

        // 5. Llamar a OpenRouter (si lanza HttpStatusCodeException, @Retryable reintenta automáticamente)
        long inicioIa = System.currentTimeMillis();
        ResponseEntity<Map> responseEntity = restTemplate.postForEntity(OPENROUTER_API_URL, requestOpenRouter, Map.class);
        Map response = responseEntity.getBody();
        System.out.println("Consulta a OpenRouter tomó: " + (System.currentTimeMillis() - inicioIa) + "ms");
        System.out.println("Tiempo total del proceso completo: " + (System.currentTimeMillis() - inicioGeneral) + "ms");

        // 6. Extraer el texto de la respuesta y depurar si falla
        System.out.println("Respuesta cruda de OpenRouter: " + response);

        if (response != null && response.containsKey("choices")) {
            List choices = (List) response.get("choices");
            if (choices != null && !choices.isEmpty()) {
                Map firstChoice = (Map) choices.get(0);
                Map message = (Map) firstChoice.get("message");
                if (message != null && message.get("content") != null) {
                    String modeloUsado = response.get("model") != null ? response.get("model").toString() : "desconocido";
                    System.out.println("Modelo OpenRouter utilizado: " + modeloUsado);
                    return message.get("content").toString().trim();
                }
            }
        }

        return "No se recibió respuesta válida del modelo de IA. Respuesta de API: " + response;
    }
}