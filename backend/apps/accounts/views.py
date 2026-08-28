"""
Authentication views — secure implementation.
No bypass tokens, no hardcoded passwords, no magic strings.
Every credential check goes through Django's authenticate() against real stored hashes.
"""
import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken

from django.contrib.auth import authenticate
from django.contrib.auth.models import User

from .models import EmailVerification
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    LoginSerializer,
    VerifyEmailSerializer,
    ResendVerificationSerializer,
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    SocialLoginSerializer,
)
from .utils import (
    create_verification_code,
    send_verification_email,
    send_password_reset_email,
    verify_google_token,
    verify_apple_token,
)
from .throttles import (
    LoginThrottle,
    RegisterThrottle,
    ForgotPasswordThrottle,
    ResetPasswordThrottle,
    VerifyEmailThrottle,
    ResendVerificationThrottle,
    SocialLoginThrottle,
)

logger = logging.getLogger(__name__)


def _get_tokens_for_user(user):
    """Generate JWT access + refresh tokens for a user using simplejwt."""
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


class RegisterView(APIView):
    """
    Register a new user account.
    After registration, a 6-digit verification code is emailed.
    The user must verify their email before logging in.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [RegisterThrottle]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            # Generate and send verification code
            code, _ = create_verification_code(user)
            try:
                send_verification_email(user, code)
            except Exception:
                logger.error(f"Failed to send verification email during registration for {user.email}")

            return Response({
                'message': 'Account created. Please check your email for a verification code.',
                'email': user.email,
                'requires_verification': True,
            }, status=status.HTTP_201_CREATED)

        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """
    Authenticate with email + password.
    Issues JWT tokens only if the email is verified.
    No bypass tokens, no magic passwords, no blanket overrides.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [LoginThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'error': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email'].lower()
        password = serializer.validated_data['password']

        try:
            user_obj = User.objects.get(email__iexact=email)
            username = user_obj.username
        except User.DoesNotExist:
            logger.warning(f"Login attempt for non-existent email: {email}")
            return Response({'error': 'Invalid email or password credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        user = authenticate(request, username=username, password=password)
        if user is None:
            logger.warning(f"Failed login attempt for: {email}")
            return Response({'error': 'Invalid email or password credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        # Check email verification
        if not user.profile.is_email_verified:
            return Response({
                'error': 'Please verify your email address before signing in.',
                'requires_verification': True,
                'email': user.email,
            }, status=status.HTTP_403_FORBIDDEN)

        tokens = _get_tokens_for_user(user)
        user_data = UserSerializer(user).data

        return Response({
            'user': user_data,
            'token': tokens['access'],
            'refresh': tokens['refresh'],
            'message': 'Login successful.'
        })


class VerifyEmailView(APIView):
    """
    Verify email with the 6-digit code sent during registration.
    Issues JWT tokens on successful verification.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [VerifyEmailThrottle]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email'].lower()
        code = serializer.validated_data['code']

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({'error': 'No account found with this email.'}, status=status.HTTP_404_NOT_FOUND)

        # Find valid, unused verification code
        verification = EmailVerification.objects.filter(
            user=user,
            code=code,
            is_used=False,
        ).order_by('-created_at').first()

        if not verification:
            return Response({'error': 'Invalid verification code.'}, status=status.HTTP_400_BAD_REQUEST)

        if verification.is_expired():
            return Response({
                'error': 'Verification code has expired. Please request a new one.',
                'expired': True,
            }, status=status.HTTP_400_BAD_REQUEST)

        # Mark code as used and user as verified
        verification.is_used = True
        verification.save()

        profile = user.profile
        profile.is_email_verified = True
        profile.save()

        # Issue JWT tokens
        tokens = _get_tokens_for_user(user)
        user_data = UserSerializer(user).data

        return Response({
            'user': user_data,
            'token': tokens['access'],
            'refresh': tokens['refresh'],
            'message': 'Email verified successfully. Welcome to Vendora!'
        })


class ResendVerificationView(APIView):
    """Resend a new 6-digit verification code to the user's email."""
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ResendVerificationThrottle]

    def post(self, request):
        serializer = ResendVerificationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email'].lower()

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            # Don't reveal whether the email exists
            return Response({'message': 'If an account exists with that email, a new code has been sent.'})

        if user.profile.is_email_verified:
            return Response({'message': 'Email is already verified. You can sign in.'})

        code, _ = create_verification_code(user)
        try:
            send_verification_email(user, code)
        except Exception:
            return Response(
                {'error': 'Failed to send verification email. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response({'message': 'A new verification code has been sent to your email.'})


class LogoutView(APIView):
    """Log out — client should discard their JWT tokens."""

    def post(self, request):
        return Response({'message': 'Logged out successfully.'})


class MeView(APIView):
    """Return the currently authenticated user's profile."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({'user': UserSerializer(request.user).data})


class ProfileUpdateView(APIView):
    """Update profile fields (name, phone, address)."""
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request):
        user = request.user
        data = request.data

        if 'name' in data:
            parts = data['name'].strip().split(' ', 1)
            user.first_name = parts[0]
            user.last_name = parts[1] if len(parts) > 1 else ''
            user.save()

        profile = user.profile
        if 'phone' in data:
            profile.phone = data['phone']
        if 'address' in data:
            profile.address = data['address'] if isinstance(data['address'], str) else str(data['address'])
        profile.save()

        return Response({
            'user': UserSerializer(user).data,
            'message': 'Profile updated successfully.'
        })


class ChangePasswordView(APIView):
    """
    Change password — requires current_password + new_password + confirm_password.
    Uses Django's set_password() which handles proper hashing.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()

        # Issue fresh tokens since password change invalidates old ones
        tokens = _get_tokens_for_user(user)

        return Response({
            'message': 'Password changed successfully.',
            'token': tokens['access'],
            'refresh': tokens['refresh'],
        })


class ForgotPasswordView(APIView):
    """
    Send a password reset code to the user's email.
    Always returns success to prevent email enumeration.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ForgotPasswordThrottle]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email'].lower()

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            # Don't reveal whether the email exists
            return Response({'message': 'If an account exists with that email, a reset code has been sent.'})

        code, _ = create_verification_code(user)
        try:
            send_password_reset_email(user, code)
        except Exception:
            logger.error(f"Failed to send password reset email to {user.email}")
            return Response(
                {'error': 'Failed to send reset email. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response({'message': 'A password reset code has been sent to your email.'})


class ResetPasswordView(APIView):
    """
    Verify the reset code and set a new password.
    Issues fresh JWT tokens on success.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ResetPasswordThrottle]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email'].lower()
        code = serializer.validated_data['code']

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({'error': 'No account found with this email.'}, status=status.HTTP_404_NOT_FOUND)

        # Find valid, unused verification code
        verification = EmailVerification.objects.filter(
            user=user,
            code=code,
            is_used=False,
        ).order_by('-created_at').first()

        if not verification:
            return Response({'error': 'Invalid reset code.'}, status=status.HTTP_400_BAD_REQUEST)

        if verification.is_expired():
            return Response({
                'error': 'Reset code has expired. Please request a new one.',
                'expired': True,
            }, status=status.HTTP_400_BAD_REQUEST)

        # Mark code as used
        verification.is_used = True
        verification.save()

        # Set the new password
        user.set_password(serializer.validated_data['new_password'])
        user.save()

        # Issue fresh tokens
        tokens = _get_tokens_for_user(user)
        user_data = UserSerializer(user).data

        return Response({
            'user': user_data,
            'token': tokens['access'],
            'refresh': tokens['refresh'],
            'message': 'Password reset successfully. You are now signed in.'
        })


class SocialLoginView(APIView):
    """
    Handle Google and Apple social login.
    Verifies the OAuth token with the provider, creates or retrieves the user,
    and issues JWT tokens.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [SocialLoginThrottle]

    def post(self, request):
        serializer = SocialLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        provider = serializer.validated_data['provider']

        if provider == 'google':
            user_info = verify_google_token(serializer.validated_data.get('access_token', ''))
        elif provider == 'apple':
            user_info = verify_apple_token(serializer.validated_data.get('id_token', ''))
        else:
            return Response({'error': 'Unsupported provider.'}, status=status.HTTP_400_BAD_REQUEST)

        if not user_info or not user_info.get('email'):
            return Response(
                {'error': f'Failed to verify {provider} credentials. Please try again.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        email = user_info['email'].lower()

        # Get or create the user
        user, created = User.objects.get_or_create(
            email__iexact=email,
            defaults={
                'username': email,
                'email': email,
                'first_name': user_info.get('first_name', user_info.get('name', '').split(' ')[0] if user_info.get('name') else ''),
                'last_name': user_info.get('last_name', ''),
            }
        )

        if created:
            # Set an unusable password for social-only accounts
            user.set_unusable_password()
            user.save()

        # Mark email as verified for social logins (provider verified it)
        profile = user.profile
        if not profile.is_email_verified:
            profile.is_email_verified = True
        if user_info.get('picture') and not profile.avatar:
            profile.avatar = user_info['picture']
        profile.save()

        tokens = _get_tokens_for_user(user)
        user_data = UserSerializer(user).data

        return Response({
            'user': user_data,
            'token': tokens['access'],
            'refresh': tokens['refresh'],
            'message': f'{"Account created" if created else "Signed in"} via {provider.title()}.',
            'is_new_user': created,
        })
