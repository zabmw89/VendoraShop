"""
Tests for management commands: create_admin, create_superuser, seed_demo_data.
"""
import os
from io import StringIO
from unittest.mock import patch

from django.test import TestCase
from django.contrib.auth.models import User
from django.core.management import call_command
from django.core.management.base import CommandError

from apps.accounts.models import UserProfile


class CreateAdminCommandTest(TestCase):
    """Tests for the create_admin management command."""

    def test_create_admin_with_password(self):
        """Creating an admin with explicit password succeeds."""
        out = StringIO()
        call_command(
            'create_admin',
            email='testadmin@example.com',
            password='SecurePass123!',
            stdout=out,
        )
        user = User.objects.get(email='testadmin@example.com')
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertEqual(user.profile.role, 'admin')
        self.assertTrue(user.profile.is_email_verified)
        self.assertTrue(user.check_password('SecurePass123!'))
        self.assertIn('Admin user created successfully', out.getvalue())

    def test_create_admin_generates_random_password(self):
        """Creating an admin without a password generates a random one."""
        out = StringIO()
        call_command('create_admin', email='random@example.com', stdout=out)
        user = User.objects.get(email='random@example.com')
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertIn('Generated random password', out.getvalue())
        self.assertIn('Save this now', out.getvalue())

    def test_create_admin_rejects_duplicate_email(self):
        """Creating an admin with an existing email raises CommandError."""
        User.objects.create_user(
            username='dup@example.com', email='dup@example.com', password='pass123'
        )
        out = StringIO()
        with self.assertRaises(CommandError) as ctx:
            call_command(
                'create_admin', email='dup@example.com', password='x', stdout=out
            )
        self.assertIn('already exists', str(ctx.exception))

    def test_create_admin_custom_names(self):
        """Creating an admin with custom first/last name."""
        out = StringIO()
        call_command(
            'create_admin',
            email='named@example.com',
            password='Pass123!',
            first_name='John',
            last_name='Smith',
            stdout=out,
        )
        user = User.objects.get(email='named@example.com')
        self.assertEqual(user.first_name, 'John')
        self.assertEqual(user.last_name, 'Smith')

    def test_create_admin_default_email(self):
        """When no --email is given, uses default admin@vendorashop.com."""
        out = StringIO()
        call_command('create_admin', password='Pass123!', stdout=out)
        user = User.objects.get(email='admin@vendorashop.com')
        self.assertTrue(user.is_staff)


class CreateSuperuserCommandTest(TestCase):
    """Tests for the create_superuser management command."""

    def test_create_superuser_with_password(self):
        """Creating a superuser with explicit password succeeds."""
        out = StringIO()
        call_command(
            'create_superuser',
            email='super@example.com',
            password='SuperPass123!',
            stdout=out,
        )
        user = User.objects.get(email='super@example.com')
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertEqual(user.profile.role, 'admin')
        self.assertTrue(user.profile.is_email_verified)
        self.assertTrue(user.check_password('SuperPass123!'))
        self.assertIn('Superuser created successfully', out.getvalue())

    def test_create_superuser_assigns_permissions(self):
        """The superuser should have all model permissions assigned."""
        out = StringIO()
        call_command(
            'create_superuser',
            email='perm@example.com',
            password='Pass123!',
            stdout=out,
        )
        user = User.objects.get(email='perm@example.com')
        self.assertGreater(user.user_permissions.count(), 0)
        self.assertIn('Assigned', out.getvalue())

    def test_create_superuser_generates_random_password(self):
        """Creating without a password generates a random one."""
        out = StringIO()
        call_command('create_superuser', email='rand@example.com', stdout=out)
        user = User.objects.get(email='rand@example.com')
        self.assertTrue(user.is_staff)
        self.assertIn('Generated random password', out.getvalue())

    def test_create_superuser_rejects_duplicate_email(self):
        """Duplicate email raises CommandError with upgrade hint."""
        User.objects.create_user(
            username='dup2@example.com', email='dup2@example.com', password='pass'
        )
        out = StringIO()
        with self.assertRaises(CommandError) as ctx:
            call_command(
                'create_superuser', email='dup2@example.com', password='x', stdout=out
            )
        self.assertIn('already exists', str(ctx.exception))
        self.assertIn('--upgrade', str(ctx.exception))

    def test_upgrade_existing_user(self):
        """Upgrading an existing user grants superuser status and permissions."""
        user = User.objects.create_user(
            username='upgrade@example.com',
            email='upgrade@example.com',
            password='OldPass123!',
        )
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

        out = StringIO()
        call_command('create_superuser', upgrade='upgrade@example.com', stdout=out)

        user.refresh_from_db()
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertEqual(user.profile.role, 'admin')
        self.assertTrue(user.profile.is_email_verified)
        self.assertGreater(user.user_permissions.count(), 0)
        self.assertIn('upgraded to superuser', out.getvalue())

    def test_upgrade_nonexistent_user_raises_error(self):
        """Upgrading a user that doesn't exist raises CommandError."""
        out = StringIO()
        with self.assertRaises(CommandError) as ctx:
            call_command('create_superuser', upgrade='ghost@example.com', stdout=out)
        self.assertIn('No user found', str(ctx.exception))

    def test_upgrade_is_case_insensitive(self):
        """Upgrade email lookup should be case-insensitive."""
        user = User.objects.create_user(
            username='Case@Test.com',
            email='Case@Test.com',
            password='Pass123!',
        )
        out = StringIO()
        call_command('create_superuser', upgrade='case@test.com', stdout=out)
        user.refresh_from_db()
        self.assertTrue(user.is_superuser)


class SeedDemoDataCommandTest(TestCase):
    """Tests for the seed_demo_data management command."""

    def test_seed_fails_without_demo_mode(self):
        """Command raises CommandError when DEMO_MODE is not 'true'."""
        out = StringIO()
        with self.assertRaises(CommandError) as ctx:
            call_command('seed_demo_data', stdout=out)
        self.assertIn('DEMO_MODE is not enabled', str(ctx.exception))

    def test_seed_fails_with_demo_mode_false(self):
        """Command raises CommandError when DEMO_MODE is explicitly false."""
        out = StringIO()
        with patch.dict(os.environ, {'DEMO_MODE': 'false'}):
            with self.assertRaises(CommandError):
                call_command('seed_demo_data', stdout=out)

    @patch.dict(os.environ, {'DEMO_MODE': 'true'})
    def test_seed_creates_users(self):
        """When DEMO_MODE=true, admin and customer users are created."""
        out = StringIO()
        call_command('seed_demo_data', stdout=out)
        self.assertTrue(User.objects.filter(email='admin@vendorashop.com').exists())
        self.assertTrue(User.objects.filter(email='alex@example.com').exists())

    @patch.dict(os.environ, {'DEMO_MODE': 'true'})
    def test_seed_creates_admin_with_correct_role(self):
        """The seeded admin has role='admin', is_staff, is_superuser."""
        call_command('seed_demo_data', stdout=StringIO())
        admin = User.objects.get(email='admin@vendorashop.com')
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)
        self.assertEqual(admin.profile.role, 'admin')
        self.assertTrue(admin.profile.is_email_verified)

    @patch.dict(os.environ, {'DEMO_MODE': 'true'})
    def test_seed_creates_customer_with_correct_role(self):
        """The seeded customer has role='customer' and is verified."""
        call_command('seed_demo_data', stdout=StringIO())
        customer = User.objects.get(email='alex@example.com')
        self.assertEqual(customer.profile.role, 'customer')
        self.assertTrue(customer.profile.is_email_verified)
        self.assertEqual(customer.first_name, 'Alex')

    @patch.dict(os.environ, {'DEMO_MODE': 'true'})
    def test_seed_creates_categories(self):
        """Categories are seeded with correct slugs."""
        call_command('seed_demo_data', stdout=StringIO())
        from apps.products.models import Category
        self.assertTrue(Category.objects.filter(slug='electronics').exists())
        self.assertTrue(Category.objects.filter(slug='audio').exists())
        self.assertTrue(Category.objects.filter(slug='wearables').exists())
        self.assertEqual(Category.objects.count(), 6)

    @patch.dict(os.environ, {'DEMO_MODE': 'true'})
    def test_seed_creates_products(self):
        """Products are seeded with correct slugs and prices."""
        call_command('seed_demo_data', stdout=StringIO())
        from apps.products.models import Product
        headphones = Product.objects.get(slug='aeropulse-anc-wireless-headphones')
        self.assertEqual(float(headphones.price), 249.99)
        self.assertTrue(headphones.is_featured)
        self.assertGreaterEqual(Product.objects.count(), 21)

    @patch.dict(os.environ, {'DEMO_MODE': 'true'})
    def test_seed_is_idempotent(self):
        """Running seed twice doesn't duplicate users or products."""
        call_command('seed_demo_data', stdout=StringIO())
        from apps.products.models import Product, Category
        user_count = User.objects.count()
        product_count = Product.objects.count()
        category_count = Category.objects.count()

        call_command('seed_demo_data', stdout=StringIO())
        self.assertEqual(User.objects.count(), user_count)
        self.assertEqual(Product.objects.count(), product_count)
        self.assertEqual(Category.objects.count(), category_count)

    @patch.dict(os.environ, {'DEMO_MODE': 'true', 'DEMO_ADMIN_PASSWORD': 'EnvAdmin123!'})
    def test_seed_uses_env_password_for_admin(self):
        """Admin password comes from DEMO_ADMIN_PASSWORD env var."""
        call_command('seed_demo_data', stdout=StringIO())
        admin = User.objects.get(email='admin@vendorashop.com')
        self.assertTrue(admin.check_password('EnvAdmin123!'))

    @patch.dict(os.environ, {'DEMO_MODE': 'true', 'DEMO_CUSTOMER_PASSWORD': 'EnvCust123!'})
    def test_seed_uses_env_password_for_customer(self):
        """Customer password comes from DEMO_CUSTOMER_PASSWORD env var."""
        call_command('seed_demo_data', stdout=StringIO())
        customer = User.objects.get(email='alex@example.com')
        self.assertTrue(customer.check_password('EnvCust123!'))

    @patch.dict(os.environ, {'DEMO_MODE': 'true'})
    def test_seed_outputs_success_message(self):
        """Seed command outputs success message."""
        out = StringIO()
        call_command('seed_demo_data', stdout=out)
        self.assertIn('Demo data seeded successfully', out.getvalue())

    @patch.dict(os.environ, {'DEMO_MODE': 'true'})
    def test_seed_always_sets_password_for_new_users(self):
        """New users always have a password set (not None)."""
        call_command('seed_demo_data', stdout=StringIO())
        admin = User.objects.get(email='admin@vendorashop.com')
        customer = User.objects.get(email='alex@example.com')
        # Users should have usable passwords
        self.assertTrue(admin.has_usable_password())
        self.assertTrue(customer.has_usable_password())
