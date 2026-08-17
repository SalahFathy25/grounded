package com.shopverse.repository;

import com.shopverse.domain.Order;
import com.shopverse.domain.OrderItem;
import com.shopverse.domain.OrderStatus;
import com.shopverse.domain.PaymentMethod;
import com.shopverse.domain.Product;
import com.shopverse.domain.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class OrderRepository {

    private static final String SELECT_COLS =
            "SELECT o.id, o.user_id, o.total_amount, o.status, o.payment_method, o.shipping_address, " +
            "o.phone_number, o.created_at, o.shipping_fee, o.paid_at, o.payment_proof, o.payment_proof_at, " +
            "o.status_history, u.full_name, u.email " +
            "FROM orders o JOIN users u ON o.user_id = u.id ";

    private final JdbcTemplate jdbc;

    public OrderRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<Order> findById(Long id) {
        List<Order> list = jdbc.query(SELECT_COLS + "WHERE o.id = ?", OrderRepository::mapOrder, id);
        if (list.isEmpty()) return Optional.empty();
        Order order = list.get(0);
        order.setItems(loadItems(order.getId()));
        return Optional.of(order);
    }

    public List<Order> findAllByUserIdOrderByCreatedAtDesc(Long userId) {
        return jdbc.query(SELECT_COLS + "WHERE o.user_id = ? ORDER BY o.created_at DESC",
                OrderRepository::mapOrder, userId).stream()
                .peek(o -> o.setItems(loadItems(o.getId())))
                .toList();
    }

    public List<Order> findAll() {
        return jdbc.query(SELECT_COLS + "ORDER BY o.created_at DESC", OrderRepository::mapOrder).stream()
                .peek(o -> o.setItems(loadItems(o.getId())))
                .toList();
    }

    public long count() {
        Long c = jdbc.queryForObject("SELECT COUNT(*) FROM orders", Long.class);
        return c == null ? 0 : c;
    }

    public long countByStatus(OrderStatus status) {
        Long c = jdbc.queryForObject("SELECT COUNT(*) FROM orders WHERE status = ?", Long.class, status.name());
        return c == null ? 0 : c;
    }

    public Order save(Order order) {
        if (order.getId() == null) {
            if (order.getCreatedAt() == null) order.setCreatedAt(LocalDateTime.now());
            KeyHolder kh = new GeneratedKeyHolder();
            jdbc.update(con -> {
                PreparedStatement ps = con.prepareStatement("""
                        INSERT INTO orders (user_id, total_amount, status, payment_method, shipping_address,
                            phone_number, created_at, shipping_fee, paid_at, payment_proof, payment_proof_at, status_history)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                        PreparedStatement.RETURN_GENERATED_KEYS);
                ps.setLong(1, order.getUser().getId());
                ps.setBigDecimal(2, order.getTotalAmount());
                ps.setString(3, order.getStatus().name());
                ps.setString(4, order.getPaymentMethod().name());
                ps.setString(5, order.getShippingAddress());
                ps.setString(6, order.getPhoneNumber());
                ps.setTimestamp(7, Timestamp.valueOf(order.getCreatedAt()));
                ps.setBigDecimal(8, order.getShippingFee() != null ? order.getShippingFee() : java.math.BigDecimal.ZERO);
                ps.setTimestamp(9, order.getPaidAt() != null ? Timestamp.valueOf(order.getPaidAt()) : null);
                ps.setString(10, order.getPaymentProof());
                ps.setTimestamp(11, order.getPaymentProofAt() != null ? Timestamp.valueOf(order.getPaymentProofAt()) : null);
                ps.setString(12, order.getStatusHistoryJson());
                return ps;
            }, kh);
            Number key = kh.getKey();
            if (key != null) order.setId(key.longValue());
        } else {
            jdbc.update("""
                    UPDATE orders SET total_amount = ?, status = ?, payment_method = ?, shipping_address = ?,
                        phone_number = ?, shipping_fee = ?, paid_at = ?, payment_proof = ?, payment_proof_at = ?,
                        status_history = ? WHERE id = ?""",
                    order.getTotalAmount(), order.getStatus().name(), order.getPaymentMethod().name(),
                    order.getShippingAddress(), order.getPhoneNumber(),
                    order.getShippingFee() != null ? order.getShippingFee() : java.math.BigDecimal.ZERO,
                    order.getPaidAt() != null ? Timestamp.valueOf(order.getPaidAt()) : null,
                    order.getPaymentProof(),
                    order.getPaymentProofAt() != null ? Timestamp.valueOf(order.getPaymentProofAt()) : null,
                    order.getStatusHistoryJson(), order.getId());
        }
        saveItems(order);
        return order;
    }

    private void saveItems(Order order) {
        jdbc.update("DELETE FROM order_items WHERE order_id = ?", order.getId());
        for (OrderItem item : order.getItems()) {
            KeyHolder kh = new GeneratedKeyHolder();
            long orderId = order.getId();
            jdbc.update(con -> {
                PreparedStatement ps = con.prepareStatement(
                        "INSERT INTO order_items (order_id, product_id, quantity, unit_price, product_image) VALUES (?, ?, ?, ?, ?)",
                        PreparedStatement.RETURN_GENERATED_KEYS);
                ps.setLong(1, orderId);
                ps.setLong(2, item.getProduct().getId());
                ps.setInt(3, item.getQuantity());
                ps.setBigDecimal(4, item.getUnitPrice());
                ps.setString(5, item.getProductImage());
                return ps;
            }, kh);
            Number key = kh.getKey();
            if (key != null) item.setId(key.longValue());
        }
    }

    private List<OrderItem> loadItems(Long orderId) {
        return jdbc.query("""
                SELECT i.id, i.order_id, i.product_id, i.quantity, i.unit_price, i.product_image,
                       p.name AS product_name, p.image_url AS product_image_url
                FROM order_items i JOIN products p ON i.product_id = p.id
                WHERE i.order_id = ? ORDER BY i.id""", OrderRepository::mapOrderItem, orderId);
    }

    public void deleteAll() {
        jdbc.update("DELETE FROM order_items");
        jdbc.update("DELETE FROM orders");
    }

    static Order mapOrder(ResultSet rs, int rowNum) throws SQLException {
        Order o = new Order();
        o.setId(rs.getLong("id"));
        User u = new User();
        u.setId(rs.getLong("user_id"));
        u.setFullName(rs.getString("full_name"));
        u.setEmail(rs.getString("email"));
        o.setUser(u);
        o.setTotalAmount(rs.getBigDecimal("total_amount"));
        o.setStatus(OrderStatus.valueOf(rs.getString("status")));
        o.setPaymentMethod(PaymentMethod.valueOf(rs.getString("payment_method")));
        o.setShippingAddress(rs.getString("shipping_address"));
        o.setPhoneNumber(rs.getString("phone_number"));
        Timestamp created = rs.getTimestamp("created_at");
        o.setCreatedAt(created != null ? created.toLocalDateTime() : null);
        o.setShippingFee(rs.getBigDecimal("shipping_fee"));
        Timestamp paid = rs.getTimestamp("paid_at");
        o.setPaidAt(paid != null ? paid.toLocalDateTime() : null);
        o.setPaymentProof(rs.getString("payment_proof"));
        Timestamp proofAt = rs.getTimestamp("payment_proof_at");
        o.setPaymentProofAt(proofAt != null ? proofAt.toLocalDateTime() : null);
        o.setStatusHistoryJson(rs.getString("status_history"));
        o.setItems(new ArrayList<>());
        return o;
    }

    static OrderItem mapOrderItem(ResultSet rs, int rowNum) throws SQLException {
        OrderItem i = new OrderItem();
        i.setId(rs.getLong("id"));
        i.setQuantity(rs.getInt("quantity"));
        i.setUnitPrice(rs.getBigDecimal("unit_price"));
        i.setProductImage(rs.getString("product_image"));
        Product p = new Product();
        p.setId(rs.getLong("product_id"));
        p.setName(rs.getString("product_name"));
        p.setImageUrl(rs.getString("product_image_url"));
        i.setProduct(p);
        return i;
    }
}
