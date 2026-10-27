# RetailHub — International Collaborator Guide

> **Project**: RetailHub (Cloud POS & Retail ERP)  
> **Global Standard**: USD Currency ($) • International Retail & Multi-Branch Architecture  
> **Frontend Lead**: React 18 + Vite SPA (`frontend/` on port `3000`)  
> **Backend Lead (Your Partner)**: PostgreSQL + REST API (`backend/` on port `5000`)  

---

## 1. Collaboration Roles & Division of Work

| Area | Team Member | Tech Stack | Status |
| :--- | :--- | :--- | :--- |
| **Frontend UI / UX** | Frontend Lead (Current Developer) | React 18, Vite, Context API, CSS3 Modules | ✅ **Completed & Verified** |
| **Backend & Database** | Backend Collaborator (You) | Node.js / Express or Python / FastAPI, PostgreSQL | ⏳ **In Progress / Ready for API Implementation** |

---

## 2. Global / International Retail Standards

1. **Currency**: **USD ($)** is the default across all products, carts, invoices, tax calculations, and cash drawer reconciliations.
2. **Payment Methods**:
   - `Cash` (Tendered amount, denomination chips: $20, $50, $100, change calculation)
   - `Card` (Credit / Debit transactions with authorization trace)
   - `Digital Wallet` (Apple Pay, Google Pay, PayPal)
   - `Store Credit` (Customer House Account balance / Accounts Receivable)
   - `Split` (Configurable split between Cash and Card / Digital Wallet)
3. **Tax & Business Registration**:
   - Standard configurable Sales Tax / VAT (default `8.25%`, adjustable in Store Settings).
   - Business Tax ID: Standard `Tax ID / VAT / EIN Registration Number`.
4. **Customer Accounts & Credit**:
   - Full Accounts Receivable (AR) ledger for customer house accounts.
   - Loyalty points accumulator: `1 point per $100 spent`.

---

## 3. Database Architecture (PostgreSQL)

The full DDL and seed script is documented in [`docs/POSTGRESQL_SCHEMA.md`](./POSTGRESQL_SCHEMA.md).

### Quick Setup:
```bash
# 1. Create PostgreSQL Database
createdb -U postgres retailhub

# 2. Run DDL schema and seed records
psql -U postgres -d retailhub -f schema.sql
```

### Core Tables:
- `branches` — Downtown Flagship, Uptown Outlet
- `settings` — Store details, currency (`USD`), tax rate (`8.25%`), invoice prefix
- `users` — Role-based accounts (`Owner`, `Manager`, `Salesperson`) with 4-digit manager PINs
- `categories` — Product categories with item counts
- `products` — SKU, Barcode, price (USD), cost, tax rate, stock, min stock
- `customers` — Customer CRM, loyalty points, outstanding credit balances
- `suppliers` — Vendor directory, contact details, balance payable
- `purchase_orders` — Purchase orders, status tracking, receiving stock
- `sales` & `sale_items` — Transactions, invoice number, items, payment breakdown
- `expenses` — Operating expenses, categories, paid by (Cash, Bank, Card, Digital Wallet)
- `cash_register_shifts` — Shift opening cash, sales, expenses, cash drawer reconciliation
- `stock_movements` — Immutable audit ledger (`IN`, `OUT`, `ADJUSTMENT`, `RETURN`)
- `loyalty_coupons` — Promotional coupon codes (`percentage` or `fixed`)

---

## 4. API Endpoints Contract

The backend must serve endpoints under: **`http://localhost:5000/api/v1`**

### Health Check (Required for Handshake):
- **`GET http://localhost:5000/`**
- **Response**: `{ "online": true, "database": "PostgreSQL", "version": "1.0.0" }`

### CORS Configuration:
```javascript
// Express.js CORS configuration
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  credentials: true
}));
```

### JSON Response Standard:
- **List items**: `{ "success": true, "count": 26, "data": [...] }`
- **Single item**: `{ "success": true, "data": { ... } }`
- **Error**: `{ "success": false, "error": "Human readable error message" }`

### Key Endpoints:
```
POST   /api/v1/auth/login                # Returns JWT token and user profile
GET    /api/v1/auth/me                   # Validates current bearer token
POST   /api/v1/auth/verify-manager-pin   # Validates 4-digit PIN for restricted discounts

GET    /api/v1/products                  # Full product catalog
POST   /api/v1/products                  # Create new SKU
PUT    /api/v1/products/:id              # Update product or stock level
DELETE /api/v1/products/:id              # Remove product

GET    /api/v1/sales                     # Transaction history
POST   /api/v1/sales                     # Process POS checkout (with stock decrement)
POST   /api/v1/sales/:id/return          # Process item return and refund

GET    /api/v1/customers                 # Customer list with credit balance
POST   /api/v1/customers                 # Create customer
POST   /api/v1/customers/:id/payment     # Settle customer credit balance

GET    /api/v1/expenses                  # Expense ledger
POST   /api/v1/expenses                  # Record expense
GET    /api/v1/register/current          # Active cash drawer shift
POST   /api/v1/register/close            # Close cash drawer & reconcile

GET    /api/v1/staff                     # Employee accounts
POST   /api/v1/staff                     # Create staff member
PATCH  /api/v1/staff/:id/status          # Activate / Deactivate staff
```

For complete payload samples and status codes, see [`docs/API_CONTRACT.md`](./API_CONTRACT.md).

---

## 5. Frontend Seamless Local Fallback

The React frontend includes an offline engine:
- If your PostgreSQL backend is **offline**, the React frontend operates smoothly on local storage using seed USD data so UI work is never blocked.
- The moment your backend starts on port 5000 and responds to `GET http://localhost:5000/`, the frontend automatically transitions the indicator to **"PostgreSQL API Live"** and sends all transactions to your database.

---

## 6. How to Run the Project Locally

```bash
# Terminal 1: Run Frontend (React 18 + Vite)
cd frontend
npm install
npm run dev
# Running on http://localhost:3000/

# Terminal 2: Run Backend (Collaborator)
cd backend
npm install
npm run dev
# Running on http://localhost:5000/
```
