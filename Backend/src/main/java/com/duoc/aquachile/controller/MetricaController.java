package com.duoc.aquachile.controller;

import com.duoc.aquachile.model.EstadoSolicitud;
import com.duoc.aquachile.model.RolUsuario;
import com.duoc.aquachile.model.SolicitudEvaluacion;
import com.duoc.aquachile.model.Usuario;
import com.duoc.aquachile.repository.SolicitudRepository;
import com.duoc.aquachile.repository.UsuarioRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/metricas")
public class MetricaController {

    private final UsuarioRepository usuarioRepository;
    private final SolicitudRepository solicitudRepository;

    public MetricaController(UsuarioRepository usuarioRepository, SolicitudRepository solicitudRepository) {
        this.usuarioRepository = usuarioRepository;
        this.solicitudRepository = solicitudRepository;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'ANALISTA')")
    @GetMapping("/psicologos")
    public ResponseEntity<Map<String, Object>> obtenerMetricasPsicologos() {
        List<Usuario> psicologos = usuarioRepository.findAll().stream()
                .filter(u -> u.getRol() == RolUsuario.PSICOLOGO)
                .toList();

        List<SolicitudEvaluacion> todasSolicitudes = solicitudRepository.findAll();

        long sinAsignar = todasSolicitudes.stream()
                .filter(s -> s.getResponsable() == null)
                .count();

        int totalAsignadasPsicologos = 0;
        List<Double> diasEquipo = new ArrayList<>();
        List<Map<String, Object>> listaPsicologos = new ArrayList<>();

        for (Usuario psi : psicologos) {
            List<SolicitudEvaluacion> asignadas = todasSolicitudes.stream()
                    .filter(s -> s.getResponsable() != null && s.getResponsable().getId().equals(psi.getId()))
                    .toList();

            int total = asignadas.size();
            totalAsignadasPsicologos += total;

            long pendientes = asignadas.stream()
                    .filter(s -> s.getEstado() == EstadoSolicitud.PENDIENTE || s.getEstado() == EstadoSolicitud.NUEVA_POSTULACION)
                    .count();
            long enEvaluacion = asignadas.stream()
                    .filter(s -> s.getEstado() == EstadoSolicitud.EN_PROCESO)
                    .count();
            long finalizadas = asignadas.stream()
                    .filter(s -> s.getEstado() == EstadoSolicitud.FINALIZADA)
                    .count();

            int tasaFinalizacion = total > 0 ? (int) Math.round((finalizadas * 100.0) / total) : 0;

            long aptos = asignadas.stream()
                    .filter(s -> s.getEvaluacion() != null && "Apto".equalsIgnoreCase(s.getEvaluacion().getResultadoGeneral()))
                    .count();
            long aptosObs = asignadas.stream()
                    .filter(s -> s.getEvaluacion() != null && "Apto con Observaciones".equalsIgnoreCase(s.getEvaluacion().getResultadoGeneral()))
                    .count();
            long noAptos = asignadas.stream()
                    .filter(s -> s.getEvaluacion() != null && "No Apto".equalsIgnoreCase(s.getEvaluacion().getResultadoGeneral()))
                    .count();

            List<Double> diasPsi = new ArrayList<>();
            for (SolicitudEvaluacion s : asignadas) {
                if (s.getFechaSolicitud() != null && s.getEvaluacion() != null && s.getEvaluacion().getFechaEvaluacion() != null) {
                    long horas = ChronoUnit.HOURS.between(s.getFechaSolicitud(), s.getEvaluacion().getFechaEvaluacion());
                    double dias = Math.max(0.0, horas / 24.0);
                    diasPsi.add(dias);
                    diasEquipo.add(dias);
                }
            }

            Double promedioDiasPsi = diasPsi.isEmpty() ? null
                    : Math.round(diasPsi.stream().mapToDouble(Double::doubleValue).average().orElse(0.0) * 10.0) / 10.0;

            Map<String, Object> item = new HashMap<>();
            item.put("psicologoId", psi.getId());
            item.put("nombre", psi.getNombre());
            item.put("correo", psi.getCorreo());
            item.put("totalAsignadas", total);
            item.put("pendientes", pendientes);
            item.put("enEvaluacion", enEvaluacion);
            item.put("finalizadas", finalizadas);
            item.put("tasaFinalizacion", tasaFinalizacion);
            item.put("aptos", aptos);
            item.put("aptosConObservaciones", aptosObs);
            item.put("noAptos", noAptos);
            item.put("promedioDiasResolucion", promedioDiasPsi);

            listaPsicologos.add(item);
        }

        Double promedioDiasEquipo = diasEquipo.isEmpty() ? null
                : Math.round(diasEquipo.stream().mapToDouble(Double::doubleValue).average().orElse(0.0) * 10.0) / 10.0;

        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("totalPsicologos", psicologos.size());
        respuesta.put("totalAsignadasPsicologos", totalAsignadasPsicologos);
        respuesta.put("sinAsignar", sinAsignar);
        respuesta.put("promedioDiasEquipo", promedioDiasEquipo);
        respuesta.put("psicologos", listaPsicologos);

        return ResponseEntity.ok(respuesta);
    }
}
