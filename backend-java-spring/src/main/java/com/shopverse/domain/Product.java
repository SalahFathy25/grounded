package com.shopverse.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    private Long id;

    private String name;

    private String description;

    private BigDecimal price;

    private int stockQuantity = 0;

    private Category category;

    private String imageUrl;

    private boolean isActive = true;

    private BigDecimal discountPercent = BigDecimal.ZERO;

    private String sku;

    private String brand;

    private String material;

    private String color;

    private String sizes;

    private String tags;

    private BigDecimal costPrice;

    private int reorderLevel = 5;

    private boolean featured = false;

    private LocalDateTime createdAt;

    private Double rating = 0.0;

    private int reviewsCount = 0;

    private String imagesJson = "[]";
}
