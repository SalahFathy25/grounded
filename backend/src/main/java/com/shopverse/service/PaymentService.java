package com.shopverse.service;

import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class PaymentService {

    /**
     * Creates a checkout session payload for the configured payment gateway.
     * The real integration (Paymob / Tap) plugs in here: build the gateway request,
     * call their API with your secret key, and return the redirect URL + transaction reference.
     */
    public Map<String, Object> checkout(Long orderId, java.math.BigDecimal amount) {
        return Map.of(
                "order_id", orderId,
                "amount", amount,
                "gateway", "paymob",
                "url", "/mock-gateway?order=" + orderId
        );
    }

    /**
     * Public webhook entry point called by the payment gateway after processing.
     * TODO: verify gateway signature, then mark the order PAID (or FAILED).
     */
    public Map<String, Object> handleWebhook(Map<String, Object> payload) {
        Object orderRef = payload != null ? payload.get("order_ref") : null;
        return Map.of(
                "received", true,
                "order_ref", orderRef
        );
    }
}
