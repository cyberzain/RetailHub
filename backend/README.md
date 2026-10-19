# RetailHub — Backend Developer Guide (MongoDB & Express)

Welcome to the **RetailHub Backend**! As the backend lead for RetailHub, you are building the REST API server that connects the frontend client to MongoDB.

---

## 1. Project Division & Architecture

- **Frontend (`frontend/`)**: Pure HTML5, CSS3, and vanilla JavaScript (built by your collaborator). It is completely decoupled from the server and currently operates with an offline sync engine. Once your backend runs on `http://localhost:5000/api/v1`, the frontend will automatically connect to your live MongoDB database.
- **Backend (`backend/`)**: Built by **you** using **Node.js, Express.js, Mongoose, and MongoDB**.

---

## 2. Quick Setup

### Step 1: Install Dependencies
Open your terminal in the `backend/` directory:
```bash
cd backend
npm install
```
*(Pre-configured dependencies in `package.json`: `express`, `mongoose`, `cors`, `dotenv`, `bcryptjs`, `jsonwebtoken`, `helmet`, `express-rate-limit`, and `nodemon`).*

### Step 2: Environment Configuration
Check `.env` (a template is provided in `.env.example`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/retailhub
JWT_SECRET=retailhub_jwt_super_secure_secret_key_change_in_production_2026
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://127.0.0.1:5500,http://localhost:5500,http://localhost:3000,http://localhost:5000
```

### Step 3: Start MongoDB
Ensure MongoDB is running locally:
```bash
# Windows MongoDB Community Service
net start MongoDB
# Or run mongod directly
mongod --dbpath <your-db-path>
```
Or set `MONGODB_URI` to your MongoDB Atlas cluster connection string.

---

## 3. Recommended Folder Structure

Create the following folder structure inside `backend/`:

```
backend/
├── .env
├── package.json
├── README.md
└── src/
    ├── config/
    │   └── db.js            # Mongoose MongoDB connection
    ├── models/              # Mongoose schemas (see docs/MONGODB_SCHEMA.md)
    │   ├── User.js
    │   ├── Product.js
    │   ├── Sale.js
    │   ├── Customer.js
    │   ├── Supplier.js
    │   ├── PurchaseOrder.js
    │   ├── Expense.js
    │   ├── StockMovement.js
    │   ├── Branch.js
    │   └── Setting.js
    ├── middleware/
    │   ├── auth.js          # JWT verification & role authorization
    │   └── error.js         # Centralized error handler
    ├── controllers/
    │   ├── authController.js
    │   ├── productController.js
    │   ├── saleController.js
    │   ├── customerController.js
    │   ├── staffController.js
    │   └── reportController.js
    ├── routes/
    │   ├── auth.js
    │   ├── products.js
    │   ├── sales.js
    │   ├── customers.js
    │   ├── staff.js
    │   ├── suppliers.js
    │   ├── purchases.js
    │   ├── expenses.js
    │   └── settings.js
    └── server.js            # Main Express app entrypoint
```

---

## 4. Key References & Documentation

1. **[docs/MONGODB_SCHEMA.md](file:///c:/Users/zainu/Desktop/RetailHub/docs/MONGODB_SCHEMA.md)**: Full copy-paste ready Mongoose schema definitions for all 10 collections, indexing strategies, and database seed script.
2. **[docs/API_CONTRACT.md](file:///c:/Users/zainu/Desktop/RetailHub/docs/API_CONTRACT.md)**: Exhaustive REST API contract documenting every endpoint, query parameters, request bodies, and expected JSON response structures.

---

## 5. Critical Frontend Requirements

To ensure flawless communication between the frontend and your Express server:

1. **Port & Base Route**:
   - Server must listen on port `5000`.
   - All REST routes must be mounted with the `/api/v1` prefix (e.g. `/api/v1/auth/login`, `/api/v1/products`).
   - A health check endpoint should respond at `GET /` with `{ status: "ok", message: "RetailHub API running" }`.

2. **CORS**:
   - Enable CORS with `cors({ origin: "*" })` or allow `http://127.0.0.1:5500` and `http://localhost:5500`.

3. **Response Envelope Format**:
   - Successful list queries: `{ success: true, count: N, data: [...] }`
   - Successful single item: `{ success: true, data: { ... } }`
   - Errors: `{ success: false, error: "Human-readable error description" }`

4. **IDs & ObjectIds**:
   - The frontend handles both MongoDB `_id` and string `id`. Include virtual `id` in your Mongoose models:
   ```javascript
   schema.set('toJSON', { virtuals: true });
   ```

5. **Authentication**:
   - Return `{ success: true, token: "<JWT>", user: { id, name, email, role, status } }` on `/api/v1/auth/login`.
   - Protect write routes with Bearer token authentication via `Authorization: Bearer <token>` header.

---

## 6. Development Scripts

```bash
# Start server with auto-restart on file changes
npm run dev

# Start server in production mode
npm start
```
