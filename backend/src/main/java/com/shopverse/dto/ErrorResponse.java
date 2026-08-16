package com.shopverse.dto;

public record ErrorResponse(
        String timestamp,
        int status,
        String message,
        String path
) {}
