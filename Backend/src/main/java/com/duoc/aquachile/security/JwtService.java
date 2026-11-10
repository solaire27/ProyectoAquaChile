package com.duoc.aquachile.security;

import com.duoc.aquachile.model.Usuario;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
public class JwtService {

    // IMPORTANTE: Debe ser EXACTAMENTE la misma clave que pusimos en el JwtFilter
    private final String SECRET_KEY = "AquaChileMVP2026_ClaveSecretaMuyLargaYSeguraParaFirmarElToken";

    public String generarToken(Usuario usuario) {
        long tiempoExpiracion = 1000 * 60 * 60 * 24; // El token durará 24 horas (en milisegundos)

        return Jwts.builder()
                .setSubject(usuario.getCorreo()) // El "dueño" del token
                .claim("rol", usuario.getRol().name()) // Inyectamos el rol para que el filtro lo lea después
                .setIssuedAt(new Date()) // Fecha de creación
                .setExpiration(new Date(System.currentTimeMillis() + tiempoExpiracion)) // Fecha de caducidad
                .signWith(SignatureAlgorithm.HS256, SECRET_KEY.getBytes()) // Firma algorítmica
                .compact(); // Empaqueta todo en el String final (ej: eyJhbGci...)
    }
}