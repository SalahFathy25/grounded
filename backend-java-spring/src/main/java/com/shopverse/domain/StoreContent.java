package com.shopverse.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** Singleton row (id = 1) holding the editable front-end content (hero, sections, FAQ…) as JSON. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StoreContent {

    private Long id;

    private String contentJson;

    private LocalDateTime updatedAt;
}
