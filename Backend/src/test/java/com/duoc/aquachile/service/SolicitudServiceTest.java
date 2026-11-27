package com.duoc.aquachile.service;

import com.duoc.aquachile.dto.CandidatoRequestDTO;
import com.duoc.aquachile.dto.EntrevistaRequestDTO;
import com.duoc.aquachile.dto.SolicitudEstadoUpdateDTO;
import com.duoc.aquachile.dto.SolicitudRequestDTO;
import com.duoc.aquachile.exception.ConflictException;
import com.duoc.aquachile.exception.ResourceNotFoundException;
import com.duoc.aquachile.model.Candidato;
import com.duoc.aquachile.model.EstadoSolicitud;
import com.duoc.aquachile.model.SolicitudEvaluacion;
import com.duoc.aquachile.model.Usuario;
import com.duoc.aquachile.repository.SolicitudRepository;
import com.duoc.aquachile.repository.UsuarioRepository;
import com.duoc.aquachile.service.integration.AiService;
import com.duoc.aquachile.service.integration.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SolicitudServiceTest {

    @Mock
    private SolicitudRepository solicitudRepository;
    @Mock
    private CandidatoService candidatoService;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private AiService aiService;
    @Mock
    private EmailService emailService;

    @InjectMocks
    private SolicitudService solicitudService;

    private Candidato candidato;
    private SolicitudEvaluacion solicitud;
    private Usuario responsable;

    @BeforeEach
    void setUp() {
        candidato = new Candidato();
        candidato.setId(1L);
        candidato.setRut("12345678-9");
        candidato.setNombre("María González");
        candidato.setCorreo("maria@test.cl");
        candidato.setUrlCv("uploads/cv.pdf");

        responsable = new Usuario();
        responsable.setId(5L);
        responsable.setNombre("Reclutador Admin");

        solicitud = new SolicitudEvaluacion();
        solicitud.setId(100L);
        solicitud.setCandidato(candidato);
        solicitud.setCargo("Operario de Planta");
        solicitud.setFamiliaCargo("Operativo");
        solicitud.setEstado(EstadoSolicitud.NUEVA_POSTULACION);
    }

    @Test
    void crearSolicitudPublica_Exitoso_CreaSolicitudYEnviaCorreo() {
        CandidatoRequestDTO dto = new CandidatoRequestDTO();
        dto.setCargoPostulacion("Operario de Planta");
        dto.setFamiliaCargo("Operativo");
        dto.setUrlCv("uploads/cv.pdf");

        when(candidatoService.crearCandidato(dto, "uploads/cv.pdf")).thenReturn(candidato);
        when(solicitudRepository.existsByCandidatoIdAndCargoIgnoreCase(1L, "Operario de Planta")).thenReturn(false);
        when(solicitudRepository.save(any(SolicitudEvaluacion.class))).thenAnswer(inv -> {
            SolicitudEvaluacion s = inv.getArgument(0);
            s.setId(100L);
            return s;
        });

        SolicitudEvaluacion creada = solicitudService.crearSolicitud(dto);

        assertEquals(EstadoSolicitud.NUEVA_POSTULACION, creada.getEstado());
        assertEquals("Operario de Planta", creada.getCargo());
        verify(emailService, timeout(1000)).enviarConfirmacionPostulacion(
                eq("maria@test.cl"), eq("María González"), eq("Operario de Planta"), eq(100L)
        );
    }

    @Test
    void crearSolicitudPublica_Duplicada_LanzaConflictException() {
        CandidatoRequestDTO dto = new CandidatoRequestDTO();
        dto.setCargoPostulacion("Operario de Planta");

        when(candidatoService.crearCandidato(dto, null)).thenReturn(candidato);
        when(solicitudRepository.existsByCandidatoIdAndCargoIgnoreCase(1L, "Operario de Planta")).thenReturn(true);

        assertThrows(ConflictException.class, () -> solicitudService.crearSolicitud(dto));
    }

    @Test
    void crearSolicitudInterna_ConResponsable_GuardaEstadoPendiente() {
        SolicitudRequestDTO dto = new SolicitudRequestDTO();
        dto.setCandidatoId(1L);
        dto.setCargo("Analista Contable");
        dto.setFamiliaCargo("Administrativo");
        dto.setObservaciones("Ingreso interno");
        dto.setResponsableId(5L);

        when(candidatoService.obtenerPorId(1L)).thenReturn(candidato);
        when(solicitudRepository.existsByCandidatoIdAndCargoIgnoreCase(1L, "Analista Contable")).thenReturn(false);
        when(usuarioRepository.findById(5L)).thenReturn(Optional.of(responsable));
        when(solicitudRepository.save(any(SolicitudEvaluacion.class))).thenAnswer(inv -> inv.getArgument(0));

        SolicitudEvaluacion creada = solicitudService.crearSolicitud(dto);

        assertEquals(EstadoSolicitud.PENDIENTE, creada.getEstado());
        assertEquals(responsable, creada.getResponsable());
    }

    @Test
    void agendarEntrevista_MueveAEnProcesoYDisparaCorreoEIA() {
        EntrevistaRequestDTO dto = new EntrevistaRequestDTO();
        dto.setFechaHora(LocalDateTime.now().plusDays(2));
        dto.setDuracionMinutos(60);
        dto.setModalidad("Presencial");
        dto.setNotas("Traer cédula");
        dto.setResponsableId(5L);
        dto.setMoverAEnProceso(true);

        when(solicitudRepository.findById(100L)).thenReturn(Optional.of(solicitud));
        when(usuarioRepository.findById(5L)).thenReturn(Optional.of(responsable));
        when(solicitudRepository.save(any(SolicitudEvaluacion.class))).thenAnswer(inv -> inv.getArgument(0));
        when(aiService.evaluarCvConIA("uploads/cv.pdf", "Operario de Planta")).thenReturn("Candidato recomendado");

        SolicitudEvaluacion resultado = solicitudService.agendarEntrevista(100L, dto);

        assertEquals(EstadoSolicitud.EN_PROCESO, resultado.getEstado());
        assertEquals(60, resultado.getDuracionEntrevistaMinutos());
        assertEquals("Presencial", resultado.getModalidadEntrevista());
        verify(emailService, timeout(1000)).enviarInvitacionEntrevista(
                eq("maria@test.cl"), eq("María González"), eq("Operario de Planta"),
                eq("Operativo"), eq(100L), any(), eq(60), eq("Presencial"), eq("Traer cédula")
        );
        verify(aiService, timeout(1000)).evaluarCvConIA("uploads/cv.pdf", "Operario de Planta");
    }

    @Test
    void actualizarEstado_SinCv_AsignaMensajeSinArchivo() {
        candidato.setUrlCv(null);
        SolicitudEstadoUpdateDTO dto = new SolicitudEstadoUpdateDTO();
        dto.setEstado(EstadoSolicitud.PENDIENTE);

        when(solicitudRepository.findById(100L)).thenReturn(Optional.of(solicitud));
        when(solicitudRepository.save(any(SolicitudEvaluacion.class))).thenAnswer(inv -> inv.getArgument(0));

        SolicitudEvaluacion actualizada = solicitudService.actualizarEstado(100L, dto);

        assertEquals("El candidato no adjuntó un archivo CV para analizar.", actualizada.getRecomendacionIa());
    }

    @Test
    void procesarEvaluacionEnSegundoPlano_IaRespondeVacio_GuardaMensajeError() {
        when(aiService.evaluarCvConIA("uploads/cv.pdf", "Operario de Planta")).thenReturn("   ");
        when(solicitudRepository.findById(100L)).thenReturn(Optional.of(solicitud));
        when(solicitudRepository.save(any(SolicitudEvaluacion.class))).thenAnswer(inv -> inv.getArgument(0));

        solicitudService.procesarEvaluacionEnSegundoPlano(100L, "uploads/cv.pdf", "Operario de Planta");

        assertTrue(solicitud.getRecomendacionIa().startsWith("Error al procesar el CV con IA"));
    }

    @Test
    void procesarEvaluacionEnSegundoPlano_IaLanzaExcepcion_CapturaYGuardaError() {
        when(aiService.evaluarCvConIA(anyString(), anyString())).thenThrow(new RuntimeException("Timeout Gemini"));
        when(solicitudRepository.findById(100L)).thenReturn(Optional.of(solicitud));
        when(solicitudRepository.save(any(SolicitudEvaluacion.class))).thenAnswer(inv -> inv.getArgument(0));

        solicitudService.procesarEvaluacionEnSegundoPlano(100L, "uploads/cv.pdf", "Operario de Planta");

        assertTrue(solicitud.getRecomendacionIa().contains("Timeout Gemini"));
    }

    @Test
    void reintentarAnalisisIa_LimpiaYDispara() {
        solicitud.setRecomendacionIa("Error previo");
        when(solicitudRepository.findById(100L)).thenReturn(Optional.of(solicitud));
        when(solicitudRepository.save(any(SolicitudEvaluacion.class))).thenAnswer(inv -> inv.getArgument(0));
        when(aiService.evaluarCvConIA(anyString(), anyString())).thenReturn("Nuevo análisis OK");

        SolicitudEvaluacion resultado = solicitudService.reintentarAnalisisIa(100L);

        assertNotNull(resultado);
        verify(aiService, timeout(1000)).evaluarCvConIA("uploads/cv.pdf", "Operario de Planta");
    }

    @Test
    void crearSolicitudAutomatica_YEliminar_FuncionanCorrectamente() {
        when(candidatoService.obtenerPorId(1L)).thenReturn(candidato);
        when(solicitudRepository.save(any(SolicitudEvaluacion.class))).thenAnswer(inv -> inv.getArgument(0));
        when(solicitudRepository.findById(100L)).thenReturn(Optional.of(solicitud));

        SolicitudEvaluacion auto = solicitudService.crearSolicitudAutomatica(1L, "Soporte TI", "TI");
        assertEquals(EstadoSolicitud.NUEVA_POSTULACION, auto.getEstado());

        solicitudService.eliminarSolicitud(100L);
        verify(solicitudRepository).delete(solicitud);
    }

    @Test
    void consultasPublicas_PorRutNombreYCorreo_RetornanResultados() {
        when(solicitudRepository.findFirstByCandidatoRutIgnoreCaseAndCandidatoCorreoIgnoreCaseOrderByFechaSolicitudDesc("12345678-9", "maria@test.cl"))
                .thenReturn(Optional.of(solicitud));
        when(solicitudRepository.findFirstByCandidatoNombreIgnoreCaseAndCandidatoCorreoIgnoreCaseOrderByFechaSolicitudDesc("María González", "maria@test.cl"))
                .thenReturn(Optional.of(solicitud));
        when(solicitudRepository.findByCandidatoCorreoIgnoreCaseOrderByFechaSolicitudDesc("maria@test.cl"))
                .thenReturn(List.of(solicitud));
        when(solicitudRepository.findByCandidatoNombreContainingIgnoreCaseOrderByFechaSolicitudDesc("María"))
                .thenReturn(List.of(solicitud));
        when(solicitudRepository.findAll()).thenReturn(List.of(solicitud));

        assertEquals(solicitud, solicitudService.consultarSolicitudPublica("12345678-9", "maria@test.cl"));
        assertEquals("NUEVA_POSTULACION", solicitudService.consultarEstadoPublico("María González", "maria@test.cl"));
        assertEquals(1, solicitudService.buscarSolicitudesPublicas("maria@test.cl", null).size());
        assertEquals(1, solicitudService.buscarSolicitudesPublicas(null, "María").size());
        assertTrue(solicitudService.buscarSolicitudesPublicas("", "").isEmpty());
        assertEquals(1, solicitudService.obtenerTodas().size());
    }

    @Test
    void consultarSolicitudPublica_NoEncontrada_LanzaExcepcion() {
        when(solicitudRepository.findFirstByCandidatoRutIgnoreCaseAndCandidatoCorreoIgnoreCaseOrderByFechaSolicitudDesc(anyString(), anyString()))
                .thenReturn(Optional.empty());
        when(solicitudRepository.findFirstByCandidatoNombreIgnoreCaseAndCandidatoCorreoIgnoreCaseOrderByFechaSolicitudDesc(anyString(), anyString()))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> solicitudService.consultarSolicitudPublica("00000000-0", "noexiste@test.cl"));
    }
}