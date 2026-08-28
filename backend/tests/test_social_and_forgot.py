"""
Tests for the untested auth flows:
  - ForgotPasswordView + ResetPasswordView (forgot password flow)
  - ResendVerificationView (re-send email code)
  - SocialLoginView (Google + Apple OAuth)
"""
from datetime import timedelta
from unittest.mock import patch, MagicMock

from django.test import TestCase, override_settings
from django.contrib.auth.models import User
from django.core import mail
from django.utils import timezone

from apps.accounts.models import EmailVerification
from apps.accounts.utils import create_verification_code


# ---------------------------------------------------------------------------
# Forgot Password Flow
# ---------------------------------------------------------------------------
class ForgotPasswordTestCase(TestCase):
    """Tests for POST /api/auth/forgot-password/"""

    def setUp(self):
        self.url = '/api/auth/forgot-password/'
        self.user = User.objects.create_user(
            username='reset@example.com',
            email='reset@example.com',
            password='OldPass123!',
        )
        self.user.profile.is_email_verified = True
        self.user.profile.save()

    @patch('apps.accounts.views.send_password_reset_email')
    def test_forgot_password_existing_user(self, mock_send):
        """Existing user gets a reset code emailed."""
        res = self.client.post(self.url, {'email': 'reset@example.com'}, content_type='application/json')
        self.assertEqual(res.status_code, 200)
        self.assertIn('reset code', res.data['message'])
        mock_send.assert_called_once()

        # A verification code was created
        self.assertTrue(
            EmailVerification.objects.filter(user=self.user, is_used=False).exists()
        )

    def test_forgot_password_nonexistent_email(self):
        """Non-existent email returns same success message (no email enumeration)."""
        res = self.client.post(self.url, {'email': 'ghost@example.com'}, content_type='application/json')
        self.assertEqual(res.status_code, 200)
        self.assertIn('If an account exists', res.data['message'])

    def test_forgot_password_case_insensitive(self):
        """Email lookup is case-insensitive."""
        res = self.client.post(self.url, {'email': 'RESET@Example.COM'}, content_type='application/json')
        self.assertEqual(res.status_code, 200)

    def test_forgot_password_invalid_email_format(self):
        """Invalid email format returns 400."""
        res = self.client.post(self.url, {'email': 'not-an-email'}, content_type='application/json')
        self.assertEqual(res.status_code, 400)

    def test_forgot_password_missing_email(self):
        """Missing email field returns 400."""
        res = self.client.post(self.url, {}, content_type='application/json')
        self.assertEqual(res.status_code, 400)

    @patch('apps.accounts.views.send_password_reset_email')
    def test_forgot_password_invalidates_previous_codes(self, mock_send):
        """Requesting a new reset code invalidates any previous unused codes."""
        code1, _ = create_verification_code(self.user)
        code2, _ = create_verification_code(self.user)
        self.assertFalse(EmailVerification.objects.filter(user=self.user, code=code1, is_used=False).exists())
        self.assertTrue(EmailVerification.objects.filter(user=self.user, code=code2, is_used=False).exists())

    @patch('apps.accounts.views.send_password_reset_email', side_effect=Exception('SMTP down'))
    def test_forgot_password_email_send_failure(self, mock_send):
        """If email sending fails, returns 500."""
        res = self.client.post(self.url, {'email': 'reset@example.com'}, content_type='application/json')
        self.assertEqual(res.status_code, 500)
        self.assertIn('Failed to send', res.data['error'])


# ---------------------------------------------------------------------------
# Reset Password Flow
# ---------------------------------------------------------------------------
class ResetPasswordTestCase(TestCase):
    """Tests for POST /api/auth/reset-password/"""

    def setUp(self):
        self.url = '/api/auth/reset-password/'
        self.user = User.objects.create_user(
            username='resetpw@example.com',
            email='resetpw@example.com',
            password='CurrentPass123!',
        )
        self.user.profile.is_email_verified = True
        self.user.profile.save()

    def _create_code(self):
        code, _ = create_verification_code(self.user)
        return code

    def test_reset_password_success(self):
        """Valid code + matching passwords resets the password and returns JWT."""
        code = self._create_code()
        res = self.client.post(self.url, {
            'email': 'resetpw@example.com',
            'code': code,
            'new_password': 'NewSecure456!',
            'confirm_password': 'NewSecure456!',
        }, content_type='application/json')

        self.assertEqual(res.status_code, 200)
        self.assertIn('token', res.data)
        self.assertIn('refresh', res.data)
        self.assertIn('Password reset successfully', res.data['message'])

        # Refresh from DB to get updated password hash
        self.user.refresh_from_db()
        # Old password no longer works
        self.assertFalse(self.user.check_password('CurrentPass123!'))
        # New password works
        self.assertTrue(self.user.check_password('NewSecure456!'))

    def test_reset_password_code_marked_used(self):
        """After successful reset, the code is marked as used."""
        code = self._create_code()
        self.client.post(self.url, {
            'email': 'resetpw@example.com',
            'code': code,
            'new_password': 'NewSecure456!',
            'confirm_password': 'NewSecure456!',
        }, content_type='application/json')

        verification = EmailVerification.objects.get(user=self.user, code=code)
        self.assertTrue(verification.is_used)

    def test_reset_password_invalid_code(self):
        """Wrong code returns 400."""
        res = self.client.post(self.url, {
            'email': 'resetpw@example.com',
            'code': '000000',
            'new_password': 'NewSecure456!',
            'confirm_password': 'NewSecure456!',
        }, content_type='application/json')
        self.assertEqual(res.status_code, 400)
        self.assertIn('Invalid reset code', res.data['error'])

    def test_reset_password_expired_code(self):
        """Expired code returns 400 with expired flag."""
        code, verification = create_verification_code(self.user)
        verification.expires_at = timezone.now() - timedelta(minutes=1)
        verification.save()

        res = self.client.post(self.url, {
            'email': 'resetpw@example.com',
            'code': code,
            'new_password': 'NewSecure456!',
            'confirm_password': 'NewSecure456!',
        }, content_type='application/json')
        self.assertEqual(res.status_code, 400)
        self.assertTrue(res.data.get('expired'))
        self.assertIn('expired', res.data['error'].lower())

    def test_reset_password_nonexistent_user(self):
        """User not found returns 404."""
        res = self.client.post(self.url, {
            'email': 'nobody@example.com',
            'code': '123456',
            'new_password': 'NewSecure456!',
            'confirm_password': 'NewSecure456!',
        }, content_type='application/json')
        self.assertEqual(res.status_code, 404)

    def test_reset_password_mismatched_passwords(self):
        """Non-matching new_password and confirm_password returns 400."""
        code = self._create_code()
        res = self.client.post(self.url, {
            'email': 'resetpw@example.com',
            'code': code,
            'new_password': 'NewSecure456!',
            'confirm_password': 'DifferentPassword789!',
        }, content_type='application/json')
        self.assertEqual(res.status_code, 400)

    def test_reset_password_used_code_rejected(self):
        """A code that was already used is rejected."""
        code = self._create_code()
        # Use the code once
        self.client.post(self.url, {
            'email': 'resetpw@example.com',
            'code': code,
            'new_password': 'FirstReset123!',
            'confirm_password': 'FirstReset123!',
        }, content_type='application/json')

        # Try to use it again
        res = self.client.post(self.url, {
            'email': 'resetpw@example.com',
            'code': code,
            'new_password': 'SecondReset456!',
            'confirm_password': 'SecondReset456!',
        }, content_type='application/json')
        self.assertEqual(res.status_code, 400)
        self.assertIn('Invalid reset code', res.data['error'])

    def test_reset_password_short_password_rejected(self):
        """Password shorter than 6 chars is rejected by serializer."""
        code = self._create_code()
        res = self.client.post(self.url, {
            'email': 'resetpw@example.com',
            'code': code,
            'new_password': 'short',
            'confirm_password': 'short',
        }, content_type='application/json')
        self.assertEqual(res.status_code, 400)

    def test_reset_password_returns_user_data(self):
        """Successful reset includes user profile data."""
        code = self._create_code()
        res = self.client.post(self.url, {
            'email': 'resetpw@example.com',
            'code': code,
            'new_password': 'NewSecure456!',
            'confirm_password': 'NewSecure456!',
        }, content_type='application/json')
        self.assertIn('user', res.data)
        self.assertEqual(res.data['user']['email'], 'resetpw@example.com')


# ---------------------------------------------------------------------------
# Resend Verification
# ---------------------------------------------------------------------------
class ResendVerificationTestCase(TestCase):
    """Tests for POST /api/auth/resend-verification/"""

    def setUp(self):
        self.url = '/api/auth/resend-verification/'
        self.user = User.objects.create_user(
            username='resend@example.com',
            email='resend@example.com',
            password='Pass123!',
        )
        self.user.profile.is_email_verified = False
        self.user.profile.save()

    @patch('apps.accounts.views.send_verification_email')
    def test_resend_verification_unverified_user(self, mock_send):
        """Unverified user gets a new code."""
        res = self.client.post(self.url, {'email': 'resend@example.com'}, content_type='application/json')
        self.assertEqual(res.status_code, 200)
        self.assertIn('new verification code', res.data['message'])
        mock_send.assert_called_once()

    @patch('apps.accounts.views.send_verification_email')
    def test_resend_verification_already_verified(self, mock_send):
        """Already verified user gets a friendly message, no code sent."""
        self.user.profile.is_email_verified = True
        self.user.profile.save()

        res = self.client.post(self.url, {'email': 'resend@example.com'}, content_type='application/json')
        self.assertEqual(res.status_code, 200)
        self.assertIn('already verified', res.data['message'])
        mock_send.assert_not_called()

    def test_resend_verification_nonexistent_email(self):
        """Non-existent email returns same success message (no enumeration)."""
        res = self.client.post(self.url, {'email': 'ghost@example.com'}, content_type='application/json')
        self.assertEqual(res.status_code, 200)
        self.assertIn('If an account exists', res.data['message'])

    def test_resend_verification_case_insensitive(self):
        """Email lookup is case-insensitive."""
        res = self.client.post(self.url, {'email': 'RESEND@Example.COM'}, content_type='application/json')
        self.assertEqual(res.status_code, 200)

    def test_resend_verification_invalid_email(self):
        """Invalid email format returns 400."""
        res = self.client.post(self.url, {'email': 'bad'}, content_type='application/json')
        self.assertEqual(res.status_code, 400)

    @patch('apps.accounts.views.send_verification_email')
    def test_resend_verification_invalidates_old_codes(self, mock_send):
        """Resending invalidates any previous unused verification codes."""
        old_code, _ = create_verification_code(self.user)

        res = self.client.post(self.url, {'email': 'resend@example.com'}, content_type='application/json')
        self.assertEqual(res.status_code, 200)

        # Old code should now be marked used
        self.assertFalse(
            EmailVerification.objects.filter(user=self.user, code=old_code, is_used=False).exists()
        )
        # A new code exists
        self.assertTrue(
            EmailVerification.objects.filter(user=self.user, is_used=False).exists()
        )

    @patch('apps.accounts.views.send_verification_email', side_effect=Exception('SMTP error'))
    def test_resend_verification_email_send_failure(self, mock_send):
        """If email sending fails, returns 500."""
        res = self.client.post(self.url, {'email': 'resend@example.com'}, content_type='application/json')
        self.assertEqual(res.status_code, 500)
        self.assertIn('Failed to send', res.data['error'])


# ---------------------------------------------------------------------------
# Social Login — Google
# ---------------------------------------------------------------------------
class SocialLoginGoogleTestCase(TestCase):
    """Tests for POST /api/auth/social/login/ with Google provider."""

    def setUp(self):
        self.url = '/api/auth/social/login/'

    @patch('apps.accounts.views.verify_google_token')
    def test_google_login_new_user(self, mock_verify):
        """New Google user is created and returns JWT."""
        mock_verify.return_value = {
            'email': 'newgoogle@example.com',
            'name': 'Jane Google',
            'first_name': 'Jane',
            'last_name': 'Google',
            'picture': 'https://example.com/photo.jpg',
        }

        res = self.client.post(self.url, {
            'provider': 'google',
            'access_token': 'fake-google-token',
        }, content_type='application/json')

        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data['is_new_user'])
        self.assertIn('token', res.data)
        self.assertIn('Account created', res.data['message'])

        user = User.objects.get(email='newgoogle@example.com')
        self.assertTrue(user.profile.is_email_verified)
        self.assertEqual(user.profile.avatar, 'https://example.com/photo.jpg')
        self.assertTrue(user.has_usable_password() is False)

    @patch('apps.accounts.views.verify_google_token')
    def test_google_login_existing_user(self, mock_verify):
        """Existing Google user is signed in (not duplicated)."""
        user = User.objects.create_user(
            username='existing@example.com',
            email='existing@example.com',
            password='socialpass',
        )
        user.profile.is_email_verified = True
        user.profile.save()

        mock_verify.return_value = {
            'email': 'Existing@Example.com',
            'name': 'Existing User',
        }

        res = self.client.post(self.url, {
            'provider': 'google',
            'access_token': 'fake-token',
        }, content_type='application/json')

        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.data['is_new_user'])
        self.assertIn('Signed in', res.data['message'])
        self.assertEqual(User.objects.filter(email__iexact='existing@example.com').count(), 1)

    @patch('apps.accounts.views.verify_google_token')
    def test_google_login_invalid_token(self, mock_verify):
        """Invalid Google token returns 401."""
        mock_verify.return_value = None

        res = self.client.post(self.url, {
            'provider': 'google',
            'access_token': 'bad-token',
        }, content_type='application/json')

        self.assertEqual(res.status_code, 401)
        self.assertIn('Failed to verify', res.data['error'])

    @patch('apps.accounts.views.verify_google_token')
    def test_google_login_token_without_email(self, mock_verify):
        """Google token response without email returns 401."""
        mock_verify.return_value = {'email': '', 'name': 'No Email'}

        res = self.client.post(self.url, {
            'provider': 'google',
            'access_token': 'token-no-email',
        }, content_type='application/json')

        self.assertEqual(res.status_code, 401)

    def test_google_login_missing_access_token(self):
        """Google login without access_token returns 400 (serializer validation)."""
        res = self.client.post(self.url, {
            'provider': 'google',
        }, content_type='application/json')
        self.assertEqual(res.status_code, 400)


# ---------------------------------------------------------------------------
# Social Login — Apple
# ---------------------------------------------------------------------------
class SocialLoginAppleTestCase(TestCase):
    """Tests for POST /api/auth/social/login/ with Apple provider."""

    def setUp(self):
        self.url = '/api/auth/social/login/'

    @patch('apps.accounts.views.verify_apple_token')
    def test_apple_login_new_user(self, mock_verify):
        """New Apple user is created and returns JWT."""
        mock_verify.return_value = {
            'email': 'newapple@example.com',
            'name': 'Jane Apple',
        }

        res = self.client.post(self.url, {
            'provider': 'apple',
            'id_token': 'fake-apple-token',
        }, content_type='application/json')

        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data['is_new_user'])
        self.assertIn('token', res.data)

        user = User.objects.get(email='newapple@example.com')
        self.assertTrue(user.profile.is_email_verified)

    @patch('apps.accounts.views.verify_apple_token')
    def test_apple_login_invalid_token(self, mock_verify):
        """Invalid Apple token returns 401."""
        mock_verify.return_value = None

        res = self.client.post(self.url, {
            'provider': 'apple',
            'id_token': 'bad-token',
        }, content_type='application/json')

        self.assertEqual(res.status_code, 401)

    def test_apple_login_missing_id_token(self):
        """Apple login without id_token returns 400."""
        res = self.client.post(self.url, {
            'provider': 'apple',
        }, content_type='application/json')
        self.assertEqual(res.status_code, 400)


# ---------------------------------------------------------------------------
# Social Login — Edge Cases
# ---------------------------------------------------------------------------
class SocialLoginEdgeCasesTestCase(TestCase):
    """Tests for social login edge cases and unsupported providers."""

    def setUp(self):
        self.url = '/api/auth/social/login/'

    def test_unsupported_provider(self):
        """Non-google/apple provider returns 400."""
        res = self.client.post(self.url, {
            'provider': 'facebook',
            'access_token': 'token',
        }, content_type='application/json')
        self.assertEqual(res.status_code, 400)
        self.assertIn('error', res.data)

    def test_missing_provider(self):
        """Missing provider field returns 400."""
        res = self.client.post(self.url, {
            'access_token': 'token',
        }, content_type='application/json')
        self.assertEqual(res.status_code, 400)

    def test_empty_body(self):
        """Empty request body returns 400."""
        res = self.client.post(self.url, {}, content_type='application/json')
        self.assertEqual(res.status_code, 400)

    @patch('apps.accounts.views.verify_google_token')
    def test_google_login_sets_avatar(self, mock_verify):
        """Google user's avatar is saved on first login."""
        mock_verify.return_value = {
            'email': 'avatar@example.com',
            'name': 'Avatar User',
            'picture': 'https://lh3.googleusercontent.com/photo.jpg',
        }

        self.client.post(self.url, {
            'provider': 'google',
            'access_token': 'token',
        }, content_type='application/json')

        user = User.objects.get(email='avatar@example.com')
        self.assertEqual(user.profile.avatar, 'https://lh3.googleusercontent.com/photo.jpg')

    @patch('apps.accounts.views.verify_google_token')
    def test_google_login_does_not_overwrite_existing_avatar(self, mock_verify):
        """Existing user's avatar is not overwritten by Google photo."""
        user = User.objects.create_user(
            username='hasavatar@example.com',
            email='hasavatar@example.com',
            password='pass123',
        )
        user.profile.avatar = 'https://existing.com/avatar.jpg'
        user.profile.is_email_verified = True
        user.profile.save()

        mock_verify.return_value = {
            'email': 'HasAvatar@example.com',
            'name': 'Has Avatar',
            'picture': 'https://google.com/new-photo.jpg',
        }

        self.client.post(self.url, {
            'provider': 'google',
            'access_token': 'token',
        }, content_type='application/json')

        user.profile.refresh_from_db()
        self.assertEqual(user.profile.avatar, 'https://existing.com/avatar.jpg')
