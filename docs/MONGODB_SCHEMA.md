# RetailHub — MongoDB Database & Mongoose Schemas

> **Target Database Engine**: MongoDB 6.0+ / 7.0+ (Local MongoDB Community Server or MongoDB Atlas)  
> **Object Data Modeling (ODM)**: [Mongoose v8+](https://mongoosejs.com/)  
> **Default Database URI**: `mongodb://127.0.0.1:27017/retailhub`  
> **API Port & Prefix**: `http://localhost:5000/api/v1`

---

## 1. Overview & Collaboration Agreement

RetailHub is split into two cleanly separated tiers:
- **Frontend (Partner A)**: Vanilla HTML5, CSS3, and JavaScript located in `frontend/`. It communicates via REST with standard JSON payloads, supporting offline synchronization and MongoDB `_id` / `id` compatibility.
- **Backend (Partner B - Your Responsibility)**: Node.js, Express.js, Mongoose, and MongoDB. You build the server, routes, controllers, middleware, and database models.

### Key MongoDB Compatibility Rule
- The frontend handles both native MongoDB `_id` (24-character hexadecimal ObjectId) and human-friendly `id` (e.g. `PRD-101`, `INV-1094`, `EMP-01`).
- In your Mongoose schemas, always enable `{ timestamps: true }` so that `createdAt` and `updatedAt` are tracked automatically.
- Enable virtual `id` or transform `toJSON: { virtuals: true }` so API responses return both `_id` and `id` for maximum frontend compatibility:
```javascript
schema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    return ret;
  }
});
```

---

## 2. Recommended Database Connection (`src/config/db.js`)

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/retailhub', {
      autoIndex: true, // Builds indexes in development
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

---

## 3. The 10 Core Mongoose Schemas & Models

### 3.1 User / Staff Model (`models/User.js`)
Handles authentication, password hashing with bcrypt, role-based access control, and manager authorization PINs.

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Staff member name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false // Excluded by default in queries for security
  },
  role: {
    type: String,
    enum: ['Owner', 'Manager', 'Salesperson'],
    default: 'Salesperson'
  },
  phone: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  shift: {
    type: String,
    default: 'Full-Time'
  },
  pin: {
    type: String,
    default: '0000', // 4-digit PIN for Manager override authorization
    minlength: 4,
    maxlength: 4
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret.password; // Never expose hashed password
      return ret;
    }
  }
});

// Pre-save password hash
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
```

---

### 3.2 Product Model (`models/Product.js`)
Supports SKU, barcode scanning, categories, inventory quantities, reorder thresholds, and profit margins.

```javascript
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    index: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    index: true
  },
  price: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: [0, 'Selling price cannot be negative']
  },
  cost: {
    type: Number,
    required: [true, 'Purchase cost is required'],
    min: [0, 'Cost cannot be negative'],
    default: 0
  },
  taxRate: {
    type: Number,
    default: 18,
    min: 0,
    max: 100
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  minStock: {
    type: Number,
    default: 5,
    min: 0
  },
  barcode: {
    type: String,
    trim: true,
    index: true
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true,
    trim: true
  },
  unit: {
    type: String,
    default: 'Pcs'
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  icon: {
    type: String,
    default: 'fa-box'
  },
  isFrequentlySold: {
    type: Boolean,
    default: false
  },
  isRecentlySold: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      return ret;
    }
  }
});

// Compound indexes for rapid POS search
ProductSchema.index({ name: 'text', sku: 'text', barcode: 'text' });
ProductSchema.index({ category: 1, status: 1 });

module.exports = mongoose.model('Product', ProductSchema);
```

---

### 3.3 Sale Model (`models/Sale.js`)
Handles POS sales, unique invoice generation, line items, multi-payment options, credit ledger linkage, and duplicate prevention via idempotency keys.

```javascript
const mongoose = require('mongoose');

const SaleItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  name: { type: String, required: true },
  qty: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  cost: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  subtotal: { type: Number, required: true }
}, { _id: false });

const SaleSchema = new mongoose.Schema({
  saleNumber: {
    type: String,
    unique: true,
    index: true
  },
  customer: {
    type: String,
    default: 'Walk-in Customer',
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null
  },
  items: [SaleItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  costTotal: {
    type: Number,
    default: 0
  },
  profit: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'UPI', 'Card', 'Store Credit (Khata)', 'Split', 'Online Order (Cash on Delivery)'],
    default: 'Cash'
  },
  paymentDetails: {
    cashReceived: { type: Number, default: 0 },
    changeGiven: { type: Number, default: 0 },
    transactionRef: { type: String, default: '' },
    splitBreakdown: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  status: {
    type: String,
    enum: ['Paid', 'Pending', 'Refunded/Returned', 'Partially Paid'],
    default: 'Paid'
  },
  cashier: {
    type: String,
    default: 'System'
  },
  cashierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null
  },
  idempotencyKey: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  refundedAmount: {
    type: Number,
    default: 0
  },
  returnReason: {
    type: String,
    default: ''
  },
  channel: {
    type: String,
    enum: ['POS', 'Storefront'],
    default: 'POS'
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      return ret;
    }
  }
});

SaleSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Sale', SaleSchema);
```

---

### 3.4 Customer Model (`models/Customer.js`)
Manages retail customers, contact details, loyalty points, visit counts, and the Khata credit ledger.

```javascript
const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    index: true
  },
  phone: {
    type: String,
    required: [true, 'Customer phone number is required'],
    trim: true,
    index: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  creditBalance: {
    type: Number,
    default: 0, // Outstanding Khata balance
    min: 0
  },
  visits: {
    type: Number,
    default: 1,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      return ret;
    }
  }
});

module.exports = mongoose.model('Customer', CustomerSchema);
```

---

### 3.5 Supplier Model (`models/Supplier.js`)
Stores vendor profiles, contact details, and outstanding payables.

```javascript
const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Supplier business name is required'],
    trim: true
  },
  contactPerson: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    required: [true, 'Supplier contact phone is required'],
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  balance: {
    type: Number,
    default: 0 // Outstanding amount owed to supplier
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      return ret;
    }
  }
});

module.exports = mongoose.model('Supplier', SupplierSchema);
```

---

### 3.6 Purchase Order Model (`models/PurchaseOrder.js`)
Tracks inventory restocking orders, receiving stages, and cost totals.

```javascript
const mongoose = require('mongoose');

const POItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  name: { type: String, required: true },
  qty: { type: Number, required: true, min: 1 },
  cost: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true }
}, { _id: false });

const PurchaseOrderSchema = new mongoose.Schema({
  poNumber: {
    type: String,
    unique: true,
    index: true
  },
  supplier: {
    type: String,
    required: true
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    default: null
  },
  items: [POItemSchema],
  itemsCount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Pending', 'Ordered', 'Received', 'Cancelled'],
    default: 'Pending'
  },
  receivedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      return ret;
    }
  }
});

module.exports = mongoose.model('PurchaseOrder', PurchaseOrderSchema);
```

---

### 3.7 Expense Model (`models/Expense.js`)
Tracks operational expenses (rent, utilities, packaging, salaries).

```javascript
const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Expense description title is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['Utilities', 'Rent', 'Packaging', 'Salaries', 'Supplies', 'Marketing', 'Maintenance', 'Other'],
    default: 'Utilities'
  },
  amount: {
    type: Number,
    required: [true, 'Expense amount is required'],
    min: [0, 'Amount must be positive']
  },
  date: {
    type: String,
    default: () => new Date().toISOString().split('T')[0]
  },
  paidBy: {
    type: String,
    enum: ['Bank', 'Cash', 'UPI', 'Card'],
    default: 'Bank'
  },
  notes: {
    type: String,
    default: ''
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      return ret;
    }
  }
});

module.exports = mongoose.model('Expense', ExpenseSchema);
```

---

### 3.8 Stock Movement Audit Ledger (`models/StockMovement.js`)
Maintains an immutable audit ledger of every inventory change.

```javascript
const mongoose = require('mongoose');

const StockMovementSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  productName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['IN', 'OUT', 'ADJUSTMENT', 'RETURN'],
    required: true
  },
  qty: {
    type: Number,
    required: true
  },
  reference: {
    type: String, // e.g., 'INV-1094', 'PO-2026-081', 'Manual Stock Adjustment'
    default: ''
  },
  by: {
    type: String,
    default: 'System'
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      return ret;
    }
  }
});

module.exports = mongoose.model('StockMovement', StockMovementSchema);
```

---

### 3.9 Branch Model (`models/Branch.js`)
Multi-store branch network management.

```javascript
const mongoose = require('mongoose');

const BranchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Branch name is required'],
    trim: true
  },
  address: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    default: ''
  },
  isMain: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      return ret;
    }
  }
});

module.exports = mongoose.model('Branch', BranchSchema);
```

---

### 3.10 Setting Model (`models/Setting.js`)
Store profile, tax rate, invoice prefix, currency symbol, and receipt footer text.

```javascript
const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  shopName: { type: String, default: 'RetailHub Flagship Store' },
  shopTagline: { type: String, default: 'Premium Multi-Brand Tech & Lifestyle Store' },
  currency: { type: String, default: 'INR' },
  currencySymbol: { type: String, default: '₹' },
  taxRate: { type: Number, default: 18 },
  gstin: { type: String, default: '27AABCR1234D1ZP' },
  phone: { type: String, default: '+91 (022) 8877-6655' },
  email: { type: String, default: 'contact@retailhubstore.com' },
  address: { type: String, default: 'Shop 14, Commercial Plaza, Bandra West, Mumbai 400050' },
  invoicePrefix: { type: String, default: 'INV-' },
  receiptFooter: { type: String, default: 'Thank you for shopping with RetailHub! Goods once sold can be exchanged within 7 days.' },
  theme: { type: String, default: 'light' },
  enableLoyalty: { type: Boolean, default: true },
  enableStorefront: { type: Boolean, default: true },
  enableAIInsights: { type: Boolean, default: true }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      return ret;
    }
  }
});

module.exports = mongoose.model('Setting', SettingSchema);
```

---

## 4. Initial Seed Script for MongoDB (`scripts/seed.js`)

When your backend partner starts up MongoDB, they can run this script once to populate initial demo data matching the frontend's seed dataset:

```javascript
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Branch = require('../src/models/Branch');
const Setting = require('../src/models/Setting');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/retailhub');
  console.log('Connected to MongoDB. Seeding initial accounts and products...');

  // 1. Create Default Branch
  let branch = await Branch.findOne({ isMain: true });
  if (!branch) {
    branch = await Branch.create({
      name: 'Main Flagship Store (Bandra)',
      address: 'Shop 14, Commercial Plaza, Bandra West, Mumbai',
      isMain: true
    });
  }

  // 2. Create Default Accounts (Owner, Manager, Cashier)
  const defaultUsers = [
    { name: 'Zain Khan', email: 'owner@retailhub.com', password: 'admin123', role: 'Owner', pin: '1234', branchId: branch._id },
    { name: 'Rahul Verma', email: 'manager@retailhub.com', password: 'admin123', role: 'Manager', pin: '1234', branchId: branch._id },
    { name: 'Sahil Kumar', email: 'sahil@retailhub.com', password: 'admin123', role: 'Manager', pin: '1234', branchId: branch._id },
    { name: 'Anjali Mishra', email: 'cashier@retailhub.com', password: 'admin123', role: 'Salesperson', pin: '0000', branchId: branch._id },
    { name: 'Vikram Das', email: 'sales@retailhub.com', password: 'admin123', role: 'Salesperson', pin: '0000', branchId: branch._id }
  ];

  for (const u of defaultUsers) {
    const exists = await User.findOne({ email: u.email });
    if (!exists) {
      await User.create(u);
      console.log(`Created account: ${u.email} (${u.role})`);
    }
  }

  // 3. Create Default Store Settings
  const settingsCount = await Setting.countDocuments();
  if (settingsCount === 0) {
    await Setting.create({});
    console.log('Initialized default store settings.');
  }

  console.log('MongoDB Seed complete! Server is ready.');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

---

## 5. Summary Checklist for Backend Partner

- [ ] Connect to `mongodb://127.0.0.1:27017/retailhub` using Mongoose in `src/config/db.js`.
- [ ] Implement the 10 models specified in this document inside `src/models/`.
- [ ] Ensure `_id` and `id` are both exposed in JSON responses (`toJSON: { virtuals: true }`).
- [ ] Mount all REST endpoints described in [API_CONTRACT.md](file:///c:/Users/zainu/Desktop/RetailHub/docs/API_CONTRACT.md) under `/api/v1`.
- [ ] Listen on port `5000` with CORS enabled for frontend clients (`http://127.0.0.1:5500`, `http://localhost:5500`, `http://localhost:3000`).
