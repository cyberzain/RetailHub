# RetailHub — Backend Developer Guide (Node.js, Express & PostgreSQL)

Welcome to the **RetailHub Backend**! As the backend lead for RetailHub, you are building the REST API server that connects the React frontend client to a PostgreSQL database.

---

## 1. Project Division & Architecture

- **Frontend (`frontend/`)**: Modern **React 18 SPA** (built by your collaborator). It is completely decoupled from the server and currently operates with an offline state engine. Once your backend runs on `http://localhost:5000/api/v1`, the React frontend will automatically connect to your live PostgreSQL database.
- **Backend (`backend/`)**: Built by **you** using **Node.js, Express.js, and PostgreSQL** (via `pg` pool or an ORM like Prisma / Sequelize / Drizzle).

---

## 2. Quick Setup

### Step 1: Install Dependencies
Open your terminal in the `backend/` directory:
```bash
cd backend
npm install
```
*(Pre-configured dependencies in `package.json`: `express`, `pg`, `cors`, `dotenv`, `bcryptjs`, `jsonwebtoken`, `helmet`, `express-rate-limit`, and `nodemon`).*

### Step 2: Environment Configuration
Check `.env` (a template is provided in `.env.example`):
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/retailhub
PGHOST=localhost
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=retailhub
PGPORT=5432
JWT_SECRET=retailhub_jwt_super_secure_secret_key_change_in_production_2026
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5000
```

### Step 3: Run Database Migrations & Seeds
Create the database in PostgreSQL:
```sql
CREATE DATABASE retailhub;
```
Then run the DDL schema and seed script located in **`docs/POSTGRESQL_SCHEMA.md`**:
```bash
psql -U postgres -d retailhub -f docs/POSTGRESQL_SCHEMA.sql
```

---

## 3. Recommended Backend Structure

Create the following folder structure inside `backend/`:

```
backend/
├── .env
├── package.json
├── README.md
└── src/
    ├── config/
    │   └── db.js            # PostgreSQL connection pool (pg.Pool)
    ├── middleware/
    │   ├── auth.js          # JWT verification & role authorization (Owner, Manager, Salesperson)
    │   └── error.js         # Centralized API error handler
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

## 4. Key Documentation References

1. **[docs/POSTGRESQL_SCHEMA.md](file:///c:/Users/zainu/Desktop/RetailHub/docs/POSTGRESQL_SCHEMA.md)**: Full PostgreSQL table DDL with foreign keys, checks, indexes, and initial seed data.
2. **[docs/API_CONTRACT.md](file:///c:/Users/zainu/Desktop/RetailHub/docs/API_CONTRACT.md)**: Full REST API contract documenting every endpoint, query parameters, request bodies, and expected JSON response structures.

---

## 5. Critical Frontend Requirements

To ensure smooth communication between the React frontend and your Express/PostgreSQL server:

1. **Port & Base Route**:
   - Server must listen on port `5000`.
   - All REST routes must be mounted with the `/api/v1` prefix (e.g. `/api/v1/auth/login`, `/api/v1/products`).
   - A health check endpoint must respond at `GET /` with `{ status: "ok", message: "RetailHub API running" }`.

2. **CORS**:
   - Enable CORS with `cors({ origin: "http://localhost:3000" })` or `cors({ origin: "*" })`.

3. **Response Envelope Format**:
   - Successful list queries: `{ success: true, count: N, data: [...] }`
   - Successful single item: `{ success: true, data: { ... } }`
   - Errors: `{ success: false, error: "Human-readable error description" }`

4. **Authentication**:
   - Return `{ success: true, token: "<JWT>", user: { id, name, email, role, status } }` on `/api/v1/auth/login`.
   - Protected routes require `Authorization: Bearer <token>` header.

---

## 6. Development Scripts

```bash
# Start server with auto-restart on file changes
npm run dev

# Start server in production mode
npm start
```
