package com.shopverse.repository;

import com.shopverse.domain.StoreSettings;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class StoreSettingsRepository {

    private final JdbcTemplate jdbc;

    public StoreSettingsRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<StoreSettings> findById(Long id) {
        List<StoreSettings> list = jdbc.query(
                "SELECT * FROM store_settings WHERE id = ?", StoreSettingsRepository::map, id);
        return list.stream().findFirst();
    }

    public StoreSettings save(StoreSettings s) {
        jdbc.update("""
                MERGE INTO store_settings (id, store_name_en, store_name_ar, tagline_en, tagline_ar,
                    announcement_en, announcement_ar, announcement_enabled, shipping_fee, vodafone_number,
                    instapay_number, support_phone, support_email, instagram_url, facebook_url, tiktok_url, updated_at)
                KEY (id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                s.getId(), s.getStoreNameEn(), s.getStoreNameAr(), s.getTaglineEn(), s.getTaglineAr(),
                s.getAnnouncementEn(), s.getAnnouncementAr(), s.isAnnouncementEnabled(), s.getShippingFee(),
                s.getVodafoneNumber(), s.getInstapayNumber(), s.getSupportPhone(), s.getSupportEmail(),
                s.getInstagramUrl(), s.getFacebookUrl(), s.getTiktokUrl(),
                s.getUpdatedAt() != null ? Timestamp.valueOf(s.getUpdatedAt()) : null);
        return s;
    }

    public void deleteAll() {
        jdbc.update("DELETE FROM store_settings");
    }

    static StoreSettings map(ResultSet rs, int rowNum) throws SQLException {
        StoreSettings s = new StoreSettings();
        s.setId(rs.getLong("id"));
        s.setStoreNameEn(rs.getString("store_name_en"));
        s.setStoreNameAr(rs.getString("store_name_ar"));
        s.setTaglineEn(rs.getString("tagline_en"));
        s.setTaglineAr(rs.getString("tagline_ar"));
        s.setAnnouncementEn(rs.getString("announcement_en"));
        s.setAnnouncementAr(rs.getString("announcement_ar"));
        s.setAnnouncementEnabled(rs.getBoolean("announcement_enabled"));
        s.setShippingFee(rs.getBigDecimal("shipping_fee"));
        s.setVodafoneNumber(rs.getString("vodafone_number"));
        s.setInstapayNumber(rs.getString("instapay_number"));
        s.setSupportPhone(rs.getString("support_phone"));
        s.setSupportEmail(rs.getString("support_email"));
        s.setInstagramUrl(rs.getString("instagram_url"));
        s.setFacebookUrl(rs.getString("facebook_url"));
        s.setTiktokUrl(rs.getString("tiktok_url"));
        Timestamp updated = rs.getTimestamp("updated_at");
        s.setUpdatedAt(updated != null ? updated.toLocalDateTime() : null);
        return s;
    }
}
