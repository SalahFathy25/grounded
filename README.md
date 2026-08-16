# 🛒 Grounded — E-Commerce Web Application

Full-stack e-commerce platform: **React 18 (Vite) + Tailwind CSS** frontend, **Java Spring Boot 3** REST API backend, designed per the spec in [`gemini-code-1786733313640.md`](./gemini-code-1786733313640.md).

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

### Backend (Spring Boot)
- Stateless **JWT** auth (Spring Security), BCrypt passwords, role-based access
- JPA entities: `users`, `categories`, `products`, `orders`, `order_items`
- REST API under `/api/v1`: auth, categories, products, orders, payments (webhook stub), admin stats
- H2 (dev) + PostgreSQL (prod) profiles, seed data on first run

## 📁 Project layout

```
e_commerce/
├── frontend/   React 18 + Vite + Tailwind v4 (Axios, React Router v6)
├── backend/    Spring Boot 3.4, Java 17+, Maven
└── gemini-code-1786733313640.md   (project spec)
```

## 🚀 Quick start — Frontend (works standalone with the built-in mock API)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

The frontend ships with a mock API layer (`src/lib/mockServer.js`) that mirrors the real Spring Boot endpoints exactly — the full shopping flow works with no backend running. Data persists in your browser's localStorage. To reset the demo data, clear site data or remove the `grounded_db_v1` key.

### Demo accounts
| Role | Email | Password |
|---|---|---|
| Admin | `admin@grounded.store` | `admin123` |
| Customer | `customer@grounded.store` | `demo1234` |

## 🔌 Running the real backend

Requires **Java 17+** and **Maven** (or Docker for the DB).

```bash
cd backend
# Option A: dev mode with in-memory H2 (zero setup)
mvn spring-boot:run

# Option B: PostgreSQL via Docker
docker compose up -d
mvn spring-boot:run -Dspring-boot.run.profiles=postgres
```

API runs on **http://localhost:8080/api/v1** (H2 console at `/h2-console`).

### Point the frontend at the real API

```bash
cd frontend
$env:VITE_USE_MOCK="false"   # or create .env.local with VITE_USE_MOCK=false
npm run dev
```

The Vite dev server already proxies `/api` → `http://localhost:8080`. Configure allowed origins / JWT secret / DB via env: `CORS_ORIGINS`, `JWT_SECRET`, `DB_URL`, `DB_USER`, `DB_PASSWORD`.

## 🔒 Security notes

- Passwords hashed with BCrypt; JWT signed with HMAC-SHA256 (`app.jwt.secret` — **must** be changed in production)
- Admin-only endpoints are guarded by `@PreAuthorize("hasRole('ADMIN')")`
- The payment webhook endpoint is public by design (gateway callbacks) — signature verification is a TODO seam in `PaymentService`

## ✅ Status

- [x] Frontend storefront + admin (mock API mode) — **fully functional**
- [x] Backend source complete (H2/Postgres, JWT, seeding) — run with Java 17+
- [ ] Real Paymob/Tap integration
- [ ] Cloudinary image upload
- [ ] Production deployment (Vercel + Railway/Render)
