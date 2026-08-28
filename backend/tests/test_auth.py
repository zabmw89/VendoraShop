from django.test import TestCase  # pyright: ignore[reportMissingImports]
from django.contrib.auth.models import User
from apps.accounts.models import EmailVerification


class AuthTestCase(TestCase):
    def setUp(self):
        self.register_url = '/api/auth/register/'
        self.login_url = '/api/auth/login/'
        self.verify_url = '/api/auth/verify-email/'
        self.change_password_url = '/api/auth/change-password/'

    def test_user_registration_creates_verification_code(self):
        payload = {
            'name': 'John Doe',
            'email': 'john@example.com',
            'password': 'securepassword123',
            'phone': '+1234567890'
        }
        response = self.client.post(self.register_url, payload, content_type='application/json')
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data.get('requires_verification'))

        user = User.objects.get(email='john@example.com')
        self.assertFalse(user.profile.is_email_verified)
        self.assertTrue(EmailVerification.objects.filter(user=user, is_used=False).exists())

    def test_unverified_user_login_blocked(self):
        user = User.objects.create_user(username='unverified@example.com', email='unverified@example.com', password='securepassword123')
        user.profile.is_email_verified = False
        user.profile.save()

        payload = {
            'email': 'unverified@example.com',
            'password': 'securepassword123'
        }
        response = self.client.post(self.login_url, payload, content_type='application/json')
        self.assertEqual(response.status_code, 403)
        self.assertTrue(response.data.get('requires_verification'))

    def test_verify_email_success(self):
        user = User.objects.create_user(username='verify@example.com', email='verify@example.com', password='securepassword123')
        user.profile.is_email_verified = False
        user.profile.save()

        from apps.accounts.utils import create_verification_code
        code, _ = create_verification_code(user)

        response = self.client.post(self.verify_url, {'email': 'verify@example.com', 'code': code}, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('token', response.data)

        user.refresh_from_db()
        self.assertTrue(user.profile.is_email_verified)

    def test_verify_email_invalid_code(self):
        user = User.objects.create_user(username='badcode@example.com', email='badcode@example.com', password='securepassword123')
        response = self.client.post(self.verify_url, {'email': 'badcode@example.com', 'code': '000000'}, content_type='application/json')
        self.assertEqual(response.status_code, 400)

    def test_verified_user_login(self):
        user = User.objects.create_user(username='verified@example.com', email='verified@example.com', password='securepassword123')
        user.profile.is_email_verified = True
        user.profile.save()

        payload = {
            'email': 'verified@example.com',
            'password': 'securepassword123'
        }
        response = self.client.post(self.login_url, payload, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('token', response.data)
        self.assertIn('refresh', response.data)

    def test_change_password(self):
        user = User.objects.create_user(username='pwchange@example.com', email='pwchange@example.com', password='oldpassword123')
        user.profile.is_email_verified = True
        user.profile.save()

        # Login to get JWT token
        login_res = self.client.post(self.login_url, {'email': 'pwchange@example.com', 'password': 'oldpassword123'}, content_type='application/json')
        token = login_res.data['token']

        # Change password — must include current_password
        change_res = self.client.post(
            self.change_password_url,
            {'current_password': 'oldpassword123', 'new_password': 'brandnewpassword123', 'confirm_password': 'brandnewpassword123'},
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {token}'
        )
        self.assertEqual(change_res.status_code, 200)

        # Login with new password
        new_login_res = self.client.post(self.login_url, {'email': 'pwchange@example.com', 'password': 'brandnewpassword123'}, content_type='application/json')
        self.assertEqual(new_login_res.status_code, 200)

    def test_change_password_wrong_current_password(self):
        user = User.objects.create_user(username='pwwrong@example.com', email='pwwrong@example.com', password='correctpassword123')
        user.profile.is_email_verified = True
        user.profile.save()

        login_res = self.client.post(self.login_url, {'email': 'pwwrong@example.com', 'password': 'correctpassword123'}, content_type='application/json')
        token = login_res.data['token']

        change_res = self.client.post(
            self.change_password_url,
            {'current_password': 'wrongpassword', 'new_password': 'brandnewpassword123', 'confirm_password': 'brandnewpassword123'},
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {token}'
        )
        self.assertEqual(change_res.status_code, 400)

    def test_rejects_duplicate_email_registration(self):
        # Register first user
        payload = {
            'name': 'First User',
            'email': 'duplicate@example.com',
            'password': 'securepassword123'
        }
        res1 = self.client.post(self.register_url, payload, content_type='application/json')
        self.assertEqual(res1.status_code, 201)

        # Attempt to register with the same email
        payload2 = {
            'name': 'Second User',
            'email': 'duplicate@example.com',
            'password': 'anotherpassword123'
        }
        res2 = self.client.post(self.register_url, payload2, content_type='application/json')
        self.assertEqual(res2.status_code, 400)

    def test_rejects_duplicate_email_case_insensitive(self):
        # Register with lowercase
        payload = {
            'name': 'Lower User',
            'email': 'CaseTest@Example.com',
            'password': 'securepassword123'
        }
        res1 = self.client.post(self.register_url, payload, content_type='application/json')
        self.assertEqual(res1.status_code, 201)

        # Register with different casing — should be rejected
        payload2 = {
            'name': 'Upper User',
            'email': 'casetest@example.com',
            'password': 'anotherpassword123'
        }
        res2 = self.client.post(self.register_url, payload2, content_type='application/json')
        self.assertEqual(res2.status_code, 400)


class ThrottleTestCase(TestCase):
    """Test that the custom exception handler formats 429 responses correctly."""

    def test_429_handler_returns_friendly_json(self):
        """The custom exception handler formats Throttled exceptions into user-friendly JSON."""
        from rest_framework.exceptions import Throttled
        from config.exceptions import custom_exception_handler

        exc = Throttled(wait=120.0)
        context = {'view': None, 'request': None}
        response = custom_exception_handler(exc, context)

        self.assertEqual(response.status_code, 429)
        self.assertEqual(response.data['error'], 'rate_limit_exceeded')
        self.assertIn('retry_after_seconds', response.data)
        self.assertEqual(response.data['retry_after_seconds'], 120)
        self.assertIn('Too many requests', response.data['message'])
        self.assertIn('2 minutes', response.data['message'])

    def test_429_handler_with_login_scope(self):
        """When a LoginView is throttled, the endpoint name says 'sign in'."""
        from rest_framework.exceptions import Throttled
        from config.exceptions import custom_exception_handler
        from apps.accounts.views import LoginView

        exc = Throttled(wait=30.0)
        context = {'view': LoginView(), 'request': None}
        response = custom_exception_handler(exc, context)

        self.assertEqual(response.status_code, 429)
        self.assertIn('sign in', response.data['message'])

    def test_429_handler_with_forgot_password_scope(self):
        """When ForgotPasswordView is throttled, the endpoint name says 'request a password reset'."""
        from rest_framework.exceptions import Throttled
        from config.exceptions import custom_exception_handler
        from apps.accounts.views import ForgotPasswordView

        exc = Throttled(wait=45.0)
        context = {'view': ForgotPasswordView(), 'request': None}
        response = custom_exception_handler(exc, context)

        self.assertEqual(response.status_code, 429)
        self.assertIn('request a password reset', response.data['message'])

    def test_429_handler_unknown_scope(self):
        """Unknown scope shows generic endpoint name."""
        from rest_framework.exceptions import Throttled
        from config.exceptions import custom_exception_handler

        exc = Throttled(wait=60.0)
        context = {'view': None, 'request': None}
        response = custom_exception_handler(exc, context)

        self.assertEqual(response.status_code, 429)
        self.assertIn('this action', response.data['message'])
