package com.shopverse.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {

    private Long id;

    private Order order;

    private Product product;

    private int quantity;

    private BigDecimal unitPrice;

    private String productImage;
}
