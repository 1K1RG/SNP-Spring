package com.irri.microservices.api_gateway.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.util.List;

@Order(1) // Ensure CORS filter runs first
@Component
public class JwtAuthenticationFilter implements Filter {

    private static final String SECRET_KEY = "CFE2N5hF+14cLKT9m5/qi7vsAqcrDh3fJ4XQE19pOyY=";

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(SECRET_KEY);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    private boolean isTokenValid(String token) {
        try {
            extractAllClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        // Skip OPTIONS requests
        if (HttpMethod.OPTIONS.name().equals(httpRequest.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        // Public routes that don't require authentication
        List<String> publicRoutes = List.of(
                "/api/user/register",
                "/api/user/login",
                "/api/geneloci/searchByGeneName",
                "/api/geneloci/searchByRegion",
                "/api/geneloci/searchByAnnotation",
                "/api/geneloci/searchByTrait",
                "/api/geneloci/getTraitNames",
                "/api/geneloci/getGenesByIds",
                "/api/geneloci/getGeneNamesByIds",
                "/api/geneloci/getContigStartEndOfGene",
                "/api/geneloci/getAllReferenceGenomes",
                "/api/variety/getAllSnpSetAndVarietySet",
                "/api/variety/getVarietiesByIds",
                "/api/variety/getVarietyNamesByIds",
                "/api/variety/getAllReferenceGenomeNames",
                "/api/variety/genotypeSearchRange"

        );

        // Get the request path
        String path = httpRequest.getRequestURI();


        if (publicRoutes.contains(path)) {
            System.out.println("Skipping authentication for public route: " + path);
            chain.doFilter(request, response); //allow the request to pass through the filter
            return;
        }

        // Get JWT Token from Authorization Header
        String token = httpRequest.getHeader(HttpHeaders.AUTHORIZATION);

        if (token == null || !token.startsWith("Bearer ")) {
            httpResponse.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Missing or invalid token");
            return;
        }

        token = token.substring(7); // Remove "Bearer " prefix

        if (!isTokenValid(token)) {
            httpResponse.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid token");
            return;
        }

        String userRole = extractRole(token);

        //Role-Based Access Control
        // ADD MORE IN THE FUTURE
        if (path.matches("^/api/[^/]+/admin(/.*)?$") && !userRole.equals("ADMIN")) {
            httpResponse.sendError(HttpServletResponse.SC_FORBIDDEN, "You do not have permission to access this resource");
            return;
        } else if (path.matches("^/api/[^/]+/general(/.*)?$") && !(userRole.equals("USER") || userRole.equals("ADMIN"))) {
            httpResponse.sendError(HttpServletResponse.SC_FORBIDDEN, "You do not have permission to access this resource");
            return;
        } else if (path.matches("^/api/[^/]+/user(/.*)?$") && !userRole.equals("USER")) {
            httpResponse.sendError(HttpServletResponse.SC_FORBIDDEN, "You do not have permission to access this resource");
            return;
        }

        chain.doFilter(request, response); //allow the request to pass through the filter
    }
}
