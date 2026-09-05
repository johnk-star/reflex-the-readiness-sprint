# Reflex Entity Relationship Diagram

The database uses a relational model. A retailer can have multiple staff users, a delivery belongs to one retailer, and a delivery can have many historical assignments and status updates.

```mermaid
erDiagram
    RETAILERS ||--o{ RETAILER_USERS : has
    USERS ||--o{ RETAILER_USERS : belongs_to
    RETAILERS ||--o{ DELIVERIES : creates
    PRODUCTS ||--o{ DELIVERIES : describes
    DELIVERIES ||--o{ ASSIGNMENTS : receives
    USERS ||--o{ ASSIGNMENTS : rides
    USERS ||--o{ ASSIGNMENTS : assigns
    DELIVERIES ||--o{ STATUS_UPDATES : records
    USERS ||--o{ STATUS_UPDATES : changes
    DELIVERIES ||--o{ DELIVERY_CONFIRMATIONS : confirms
    USERS ||--o{ DELIVERY_CONFIRMATIONS : scans

    USERS {
        bigint user_id PK
        varchar name
        varchar phone
        varchar email UK
        enum role
        timestamp created_at
    }
    RETAILERS {
        bigint retailer_id PK
        varchar business_name
        varchar phone
        varchar address
        timestamp created_at
    }
    RETAILER_USERS {
        bigint retailer_id PK, FK
        bigint user_id PK, FK
    }
    PRODUCTS {
        bigint product_id PK
        varchar product_name
        enum category
        varchar size_or_variant
        decimal unit_price
    }
    DELIVERIES {
        bigint delivery_id PK
        bigint retailer_id FK
        bigint product_id FK
        varchar customer_name
        varchar customer_phone
        varchar delivery_address
        enum status
        timestamp created_at
        timestamp updated_at
    }
    ASSIGNMENTS {
        bigint assignment_id PK
        bigint delivery_id FK
        bigint rider_id FK
        bigint assigned_by FK
        timestamp assigned_at
        timestamp unassigned_at
    }
    STATUS_UPDATES {
        bigint status_update_id PK
        bigint delivery_id FK
        enum status
        bigint updated_by FK
        timestamp updated_at
    }
    DELIVERY_CONFIRMATIONS {
        bigint confirmation_id PK
        bigint delivery_id FK
        bigint scanned_by FK
        varchar confirmation_code UK
        timestamp scanned_at
        enum result
    }
```