package com.duoc.aquachile.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtFilter extends OncePerRequestFilter {

    // Nota: Para la evaluación, puedes dejar esta clave aquí, pero en el mundo real
    // se inyecta desde el .env usando @Value("${jwt.secret}")
    private final String SECRET_KEY = "AquaChileMVP2026_ClaveSecretaMuyLargaYSeguraParaFirmarElToken";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7); // Quita la palabra "Bearer "

            try {
                // 1. Desencriptar el token
                Claims claims = Jwts.parserBuilder()
                        .setSigningKey(SECRET_KEY.getBytes())
                        .build()
                        .parseClaimsJws(token)
                        .getBody();

                // 2. Extraer datos (Usuario y Rol)
                String correo = claims.getSubject();
                String rol = claims.get("rol", String.class);

                // 3. Crear Autoridad (Spring Security requiere el prefijo "ROLE_")
                GrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + rol);

                // 4. Autenticar la petición en el contexto de Spring
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                        correo, null, Collections.singletonList(authority));

                SecurityContextHolder.getContext().setAuthentication(auth);

            } catch (Exception e) {
                // Si el token expiró o fue manipulado, se limpia el contexto y se rechaza
                SecurityContextHolder.clearContext();
            }
        }

        // Continuar con la cadena de filtros hacia el controlador
        filterChain.doFilter(request, response);
    }
}