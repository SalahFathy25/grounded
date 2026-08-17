package com.shopverse.repository;

import com.shopverse.domain.Product;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class ProductRepository {

    private static final String SELECT_COLS =
            "SELECT p.id, p.name, p.description, p.price, p.stock_quantity, p.category_id, p.image_url, " +
            "p.is_active, p.discount_percent, p.sku, p.brand, p.material, p.color, p.sizes, p.tags, " +
            "p.cost_price, p.reorder_level, p.featured, p.created_at, p.rating, p.reviews_count, p.images_json, " +
            "c.name AS cat_name, c.name_ar AS cat_name_ar " +
            "FROM products p LEFT JOIN categories c ON p.category_id = c.id ";

    private final JdbcTemplate jdbc;

    public ProductRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<Product> findById(Long id) {
        List<Product> list = jdbc.query(SELECT_COLS + "WHERE p.id = ?", ProductRepository::mapProduct, id);
        return list.stream().findFirst();
    }

    public Product save(Product product) {
        if (product.getId() == null) {
            insert(product);
        } else {
            update(product);
        }
        return product;
    }

    private void insert(Product p) {
        if (p.getCreatedAt() == null) p.setCreatedAt(LocalDateTime.now());
        KeyHolder kh = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement("""
                    INSERT INTO products (name, description, price, stock_quantity, category_id, image_url,
                        is_active, discount_percent, sku, brand, material, color, sizes, tags, cost_price,
                        reorder_level, featured, created_at, rating, reviews_count, images_json)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    PreparedStatement.RETURN_GENERATED_KEYS);
            ps.setString(1, p.getName());
            ps.setString(2, p.getDescription());
            ps.setBigDecimal(3, p.getPrice());
            ps.setInt(4, p.getStockQuantity());
            ps.setObject(5, p.getCategory() != null ? p.getCategory().getId() : null);
            ps.setString(6, p.getImageUrl());
            ps.setBoolean(7, p.isActive());
            ps.setBigDecimal(8, p.getDiscountPercent() != null ? p.getDiscountPercent() : BigDecimal.ZERO);
            ps.setString(9, p.getSku());
            ps.setString(10, p.getBrand());
            ps.setString(11, p.getMaterial());
            ps.setString(12, p.getColor());
            ps.setString(13, p.getSizes());
            ps.setString(14, p.getTags());
            ps.setBigDecimal(15, p.getCostPrice());
            ps.setInt(16, p.getReorderLevel());
            ps.setBoolean(17, p.isFeatured());
            ps.setTimestamp(18, Timestamp.valueOf(p.getCreatedAt()));
            ps.setDouble(19, p.getRating() != null ? p.getRating() : 0.0);
            ps.setInt(20, p.getReviewsCount());
            ps.setString(21, p.getImagesJson() != null ? p.getImagesJson() : "[]");
            return ps;
        }, kh);
        Number key = kh.getKey();
        if (key != null) p.setId(key.longValue());
    }

    private void update(Product p) {
        jdbc.update("""
                UPDATE products SET name = ?, description = ?, price = ?, stock_quantity = ?, category_id = ?,
                    image_url = ?, is_active = ?, discount_percent = ?, sku = ?, brand = ?, material = ?,
                    color = ?, sizes = ?, tags = ?, cost_price = ?, reorder_level = ?, featured = ?,
                    rating = ?, reviews_count = ?, images_json = ?
                WHERE id = ?""",
                p.getName(), p.getDescription(), p.getPrice(), p.getStockQuantity(),
                p.getCategory() != null ? p.getCategory().getId() : null,
                p.getImageUrl(), p.isActive(),
                p.getDiscountPercent() != null ? p.getDiscountPercent() : BigDecimal.ZERO,
                p.getSku(), p.getBrand(), p.getMaterial(), p.getColor(), p.getSizes(), p.getTags(),
                p.getCostPrice(), p.getReorderLevel(), p.isFeatured(),
                p.getRating() != null ? p.getRating() : 0.0, p.getReviewsCount(),
                p.getImagesJson() != null ? p.getImagesJson() : "[]",
                p.getId());
    }

    public List<Product> search(boolean activeOnly, Long categoryId, String kwPattern,
                                BigDecimal minPrice, BigDecimal maxPrice,
                                String orderBy, int limit, int offset) {
        List<Object> args = new ArrayList<>();
        StringBuilder sql = new StringBuilder(SELECT_COLS + "WHERE 1=1");
        if (activeOnly) { sql.append(" AND p.is_active = TRUE"); }
        if (categoryId != null) { sql.append(" AND p.category_id = ?"); args.add(categoryId); }
        if (minPrice != null) { sql.append(" AND p.price >= ?"); args.add(minPrice); }
        if (maxPrice != null) { sql.append(" AND p.price <= ?"); args.add(maxPrice); }
        if (kwPattern != null && !kwPattern.isBlank()) {
            sql.append(" AND (LOWER(p.name) LIKE ? OR LOWER(p.description) LIKE ? OR LOWER(p.tags) LIKE ?" +
                    " OR LOWER(p.brand) LIKE ? OR LOWER(p.material) LIKE ?)");
            for (int i = 0; i < 5; i++) args.add(kwPattern);
        }
        sql.append(" ORDER BY ").append(orderBy);
        sql.append(" LIMIT ? OFFSET ?");
        args.add(limit);
        args.add(offset);
        return jdbc.query(sql.toString(), ProductRepository::mapProduct, args.toArray());
    }

    public long countSearch(boolean activeOnly, Long categoryId, String kwPattern,
                            BigDecimal minPrice, BigDecimal maxPrice) {
        List<Object> args = new ArrayList<>();
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM products p WHERE 1=1");
        if (activeOnly) { sql.append(" AND p.is_active = TRUE"); }
        if (categoryId != null) { sql.append(" AND p.category_id = ?"); args.add(categoryId); }
        if (minPrice != null) { sql.append(" AND p.price >= ?"); args.add(minPrice); }
        if (maxPrice != null) { sql.append(" AND p.price <= ?"); args.add(maxPrice); }
        if (kwPattern != null && !kwPattern.isBlank()) {
            sql.append(" AND (LOWER(p.name) LIKE ? OR LOWER(p.description) LIKE ? OR LOWER(p.tags) LIKE ?" +
                    " OR LOWER(p.brand) LIKE ? OR LOWER(p.material) LIKE ?)");
            for (int i = 0; i < 5; i++) args.add(kwPattern);
        }
        Long count = jdbc.queryForObject(sql.toString(), Long.class, args.toArray());
        return count == null ? 0 : count;
    }

    public long countByCategoryId(Long categoryId) {
        Long c = jdbc.queryForObject("SELECT COUNT(*) FROM products WHERE category_id = ?", Long.class, categoryId);
        return c == null ? 0 : c;
    }

    public long countByCategoryIdAndIsActive(Long categoryId, boolean isActive) {
        Long c = jdbc.queryForObject(
                "SELECT COUNT(*) FROM products WHERE category_id = ? AND is_active = ?",
                Long.class, categoryId, isActive);
        return c == null ? 0 : c;
    }

    public long countByIsActive(boolean isActive) {
        Long c = jdbc.queryForObject("SELECT COUNT(*) FROM products WHERE is_active = ?", Long.class, isActive);
        return c == null ? 0 : c;
    }

    public long count() {
        Long c = jdbc.queryForObject("SELECT COUNT(*) FROM products", Long.class);
        return c == null ? 0 : c;
    }

    public List<Product> findLowStock(int threshold, int limit) {
        return jdbc.query(SELECT_COLS + "WHERE p.is_active = TRUE AND p.stock_quantity < ? ORDER BY p.stock_quantity ASC LIMIT ?",
                ProductRepository::mapProduct, threshold, limit);
    }

    public BigDecimal sumRevenue() {
        BigDecimal v = jdbc.queryForObject(
                "SELECT COALESCE(SUM(o.total_amount), 0) FROM orders o WHERE o.status <> 'CANCELLED'", BigDecimal.class);
        return v == null ? BigDecimal.ZERO : v;
    }

    public void deleteAll() {
        jdbc.update("DELETE FROM order_items");
        jdbc.update("DELETE FROM products");
    }

    static Product mapProduct(ResultSet rs, int rowNum) throws SQLException {
        Product p = new Product();
        p.setId(rs.getLong("id"));
        p.setName(rs.getString("name"));
        p.setDescription(rs.getString("description"));
        p.setPrice(rs.getBigDecimal("price"));
        p.setStockQuantity(rs.getInt("stock_quantity"));
        p.setImageUrl(rs.getString("image_url"));
        p.setActive(rs.getBoolean("is_active"));
        p.setDiscountPercent(rs.getBigDecimal("discount_percent"));
        p.setSku(rs.getString("sku"));
        p.setBrand(rs.getString("brand"));
        p.setMaterial(rs.getString("material"));
        p.setColor(rs.getString("color"));
        p.setSizes(rs.getString("sizes"));
        p.setTags(rs.getString("tags"));
        p.setCostPrice(rs.getBigDecimal("cost_price"));
        p.setReorderLevel(rs.getInt("reorder_level"));
        p.setFeatured(rs.getBoolean("featured"));
        Timestamp created = rs.getTimestamp("created_at");
        p.setCreatedAt(created != null ? created.toLocalDateTime() : null);
        p.setRating(rs.getDouble("rating"));
        p.setReviewsCount(rs.getInt("reviews_count"));
        p.setImagesJson(rs.getString("images_json"));
        long catId = rs.getLong("category_id");
        if (!rs.wasNull()) {
            com.shopverse.domain.Category c = new com.shopverse.domain.Category();
            c.setId(catId);
            c.setName(rs.getString("cat_name"));
            c.setNameAr(rs.getString("cat_name_ar"));
            p.setCategory(c);
        }
        return p;
    }
}
