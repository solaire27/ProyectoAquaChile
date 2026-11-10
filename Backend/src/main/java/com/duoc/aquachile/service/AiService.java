package com.duoc.aquachile.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.File;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate;

    public AiService() {
        this.restTemplate = new RestTemplate();
    }

    @SuppressWarnings({"rawtypes", "unchecked"})
    public String evaluarCvConIA(String rutaArchivoPdf, String cargoPostulado) {
        try {
            // 1. Extraer el texto del PDF
            File archivoCv = new File(rutaArchivoPdf);
            if (!archivoCv.exists()) {
                return "Error: No se encontró el archivo físico del CV para analizar.";
            }

            PDDocument document = PDDocument.load(archivoCv);
            PDFTextStripper stripper = new PDFTextStripper();
            String textoCv = stripper.getText(document);
            document.close();

            // 2. Construir el Prompt para la IA
            String prompt = "Eres un psicólogo laboral experto en reclutamiento IT y general. " +
                    "Evalúa el siguiente CV para el cargo de '" + cargoPostulado + "'. " +
                    "Dame un puntaje del 1 al 10 y una justificación técnica breve (máximo 3 líneas) " +
                    "de por qué es o no un buen calce. Aquí está el CV: \n\n" + textoCv;

            // 3. Armar el JSON (Estructura obligatoria de Gemini)
            Map part = new HashMap();
            part.put("text", prompt);

            Map content = new HashMap();
            content.put("parts", List.of(part));

            Map requestBody = new HashMap();
            requestBody.put("contents", List.of(content));

            // 4. Configurar las cabeceras HTTP
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity request = new HttpEntity(requestBody, headers);

            // 5. Llamar a la API de Gemini
            String urlCompleta = apiUrl + apiKey;
            Map response = restTemplate.postForObject(urlCompleta, request, Map.class);

            // 6. Extraer el texto de la respuesta paso a paso
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
            return "No se pudo realizar la evaluación con IA en este momento. Error: " + e.getMessage();
        }
    }
}
}