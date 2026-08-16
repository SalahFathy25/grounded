package com.shopverse.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopverse.domain.Category;
import com.shopverse.domain.Product;
import com.shopverse.dto.ProductDtos;
import com.shopverse.exception.NotFoundException;
import com.shopverse.repository.CategoryRepository;
import com.shopverse.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ObjectMapper objectMapper;

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository,
                          ObjectMapper objectMapper) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.objectMapper = objectMapper;
    }

    public ProductDtos.PageResponse<ProductDtos.ProductDto> list(boolean activeOnly, Long categoryId, String keyword,
                                                                 String sort, int page, int size,
                                                                 BigDecimal minPrice, BigDecimal maxPrice) {
        Pageable pageable = switch (sort == null ? "" : sort) {
            case "price_asc" -> PageRequest.of(page, size, Sort.by("price").ascending());
            case "price_desc" -> PageRequest.of(page, size, Sort.by("price").descending());
            default -> PageRequest.of(page, size, Sort.by("createdAt").descending());
        };
        Page<Product> result = productRepository.search(activeOnly, categoryId,
                keyword == null || keyword.isBlank() ? null : keyword.trim(), minPrice, maxPrice, pageable);
        return new ProductDtos.PageResponse<>(
                result.getContent().stream().map(this::toDto).toList(),
                result.getTotalElements(),
                result.getTotalPages(),
                page,
                size);
    }

    public ProductDtos.ProductDto get(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Product not found"));
        if (!product.isActive()) {
            throw new NotFoundException("Product not found");
        }
        return toDto(product);
    }

    public ProductDtos.ProductDto create(ProductDtos.ProductRequest request) {
        Product product = new Product();
        apply(product, request);
        productRepository.save(product);
        if (product.getSku() == null || product.getSku().isBlank()) {
            product.setSku("GR-" + String.format("%03d", product.getId()));
            productRepository.save(product);
        }
        return toDto(product);
    }

    public ProductDtos.ProductDto update(Long id, ProductDtos.ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Product not found"));
        apply(product, request);
        productRepository.save(product);
        return toDto(product);
    }

    public ProductDtos.ProductDto softDelete(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Product not found"));
        product.setActive(!product.isActive());
        productRepository.save(product);
        return toDto(product);
    }

    private void apply(Product product, ProductDtos.ProductRequest request) {
        if (request.name() != null) product.setName(request.name());
        if (request.description() != null) product.setDescription(request.description());
        if (request.price() != null) product.setPrice(request.price());
        if (request.stock_quantity() != null) product.setStockQuantity(request.stock_quantity());
        if (request.is_active() != null) product.setActive(request.is_active());
        if (request.discount_percent() != null) {
            BigDecimal disc = request.discount_percent();
            product.setDiscountPercent(disc.compareTo(BigDecimal.ZERO) < 0 || disc.compareTo(new BigDecimal("99")) > 0
                    ? BigDecimal.ZERO : disc);
        }
        if (request.sku() != null && !request.sku().isBlank()) product.setSku(request.sku());
        if (request.brand() != null) product.setBrand(request.brand());
        if (request.material() != null) product.setMaterial(request.material());
        if (request.color() != null) product.setColor(request.color());
        if (request.sizes() != null) product.setSizes(request.sizes());
        if (request.tags() != null) product.setTags(request.tags());
        if (request.cost_price() != null) product.setCostPrice(request.cost_price());
        if (request.reorder_level() != null) product.setReorderLevel(request.reorder_level());
        if (request.featured() != null) product.setFeatured(request.featured());
        if (request.category_id() != null) {
            Category category = categoryRepository.findById(request.category_id())
                    .orElseThrow(() -> new NotFoundException("Category not found"));
            product.setCategory(category);
        }
        if (request.images() != null) {
            List<String> clean = request.images().stream()
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .distinct()
                    .limit(12)
                    .toList();
            product.setImagesJson(writeList(clean));
        }
        if (request.image_url() != null && !request.image_url().isBlank()) {
            product.setImageUrl(request.image_url());
        } else if (product.getImageUrl() == null) {
            product.setImageUrl("https://picsum.photos/seed/sv-" + product.getName().toLowerCase().replaceAll("[^a-z0-9]+", "-") + "/800/800");
        }
        if (product.getPrice() == null) product.setPrice(BigDecimal.ZERO);
    }

    public ProductDtos.ProductDto toDto(Product product) {
        BigDecimal salePrice = product.getPrice();
        BigDecimal disc = product.getDiscountPercent();
        if (disc != null && disc.compareTo(BigDecimal.ZERO) > 0 && disc.compareTo(new BigDecimal("99")) < 0) {
            salePrice = product.getPrice()
                    .multiply(BigDecimal.ONE.subtract(disc.divide(new BigDecimal("100"))))
                    .setScale(2, RoundingMode.HALF_UP);
        }
        return new ProductDtos.ProductDto(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                salePrice,
                product.getStockQuantity(),
                product.getCategory() != null ? product.getCategory().getId() : null,
                product.getCategory() != null ? product.getCategory().getName() : "General",
                product.getCategory() != null ? product.getCategory().getNameAr() : null,
                product.getImageUrl(),
                product.isActive(),
                product.getDiscountPercent(),
                product.getSku(),
                product.getBrand(),
                product.getMaterial(),
                product.getColor(),
                product.getSizes(),
                product.getTags(),
                product.getCostPrice(),
                product.getReorderLevel(),
                product.isFeatured(),
                product.getRating() == null ? 0.0 : product.getRating(),
                product.getReviewsCount(),
                readList(product.getImagesJson()),
                product.getCreatedAt());
    }

    private List<String> readList(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    private String writeList(List<String> list) {
        try {
            return objectMapper.writeValueAsString(list);
        } catch (Exception e) {
            return "[]";
        }
    }
}