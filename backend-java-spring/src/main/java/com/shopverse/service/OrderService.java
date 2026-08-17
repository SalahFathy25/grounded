package com.shopverse.service;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.shopverse.domain.Order;
import com.shopverse.domain.OrderItem;
import com.shopverse.domain.OrderStatus;
import com.shopverse.domain.PaymentMethod;
import com.shopverse.domain.Product;
import com.shopverse.domain.User;
import com.shopverse.dto.OrderDtos;
import com.shopverse.exception.BadRequestException;
import com.shopverse.exception.ConflictException;
import com.shopverse.exception.NotFoundException;
import com.shopverse.repository.OrderRepository;
import com.shopverse.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class OrderService {

    private static final List<PaymentMethod> ALLOWED_PAYMENTS =
            List.of(PaymentMethod.COD, PaymentMethod.VISA, PaymentMethod.VODAFONE_CASH, PaymentMethod.INSTAPAY);

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final SettingsService settingsService;
    private final Gson gson;

    public OrderService(OrderRepository orderRepository, ProductRepository productRepository,
                        SettingsService settingsService, Gson gson) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.settingsService = settingsService;
        this.gson = gson;
    }

    @Transactional
    public OrderDtos.OrderDto create(User user, OrderDtos.OrderCreateRequest request) {
        if (request.items() == null || request.items().isEmpty()) {
            throw new BadRequestException("Order must contain at least one item");
        }
        PaymentMethod payment = request.payment_method() == null ? PaymentMethod.COD : request.payment_method();
        if (!ALLOWED_PAYMENTS.contains(payment)) {
            throw new BadRequestException("Invalid payment method");
        }
        if (request.shipping_address() == null || request.shipping_address().isBlank()) {
            throw new BadRequestException("shipping_address: must not be blank");
        }
        if (request.phone_number() == null || request.phone_number().isBlank()) {
            throw new BadRequestException("phone_number: must not be blank");
        }
        BigDecimal shippingFee = settingsFee();

        Order order = new Order();
        order.setUser(user);
        order.setPaymentMethod(payment);
        order.setShippingAddress(request.shipping_address());
        order.setPhoneNumber(request.phone_number());
        order.setStatus(OrderStatus.PENDING);
        order.setShippingFee(shippingFee);

        BigDecimal total = BigDecimal.ZERO;
        for (OrderDtos.OrderItemRequest itemRequest : request.items()) {
            if (itemRequest.product_id() == null || itemRequest.quantity() == null) {
                throw new BadRequestException("Invalid order item");
            }
            Product product = productRepository.findById(itemRequest.product_id())
                    .orElseThrow(() -> new NotFoundException("Product #" + itemRequest.product_id() + " is not available"));
            if (!product.isActive()) {
                throw new NotFoundException("Product \"" + product.getName() + "\" is not available");
            }
            int qty = itemRequest.quantity();
            if (qty < 1) throw new BadRequestException("Invalid quantity");
            if (qty > product.getStockQuantity()) {
                throw new ConflictException("Only " + product.getStockQuantity() + " in stock for \"" + product.getName() + "\"");
            }
            product.setStockQuantity(product.getStockQuantity() - qty);
            productRepository.save(product);

            BigDecimal unit = effectivePrice(product);
            OrderItem item = new OrderItem();
            item.setProduct(product);
            item.setQuantity(qty);
            item.setUnitPrice(unit);
            item.setProductImage(product.getImageUrl());
            order.addItem(item);
            total = total.add(unit.multiply(BigDecimal.valueOf(qty)));
        }

        order.setTotalAmount(total);
        order.setStatusHistoryJson(writeHistory(List.of(new HistoryEntry(OrderStatus.PENDING, LocalDateTime.now()))));
        orderRepository.save(order);
        return toDto(order);
    }

    public List<OrderDtos.OrderDto> myOrders(User user) {
        return orderRepository.findAllByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::toDto)
                .toList();
    }

    public List<OrderDtos.OrderDto> allOrders() {
        return orderRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    public OrderDtos.OrderDto getById(User user, Long id) {
        Order order = find(id);
        if (user.getRole() != com.shopverse.domain.Role.ROLE_ADMIN && !order.getUser().getId().equals(user.getId())) {
            throw new NotFoundException("Order not found");
        }
        return toDto(order);
    }

    @Transactional
    public OrderDtos.OrderDto updateStatus(Long id, OrderStatus status) {
        Order order = find(id);
        if (status == OrderStatus.CANCELLED && order.getStatus() != OrderStatus.CANCELLED) {
            for (OrderItem item : order.getItems()) {
                Product product = productRepository.findById(item.getProduct().getId()).orElse(null);
                if (product != null && product.isActive()) {
                    product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
                    productRepository.save(product);
                }
            }
        }
        if (status == OrderStatus.PAID && order.getPaidAt() == null) {
            order.setPaidAt(LocalDateTime.now());
        } else if (status != OrderStatus.PAID) {
            order.setPaidAt(null);
        }
        order.setStatus(status);
        pushHistory(order, status);
        orderRepository.save(order);
        return toDto(order);
    }

    @Transactional
    public OrderDtos.OrderDto pay(User user, Long id) {
        Order order = find(id);
        if (user.getRole() != com.shopverse.domain.Role.ROLE_ADMIN && !order.getUser().getId().equals(user.getId())) {
            throw new NotFoundException("Order not found");
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new ConflictException("This order is cancelled");
        }
        order.setStatus(OrderStatus.PAID);
        order.setPaidAt(LocalDateTime.now());
        pushHistory(order, OrderStatus.PAID);
        orderRepository.save(order);
        return toDto(order);
    }

    @Transactional
    public OrderDtos.OrderDto saveProof(User user, Long id, String proof) {
        Order order = find(id);
        if (user.getRole() != com.shopverse.domain.Role.ROLE_ADMIN && !order.getUser().getId().equals(user.getId())) {
            throw new NotFoundException("Order not found");
        }
        if (proof == null || !proof.startsWith("data:image/")) {
            throw new BadRequestException("Invalid proof image");
        }
        order.setPaymentProof(proof);
        order.setPaymentProofAt(LocalDateTime.now());
        orderRepository.save(order);
        return toDto(order);
    }

    public OrderDtos.OrderDto toDto(Order order) {
        List<OrderDtos.OrderItemDto> items = order.getItems().stream()
                .map(i -> {
                    String image = i.getProductImage() != null ? i.getProductImage() : i.getProduct().getImageUrl();
                    return new OrderDtos.OrderItemDto(
                            i.getId(), i.getProduct().getId(), i.getProduct().getName(), image,
                            i.getQuantity(), i.getUnitPrice());
                })
                .toList();
        return new OrderDtos.OrderDto(
                order.getId(),
                order.getUser().getId(),
                order.getUser().getFullName(),
                order.getUser().getEmail(),
                order.getTotalAmount(),
                order.getShippingFee(),
                order.getStatus(),
                order.getPaymentMethod(),
                order.getShippingAddress(),
                order.getPhoneNumber(),
                order.getCreatedAt(),
                order.getPaidAt(),
                order.getPaymentProof(),
                order.getPaymentProofAt(),
                readHistory(order),
                items);
    }

    /* ---------- helpers ---------- */

    private Order find(Long id) {
        return orderRepository.findById(id).orElseThrow(() -> new NotFoundException("Order not found"));
    }

    private BigDecimal settingsFee() {
        Object fee = settingsService.get().get("shipping_fee");
        return fee instanceof BigDecimal b ? b : BigDecimal.ZERO;
    }

    private BigDecimal effectivePrice(Product p) {
        BigDecimal disc = p.getDiscountPercent() == null ? BigDecimal.ZERO : p.getDiscountPercent();
        if (disc.compareTo(BigDecimal.ZERO) > 0 && disc.compareTo(new BigDecimal("99")) < 0) {
            return p.getPrice()
                    .multiply(BigDecimal.ONE.subtract(disc.divide(new BigDecimal("100"))))
                    .setScale(2, RoundingMode.HALF_UP);
        }
        return p.getPrice();
    }

    private void pushHistory(Order order, OrderStatus status) {
        List<HistoryEntry> history = readHistoryEntries(order);
        history.removeIf(h -> h.status() == status);
        history.add(new HistoryEntry(status, LocalDateTime.now()));
        order.setStatusHistoryJson(writeHistory(history));
    }

    private record HistoryEntry(OrderStatus status, LocalDateTime at) {}

    private List<HistoryEntry> readHistoryEntries(Order order) {
        List<Map<String, Object>> raw = readHistory(order);
        List<HistoryEntry> out = new ArrayList<>();
        for (Map<String, Object> entry : raw) {
            try {
                out.add(new HistoryEntry(
                        OrderStatus.valueOf(String.valueOf(entry.get("status"))),
                        LocalDateTime.parse(String.valueOf(entry.get("at")), DateTimeFormatter.ISO_DATE_TIME)));
            } catch (Exception ignored) { /* skip bad entries */ }
        }
        if (out.isEmpty() && order.getCreatedAt() != null) {
            out.add(new HistoryEntry(OrderStatus.PENDING, order.getCreatedAt()));
        }
        return out;
    }

    private List<Map<String, Object>> readHistory(Order order) {
        if (order.getStatusHistoryJson() == null || order.getStatusHistoryJson().isBlank()) {
            return List.of();
        }
        try {
            return gson.fromJson(order.getStatusHistoryJson(), new TypeToken<List<Map<String, Object>>>() {}.getType());
        } catch (Exception e) {
            return List.of();
        }
    }

    private String writeHistory(List<HistoryEntry> history) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (HistoryEntry entry : history) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("status", entry.status().name());
            map.put("at", entry.at().format(DateTimeFormatter.ISO_DATE_TIME));
            out.add(map);
        }
        return gson.toJson(out);
    }
}