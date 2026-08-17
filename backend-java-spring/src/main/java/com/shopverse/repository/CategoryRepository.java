package com.shopverse.repository;

import com.shopverse.domain.Category;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Repository
public class CategoryRepository {

    private final JdbcTemplate jdbc;

    public CategoryRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Category> findAll() {
        return jdbc.query("SELECT id, name, name_ar, image_url FROM categories ORDER BY id", CategoryRepository::mapCategory);
    }

    public Optional<Category> findById(Long id) {
        List<Category> list = jdbc.query(
                "SELECT id, name, name_ar, image_url FROM categories WHERE id = ?", CategoryRepository::mapCategory, id);
        return list.stream().findFirst();
    }

    public Optional<Category> findByNameIgnoreCase(String name) {
        List<Category> list = jdbc.query(
                "SELECT id, name, name_ar, image_url FROM categories WHERE LOWER(name) = LOWER(?)",
                CategoryRepository::mapCategory, name);
        return list.stream().findFirst();
    }

    public boolean existsByNameIgnoreCase(String name) {
        Integer c = jdbc.queryForObject(
                "SELECT COUNT(*) FROM categories WHERE LOWER(name) = LOWER(?)", Integer.class, name);
        return c != null && c > 0;
    }

    public Category save(Category category) {
        if (category.getId() == null) {
            KeyHolder kh = new GeneratedKeyHolder();
            jdbc.update(con -> {
                PreparedStatement ps = con.prepareStatement(
                        "INSERT INTO categories (name, name_ar, image_url) VALUES (?, ?, ?)",
                        PreparedStatement.RETURN_GENERATED_KEYS);
                ps.setString(1, category.getName());
                ps.setString(2, category.getNameAr());
                ps.setString(3, category.getImageUrl());
                return ps;
            }, kh);
            Number key = kh.getKey();
            if (key != null) category.setId(key.longValue());
        } else {
            jdbc.update("UPDATE categories SET name = ?, name_ar = ?, image_url = ? WHERE id = ?",
                    category.getName(), category.getNameAr(), category.getImageUrl(), category.getId());
        }
        return category;
    }

    public void delete(Category category) {
        jdbc.update("DELETE FROM categories WHERE id = ?", category.getId());
    }

    public void deleteAll() {
        jdbc.update("DELETE FROM products");
        jdbc.update("DELETE FROM categories");
    }

    static Category mapCategory(ResultSet rs, int rowNum) throws SQLException {
        Category c = new Category();
        c.setId(rs.getLong("id"));
        c.setName(rs.getString("name"));
        c.setNameAr(rs.getString("name_ar"));
        c.setImageUrl(rs.getString("image_url"));
        return c;
    }
}
