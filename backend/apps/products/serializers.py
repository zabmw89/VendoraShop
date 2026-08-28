from rest_framework import serializers
from .models import (
    Category, Product, Review, Coupon, Wishlist,
    NewsletterSubscriber, PriceAlert, StoreLocation,
)
from apps.accounts.serializers import UserSerializer


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(source='products.count', read_only=True)
    # Map Django 'icon' to frontend 'iconName'
    iconName = serializers.CharField(source='icon', required=False, allow_blank=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'icon', 'iconName', 'product_count']


class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    userName = serializers.CharField(source='user.username', read_only=True)
    title = serializers.SerializerMethodField()
    verifiedPurchase = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            'id', 'product', 'user', 'userName', 'rating',
            'title', 'comment', 'verifiedPurchase', 'created_at',
        ]

    def get_title(self, obj):
        # Review model has no title field; derive from first line of comment
        return obj.comment.split('\n')[0][:80] if obj.comment else ''

    def get_verifiedPurchase(self, obj):
        # Check if user has ordered this product
        if obj.user:
            return obj.user.orders.filter(
                items__product=obj.product
            ).exists()
        return False


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    categoryId = serializers.CharField(source='category.slug', read_only=True)
    in_stock = serializers.BooleanField(read_only=True)
    inStock = serializers.BooleanField(source='in_stock', read_only=True)
    shortDescription = serializers.CharField(source='short_description', read_only=True)
    originalPrice = serializers.DecimalField(
        source='original_price', max_digits=10, decimal_places=2, read_only=True
    )
    stockQuantity = serializers.IntegerField(source='stock_quantity', read_only=True)
    isFeatured = serializers.BooleanField(source='is_featured', read_only=True)
    reviewCount = serializers.IntegerField(source='review_count', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'category', 'category_name', 'categoryId', 'name', 'slug',
            'brand', 'shortDescription', 'short_description', 'description',
            'price', 'original_price', 'originalPrice',
            'image', 'images', 'tags', 'specs', 'variants',
            'stock_quantity', 'stockQuantity', 'in_stock', 'inStock',
            'rating', 'review_count', 'reviewCount',
            'is_featured', 'isFeatured',
            'created_at', 'createdAt', 'updated_at',
        ]


class ProductDetailSerializer(ProductSerializer):
    reviews = ReviewSerializer(many=True, read_only=True)

    class Meta(ProductSerializer.Meta):
        fields = ProductSerializer.Meta.fields + ['reviews']


# ── Wishlist ────────────────────────────────────────────────────────────

class WishlistSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = Wishlist
        fields = ['id', 'product', 'created_at']


# ── Price Alert ─────────────────────────────────────────────────────────

class PriceAlertSerializer(serializers.ModelSerializer):
    productId = serializers.IntegerField(source='product.id', read_only=True)
    productName = serializers.CharField(source='product.name', read_only=True)
    targetPrice = serializers.DecimalField(
        source='target_price', max_digits=10, decimal_places=2, read_only=True
    )
    currentPrice = serializers.DecimalField(
        source='product.price', max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = PriceAlert
        fields = [
            'id', 'productId', 'productName', 'targetPrice', 'currentPrice',
            'email', 'is_active', 'status', 'created_at',
        ]


# ── Newsletter ──────────────────────────────────────────────────────────

class NewsletterSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsletterSubscriber
        fields = ['id', 'email', 'subscribed_at', 'discount_code']


# ── Store Locator ───────────────────────────────────────────────────────

class StoreLocationSerializer(serializers.ModelSerializer):
    zipCode = serializers.CharField(source='zip_code', read_only=True)
    pickupAvailable = serializers.BooleanField(source='pickup_available', read_only=True)

    class Meta:
        model = StoreLocation
        fields = [
            'id', 'name', 'address', 'city', 'state', 'zip_code', 'zipCode',
            'phone', 'hours', 'latitude', 'longitude',
            'pickup_available', 'pickupAvailable',
        ]


# ── Coupon ──────────────────────────────────────────────────────────────

class CouponSerializer(serializers.ModelSerializer):
    discountPercent = serializers.DecimalField(
        source='discount_percent', max_digits=5, decimal_places=2, read_only=True
    )
    discountAmount = serializers.DecimalField(
        source='discount_amount', max_digits=10, decimal_places=2, read_only=True
    )
    minSpend = serializers.DecimalField(
        source='min_spend', max_digits=10, decimal_places=2, read_only=True
    )
    isActive = serializers.BooleanField(source='is_active', read_only=True)

    class Meta:
        model = Coupon
        fields = [
            'id', 'code', 'discount_percent', 'discountPercent',
            'discount_amount', 'discountAmount',
            'min_spend', 'minSpend', 'description',
            'is_active', 'isActive', 'expires_at',
        ]
