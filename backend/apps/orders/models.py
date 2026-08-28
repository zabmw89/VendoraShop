from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from apps.products.models import Product


# Valid state transitions: from_status -> [allowed_to_statuses]
ORDER_STATUS_TRANSITIONS = {
    'pending': ['processing', 'cancelled'],
    'processing': ['shipped', 'cancelled'],
    'shipped': ['delivered'],
    'delivered': [],  # Terminal state
    'cancelled': [],  # Terminal state
}


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='processing')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    shipping_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    # Customer & Shipping details
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=50)
    shipping_address = models.TextField()
    city = models.CharField(max_length=100, blank=True, default='')
    state = models.CharField(max_length=100, blank=True, default='')
    zip_code = models.CharField(max_length=20, blank=True, default='')
    payment_method = models.CharField(max_length=50, default='credit_card')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"Order #{self.id} - {self.full_name} (${self.total_amount})"

    def can_transition_to(self, new_status):
        """Check if the order can transition to the given status."""
        allowed = ORDER_STATUS_TRANSITIONS.get(self.status, [])
        return new_status in allowed

    def transition_to(self, new_status):
        """
        Transition the order to a new status with validation.
        Raises ValidationError if the transition is not allowed.
        """
        if not self.can_transition_to(new_status):
            allowed = ORDER_STATUS_TRANSITIONS.get(self.status, [])
            raise ValidationError(
                f"Cannot transition order #{self.id} from '{self.status}' to '{new_status}'. "
                f"Allowed transitions: {allowed}"
            )
        self.status = new_status
        self.save(update_fields=['status', 'updated_at'])

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, related_name='order_items')
    product_name = models.CharField(max_length=255)
    product_image = models.URLField(max_length=500, blank=True, default='')
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    def save(self, *args, **kwargs):
        if not self.subtotal:
            self.subtotal = self.unit_price * self.quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.quantity}x {self.product_name} in Order #{self.order_id}"


class ShipmentTracking(models.Model):
    """
    Shipment tracking record for an order.
    Maps to db.ts getOrderTracking() / advanceOrderTracking().
    """
    STATUS_CHOICES = [
        ('confirmed', 'Confirmed'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='tracking')
    tracking_number = models.CharField(max_length=100, unique=True)
    carrier = models.CharField(max_length=100, default='Vendora Logistics')
    carrier_service = models.CharField(max_length=100, blank=True, default='')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='confirmed')
    status_text = models.CharField(max_length=255, blank=True, default='')
    current_location = models.CharField(max_length=255, blank=True, default='')
    estimated_delivery = models.DateTimeField(null=True, blank=True)
    origin = models.CharField(max_length=255, blank=True, default='')
    destination = models.CharField(max_length=255, blank=True, default='')
    progress_percent = models.PositiveSmallIntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Tracking {self.tracking_number} — {self.status}"

    class Meta:
        verbose_name_plural = 'Shipment Trackings'


class TrackingMilestone(models.Model):
    """
    Individual milestone within a shipment tracking timeline.
    Maps to db.ts TrackingMilestone type.
    """
    tracking = models.ForeignKey(ShipmentTracking, on_delete=models.CASCADE, related_name='milestones')
    status = models.CharField(max_length=100)
    title = models.CharField(max_length=255, blank=True, default='')
    description = models.TextField(blank=True, default='')
    location = models.CharField(max_length=255, blank=True, default='')
    timestamp = models.DateTimeField(null=True, blank=True)
    completed = models.BooleanField(default=False)
    current = models.BooleanField(default=False)

    class Meta:
        ordering = ['timestamp']
        verbose_name_plural = 'Tracking Milestones'

    def __str__(self):
        return f"{self.title} — {self.status}"

class Payment(models.Model):
    """
    Payment transaction record.
    Tracks payment attempts and successes across different providers.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('succeeded', 'Succeeded'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
        ('cancelled', 'Cancelled'),
    ]

    PROVIDER_CHOICES = [
        ('stripe', 'Stripe'),
        ('paypal', 'PayPal'),
        ('credit_card', 'Credit Card (Mock)'),
        ('cash_on_delivery', 'Cash on Delivery'),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payments')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    
    provider = models.CharField(max_length=50, choices=PROVIDER_CHOICES, default='credit_card')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    provider_payment_id = models.CharField(max_length=255, blank=True, default='', help_text='Payment ID from provider')
    provider_customer_id = models.CharField(max_length=255, blank=True, default='')
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    
    card_brand = models.CharField(max_length=50, blank=True, default='')
    card_last4 = models.CharField(max_length=4, blank=True, default='')
    
    error_message = models.TextField(blank=True, default='')
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment #{self.id} - {self.provider} - {self.status} (${self.amount})"

    @property
    def is_successful(self):
        return self.status == 'succeeded'
