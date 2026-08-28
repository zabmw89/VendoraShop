"""
Per-endpoint rate throttles for authentication views.

These complement django-axes (brute-force lockout) and the global DRF throttle.
Each throttle scopes by IP + endpoint so a flood on /login/ doesn't consume
the budget for /register/ or /forgot-password/.

Rates are intentionally aggressive for unauthenticated endpoints to prevent
email bombing and credential stuffing.
"""
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class LoginThrottle(AnonRateThrottle):
    """5 attempts/minute per IP — prevents credential stuffing."""
    scope = 'auth_login'


class RegisterThrottle(AnonRateThrottle):
    """3 registrations/minute per IP — prevents spam account creation."""
    scope = 'auth_register'


class ForgotPasswordThrottle(AnonRateThrottle):
    """3 requests/minute per IP — prevents email bombing via reset codes."""
    scope = 'auth_forgot_password'


class ResetPasswordThrottle(AnonRateThrottle):
    """5 attempts/minute per IP — allows retries but limits brute-force on reset codes."""
    scope = 'auth_reset_password'


class VerifyEmailThrottle(AnonRateThrottle):
    """10 attempts/minute per IP — allows retries on code entry."""
    scope = 'auth_verify_email'


class ResendVerificationThrottle(AnonRateThrottle):
    """3 requests/minute per IP — prevents email bombing via resend."""
    scope = 'auth_resend_verification'


class SocialLoginThrottle(AnonRateThrottle):
    """10 requests/minute per IP — social OAuth has its own provider-side limits."""
    scope = 'auth_social_login'
