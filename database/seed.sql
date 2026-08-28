USE reflex_db;

INSERT INTO users (name, phone, email, password_hash, role) VALUES
    ('Amina Otieno', '+254700000001', 'amina@reflex.test', 'replace-with-password-hash', 'RETAILER'),
    ('Daniel Mwangi', '+254700000002', 'daniel@reflex.test', 'replace-with-password-hash', 'DISPATCHER'),
    ('Brian Kamau', '+254700000003', 'brian@reflex.test', 'replace-with-password-hash', 'RIDER'),
    ('Faith Wanjiku', '+254700000004', 'faith@reflex.test', 'replace-with-password-hash', 'RIDER'),
    ('Kevin Ochieng', '+254700000005', 'kevin@reflex.test', 'replace-with-password-hash', 'RIDER');

INSERT INTO retailers (business_name, phone, address) VALUES
    ('Reflex Tech Store', '+254711000001', 'Moi Avenue, Nairobi');

INSERT INTO retailer_users (retailer_id, user_id)
VALUES (1, 1);

INSERT INTO products (product_name, category, size_or_variant, unit_price) VALUES
    ('iPhone 17 Pro Max', 'PHONE', '256GB', 1799.00),
    ('iPhone 17 Pro Max', 'PHONE', '512GB', 1999.00),
    ('Laptop', 'LAPTOP', '13-inch', 1099.00),
    ('Laptop', 'LAPTOP', '15-inch', 1299.00),
    ('Laptop', 'LAPTOP', '17-inch', 1499.00),
    ('Laptop Backpack', 'LAPTOP_BACKPACK', 'Standard', 79.00),
    ('Laptop Backpack', 'LAPTOP_BACKPACK', 'Large', 99.00);

INSERT INTO deliveries
    (retailer_id, customer_name, customer_phone, delivery_address, item_description, product_id, quantity)
VALUES
    (1, 'Grace Njeri', '+254720000001', 'Kilimani, Nairobi', 'iPhone 17 Pro Max, 256GB', 1, 1),
    (1, 'Mark Kiptoo', '+254720000002', 'Westlands, Nairobi', 'Laptop, 15-inch', 4, 1),
    (1, 'Lydia Achieng', '+254720000003', 'South B, Nairobi', 'Laptop Backpack, Large', 7, 1),
    (1, 'Peter Mutua', '+254720000004', 'Kasarani, Nairobi', 'iPhone 17 Pro Max, 512GB', 2, 1),
    (1, 'Susan Wambui', '+254720000005', 'Lavington, Nairobi', 'Laptop, 13-inch', 3, 1);

INSERT INTO status_updates (delivery_id, status, updated_by)
VALUES
    (1, 'REQUESTED', 1),
    (2, 'REQUESTED', 1),
    (3, 'REQUESTED', 1),
    (4, 'REQUESTED', 1),
    (5, 'REQUESTED', 1);

INSERT INTO assignments (delivery_id, rider_id, assigned_by)
VALUES
    (1, 3, 2),
    (2, 4, 2),
    (3, 5, 2),
    (4, 3, 2),
    (5, 4, 2);

INSERT INTO status_updates (delivery_id, status, updated_by)
VALUES
    (1, 'PICKED_UP', 3),
    (2, 'PICKED_UP', 4),
    (3, 'PICKED_UP', 5),
    (4, 'PICKED_UP', 3);

INSERT INTO status_updates (delivery_id, status, updated_by)
VALUES
    (3, 'DELIVERED', 5);

INSERT INTO delivery_confirmations (delivery_id, scanned_by, confirmation_code, result)
VALUES
    (3, 5, 'REFLEX-DELIVERY-0003', 'SUCCESSFUL');