package com.shopverse.controller;

import com.shopverse.service.ContentService;
import com.shopverse.service.SettingsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class StorePublicController {

    private final SettingsService settingsService;
    private final ContentService contentService;

    public StorePublicController(SettingsService settingsService, ContentService contentService) {
        this.settingsService = settingsService;
        this.contentService = contentService;
    }

    @GetMapping("/settings")
    public Map<String, Object> settings() {
        return settingsService.get();
    }

    @GetMapping("/content")
    public Map<String, Object> content() {
        return contentService.get();
    }
}