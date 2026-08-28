"""
Tests for MeView (GET /api/auth/me/) and ProfileUpdateView (PUT /api/auth/profile/).
Covers authentication, all field updates, edge cases, and data persistence.
"""
from django.test import TestCase
from django.contrib.auth.models import User


class MeViewTest(TestCase):
    """Tests for GET /api/auth/me/."""

    def setUp(self):
        self.url = '/api/auth/me/'
        self.user = User.objects.create_user(
            username='meuser@test.com',
            email='meuser@test.com',
            password='Pass123!',
            first_name='Me',
            last_name='User',
        )
        self.user.profile.is_email_verified = True
        self.user.profile.phone = '+15551111111'
        self.user.profile.address = '123 Main St'
        self.user.profile.avatar = 'https://example.com/avatar.jpg'
        self.user.profile.save()

    def _get_token(self):
        res = self.client.post('/api/auth/login/', {
            'email': 'meuser@test.com', 'password': 'Pass123!',
        }, content_type='application/json')
        return res.data['token']

    def test_me_returns_user_data(self):
        """Authenticated GET /me/ returns full user profile."""
        token = self._get_token()
        res = self.client.get(self.url, HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(res.status_code, 200)

        user = res.data['user']
        self.assertEqual(user['email'], 'meuser@test.com')
        self.assertEqual(user['first_name'], 'Me')
        self.assertEqual(user['last_name'], 'User')
        self.assertEqual(user['name'], 'Me User')
        self.assertEqual(user['role'], 'customer')
        self.assertTrue(user['is_email_verified'])
        self.assertEqual(user['phone'], '+15551111111')
        self.assertEqual(user['address'], '123 Main St')
        self.assertEqual(user['avatar'], 'https://example.com/avatar.jpg')
        self.assertIn('date_joined', user)

    def test_me_without_token_returns_401(self):
        """Unauthenticated GET /me/ returns 401."""
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, 401)

    def test_me_with_invalid_token_returns_401(self):
        """GET /me/ with a garbage token returns 401."""
        res = self.client.get(self.url, HTTP_AUTHORIZATION='Bearer invalid.token.here')
        self.assertEqual(res.status_code, 401)

    def test_me_with_empty_bearer_returns_401(self):
        """GET /me/ with empty Bearer value returns 401."""
        res = self.client.get(self.url, HTTP_AUTHORIZATION='Bearer ')
        self.assertEqual(res.status_code, 401)

    def test_me_without_bearer_prefix_returns_401(self):
        """GET /me/ without 'Bearer ' prefix returns 401."""
        token = self._get_token()
        res = self.client.get(self.url, HTTP_AUTHORIZATION=token)
        self.assertEqual(res.status_code, 401)

    def test_me_user_id_is_integer(self):
        """User ID in the response is the database integer ID."""
        token = self._get_token()
        res = self.client.get(self.url, HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(res.data['user']['id'], self.user.id)

    def test_me_returns_name_as_full_name(self):
        """The 'name' field concatenates first_name and last_name."""
        token = self._get_token()
        res = self.client.get(self.url, HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(res.data['user']['name'], 'Me User')

    def test_me_with_single_name(self):
        """When user has only first_name, 'name' returns just that."""
        user2 = User.objects.create_user(
            username='single@test.com', email='single@test.com',
            password='Pass123!', first_name='Cher',
        )
        user2.profile.is_email_verified = True
        user2.profile.save()

        res = self.client.post('/api/auth/login/', {
            'email': 'single@test.com', 'password': 'Pass123!',
        }, content_type='application/json')
        token = res.data['token']

        me = self.client.get(self.url, HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(me.data['user']['name'], 'Cher')
        self.assertEqual(me.data['user']['first_name'], 'Cher')
        self.assertEqual(me.data['user']['last_name'], '')

    def test_me_with_no_name_falls_back_to_username(self):
        """When user has no first_name or last_name, 'name' falls back to username."""
        user2 = User.objects.create_user(
            username='noname@test.com', email='noname@test.com',
            password='Pass123!',
        )
        user2.profile.is_email_verified = True
        user2.profile.save()

        res = self.client.post('/api/auth/login/', {
            'email': 'noname@test.com', 'password': 'Pass123!',
        }, content_type='application/json')
        token = res.data['token']

        me = self.client.get(self.url, HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(me.data['user']['name'], 'noname@test.com')

    def test_me_shows_admin_role(self):
        """Admin users see role='admin' in /me/."""
        self.user.profile.role = 'admin'
        self.user.profile.save()

        token = self._get_token()
        res = self.client.get(self.url, HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(res.data['user']['role'], 'admin')


class ProfileUpdateViewTest(TestCase):
    """Tests for PUT /api/auth/profile/."""

    def setUp(self):
        self.url = '/api/auth/profile/'
        self.user = User.objects.create_user(
            username='update@test.com',
            email='update@test.com',
            password='Pass123!',
            first_name='Original',
            last_name='Name',
        )
        self.user.profile.is_email_verified = True
        self.user.profile.phone = '+15550000000'
        self.user.profile.address = 'Old Address'
        self.user.profile.save()

    def _get_token(self):
        res = self.client.post('/api/auth/login/', {
            'email': 'update@test.com', 'password': 'Pass123!',
        }, content_type='application/json')
        return res.data['token']

    def _auth_headers(self, token):
        return {'HTTP_AUTHORIZATION': f'Bearer {token}'}

    # ── Authentication ───────────────────────────────────────────────────────

    def test_update_without_token_returns_401(self):
        """Unauthenticated PUT /profile/ returns 401."""
        res = self.client.put(self.url, {'name': 'Hacker'}, content_type='application/json')
        self.assertEqual(res.status_code, 401)

    def test_update_with_invalid_token_returns_401(self):
        """PUT /profile/ with garbage token returns 401."""
        res = self.client.put(self.url, {'name': 'Hacker'},
                              content_type='application/json',
                              HTTP_AUTHORIZATION='Bearer fake.token.value')
        self.assertEqual(res.status_code, 401)

    # ── Name updates ─────────────────────────────────────────────────────────

    def test_update_name(self):
        """Updating 'name' splits into first_name and last_name."""
        token = self._get_token()
        res = self.client.put(self.url, {'name': 'Jane Doe'},
                              content_type='application/json', **self._auth_headers(token))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['user']['first_name'], 'Jane')
        self.assertEqual(res.data['user']['last_name'], 'Doe')
        self.assertEqual(res.data['user']['name'], 'Jane Doe')

    def test_update_name_single_word(self):
        """Single-word name sets first_name, clears last_name."""
        token = self._get_token()
        res = self.client.put(self.url, {'name': 'Cher'},
                              content_type='application/json', **self._auth_headers(token))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['user']['first_name'], 'Cher')
        self.assertEqual(res.data['user']['last_name'], '')

    def test_update_name_strips_outer_whitespace(self):
        """Leading/trailing whitespace on the full name string is stripped."""
        token = self._get_token()
        # The view does .strip().split(' ', 1) so outer whitespace is removed,
        # but extra internal spacing after the split point is preserved.
        res = self.client.put(self.url, {'name': '  John   Smith  '},
                              content_type='application/json', **self._auth_headers(token))
        self.assertEqual(res.status_code, 200)
        # '  John   Smith  '.strip() -> 'John   Smith'.split(' ', 1) -> ['John', '  Smith']
        self.assertEqual(res.data['user']['first_name'], 'John')
        self.assertEqual(res.data['user']['last_name'], '  Smith')

    def test_update_name_with_multiple_spaces(self):
        """Name with multiple words takes first as first_name, rest as last_name."""
        token = self._get_token()
        res = self.client.put(self.url, {'name': 'Mary Jane Watson'},
                              content_type='application/json', **self._auth_headers(token))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['user']['first_name'], 'Mary')
        self.assertEqual(res.data['user']['last_name'], 'Jane Watson')

    def test_update_name_clears_previous_last_name(self):
        """Updating name from full name to single word clears last_name."""
        token = self._get_token()

        # First set a two-part name
        self.client.put(self.url, {'name': 'Old Last'},
                        content_type='application/json', **self._auth_headers(token))

        # Now set single-word name
        res = self.client.put(self.url, {'name': 'NewFirst'},
                              content_type='application/json', **self._auth_headers(token))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['user']['first_name'], 'NewFirst')
        self.assertEqual(res.data['user']['last_name'], '')

    def test_name_persists_in_me(self):
        """Name updated via /profile/ is visible on GET /me/."""
        token = self._get_token()
        self.client.put(self.url, {'name': 'Persisted Name'},
                        content_type='application/json', **self._auth_headers(token))

        me = self.client.get('/api/auth/me/', **self._auth_headers(token))
        self.assertEqual(me.data['user']['first_name'], 'Persisted')
        self.assertEqual(me.data['user']['last_name'], 'Name')

    # ── Phone updates ────────────────────────────────────────────────────────

    def test_update_phone(self):
        """Phone number can be updated."""
        token = self._get_token()
        res = self.client.put(self.url, {'phone': '+15559999999'},
                              content_type='application/json', **self._auth_headers(token))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['user']['phone'], '+15559999999')

    def test_update_phone_empty_string(self):
        """Phone can be set to empty string (clearing it)."""
        token = self._get_token()
        res = self.client.put(self.url, {'phone': ''},
                              content_type='application/json', **self._auth_headers(token))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['user']['phone'], '')

    def test_phone_persists_in_me(self):
        """Phone updated via /profile/ is visible on GET /me/."""
        token = self._get_token()
        self.client.put(self.url, {'phone': '+442071234567'},
                        content_type='application/json', **self._auth_headers(token))

        me = self.client.get('/api/auth/me/', **self._auth_headers(token))
        self.assertEqual(me.data['user']['phone'], '+442071234567')

    # ── Address updates ──────────────────────────────────────────────────────

    def test_update_address(self):
        """Address can be updated."""
        token = self._get_token()
        res = self.client.put(self.url, {'address': '789 New Street, New City'},
                              content_type='application/json', **self._auth_headers(token))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['user']['address'], '789 New Street, New City')

    def test_update_address_empty_string(self):
        """Address can be cleared to empty string."""
        token = self._get_token()
        res = self.client.put(self.url, {'address': ''},
                              content_type='application/json', **self._auth_headers(token))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['user']['address'], '')

    def test_update_address_non_string_converted(self):
        """Non-string address values are converted to string."""
        token = self._get_token()
        res = self.client.put(self.url, {'address': 12345},
                              content_type='application/json', **self._auth_headers(token))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['user']['address'], '12345')

    def test_address_persists_in_me(self):
        """Address updated via /profile/ is visible on GET /me/."""
        token = self._get_token()
        self.client.put(self.url, {'address': '42 Wallaby Way, Sydney'},
                        content_type='application/json', **self._auth_headers(token))

        me = self.client.get('/api/auth/me/', **self._auth_headers(token))
        self.assertEqual(me.data['user']['address'], '42 Wallaby Way, Sydney')

    # ── Combined updates ─────────────────────────────────────────────────────

    def test_update_all_fields_at_once(self):
        """All three fields can be updated in a single request."""
        token = self._get_token()
        res = self.client.put(self.url, {
            'name': 'Full Update',
            'phone': '+18005550199',
            'address': '100 All Fields Blvd',
        }, content_type='application/json', **self._auth_headers(token))

        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['user']['first_name'], 'Full')
        self.assertEqual(res.data['user']['last_name'], 'Update')
        self.assertEqual(res.data['user']['phone'], '+18005550199')
        self.assertEqual(res.data['user']['address'], '100 All Fields Blvd')

    def test_update_only_name_others_unchanged(self):
        """Updating name does not affect phone or address."""
        token = self._get_token()
        res = self.client.put(self.url, {'name': 'Only Name'},
                              content_type='application/json', **self._auth_headers(token))

        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['user']['first_name'], 'Only')
        self.assertEqual(res.data['user']['last_name'], 'Name')
        # Phone and address should remain unchanged
        self.assertEqual(res.data['user']['phone'], '+15550000000')
        self.assertEqual(res.data['user']['address'], 'Old Address')

    def test_update_only_phone_others_unchanged(self):
        """Updating phone does not affect name or address."""
        token = self._get_token()
        res = self.client.put(self.url, {'phone': '+15557777777'},
                              content_type='application/json', **self._auth_headers(token))

        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['user']['phone'], '+15557777777')
        self.assertEqual(res.data['user']['first_name'], 'Original')
        self.assertEqual(res.data['user']['last_name'], 'Name')
        self.assertEqual(res.data['user']['address'], 'Old Address')

    def test_update_only_address_others_unchanged(self):
        """Updating address does not affect name or phone."""
        token = self._get_token()
        res = self.client.put(self.url, {'address': 'Only Address Changed'},
                              content_type='application/json', **self._auth_headers(token))

        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['user']['address'], 'Only Address Changed')
        self.assertEqual(res.data['user']['first_name'], 'Original')
        self.assertEqual(res.data['user']['last_name'], 'Name')
        self.assertEqual(res.data['user']['phone'], '+15550000000')

    # ── Empty / no-op updates ────────────────────────────────────────────────

    def test_empty_body_returns_success(self):
        """PUT with empty body returns success (no fields to update, but valid)."""
        token = self._get_token()
        res = self.client.put(self.url, {}, content_type='application/json',
                              **self._auth_headers(token))
        self.assertEqual(res.status_code, 200)
        self.assertIn('Profile updated', res.data['message'])

    def test_empty_body_does_not_change_anything(self):
        """PUT with empty body does not modify any existing field."""
        token = self._get_token()
        self.client.put(self.url, {}, content_type='application/json',
                        **self._auth_headers(token))

        me = self.client.get('/api/auth/me/', **self._auth_headers(token))
        self.assertEqual(me.data['user']['first_name'], 'Original')
        self.assertEqual(me.data['user']['last_name'], 'Name')
        self.assertEqual(me.data['user']['phone'], '+15550000000')
        self.assertEqual(me.data['user']['address'], 'Old Address')

    def test_unknown_fields_ignored(self):
        """Extra unknown fields in the request are silently ignored."""
        token = self._get_token()
        res = self.client.put(self.url, {
            'name': 'Valid Name',
            'unknown_field': 'should be ignored',
            'email': 'should-not-change@test.com',
        }, content_type='application/json', **self._auth_headers(token))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['user']['first_name'], 'Valid')
        self.assertEqual(res.data['user']['email'], 'update@test.com')

    # ── Repeated updates ─────────────────────────────────────────────────────

    def test_repeated_updates_persist_latest(self):
        """Multiple sequential updates — only the latest values persist."""
        token = self._get_token()
        headers = self._auth_headers(token)

        # First update
        self.client.put(self.url, {'name': 'First Update', 'phone': '+11111111111'},
                        content_type='application/json', **headers)

        # Second update
        self.client.put(self.url, {'name': 'Second Update', 'phone': '+22222222222'},
                        content_type='application/json', **headers)

        me = self.client.get('/api/auth/me/', **headers)
        self.assertEqual(me.data['user']['first_name'], 'Second')
        self.assertEqual(me.data['user']['last_name'], 'Update')
        self.assertEqual(me.data['user']['phone'], '+22222222222')

    def test_update_changes_reflected_immediately(self):
        """Changes are visible on the very next request (no cache)."""
        token = self._get_token()
        headers = self._auth_headers(token)

        self.client.put(self.url, {'name': 'Immediate Change'},
                        content_type='application/json', **headers)

        me = self.client.get('/api/auth/me/', **headers)
        self.assertEqual(me.data['user']['first_name'], 'Immediate')

    # ── Different users are isolated ─────────────────────────────────────────

    def test_update_does_not_affect_other_users(self):
        """Updating one user's profile does not touch another user's data."""
        user2 = User.objects.create_user(
            username='other@test.com', email='other@test.com',
            password='Pass456!', first_name='Other', last_name='Person',
        )
        user2.profile.is_email_verified = True
        user2.profile.phone = '+19999999999'
        user2.profile.save()

        token = self._get_token()
        self.client.put(self.url, {'name': 'Changed Name', 'phone': '+15551111111'},
                        content_type='application/json', **self._auth_headers(token))

        # user2 should be unaffected
        user2.refresh_from_db()
        self.assertEqual(user2.first_name, 'Other')
        self.assertEqual(user2.profile.phone, '+19999999999')
