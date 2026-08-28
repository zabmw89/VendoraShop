"""
Production settings for VendoraShop.
Used when DJANGO_ENV=production.

SECURITY REQUIREMENTS:
- SECRET_KEY must be set via environment variable (at least 32 chars)
- DEBUG must be False
- ALLOWED_HOSTS must be explicitly set
- DATABASE_URL should point to PostgreSQL
"""

import sys
from .base import *  # noqa: F401,F403

DEBUG = False

# ---------------------------------------------------------------------------
# Static files via WhiteNoise (so a single service can serve the built SPA
# and Django API together — used by the live demo / Docker / Render deploy).
# ---------------------------------------------------------------------------
MIDDLEWARE.insert(  # noqa: F405
    MIDDLEWARE.index('django.middleware.security.SecurityMiddleware') + 1,  # noqa: F405
    'whitenoise.middleware.WhiteNoiseMiddleware',
)

STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}

# The built React app (frontend `npm run build` → dist/) is collected into
# STATIC_ROOT and served as the SPA. See config/spa.py for the fallback view.
SPA_DIST_DIR = BASE_DIR.parent / 'dist'  # noqa: F405
WHITENOISE_ROOT = SPA_DIST_DIR if SPA_DIST_DIR.exists() else None

# SECRET_KEY is REQUIRED in production
if not SECRET_KEY:  # noqa: F405
    print("FATAL: SECRET_KEY environment variable is required in production.", file=sys.stderr)
    sys.exit(1)
elif len(SECRET_KEY) < 32:
    print("FATAL: SECRET_KEY must be at least 32 characters in production.", file=sys.stderr)
    sys.exit(1)

# ALLOWED_HOSTS must be explicitly configured
if not ALLOWED_HOSTS or ALLOWED_HOSTS == ['']:  # noqa: F405
    print("FATAL: ALLOWED_HOSTS must be set in production.", file=sys.stderr)
    sys.exit(1)

# ---------------------------------------------------------------------------
# Security hardening
# ---------------------------------------------------------------------------
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# HTTPS settings (enable when behind a reverse proxy with SSL)
SECURE_SSL_REDIRECT = False  # Set True when behind HTTPS proxy
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# ---------------------------------------------------------------------------
# CORS — strict in production
# ---------------------------------------------------------------------------
import os
CORS_ALLOWED_ORIGINS = os.environ.get(
    'CORS_ALLOWED_ORIGINS', ''
).split(',') if os.environ.get('CORS_ALLOWED_ORIGINS') else []
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True

# ---------------------------------------------------------------------------
# Email — use SMTP in production
# ---------------------------------------------------------------------------
EMAIL_BACKEND = os.environ.get(
    'EMAIL_BACKEND',
    'django.core.mail.backends.smtp.EmailBackend'
)
