package com.shopverse.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AuthDtos() {

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password
    ) {}

    public record RegisterRequest(
            @NotBlank @Size(min = 3, max = 100) String full_name,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6, max = 100) String password
    ) {}

    public record UserDto(Long id, String full_name, String email, String role) {}

    public record AuthResponse(String token, UserDto user) {}
}
