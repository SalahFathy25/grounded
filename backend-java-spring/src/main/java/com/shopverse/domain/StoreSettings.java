package com.shopverse.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Singleton row (id = 1) holding the storefront settings edited from the admin panel. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StoreSettings {

    private Long id;

    private String storeNameEn;

    private String storeNameAr;

    private String taglineEn;

    private String taglineAr;

    private String announcementEn;

    private String announcementAr;

    private boolean announcementEnabled = false;

    private BigDecimal shippingFee = BigDecimal.ZERO;

    private String vodafoneNumber;

    private String instapayNumber;

    private String supportPhone;

    private String supportEmail;

    private String instagramUrl;

    private String facebookUrl;

    private String tiktokUrl;

    private LocalDateTime updatedAt;
}
