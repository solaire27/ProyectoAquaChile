package com.duoc.aquachile.config;

import com.duoc.aquachile.security.JwtFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // ¡CRÍTICO! Esto permite usar @PreAuthorize en los Controllers
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    // Inyección de dependencias de nuestro filtro
    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())

                // 1. Apagar sesiones tradicionales (JWT es Stateless / sin estado)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 2. Proteger las rutas
                .authorizeHttpRequests(auth -> auth
                        // Rutas públicas que no piden token (Login y formulario de postulación)
                        .requestMatchers("/api/auth/**", "/api/postulaciones/public").permitAll()

                        // Todo lo demás REQUIERE estar autenticado con un token válido
                        .anyRequest().authenticated()
                )

                // 3. Insertar nuestro filtro JWT ANTES del filtro estándar de Spring Security
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
    @Bean
    public org.springframework.security.crypto.password.PasswordEncoder passwordEncoder() {
        return new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
    }
}