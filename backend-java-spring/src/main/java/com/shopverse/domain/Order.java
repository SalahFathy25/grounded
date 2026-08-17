package com.shopverse.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Order {

    private Long id;

    private User user;

    private BigDecimal totalAmount;

    private OrderStatus status = OrderStatus.PENDING;

    private PaymentMethod paymentMethod;

    private String shippingAddress;

    private String phoneNumber;

    private LocalDateTime createdAt;

    private List<OrderItem> items = new ArrayList<>();

    private BigDecimal shippingFee = BigDecimal.ZERO;

    private LocalDateTime paidAt;

    private String paymentProof;

    private LocalDateTime paymentProofAt;

    private String statusHistoryJson;

    public void addItem(OrderItem item) {
        item.setOrder(this);
        items.add(item);
    }
}
