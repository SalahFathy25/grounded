package com.shopverse.controller;

import com.shopverse.service.PaymentService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/checkout")
    public Map<String, Object> checkout(@RequestBody Map<String, Object> body) {
        Object orderId = body.get("order_id");
        Object amount = body.get("amount");
        return paymentService.checkout(
                orderId == null ? null : Long.valueOf(orderId.toString()),
                amount == null ? null : new java.math.BigDecimal(amount.toString()));
    }

    @PostMapping("/webhook")
    public Map<String, Object> webhook(@RequestBody(required = false) Map<String, Object> payload) {
        return paymentService.handleWebhook(payload);
    }
}
