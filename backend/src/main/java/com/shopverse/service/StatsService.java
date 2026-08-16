package com.shopverse.service;

import com.shopverse.repository.OrderRepository;
import com.shopverse.repository.ProductRepository;
import com.shopverse.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class StatsService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderService orderService;
    private final ProductService productService;

    public StatsService(OrderRepository orderRepository,
                        ProductRepository productRepository,
                        UserRepository userRepository,
                        OrderService orderService,
                        ProductService productService) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.orderService = orderService;
        this.productService = productService;
    }

    public Map<String, Object> stats() {
        var lowStock = productRepository.findLowStock(5, org.springframework.data.domain.PageRequest.of(0, 6));
        return Map.of(
                "revenue", productRepository.sumRevenue(),
                "orders_count", orderRepository.count(),
                "customers_count", userRepository.count(),
                "products_count", productRepository.countByIsActive(true),
                "pending_orders", orderRepository.countByStatus(com.shopverse.domain.OrderStatus.PENDING),
                "low_stock_products", lowStock.stream().map(productService::toDto).toList(),
                "low_stock_count", lowStock.size(),
                "recent_orders", orderService.allOrders().stream().limit(5).toList(),
                "orders_by_status", Map.ofEntries(
                        Map.entry("PENDING", orderRepository.countByStatus(com.shopverse.domain.OrderStatus.PENDING)),
                        Map.entry("PAID", orderRepository.countByStatus(com.shopverse.domain.OrderStatus.PAID)),
                        Map.entry("SHIPPED", orderRepository.countByStatus(com.shopverse.domain.OrderStatus.SHIPPED)),
                        Map.entry("DELIVERED", orderRepository.countByStatus(com.shopverse.domain.OrderStatus.DELIVERED)),
                        Map.entry("CANCELLED", orderRepository.countByStatus(com.shopverse.domain.OrderStatus.CANCELLED))
                )
        );
    }
}
