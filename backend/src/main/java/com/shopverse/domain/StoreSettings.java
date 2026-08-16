package com.shopverse.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Singleton row (id = 1) holding the storefront settings edited from the admin panel. */
@Entity
@Table(name = "store_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StoreSettings {

    @Id
    private Long id;

    @Column(name = "store_name_en", length = 120)
    private String storeNameEn;

    @Column(name = "store_name_ar", length = 120)
    private String storeNameAr;

    @Column(name = "tagline_en", length = 500)
    private String taglineEn;

    @Column(name = "tagline_ar", length = 500)
    private String taglineAr;

    @Column(name = "announcement_en", length = 500)
    private String announcementEn;

    @Column(name = "announcement_ar", length = 500)
    private String announcementAr;

    @Column(name = "announcement_enabled", nullable = false)
    private boolean announcementEnabled = false;

    @Column(name = "shipping_fee", precision = 10, scale = 2, nullable = false)
    private BigDecimal shippingFee = BigDecimal.ZERO;

    @Column(name = "vodafone_number", length = 60)
    private String vodafoneNumber;

    @Column(name = "instapay_number", length = 60)
    private String instapayNumber;

    @Column(name = "support_phone", length = 40)
    private String supportPhone;

    @Column(name = "support_email", length = 150)
    private String supportEmail;

    @Column(name = "instagram_url", length = 300)
    private String instagramUrl;

    @Column(name = "facebook_url", length = 300)
    private String facebookUrl;

    @Column(name = "tiktok_url", length = 300)
    private String tiktokUrl;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}