package com.shopverse.controller;

import com.shopverse.dto.ProductDtos;
import com.shopverse.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ProductDtos.PageResponse<ProductDtos.ProductDto> list(
            @RequestParam(required = false) Long category,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "false") boolean include_inactive,
            @RequestParam(required = false) java.math.BigDecimal min_price,
            @RequestParam(required = false) java.math.BigDecimal max_price) {
        return productService.list(!include_inactive, category, q, sort, page, Math.min(size, 100),
                min_price, max_price);
    }

    @GetMapping("/{id}")
    public ProductDtos.ProductDto get(@PathVariable Long id) {
        return productService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public ProductDtos.ProductDto create(@Valid @RequestBody ProductDtos.ProductRequest request) {
        return productService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ProductDtos.ProductDto update(@PathVariable Long id, @Valid @RequestBody ProductDtos.ProductRequest request) {
        return productService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ProductDtos.ProductDto softDelete(@PathVariable Long id) {
        return productService.softDelete(id);
    }
}
