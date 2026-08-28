"""
Custom DRF exception handler.

Wraps DRF's default handler to provide user-friendly error responses,
especially for rate limiting (429) and common auth errors.
"""
from rest_framework.views import exception_handler
from rest_framework.exceptions import Throttled
from rest_framework.response import Response
from rest_framework import status


# Friendly names for throttle scopes shown to the user
THROTTLE_ENDPOINT_NAMES = {
    'auth_login': 'sign in',
    'auth_register': 'register',
    'auth_forgot_password': 'request a password reset',
    'auth_reset_password': 'reset your password',
    'auth_verify_email': 'verify your email',
    'auth_resend_verification': 'resend a verification code',
    'auth_social_login': 'sign in with a social account',
}


def custom_exception_handler(exc, context):
    """
    Custom exception handler that wraps DRF's default handler
    and formats throttle errors with user-friendly messages.
    """
    response = exception_handler(exc, context)

    # Handle throttle errors specifically
    if isinstance(exc, Throttled):
        wait_seconds = int(exc.wait) if exc.wait else 60
        wait_minutes = max(1, wait_seconds // 60)
        wait_display = f'{wait_minutes} minute{"s" if wait_minutes != 1 else ""}' if wait_minutes >= 1 else f'{wait_seconds} seconds'

        # Try to identify which endpoint was throttled from the view
        scope = ''
        view = context.get('view')
        if view and hasattr(view, 'get_throttles'):
            for throttle in view.get_throttles():
                if hasattr(throttle, 'scope'):
                    scope = throttle.scope

        endpoint_name = THROTTLE_ENDPOINT_NAMES.get(scope, 'this action')

        return Response(
            {
                'error': 'rate_limit_exceeded',
                'message': f'Too many requests. Please wait {wait_display} before trying to {endpoint_name} again.',
                'retry_after_seconds': wait_seconds,
                'detail': 'You have exceeded the allowed number of attempts. This is a temporary limit to protect your account.',
            },
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    # For other DRF exceptions, reformat if needed
    if response is not None:
        # Flatten common error shapes for frontend consistency
        if isinstance(response.data, dict) and 'detail' in response.data:
            response.data = {
                'error': 'request_error',
                'message': str(response.data['detail']),
                'detail': response.data['detail'],
            }

    return response
