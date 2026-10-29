package com.duoc.aquachile.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults()) // <-- Esta línea enlaza tu Security con tu CorsConfig
                .csrf(csrf -> csrf.disable())    // Apaga el bloqueo de escritura
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll()    // Libera todas las rutas
                );

        return http.build();
    }
}