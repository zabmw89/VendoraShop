"""Tests for Django ASGI and WSGI entrypoints."""
from django.test import TestCase


class ASGIEntrypointTest(TestCase):
    """Verify the ASGI application object loads correctly."""

    def test_asgi_application_loads(self):
        from config.asgi import application
        self.assertIsNotNone(application)

    def test_asgi_settings_module(self):
        from django.conf import settings
        self.assertIn('config.', settings.SETTINGS_MODULE)


class WSGIEntrypointTest(TestCase):
    """Verify the WSGI application object loads correctly."""

    def test_wsgi_application_loads(self):
        from config.wsgi import application
        self.assertIsNotNone(application)

    def test_wsgi_is_callable(self):
        from config.wsgi import application
        self.assertTrue(callable(application))
