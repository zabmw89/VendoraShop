from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone


class UserProfile(models.Model):
    """
    Extends Django's built-in User entity with additional profile fields.
    """
    ROLE_CHOICES = [
        ('customer', 'Customer'),
        ('admin', 'Administrator'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    phone = models.CharField(max_length=30, blank=True, default='')
    address = models.TextField(blank=True, default='')
    avatar = models.URLField(blank=True, default='')
    is_email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"


class EmailVerification(models.Model):
    """
    Stores 6-digit verification codes sent to users on registration.
    Codes expire after 15 minutes.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='email_verifications')
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"Verification for {self.user.email} — {'used' if self.is_used else 'pending'}"

    class Meta:
        ordering = ['-created_at']


class LoyaltyTransaction(models.Model):
    """
    Loyalty points transaction — earned, redeemed, bonus, or adjustment.
    Maps to db.ts loyaltyTransactions array.
    """
    TYPE_CHOICES = [
        ('earned', 'Earned'),
        ('redeemed', 'Redeemed'),
        ('bonus', 'Bonus'),
        ('adjustment', 'Adjustment'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='loyalty_transactions')
    order_id = models.CharField(max_length=50, blank=True, default='')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    points = models.IntegerField()
    description = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} — {self.type} {self.points} pts"


@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
    else:
        if hasattr(instance, 'profile'):
            instance.profile.save()
