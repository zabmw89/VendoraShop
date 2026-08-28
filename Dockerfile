# syntax=docker/dockerfile:1
#
# Single-image deploy for VendoraShop.
# Stage 1 builds the React SPA; stage 2 runs Django (API + SPA) via Gunicorn,
# serving the compiled frontend with WhiteNoise. One container = whole app.

# ---------------------------------------------------------------------------
# Stage 1 — build the React frontend
# ---------------------------------------------------------------------------
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build   # → /app/dist

# ---------------------------------------------------------------------------
# Stage 2 — Django backend + compiled SPA
# ---------------------------------------------------------------------------
FROM python:3.12-slim AS backend
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_ENV=production

WORKDIR /app/backend

# System deps for psycopg2 / argon2 build wheels
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Backend source
COPY backend/ ./
# Compiled SPA from stage 1 (settings.SPA_DIST_DIR = <repo>/dist)
COPY --from=frontend /app/dist /app/dist

# Collect static assets (SPA + Django admin) for WhiteNoise.
# A throwaway SECRET_KEY/ALLOWED_HOSTS satisfies production settings at build time.
RUN DJANGO_ENV=production \
    SECRET_KEY=build-time-only-key-build-time-only-key-123456 \
    ALLOWED_HOSTS=localhost \
    python manage.py collectstatic --noinput

EXPOSE 8000

# Run migrations, then serve. Override CMD to skip migrations if you prefer.
CMD ["sh", "-c", "python manage.py migrate --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120 --access-logfile - --error-logfile -"]
