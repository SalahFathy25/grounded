package com.shopverse.dto;

import com.shopverse.domain.OrderStatus;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record StatsDto(
        BigDecimal revenue,
        long ordersCount,
        long customersCount,
        long productsCount,
        long pendingOrders,
        long lowStockCount,
        List<Map<String, Object>> lowStockProducts,
        List<OrderDtos.OrderDto> recentOrders,
        Map<OrderStatus, Long> ordersByStatus
) {}
