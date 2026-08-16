package com.shopverse.repository;

import com.shopverse.domain.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    long countByStatus(com.shopverse.domain.OrderStatus status);
}
