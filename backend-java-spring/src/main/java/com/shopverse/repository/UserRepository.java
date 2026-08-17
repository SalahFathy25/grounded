package com.shopverse.repository;

import com.shopverse.domain.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class UserRepository {

    private final JdbcTemplate jdbc;

    public UserRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<User> findByEmailIgnoreCase(String email) {
        List<User> list = jdbc.query(
                "SELECT id, full_name, email, password, role, created_at FROM users WHERE LOWER(email) = LOWER(?)",
                UserRepository::mapUser, email);
        return list.stream().findFirst();
    }

    public boolean existsByEmailIgnoreCase(String email) {
        Integer c = jdbc.queryForObject(
                "SELECT COUNT(*) FROM users WHERE LOWER(email) = LOWER(?)", Integer.class, email);
        return c != null && c > 0;
    }

    public User save(User user) {
        if (user.getId() == null) {
            if (user.getCreatedAt() == null) user.setCreatedAt(LocalDateTime.now());
            KeyHolder kh = new GeneratedKeyHolder();
            jdbc.update(con -> {
                PreparedStatement ps = con.prepareStatement(
                        "INSERT INTO users (full_name, email, password, role, created_at) VALUES (?, ?, ?, ?, ?)",
                        PreparedStatement.RETURN_GENERATED_KEYS);
                ps.setString(1, user.getFullName());
                ps.setString(2, user.getEmail());
                ps.setString(3, user.getPassword());
                ps.setString(4, user.getRole().name());
                ps.setTimestamp(5, Timestamp.valueOf(user.getCreatedAt()));
                return ps;
            }, kh);
            Number key = kh.getKey();
            if (key != null) user.setId(key.longValue());
        } else {
            jdbc.update("UPDATE users SET full_name = ?, email = ?, password = ?, role = ? WHERE id = ?",
                    user.getFullName(), user.getEmail(), user.getPassword(), user.getRole().name(), user.getId());
        }
        return user;
    }

    public long count() {
        Long c = jdbc.queryForObject("SELECT COUNT(*) FROM users", Long.class);
        return c == null ? 0 : c;
    }

    public void deleteAll() {
        jdbc.update("DELETE FROM order_items");
        jdbc.update("DELETE FROM orders");
        jdbc.update("DELETE FROM users");
    }

    static User mapUser(ResultSet rs, int rowNum) throws SQLException {
        User u = new User();
        u.setId(rs.getLong("id"));
        u.setFullName(rs.getString("full_name"));
        u.setEmail(rs.getString("email"));
        u.setPassword(rs.getString("password"));
        u.setRole(com.shopverse.domain.Role.valueOf(rs.getString("role")));
        Timestamp created = rs.getTimestamp("created_at");
        u.setCreatedAt(created != null ? created.toLocalDateTime() : null);
        return u;
    }
}
