package com.shopverse.controller;

import com.shopverse.repository.CategoryRepository;
import com.shopverse.repository.OrderRepository;
import com.shopverse.repository.ProductRepository;
import com.shopverse.repository.UserRepository;
import com.shopverse.service.ContentService;
import com.shopverse.service.SettingsService;
import com.shopverse.service.StatsService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final StatsService statsService;
    private final SettingsService settingsService;
    private final ContentService contentService;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final org.springframework.boot.CommandLineRunner reseeder;

    public AdminController(StatsService statsService, SettingsService settingsService, ContentService contentService,
                           OrderRepository orderRepository, ProductRepository productRepository,
                           CategoryRepository categoryRepository, UserRepository userRepository,
                           org.springframework.boot.CommandLineRunner reseeder) {
        this.statsService = statsService;
        this.settingsService = settingsService;
        this.contentService = contentService;
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.reseeder = reseeder;
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> stats() {
        return statsService.stats();
    }

    @GetMapping("/settings")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> getSettings() {
        return settingsService.get();
    }

    @PutMapping("/settings")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> updateSettings(@RequestBody Map<String, Object> body) {
        return settingsService.update(body);
    }

    @GetMapping("/content")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> getContent() {
        return contentService.get();
    }

    @PutMapping("/content")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> updateContent(@RequestBody Map<String, Object> body) {
        return contentService.update(body);
    }

    @PostMapping("/reset")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public Map<String, Object> reset(@RequestBody(required = false) Map<String, Object> body) {
        String scope = body == null ? null : String.valueOf(body.getOrDefault("scope", ""));
        if ("orders".equals(scope)) {
            orderRepository.deleteAll();
            return Map.of("message", "Orders cleared");
        }
        if ("store".equals(scope)) {
            orderRepository.deleteAll();
            productRepository.deleteAll();
            categoryRepository.deleteAll();
            userRepository.deleteAll();
            settingsService.reset();
            contentService.reset();
            try {
                reseeder.run();
            } catch (Exception e) {
                throw new RuntimeException("Failed to reseed store", e);
            }
            return Map.of("message", "Store data reset");
        }
        throw new com.shopverse.exception.BadRequestException("Invalid reset scope");
    }
}