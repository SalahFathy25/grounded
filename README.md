# 🛒 Grounded — E-Commerce Web Application

Full-stack e-commerce platform: **React 18 (Vite) + Tailwind CSS** frontend, **Node.js (Express)** REST API backend, designed per the spec in [`gemini-code-1786733313640.md`](./gemini-code-1786733313640.md).

## ✨ Features

### Storefront (`/`)
- Home page with hero, category shortcuts, featured products, newsletter
- Product catalog with category / price / keyword filters, sorting, pagination
- Product details page with gallery, stock status, quantity selector, related products
- Slide-over cart drawer (persistent in localStorage), checkout with **4 payment methods: COD, Visa (Paymob), Vodafone Cash, InstaPay**
- Order success receipt, "My Orders" tracking page, full auth (register / login)
- **Fully bilingual (Arabic / English)** with RTL support — toggle in the navbar

### Admin Panel (`/admin` — requires `ROLE_ADMIN`)
- Dashboard: revenue, order counts, low-stock alerts, recent orders
- Product management: create / edit / hide (soft delete), stock adjustments
- Order fulfillment: filter by status, mark SHIPPED / DELIVERED / cancel

### Backend (Node.js + Express)
- Stateless **JWT** auth, BCrypt passwords, role-based access
- Tables: `users`, `categories`, `products`, `orders`, `order_items` (+ `store_settings`, `store_content`)
- REST API under `/api/v1`: auth, categories, products, orders, payments (webhook stub), admin stats, store settings/content
- **SQLite** by default (zero setup) + **PostgreSQL** when `DB_URL` is set; seeds sample data on first run
- Serves the built frontend (`frontend/dist`) in production — single image, single port

## 📁 Project layout

```
e_commerce/
├── frontend/            React 18 + Vite + Tailwind v4 (Axios, React Router v6)
├── backend/             Node.js 22 + Express (the live backend)
├── backend-java-spring/ Legacy Spring Boot 3.4 archive (kept as fallback, not used)
└── gemini-code-1786733313640.md   (project spec)
```

## 🚀 Quick start — Frontend (works standalone with the built-in mock API)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

The frontend ships with a mock API layer (`src/lib/mockServer.js`) that mirrors the real backend endpoints exactly — the full shopping flow works with no backend running. Data persists in your browser's localStorage. To reset the demo data, clear site data or remove the `grounded_db_v1` key.

### Demo accounts
| Role | Email | Password |
|---|---|---|
| Admin | `admin@grounded.com` | `admin123` |
| Customer | `salah@grounded.com` | `salah123` |

## 🔌 Running the real backend

Requires **Node.js 18+**.

```bash
cd backend
npm install

# SQLite (zero setup — data stored in backend/data/)
npm start

# …or PostgreSQL: set DB_URL (postgres://… or jdbc:postgresql://…), then:
npm start
```

API runs on **http://localhost:8080/api/v1**.

### Point the frontend at the real API

```bash
cd frontend
$env:VITE_USE_MOCK="false"   # or create .env.local with VITE_USE_MOCK=false
npm run dev
```

The Vite dev server already proxies `/api` → `http://localhost:8080`. Configure allowed origins / JWT secret / DB via env: `CORS_ORIGINS`, `JWT_SECRET`, `DB_URL`, `DB_USER`, `DB_PASSWORD`, `ADMIN_INITIAL_PASSWORD` (default `admin123`).

## ✅ Verification

- Start the server (`npm start`), then `cd backend && npm test` — 115 end-to-end API checks covering the full Spring-compatible contract (fresh SQLite DB)
- `cd backend && node scripts/validate-pg-real.js` — validates the PostgreSQL dialect against a real Postgres inside a rolled-back transaction (skips when no `DB_URL`)

## 🔒 Security notes

- Passwords hashed with BCrypt; JWT signed with HMAC-SHA256 (`JWT_SECRET` — **must** be changed in production)
- Admin-only endpoints are guarded by the `requiresAdmin` middleware
- The payment webhook endpoint is public by design (gateway callbacks) — signature verification is a TODO seam in `paymentService`

## ✅ Status

- [x] Frontend storefront + admin (mock API mode) — **fully functional**
- [x] Backend source complete (SQLite/Postgres, JWT, seeding) — run with Node.js 18+
- [ ] Real Paymob/Tap integration
- [ ] Cloudinary image upload
- [ ] Production deployment — no-card path ready: backend via Cloudflare Tunnel on your PC (see [`DEPLOY-TUNNEL.md`](./DEPLOY-TUNNEL.md))
