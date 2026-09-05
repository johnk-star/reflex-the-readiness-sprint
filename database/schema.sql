CREATE DATABASE IF NOT EXISTS reflex_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE reflex_db;

CREATE TABLE users (
    user_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('RETAILER', 'DISPATCHER', 'RIDER') NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE retailers (
    retailer_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    business_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    address VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE retailer_users (
    retailer_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (retailer_id, user_id),
    CONSTRAINT fk_retailer_users_retailer
        FOREIGN KEY (retailer_id) REFERENCES retailers (retailer_id),
    CONSTRAINT fk_retailer_users_user
        FOREIGN KEY (user_id) REFERENCES users (user_id)
);

CREATE TABLE products (
    product_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(150) NOT NULL,
    category ENUM('PHONE', 'LAPTOP', 'LAPTOP_BACKPACK') NOT NULL,
    size_or_variant VARCHAR(50) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    UNIQUE KEY uq_product_variant (product_name, size_or_variant)
);

CREATE TABLE deliveries (
    delivery_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    retailer_id BIGINT UNSIGNED NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    delivery_address VARCHAR(255) NOT NULL,
    item_description VARCHAR(255) NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    quantity SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    status ENUM('REQUESTED', 'ASSIGNED', 'PICKED_UP', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'REQUESTED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_delivery_quantity CHECK (quantity > 0),
    CONSTRAINT fk_deliveries_retailer
        FOREIGN KEY (retailer_id) REFERENCES retailers (retailer_id),
    CONSTRAINT fk_deliveries_product
        FOREIGN KEY (product_id) REFERENCES products (product_id),
    INDEX idx_deliveries_status (status),
    INDEX idx_deliveries_retailer (retailer_id)
);

CREATE TABLE assignments (
    assignment_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    delivery_id BIGINT UNSIGNED NOT NULL,
    rider_id BIGINT UNSIGNED NOT NULL,
    assigned_by BIGINT UNSIGNED NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    unassigned_at TIMESTAMP NULL,
    active_delivery_id BIGINT UNSIGNED GENERATED ALWAYS AS (
        CASE WHEN unassigned_at IS NULL THEN delivery_id ELSE NULL END
    ) STORED,
    CONSTRAINT fk_assignments_delivery
        FOREIGN KEY (delivery_id) REFERENCES deliveries (delivery_id),
    CONSTRAINT fk_assignments_rider
        FOREIGN KEY (rider_id) REFERENCES users (user_id),
    CONSTRAINT fk_assignments_dispatcher
        FOREIGN KEY (assigned_by) REFERENCES users (user_id),
    UNIQUE KEY uq_one_active_assignment (active_delivery_id),
    INDEX idx_assignments_rider (rider_id)
);

CREATE TABLE status_updates (
    status_update_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    delivery_id BIGINT UNSIGNED NOT NULL,
    status ENUM('REQUESTED', 'ASSIGNED', 'PICKED_UP', 'DELIVERED', 'CANCELLED') NOT NULL,
    updated_by BIGINT UNSIGNED NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_status_updates_delivery
        FOREIGN KEY (delivery_id) REFERENCES deliveries (delivery_id),
    CONSTRAINT fk_status_updates_user
        FOREIGN KEY (updated_by) REFERENCES users (user_id),
    INDEX idx_status_updates_delivery_time (delivery_id, updated_at)
);

CREATE TABLE delivery_confirmations (
    confirmation_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    delivery_id BIGINT UNSIGNED NOT NULL,
    scanned_by BIGINT UNSIGNED NOT NULL,
    confirmation_code VARCHAR(100) NOT NULL,
    scanned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    result ENUM('SUCCESSFUL', 'FAILED') NOT NULL,
    CONSTRAINT fk_confirmations_delivery
        FOREIGN KEY (delivery_id) REFERENCES deliveries (delivery_id),
    CONSTRAINT fk_confirmations_user
        FOREIGN KEY (scanned_by) REFERENCES users (user_id),
    UNIQUE KEY uq_confirmation_code (confirmation_code)
);

DELIMITER $$

CREATE TRIGGER validate_status_update
BEFORE INSERT ON status_updates
FOR EACH ROW
BEGIN
    DECLARE current_status VARCHAR(20);

    SELECT status INTO current_status
    FROM deliveries
    WHERE delivery_id = NEW.delivery_id
    FOR UPDATE;

    IF NOT (
        (current_status = 'REQUESTED' AND NEW.status IN ('REQUESTED', 'ASSIGNED', 'CANCELLED')) OR
        (current_status = 'ASSIGNED' AND NEW.status IN ('ASSIGNED', 'PICKED_UP', 'CANCELLED')) OR
        (current_status = 'PICKED_UP' AND NEW.status IN ('PICKED_UP', 'DELIVERED')) OR
        (current_status = 'DELIVERED' AND NEW.status = 'DELIVERED') OR
        (current_status = 'CANCELLED' AND NEW.status = 'CANCELLED')
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Invalid delivery status transition';
    END IF;
END$$

CREATE TRIGGER apply_status_update
AFTER INSERT ON status_updates
FOR EACH ROW
BEGIN
    UPDATE deliveries
    SET status = NEW.status
    WHERE delivery_id = NEW.delivery_id;
END$$

CREATE TRIGGER record_assignment_status
AFTER INSERT ON assignments
FOR EACH ROW
BEGIN
    INSERT INTO status_updates (delivery_id, status, updated_by)
    VALUES (NEW.delivery_id, 'ASSIGNED', NEW.assigned_by);
END$$

DELIMITER ;