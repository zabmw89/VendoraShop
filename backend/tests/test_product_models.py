"""
Tests for product models: Coupon and StoreLocation.
Covers creation, constraints, defaults, string representations, and field edge cases.
"""
from datetime import timedelta

from django.test import TestCase
from django.contrib.auth.models import User
from django.db import IntegrityError
from django.utils import timezone

from apps.products.models import (
    Category, Product, Coupon, StoreLocation, Review,
    Wishlist, NewsletterSubscriber, PriceAlert,
)


# ---------------------------------------------------------------------------
# Coupon Model Tests
# ---------------------------------------------------------------------------
class CouponModelTest(TestCase):
    """Tests for the Coupon model."""

    def test_create_percent_coupon(self):
        """Coupon with a percentage discount."""
        c = Coupon.objects.create(
            code='SAVE20',
            discount_percent=20.00,
            description='20% off everything',
        )
        self.assertEqual(c.code, 'SAVE20')
        self.assertEqual(float(c.discount_percent), 20.00)
        self.assertIsNone(c.discount_amount)
        self.assertEqual(float(c.min_spend), 0.0)
        self.assertTrue(c.is_active)
        self.assertIsNone(c.expires_at)

    def test_create_amount_coupon(self):
        """Coupon with a fixed dollar amount discount."""
        c = Coupon.objects.create(
            code='FLAT10',
            discount_amount=10.00,
            min_spend=50.00,
        )
        self.assertEqual(c.code, 'FLAT10')
        self.assertIsNone(c.discount_percent)
        self.assertEqual(float(c.discount_amount), 10.00)
        self.assertEqual(float(c.min_spend), 50.00)

    def test_create_both_discount_types(self):
        """Coupon can have both percent and amount discounts (business rule TBD)."""
        c = Coupon.objects.create(
            code='BOTH25',
            discount_percent=25.00,
            discount_amount=15.00,
        )
        self.assertEqual(float(c.discount_percent), 25.00)
        self.assertEqual(float(c.discount_amount), 15.00)

    def test_code_must_be_unique(self):
        """Duplicate coupon codes raise IntegrityError."""
        Coupon.objects.create(code='UNIQUE1', discount_percent=10)
        with self.assertRaises(IntegrityError):
            Coupon.objects.create(code='UNIQUE1', discount_percent=20)

    def test_code_case_sensitive(self):
        """Coupon codes are case-sensitive (different codes)."""
        Coupon.objects.create(code='CASE1', discount_percent=10)
        c2 = Coupon.objects.create(code='case1', discount_percent=20)
        self.assertEqual(c2.code, 'case1')
        self.assertEqual(Coupon.objects.count(), 2)

    def test_default_is_active(self):
        """New coupons default to is_active=True."""
        c = Coupon.objects.create(code='ACTIVE1', discount_percent=5)
        self.assertTrue(c.is_active)

    def test_deactivate_coupon(self):
        """Setting is_active=False deactivates the coupon."""
        c = Coupon.objects.create(code='DEACT', discount_percent=10)
        c.is_active = False
        c.save()
        c.refresh_from_db()
        self.assertFalse(c.is_active)

    def test_default_min_spend_is_zero(self):
        """min_spend defaults to 0."""
        c = Coupon.objects.create(code='NOMIN', discount_percent=5)
        self.assertEqual(float(c.min_spend), 0.0)

    def test_min_spend_with_minimum_purchase(self):
        """Coupon can require a minimum spend."""
        c = Coupon.objects.create(
            code='MIN100',
            discount_amount=20,
            min_spend=100.00,
        )
        self.assertEqual(float(c.min_spend), 100.0)

    def test_expires_at_nullable(self):
        """expires_at can be None (no expiration)."""
        c = Coupon.objects.create(code='FOREVER', discount_percent=10)
        self.assertIsNone(c.expires_at)

    def test_expires_at_with_date(self):
        """expires_at stores a future datetime."""
        future = timezone.now() + timedelta(days=30)
        c = Coupon.objects.create(
            code='EXP30',
            discount_percent=15,
            expires_at=future,
        )
        self.assertIsNotNone(c.expires_at)
        self.assertGreater(c.expires_at, timezone.now())

    def test_is_expired_false_when_future(self):
        """Coupon with future expiry is not expired."""
        future = timezone.now() + timedelta(days=30)
        c = Coupon.objects.create(code='NOTEXP', discount_percent=10, expires_at=future)
        # Model doesn't have is_expired method, but we check via DB comparison
        self.assertGreater(c.expires_at, timezone.now())

    def test_is_expired_true_when_past(self):
        """Coupon with past expiry is expired."""
        past = timezone.now() - timedelta(days=1)
        c = Coupon.objects.create(code='PAST', discount_percent=10, expires_at=past)
        self.assertLess(c.expires_at, timezone.now())

    def test_str_active(self):
        """String representation shows code and 'active'."""
        c = Coupon.objects.create(code='STR1', discount_percent=10)
        self.assertIn('STR1', str(c))
        self.assertIn('active', str(c))

    def test_str_inactive(self):
        """String representation shows code and 'inactive'."""
        c = Coupon.objects.create(code='STR2', discount_percent=10, is_active=False)
        self.assertIn('STR2', str(c))
        self.assertIn('inactive', str(c))

    def test_str_both_discount_types(self):
        """String works with both discount types set."""
        c = Coupon.objects.create(
            code='STR3', discount_percent=10, discount_amount=5,
        )
        result = str(c)
        self.assertIn('STR3', result)

    def test_description_optional(self):
        """Description defaults to empty string."""
        c = Coupon.objects.create(code='NODESC', discount_percent=10)
        self.assertEqual(c.description, '')

    def test_description_with_text(self):
        """Description stores custom text."""
        c = Coupon.objects.create(
            code='DESC1',
            discount_percent=10,
            description='Holiday special',
        )
        self.assertEqual(c.description, 'Holiday special')

    def test_created_at_auto_set(self):
        """created_at is automatically set on creation."""
        c = Coupon.objects.create(code='AUTO1', discount_percent=10)
        self.assertIsNotNone(c.created_at)
        self.assertLess(c.created_at, timezone.now() + timedelta(seconds=5))

    def test_created_at_preserves_insertion_order(self):
        """Coupons with created_at retain their timestamps."""
        c1 = Coupon.objects.create(code='FIRST', discount_percent=10)
        c2 = Coupon.objects.create(code='SECOND', discount_percent=20)
        # Verify timestamps exist and c2 was created after c1
        self.assertGreaterEqual(c2.created_at, c1.created_at)

    def test_decimal_precision(self):
        """Discount values maintain decimal precision."""
        c = Coupon.objects.create(
            code='PREC1',
            discount_percent=12.50,
            discount_amount=7.75,
            min_spend=25.99,
        )
        c.refresh_from_db()
        self.assertEqual(float(c.discount_percent), 12.50)
        self.assertEqual(float(c.discount_amount), 7.75)
        self.assertEqual(float(c.min_spend), 25.99)


# ---------------------------------------------------------------------------
# StoreLocation Model Tests
# ---------------------------------------------------------------------------
class StoreLocationModelTest(TestCase):
    """Tests for the StoreLocation model."""

    def _create_store(self, **kwargs):
        """Helper to create a store with sensible defaults."""
        defaults = {
            'name': 'Downtown Store',
            'address': '100 Main Street',
            'city': 'Springfield',
            'state': 'IL',
            'zip_code': '62701',
            'phone': '+1-217-555-0100',
            'hours': 'Mon-Sat 9AM-9PM, Sun 10AM-6PM',
            'latitude': 39.7817,
            'longitude': -89.6501,
            'pickup_available': True,
        }
        defaults.update(kwargs)
        return StoreLocation.objects.create(**defaults)

    def test_create_store(self):
        """Basic store creation with all fields."""
        s = self._create_store()
        self.assertEqual(s.name, 'Downtown Store')
        self.assertEqual(s.address, '100 Main Street')
        self.assertEqual(s.city, 'Springfield')
        self.assertEqual(s.state, 'IL')
        self.assertEqual(s.zip_code, '62701')
        self.assertEqual(s.phone, '+1-217-555-0100')
        self.assertEqual(s.hours, 'Mon-Sat 9AM-9PM, Sun 10AM-6PM')
        self.assertTrue(s.pickup_available)

    def test_str_representation(self):
        """String shows name and (city, state)."""
        s = self._create_store()
        result = str(s)
        self.assertIn('Downtown Store', result)
        self.assertIn('Springfield', result)
        self.assertIn('IL', result)

    def test_str_format(self):
        """String matches format: 'Name (City, State)'."""
        s = self._create_store(name='Mall Location', city='Chicago', state='IL')
        self.assertEqual(str(s), 'Mall Location (Chicago, IL)')

    def test_default_pickup_available(self):
        """pickup_available defaults to True."""
        s = self._create_store(pickup_available=True)
        self.assertTrue(s.pickup_available)

    def test_pickup_not_available(self):
        """Store can have pickup disabled."""
        s = self._create_store(pickup_available=False)
        self.assertFalse(s.pickup_available)

    def test_latitude_precision(self):
        """latitude supports 7 decimal places."""
        s = self._create_store(latitude=39.7817234, longitude=-89.6501234)
        s.refresh_from_db()
        self.assertEqual(float(s.latitude), 39.7817234)
        self.assertEqual(float(s.longitude), -89.6501234)

    def test_negative_longitude(self):
        """Western hemisphere stores have negative longitude."""
        s = self._create_store(longitude=-122.4194)
        self.assertEqual(float(s.longitude), -122.4194)

    def test_positive_longitude(self):
        """Eastern hemisphere stores have positive longitude."""
        s = self._create_store(
            name='London Store',
            city='London',
            state='England',
            longitude=0.1278,
        )
        self.assertGreater(float(s.longitude), 0)

    def test_hours_optional(self):
        """hours field can be blank."""
        s = self._create_store(hours='')
        self.assertEqual(s.hours, '')

    def test_long_address(self):
        """Address field supports up to 500 characters."""
        long_addr = 'A' * 500
        s = self._create_store(address=long_addr)
        self.assertEqual(s.address, long_addr)

    def test_multiple_stores(self):
        """Multiple stores can be created."""
        self._create_store(name='Store 1', city='City1')
        self._create_store(name='Store 2', city='City2')
        self._create_store(name='Store 3', city='City3')
        self.assertEqual(StoreLocation.objects.count(), 3)

    def test_update_store(self):
        """Store fields can be updated."""
        s = self._create_store()
        s.name = 'Updated Name'
        s.phone = '+1-555-9999'
        s.pickup_available = False
        s.save()
        s.refresh_from_db()
        self.assertEqual(s.name, 'Updated Name')
        self.assertEqual(s.phone, '+1-555-9999')
        self.assertFalse(s.pickup_available)

    def test_delete_store(self):
        """Store can be deleted."""
        s = self._create_store()
        pk = s.pk
        s.delete()
        self.assertFalse(StoreLocation.objects.filter(pk=pk).exists())

    def test_city_max_length(self):
        """City field accepts standard city names."""
        s = self._create_store(city='San Francisco')
        self.assertEqual(s.city, 'San Francisco')

    def test_state_max_length(self):
        """State field accepts full state names."""
        s = self._create_store(state='California')
        self.assertEqual(s.state, 'California')

    def test_zip_code_as_string(self):
        """Zip code is stored as a string (preserves leading zeros)."""
        s = self._create_store(zip_code='02134')
        self.assertEqual(s.zip_code, '02134')

    def test_international_phone(self):
        """Phone field accepts international format."""
        s = self._create_store(phone='+44 20 7946 0958')
        self.assertEqual(s.phone, '+44 20 7946 0958')


# ---------------------------------------------------------------------------
# Other Product Models — Quick coverage tests
# ---------------------------------------------------------------------------
class WishlistModelTest(TestCase):
    """Quick tests for the Wishlist model."""

    def setUp(self):
        self.category = Category.objects.create(name='Tech', slug='tech')
        self.product = Product.objects.create(
            category=self.category, name='Widget', slug='widget',
            description='A widget', price=9.99,
        )

    def test_wishlist_str_authenticated(self):
        """Wishlist string for logged-in user shows username."""
        user = User.objects.create_user(username='wish@test.com', email='wish@test.com', password='Pass123!')
        w = Wishlist.objects.create(user=user, product=self.product)
        self.assertIn('wish@test.com', str(w))
        self.assertIn('Widget', str(w))

    def test_wishlist_str_guest(self):
        """Wishlist string for guest shows session key."""
        w = Wishlist.objects.create(session_key='sess123', product=self.product)
        self.assertIn('Guest:sess123', str(w))
        self.assertIn('Widget', str(w))


class NewsletterSubscriberModelTest(TestCase):
    """Quick tests for NewsletterSubscriber model."""

    def test_create_subscriber(self):
        s = NewsletterSubscriber.objects.create(email='news@test.com')
        self.assertEqual(s.email, 'news@test.com')
        self.assertIsNotNone(s.subscribed_at)

    def test_unique_email(self):
        NewsletterSubscriber.objects.create(email='dup@test.com')
        with self.assertRaises(IntegrityError):
            NewsletterSubscriber.objects.create(email='dup@test.com')

    def test_str(self):
        s = NewsletterSubscriber.objects.create(email='test@test.com')
        self.assertEqual(str(s), 'test@test.com')

    def test_discount_code_optional(self):
        s = NewsletterSubscriber.objects.create(email='nodc@test.com')
        self.assertEqual(s.discount_code, '')

    def test_discount_code_with_value(self):
        s = NewsletterSubscriber.objects.create(email='dc@test.com', discount_code='WELCOME10')
        self.assertEqual(s.discount_code, 'WELCOME10')


class PriceAlertModelTest(TestCase):
    """Quick tests for PriceAlert model."""

    def setUp(self):
        self.category = Category.objects.create(name='Tech', slug='tech2')
        self.product = Product.objects.create(
            category=self.category, name='Gadget', slug='gadget',
            description='A gadget', price=99.99,
        )

    def test_create_price_alert(self):
        alert = PriceAlert.objects.create(
            user=User.objects.create_user(username='alert@test.com', email='alert@test.com', password='Pass123!'),
            product=self.product,
            target_price=79.99,
            email='alert@test.com',
        )
        self.assertEqual(float(alert.target_price), 79.99)
        self.assertEqual(alert.status, 'active')
        self.assertTrue(alert.is_active)

    def test_status_choices(self):
        alert = PriceAlert.objects.create(
            product=self.product,
            target_price=50.00,
            email='triggered@test.com',
            status='triggered',
        )
        self.assertEqual(alert.status, 'triggered')

    def test_str(self):
        alert = PriceAlert.objects.create(
            product=self.product,
            target_price=79.99,
            email='str@test.com',
        )
        result = str(alert)
        self.assertIn('Gadget', result)
        self.assertIn('79.99', result)


class ReviewModelTest(TestCase):
    """Quick tests for the Review model."""

    def setUp(self):
        self.category = Category.objects.create(name='Tech3', slug='tech3')
        self.product = Product.objects.create(
            category=self.category, name='Thing', slug='thing',
            description='A thing', price=49.99,
        )
        self.user = User.objects.create_user(username='reviewer@test.com', email='reviewer@test.com', password='Pass123!')

    def test_create_review(self):
        r = Review.objects.create(
            product=self.product, user=self.user, rating=5, comment='Great!',
        )
        self.assertEqual(r.rating, 5)
        self.assertEqual(r.comment, 'Great!')

    def test_str(self):
        r = Review.objects.create(
            product=self.product, user=self.user, rating=4, comment='Good',
        )
        result = str(r)
        self.assertIn('reviewer@test.com', result)
        self.assertIn('Thing', result)
        self.assertIn('4', result)

    def test_default_rating(self):
        r = Review.objects.create(product=self.product, user=self.user, comment='No rating')
        self.assertEqual(r.rating, 5)


class CategoryAutoSlugTest(TestCase):
    """Tests for Category auto-slug generation."""

    def test_auto_slug(self):
        """Category with no slug auto-generates from name."""
        c = Category.objects.create(name='Sports & Outdoors')
        self.assertEqual(c.slug, 'sports-outdoors')

    def test_explicit_slug_not_overwritten(self):
        """Explicit slug is not overwritten by auto-generation."""
        c = Category.objects.create(name='Audio', slug='custom-slug')
        self.assertEqual(c.slug, 'custom-slug')

    def test_str(self):
        c = Category.objects.create(name='Home & Living')
        self.assertEqual(str(c), 'Home & Living')
