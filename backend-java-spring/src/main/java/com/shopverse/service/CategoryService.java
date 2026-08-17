package com.shopverse.service;

import com.shopverse.domain.Category;
import com.shopverse.dto.CategoryDtos;
import com.shopverse.exception.ConflictException;
import com.shopverse.exception.NotFoundException;
import com.shopverse.repository.CategoryRepository;
import com.shopverse.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CategoryService(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    public List<CategoryDtos.CategoryDto> list() {
        return categoryRepository.findAll().stream()
                .map(c -> new CategoryDtos.CategoryDto(c.getId(), c.getName(), c.getNameAr(), c.getImageUrl(),
                        productRepository.countByCategoryIdAndIsActive(c.getId(), true)))
                .toList();
    }

    public CategoryDtos.CategoryDto create(CategoryDtos.CategoryRequest request) {
        if (categoryRepository.existsByNameIgnoreCase(request.name())) {
            throw new ConflictException("Category name already exists");
        }
        String imageUrl = request.image_url() != null && !request.image_url().isBlank()
                ? request.image_url()
                : "https://picsum.photos/seed/sv-" + request.name().toLowerCase().replaceAll("[^a-z0-9]+", "-") + "/400/300";
        Category category = categoryRepository.save(new Category(request.name(), request.name_ar(), imageUrl));
        return toDto(category);
    }

    public CategoryDtos.CategoryDto toDto(Category category) {
        return new CategoryDtos.CategoryDto(category.getId(), category.getName(), category.getNameAr(),
                category.getImageUrl(), productRepository.countByCategoryIdAndIsActive(category.getId(), true));
    }

    public void delete(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Category not found"));
        if (productRepository.countByCategoryId(category.getId()) > 0) {
            throw new ConflictException("Cannot delete a category that still has products");
        }
        categoryRepository.delete(category);
    }
}