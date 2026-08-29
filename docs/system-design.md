# Reflex System Design

## 1. System Overview

Reflex is a delivery coordination system for small Kenyan retailers such as
electronics shops, pharmacies, and hardware stores.

The system replaces fragmented delivery coordination through WhatsApp and
phone calls with a centralized workflow.

The core workflow is:

1. Retailer creates a delivery request.
2. Dispatcher views open delivery requests.
3. Dispatcher assigns a rider.
4. Rider updates the delivery status.
5. Retailer and dispatcher can view the current delivery state.

The delivery lifecycle is:

**Open → Assigned → Picked Up → Delivered**

---

## 2. Technology Stack

| Component | Technology | Purpose |
|---|---|---|
| Frontend | HTML, CSS, JavaScript | User interfaces |
| Backend | JavaScript / Plain Node.js | API and business logic |
| Database | MySQL | Persistent data storage |
| Communication | HTTP / JSON | Frontend-to-backend communication |
| Version Control | Git / GitHub | Collaboration and source control |

### Why this stack?

The team selected a lightweight stack appropriate for the scope of the MVP.

The application has a small number of core workflows, so the architecture
prioritizes simplicity and clear separation between the frontend, backend, and
database.

---

## 3. High-Level Architecture

Reflex follows a centralized client–API–database architecture.

The three user interfaces are:

- Retailer interface
- Dispatcher interface
- Rider interface

All three interfaces communicate with the Node.js API over HTTP.

The Node.js API communicates with MySQL.

The frontend does not connect directly to MySQL.

**Architecture flow:**

**Retailer / Dispatcher / Rider → Node.js API → MySQL**

This separation keeps database access behind the application layer and gives the
backend a central place to enforce business rules.

---

## 4. System Workflow

### Retailer

The retailer creates a delivery request containing:

- Customer name
- Customer phone number
- Delivery address
- Item description

A newly created delivery starts with the status **Open**.

### Dispatcher

The dispatcher views open delivery requests and assigns a rider.

The delivery then changes from:

**Open → Assigned**

### Rider

The rider views deliveries assigned to them and updates the delivery as it
progresses.

The expected rider transitions are:

**Assigned → Picked Up → Delivered**

---

## 5. Data Flow

When a retailer creates a delivery:

1. The retailer enters delivery information in the frontend.
2. The frontend sends the request to the Node.js API.
3. The backend validates and processes the request.
4. The backend stores the delivery in MySQL.
5. The API returns the result to the frontend.

The same application-layer pattern is used when dispatchers assign riders and
riders update delivery status.

The frontend never communicates directly with MySQL.

---

## 6. Delivery State Management

The MVP uses four primary delivery states:

- **Open** — request created but not assigned.
- **Assigned** — dispatcher has assigned the delivery to a rider.
- **Picked Up** — rider has collected the delivery.
- **Delivered** — delivery has been completed.

Expected transitions are:

**Open → Assigned**

**Assigned → Picked Up**

**Picked Up → Delivered**

The backend should enforce valid state transitions rather than relying only on
the frontend.

For example:

**Open → Delivered**

should be rejected because the delivery has not passed through the required
intermediate states.

---

## 7. Backend Architecture

The backend uses plain Node.js rather than a larger web framework.

### Why plain Node.js?

The team's API surface is small, and we wanted to minimize external
dependencies while understanding the underlying HTTP request/response flow.

The trade-off is that routing, request handling, and middleware-like behavior
require more manual implementation than they would with a framework such as
Express.

For the MVP, the team considers this an acceptable trade-off.

If the API grows significantly, a framework could be introduced to simplify
routing, middleware, and repeated boilerplate.

---

## 8. Database Architecture

MySQL is the persistent data store.

The core entities are:

- User
- Delivery
- Assignment
- StatusUpdate

These entities represent users, delivery requests, rider assignments, and
delivery status history.

The detailed database model is maintained separately in:

`docs/ERD.md`

---

## 9. Synchronization

The MVP uses the HTTP API as the communication layer between the frontend and
backend.

The frontend can request current delivery information from the backend instead
of communicating directly with MySQL.

The MVP does not introduce dedicated real-time messaging infrastructure.

If instantaneous updates become a stronger requirement, the team can evaluate
WebSockets or Server-Sent Events.

---

## 10. Deployment Architecture

The target deployment maintains the same separation of concerns:

**Frontend → Node.js API → MySQL**

The frontend is publicly accessible to authorized users.

The Node.js API handles application requests.

MySQL provides persistent storage and should not be directly exposed to browser
clients.

The final hosting provider is a team deployment decision based on simplicity,
MySQL support, cost, and team familiarity.

---

## 11. Architecture Trade-offs

### Plain Node.js

**Decision:** Use plain Node.js instead of a framework such as Express.

**Acceptable because:** The MVP has a small API surface and the team wants to
minimize dependencies while understanding the underlying HTTP flow.

**Cost:** More manual routing and request handling.

**Future:** Introduce a framework if API complexity increases.

### HTTP-based synchronization

**Decision:** Keep synchronization within the HTTP-based API for the MVP.

**Acceptable because:** The initial objective is delivery coordination and
visibility without adding unnecessary infrastructure.

**Cost:** The MVP does not provide the same instantaneous event delivery as a
dedicated push-based system.

**Future:** Evaluate WebSockets or Server-Sent Events if real-time requirements
increase.

### Manual rider assignment

**Decision:** Dispatchers manually assign riders.

**Acceptable because:** The MVP focuses on proving the core delivery workflow
rather than automated dispatch optimization.

**Cost:** The dispatcher must select the rider manually.

**Future:** Add rider availability, location, and route information to support
automated or optimized assignment.

---

## 12. Future Improvements

Potential improvements beyond the MVP include:

- Authentication and role-based authorization
- Offline synchronization
- Conflict handling
- Real-time updates
- Automated rider assignment
- Location-aware dispatching
- Route optimization
- Monitoring and alerting
- Database backups and scaling
- Multiple backend instances for higher availability

These improvements are intentionally outside the core MVP scope.

---

## 13. Architecture Principle

The Reflex architecture prioritizes a simple and traceable delivery workflow.

The central design principle is:

> Users interact with Reflex through the application interface and API, while
> the backend applies business rules and MySQL provides persistent storage for
> delivery state.
