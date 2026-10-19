# RetailHub - Setup & Execution Guide

This guide details how to launch and operate the RetailHub SaaS platform on **Windows PowerShell**.

---

## Prerequisites
- **Node.js**: v18.0.0 or higher (Current environment: Node v22.14.0)
- **Web Browser**: Google Chrome, Microsoft Edge, or Firefox
- **Optional**: MongoDB (RetailHub features a resilient in-memory storage fallback when running without MongoDB)

---

## 1. Starting the Express Backend Server

Open Windows PowerShell and navigate to the `backend/` directory:

```powershell
# Navigate to backend
cd backend

# Install dependencies (already installed)
npm install

# Run automated verification tests
npm test

# Start the API server on port 5000
npm start
```

You should see:
```text
==================================================
  RetailHub Backend API is live on port 5000
  Health: http://localhost:5000/
  API v1: http://localhost:5000/api/v1
  State:  Resilient In-Memory + MongoDB Ready Store
==================================================
```

---

## 2. Launching the Frontend Application

RetailHub frontend uses **pure HTML5, CSS3, and Vanilla JavaScript** (no build tools, Vite, or Webpack required).

### Option A: Using Node's Built-in http-server or npx serve (Recommended)
Open a new PowerShell terminal window:

```powershell
# Navigate to frontend
cd frontend

# Launch lightweight static server
npx serve -l 3000
```
Then open your browser at:
👉 **`http://localhost:3000/`** or **`http://localhost:3000/pos.html`**

### Option B: Using Python's Built-in HTTP Server
```powershell
cd frontend
python -m http.server 3000
```

### Option C: Direct File Access
You can also open `frontend/index.html` or `frontend/pos.html` directly in any web browser. RetailHub's resilient client layer will run smoothly with local storage and auto-detect backend connectivity.

---

## 3. Demo Credentials & Role Access

| Role | Email | Password | Manager PIN | Access Scope |
|---|---|---|---|---|
| **Owner** | `owner@retailhub.com` | `admin123` | `1234` | Full root access (All dashboards, store settings, staff management, financial reports, POS) |
| **Manager** | `manager@retailhub.com` | `admin123` | `1234` | Management access (Dashboard, catalog, stock adjustments, purchases, staff management, POS approvals) |
| **Manager (Alt)** | `sahil@retailhub.com` | `admin123` | `1234` | Store Manager account |
| **Salesperson** | `cashier@retailhub.com` | `admin123` | N/A | POS checkout, barcode scanning, receipts, customer lookup, own sales history |
| **Salesperson (Alt)** | `sales@retailhub.com` | `admin123` | N/A | POS fast checkout terminal |

### RBAC Security Enforcement
- **Salesperson Route Guarding**: Salespeople trying to access `/index.html`, `/reports.html`, `/staff.html`, `/inventory.html`, or financial settings are automatically redirected to `/pos.html` with an access restriction notice.
- **Manager Approval**: Salespeople applying discounts > 15% or clearing active carts must have an authorized Manager enter their PIN (`1234`).
- **Staff Control**: Only Managers and Owners can create or deactivate staff accounts. Managers can only create Salespeople. Deactivated accounts are rejected at login with HTTP 403.

---

## 4. Key Feature Quick Links

| Module | URL Path | Key Capabilities |
|---|---|---|
| **Executive Dashboard** | `/index.html` | Real-time KPIs, sales charts, gross vs net profit |
| **POS Terminal** | `/pos.html` | Barcode scanning, fast cart, cash tender, split pay, thermal & A4 print |
| **Product Catalog** | `/products.html` | 26 items across 7 departments, stock alerts, SKU/barcode lookup |
| **Inventory & Ledger** | `/inventory.html` | Stock movements audit trail, adjustments, CSV import/export |
| **Customers & Khata** | `/customers.html` | Customer CRM, Khata credit balances, WhatsApp reminders |
| **Sales History & Returns** | `/sales.html`, `/returns.html` | Invoice lookup, returns linked to original sale, automatic restocking |
| **Purchase Orders** | `/purchases.html` | Supplier orders, confirmed receipt inventory updates |
| **Expenses & Register** | `/expenses.html` | Shift cash reconciliation, expected vs counted variance |
| **AI Insights** | `/ai-insights.html` | AI Copilot chat, 7-day demand forecasting, smart reorder drafter |
| **Online Storefront** | `/storefront.html` | Public product catalog, shopping cart, online order placement |

---

## 5. POS Terminal Keyboard Shortcuts

- **`F1`** or **`/`**: Focus product search / barcode entry
- **`F2`**: Focus customer selector dropdown
- **`F4`**: Focus promo code / coupon input
- **`F8`**: Hold current sale for later resume
- **`F9`**: Focus cash received tender input
- **`F10`**: Complete checkout and print bill
- **`Escape`**: Dismiss active modal / clear search
