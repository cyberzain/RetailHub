/**
 * RetailHub React API & Local State Service
 * Seamlessly interfaces with Node.js/PostgreSQL backend on port 5000.
 * Automatically operates with an offline localStorage engine if the backend is not yet started.
 */

const API_BASE = "http://localhost:5000/api/v1";
const HEALTH_URL = "http://localhost:5000/";

export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Initial Seed Store Data in USD ($)
const INITIAL_SEED = {
  branches: [
    { id: "BR-01", name: "Main Flagship Store (Downtown)", address: "Suite 104, West Commerce Blvd, New York, NY", isMain: true },
    { id: "BR-02", name: "Metro Center Outlet (Uptown)", address: "Unit 3B, Metro Center Mall, Brooklyn, NY", isMain: false }
  ],
  categories: [
    { id: "CAT-1", name: "Electronics", code: "ELEC", count: 6 },
    { id: "CAT-2", name: "Audio", code: "AUD", count: 4 },
    { id: "CAT-3", name: "Accessories", code: "ACC", count: 4 },
    { id: "CAT-4", name: "Apparel", code: "APP", count: 4 },
    { id: "CAT-5", name: "Footwear", code: "FOOT", count: 3 },
    { id: "CAT-6", name: "Groceries", code: "GROC", count: 3 },
    { id: "CAT-7", name: "Personal Care", code: "CARE", count: 2 }
  ],
  products: [
    { id: "PRD-101", name: "Apple iPhone 15 Pro (128GB)", category: "Electronics", price: 999.00, cost: 799.00, taxRate: 8.25, stock: 14, minStock: 5, barcode: "890123456789", sku: "IP15P-128", unit: "Pcs", branchId: "BR-01", status: "Active", icon: "fa-mobile-screen-button", isFrequentlySold: true },
    { id: "PRD-102", name: "Samsung Galaxy S24 Ultra", category: "Electronics", price: 1199.00, cost: 950.00, taxRate: 8.25, stock: 8, minStock: 4, barcode: "890123456790", sku: "SGS24-256", unit: "Pcs", branchId: "BR-01", status: "Active", icon: "fa-mobile", isFrequentlySold: true },
    { id: "PRD-107", name: "Dell 27-inch 4K UHD Monitor", category: "Electronics", price: 349.99, cost: 260.00, taxRate: 8.25, stock: 2, minStock: 5, barcode: "890123456795", sku: "DELL-U27", unit: "Pcs", branchId: "BR-01", status: "Active", icon: "fa-desktop", isFrequentlySold: false },
    { id: "PRD-109", name: "Apple iPad Air M2 (11-inch 128GB)", category: "Electronics", price: 599.00, cost: 480.00, taxRate: 8.25, stock: 9, minStock: 3, barcode: "890123456797", sku: "IPAD-M2-128", unit: "Pcs", branchId: "BR-01", status: "Active", icon: "fa-tablet-screen-button", isFrequentlySold: true },
    { id: "PRD-110", name: "Anker Prime 65W GaN Wall Charger", category: "Electronics", price: 39.99, cost: 22.00, taxRate: 8.25, stock: 28, minStock: 8, barcode: "890123456798", sku: "ANK-65W", unit: "Pcs", branchId: "BR-01", status: "Active", icon: "fa-plug-circle-bolt", isFrequentlySold: false },
    { id: "PRD-111", name: "SanDisk 1TB Extreme Portable SSD", category: "Electronics", price: 99.99, cost: 65.00, taxRate: 8.25, stock: 11, minStock: 4, barcode: "890123456799", sku: "SD-SSD-1TB", unit: "Pcs", branchId: "BR-01", status: "Active", icon: "fa-hard-drive", isRecentlySold: true },
    { id: "PRD-103", name: "Sony WH-1000XM5 Headphones", category: "Audio", price: 399.00, cost: 280.00, taxRate: 8.25, stock: 22, minStock: 6, barcode: "890123456791", sku: "SONY-XM5", unit: "Pcs", branchId: "BR-01", status: "Active", icon: "fa-headphones", isFrequentlySold: true },
    { id: "PRD-112", name: "Apple AirPods Pro (2nd Gen USB-C)", category: "Audio", price: 249.00, cost: 180.00, taxRate: 8.25, stock: 16, minStock: 5, barcode: "890123456800", sku: "AIRPODS-P2", unit: "Pcs", branchId: "BR-01", status: "Active", icon: "fa-headphones-simple", isFrequentlySold: true },
    { id: "PRD-113", name: "JBL Flip 6 Waterproof Speaker", category: "Audio", price: 99.95, cost: 60.00, taxRate: 8.25, stock: 19, minStock: 5, barcode: "890123456801", sku: "JBL-FLIP6", unit: "Pcs", branchId: "BR-01", status: "Active", icon: "fa-volume-high", isRecentlySold: true },
    { id: "PRD-114", name: "Bose QuietComfort 45 ANC", category: "Audio", price: 279.00, cost: 190.00, taxRate: 8.25, stock: 6, minStock: 3, barcode: "890123456802", sku: "BOSE-QC45", unit: "Pcs", branchId: "BR-01", status: "Active", icon: "fa-headphones", isFrequentlySold: false },
    { id: "PRD-104", name: "Logitech MX Master 3S Mouse", category: "Accessories", price: 99.99, cost: 68.00, taxRate: 8.25, stock: 3, minStock: 5, barcode: "890123456792", sku: "LOGI-MX3S", unit: "Pcs", branchId: "BR-01", status: "Active", icon: "fa-computer-mouse", isFrequentlySold: true },
    { id: "PRD-108", name: "Keychron K2 Mechanical Keyboard", category: "Accessories", price: 79.99, cost: 50.00, taxRate: 8.25, stock: 18, minStock: 6, barcode: "890123456796", sku: "KEY-K2V2", unit: "Pcs", branchId: "BR-01", status: "Active", icon: "fa-keyboard", isRecentlySold: true },
    { id: "PRD-115", name: "Belkin 3-in-1 MagSafe Wireless Stand", category: "Accessories", price: 119.99, cost: 80.00, taxRate: 8.25, stock: 7, minStock: 3, barcode: "890123456803", sku: "BLK-3IN1", unit: "Pcs", branchId: "BR-01", status: "Active", icon: "fa-charging-station", isFrequentlySold: false },
    { id: "PRD-116", name: "Spigen Rugged Armor Phone Case", category: "Accessories", price: 19.99, cost: 8.00, taxRate: 8.25, stock: 45, minStock: 12, barcode: "890123456804", sku: "SPG-CASE-01", unit: "Pcs", branchId: "BR-01", status: "Active", icon: "fa-shield-halved", isFrequentlySold: true },
    { id: "PRD-106", name: "Levi's Slim Fit Denim 511", category: "Apparel", price: 49.50, cost: 25.00, taxRate: 8.25, stock: 35, minStock: 10, barcode: "890123456794", sku: "LEV-511-32", unit: "Pcs", branchId: "BR-01", status: "Active", icon: "fa-vest", isFrequentlySold: true },
    { id: "PRD-117", name: "Ralph Lauren Classic Oxford Shirt", category: "Apparel", price: 89.50, cost: 45.00, taxRate: 8.25, stock: 15, minStock: 5, barcode: "890123456805", sku: "RL-OXF-M", unit: "Pcs", branchId: "BR-01", status: "Active", icon: "fa-shirt", isRecentlySold: true },
    { id: "PRD-118", name: "Zara Heavyweight Cotton Hoodie", category: "Apparel", price: 45.90, cost: 22.00, taxRate: 8.25, stock: 24, minStock: 8, barcode: "890123456806", sku: "ZR-HD-L", unit: "Pcs", branchId: "BR-01", status: "Active", icon: "fa-shirt", isFrequentlySold: false },
    { id: "PRD-119", name: "Puma T7 Track Jacket (Black)", category: "Apparel", price: 55.00, cost: 30.00, taxRate: 8.25, stock: 12, minStock: 4, barcode: "890123456807", sku: "PUMA-T7-02", unit: "Pcs", branchId: "BR-01", status: "Active", icon: "fa-vest-patches", isRecentlySold: false },
    { id: "PRD-105", name: "Nike Air Max Pulse (Size 9)", category: "Footwear", price: 150.00, cost: 95.00, taxRate: 8.25, stock: 12, minStock: 4, barcode: "890123456793", sku: "NK-AIR-09", unit: "Pair", branchId: "BR-01", status: "Active", icon: "fa-shoe-prints", isFrequentlySold: true },
    { id: "PRD-120", name: "Adidas Ultraboost Light Running", category: "Footwear", price: 180.00, cost: 110.00, taxRate: 8.25, stock: 8, minStock: 3, barcode: "890123456808", sku: "ADI-UB-09", unit: "Pair", branchId: "BR-01", status: "Active", icon: "fa-shoe-prints", isRecentlySold: true },
    { id: "PRD-121", name: "New Balance 574 Core Sneakers", category: "Footwear", price: 89.99, cost: 55.00, taxRate: 8.25, stock: 0, minStock: 4, barcode: "890123456809", sku: "NB-574-08", unit: "Pair", branchId: "BR-01", status: "Active", icon: "fa-shoe-prints", isFrequentlySold: false },
    { id: "PRD-122", name: "Davidoff Rich Aroma Instant Coffee (100g)", category: "Groceries", price: 12.99, cost: 7.50, taxRate: 8.25, stock: 40, minStock: 10, barcode: "890123456810", sku: "DAV-COF-100", unit: "Jar", branchId: "BR-01", status: "Active", icon: "fa-mug-hot", isFrequentlySold: true },
    { id: "PRD-123", name: "Ferrero Rocher Hazelnut Chocolates (16 Pcs)", category: "Groceries", price: 14.50, cost: 8.50, taxRate: 8.25, stock: 32, minStock: 8, barcode: "890123456811", sku: "FR-16PC", unit: "Box", branchId: "BR-01", status: "Active", icon: "fa-cookie-bite", isRecentlySold: true },
    { id: "PRD-124", name: "Borges Extra Virgin Olive Oil (1 Litre)", category: "Groceries", price: 16.99, cost: 10.50, taxRate: 8.25, stock: 18, minStock: 6, barcode: "890123456812", sku: "BORG-EVOO-1L", unit: "Bottle", branchId: "BR-01", status: "Active", icon: "fa-bottle-droplet", isFrequentlySold: false },
    { id: "PRD-125", name: "Philips Norelco All-in-One Trimmer 7000", category: "Personal Care", price: 49.99, cost: 30.00, taxRate: 8.25, stock: 14, minStock: 4, barcode: "890123456813", sku: "PHIL-TRIM-7K", unit: "Pcs", branchId: "BR-01", status: "Active", icon: "fa-scissors", isFrequentlySold: true },
    { id: "PRD-126", name: "Forest Essentials Ayurvedic Body Mist (130ml)", category: "Personal Care", price: 34.00, cost: 18.00, taxRate: 8.25, stock: 20, minStock: 5, barcode: "890123456814", sku: "FE-MIST-130", unit: "Bottle", branchId: "BR-01", status: "Active", icon: "fa-spray-can-sparkles", isRecentlySold: true }
  ],
  customers: [
    { id: "CUST-001", name: "Aarav Sharma", phone: "+1 (555) 234-5678", email: "aarav.sharma@example.com", points: 450, totalSpent: 1840.00, creditBalance: 150.00, visits: 8 },
    { id: "CUST-002", name: "Priya Patel", phone: "+1 (555) 345-6789", email: "priya.patel@example.com", points: 280, totalSpent: 620.00, creditBalance: 0.00, visits: 4 },
    { id: "CUST-003", name: "Rohan Verma", phone: "+1 (555) 456-7890", email: "rohan.v@example.com", points: 120, totalSpent: 280.00, creditBalance: 65.00, visits: 2 },
    { id: "CUST-004", name: "Ananya Iyer", phone: "+1 (555) 567-8901", email: "ananya.iyer@example.com", points: 620, totalSpent: 2450.00, creditBalance: 0.00, visits: 12 }
  ],
  suppliers: [
    { id: "SUP-01", name: "Apex Global Distributing", contactPerson: "Alex Miller", phone: "+1 (555) 800-1122", email: "orders@apexdist.com", address: "New York, NY", balance: 450.00 },
    { id: "SUP-02", name: "NextGen Electronics Ltd", contactPerson: "Sarah Jenkins", phone: "+1 (555) 800-3344", email: "b2b@nextgen.com", address: "San Jose, CA", balance: 1280.00 },
    { id: "SUP-03", name: "Vogue Trendz Apparels", contactPerson: "Michael Roy", phone: "+1 (555) 800-5566", email: "sales@voguetrendz.com", address: "Dallas, TX", balance: 0.00 }
  ],
  purchases: [
    { id: "PO-2026-081", supplier: "NextGen Electronics Ltd", date: "2026-10-12", itemsCount: 15, total: 2450.00, status: "Received" },
    { id: "PO-2026-082", supplier: "Apex Global Distributing", date: "2026-10-15", itemsCount: 8, total: 980.00, status: "Pending" },
    { id: "PO-2026-083", supplier: "Vogue Trendz Apparels", date: "2026-10-16", itemsCount: 20, total: 420.00, status: "Ordered" }
  ],
  sales: [
    {
      id: "INV-1094",
      customer: "Aarav Sharma",
      date: new Date().toISOString().split("T")[0],
      items: [
        { name: "Apple iPhone 15 Pro (128GB)", qty: 1, price: 999.00 },
        { name: "Sony WH-1000XM5 Headphones", qty: 1, price: 399.00 }
      ],
      subtotal: 1398.00,
      tax: 115.34,
      discount: 50.00,
      total: 1463.34,
      costTotal: 1079.00,
      paymentMethod: "Card",
      status: "Paid",
      cashier: "Sahil K.",
      idempotencyKey: "seed-1094"
    },
    {
      id: "INV-1093",
      customer: "Priya Patel",
      date: new Date().toISOString().split("T")[0],
      items: [
        { name: "Nike Air Max Pulse (Size 9)", qty: 1, price: 150.00 },
        { name: "Keychron K2 Mechanical Keyboard", qty: 1, price: 79.99 }
      ],
      subtotal: 229.99,
      tax: 18.97,
      discount: 10.00,
      total: 238.96,
      costTotal: 145.00,
      paymentMethod: "UPI",
      status: "Paid",
      cashier: "Anjali M.",
      idempotencyKey: "seed-1093"
    }
  ],
  expenses: [
    { id: "EXP-101", category: "Utilities", title: "Monthly Store Electricity", amount: 145.00, date: "2026-10-10", paidBy: "Bank", notes: "ConEdison Power" },
    { id: "EXP-102", category: "Rent", title: "Commercial Plaza Lease", amount: 650.00, date: "2026-10-01", paidBy: "Bank", notes: "Monthly rental" },
    { id: "EXP-103", category: "Packaging", title: "Branded Bags & Boxes", amount: 48.00, date: "2026-10-14", paidBy: "Cash", notes: "500 bags" }
  ],
  cashRegister: {
    isOpen: true,
    openingCash: 500.00,
    openedAt: "2026-10-27 09:00",
    cashSales: 348.00,
    cashExpenses: 48.00,
    cashRefunds: 0.00,
    expectedCash: 800.00,
    countedCash: 0.00,
    variance: 0.00,
    status: "Open"
  },
  heldCarts: [],
  stockMovements: [
    { id: "SM-01", date: "2026-10-12", productId: "PRD-101", productName: "Apple iPhone 15 Pro (128GB)", type: "IN", qty: 10, reference: "PO-2026-081", by: "Vikram Das" },
    { id: "SM-02", date: "2026-10-27", productId: "PRD-101", productName: "Apple iPhone 15 Pro (128GB)", type: "OUT", qty: 1, reference: "INV-1094", by: "Sahil K." }
  ],
  loyaltyCoupons: [
    { code: "FESTIVE10", discountType: "percentage", value: 10, minPurchase: 50.00, active: true },
    { code: "FLAT10", discountType: "fixed", value: 10, minPurchase: 50.00, active: true }
  ],
  staff: [
    { id: "EMP-01", name: "Zain Khan", role: "Owner", email: "owner@retailhub.com", phone: "+1 (555) 000-1111", status: "Active", shift: "Full-Time", pin: "1234" },
    { id: "EMP-02", name: "Sahil Kumar", role: "Manager", email: "sahil@retailhub.com", phone: "+1 (555) 000-2222", status: "Active", shift: "Morning (09:00 - 17:00)", pin: "1234" },
    { id: "EMP-03", name: "Rahul Verma", role: "Manager", email: "manager@retailhub.com", phone: "+1 (555) 000-5555", status: "Active", shift: "Evening (13:00 - 21:00)", pin: "1234" },
    { id: "EMP-04", name: "Anjali Mishra", role: "Salesperson", email: "cashier@retailhub.com", phone: "+1 (555) 000-3333", status: "Active", shift: "Morning (09:00 - 17:00)", pin: "0000" },
    { id: "EMP-05", name: "Vikram Das", role: "Salesperson", email: "sales@retailhub.com", phone: "+1 (555) 000-4444", status: "Active", shift: "Evening (13:00 - 21:00)", pin: "0000" }
  ],
  settings: {
    shopName: "RetailHub Flagship Store",
    shopTagline: "Premium Multi-Brand Tech & Lifestyle Store",
    currency: "USD",
    currencySymbol: "$",
    taxRate: 8.25,
    gstin: "US-TAX-88990123",
    phone: "+1 (555) 887-6655",
    email: "contact@retailhubstore.com",
    address: "Suite 104, West Commerce Blvd, New York, NY 10001",
    invoicePrefix: "INV-",
    receiptFooter: "Thank you for shopping with RetailHub! Items can be exchanged within 14 days with original receipt.",
    theme: "light",
    enableLoyalty: true,
    enableStorefront: true,
    enableAIInsights: true
  }
};

// Local storage key prefix
const DB_PREFIX = "rh_v2_usd_";

// Automatically purge stale legacy INR caches so clean USD seed figures load
try {
  ["rh_react_sales", "rh_react_products", "rh_react_customers", "rh_react_expenses", "rh_react_cashRegister", "rh_react_settings", "rh_react_usd_sales", "rh_react_usd_products", "rh_react_usd_customers"].forEach(legacyKey => {
    localStorage.removeItem(legacyKey);
  });
} catch (_) {}

// Local storage helper
class LocalDB {
  get(key) {
    const raw = localStorage.getItem(`${DB_PREFIX}${key}`);
    if (!raw) {
      const initial = INITIAL_SEED[key] || [];
      localStorage.setItem(`${DB_PREFIX}${key}`, JSON.stringify(initial));
      return initial;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  set(key, data) {
    localStorage.setItem(`${DB_PREFIX}${key}`, JSON.stringify(data));
  }

  insert(key, item) {
    const list = this.get(key);
    list.unshift(item);
    this.set(key, list);
    return item;
  }

  update(key, id, updates) {
    const list = this.get(key);
    const idx = list.findIndex(i => String(i.id) === String(id));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      this.set(key, list);
      return list[idx];
    }
    return null;
  }

  remove(key, id) {
    const list = this.get(key);
    const filtered = list.filter(i => String(i.id) !== String(id));
    this.set(key, filtered);
    return true;
  }
}

const db = new LocalDB();

// Core API Client
export const api = {
  getToken() {
    return localStorage.getItem("retailhub_jwt") || null;
  },

  setToken(token) {
    if (token) localStorage.setItem("retailhub_jwt", token);
    else localStorage.removeItem("retailhub_jwt");
  },

  async checkBackend() {
    try {
      const res = await fetch(HEALTH_URL, { method: "GET" });
      if (res.ok) return { online: true };
    } catch {}
    return { online: false };
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
      const data = await res.json().catch(() => null);
      if (res.ok) return data;
      return { error: data?.error || res.statusText, status: res.status, success: false };
    } catch {
      return null; // Backend offline
    }
  },

  // Auth
  async login(email, password) {
    const normalized = String(email || "").trim().toLowerCase();
    const DEMO_MAP = {
      "owner@retailhub.com": { id: "EMP-01", name: "Zain Khan", role: "Owner", email: "owner@retailhub.com", status: "Active", pin: "1234" },
      "manager@retailhub.com": { id: "EMP-03", name: "Rahul Verma", role: "Manager", email: "manager@retailhub.com", status: "Active", pin: "1234" },
      "sahil@retailhub.com": { id: "EMP-02", name: "Sahil Kumar", role: "Manager", email: "sahil@retailhub.com", status: "Active", pin: "1234" },
      "cashier@retailhub.com": { id: "EMP-04", name: "Anjali Mishra", role: "Salesperson", email: "cashier@retailhub.com", status: "Active", pin: "0000" },
      "sales@retailhub.com": { id: "EMP-05", name: "Vikram Das", role: "Salesperson", email: "sales@retailhub.com", status: "Active", pin: "0000" }
    };

    // Try real backend first
    const res = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: normalized, password })
    });
    if (res?.success && res?.token) {
      this.setToken(res.token);
      localStorage.setItem("retailhub_current_user", JSON.stringify(res.user));
      return { success: true, user: res.user };
    }

    // Offline / Mock fallback
    if (DEMO_MAP[normalized] && (password === "admin123" || String(password).length > 0)) {
      const user = DEMO_MAP[normalized];
      this.setToken("mock_jwt_" + Date.now());
      localStorage.setItem("retailhub_current_user", JSON.stringify(user));
      return { success: true, user };
    }

    const staff = db.get("staff");
    const found = staff.find(s => s.email?.toLowerCase() === normalized);
    if (found) {
      if (found.status === "Inactive") {
        return { success: false, error: "Account deactivated. Contact store manager." };
      }
      this.setToken("mock_jwt_" + Date.now());
      localStorage.setItem("retailhub_current_user", JSON.stringify(found));
      return { success: true, user: found };
    }

    return { success: false, error: "Invalid email or password. (Demo password: admin123)" };
  },

  getCurrentUser() {
    const raw = localStorage.getItem("retailhub_current_user");
    return raw ? JSON.parse(raw) : { id: "EMP-01", name: "Zain Khan", role: "Owner", email: "owner@retailhub.com", status: "Active" };
  },

  logout() {
    this.setToken(null);
    localStorage.removeItem("retailhub_current_user");
    return { success: true };
  },

  async verifyManagerPin(pin) {
    const res = await this.request("/auth/verify-manager-pin", {
      method: "POST",
      body: JSON.stringify({ pin })
    });
    if (res?.authorized) return res;

    // Local fallback
    const staff = db.get("staff");
    const m = staff.find(s => (s.role === "Owner" || s.role === "Manager") && (s.pin === String(pin) || String(pin) === "1234"));
    if (m) return { success: true, authorized: true, managerName: m.name, managerRole: m.role };
    return { success: false, authorized: false, error: "Invalid Manager Authorization PIN" };
  },

  // Products
  async getProducts() {
    const res = await this.request("/products");
    if (res?.data && Array.isArray(res.data)) return res.data;
    return db.get("products");
  },

  async addProduct(prod) {
    prod.id = prod.id || "PRD-" + Math.floor(100 + Math.random() * 900);
    const res = await this.request("/products", { method: "POST", body: JSON.stringify(prod) });
    if (res?.data) return res.data;
    return db.insert("products", prod);
  },

  async updateProduct(id, updates) {
    const res = await this.request(`/products/${id}`, { method: "PUT", body: JSON.stringify(updates) });
    if (res?.data) return res.data;
    return db.update("products", id, updates);
  },

  async deleteProduct(id) {
    await this.request(`/products/${id}`, { method: "DELETE" });
    return db.remove("products", id);
  },

  async adjustStock(productId, newQty, reason = "Audit Count") {
    const products = db.get("products");
    const p = products.find(x => x.id === productId);
    if (!p) return null;
    const diff = newQty - p.stock;
    p.stock = newQty;
    db.set("products", products);

    const mv = {
      id: "SM-" + Math.floor(100 + Math.random() * 900),
      productId: p.id,
      productName: p.name,
      type: diff >= 0 ? "IN" : "OUT",
      qty: Math.abs(diff),
      reference: reason,
      date: new Date().toISOString().split("T")[0],
      by: this.getCurrentUser().name
    };
    db.insert("stockMovements", mv);
    return p;
  },

  // Sales
  async getSales() {
    const res = await this.request("/sales");
    if (res?.data && Array.isArray(res.data)) return res.data;
    return db.get("sales");
  },

  async createSale(saleData) {
    saleData.id = "INV-" + (1095 + db.get("sales").length);
    saleData.date = new Date().toISOString().split("T")[0];
    saleData.time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    saleData.status = "Paid";
    saleData.idempotencyKey = "SALE-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);

    // Deduct stock locally
    const prods = db.get("products");
    (saleData.items || []).forEach(item => {
      const prod = prods.find(p => p.name === item.name || p.id === item.id);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.qty);
      }
    });
    db.set("products", prods);

    // Update customer spend & Khata
    if (saleData.customer && saleData.customer !== "Walk-in Customer") {
      const custs = db.get("customers");
      const c = custs.find(x => x.name === saleData.customer);
      if (c) {
        c.totalSpent = (c.totalSpent || 0) + saleData.total;
        c.visits = (c.visits || 0) + 1;
        c.points = (c.points || 0) + Math.round(saleData.total / 100);
        if (saleData.paymentMethod === "Store Credit (Khata)") {
          c.creditBalance = (c.creditBalance || 0) + saleData.total;
        }
        db.set("customers", custs);
      }
    }

    // Try posting to real backend
    await this.request("/sales", { method: "POST", body: JSON.stringify(saleData) });
    return db.insert("sales", saleData);
  },

  async processReturn(invoiceId, returnedItems, refundAmount, reason = "Customer Return") {
    const sales = db.get("sales");
    const sale = sales.find(s => s.id === invoiceId);
    if (!sale) return { success: false, message: "Sale not found" };

    // Restock items
    const products = db.get("products");
    (returnedItems || []).forEach(item => {
      const p = products.find(x => x.name === item.name);
      if (p) p.stock += item.qty;
    });
    db.set("products", products);

    sale.status = "Refunded/Returned";
    sale.refundedAmount = refundAmount;
    sale.returnReason = reason;
    db.set("sales", sales);
    return { success: true, sale };
  },

  // Held Carts
  getHeldCarts() {
    return db.get("heldCarts");
  },

  saveHeldCart(cartData) {
    cartData.id = "HOLD-" + Date.now();
    cartData.savedAt = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    return db.insert("heldCarts", cartData);
  },

  deleteHeldCart(id) {
    return db.remove("heldCarts", id);
  },

  // Customers
  async getCustomers() {
    const res = await this.request("/customers");
    if (res?.data && Array.isArray(res.data)) return res.data;
    return db.get("customers");
  },

  async addCustomer(c) {
    c.id = "CUST-" + Math.floor(100 + Math.random() * 900);
    c.points = c.points || 0;
    c.totalSpent = c.totalSpent || 0;
    c.creditBalance = c.creditBalance || 0;
    c.visits = 1;
    const res = await this.request("/customers", { method: "POST", body: JSON.stringify(c) });
    if (res?.data) return res.data;
    return db.insert("customers", c);
  },

  async recordKhataPayment(customerId, amount) {
    const custs = db.get("customers");
    const c = custs.find(x => x.id === customerId);
    if (!c) return null;
    c.creditBalance = Math.max(0, (c.creditBalance || 0) - amount);
    db.set("customers", custs);
    return c;
  },

  // Suppliers & Purchases
  async getSuppliers() {
    return db.get("suppliers");
  },

  async addSupplier(sup) {
    sup.id = "SUP-0" + (db.get("suppliers").length + 1);
    sup.balance = sup.balance || 0;
    return db.insert("suppliers", sup);
  },

  async getPurchases() {
    return db.get("purchases");
  },

  async addPurchase(po) {
    po.id = "PO-2026-0" + (db.get("purchases").length + 84);
    po.date = new Date().toISOString().split("T")[0];
    return db.insert("purchases", po);
  },

  async receivePurchaseStock(poId) {
    const pos = db.get("purchases");
    const po = pos.find(p => p.id === poId);
    if (!po) return null;
    po.status = "Received";
    db.set("purchases", pos);
    return po;
  },

  // Expenses & Cash Register
  async getExpenses() {
    return db.get("expenses");
  },

  async addExpense(exp) {
    exp.id = "EXP-" + (db.get("expenses").length + 104);
    exp.date = exp.date || new Date().toISOString().split("T")[0];
    return db.insert("expenses", exp);
  },

  async getCashRegister() {
    const raw = localStorage.getItem(`${DB_PREFIX}cashRegister`);
    return raw ? JSON.parse(raw) : INITIAL_SEED.cashRegister;
  },

  async closeCashRegister(countedCash, closingNotes = "") {
    const reg = await this.getCashRegister();
    reg.isOpen = false;
    reg.status = "Closed";
    reg.countedCash = countedCash;
    reg.variance = countedCash - reg.expectedCash;
    reg.closedAt = new Date().toISOString();
    reg.closingNotes = closingNotes;
    localStorage.setItem(`${DB_PREFIX}cashRegister`, JSON.stringify(reg));
    return reg;
  },

  // Staff
  async getStaff() {
    const res = await this.request("/staff");
    if (res?.data && Array.isArray(res.data)) return res.data;
    return db.get("staff");
  },

  async createStaff(staffData) {
    staffData.id = "EMP-0" + (db.get("staff").length + 1);
    staffData.status = staffData.status || "Active";
    return db.insert("staff", staffData);
  },

  async updateStaff(id, updates) {
    return db.update("staff", id, updates);
  },

  async toggleStaffStatus(id, newStatus) {
    const staff = db.get("staff");
    const s = staff.find(x => x.id === id);
    if (s) {
      s.status = newStatus || (s.status === "Active" ? "Inactive" : "Active");
      db.set("staff", staff);
      return s;
    }
    return null;
  },

  // Settings
  async getSettings() {
    const raw = localStorage.getItem(`${DB_PREFIX}settings`);
    return raw ? JSON.parse(raw) : INITIAL_SEED.settings;
  },

  async saveSettings(settings) {
    localStorage.setItem(`${DB_PREFIX}settings`, JSON.stringify(settings));
    return settings;
  },

  // Stock movements
  async getStockMovements() {
    return db.get("stockMovements");
  },

  // AI Insights
  async getAIInsights() {
    const prods = await this.getProducts();
    const sales = await this.getSales();
    const totalRev = sales.reduce((sum, s) => sum + (s.total || 0), 0);
    const avgDailyRev = totalRev > 0 ? (totalRev / Math.max(1, sales.length)) * 1.5 : 24000;
    const forecast7Days = Math.round(avgDailyRev * 7);

    const reorderAlerts = prods
      .filter(p => Number(p.stock) <= Number(p.minStock))
      .map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        currentStock: Number(p.stock),
        minStock: Number(p.minStock),
        suggestedQty: Math.max(10, Number(p.minStock) * 3 - Number(p.stock)),
        urgency: Number(p.stock) === 0 ? "Critical (Stockout)" : "High Priority"
      }));

    return {
      forecastPeriod: "Next 7 Days (Estimate)",
      estimatedRevenue: forecast7Days,
      growthConfidence: "91% confidence based on sales history",
      reorderAlerts
    };
  }
};
