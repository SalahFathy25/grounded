package com.shopverse.repository;

import com.shopverse.domain.StoreContent;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class StoreContentRepository {

    private final JdbcTemplate jdbc;

    public StoreContentRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<StoreContent> findById(Long id) {
        List<StoreContent> list = jdbc.query(
                "SELECT id, content_json, updated_at FROM store_content WHERE id = ?", StoreContentRepository::map, id);
        return list.stream().findFirst();
    }

    public StoreContent save(StoreContent c) {
        jdbc.update("""
                MERGE INTO store_content (id, content_json, updated_at)
                KEY (id) VALUES (?, ?, ?)""",
                c.getId(), c.getContentJson(),
                c.getUpdatedAt() != null ? Timestamp.valueOf(c.getUpdatedAt()) : null);
        return c;
    }

    public void deleteAll() {
        jdbc.update("DELETE FROM store_content");
    }

    static StoreContent map(ResultSet rs, int rowNum) throws SQLException {
        StoreContent c = new StoreContent();
        c.setId(rs.getLong("id"));
        c.setContentJson(rs.getString("content_json"));
        Timestamp updated = rs.getTimestamp("updated_at");
        c.setUpdatedAt(updated != null ? updated.toLocalDateTime() : null);
        return c;
    }
}
