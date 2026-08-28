"""
Settings package — selects the appropriate settings module based on DJANGO_ENV.

Usage:
    export DJANGO_ENV=development  # or production
    # Django will use config.settings.development or config.settings.production
"""

import os

DJANGO_ENV = os.environ.get('DJANGO_ENV', 'development')

if DJANGO_ENV == 'production':
    from .production import *  # noqa: F401,F403
else:
    from .development import *  # noqa: F401,F403
