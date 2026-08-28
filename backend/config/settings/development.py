"""
Development settings for VendoraShop.
Used when DJANGO_ENV=development or DEBUG=True.
"""
from .base import *  # noqa: F401,F403

DEBUG = True

# Dev-only secret key (NOT for production)
if not SECRET_KEY:  # noqa: F405
    SECRET_KEY = 'django-insecure-DEV-ONLY-key-do-not-use-in-production-' + 'x' * 30

ALLOWED_HOSTS = ['*']

# CORS — allow all origins in development
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# Console email backend (prints to terminal)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Relax throttling in development so local reloads and diagnostics don't
# trigger 429s, while keeping the production throttle classes configured.
REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    'DEFAULT_THROTTLE_RATES': {
        'anon': '10000/hour',
        'user': '100000/hour',
        'auth_login': '1000/minute',
        'auth_register': '500/minute',
        'auth_forgot_password': '500/minute',
        'auth_reset_password': '1000/minute',
        'auth_verify_email': '2000/minute',
        'auth_resend_verification': '500/minute',
        'auth_social_login': '2000/minute',
    },
}