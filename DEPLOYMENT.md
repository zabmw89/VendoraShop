# VendoraShop — Deployment Guide

## Quick Deploy (one command / one click)

The fastest paths to a running instance:

**Docker Compose (single-image app + PostgreSQL):**

```bash
docker compose up --build
docker compose exec app python manage.py seed_demo_data   # demo catalog + users
# open http://localhost:8000
```

The image builds the React SPA and serves it together with the Django API from
one Gunicorn process (static assets via WhiteNoise).

**Render Blueprint (one-click live demo):** push this repo to GitHub and choose
**New → Blueprint** in Render, pointing at [`render.yaml`](render.yaml). Render
provisions PostgreSQL, builds the SPA, runs migrations, seeds demo data, and
exposes a public URL. Sign in with the published demo credentials (README →
"Demo Credentials").

The rest of this guide covers a manual VM-style deployment.

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ (recommended for production)
- Redis (optional, for caching)

## Environment Variables

### Backend (backend/.env)

```bash
DJANGO_ENV=production
DEBUG=False
SECRET_KEY=<generate-a-secure-32-char-key>
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DATABASE_URL=postgres://user:pass@localhost:5432/vendorashop
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# Email (SMTP)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# OAuth (optional)
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx

# Payment (optional — Stripe)
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx      # from the Stripe Dashboard → Webhooks
PAYMENT_CURRENCY=USD

# Demo seeding (optional)
DEMO_MODE=false
# DEMO_ADMIN_PASSWORD=change-me
# DEMO_CUSTOMER_PASSWORD=change-me
```

### Stripe webhook setup

Register a webhook endpoint in the Stripe Dashboard pointing at
`https://yourdomain.com/api/payments/webhook/stripe/` and subscribe to
`payment_intent.succeeded`, `payment_intent.payment_failed`, and
`charge.refunded`. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

### Frontend (frontend/.env)

```bash
VITE_API_URL=https://yourdomain.com/api
```

## Deployment Steps

### 1. Clone Repository

```bash
git clone https://github.com/zabmw89/VendoraShop.git
cd VendoraShop
```

### 2. Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Create superuser
python manage.py createsuperuser

# (Optional) Seed demo data
DEMO_MODE=true python manage.py seed_demo_data
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run build
```

### 4. Configure Web Server (Nginx)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /path/to/VendoraShop/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django admin
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Static files
    location /static/ {
        alias /path/to/VendoraShop/backend/staticfiles/;
    }

    # Media files
    location /media/ {
        alias /path/to/VendoraShop/backend/media/;
    }

    # Sitemap
    location /sitemap.xml {
        proxy_pass http://127.0.0.1:8000;
    }
}
```

### 5. Run Backend Server

**Using Gunicorn (recommended):**

```bash
cd backend
source .venv/bin/activate
gunicorn config.wsgi:application \
  --bind 127.0.0.1:8000 \
  --workers 4 \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -
```

**Using systemd service:**

```ini
[Unit]
Description=VendoraShop Django Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/VendoraShop/backend
Environment="DJANGO_ENV=production"
Environment="SECRET_KEY=your-secret-key"
ExecStart=/path/to/VendoraShop/backend/.venv/bin/gunicorn config.wsgi:application --bind 127.0.0.1:8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

### 6. Enable HTTPS

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Docker Deployment (Alternative)

### Dockerfile (backend)

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
RUN python manage.py collectstatic --noinput

EXPOSE 8000
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4"]
```

### Dockerfile (frontend)

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
COPY index.html .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

## Monitoring & Logging

### View Logs

```bash
# Django logs (if using systemd)
journalctl -u vendorashop -f

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Health Check

```bash
curl https://yourdomain.com/api/health/
```

## Backup Strategy

### Database Backup

```bash
# PostgreSQL
pg_dump vendorashop > backup_$(date +%Y%m%d).sql

# Restore
psql vendorashop < backup_20260827.sql
```

### Media Files Backup

```bash
rsync -avz backend/media/ /backup/media/
```

## Performance Tuning

### Database

- Use PostgreSQL in production (not SQLite)
- Enable connection pooling (PgBouncer)
- Add database indexes (already included in migrations)

### Caching

- Enable Redis for Django cache backend
- Use CDN for static files and images

### Security

- Enable HSTS (already configured in production.py)
- Use strong SECRET_KEY (32+ characters)
- Regular security updates
- Firewall rules (only allow 80, 443, 22)

## Troubleshooting

### 502 Bad Gateway

- Check if Gunicorn is running: `systemctl status vendorashop`
- Check Gunicorn logs: `journalctl -u vendorashop -n 50`

### Static Files Not Loading

- Run `python manage.py collectstatic`
- Check Nginx configuration for `/static/` location

### CORS Errors

- Verify `CORS_ALLOWED_ORIGINS` includes your frontend domain
- Check browser console for specific CORS error

### Database Connection Error

- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running: `systemctl status postgresql`
- Test connection: `psql $DATABASE_URL`
