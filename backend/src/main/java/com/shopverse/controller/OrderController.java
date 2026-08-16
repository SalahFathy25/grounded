package com.shopverse.controller;

import com.shopverse.domain.User;
import com.shopverse.dto.OrderDtos;
import com.shopverse.service.OrderService;
import com.shopverse.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final OrderService orderService;
    private final UserService userService;

    public OrderController(OrderService orderService, UserService userService) {
        this.orderService = orderService;
        this.userService = userService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderDtos.OrderDto create(@Valid @RequestBody OrderDtos.OrderCreateRequest request) {
        return orderService.create(currentUser(), request);
    }

    @GetMapping("/my-orders")
    public List<OrderDtos.OrderDto> myOrders() {
        return orderService.myOrders(currentUser());
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<OrderDtos.OrderDto> all() {
        return orderService.allOrders();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public OrderDtos.OrderDto updateStatus(@PathVariable Long id,
                                           @Valid @RequestBody OrderDtos.OrderStatusUpdateRequest request) {
        return orderService.updateStatus(id, request.status());
    }

    @GetMapping("/{id}")
    public OrderDtos.OrderDto getById(@PathVariable Long id) {
        return orderService.getById(currentUser(), id);
    }

    @PostMapping("/{id}/pay")
    public OrderDtos.OrderDto pay(@PathVariable Long id) {
        return orderService.pay(currentUser(), id);
    }

    @PatchMapping("/{id}/proof")
    public OrderDtos.OrderDto saveProof(@PathVariable Long id,
                                        @RequestBody OrderDtos.ProofRequest request) {
        return orderService.saveProof(currentUser(), id, request.proof());
    }

    private User currentUser() {
        return userService.currentUser();
    }
}
