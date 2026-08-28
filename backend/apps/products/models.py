from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True, default='')
    icon = models.CharField(max_length=50, blank=True, default='')

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Product(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=280, unique=True, blank=True)
    brand = models.CharField(max_length=255, blank=True, default='')
    short_description = models.TextField(blank=True, default='')
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    original_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    image = models.URLField(max_length=500, blank=True, default='')
    images = models.JSONField(default=list, blank=True, help_text='Array of image URLs')
    tags = models.JSONField(default=list, blank=True, help_text='Array of tag strings')
    specs = models.JSONField(default=dict, blank=True, help_text='Key-value product specifications')
    variants = models.JSONField(default=dict, blank=True, help_text='Variant options (e.g., {"colors": ["Red", "Blue"], "sizes": ["S", "M", "L"]})')
    stock_quantity = models.PositiveIntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=5.0)
    review_count = models.PositiveIntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['category', '-created_at']),
            models.Index(fields=['is_featured', '-created_at']),
            models.Index(fields=['stock_quantity']),
            models.Index(fields=['brand']),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            self.slug = f"{base_slug}-{self.id}" if self.id else base_slug
        super().save(*args, **kwargs)

    @property
    def in_stock(self):
        return self.stock_quantity > 0

    def __str__(self):
        return self.name


class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField(default=5)
    comment = models.TextField()
    helpful_count = models.PositiveIntegerField(default=0, help_text='Number of users who found this review helpful')
    verified_purchase = models.BooleanField(default=False, help_text='Whether the reviewer purchased the product')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.product.name} ({self.rating}★)"


# ---------------------------------------------------------------------------
# Entities that existed in db.ts but had no Django model
# ---------------------------------------------------------------------------

class Coupon(models.Model):
    """Discount coupons — maps to db.ts coupons array."""
    code = models.CharField(max_length=50, unique=True)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    min_spend = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} ({'active' if self.is_active else 'inactive'})"


class Wishlist(models.Model):
    """User wishlists — maps to db.ts wishlists Map."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='wishlists')
    session_key = models.CharField(max_length=100, blank=True, default='')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='wishlisted_by')
    notes = models.TextField(blank=True, default='', help_text='User notes about this wishlist item')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('user', 'product'), ('session_key', 'product')]
        ordering = ['-created_at']

    def __str__(self):
        owner = self.user.username if self.user else f"Guest:{self.session_key}"
        return f"{owner} ♥ {self.product.name}"


class NewsletterSubscriber(models.Model):
    """Newsletter subscriptions — maps to db.ts newsletterSubscribers array."""
    email = models.EmailField(unique=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)
    discount_code = models.CharField(max_length=50, blank=True, default='')

    def __str__(self):
        return self.email


class PriceAlert(models.Model):
    """Price drop alerts — maps to db.ts PriceAlert type."""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('triggered', 'Triggered'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='price_alerts')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='price_alerts')
    target_price = models.DecimalField(max_digits=10, decimal_places=2)
    email = models.EmailField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Alert: {self.product.name} ≤ ${self.target_price}"


class StoreLocation(models.Model):
    """Physical store locations — maps to db.ts stores array."""
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=500)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=20)
    phone = models.CharField(max_length=50)
    hours = models.CharField(max_length=255, blank=True, default='')
    latitude = models.DecimalField(max_digits=10, decimal_places=7)
    longitude = models.DecimalField(max_digits=10, decimal_places=7)
    pickup_available = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.city}, {self.state})"
