package com.shopverse.repository;

import com.shopverse.domain.StoreSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoreSettingsRepository extends JpaRepository<StoreSettings, Long> {
}