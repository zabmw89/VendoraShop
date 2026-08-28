"""
End-to-end integration tests for the complete auth lifecycle.
Each test exercises multiple endpoints in sequence — real-world user journeys.
"""
from unittest.mock import patch
from datetime import timedelta

from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone

from apps.accounts.models import EmailVerification


class RegisterVerifyLoginFlowTest(TestCase):
    """Full lifecycle: register → verify email → login → access protected resource."""

    def test_complete_register_verify_login_me_flow(self):
        """
        The happy path every new user goes through:
        register → verify with code → login → GET /me/ returns profile.
        """
        # ── Step 1: Register ──────────────────────────────────────────────
        reg_res = self.client.post('/api/auth/register/', {
            'name': 'Alice Johnson',
            'email': 'alice@vendora.com',
            'password': 'SecurePass123!',
            'phone': '+15551234567',
        }, content_type='application/json')
        self.assertEqual(reg_res.status_code, 201)
        self.assertTrue(reg_res.data['requires_verification'])
        self.assertEqual(reg_res.data['email'], 'alice@vendora.com')

        # User exists but is NOT verified
        user = User.objects.get(email='alice@vendora.com')
        self.assertFalse(user.profile.is_email_verified)
        self.assertEqual(user.first_name, 'Alice')
        self.assertEqual(user.last_name, 'Johnson')
        self.assertEqual(user.profile.phone, '+15551234567')

        # There should be exactly one unused verification code
        codes = EmailVerification.objects.filter(user=user, is_used=False)
        self.assertEqual(codes.count(), 1)
        verification_code = codes.first().code
        self.assertEqual(len(verification_code), 6)
        self.assertTrue(verification_code.isdigit())

        # ── Step 2: Login BEFORE verification → should be blocked ────────
        login_res = self.client.post('/api/auth/login/', {
            'email': 'alice@vendora.com',
            'password': 'SecurePass123!',
        }, content_type='application/json')
        self.assertEqual(login_res.status_code, 403)
        self.assertTrue(login_res.data['requires_verification'])

        # ── Step 3: Verify email with the code ────────────────────────────
        verify_res = self.client.post('/api/auth/verify-email/', {
            'email': 'alice@vendora.com',
            'code': verification_code,
        }, content_type='application/json')
        self.assertEqual(verify_res.status_code, 200)
        self.assertIn('token', verify_res.data)
        self.assertIn('refresh', verify_res.data)
        self.assertIn('Welcome', verify_res.data['message'])
        self.assertEqual(verify_res.data['user']['email'], 'alice@vendora.com')
        self.assertTrue(verify_res.data['user']['is_email_verified'])

        # Code is now marked as used
        codes_after = EmailVerification.objects.filter(user=user, is_used=True)
        self.assertTrue(codes_after.exists())

        # Profile is verified in DB
        user.refresh_from_db()
        self.assertTrue(user.profile.is_email_verified)

        # ── Step 4: Login AFTER verification → should succeed ─────────────
        login2 = self.client.post('/api/auth/login/', {
            'email': 'alice@vendora.com',
            'password': 'SecurePass123!',
        }, content_type='application/json')
        self.assertEqual(login2.status_code, 200)
        self.assertIn('token', login2.data)
        self.assertIn('refresh', login2.data)
        self.assertEqual(login2.data['message'], 'Login successful.')
        self.assertEqual(login2.data['user']['name'], 'Alice Johnson')

        jwt_token = login2.data['token']

        # ── Step 5: Access protected resource (GET /me/) ──────────────────
        me_res = self.client.get('/api/auth/me/', HTTP_AUTHORIZATION=f'Bearer {jwt_token}')
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.data['user']['email'], 'alice@vendora.com')
        self.assertEqual(me_res.data['user']['role'], 'customer')
        self.assertTrue(me_res.data['user']['is_email_verified'])

        # ── Step 6: Access /me/ WITHOUT token → should be 401 ─────────────
        no_auth = self.client.get('/api/auth/me/')
        self.assertEqual(no_auth.status_code, 401)

        # ── Step 7: Logout (discard tokens client-side) ───────────────────
        logout_res = self.client.post('/api/auth/logout/', HTTP_AUTHORIZATION=f'Bearer {jwt_token}')
        self.assertEqual(logout_res.status_code, 200)

        # Old token still technically works (JWT is stateless) but client discards it
        # In a real app, the frontend clears localStorage


class RegisterResendVerifyFlowTest(TestCase):
    """Register → request new code → use the NEW code → login."""

    def test_resend_code_before_verifying(self):
        # Register
        self.client.post('/api/auth/register/', {
            'name': 'Bob Smith',
            'email': 'bob@vendora.com',
            'password': 'Pass123456!',
        }, content_type='application/json')

        user = User.objects.get(email='bob@vendora.com')
        old_code = EmailVerification.objects.filter(user=user, is_used=False).first().code

        # Request a new code
        resend_res = self.client.post('/api/auth/resend-verification/', {
            'email': 'bob@vendora.com',
        }, content_type='application/json')
        self.assertEqual(resend_res.status_code, 200)

        # Old code is now invalidated
        self.assertFalse(
            EmailVerification.objects.filter(user=user, code=old_code, is_used=False).exists()
        )

        # New code exists
        new_verification = EmailVerification.objects.filter(user=user, is_used=False).first()
        self.assertIsNotNone(new_verification)
        new_code = new_verification.code

        # Old code should NOT work
        bad = self.client.post('/api/auth/verify-email/', {
            'email': 'bob@vendora.com',
            'code': old_code,
        }, content_type='application/json')
        self.assertEqual(bad.status_code, 400)

        # New code works
        good = self.client.post('/api/auth/verify-email/', {
            'email': 'bob@vendora.com',
            'code': new_code,
        }, content_type='application/json')
        self.assertEqual(good.status_code, 200)
        self.assertIn('token', good.data)


class ChangePasswordFlowTest(TestCase):
    """Login → change password → login with new password → old password rejected."""

    def _create_verified_user(self, email='changepw@vendora.com', password='OldPass123!'):
        user = User.objects.create_user(
            username=email, email=email, password=password,
        )
        user.profile.is_email_verified = True
        user.profile.save()
        return user

    def _login(self, email, password):
        return self.client.post('/api/auth/login/', {
            'email': email, 'password': password,
        }, content_type='application/json')

    def test_change_password_full_cycle(self):
        user = self._create_verified_user()

        # Login
        login = self._login('changepw@vendora.com', 'OldPass123!')
        self.assertEqual(login.status_code, 200)
        token = login.data['token']

        # Change password
        change = self.client.post('/api/auth/change-password/', {
            'current_password': 'OldPass123!',
            'new_password': 'NewSecure456!',
            'confirm_password': 'NewSecure456!',
        }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(change.status_code, 200)
        self.assertIn('token', change.data)

        # Old password is rejected
        old_login = self._login('changepw@vendora.com', 'OldPass123!')
        self.assertEqual(old_login.status_code, 401)

        # New password works
        new_login = self._login('changepw@vendora.com', 'NewSecure456!')
        self.assertEqual(new_login.status_code, 200)
        self.assertIn('token', new_login.data)

    def test_change_password_mismatched_new_confirm(self):
        self._create_verified_user()
        login = self._login('changepw@vendora.com', 'OldPass123!')
        token = login.data['token']

        res = self.client.post('/api/auth/change-password/', {
            'current_password': 'OldPass123!',
            'new_password': 'NewSecure456!',
            'confirm_password': 'DifferentPass789!',
        }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(res.status_code, 400)

    def test_change_password_same_as_current(self):
        self._create_verified_user()
        login = self._login('changepw@vendora.com', 'OldPass123!')
        token = login.data['token']

        res = self.client.post('/api/auth/change-password/', {
            'current_password': 'OldPass123!',
            'new_password': 'OldPass123!',
            'confirm_password': 'OldPass123!',
        }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(res.status_code, 400)


class ForgotResetPasswordFlowTest(TestCase):
    """Login → forgot password → get code → reset → login with new password → old password rejected."""

    def _create_verified_user(self, email='forgot@vendora.com', password='CurrentPass123!'):
        user = User.objects.create_user(
            username=email, email=email, password=password,
        )
        user.profile.is_email_verified = True
        user.profile.save()
        return user

    def _login(self, email, password):
        return self.client.post('/api/auth/login/', {
            'email': email, 'password': password,
        }, content_type='application/json')

    @patch('apps.accounts.views.send_password_reset_email')
    def test_forgot_password_full_cycle(self, mock_send):
        user = self._create_verified_user()

        # Step 1: Request reset code
        forgot = self.client.post('/api/auth/forgot-password/', {
            'email': 'forgot@vendora.com',
        }, content_type='application/json')
        self.assertEqual(forgot.status_code, 200)
        mock_send.assert_called_once()

        # Step 2: Get the code from DB
        code = EmailVerification.objects.filter(user=user, is_used=False).first().code

        # Step 3: Reset password
        reset = self.client.post('/api/auth/reset-password/', {
            'email': 'forgot@vendora.com',
            'code': code,
            'new_password': 'BrandNewPass789!',
            'confirm_password': 'BrandNewPass789!',
        }, content_type='application/json')
        self.assertEqual(reset.status_code, 200)
        self.assertIn('token', reset.data)
        self.assertIn('Password reset successfully', reset.data['message'])

        # Step 4: Old password rejected
        old = self._login('forgot@vendora.com', 'CurrentPass123!')
        self.assertEqual(old.status_code, 401)

        # Step 5: New password works
        new = self._login('forgot@vendora.com', 'BrandNewPass789!')
        self.assertEqual(new.status_code, 200)

    @patch('apps.accounts.views.send_password_reset_email')
    def test_forgot_password_then_login_before_reset(self, mock_send):
        """User can still log in with old password if they haven't reset yet."""
        user = self._create_verified_user()

        # Request reset code
        self.client.post('/api/auth/forgot-password/', {
            'email': 'forgot@vendora.com',
        }, content_type='application/json')

        # Old password still works — code hasn't been used yet
        login = self._login('forgot@vendora.com', 'CurrentPass123!')
        self.assertEqual(login.status_code, 200)

    @patch('apps.accounts.views.send_password_reset_email')
    def test_old_password_rejected_after_reset(self, mock_send):
        """After a successful password reset, the old password MUST NOT work."""
        OLD = 'OldPass123!'
        NEW = 'BrandNewPass789!'
        user = self._create_verified_user(password=OLD)

        # Step 1: Verify old password works BEFORE reset
        ok = self._login('forgot@vendora.com', OLD)
        self.assertEqual(ok.status_code, 200, 'Old password should work before reset')

        # Step 2: Request reset code
        self.client.post('/api/auth/forgot-password/', {
            'email': 'forgot@vendora.com',
        }, content_type='application/json')

        # Step 3: Old password STILL works (code not yet used)
        still_ok = self._login('forgot@vendora.com', OLD)
        self.assertEqual(still_ok.status_code, 200, 'Old password should work before reset is completed')

        # Step 4: Reset password
        code = EmailVerification.objects.filter(user=user, is_used=False).first().code
        reset = self.client.post('/api/auth/reset-password/', {
            'email': 'forgot@vendora.com',
            'code': code,
            'new_password': NEW,
            'confirm_password': NEW,
        }, content_type='application/json')
        self.assertEqual(reset.status_code, 200)

        # Step 5: OLD PASSWORD NOW REJECTED
        rejected = self._login('forgot@vendora.com', OLD)
        self.assertEqual(rejected.status_code, 401,
                         'Old password MUST be rejected after a successful reset')

        # Step 6: NEW PASSWORD WORKS
        accepted = self._login('forgot@vendora.com', NEW)
        self.assertEqual(accepted.status_code, 200,
                         'New password should work after reset')
        self.assertIn('token', accepted.data)

        # Step 7: DB confirms the hash changed
        user.refresh_from_db()
        self.assertFalse(user.check_password(OLD),
                         'check_password should fail for old password in DB')
        self.assertTrue(user.check_password(NEW),
                        'check_password should pass for new password in DB')

    @patch('apps.accounts.views.send_password_reset_email')
    def test_reset_code_single_use(self, mock_send):
        user = self._create_verified_user()

        # Get code
        self.client.post('/api/auth/forgot-password/', {
            'email': 'forgot@vendora.com',
        }, content_type='application/json')
        code = EmailVerification.objects.filter(user=user, is_used=False).first().code

        # Use it once → success
        first = self.client.post('/api/auth/reset-password/', {
            'email': 'forgot@vendora.com',
            'code': code,
            'new_password': 'FirstReset123!',
            'confirm_password': 'FirstReset123!',
        }, content_type='application/json')
        self.assertEqual(first.status_code, 200)

        # Use it again → rejected
        second = self.client.post('/api/auth/reset-password/', {
            'email': 'forgot@vendora.com',
            'code': code,
            'new_password': 'SecondReset456!',
            'confirm_password': 'SecondReset456!',
        }, content_type='application/json')
        self.assertEqual(second.status_code, 400)


class ProfileUpdateFlowTest(TestCase):
    """Login → update profile → verify changes persist."""

    def _create_verified_user(self):
        user = User.objects.create_user(
            username='profile@vendora.com', email='profile@vendora.com', password='Pass123!',
        )
        user.profile.is_email_verified = True
        user.profile.save()
        return user

    def _get_token(self):
        res = self.client.post('/api/auth/login/', {
            'email': 'profile@vendora.com', 'password': 'Pass123!',
        }, content_type='application/json')
        return res.data['token']

    def test_update_name_phone_address(self):
        self._create_verified_user()
        token = self._get_token()
        headers = {'HTTP_AUTHORIZATION': f'Bearer {token}'}

        # Update profile
        put = self.client.put('/api/auth/profile/', {
            'name': 'Jane Doe',
            'phone': '+15559876543',
            'address': '456 Oak Street, Springfield',
        }, content_type='application/json', **headers)
        self.assertEqual(put.status_code, 200)
        self.assertIn('Profile updated', put.data['message'])

        # Verify via /me/
        me = self.client.get('/api/auth/me/', **headers)
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.data['user']['first_name'], 'Jane')
        self.assertEqual(me.data['user']['last_name'], 'Doe')
        self.assertEqual(me.data['user']['phone'], '+15559876543')
        self.assertEqual(me.data['user']['address'], '456 Oak Street, Springfield')

    def test_update_only_phone(self):
        user = self._create_verified_user()
        token = self._get_token()
        headers = {'HTTP_AUTHORIZATION': f'Bearer {token}'}

        # Update only phone
        put = self.client.put('/api/auth/profile/', {
            'phone': '+15550001111',
        }, content_type='application/json', **headers)
        self.assertEqual(put.status_code, 200)

        # Phone changed, name should be unchanged from the DB
        me = self.client.get('/api/auth/me/', **headers)
        self.assertEqual(me.data['user']['phone'], '+15550001111')
        user.refresh_from_db()
        self.assertEqual(me.data['user']['first_name'], user.first_name)


class SocialLoginIntegrationTest(TestCase):
    """Full social login journey: Google OAuth → access protected resource → logout."""

    @patch('apps.accounts.views.verify_google_token')
    def test_google_login_then_access_me(self, mock_verify):
        mock_verify.return_value = {
            'email': 'google.user@gmail.com',
            'name': 'Google User',
            'first_name': 'Google',
            'last_name': 'User',
            'picture': 'https://example.com/pic.jpg',
        }

        # Step 1: Social login (creates account)
        social = self.client.post('/api/auth/social/login/', {
            'provider': 'google',
            'access_token': 'fake-google-oauth-token',
        }, content_type='application/json')
        self.assertEqual(social.status_code, 200)
        self.assertTrue(social.data['is_new_user'])
        token = social.data['token']

        user = User.objects.get(email='google.user@gmail.com')
        self.assertTrue(user.profile.is_email_verified)
        self.assertTrue(user.has_usable_password() is False)
        self.assertEqual(user.profile.avatar, 'https://example.com/pic.jpg')

        # Step 2: Access /me/ with the token
        me = self.client.get('/api/auth/me/', HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.data['user']['email'], 'google.user@gmail.com')
        self.assertEqual(me.data['user']['role'], 'customer')

        # Step 3: Second login returns is_new_user=False
        social2 = self.client.post('/api/auth/social/login/', {
            'provider': 'google',
            'access_token': 'fake-google-oauth-token',
        }, content_type='application/json')
        self.assertEqual(social2.status_code, 200)
        self.assertFalse(social2.data['is_new_user'])
        self.assertIn('Signed in', social2.data['message'])

        # Only one user created
        self.assertEqual(User.objects.filter(email__iexact='google.user@gmail.com').count(), 1)


class JWTTokenRefreshTest(TestCase):
    """Verify that the JWT refresh endpoint works with a refresh token."""

    def test_token_refresh_returns_new_access_token(self):
        # Create and verify a user
        user = User.objects.create_user(
            username='jwt@vendora.com', email='jwt@vendora.com', password='Pass123!',
        )
        user.profile.is_email_verified = True
        user.profile.save()

        # Login to get access + refresh tokens
        login = self.client.post('/api/auth/login/', {
            'email': 'jwt@vendora.com', 'password': 'Pass123!',
        }, content_type='application/json')
        refresh_token = login.data['refresh']

        # Use refresh token to get a new access token
        refresh = self.client.post('/api/auth/token/refresh/', {
            'refresh': refresh_token,
        }, content_type='application/json')
        self.assertEqual(refresh.status_code, 200)
        self.assertIn('access', refresh.data)

        # New access token works
        new_token = refresh.data['access']
        me = self.client.get('/api/auth/me/', HTTP_AUTHORIZATION=f'Bearer {new_token}')
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.data['user']['email'], 'jwt@vendora.com')

    def test_invalid_refresh_token_rejected(self):
        res = self.client.post('/api/auth/token/refresh/', {
            'refresh': 'definitely-not-a-valid-token',
        }, content_type='application/json')
        self.assertEqual(res.status_code, 401)


class RegistrationValidationTest(TestCase):
    """Edge cases around registration input validation."""

    def test_register_missing_name(self):
        res = self.client.post('/api/auth/register/', {
            'email': 'noname@test.com',
            'password': 'Pass123!',
        }, content_type='application/json')
        self.assertEqual(res.status_code, 400)

    def test_register_missing_email(self):
        res = self.client.post('/api/auth/register/', {
            'name': 'No Email',
            'password': 'Pass123!',
        }, content_type='application/json')
        self.assertEqual(res.status_code, 400)

    def test_register_missing_password(self):
        res = self.client.post('/api/auth/register/', {
            'name': 'No Password',
            'email': 'nopass@test.com',
        }, content_type='application/json')
        self.assertEqual(res.status_code, 400)

    def test_register_short_password(self):
        res = self.client.post('/api/auth/register/', {
            'name': 'Short Pass',
            'email': 'short@test.com',
            'password': '12345',
        }, content_type='application/json')
        self.assertEqual(res.status_code, 400)

    def test_register_invalid_email(self):
        res = self.client.post('/api/auth/register/', {
            'name': 'Bad Email',
            'email': 'not-an-email',
            'password': 'Pass123!',
        }, content_type='application/json')
        self.assertEqual(res.status_code, 400)

    def test_register_empty_body(self):
        res = self.client.post('/api/auth/register/', {}, content_type='application/json')
        self.assertEqual(res.status_code, 400)


class LoginValidationTest(TestCase):
    """Edge cases around login input validation."""

    def test_login_wrong_password(self):
        user = User.objects.create_user(
            username='login@test.com', email='login@test.com', password='Correct123!',
        )
        user.profile.is_email_verified = True
        user.profile.save()

        res = self.client.post('/api/auth/login/', {
            'email': 'login@test.com', 'password': 'WrongPassword!',
        }, content_type='application/json')
        self.assertEqual(res.status_code, 401)

    def test_login_nonexistent_email(self):
        res = self.client.post('/api/auth/login/', {
            'email': 'nobody@test.com', 'password': 'Pass123!',
        }, content_type='application/json')
        self.assertEqual(res.status_code, 401)

    def test_login_missing_fields(self):
        res = self.client.post('/api/auth/login/', {}, content_type='application/json')
        self.assertEqual(res.status_code, 400)

    def test_login_case_insensitive_email(self):
        user = User.objects.create_user(
            username='case@test.com', email='case@test.com', password='Pass123!',
        )
        user.profile.is_email_verified = True
        user.profile.save()

        res = self.client.post('/api/auth/login/', {
            'email': 'Case@Test.Com', 'password': 'Pass123!',
        }, content_type='application/json')
        self.assertEqual(res.status_code, 200)


class VerifyEmailEdgeCasesTest(TestCase):
    """Edge cases around email verification."""

    def test_verify_with_no_code_for_user(self):
        """Verify endpoint for a user that hasn't registered yet returns 404."""
        res = self.client.post('/api/auth/verify-email/', {
            'email': 'ghost@test.com',
            'code': '123456',
        }, content_type='application/json')
        self.assertEqual(res.status_code, 404)

    def test_verify_already_verified_user(self):
        """Already verified user with a valid code — code is still consumed."""
        user = User.objects.create_user(
            username='already@test.com', email='already@test.com', password='Pass123!',
        )
        user.profile.is_email_verified = True
        user.profile.save()

        from apps.accounts.utils import create_verification_code
        code, _ = create_verification_code(user)

        res = self.client.post('/api/auth/verify-email/', {
            'email': 'already@test.com',
            'code': code,
        }, content_type='application/json')
        # Should still succeed (code is valid even if user is already verified)
        self.assertEqual(res.status_code, 200)

    def test_verify_code_wrong_length(self):
        """Code that's too short is rejected by serializer."""
        user = User.objects.create_user(
            username='short@test.com', email='short@test.com', password='Pass123!',
        )

        res = self.client.post('/api/auth/verify-email/', {
            'email': 'short@test.com',
            'code': '123',
        }, content_type='application/json')
        self.assertEqual(res.status_code, 400)
