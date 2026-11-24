package com.duoc.aquachile.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class PromptCargoDTO {

    private String cargo;

    @JsonProperty("familia_cargo")
    private String familiaCargo;

    private Requisitos requisitos;

    @JsonProperty("palabras_clave")
    private List<String> palabrasClave;

    @JsonProperty("puntos_negativos")
    private List<String> puntosNegativos;

    @JsonProperty("prompt_base")
    private String promptBase;

    @JsonProperty("respuesta_guia_esperada")
    private RespuestaGuia respuestaGuiaEsperada;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Requisitos {
        @JsonProperty("anios_experiencia_minimos")
        private Integer aniosExperienciaMinimos;

        private List<String> habilidades;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class RespuestaGuia {
        @JsonProperty("ejemplo_salida")
        private String ejemploSalida;
    }
}