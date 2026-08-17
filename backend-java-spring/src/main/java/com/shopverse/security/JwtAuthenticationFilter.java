package com.shopverse.security;

import com.google.gson.Gson;
import com.shopverse.domain.Role;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Map;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    public static final String CURRENT_USER_ROLE = "authRole";
    public static final String CURRENT_USER_EMAIL = "authEmail";

    private final JwtTokenProvider jwtTokenProvider;
    private final Gson gson;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider, Gson gson) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.gson = gson;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String uri = request.getRequestURI();
        String method = request.getMethod();

        if (!uri.startsWith("/api/") || isPublic(uri, method)) {
            filterChain.doFilter(request, response);
            return;
        }

        String header = request.getHeader("Authorization");
        String email = null;
        String role = null;
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            if (jwtTokenProvider.isValid(token)) {
                email = jwtTokenProvider.extractEmail(token);
                role = jwtTokenProvider.extractRole(token);
            }
        }

        if (email == null) {
            writeError(response, HttpServletResponse.SC_UNAUTHORIZED, "Authentication required", uri);
            return;
        }

        request.setAttribute(CURRENT_USER_EMAIL, email);
        request.setAttribute(CURRENT_USER_ROLE, role);

        if (requiresAdmin(uri, method) && !Role.ROLE_ADMIN.name().equals(role)) {
            writeError(response, HttpServletResponse.SC_FORBIDDEN, "Admin access required", uri);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void writeError(HttpServletResponse response, int status, String message, String uri) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        Map<String, Object> body = Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "status", status,
                "message", message,
                "path", uri);
        response.getWriter().write(gson.toJson(body));
    }

    private boolean isPublic(String uri, String method) {
        if (uri.startsWith("/api/v1/auth/")) return true;
        if (uri.equals("/api/v1/settings") || uri.equals("/api/v1/content") || uri.equals("/api/v1/categories")) return true;
        if ("GET".equalsIgnoreCase(method) && (uri.equals("/api/v1/products") || uri.startsWith("/api/v1/products/"))) return true;
        if ("POST".equalsIgnoreCase(method) && uri.equals("/api/v1/payments/webhook")) return true;
        return false;
    }

    private boolean requiresAdmin(String uri, String method) {
        if (uri.startsWith("/api/v1/admin")) return true;
        if ("GET".equalsIgnoreCase(method) && uri.equals("/api/v1/orders")) return true;
        if ("PATCH".equalsIgnoreCase(method) && uri.matches("/api/v1/orders/\\d+/status")) return true;
        if (uri.startsWith("/api/v1/products") && !"GET".equalsIgnoreCase(method)) return true;
        if (uri.equals("/api/v1/categories") && !"GET".equalsIgnoreCase(method)) return true;
        return false;
    }
}