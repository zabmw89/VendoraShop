
# VendoraShop — API Documentation

## Base URL

- Development: `http://localhost:8000/api`
- Production: `https://yourdomain.com/api`

## Authentication

Most endpoints require a JWT token in the `Authorization` header:

```''
Authorization: Bearer <access_token>
```

---

## Auth Endpoints

### POST /api/auth/register/

Register a new user account.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "password_confirm": "securepassword",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response (201):**

```json
{
  "message": "Registration successful. Please verify your email.",
  "user": { "id": 1, "email": "user@example.com" }
}
```

### POST /api/auth/login/

Login and receive JWT tokens.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200):**

```json
{
  "access": "eyJ...",
  "refresh": "eyJ...",
  "user": { "id": 1, "email": "user@example.com", "first_name": "John" }
}
```

### POST /api/auth/token/refresh/

Refresh an expired access token.

**Request:**

```json
{ "refresh": "eyJ..." }
```

### POST /api/auth/logout/

Logout (invalidate refresh token). Requires authentication.

### POST /api/auth/forgot-password/

Request a password reset code.

**Request:**

```json
{ "email": "user@example.com" }
```

### POST /api/auth/reset-password/

Reset password with verification code.

**Request:**

```json
{
  "email": "user@example.com",
  "code": "123456",
  "new_password": "newsecurepassword"
}
```

---

## Products

### GET /api/products/

List all products with filtering and search.

**Query Parameters:**

- `search` — Search by name, description, brand
- `category` — Filter by category slug
- `minPrice` / `maxPrice` — Price range filter
- `inStock` — Only in-stock products (`true`)
- `featured` — Only featured products (`true`)
- `sort` — Sort order: `newest`, `price_asc`, `price_desc`, `rating`

**Response (200):**

```json
[
  {
    "id": 1,
    "name": "AeroPulse ANC Wireless Headphones",
    "slug": "aeropulse-anc-wireless-headphones",
    "brand": "AeroAcoustics",
    "price": "249.99",
    "original_price": "299.99",
    "image": "https://...",
    "images": ["https://...", "https://..."],
    "rating": "4.90",
    "review_count": 128,
    "in_stock": true,
    "is_featured": true,
    "tags": ["audio", "bluetooth"],
    "specs": { "Driver Size": "40mm" },
    "variants": { "colors": ["Black", "White"] },
    "category_name": "Audio",
    "categoryId": "audio"
  }
]
```

### GET /api/products/{id}/

Get a single product by ID.

### GET /api/categories/

List all categories.

### GET /api/brands/

List all unique brands.

---

## Cart

### GET /api/cart/

Get current user's cart. Requires authentication.

### POST /api/cart/add/

Add item to cart.

**Request:**

```json
{
  "product_id": 1,
  "quantity": 2
}
```

### PUT /api/cart/update/{item_id}/

Update cart item quantity.

### DELETE /api/cart/remove/{item_id}/

Remove item from cart.

---

## Orders

### POST /api/orders/checkout/

Create a new order from cart.

**Request:**

```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "city": "San Francisco",
  "state": "CA",
  "zipCode": "94102",
  "paymentMethod": "credit_card"
}
```

**Response (201):**

```json
{
  "id": 1,
  "status": "processing",
  "total_amount": "269.99",
  "items": [...]
}
```

### GET /api/orders/

List user's orders. Requires authentication.

### GET /api/orders/{id}/

Get order details. Requires authentication.

---

## Payments

VendoraShop integrates with **Stripe** for card payments. Success is only
recorded when Stripe calls the signature-verified webhook — the browser is
never trusted to confirm a payment. If Stripe keys are not configured, the
backend falls back to the built-in mock provider (see `payment_service.py`).

### GET /api/payments/config/

Return the browser-safe payment configuration.

**Response (200):**

```json
{
  "publishableKey": "pk_test_...",
  "currency": "USD",
  "stripeEnabled": true
}
```

### POST /api/payments/create-intent/

Create a Stripe PaymentIntent for an existing order and return the
`clientSecret` the frontend confirms with Stripe.js. Also creates a local
`Payment` record in the `processing` state.

**Request:**

```json
{ "order_id": 1 }
```

**Response (201):**

```json
{
  "clientSecret": "pi_..._secret_...",
  "paymentIntentId": "pi_...",
  "publishableKey": "pk_test_...",
  "paymentId": 1,
  "amount": "269.99",
  "currency": "USD"
}
```

### POST /api/payments/webhook/stripe/

Server-to-server webhook receiver for Stripe events. Authenticated by the
`Stripe-Signature` header (verified against `STRIPE_WEBHOOK_SECRET`); requests
with a missing/invalid signature are rejected with `400`. Handling is
idempotent, so Stripe's at-least-once delivery is safe.

Handled events:

- `payment_intent.succeeded` → marks the `Payment` succeeded and advances a
  `pending` order to `processing`.
- `payment_intent.payment_failed` → marks the `Payment` failed.
- `charge.refunded` → marks the `Payment` refunded.

**Response (200):**

```json
{ "received": true, "handled": true, "type": "payment_intent.succeeded", "payment_id": 1 }
```

To test locally with the Stripe CLI:

```bash
stripe listen --forward-to localhost:8000/api/payments/webhook/stripe/
# copy the printed whsec_... into STRIPE_WEBHOOK_SECRET
```

---

## Reviews

### GET /api/products/{id}/reviews/

List reviews for a product.

### POST /api/products/{id}/reviews/

Create a review. Requires authentication.

**Request:**

```json
{
  "rating": 5,
  "comment": "Excellent product!"
}
```

---

## Wishlist

### GET /api/wishlist/

Get user's wishlist. Requires authentication.

### POST /api/wishlist/

Add product to wishlist. Requires authentication.

**Request:**

```json
{ "product_id": 1 }
```

### DELETE /api/wishlist/{product_id}/

Remove product from wishlist. Requires authentication.

---

## Admin Endpoints (Requires admin role)

### GET /api/admin/analytics/

Get sales analytics and metrics.

### GET /api/admin/orders/

List all orders.

### PUT /api/admin/orders/{id}/status/

Update order status.

**Request:**

```json
{ "status": "shipped" }
```

### GET /api/admin/error-logs/

Get error logs from frontend telemetry.

### POST /api/admin/reset-db/

Reset database and re-seed demo data (DEMO_MODE only).

---

## Other Endpoints

### GET /api/stores/

List store locations.

### POST /api/newsletter/subscribe/

Subscribe to newsletter.

**Request:**

```json
{ "email": "user@example.com" }
```

### POST /api/price-alerts/

Create a price drop alert. Requires authentication.

**Request:**

```json
{
  "product_id": 1,
  "target_price": "200.00"
}
```

### GET /api/health/

Health check endpoint.

### GET /sitemap.xml

XML sitemap for SEO.

---

## Rate Limiting

- Anonymous: 100 requests/hour
- Authenticated: 1000 requests/hour
- Auth endpoints: 3-10 requests/minute (varies by endpoint)

## Error Responses

All errors follow a consistent format:

```json
{
  "error": "Error message",
  "details": { ... }
}
```

Common HTTP status codes:

- `200` — Success
- `201` — Created
- `400` — Bad Request (validation error)
- `401` — Unauthorized (missing/invalid token)
- `403` — Forbidden (insufficient permissions)
- `404` — Not Found
- `429` — Too Many Requests (rate limited)
- `500` — Internal Server Error
