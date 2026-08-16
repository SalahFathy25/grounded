package com.shopverse.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopverse.domain.*;
import com.shopverse.repository.*;
import com.shopverse.service.ContentService;
import com.shopverse.service.SettingsService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final BigDecimal SHIPPING_FEE = new BigDecimal("80");

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;
    private final SettingsService settingsService;
    private final ContentService contentService;
    private final ObjectMapper objectMapper;
    private final String adminInitialPassword;

    public DataSeeder(UserRepository userRepository,
                      CategoryRepository categoryRepository,
                      ProductRepository productRepository,
                      OrderRepository orderRepository,
                      PasswordEncoder passwordEncoder,
                      SettingsService settingsService,
                      ContentService contentService,
                      ObjectMapper objectMapper,
                      @org.springframework.beans.factory.annotation.Value("${app.admin.initial-password:admin123}") String adminInitialPassword) {
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.passwordEncoder = passwordEncoder;
        this.settingsService = settingsService;
        this.contentService = contentService;
        this.objectMapper = objectMapper;
        this.adminInitialPassword = adminInitialPassword;
    }

    @Override
    @Transactional
    public void run(String... args) {
        settingsService.ensureIsolated();
        contentService.ensureIsolated();

        if (userRepository.count() > 0) {
            return;
        }

        User admin = userRepository.save(new User(null, "Site Admin", "admin@grounded.store",
                passwordEncoder.encode(adminInitialPassword), Role.ROLE_ADMIN, LocalDateTime.now()));
        User customer = userRepository.save(new User(null, "Ahmed Hassan", "customer@grounded.store",
                passwordEncoder.encode("demo1234"), Role.ROLE_CUSTOMER, LocalDateTime.now()));

        Category tshirts = cat("T-Shirts", "تيشيرتات", "1556909114-f6e7ad7d3136");
        Category shirts = cat("Shirts", "قمصان", "1441986300917-64674bd600d8");
        Category pants = cat("Pants", "بناطيل", "1542272604-787c3835535d");

        Product p1 = prod("Oversized Graphic Tee", "Boxy oversized fit in 240gsm heavyweight cotton with a screen-printed graphic. The daily driver of every rotation.",
                "349.00", 2, tshirts, "1562157873-818bc0726f68",
                new BigDecimal("20.00"), "GR-001", "Streetline", "240gsm Heavyweight Cotton", "Black, Off-White", "S, M, L, XL, XXL", "streetwear, oversized, graphic", "210.00", 5, true);
        Product p2 = prod("Heavyweight Basic Tee", "Pre-shrunk 240gsm jersey cotton with a ribbed collar that keeps its shape. No logos, all quality.",
                "299.00", 95, tshirts, "1521572163474-6864f9cf17ab",
                null, "GR-002", "Grounded", "240gsm Pre-Shrunk Jersey Cotton", "White, Black, Grey", "XS, S, M, L, XL, XXL", "basic, essential", null, 5, false);
        Product p3 = prod("Vintage Washed Tee", "Garment-dyed and washed for a lived-in look and buttery softness. Fades beautifully wash after wash.",
                "329.00", 60, tshirts, "1556909114-f6e7ad7d3136",
                null, "GR-003", "Washed Co.", "Garment-Dyed Cotton", "Washed Grey, Sage Green", "S, M, L, XL", "vintage, washed", null, 5, false);
        Product p4 = prod("Pocket Tee", "Classic chest pocket with a drop shoulder seam. A clean staple that layers with anything.",
                "279.00", 70, tshirts, "1523381210434-271e8be1f52b",
                null, "GR-004", "Grounded", "180gsm Cotton", "Navy, White", "S, M, L, XL, XXL", "classic, staple", null, 5, false);
        Product p5 = prod("Flannel Overshirt", "Brushed flannel with an oversized cut — wear it open over a tee or buttoned up. The perfect layering piece.",
                "649.00", 35, shirts, "1551537482-f2075a1d41f2",
                null, "GR-005", "Urban Accent", "Brushed Flannel Cotton", "Red-Black Plaid", "M, L, XL", "layering, flannel", null, 5, false);
        Product p6 = prod("Denim Overshirt", "Heavy 12oz denim overshirt with corozo buttons and double-stitched seams. Built to break in over years.",
                "799.00", 28, shirts, "1604176354204-9268737828e4",
                null, "GR-006", "Denimora", "12oz Denim", "Mid-Wash Blue", "S, M, L, XL", "denim, overshirt", null, 5, false);
        Product p7 = prod("Oxford Slim Shirt", "Wrinkle-resistant oxford cotton with a slim modern cut and mother-of-pearl buttons.",
                "549.00", 45, shirts, "1596755094514-f87e34085b2c",
                null, "GR-007", "Tailored Co.", "Wrinkle-Resistant Oxford Cotton", "White, Powder Blue", "M, L, XL", "oxford, office", null, 5, false);
        Product p8 = prod("Baggy Cargo Pants", "Relaxed baggy fit with six functional cargo pockets, adjustable hem drawcords, and a tapered leg.",
                "549.00", 55, pants, "1514989940723-e8e51635b782",
                null, "GR-008", "Cargo Lab", "Cotton Twill", "Olive, Black", "M, L, XL", "cargo, baggy", null, 5, true);
        Product p9 = prod("Wide-Leg Denim", "Raw-edge wide-leg jeans in 13oz stretch denim. High rise, drop pockets, and a clean drape.",
                "699.00", 4, pants, "1542272604-787c3835535d",
                new BigDecimal("25.00"), "GR-009", "Denimora", "13oz Stretch Denim", "Indigo", "M, L, XL", "wide-leg, jeans", null, 5, false);
        Product p10 = prod("Jogger Sweatpants", "Fleece-lined joggers with a cuffed hem, zippered pockets, and an adjustable waistband.",
                "449.00", 25, pants, "1594633312681-425c7b97ccd1",
                null, "GR-010", "ComfortWear", "Fleece-Backed Cotton", "Grey, Black", "S, M, L, XL", "joggers, lounge", null, 5, false);
        Product p11 = prod("Chino Pants", "Stretch twill chinos with a slim taper and permanent crease — smart enough for uni, comfy for the streets.",
                "429.00", 50, pants, "1485968579580-b6d095142e6e",
                null, "GR-011", "Tailored Co.", "Stretch Twill", "Beige, Navy", "30, 32, 34, 36", "chinos, smart", null, 5, false);
        Product p12 = prod("Cargo Shorts", "Breathable cotton-twill cargo shorts with four zip pockets and a below-knee cut for hot summer days.",
                "379.00", 4, pants, "1560243563-062bfc001d68",
                new BigDecimal("10.00"), "GR-012", "Trail Co.", "Cotton Twill", "Khaki", "M, L, XL", "shorts, summer", null, 5, false);

        seedOrder(customer, "PENDING", PaymentMethod.VODAFONE_CASH, "12 El Nasr St, Maadi, Cairo", "+20 100 123 4567",
                LocalDateTime.now().minusDays(1),
                new Object[]{p2, 1}, new Object[]{p10, 1});
        seedOrder(customer, "SHIPPED", PaymentMethod.VISA, "12 El Nasr St, Maadi, Cairo", "+20 100 123 4567",
                LocalDateTime.now().minusDays(6),
                new Object[]{p5, 1}, new Object[]{p8, 1});
        seedOrder(customer, "DELIVERED", PaymentMethod.INSTAPAY, "12 El Nasr St, Maadi, Cairo", "+20 100 123 4567",
                LocalDateTime.now().minusDays(18),
                new Object[]{p9, 1}, new Object[]{p4, 1});
        seedOrder(customer, "CANCELLED", PaymentMethod.COD, "12 El Nasr St, Maadi, Cairo", "+20 100 123 4567",
                LocalDateTime.now().minusDays(25),
                new Object[]{p7, 2});
    }

    private Category cat(String name, String nameAr, String seed) {
        return categoryRepository.save(new Category(name, nameAr,
                "https://images.unsplash.com/photo-" + seed + "?w=800&h=600&q=80&auto=format&fit=crop"));
    }

    private Product prod(String name, String desc, String price, int stock, Category category, String seed,
                         BigDecimal discountPercent, String sku, String brand, String material, String color,
                         String sizes, String tags, String costPrice, int reorderLevel, boolean featured) {
        Product p = new Product();
        p.setName(name);
        p.setDescription(desc);
        p.setPrice(new BigDecimal(price));
        p.setStockQuantity(stock);
        p.setCategory(category);
        p.setImageUrl("https://images.unsplash.com/photo-" + seed + "?w=800&q=80&auto=format&fit=crop");
        p.setActive(true);
        p.setDiscountPercent(discountPercent != null ? discountPercent : BigDecimal.ZERO);
        p.setSku(sku);
        p.setBrand(brand);
        p.setMaterial(material);
        p.setColor(color);
        p.setSizes(sizes);
        p.setTags(tags);
        p.setCostPrice(costPrice != null ? new BigDecimal(costPrice) : null);
        p.setReorderLevel(reorderLevel);
        p.setFeatured(featured);
        p.setImagesJson("[]");
        return productRepository.save(p);
    }

    private void seedOrder(User user, String status, PaymentMethod payment, String address, String phone,
                           LocalDateTime createdAt, Object[]... items) {
        Order order = new Order();
        order.setUser(user);
        order.setStatus(OrderStatus.valueOf(status));
        order.setPaymentMethod(payment);
        order.setShippingAddress(address);
        order.setPhoneNumber(phone);
        order.setCreatedAt(createdAt);
        order.setShippingFee(SHIPPING_FEE);
        if (!"CANCELLED".equals(status) && !"PENDING".equals(status)) {
            order.setPaidAt(createdAt);
        }

        List<Map<String, Object>> history = new ArrayList<>();
        history.add(entry("PENDING", createdAt));
        if ("SHIPPED".equals(status) || "DELIVERED".equals(status)) {
            history.add(entry("PAID", createdAt));
        }
        if (!"PENDING".equals(status) && !"CANCELLED".equals(status)) {
            history.add(entry(status, createdAt));
        }
        if ("CANCELLED".equals(status)) {
            history.add(entry("CANCELLED", createdAt));
        }
        order.setStatusHistoryJson(writeJson(history));

        BigDecimal total = BigDecimal.ZERO;
        for (Object[] item : items) {
            Product product = (Product) item[0];
            int qty = (int) item[1];
            OrderItem oi = new OrderItem();
            oi.setProduct(product);
            oi.setQuantity(qty);
            BigDecimal unit = product.getPrice();
            BigDecimal disc = product.getDiscountPercent();
            if (disc != null && disc.compareTo(BigDecimal.ZERO) > 0 && disc.compareTo(new BigDecimal("99")) < 0) {
                unit = product.getPrice()
                        .multiply(BigDecimal.ONE.subtract(disc.divide(new BigDecimal("100"))))
                        .setScale(2, RoundingMode.HALF_UP);
            }
            oi.setUnitPrice(unit);
            oi.setProductImage(product.getImageUrl());
            order.addItem(oi);
            total = total.add(unit.multiply(BigDecimal.valueOf(qty)));
        }
        order.setTotalAmount(total);
        orderRepository.save(order);
    }

    private Map<String, Object> entry(String status, LocalDateTime at) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("status", status);
        map.put("at", at.format(DateTimeFormatter.ISO_DATE_TIME));
        return map;
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return "[]";
        }
    }
}