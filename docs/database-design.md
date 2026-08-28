# Reflex Database Design

## Field reference

| Table | Field | Type | Description |
|---|---|---|---|
| users | user_id | BIGINT UNSIGNED | Unique user identifier |
| users | name | VARCHAR(100) | User's full name |
| users | phone | VARCHAR(30) | User contact number |
| users | email | VARCHAR(255) | Unique login/contact email |
| users | password_hash | VARCHAR(255) | Hashed password; never store plain text |
| users | role | ENUM | `RETAILER`, `DISPATCHER`, or `RIDER` |
| retailers | retailer_id | BIGINT UNSIGNED | Unique retailer identifier |
| retailers | business_name | VARCHAR(150) | Retailer or shop name |
| retailers | phone | VARCHAR(30) | Business contact number |
| retailers | address | VARCHAR(255) | Business location |
| retailer_users | retailer_id | BIGINT UNSIGNED FK | Links staff to a retailer |
| retailer_users | user_id | BIGINT UNSIGNED FK | Links a user to a retailer |
| products | product_id | BIGINT UNSIGNED | Unique product variant |
| products | product_name | VARCHAR(150) | Product name, such as iPhone 17 Pro Max |
| products | category | ENUM | Phone, laptop, or laptop backpack |
| products | size_or_variant | VARCHAR(50) | Storage, laptop size, or backpack size |
| products | unit_price | DECIMAL(10,2) | Price for one item |
| deliveries | delivery_id | BIGINT UNSIGNED | Unique delivery request |
| deliveries | retailer_id | BIGINT UNSIGNED FK | Retailer that created the request |
| deliveries | product_id | BIGINT UNSIGNED FK | Product being delivered |
| deliveries | customer_name | VARCHAR(100) | Recipient's name |
| deliveries | customer_phone | VARCHAR(30) | Recipient's contact number |
| deliveries | delivery_address | VARCHAR(255) | Destination address |
| deliveries | item_description | VARCHAR(255) | Human-readable order description |
| deliveries | quantity | SMALLINT UNSIGNED | Number of items |
| deliveries | status | ENUM | Current lifecycle status |
| deliveries | created_at | TIMESTAMP | Request creation time |
| deliveries | updated_at | TIMESTAMP | Last record update time |
| assignments | assignment_id | BIGINT UNSIGNED | Unique assignment record |
| assignments | delivery_id | BIGINT UNSIGNED FK | Delivery being assigned |
| assignments | rider_id | BIGINT UNSIGNED FK | Rider receiving the delivery |
| assignments | assigned_by | BIGINT UNSIGNED FK | Dispatcher who made the assignment |
| assignments | assigned_at | TIMESTAMP | Assignment time |
| assignments | unassigned_at | TIMESTAMP NULL | Time assignment ended; NULL means active |
| status_updates | status_update_id | BIGINT UNSIGNED | Unique status event |
| status_updates | delivery_id | BIGINT UNSIGNED FK | Delivery whose status changed |
| status_updates | status | ENUM | Status after the event |
| status_updates | updated_by | BIGINT UNSIGNED FK | User who changed the status |
| status_updates | updated_at | TIMESTAMP | Status change time |
| delivery_confirmations | confirmation_id | BIGINT UNSIGNED | Unique scan/confirmation record |
| delivery_confirmations | delivery_id | BIGINT UNSIGNED FK | Delivery being confirmed |
| delivery_confirmations | scanned_by | BIGINT UNSIGNED FK | Rider or user who scanned |
| delivery_confirmations | confirmation_code | VARCHAR(100) | Unique QR/order confirmation code |
| delivery_confirmations | scanned_at | TIMESTAMP | Scan time |
| delivery_confirmations | result | ENUM | `SUCCESSFUL` or `FAILED` |

## Design decisions

### Why separate `assignments` from `deliveries`?

`deliveries` stores the request itself. `assignments` stores who was assigned and when. Keeping them separate preserves reassignment history and records the dispatcher responsible for each assignment. The generated `active_delivery_id` column has a unique index, so only one active rider assignment can exist for a delivery.

### How are invalid status transitions prevented?

The `validate_status_update` trigger permits only the agreed lifecycle: `REQUESTED -> ASSIGNED -> PICKED_UP -> DELIVERED`. Cancellation is allowed from `REQUESTED` or `ASSIGNED`. Every accepted status event is stored in `status_updates`, and the `apply_status_update` trigger keeps `deliveries.status` current.

### What happens if two dispatchers assign the same delivery?

The API should assign inside a transaction and lock the delivery row with `SELECT ... FOR UPDATE`. The unique active-assignment index is the final database safeguard. The second assignment fails with a duplicate-key error and should return HTTP `409 Conflict`.

## API integration contract

The static JavaScript pages should call a server-side API. Browser JavaScript must not connect directly to MySQL or contain database credentials.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/deliveries` | Create a request with status `REQUESTED` |
| GET | `/api/deliveries?status=REQUESTED` | List open requests for dispatch |
| POST | `/api/deliveries/:id/assign` | Create an assignment in a transaction |
| POST | `/api/deliveries/:id/status` | Add a validated status update |
| GET | `/api/deliveries/:id/history` | Return assignment and status history |
| POST | `/api/deliveries/:id/confirm` | Save a scan/order confirmation |

Assignment transaction outline:

```text
BEGIN
SELECT status FROM deliveries WHERE delivery_id = ? FOR UPDATE
INSERT INTO assignments (delivery_id, rider_id, assigned_by) VALUES (?, ?, ?)
COMMIT
```

The API should validate that `assigned_by` has the `DISPATCHER` role and `rider_id` has the `RIDER` role before inserting. It should roll back on any error.