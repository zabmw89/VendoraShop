"""
Test settings for VendoraShop.
Used for running tests with pytest/management commands.
"""
from .settings import *  # Import base settings

# Override, disable security limiting for local testing
DEBUG = True

# Update CORS settings for local testing
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = False

# Disable Axes in tests
AXES_ENABLED = False
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
]

# Cache settings for tests
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# Disable email sending in tests
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'