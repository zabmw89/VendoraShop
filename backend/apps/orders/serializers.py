from rest_framework import serializers
from .models import Order, OrderItem
from apps.accounts.serializers import UserSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    productId = serializers.IntegerField(source='product_id', read_only=True)
    productName = serializers.CharField(source='product_name', read_only=True)
    productImage = serializers.CharField(source='product_image', read_only=True)
    price = serializers.DecimalField(source='unit_price', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'product_id', 'productId',
            'product_name', 'productName',
            'product_image', 'productImage',
            'unit_price', 'price',
            'quantity', 'subtotal'
        ]

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user = UserSerializer(read_only=True)
    customerName = serializers.CharField(source='full_name', read_only=True)
    customerEmail = serializers.CharField(source='email', read_only=True)
    customerPhone = serializers.CharField(source='phone', read_only=True)
    total = serializers.DecimalField(source='total_amount', max_digits=10, decimal_places=2, read_only=True)
    subtotal = serializers.DecimalField(source='subtotal_amount', max_digits=10, decimal_places=2, read_only=True)
    tax = serializers.DecimalField(source='tax_amount', max_digits=10, decimal_places=2, read_only=True)
    shippingFee = serializers.DecimalField(source='shipping_amount', max_digits=10, decimal_places=2, read_only=True)
    discount = serializers.DecimalField(source='discount_amount', max_digits=10, decimal_places=2, read_only=True)
    orderStatus = serializers.CharField(source='status', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    trackingNumber = serializers.SerializerMethodField()
    shippingAddress = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'status', 'orderStatus',
            'total_amount', 'total',
            'subtotal_amount', 'subtotal',
            'tax_amount', 'tax',
            'shipping_amount', 'shippingFee',
            'discount_amount', 'discount',
            'full_name', 'customerName',
            'email', 'customerEmail',
            'phone', 'customerPhone',
            'shipping_address', 'shippingAddress',
            'city', 'state', 'zip_code', 'payment_method',
            'trackingNumber',
            'items', 'created_at', 'createdAt', 'updated_at', 'updatedAt'
        ]

    def get_trackingNumber(self, obj):
        tracking = getattr(obj, 'shipment_tracking', None)
        return tracking.tracking_number if tracking else f"VDR-{obj.id:06d}-US"

    def get_shippingAddress(self, obj):
        return {
            'fullName': obj.full_name,
            'street': obj.shipping_address,
            'apartment': '',
            'city': obj.city,
            'state': obj.state,
            'postalCode': obj.zip_code,
            'country': 'United States',
            'phone': obj.phone,
        }

class CheckoutSerializer(serializers.Serializer):
    fullName = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    phone = serializers.CharField(required=True)
    address = serializers.CharField(required=False, allow_blank=True, default='')
    city = serializers.CharField(required=False, allow_blank=True, default='')
    state = serializers.CharField(required=False, allow_blank=True, default='')
    zipCode = serializers.CharField(required=False, allow_blank=True, default='')
    paymentMethod = serializers.CharField(required=False, default='credit_card')
    cartKey = serializers.CharField(required=False, allow_blank=True, default='')
    couponCode = serializers.CharField(required=False, allow_blank=True, default='')
    redeemLoyaltyPoints = serializers.IntegerField(required=False, min_value=0, default=0)
    notes = serializers.CharField(required=False, allow_blank=True, default='')

    def validate(self, data):
        mapped = {
            'fullName': data.get('fullName') or data.get('full_name', ''),
            'email': data.get('email') or data.get('customerEmail', ''),
            'phone': data.get('phone') or data.get('customerPhone', ''),
            'address': data.get('address') or data.get('shipping_address', ''),
            'city': data.get('city', ''),
            'state': data.get('state', ''),
            'zipCode': data.get('zipCode') or data.get('zip_code', ''),
            'paymentMethod': data.get('paymentMethod', 'credit_card'),
            'cartKey': data.get('cartKey', ''),
            'couponCode': data.get('couponCode', ''),
            'redeemLoyaltyPoints': data.get('redeemLoyaltyPoints', 0),
            'notes': data.get('notes', ''),
        }
        return mapped
