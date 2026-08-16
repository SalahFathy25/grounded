package com.shopverse.dto;

import jakarta.validation.constraints.NotBlank;

public record CategoryDtos() {

    public record CategoryRequest(
            @NotBlank String name,
            String name_ar,
            String image_url
    ) {}

    public record CategoryDto(Long id, String name, String name_ar, String image_url, long product_count) {}
}