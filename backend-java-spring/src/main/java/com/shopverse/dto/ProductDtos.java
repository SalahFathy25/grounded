package com.shopverse.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ProductDtos() {

    public record ProductRequest(
            String name,
            String description,
            BigDecimal price,
            Integer stock_quantity,
            Long category_id,
            String image_url,
            Boolean is_active,
            BigDecimal discount_percent,
            String sku,
            String brand,
            String material,
            String color,
            String sizes,
            String tags,
            BigDecimal cost_price,
            Integer reorder_level,
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