package com.shopverse.dto;

public record CategoryDtos() {

    public record CategoryRequest(
            String name,
            String name_ar,
            String image_url
    ) {}

    public record CategoryDto(Long id, String name, String name_ar, String image_url, long product_count) {}
}