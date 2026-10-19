# RetailHub — Enterprise Retail Management SaaS Platform

RetailHub is a modern, production-oriented retail management and Point of Sale (POS) SaaS platform designed for high-velocity retail operations. It features clean separation of responsibilities between a client-side frontend (`frontend/`) and a Node.js/Express REST backend (`backend/`).

---

## 🎨 Visual Identity & Design Preservation
- **Strict Theme Preservation**: Preserves the original **Classic Navy Sidebar** (`#0f172a`), **Royal Blue Accents** (`#2563eb`), clean white card surfaces (`#ffffff`), and subtle SaaS shadows.
- **Pure Web Stack**: Frontend is constructed using **only standard HTML5, CSS3, and Vanilla JavaScript** (Zero React, Vue, Angular, or Vite).
- **Responsive Layout**: Designed for desktop terminals, tablets, and mobile cashiers.

---

## ⚡ POS Terminal Features (`/pos.html`)
- **Fast Product Selection**: Responsive grid displaying 26+ products across 7 departments (Electronics, Audio, Accessories, Apparel, Footwear, Groceries, Personal Care) with SKUs, barcodes, images/icons, selling prices, and real-time stock levels.
- **Hardware USB Barcode Scanner Integration**: Global listener buffers rapid keystrokes from USB barcode scanners (< 50ms) and automatically adds scanned items to cart on `Enter`. Alerts for unknown barcodes.
- **Quick-Picks Bar**: 1-click quick add chips for frequently and recently sold inventory.
- **Advanced Shopping Cart**:
  - Direct editable quantity inputs (`<input type="number">`) with `+` / `-` controls.
  - Item-level discounts (in ₹) and optional item notes (e.g. Serial # / IMEI / instructions).
  - Accurate line-item and order calculations: Subtotal, GST (18%), discounts, grand total.
  - Cart item and total units counter (e.g. `3 items · 5 units`).
  - Clear cart with safety confirmation dialog (`confirmAction`).
- **Hold & Resume Sales**: Pauses transactions into saved carts with customer names and timestamps; prevents accidental cart loss.
- **Customer CRM & Khata**:
  - Walk-in default or registered customer selection.
  - Real-time Khata credit balance and due notifications.
  - Customer loyalty points redemption directly into discounts.
  - **Inline Customer Registration Modal**: Add new customers directly from POS without navigating away.
- **Payment Modes**:
  - Cash, Debit/Credit Card, UPI, Store Credit (Khata), and Split Payment.
  - **Live Cash Tender & Change Due Calculator**: Real-time change return display with quick denomination chips (`Exact`, `+₹500`, `+₹2000`).
  - **Split Payment Allocation**: Configure split payments between cash and digital methods with automatic balance validation.
- **Dual Invoice & Receipt Printing**:
  - **Thermal 80mm POS Receipt**: Compact monospace receipt with shop details, GSTIN, itemized breakdown, and paid stamp.
  - **Standard A4 GST Tax Invoice**: Full-width professional invoice with seller/buyer GSTIN details, tax breakdown, and signature block.
  - Native print triggers (`window.print()`) configured with print CSS media queries.
- **Keyboard Shortcuts**:
  - `F1` or `/`: Focus search / barcode entry
  - `F2`: Select / Change customer
  - `F4`: Apply coupon or promo code
  - `F8`: Hold sale
  - `F9`: Focus cash received tender
  - `F10`: Complete checkout and bill
  - `Escape`: Dismiss active modal or clear search

---

## 📦 Core Management Modules
1. **Executive Dashboard (`index.html`)**: Real-time sales revenue, gross vs. net profit, orders count, expenses, and low-stock alerts.
2. **Product Catalog (`products.html`)**: 26 pre-seeded products across 7 departments, duplicate SKU/barcode validation, and profit margin calculators.
3. **Categories (`categories.html`)**: Department management.
4. **Inventory & Stock Movement Ledger (`inventory.html`)**: Stock levels, audit adjustments, CSV import/export, and complete `"IN"` / `"OUT"` ledger.
5. **Purchase Orders (`purchases.html`)**: Supplier POs with confirmed receipt guaranteeing inventory only updates upon verified delivery.
6. **Suppliers Directory (`suppliers.html`)**: Supplier balances, contact details, and payables tracking.
7. **Customer CRM & Khata (`customers.html`)**: Purchase histories, credit ledger settlements, and WhatsApp reminder link integration.
8. **Sales History & Returns (`sales.html`, `returns.html`)**: Filterable sale records, invoice lookups, and returns linked to original sales with auto-restocking.
9. **Invoices (`invoices.html`)**: GST-compliant invoices with reprint support.
10. **Reports & Closing (`reports.html`)**: Date-range filtering, Gross vs. Net profit, COGS, payables, and receivables.
11. **Expenses & Cash Register (`expenses.html`)**: Shift reconciliation, opening cash, expected cash, counted cash, and variance.
12. **Staff & Shifts (`staff.html`)**: Role-based access control (`Owner`, `Manager`, `Cashier`).
13. **Store Settings (`settings.html`)**: Shop profile, tax rates, invoice templates, and backup.
14. **AI Insights (`ai-insights.html`)**: Interactive AI Business Assistant copilot chat, 7-day demand forecasting, smart reorder drafter with human confirmation, slow-moving stock optimizer, and low-margin warnings.
15. **Online Public Storefront (`storefront.html`)**: Public product catalog, shopping cart, and secure online order checkout synchronized with POS inventory.
16. **Multi-Branch Ready (`branches.html`)**: Store-scoping and inter-branch inventory transfers.
17. **Loyalty & Coupons (`loyalty.html`)**: Promo campaign publisher and customer reward tiers.

---

## 🤝 Team Collaboration & Architecture Division

RetailHub is engineered with strict separation of concerns for collaborative development:
- **Frontend Lead**: Owns `frontend/` (Pure HTML5, CSS3, Vanilla JavaScript, zero build dependencies). Includes offline sync engine and MongoDB ObjectId compatibility.
- **Backend Lead**: Owns `backend/` (Node.js, Express.js, Mongoose ODM, and MongoDB database).
- **Database**: MongoDB (Local `mongodb://127.0.0.1:27017/retailhub` or MongoDB Atlas).

---

## 🚀 Running RetailHub

### 1. Launch Frontend (Works Standalone & Live)
The frontend works immediately in any browser using its built-in offline sync engine:
```powershell
cd frontend
npx serve -l 3000
```
Open **`http://localhost:3000/login.html`** or **`http://localhost:3000/pos.html`**.

Demo credentials:
- **Manager**: `manager@retailhub.com` / `admin123` (PIN: `1234`)
- **Salesperson**: `cashier@retailhub.com` / `admin123` (PIN: `0000`)
- **Owner**: `owner@retailhub.com` / `admin123` (PIN: `1234`)

### 2. Backend Partner Setup (Express & MongoDB)
See [backend/README.md](file:///c:/Users/zainu/Desktop/RetailHub/backend/README.md) and [docs/MONGODB_SCHEMA.md](file:///c:/Users/zainu/Desktop/RetailHub/docs/MONGODB_SCHEMA.md):
```powershell
cd backend
npm install
npm run dev
```

---

## 📄 Documentation & Contracts
- **[docs/MONGODB_SCHEMA.md](file:///c:/Users/zainu/Desktop/RetailHub/docs/MONGODB_SCHEMA.md)**: 10 complete Mongoose models, indexes, and database seed script.
- **[docs/API_CONTRACT.md](file:///c:/Users/zainu/Desktop/RetailHub/docs/API_CONTRACT.md)**: REST API contract, request/response envelopes, and status codes.
- **[backend/README.md](file:///c:/Users/zainu/Desktop/RetailHub/backend/README.md)**: Backend developer onboarding and environment guide.

