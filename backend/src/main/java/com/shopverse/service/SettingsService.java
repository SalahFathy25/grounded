package com.shopverse.service;

import com.shopverse.domain.StoreSettings;
import com.shopverse.repository.StoreSettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class SettingsService {

    private static final long SETTINGS_ID = 1L;

    private final StoreSettingsRepository repository;

    public SettingsService(StoreSettingsRepository repository) {
        this.repository = repository;
    }

    private static final String[] KEYS = {
            "store_name_en", "store_name_ar", "tagline_en", "tagline_ar",
            "announcement_en", "announcement_ar", "announcement_enabled", "shipping_fee",
            "vodafone_number", "instapay_number", "support_phone", "support_email",
            "instagram_url", "facebook_url", "tiktok_url"
    };

    @Transactional
    public Map<String, Object> get() {
        StoreSettings s = ensure();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("store_name_en", s.getStoreNameEn());
        out.put("store_name_ar", s.getStoreNameAr());
        out.put("tagline_en", s.getTaglineEn());
        out.put("tagline_ar", s.getTaglineAr());
        out.put("announcement_en", s.getAnnouncementEn());
        out.put("announcement_ar", s.getAnnouncementAr());
        out.put("announcement_enabled", s.isAnnouncementEnabled());
        out.put("shipping_fee", s.getShippingFee());
        out.put("vodafone_number", s.getVodafoneNumber());
        out.put("instapay_number", s.getInstapayNumber());
        out.put("support_phone", s.getSupportPhone());
        out.put("support_email", s.getSupportEmail());
        out.put("instagram_url", s.getInstagramUrl());
        out.put("facebook_url", s.getFacebookUrl());
        out.put("tiktok_url", s.getTiktokUrl());
        out.put("updated_at", s.getUpdatedAt());
        return out;
    }

    /** Merge the given patch into the singleton, whitelisted to the known keys (mirrors the mock KEYS list). */
    @Transactional
    public Map<String, Object> update(Map<String, Object> patch) {
        StoreSettings s = ensure();
        for (String key : KEYS) {
            if (patch == null || !patch.containsKey(key)) continue;
            Object value = patch.get(key);
            switch (key) {
                case "announcement_enabled" -> s.setAnnouncementEnabled(Boolean.TRUE.equals(value));
                case "shipping_fee" -> s.setShippingFee(value == null ? BigDecimal.ZERO : new BigDecimal(String.valueOf(value)));
                default -> { if (value != null) setString(s, key, String.valueOf(value)); }
            }
        }
        s.setUpdatedAt(LocalDateTime.now());
        repository.save(s);
        return get();
    }

    @Transactional
    public void reset() {
        repository.deleteAll();
    }

    public StoreSettings ensure() {
        return repository.findById(SETTINGS_ID).orElseGet(() -> {
            StoreSettings s = new StoreSettings();
            s.setId(SETTINGS_ID);
            s.setStoreNameEn("Grounded");
            s.setStoreNameAr("غراوندد");
            s.setTaglineEn("Premium streetwear at honest prices. T-shirts, shirts, pants and more — delivered across Egypt.");
            s.setTaglineAr("ملابس ستريتوير فخمة بأسعار منصفة. تيشيرتات، قمصان وبناطيل — توصيل لجميع مصر.");
            s.setAnnouncementEn("");
            s.setAnnouncementAr("");
            s.setAnnouncementEnabled(false);
            s.setShippingFee(new BigDecimal("80"));
            s.setVodafoneNumber("+20 100 000 0000");
            s.setInstapayNumber("01000000000");
            s.setSupportPhone("+20 100 000 0000");
            s.setSupportEmail("support@grounded.store");
            s.setInstagramUrl("");
            s.setFacebookUrl("");
            s.setTiktokUrl("");
            s.setUpdatedAt(LocalDateTime.now());
            return repository.save(s);
        });
    }

    private void setString(StoreSettings s, String key, String value) {
        switch (key) {
            case "store_name_en" -> s.setStoreNameEn(value);
            case "store_name_ar" -> s.setStoreNameAr(value);
            case "tagline_en" -> s.setTaglineEn(value);
            case "tagline_ar" -> s.setTaglineAr(value);
            case "announcement_en" -> s.setAnnouncementEn(value);
            case "announcement_ar" -> s.setAnnouncementAr(value);
            case "vodafone_number" -> s.setVodafoneNumber(value);
            case "instapay_number" -> s.setInstapayNumber(value);
            case "support_phone" -> s.setSupportPhone(value);
            case "support_email" -> s.setSupportEmail(value);
            case "instagram_url" -> s.setInstagramUrl(value);
            case "facebook_url" -> s.setFacebookUrl(value);
            case "tiktok_url" -> s.setTiktokUrl(value);
            default -> { /* ignored */ }
        }
    }
}