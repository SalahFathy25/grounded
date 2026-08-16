package com.shopverse.repository;

import com.shopverse.domain.Category;
import com.shopverse.domain.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query("""
            SELECT p FROM Product p
            WHERE (:activeOnly = false OR p.isActive = true)
              AND (:categoryId IS NULL OR p.category.id = :categoryId)
              AND (:minPrice IS NULL OR p.price >= :minPrice)
              AND (:maxPrice IS NULL OR p.price <= :maxPrice)
              AND (:kwPattern IS NULL OR
                   LOWER(p.name) LIKE :kwPattern OR
                   LOWER(p.description) LIKE :kwPattern OR
                   LOWER(p.tags) LIKE :kwPattern OR
                   LOWER(p.brand) LIKE :kwPattern OR
                   LOWER(p.material) LIKE :kwPattern)
            """)
    Page<Product> search(@Param("activeOnly") boolean activeOnly,
                         @Param("categoryId") Long categoryId,
                         @Param("kwPattern") String kwPattern,
                         @Param("minPrice") java.math.BigDecimal minPrice,
                         @Param("maxPrice") java.math.BigDecimal maxPrice,
                         Pageable pageable);

    long countByCategory(Category category);

    long countByCategoryId(Long categoryId);

    long countByCategoryIdAndIsActive(Long categoryId, boolean isActive);

    long countByIsActive(boolean isActive);

    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.stockQuantity < :threshold ORDER BY p.stockQuantity ASC")
    List<Product> findLowStock(@Param("threshold") int threshold, Pageable pageable);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status <> 'CANCELLED'")
    java.math.BigDecimal sumRevenue();
}
