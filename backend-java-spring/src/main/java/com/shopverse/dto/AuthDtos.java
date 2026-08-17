package com.shopverse.dto;

public record AuthDtos() {

    public record LoginRequest(
            String email,
            String password
    ) {}

    public record RegisterRequest(
            String full_name,
            String email,
            String password
    ) {}

    public record UserDto(Long id, String full_name, String email, String role) {}

    public record AuthResponse(String token, UserDto user) {}
}