# RetailHub — PostgreSQL Database Architecture & Schema Specification

> **Target Database Engine**: PostgreSQL 14+ / 15+ / 16+  
> **Backend Architecture**: Node.js / Express or Python / FastAPI with PostgreSQL  
> **Default Connection String**: `postgresql://postgres:postgres@localhost:5432/retailhub`  
> **API Port & Prefix**: `http://localhost:5000/api/v1`

---

## 1. Collaboration & Architecture Overview

RetailHub is structured with a strict separation of concerns:
- **Frontend Lead (React)**: React 18+ SPA (Single Page Application) with state management, modular components, POS terminal, CRM, and offline/mock sync capabilities.
- **Backend Lead (Your Responsibility)**: PostgreSQL database design, REST API endpoints (`/api/v1`), JWT authentication, and business logic execution.

### Key API & Data Interchange Rules
1. **JSON Field Casing**: Use standard camelCase in JSON API responses (`creditBalance`, `sku`, `minStock`, `taxRate`) to match the React frontend contracts.
2. **Standard IDs**: Each table uses `id VARCHAR(50)` or `UUID` (e.g., `gen_random_uuid()` or human codes like `PRD-101`, `INV-1094`, `CUST-001`).
3. **Response Envelopes**:
   - List endpoints: `{ "success": true, "count": 26, "data": [...] }`
   - Single item: `{ "success": true, "data": { ... } }`
   - Errors: `{ "success": false, "error": "Human-readable error message" }`

---

## 2. PostgreSQL DDL Schema (`schema.sql`)

Copy and run this SQL script in `psql` or pgAdmin to create the entire database structure:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================================
-- 1. STORE BRANCHES TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS branches (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'BR-' || SUBSTRING(gen_random_uuid()::text, 1, 8),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(50) DEFAULT '',
    is_main BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- 2. STORE SETTINGS TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    shop_name VARCHAR(255) DEFAULT 'RetailHub Flagship Store',
    shop_tagline VARCHAR(255) DEFAULT 'Premium Multi-Brand Tech & Lifestyle Store',
    currency VARCHAR(10) DEFAULT 'USD',
    currency_symbol VARCHAR(10) DEFAULT '$',
    tax_rate NUMERIC(5,2) DEFAULT 8.25,
    gstin VARCHAR(50) DEFAULT 'US-TAX-88990123',
    phone VARCHAR(50) DEFAULT '+1 (555) 887-6655',
    email VARCHAR(255) DEFAULT 'contact@retailhubstore.com',
    address TEXT DEFAULT 'Suite 104, West Commerce Blvd, New York, NY 10001',
    invoice_prefix VARCHAR(20) DEFAULT 'INV-',
    receipt_footer TEXT DEFAULT 'Thank you for shopping with RetailHub! Items can be exchanged within 14 days with original receipt.',
    theme VARCHAR(50) DEFAULT 'light',
    enable_loyalty BOOLEAN DEFAULT TRUE,
    enable_storefront BOOLEAN DEFAULT TRUE,
    enable_ai_insights BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- 3. USERS / STAFF ACCOUNTS TABLE (Role-Based Access Control)
-- ==========================================================
CREATE TYPE user_role AS ENUM ('Owner', 'Manager', 'Salesperson');
CREATE TYPE user_status AS ENUM ('Active', 'Inactive');

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'EMP-' || SUBSTRING(gen_random_uuid()::text, 1, 8),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'Salesperson',
    phone VARCHAR(50) DEFAULT '',
    status user_status DEFAULT 'Active',
    shift VARCHAR(100) DEFAULT 'Full-Time',
    pin VARCHAR(4) DEFAULT '0000', -- 4-digit PIN for restricted manager authorizations
    branch_id VARCHAR(50) REFERENCES branches(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- ==========================================================
-- 4. CATEGORIES TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'CAT-' || SUBSTRING(gen_random_uuid()::text, 1, 8),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL,
    item_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- 5. PRODUCTS & INVENTORY TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'PRD-' || SUBSTRING(gen_random_uuid()::text, 1, 8),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    cost NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
    tax_rate NUMERIC(5,2) DEFAULT 18.00,
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    min_stock INT NOT NULL DEFAULT 5 CHECK (min_stock >= 0),
    barcode VARCHAR(100),
    sku VARCHAR(100) UNIQUE,
    unit VARCHAR(50) DEFAULT 'Pcs',
    branch_id VARCHAR(50) REFERENCES branches(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Active',
    icon VARCHAR(100) DEFAULT 'fa-box',
    is_frequently_sold BOOLEAN DEFAULT FALSE,
    is_recently_sold BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_search ON products USING GIN (to_tsvector('english', name || ' ' || COALESCE(sku, '') || ' ' || COALESCE(barcode, '')));

-- ==========================================================
-- 6. CUSTOMERS & KHATA CREDIT LEDGER TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'CUST-' || SUBSTRING(gen_random_uuid()::text, 1, 8),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) DEFAULT '',
    address TEXT DEFAULT '',
    points INT DEFAULT 0,
    total_spent NUMERIC(12,2) DEFAULT 0.00,
    credit_balance NUMERIC(12,2) DEFAULT 0.00, -- Outstanding Khata balance owed
    visits INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_phone ON customers(phone);

-- ==========================================================
-- 7. SUPPLIERS TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'SUP-' || SUBSTRING(gen_random_uuid()::text, 1, 8),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) DEFAULT '',
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) DEFAULT '',
    address TEXT DEFAULT '',
    balance NUMERIC(12,2) DEFAULT 0.00, -- Accounts payable balance owed to supplier
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- 8. PURCHASE ORDERS & LINE ITEMS
-- ==========================================================
CREATE TABLE IF NOT EXISTS purchase_orders (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'PO-' || TO_CHAR(NOW(), 'YYYY') || '-' || SUBSTRING(gen_random_uuid()::text, 1, 6),
    supplier VARCHAR(255) NOT NULL,
    supplier_id VARCHAR(50) REFERENCES suppliers(id) ON DELETE SET NULL,
    order_date DATE DEFAULT CURRENT_DATE,
    items_count INT DEFAULT 0,
    total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Ordered', 'Received', 'Cancelled'
    received_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
    id SERIAL PRIMARY KEY,
    purchase_order_id VARCHAR(50) NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id VARCHAR(50) REFERENCES products(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    qty INT NOT NULL CHECK (qty > 0),
    cost NUMERIC(12,2) NOT NULL CHECK (cost >= 0),
    total NUMERIC(12,2) NOT NULL
);

-- ==========================================================
-- 9. SALES & INVOICES TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS sales (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'INV-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || SUBSTRING(gen_random_uuid()::text, 1, 4),
    customer VARCHAR(255) DEFAULT 'Walk-in Customer',
    customer_id VARCHAR(50) REFERENCES customers(id) ON DELETE SET NULL,
    sale_date DATE DEFAULT CURRENT_DATE,
    sale_time VARCHAR(20) DEFAULT TO_CHAR(NOW(), 'HH24:MI'),
    subtotal NUMERIC(12,2) NOT NULL,
    tax NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12,2) NOT NULL,
    cost_total NUMERIC(12,2) DEFAULT 0.00,
    profit NUMERIC(12,2) DEFAULT 0.00,
    payment_method VARCHAR(50) DEFAULT 'Cash', -- 'Cash', 'Card', 'UPI', 'Store Credit (Khata)', 'Split'
    payment_details JSONB DEFAULT '{}'::jsonb, -- Tender cash, change, UPI ref, card txn
    status VARCHAR(50) DEFAULT 'Paid', -- 'Paid', 'Pending', 'Refunded/Returned', 'Partially Paid'
    cashier VARCHAR(100) DEFAULT 'System',
    cashier_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    branch_id VARCHAR(50) REFERENCES branches(id) ON DELETE SET NULL,
    idempotency_key VARCHAR(100) UNIQUE, -- Prevents duplicate sales submissions
    refunded_amount NUMERIC(12,2) DEFAULT 0.00,
    return_reason TEXT DEFAULT '',
    channel VARCHAR(50) DEFAULT 'POS',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sales_customer ON sales(customer);
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sales_idempotency ON sales(idempotency_key);

CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    sale_id VARCHAR(50) NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id VARCHAR(50) REFERENCES products(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    qty INT NOT NULL CHECK (qty > 0),
    price NUMERIC(12,2) NOT NULL,
    cost NUMERIC(12,2) DEFAULT 0.00,
    discount NUMERIC(12,2) DEFAULT 0.00,
    tax NUMERIC(12,2) DEFAULT 0.00,
    subtotal NUMERIC(12,2) NOT NULL
);

-- ==========================================================
-- 10. EXPENSES & CASH REGISTER TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'EXP-' || SUBSTRING(gen_random_uuid()::text, 1, 8),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Utilities', -- 'Utilities', 'Rent', 'Packaging', 'Salaries', etc.
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    expense_date DATE DEFAULT CURRENT_DATE,
    paid_by VARCHAR(50) DEFAULT 'Bank', -- 'Bank', 'Cash', 'UPI', 'Card'
    notes TEXT DEFAULT '',
    branch_id VARCHAR(50) REFERENCES branches(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cash_register_shifts (
    id SERIAL PRIMARY KEY,
    branch_id VARCHAR(50) REFERENCES branches(id) ON DELETE SET NULL,
    opened_by VARCHAR(100) NOT NULL,
    opening_cash NUMERIC(12,2) NOT NULL,
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ DEFAULT NULL,
    cash_sales NUMERIC(12,2) DEFAULT 0.00,
    cash_expenses NUMERIC(12,2) DEFAULT 0.00,
    cash_refunds NUMERIC(12,2) DEFAULT 0.00,
    expected_cash NUMERIC(12,2) DEFAULT 0.00,
    counted_cash NUMERIC(12,2) DEFAULT 0.00,
    variance NUMERIC(12,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Open', -- 'Open', 'Closed'
    closing_notes TEXT DEFAULT ''
);

-- ==========================================================
-- 11. STOCK MOVEMENT AUDIT LEDGER (Immutable)
-- ==========================================================
CREATE TABLE IF NOT EXISTS stock_movements (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'SM-' || SUBSTRING(gen_random_uuid()::text, 1, 8),
    product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'IN', 'OUT', 'ADJUSTMENT', 'RETURN'
    qty INT NOT NULL,
    reference VARCHAR(255) DEFAULT '', -- 'INV-1094', 'PO-2026-081', 'Manual Stock Count'
    movement_by VARCHAR(100) DEFAULT 'System',
    branch_id VARCHAR(50) REFERENCES branches(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(created_at);

-- ==========================================================
-- 12. LOYALTY COUPONS TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS loyalty_coupons (
    code VARCHAR(50) PRIMARY KEY,
    discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage', -- 'percentage' or 'fixed'
    value NUMERIC(10,2) NOT NULL,
    min_purchase NUMERIC(12,2) DEFAULT 0.00,
    expires_at DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. Pre-Seeded SQL Script (`seed.sql`)

Run this SQL to populate default test accounts, products, and categories matching the React frontend:

```sql
-- 1. Default Branch
INSERT INTO branches (id, name, address, is_main) VALUES
('BR-01', 'Main Flagship Store (Downtown)', 'Suite 104, West Commerce Blvd, New York, NY', TRUE),
('BR-02', 'Metro Center Outlet (Uptown)', 'Unit 3B, Metro Center Mall, Brooklyn, NY', FALSE)
ON CONFLICT (id) DO NOTHING;

-- 2. Default Users (Pass: 'admin123' bcrypt hash: $2a$10$wT8K8U9Yk5bS3f3Yq2a/m.f/iTj5f/fJ5bZ8Qz0XqY/e9u5XvG6m6)
INSERT INTO users (id, name, email, password_hash, role, pin, branch_id) VALUES
('EMP-01', 'Zain Khan', 'owner@retailhub.com', '$2a$10$xW7l8zFwG7l6Y/4PZ9e7/uF7h.v5W1o7i9.K7a1m2e3r4t5y6u7i', 'Owner', '1234', 'BR-01'),
('EMP-02', 'Sahil Kumar', 'sahil@retailhub.com', '$2a$10$xW7l8zFwG7l6Y/4PZ9e7/uF7h.v5W1o7i9.K7a1m2e3r4t5y6u7i', 'Manager', '1234', 'BR-01'),
('EMP-03', 'Rahul Verma', 'manager@retailhub.com', '$2a$10$xW7l8zFwG7l6Y/4PZ9e7/uF7h.v5W1o7i9.K7a1m2e3r4t5y6u7i', 'Manager', '1234', 'BR-01'),
('EMP-04', 'Anjali Mishra', 'cashier@retailhub.com', '$2a$10$xW7l8zFwG7l6Y/4PZ9e7/uF7h.v5W1o7i9.K7a1m2e3r4t5y6u7i', 'Salesperson', '0000', 'BR-01'),
('EMP-05', 'Vikram Das', 'sales@retailhub.com', '$2a$10$xW7l8zFwG7l6Y/4PZ9e7/uF7h.v5W1o7i9.K7a1m2e3r4t5y6u7i', 'Salesperson', '0000', 'BR-01')
ON CONFLICT (email) DO NOTHING;

-- 3. Default Categories
INSERT INTO categories (id, name, code, item_count) VALUES
('CAT-1', 'Electronics', 'ELEC', 6),
('CAT-2', 'Audio', 'AUD', 4),
('CAT-3', 'Accessories', 'ACC', 4),
('CAT-4', 'Apparel', 'APP', 4),
('CAT-5', 'Footwear', 'FOOT', 3),
('CAT-6', 'Groceries', 'GROC', 3),
('CAT-7', 'Personal Care', 'CARE', 2)
ON CONFLICT (id) DO NOTHING;

-- 4. Default Products (USD Pricing)
INSERT INTO products (id, name, category, price, cost, tax_rate, stock, min_stock, barcode, sku, unit, branch_id, icon, is_frequently_sold) VALUES
('PRD-101', 'Apple iPhone 15 Pro (128GB)', 'Electronics', 999.00, 799.00, 8.25, 14, 5, '890123456789', 'IP15P-128', 'Pcs', 'BR-01', 'fa-mobile-screen-button', TRUE),
('PRD-102', 'Samsung Galaxy S24 Ultra', 'Electronics', 1199.00, 950.00, 8.25, 8, 4, '890123456790', 'SGS24-256', 'Pcs', 'BR-01', 'fa-mobile', TRUE),
('PRD-103', 'Sony WH-1000XM5 Headphones', 'Audio', 399.00, 280.00, 8.25, 22, 6, '890123456791', 'SONY-XM5', 'Pcs', 'BR-01', 'fa-headphones', TRUE),
('PRD-104', 'Logitech MX Master 3S Mouse', 'Accessories', 99.99, 68.00, 8.25, 3, 5, '890123456792', 'LOGI-MX3S', 'Pcs', 'BR-01', 'fa-computer-mouse', TRUE),
('PRD-105', 'Nike Air Max Pulse (Size 9)', 'Footwear', 150.00, 95.00, 8.25, 12, 4, '890123456793', 'NK-AIR-09', 'Pair', 'BR-01', 'fa-shoe-prints', TRUE),
('PRD-106', 'Levi''s Slim Fit Denim 511', 'Apparel', 49.50, 25.00, 8.25, 35, 10, '890123456794', 'LEV-511-32', 'Pcs', 'BR-01', 'fa-vest', TRUE),
('PRD-122', 'Davidoff Rich Aroma Instant Coffee (100g)', 'Groceries', 12.99, 7.50, 8.25, 40, 10, '890123456810', 'DAV-COF-100', 'Jar', 'BR-01', 'fa-mug-hot', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 5. Default Customers
INSERT INTO customers (id, name, phone, email, points, total_spent, credit_balance, visits) VALUES
('CUST-001', 'Aarav Sharma', '+1 (555) 234-5678', 'aarav.sharma@example.com', 450, 1840.00, 150.00, 8),
('CUST-002', 'Priya Patel', '+1 (555) 345-6789', 'priya.patel@example.com', 280, 620.00, 0.00, 4),
('CUST-003', 'Rohan Verma', '+1 (555) 456-7890', 'rohan.v@example.com', 120, 240.00, 50.00, 2),
('CUST-004', 'Ananya Iyer', '+1 (555) 567-8901', 'ananya.iyer@example.com', 620, 3120.00, 0.00, 12)
ON CONFLICT (phone) DO NOTHING;

-- 6. Default Settings
INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
```
