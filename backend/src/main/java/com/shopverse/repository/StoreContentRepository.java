package com.shopverse.repository;

import com.shopverse.domain.StoreContent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoreContentRepository extends JpaRepository<StoreContent, Long> {
}