# VendoraShop

[![CI](https://github.com/zabmw89/VendoraShop/actions/workflows/ci.yml/badge.svg)](https://github.com/zabmw89/VendoraShop/actions/workflows/ci.yml)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.2-092E20?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-Portfolio-blue)](LICENSE.md)
[![Test Coverage](https://img.shields.io/badge/coverage-76%25-brightgreen)](#testing)

VendoraShop is a full-stack e-commerce application built with a **React JavaScript frontend** and a **Django REST Framework backend**.

The project focuses on a practical shopping workflow, secure authentication, product discovery, cart and order management, administration, and automated testing.

## Live Demo

A one-click **live demo** can be deployed to [Render](https://render.com/) using the included [`render.yaml`](render.yaml) Blueprint:

1. Fork this repo, then in Render choose **New → Blueprint** and point it at your fork.
2. Render provisions a free PostgreSQL database and a single web service that builds the React SPA, runs migrations, and seeds the demo catalog automatically.
3. When the deploy finishes, open the service URL and sign in with the [demo credentials](#demo-credentials) below.

Prefer containers? Bring the whole stack up locally with Docker:

```bash
docker compose up --build
# then, in another terminal, seed the demo catalog + users:
docker compose exec app python manage.py seed_demo_data
# open http://localhost:8000
```

> The demo runs a single Gunicorn service that serves both the REST API (`/api/…`) and the compiled React SPA (via WhiteNoise), so the frontend and backend share one origin.

## Demo Credentials

The public demo is seeded (`python manage.py seed_demo_data` with `DEMO_MODE=true`) with two accounts:

| Role     | Email                     | Password        |
|----------|---------------------------|-----------------|
| Admin    | `admin@vendorashop.com`   | `DemoAdmin123!` |
| Customer | `alex@example.com`        | `DemoUser123!`  |

These credentials are intentionally published for the throwaway demo database. **For a private or production deployment, override them** with the `DEMO_ADMIN_PASSWORD` and `DEMO_CUSTOMER_PASSWORD` environment variables (or simply leave `DEMO_MODE` unset and create accounts with `python manage.py create_admin`).

## Features

### Storefront

- Responsive product catalog
- Product search, filtering, and sorting
- Category and price-range filtering
- Featured products and new arrivals
- Product detail pages with image galleries
- Reviews and ratings
- Wishlist
- Price-drop alerts

### Cart & Orders

- Add, update, and remove cart items
- Guest and authenticated-user carts
- Stock validation
- Coupon support
- Transactional order creation with inventory deduction
- Order tracking and status milestones

### Authentication & Security

- Email/password registration
- Email verification
- Password reset
- JWT authentication
- Social login support
- Authentication rate limiting
- Brute-force protection with django-axes
- Argon2 password hashing
- Server-side input validation and permission checks

### Administration

- Product management
- Order management
- User management
- Store/location management
- Sales and platform analytics
- Error and performance monitoring

### Additional

- Newsletter subscription
- Loyalty rewards
- Store locator and pickup support
- PWA/offline support
- Responsive mobile, tablet, and desktop UI

## Architecture

```text
┌─────────────────────────────┐
│ React + JavaScript + Vite   │
│ Frontend                    │
└──────────────┬──────────────┘
               │ REST / JSON
               ▼
┌─────────────────────────────┐
│ Django REST Framework       │
│ Backend                     │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ PostgreSQL                  │
│ Production Database         │
└─────────────────────────────┘
```

The application intentionally uses **JavaScript/JSX for the frontend**. The Django application is the single backend and API source of truth.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, JavaScript/JSX, Vite, Tailwind CSS |
| Routing & UI | React Router, Lucide Icons |
| Backend | Python, Django, Django REST Framework |
| Authentication | SimpleJWT, django-allauth, django-axes |
| Password Hashing | Argon2 |
| Database | SQLite for local development, PostgreSQL for production |
| Testing | Django TestCase / pytest, Vitest, Playwright |
| Tooling | npm, ESLint |
| Deployment | Docker / Docker Compose (where configured) |

## Project Structure

```text
vendorashop/
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       ├── context/
│       ├── services/
│       ├── utils/
│       ├── constants/
│       ├── routes/
│       ├── styles/
│       ├── App.jsx
│       └── main.jsx
│
├── backend/
│   ├── apps/
│   │   ├── accounts/
│   │   ├── products/
│   │   ├── cart/
│   │   ├── orders/
│   │   └── telemetry/
│   ├── config/
│   ├── tests/
│   ├── manage.py
│   └── requirements.txt
│
├── e2e/
├── docs/
├── .github/
├── docker-compose.yml
├── README.md
├── LICENSE
└── .gitignore
```

The exact tree should match the implementation. Empty or unused directories should not be kept only for presentation.

## Local Development

### Prerequisites

- Python 3.12+
- Node.js 18+
- npm
- PostgreSQL for production-like local development, or SQLite for simple development

### Clone

```bash
git clone https://github.com/zabmw89/VendoraShop.git
cd VendoraShop
```

### Backend

```bash
cd backend

python3 -m venv .venv
source .venv/bin/activate

# Windows:
# .venv\Scripts\activate

pip install -r requirements.txt

python manage.py migrate
python manage.py runserver
```

Backend:

```text
http://localhost:8000
```

### Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

### Demo Data

If the demo-data command is enabled:

```bash
python manage.py seed_demo_data
```

## Environment Variables

Use the provided `.env.example` files as the starting point for local configuration.

### Frontend

```env
VITE_API_URL=http://localhost:8000/api
```

### Backend

```env
DEBUG=True
SECRET_KEY=replace-with-a-local-secret
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgresql://user:password@localhost:5432/vendorashop
CORS_ALLOWED_ORIGINS=http://localhost:5173

# Optional services
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=
```

Never commit real secrets, passwords, API keys, OAuth credentials, or production database credentials.

## API

The Django REST API provides endpoints for:

- Authentication and user profiles
- Products and categories
- Cart operations
- Orders and order tracking
- Reviews
- Wishlist
- Coupons
- Other application resources exposed by the backend

Authentication endpoints include:

```text
POST /api/auth/register/
POST /api/auth/login/
POST /api/auth/verify-email/
POST /api/auth/forgot-password/
POST /api/auth/reset-password/
POST /api/auth/token/refresh/
GET  /api/auth/me/
PUT  /api/auth/profile/
```

Core commerce endpoints include:

```text
GET    /api/products/
GET    /api/products/{id}/
GET    /api/categories/

GET    /api/cart/
POST   /api/cart/
PUT    /api/cart/item/
DELETE /api/cart/item/
DELETE /api/cart/

POST   /api/orders/
GET    /api/orders/
GET    /api/orders/{id}/

GET    /api/payments/config/
POST   /api/payments/create-intent/
POST   /api/payments/webhook/stripe/
```

The endpoint list should be kept synchronized with the actual Django URL configuration.

## Management Commands

Examples:

```bash
# Create an administrator
python manage.py create_admin   --email admin@vendorashop.com   --password YourSecurePassword123!

# Create a superuser
python manage.py create_superuser   --email admin@vendorashop.com   --password YourSecurePassword123!

# Seed demo data
python manage.py seed_demo_data
```

Use only commands that exist in the current backend.

## Testing

### Backend

```bash
cd backend

python manage.py check
python manage.py test
```

If pytest is configured:

```bash
pytest
```

### Frontend

```bash
cd frontend

npm run lint
npm test
npm run build
```

### End-to-End

```bash
npx playwright test
```

Important workflows to cover include authentication, product browsing, cart behavior, checkout/order creation, permissions, and inventory rules.

## Security

VendoraShop uses a server-side security model:

- Secrets are loaded from environment variables.
- Passwords are protected with Argon2.
- Authentication and authorization are enforced by Django.
- JWT credentials are handled securely.
- Authentication endpoints are rate-limited.
- Brute-force protection is enabled where configured.
- Server-side validation protects API inputs.
- Production configuration should use `DEBUG=False`.
- `ALLOWED_HOSTS` and CORS should be explicitly configured.
- Prices, order totals, permissions, payment state, and inventory must be validated on the server.

## Development Principles

- Keep the frontend **JavaScript/JSX**, not TypeScript.
- Keep Django as the **single backend**.
- Keep API communication inside frontend service modules.
- Avoid duplicating business logic between React and Django.
- Keep reusable UI in `components/`.
- Keep route-level screens in `pages/`.
- Keep reusable React behavior in `hooks/`.
- Use Context only for genuinely global client state.
- Keep server-side business rules inside Django.
- Prefer small, focused modules over large files.
- Remove unused dependencies and generated artifacts.

## Roadmap

Already delivered:

- ✅ Transaction-safe checkout with row-level locking, conditional atomic
  inventory decrements, and automatic retry on transient DB contention —
  covered by concurrent-request tests that prove no overselling.
- ✅ Stripe payment integration with server-created PaymentIntents and a
  signature-verified, idempotent webhook receiver.
- ✅ GitHub Actions CI (backend tests on PostgreSQL with coverage, frontend
  lint/test/build).
- ✅ Docker + Docker Compose and a Render Blueprint for one-click deploys.

Planned improvements focused on engineering quality rather than adding unnecessary features:

- Cleaner product-variant and inventory modeling
- Background jobs for notifications and email
- OpenAPI/Swagger documentation
- Expanded automated testing
- Performance and observability improvements

## License

Copyright (c) 2026 Ahmet Zahir Absi.

This project is published for educational, portfolio, and demonstration purposes. Commercial use requires permission from the copyright holder.

## Author

**Ahmet Zahir Absi** — Software Engineer

- GitHub: <https://github.com/zabmw89>
- Portfolio: <https://devfolioahmed.vercel.app/>
