package com.duoc.aquachile.service.integration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class EmailService {

    private static final String RESEND_API_URL = "https://api.resend.com/emails";
    private static final ZoneId ZONA_CHILE = ZoneId.of("America/Santiago");

    @Value("${resend.api.key:}")
    private String resendApiKey;

    @Value("${resend.from.email:AquaChile Selección <onboarding@resend.dev>}")
    private String fromEmail;

    private final RestTemplate restTemplate;

    public EmailService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(30000);
        this.restTemplate = new RestTemplate(factory);
    }

    public void enviarConfirmacionPostulacion(
            String correoDestino,
            String nombreCandidato,
            String cargo,
            Long solicitudId) {

        if (!validarConfiguracionYDestino(correoDestino)) {
            return;
        }

        String asunto = "Confirmación de postulación — " + cargo + " (#SOL-" + solicitudId + ")";
        String html = "<div style='font-family: Segoe UI, Arial, sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto;'>"
                + "<div style='background: #0284c7; color: #ffffff; padding: 20px 24px; border-radius: 10px 10px 0 0;'>"
                + "<h2 style='margin: 0;'>AquaChile — Reclutamiento y Selección</h2>"
                + "</div>"
                + "<div style='border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 10px 10px;'>"
                + "<p>Hola <strong>" + escaparHtml(nombreCandidato) + "</strong>,</p>"
                + "<p>Hemos recibido correctamente tu postulación para el cargo de <strong>" + escaparHtml(cargo) + "</strong>.</p>"
                + "<div style='background: #f8fafc; border-left: 4px solid #0284c7; padding: 12px 16px; margin: 18px 0;'>"
                + "<strong>Código de seguimiento:</strong> #SOL-" + solicitudId + "<br/>"
                + "<strong>Estado inicial:</strong> Nueva Postulación"
                + "</div>"
                + "<p>Nuestro equipo revisará tus antecedentes y te notificaremos los siguientes pasos. "
                + "También puedes consultar el avance de tu proceso en cualquier momento desde nuestro portal público.</p>"
                + "<p style='color: #64748b; font-size: 12px; margin-top: 24px;'>Mensaje automático del Portal de Selección AquaChile.</p>"
                + "</div></div>";

        enviarCorreoResend(correoDestino, asunto, html, null);
    }

    public void enviarInvitacionEntrevista(
            String correoDestino,
            String nombreCandidato,
            String cargo,
            String familiaCargo,
            Long solicitudId,
            LocalDateTime fechaHora,
            Integer duracionMinutos,
            String modalidad,
            String notas) {

        if (!validarConfiguracionYDestino(correoDestino) || fechaHora == null) {
            return;
        }

        int duracion = (duracionMinutos != null && duracionMinutos > 0) ? duracionMinutos : 45;
        String modalidadFinal = (modalidad != null && !modalidad.isBlank()) ? modalidad : "Online (Google Meet)";
        String familiaFinal = (familiaCargo != null && !familiaCargo.isBlank()) ? familiaCargo : "General";

        DateTimeFormatter fmtFecha = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        DateTimeFormatter fmtHora = DateTimeFormatter.ofPattern("HH:mm");

        String googleCalendarUrl = construirUrlGoogleCalendar(
                nombreCandidato, cargo, familiaFinal, solicitudId, fechaHora, duracion, modalidadFinal, notas
        );

        String contenidoIcs = generarContenidoIcs(
                nombreCandidato, cargo, solicitudId, fechaHora, duracion, modalidadFinal, notas
        );
        String icsBase64 = Base64.getEncoder().encodeToString(contenidoIcs.getBytes(StandardCharsets.UTF_8));

        Map<String, String> adjuntoIcs = new HashMap<>();
        adjuntoIcs.put("filename", "entrevista-aquachile-SOL-" + solicitudId + ".ics");
        adjuntoIcs.put("content", icsBase64);

        String notasHtml = (notas != null && !notas.isBlank())
                ? "<p><strong>Notas / Enlace:</strong><br/>" + escaparHtml(notas).replace("\n", "<br/>") + "</p>"
                : "";

        String asunto = "Invitación a Entrevista Psicolaboral — " + cargo + " (AquaChile)";
        String html = "<div style='font-family: Segoe UI, Arial, sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto;'>"
                + "<div style='background: #0284c7; color: #ffffff; padding: 20px 24px; border-radius: 10px 10px 0 0;'>"
                + "<h2 style='margin: 0;'>Invitación a Entrevista — AquaChile</h2>"
                + "</div>"
                + "<div style='border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 10px 10px;'>"
                + "<p>Hola <strong>" + escaparHtml(nombreCandidato) + "</strong>,</p>"
                + "<p>Te invitamos a una entrevista psicolaboral para continuar en el proceso del cargo <strong>"
                + escaparHtml(cargo) + "</strong>.</p>"
                + "<div style='background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin: 18px 0;'>"
                + "<p style='margin: 4px 0;'><strong>Fecha:</strong> " + fechaHora.format(fmtFecha) + "</p>"
                + "<p style='margin: 4px 0;'><strong>Hora:</strong> " + fechaHora.format(fmtHora) + " hrs (Chile)</p>"
                + "<p style='margin: 4px 0;'><strong>Duración estimada:</strong> " + duracion + " minutos</p>"
                + "<p style='margin: 4px 0;'><strong>Modalidad / Lugar:</strong> " + escaparHtml(modalidadFinal) + "</p>"
                + notasHtml
                + "</div>"
                + "<p>Adjuntamos el archivo de calendario (<strong>.ics</strong>) para que puedas agendarlo en Gmail, Outlook o Apple Calendar, "
                + "o puedes añadirlo directamente haciendo clic aquí:</p>"
                + "<p style='text-align: center; margin: 24px 0;'>"
                + "<a href='" + googleCalendarUrl + "' style='background: #10b981; color: #ffffff; padding: 12px 20px; "
                + "text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;'>"
                + "Agregar a Google Calendar</a></p>"
                + "<p style='color: #64748b; font-size: 12px;'>Solicitud #SOL-" + solicitudId + " · Portal de Selección AquaChile.</p>"
                + "</div></div>";

        enviarCorreoResend(correoDestino, asunto, html, List.of(adjuntoIcs));
    }

    private void enviarCorreoResend(
            String correoDestino,
            String asunto,
            String html,
            List<Map<String, String>> attachments) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(resendApiKey.trim());

            Map<String, Object> body = new HashMap<>();
            body.put("from", fromEmail);
            body.put("to", List.of(correoDestino.trim()));
            body.put("subject", asunto);
            body.put("html", html);
            if (attachments != null && !attachments.isEmpty()) {
                body.put("attachments", attachments);
            }

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(RESEND_API_URL, request, String.class);

            System.out.println("Correo enviado vía Resend a " + correoDestino + " (HTTP " + response.getStatusCode().value() + ")");
        } catch (HttpStatusCodeException ex) {
            System.err.println("Error HTTP de Resend al enviar a " + correoDestino + ": "
                    + ex.getStatusCode() + " - " + ex.getResponseBodyAsString());
        } catch (Exception ex) {
            System.err.println("Error inesperado enviando correo vía Resend a " + correoDestino + ": " + ex.getMessage());
        }
    }

    private boolean validarConfiguracionYDestino(String correoDestino) {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            System.err.println("Advertencia: RESEND_API_KEY no configurada. Se omite el envío de correo a " + correoDestino);
            return false;
        }
        if (correoDestino == null || correoDestino.isBlank()) {
            System.err.println("Advertencia: Destinatario sin correo electrónico. Se omite envío.");
            return false;
        }
        return true;
    }

    private String generarContenidoIcs(
            String nombreCandidato,
            String cargo,
            Long solicitudId,
            LocalDateTime fechaHora,
            int duracionMinutos,
            String modalidad,
            String notas) {

        DateTimeFormatter fmtUtc = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'");
        ZonedDateTime inicioUtc = fechaHora.atZone(ZONA_CHILE).withZoneSameInstant(ZoneOffset.UTC);
        ZonedDateTime finUtc = inicioUtc.plusMinutes(duracionMinutos);
        ZonedDateTime ahoraUtc = ZonedDateTime.now(ZoneOffset.UTC);

        String descripcion = "Entrevista psicolaboral AquaChile para " + cargo
                + " (#SOL-" + solicitudId + "). Candidato: " + nombreCandidato
                + (notas != null && !notas.isBlank() ? "\\nNotas: " + notas.replace("\r", "").replace("\n", "\\n") : "");

        return "BEGIN:VCALENDAR\r\n"
                + "VERSION:2.0\r\n"
                + "PRODID:-//AquaChile//Portal Seleccion//ES\r\n"
                + "CALSCALE:GREGORIAN\r\n"
                + "METHOD:REQUEST\r\n"
                + "BEGIN:VEVENT\r\n"
                + "UID:" + UUID.randomUUID() + "@aquachile.cl\r\n"
                + "DTSTAMP:" + ahoraUtc.format(fmtUtc) + "\r\n"
                + "DTSTART:" + inicioUtc.format(fmtUtc) + "\r\n"
                + "DTEND:" + finUtc.format(fmtUtc) + "\r\n"
                + "SUMMARY:Entrevista Psicolaboral AquaChile - " + limpiarTextoIcs(cargo) + "\r\n"
                + "DESCRIPTION:" + limpiarTextoIcs(descripcion) + "\r\n"
                + "LOCATION:" + limpiarTextoIcs(modalidad) + "\r\n"
                + "STATUS:CONFIRMED\r\n"
                + "END:VEVENT\r\n"
                + "END:VCALENDAR\r\n";
    }

    private String construirUrlGoogleCalendar(
            String nombreCandidato,
            String cargo,
            String familiaCargo,
            Long solicitudId,
            LocalDateTime fechaHora,
            int duracionMinutos,
            String modalidad,
            String notas) {

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss");
        LocalDateTime fin = fechaHora.plusMinutes(duracionMinutos);

        String titulo = "Entrevista Psicolaboral AquaChile — " + nombreCandidato + " (" + cargo + ")";
        String detalles = "Candidato: " + nombreCandidato
                + "\nCargo: " + cargo + " (" + familiaCargo + ")"
                + "\nSolicitud: #SOL-" + solicitudId
                + (notas != null && !notas.isBlank() ? "\nNotas: " + notas : "");

        return "https://calendar.google.com/calendar/render?action=TEMPLATE"
                + "&text=" + URLEncoder.encode(titulo, StandardCharsets.UTF_8)
                + "&dates=" + fechaHora.format(fmt) + "/" + fin.format(fmt)
                + "&ctz=America/Santiago"
                + "&details=" + URLEncoder.encode(detalles, StandardCharsets.UTF_8)
                + "&location=" + URLEncoder.encode(modalidad, StandardCharsets.UTF_8);
    }

    private String limpiarTextoIcs(String texto) {
        if (texto == null) return "";
        return texto.replace(";", "\\;").replace(",", "\\,").replace("\r", "");
    }

    private String escaparHtml(String texto) {
        if (texto == null) return "";
        return texto.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}