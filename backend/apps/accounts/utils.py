"""
Utility functions for account verification and social authentication.
No bypass tokens, no hardcoded credentials, no magic strings.
"""
import secrets
import logging
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags

import requests

logger = logging.getLogger(__name__)


def generate_verification_code():
    """Generate a cryptographically secure 6-digit verification code."""
    return f"{secrets.randbelow(1000000):06d}"


def send_verification_email(user, code):
    """
    Send email verification code to the user.
    Uses Django's email backend — console in dev, SMTP in production.
    """
    subject = 'Vendora Shop — Verify Your Email Address'
    message_plain = (
        f"Hi {user.first_name or user.username},\n\n"
        f"Welcome to Vendora! Your verification code is:\n\n"
        f"    {code}\n\n"
        f"This code expires in 15 minutes.\n\n"
        f"If you didn't create an account, you can safely ignore this email.\n\n"
        f"— The Vendora Team"
    )
    message_html = (
        f'<div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">'
        f'<div style="text-align: center; margin-bottom: 24px;">'
        f'<div style="display: inline-block; width: 48px; height: 48px; border-radius: 16px; '
        f'background: linear-gradient(135deg, #1d4ed8, #4f46e5); color: white; font-size: 20px; '
        f'font-weight: bold; line-height: 48px;">V</div>'
        f'</div>'
        f'<h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 8px;">Verify Your Email</h2>'
        f'<p style="font-size: 14px; color: #64748b; margin: 0 0 24px;">Hi {user.first_name or user.username}, '
        f'enter the code below to complete your registration:</p>'
        f'<div style="background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; '
        f'text-align: center; margin-bottom: 24px;">'
        f'<span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1e40af;">{code}</span>'
        f'</div>'
        f'<p style="font-size: 12px; color: #94a3b8; margin: 0;">This code expires in 15 minutes. '
        f'If you didn\'t create an account, ignore this email.</p>'
        f'</div>'
    )

    try:
        send_mail(
            subject=subject,
            message=message_plain,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=message_html,
            fail_silently=False,
        )
        logger.info(f"Verification email sent to {user.email}")
    except Exception as e:
        logger.error(f"Failed to send verification email to {user.email}: {e}")
        raise


def send_password_reset_email(user, code):
    """
    Send password reset code to the user.
    Uses Django's email backend — console in dev, SMTP in production.
    """
    subject = 'Vendora Shop — Reset Your Password'
    message_plain = (
        f"Hi {user.first_name or user.username},\n\n"
        f"We received a request to reset your password.\n\n"
        f"Your password reset code is:\n\n"
        f"    {code}\n\n"
        f"This code expires in 15 minutes.\n\n"
        f"If you didn't request a password reset, you can safely ignore this email.\n\n"
        f"— The Vendora Team"
    )
    message_html = (
        f'<div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">'
        f'<div style="text-align: center; margin-bottom: 24px;">'
        f'<div style="display: inline-block; width: 48px; height: 48px; border-radius: 16px; '
        f'background: linear-gradient(135deg, #dc2626, #ea580c); color: white; font-size: 20px; '
        f'font-weight: bold; line-height: 48px;">V</div>'
        f'</div>'
        f'<h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 8px;">Reset Your Password</h2>'
        f'<p style="font-size: 14px; color: #64748b; margin: 0 0 24px;">Hi {user.first_name or user.username}, '
        f'enter the code below to set a new password:</p>'
        f'<div style="background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; '
        f'text-align: center; margin-bottom: 24px;">'
        f'<span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #dc2626;">{code}</span>'
        f'</div>'
        f'<p style="font-size: 12px; color: #94a3b8; margin: 0;">This code expires in 15 minutes. '
        f'If you didn\'t request a password reset, ignore this email.</p>'
        f'</div>'
    )

    try:
        send_mail(
            subject=subject,
            message=message_plain,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=message_html,
            fail_silently=False,
        )
        logger.info(f"Password reset email sent to {user.email}")
    except Exception as e:
        logger.error(f"Failed to send password reset email to {user.email}: {e}")
        raise


def create_verification_code(user):
    """Create a new email verification code for a user."""
    from .models import EmailVerification

    # Invalidate any existing unused codes for this user
    EmailVerification.objects.filter(user=user, is_used=False).update(is_used=True)

    code = generate_verification_code()
    verification = EmailVerification.objects.create(
        user=user,
        code=code,
        expires_at=timezone.now() + timedelta(minutes=15),
    )

    return code, verification


def verify_google_token(access_token):
    """
    Verify a Google OAuth2 access token and return user info.
    Calls Google's userinfo endpoint to validate the token.
    Returns dict with email, name, etc. or None on failure.
    """
    try:
        response = requests.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            headers={'Authorization': f'Bearer {access_token}'},
            timeout=10,
        )
        if response.status_code != 200:
            logger.warning(f"Google token verification failed: HTTP {response.status_code}")
            return None

        data = response.json()
        if not data.get('email'):
            logger.warning("Google token response missing email")
            return None

        return {
            'email': data['email'],
            'name': data.get('name', ''),
            'first_name': data.get('given_name', ''),
            'last_name': data.get('family_name', ''),
            'picture': data.get('picture', ''),
            'email_verified': data.get('email_verified', False),
        }
    except requests.RequestException as e:
        logger.error(f"Google token verification error: {e}")
        return None


def verify_apple_token(id_token):
    """
    Verify an Apple Sign In ID token.
    Decodes the JWT and validates against Apple's public keys.
    Returns dict with email and name or None on failure.
    """
    import jwt

    try:
        # Fetch Apple's public keys
        response = requests.get(
            'https://appleid.apple.com/auth/keys',
            timeout=10,
        )
        if response.status_code != 200:
            logger.warning(f"Failed to fetch Apple public keys: HTTP {response.status_code}")
            return None

        apple_keys = response.json()

        # Decode the token header to find the key ID
        unverified_header = jwt.get_unverified_header(id_token)
        kid = unverified_header.get('kid')

        # Find the matching public key
        key_data = None
        for key in apple_keys.get('keys', []):
            if key['kid'] == kid:
                key_data = key
                break

        if not key_data:
            logger.warning("No matching Apple public key found")
            return None

        # Construct the public key and verify the token
        public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key_data)
        decoded = jwt.decode(
            id_token,
            public_key,
            algorithms=['RS256'],
            audience=settings.SOCIALACCOUNT_PROVIDERS.get('apple', {}).get('APP', {}).get('client_id', ''),
            issuer='https://appleid.apple.com',
        )

        return {
            'email': decoded.get('email', ''),
            'name': decoded.get('name', ''),
            'email_verified': decoded.get('email_verified', False),
        }
    except jwt.PyJWTError as e:
        logger.error(f"Apple token verification error: {e}")
        return None
    except requests.RequestException as e:
        logger.error(f"Apple public key fetch error: {e}")
        return None
