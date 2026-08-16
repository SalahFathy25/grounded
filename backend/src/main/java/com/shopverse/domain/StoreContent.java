package com.shopverse.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** Singleton row (id = 1) holding the editable front-end content (hero, sections, FAQ…) as JSON. */
@Entity
@Table(name = "store_content")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StoreContent {

    @Id
    private Long id;

    @Column(name = "content_json", nullable = false, columnDefinition = "TEXT")
    private String contentJson;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}