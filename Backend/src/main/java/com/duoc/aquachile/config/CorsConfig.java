package com.duoc.aquachile.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.ArrayList;
import java.util.List;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${app.frontend.url:}")
    private String frontendUrl;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        List<String> origenes = new ArrayList<>();
        origenes.add("http://localhost:5173");
        origenes.add("http://localhost:8080");

        if (frontendUrl != null && !frontendUrl.isBlank()) {
            for (String url : frontendUrl.split(",")) {
                String limpia = url.trim().replaceAll("/+$", "");
                if (!limpia.isBlank()) {
                    origenes.add(limpia);
                }
            }
        }

        registry.addMapping("/api/**")
                .allowedOrigins(origenes.toArray(new String[0]))
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
}