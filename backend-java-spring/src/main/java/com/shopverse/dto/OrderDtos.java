package com.shopverse.dto;

import com.shopverse.domain.OrderStatus;
import com.shopverse.domain.PaymentMethod;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record OrderDtos() {

    public record OrderItemRequest(
            Long product_id,
            Integer quantity
    ) {}

    public record OrderCreateRequest(
            String shipping_address,
            String phone_number,
            PaymentMethod payment_method,
            List<OrderItemRequest> items
    ) {}

    public record OrderItemDto(Long id, Long product_id, String product_name, String product_image,
                               Integer quantity, BigDecimal unit_price) {}

    public record OrderDto(
            Long id, Long user_id, String user_name, String user_email, BigDecimal total_amount,
            BigDecimal shipping_fee, OrderStatus status, PaymentMethod payment_method,
            String shipping_address, String phone_number, LocalDateTime created_at, LocalDateTime paid_at,
            String payment_proof, LocalDateTime payment_proof_at,
            List<Map<String, Object>> status_history, List<OrderItemDto> items
    ) {}

    public record OrderStatusUpdateRequest(OrderStatus status) {}

    public record ProofRequest(String proof) {}
}