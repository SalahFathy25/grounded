package com.shopverse.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    @Column(name = "name_ar", length = 120)
    private String nameAr;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    public Category(String name, String nameAr, String imageUrl) {
        this.name = name;
        this.nameAr = nameAr;
        this.imageUrl = imageUrl;
    }
}
