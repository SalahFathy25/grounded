CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    name_ar VARCHAR(120),
    image_url VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    category_id BIGINT,
    image_url VARCHAR(500) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    sku VARCHAR(50),
    brand VARCHAR(100),
    material VARCHAR(100),
    color VARCHAR(200),
    sizes VARCHAR(200),
    tags VARCHAR(300),
    cost_price DECIMAL(10,2),
    reorder_level INT NOT NULL DEFAULT 5,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    rating DOUBLE DEFAULT 0,
    reviews_count INT NOT NULL DEFAULT 0,
    images_json TEXT,
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(30) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    shipping_address TEXT NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    paid_at TIMESTAMP,
    payment_proof TEXT,
    payment_proof_at TIMESTAMP,
    status_history TEXT,
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    product_image VARCHAR(500),
    CONSTRAINT fk_items_order FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT fk_items_product FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS store_settings (
    id BIGINT PRIMARY KEY,
    store_name_en VARCHAR(120),
    store_name_ar VARCHAR(120),
    tagline_en VARCHAR(500),
    tagline_ar VARCHAR(500),
    announcement_en VARCHAR(500),
    announcement_ar VARCHAR(500),
    announcement_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    vodafone_number VARCHAR(60),
    instapay_number VARCHAR(60),
    support_phone VARCHAR(40),
    support_email VARCHAR(150),
    instagram_url VARCHAR(300),
    facebook_url VARCHAR(300),
    tiktok_url VARCHAR(300),
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS store_content (
    id BIGINT PRIMARY KEY,
    content_json TEXT NOT NULL,
    updated_at TIMESTAMP
);
