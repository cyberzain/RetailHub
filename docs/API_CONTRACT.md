# RetailHub - Production REST API Specification & Contract (v1.0)

This document formalizes the production API contract between the **RetailHub React Frontend** (`frontend/`) and the **Node.js/Express PostgreSQL Backend** (`backend/`).

## Architectural Highlights
- **Base Endpoint**: `http://localhost:5000/api/v1`
- **Database Engine**: PostgreSQL 14+ (Relational). See [POSTGRESQL_SCHEMA.md](file:///c:/Users/zainu/Desktop/RetailHub/docs/POSTGRESQL_SCHEMA.md) for full SQL table DDL, indexes, and constraints.
- **Frontend Framework**: React 18+ (Vite SPA) with contextual state management and local fallback engine.
- **Security & Authorization**: Standard Bearer JWT tokens (`Authorization: Bearer <token>`) passed via HTTP headers.
- **Idempotency Protection**: Every POS sale submission supports client-generated `idempotencyKey` values to prevent duplicate transaction deductions.
- **Role Scoping**: Multi-role support for `Owner`, `Manager`, and `Salesperson` with branch isolation (`branchId`).



---

## 1. Authentication & Session

### `POST /api/v1/auth/login`
- **Description**: Authenticate store staff member and obtain a signed JWT.
- **Request Body**:
```json
{
  "email": "owner@retailhub.com",
  "password": "admin123"
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "EMP-01",
    "name": "Zain Khan",
    "email": "owner@retailhub.com",
    "role": "Owner",
    "branchId": "BR-01",
    "status": "Active"
  }
}
```

### `POST /api/v1/auth/logout`
- **Description**: Invalidates client session.
- **Success Response (200 OK)**: `{ "success": true, "message": "Logged out successfully" }`

### `POST /api/v1/auth/forgot-password`
- **Description**: Generates password reset verification token for store account.
- **Request Body**: `{ "email": "manager@retailhub.com" }`
- **Success Response (200 OK)**: `{ "success": true, "message": "...", "token": "RH-123456" }`

### `POST /api/v1/auth/reset-password`
- **Description**: Resets account password using validated token.
- **Request Body**: `{ "email": "manager@retailhub.com", "token": "RH-123456", "newPassword": "newSecretPassword" }`
- **Success Response (200 OK)**: `{ "success": true, "message": "Password has been successfully reset." }`

### `POST /api/v1/auth/verify-manager-pin`
- **Description**: Authorizes restricted POS operations (discounts > 15%, cart clearing, returns).
- **Request Body**: `{ "pin": "1234" }`
- **Success Response (200 OK)**: `{ "success": true, "authorized": true, "managerName": "Sahil Kumar", "managerRole": "Manager" }`
- **Error Response (401 Unauthorized)**: `{ "success": false, "authorized": false, "error": "Invalid Manager Authorization PIN" }`

### `POST /api/v1/auth/signup`
- **Description**: Register a new store owner account.
- **Request Body**: `{ shopName, ownerName, email, password }`
- **Success Response (201 Created)**: Returns `{ success: true, token, user }`.

### `GET /api/v1/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Current authenticated user object.

---

## 1.1 Staff Management & RBAC (`/api/v1/staff`)
*Protected by `requireAuth` and `requireRole(["Owner", "Manager"])*

### `GET /api/v1/staff`
- **Description**: Returns all store staff accounts with sanitized profile details.
- **Success Response (200 OK)**: `{ "success": true, "count": 5, "data": [...] }`

### `POST /api/v1/staff`
- **Description**: Create new staff account. Managers can only create Salespeople; Owners can create Managers.
- **Request Body**: `{ "name": "Ramesh C", "email": "ramesh@retailhub.com", "password": "...", "role": "Salesperson", "phone": "...", "shift": "Morning" }`
- **Success Response (201 Created)**: `{ "success": true, "data": { ... }, "message": "..." }`

### `PATCH /api/v1/staff/:id`
- **Description**: Updates employee details (name, phone, shift, role).
- **Request Body**: `{ "name": "...", "phone": "...", "shift": "..." }`

### `PATCH /api/v1/staff/:id/status`
- **Description**: Toggles or sets employee status (`Active` / `Inactive`).
- **Request Body**: `{ "status": "Inactive" }`
- **Security**: Self-deactivation and deactivating Owner accounts is blocked.

### `POST /api/v1/staff/:id/reset-password`
- **Description**: Manager or Owner overrides staff account password.
- **Request Body**: `{ "newPassword": "newPassword123" }`

---

## 2. Product Catalog Management

### `GET /api/v1/products`
- **Query Parameters**:
  - `search` (optional): Filter by name, SKU, or barcode
  - `category` (optional): Filter by category name (e.g. `Electronics`)
  - `branchId` (optional): Filter by branch (`BR-01`)
- **Response (200 OK)**:
```json
{
  "success": true,
  "count": 26,
  "data": [
    {
      "id": "PRD-101",
      "name": "Apple iPhone 15 Pro (128GB)",
      "category": "Electronics",
      "price": 129900,
      "cost": 110000,
      "taxRate": 18,
      "stock": 14,
      "minStock": 5,
      "barcode": "890123456789",
      "sku": "IP15P-128",
      "unit": "Pcs",
      "branchId": "BR-01",
      "status": "Active",
      "icon": "fa-mobile-screen-button"
    }
  ]
}
```

### `POST /api/v1/products` (Requires Auth)
- **Request Body**:
```json
{
  "name": "Anker Soundcore Motion+",
  "category": "Audio",
  "price": 9999,
  "cost": 6800,
  "stock": 20,
  "minStock": 5,
  "sku": "ANK-SPK-01",
  "barcode": "890123456900"
}
```
- **Validation**: Enforces unique SKU and unique barcode across branch inventory.
- **Side Effect**: Automatically generates initial `"IN"` stock movement ledger entry.

### `PUT /api/v1/products/:id` (Requires Auth)
- Updates product details, prices, or attributes.

### `DELETE /api/v1/products/:id` (Requires Owner/Manager Role)
- Soft or hard deletes product from store catalog.

---

## 3. Inventory & Stock Movement Ledger

### `GET /api/v1/inventory/movements`
- **Description**: Returns complete audit trail of stock adjustments, PO receipts, returns, and POS deductions.
- **Response (200 OK)**:
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "SM-1042",
      "date": "2026-10-16",
      "productId": "PRD-101",
      "productName": "Apple iPhone 15 Pro (128GB)",
      "type": "OUT",
      "qty": 1,
      "reference": "POS Sale",
      "by": "Sahil K."
    }
  ]
}
```

### `POST /api/v1/inventory/adjust` (Requires Auth)
- **Request Body**: `{ "productId": "PRD-101", "newQty": 20, "reason": "Physical Shelf Count Audit" }`
- **Side Effect**: Adjusts current stock and logs signed delta in the stock movement ledger.

---

## 4. POS Billing & Invoicing Engine

### `POST /api/v1/sales`
- **Description**: Finalizes cart sale, calculates tax/subtotals on server, validates sufficient stock, decrements inventory safely, and updates customer Khata/points.
- **Request Body**:
```json
{
  "customer": "Aarav Sharma",
  "items": [
    { "id": "PRD-101", "name": "Apple iPhone 15 Pro (128GB)", "qty": 1, "price": 129900 },
    { "id": "PRD-103", "name": "Sony WH-1000XM5 Headphones", "qty": 1, "price": 26990 }
  ],
  "discount": 2000,
  "paymentMethod": "Cash",
  "idempotencyKey": "SALE-1729100000-xyz12"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "INV-1095",
    "date": "2026-10-16",
    "time": "14:32",
    "customer": "Aarav Sharma",
    "items": [...],
    "subtotal": 156890,
    "tax": 28240,
    "discount": 2000,
    "total": 183130,
    "costTotal": 131000,
    "paymentMethod": "Cash",
    "status": "Paid",
    "cashier": "Zain Khan",
    "serverConfirmed": true,
    "idempotencyKey": "SALE-1729100000-xyz12"
  }
}
```

### `POST /api/v1/sales/:id/return` (Requires Auth)
- **Description**: Processes partial or complete sale returns.
- **Request Body**:
```json
{
  "returnedItems": [{ "name": "Apple iPhone 15 Pro (128GB)", "qty": 1 }],
  "refundAmount": 129900,
  "reason": "Customer changed mind - unopened box"
}
```
- **Side Effect**: Marks sale invoice as `"Refunded/Returned"`, increments inventory stock levels, and records `"IN"` stock movement audit.

---

## 5. Customers & Khata Credit Ledger

### `GET /api/v1/customers`
- Returns customers with loyalty points and outstanding Khata balances.

### `POST /api/v1/customers` (Requires Auth)
- **Request Body**: `{ "name": "Pooja Verma", "phone": "+91 98111 22334", "email": "pooja@example.com" }`

### `POST /api/v1/customers/:id/payment` (Requires Auth)
- **Description**: Records settlement payment against customer's credit balance.
- **Request Body**: `{ "amount": 2500 }`
- **Side Effect**: Decrements `creditBalance` and records activity log.

---

## 6. Purchase Orders & Suppliers

### `GET /api/v1/suppliers` & `POST /api/v1/suppliers`
- Supplier directory with contact details and payables tracking.

### `GET /api/v1/purchases` & `POST /api/v1/purchases`
- Purchase order generation.

### `POST /api/v1/purchases/:id/receive` (Requires Auth)
- **Description**: Confirms delivery receipt of stock from supplier.
- **Side Effect**: Transitions PO status to `"Received"`, guaranteeing that inventory is only incremented upon verified receipt.

---

## 7. AI Business Intelligence & Forecasting

### `GET /api/v1/ai/insights`
- **Description**: Computes 7-day predictive sales estimate, smart reorder quantities, and slow-moving stock capital metrics.
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "forecastPeriod": "Next 7 Days (Estimate)",
    "estimatedRevenue": 171500,
    "growthConfidence": "89% confidence based on seasonal trend",
    "reorderAlerts": [
      {
        "id": "PRD-107",
        "name": "Dell 27-inch 4K UHD Monitor",
        "currentStock": 2,
        "minStock": 5,
        "suggestedQty": 13,
        "estimatedCost": 390000,
        "urgency": "High Priority"
      }
    ],
    "slowMoving": [...]
  }
}
```

### `POST /api/v1/ai/chat`
- **Description**: AI Business Copilot chat interface answering questions regarding store metrics.
- **Request Body**: `{ "prompt": "What items are running low on stock?" }`
- **Response**: `{ "success": true, "reply": "..." }`
