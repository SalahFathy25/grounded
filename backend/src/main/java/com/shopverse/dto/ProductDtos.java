package com.shopverse.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ProductDtos() {

    public record ProductRequest(
            @NotBlank String name,
            String description,
            @NotNull @DecimalMin("0.01") BigDecimal price,
            @Min(0) Integer stock_quantity,
            Long category_id,
            String image_url,
            Boolean is_active,
            @DecimalMin("0") @Max(99) BigDecimal discount_percent,
            String sku,
            String brand,
            String material,
            String color,
            String sizes,
            String tags,
            @DecimalMin("0") BigDecimal cost_price,
            @Min(0) Integer reorder_level,
            Boolean featured,
            List<String> images
    ) {}

    public record ProductDto(
            Long id, String name, String description, BigDecimal price, BigDecimal sale_price, int stock_quantity,
            Long category_id, String category_name, String category_name_ar, String image_url, boolean is_active,
            BigDecimal discount_percent, String sku, String brand, String material, String color, String sizes,
            String tags, BigDecimal cost_price, int reorder_level, boolean featured,
            double rating, int reviews_count, List<String> images, LocalDateTime created_at
    ) {}

    public record PageResponse<T>(List<T> content, long totalElements, int totalPages, int page, int size) {}
}