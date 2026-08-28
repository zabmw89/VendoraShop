"""
Admin, order tracking, cart coupon, and loyalty views.
Migrated from Express server.ts to Django REST Framework.
"""
import random
import string
from decimal import Decimal

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from django.db import transaction
from django.db.models import Sum, Count, Q
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.contrib.auth.models import User

from apps.products.models import Product, Coupon
from apps.products.serializers import ProductSerializer, CouponSerializer
from apps.orders.models import Order, OrderItem, ShipmentTracking, TrackingMilestone
from apps.orders.serializers import OrderSerializer
from apps.accounts.models import LoyaltyTransaction
from apps.cart.models import Cart
from apps.cart.serializers import CartSerializer
from apps.cart.views import get_or_create_cart


def _is_admin(user):
    return (
        user.is_authenticated
        and hasattr(user, 'profile')
        and user.profile.role == 'admin'
    )


# ── Health Check ────────────────────────────────────────────────────────

class HealthCheckView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            'status': 'ok',
            'service': 'VendoraShop API Engine',
            'version': '1.0.0',
            'timestamp': timezone.now().isoformat(),
        })


# ── Admin Analytics ─────────────────────────────────────────────────────

class AdminAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

        total_revenue = (
            Order.objects
            .exclude(status='cancelled')
            .aggregate(total=Sum('total_amount'))['total']
        ) or 0

        orders_by_status = {}
        for choice_val, _ in Order.STATUS_CHOICES:
            orders_by_status[choice_val] = Order.objects.filter(status=choice_val).count()

        low_stock_count = Product.objects.filter(stock_quantity__lte=5).count()
        total_products = Product.objects.count()
        total_orders = Order.objects.count()
        total_customers = User.objects.filter(
            profile__role='customer'
        ).count()

        return Response({
            'totalRevenue': float(total_revenue),
            'totalOrders': total_orders,
            'totalProducts': total_products,
            'totalCustomers': total_customers,
            'lowStockCount': low_stock_count,
            'ordersByStatus': orders_by_status,
        })


# ── Admin Products ──────────────────────────────────────────────────────

class AdminProductListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
        products = Product.objects.all()
        return Response(ProductSerializer(products, many=True).data)

    def post(self, request):
        if not _is_admin(request.user):
            return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = ProductSerializer(data=request.data)
        if serializer.is_valid():
            product = serializer.save()
            return Response(
                {'product': ProductSerializer(product).data, 'message': 'Product created successfully.'},
                status=status.HTTP_201_CREATED,
            )
        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class AdminProductDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _get_product(self, pk):
        try:
            if str(pk).isdigit():
                return Product.objects.get(pk=int(pk))
            return Product.objects.get(slug=pk)
        except Product.DoesNotExist:
            return None

    def put(self, request, pk):
        if not _is_admin(request.user):
            return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
        product = self._get_product(pk)
        if not product:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProductSerializer(product, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            return Response({'product': ProductSerializer(updated).data, 'message': 'Product updated successfully.'})
        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if not _is_admin(request.user):
            return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
        product = self._get_product(pk)
        if not product:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)
        product.delete()
        return Response({'message': 'Product deleted successfully.'})


# ── Admin Orders ────────────────────────────────────────────────────────

class AdminOrderListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
        orders = Order.objects.all()
        return Response(OrderSerializer(orders, many=True).data)


class AdminOrderStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, pk):
        if not _is_admin(request.user):
            return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        valid_statuses = [c[0] for c in Order.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({'error': f'Invalid status. Must be one of: {valid_statuses}'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            order.transition_to(new_status)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({
            'order': OrderSerializer(order).data,
            'message': f'Order status updated to "{new_status}".',
        })


# ── Admin Reset DB (seed) ──────────────────────────────────────────────

class AdminResetDBView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not _is_admin(request.user):
            return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

        import os
        from django.core.management import call_command
        try:
            os.environ['DEMO_MODE'] = 'true'
            call_command('seed_demo_data')
            return Response({'message': 'Store database reset to factory seed state successfully.'})
        except Exception as e:
            return Response({'error': f'Failed to reset: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ── Order Tracking ──────────────────────────────────────────────────────

class OrderTrackingView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.is_authenticated:
            if order.user and order.user != request.user and getattr(request.user.profile, 'role', '') != 'admin':
                return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        else:
            email = request.query_params.get('email')
            if email and email.lower() != order.email.lower():
                return Response({'error': 'Permission denied. Please provide the order email.'}, status=status.HTTP_403_FORBIDDEN)

        tracking = self._build_tracking(order)
        return Response(tracking)

    def _build_tracking(self, order):
        """Build a tracking response from the order, creating ShipmentTracking if needed."""
        tracking, created = ShipmentTracking.objects.get_or_create(
            order=order,
            defaults={
                'tracking_number': f'VDR-{random.randint(100000, 999999)}-US',
                'carrier': 'Vendora Express / FedEx Ground',
                'carrier_service': 'Priority Insured Courier',
                'status': order.status if order.status in ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'] else 'processing',
                'origin': 'Seattle Distribution Hub, WA 98101',
            }
        )

        if not created and tracking.status != order.status:
            tracking.status = order.status
            tracking.save()

        status_map = {
            'pending': (20, 'Order Confirmed — In Queue'),
            'processing': (45, 'Order Processing — Packing & Labeling'),
            'shipped': (75, 'In Transit — On Schedule'),
            'out_for_delivery': (90, 'Out for Delivery — Arriving Today'),
            'delivered': (100, 'Delivered — Signed by Customer'),
            'cancelled': (0, 'Order Cancelled'),
        }
        pct, txt = status_map.get(order.status, (20, 'Order Confirmed'))
        tracking.progress_percent = pct
        tracking.status_text = txt
        tracking.last_updated = timezone.now()
        tracking.save()

        # Build milestones
        milestones = self._build_milestones(order, tracking)

        return {
            'orderId': order.id,
            'trackingNumber': tracking.tracking_number,
            'carrier': tracking.carrier,
            'carrierService': tracking.carrier_service,
            'status': order.status,
            'statusText': txt,
            'origin': tracking.origin,
            'destination': f'{order.city}, {order.state}' if order.city else 'Customer Address',
            'recipientName': order.full_name,
            'progressPercent': pct,
            'estimatedDelivery': order.created_at,
            'currentLocation': tracking.current_location or 'Seattle Fulfillment Center',
            'lastUpdated': tracking.last_updated.isoformat(),
            'milestones': milestones,
        }

    def _build_milestones(self, order, tracking):
        base = order.created_at
        status = order.status
        completed_statuses = {
            'confirmed': ['confirmed'],
            'processing': ['confirmed', 'processing'],
            'shipped': ['confirmed', 'processing', 'shipped'],
            'out_for_delivery': ['confirmed', 'processing', 'shipped', 'out_for_delivery'],
            'delivered': ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'],
        }
        done = completed_statuses.get(status, [])

        return [
            {
                'id': 'ms_1', 'status': 'confirmed',
                'title': 'Order Confirmed',
                'description': 'Payment authorized and order received.',
                'location': 'Vendora Digital Hub',
                'completed': 'confirmed' in done,
                'current': status == 'pending',
            },
            {
                'id': 'ms_2', 'status': 'processing',
                'title': 'Processing & Fulfillment',
                'description': 'Items picked, inspected, and packaged.',
                'location': 'Fulfillment Center (Seattle, WA)',
                'completed': 'processing' in done,
                'current': status == 'processing',
            },
            {
                'id': 'ms_3', 'status': 'shipped',
                'title': 'Shipped & In Transit',
                'description': 'Carrier scanned package. Departed regional sort facility.',
                'location': 'FedEx Express Sort Facility (Portland, OR)',
                'completed': 'shipped' in done,
                'current': status == 'shipped',
            },
            {
                'id': 'ms_4', 'status': 'out_for_delivery',
                'title': 'Out for Delivery',
                'description': 'Package loaded onto local delivery vehicle.',
                'location': f'{order.city or "Local Area"}, {order.state or "WA"}',
                'completed': 'out_for_delivery' in done,
                'current': status == 'out_for_delivery',
            },
            {
                'id': 'ms_5', 'status': 'delivered',
                'title': 'Delivered',
                'description': 'Package safely delivered and handed to recipient.',
                'location': f'{order.shipping_address}, {order.city}' if order.shipping_address else 'Customer Address',
                'completed': 'delivered' in done,
                'current': status == 'delivered',
            },
        ]


class OrderAdvanceTrackingView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        if not _is_admin(request.user):
            return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        sequence = ['pending', 'processing', 'shipped', 'out_for_delivery', 'delivered']
        if order.status in sequence:
            idx = sequence.index(order.status)
            if idx < len(sequence) - 1:
                order.status = sequence[idx + 1]
            else:
                order.status = 'processing'  # loop
        else:
            order.status = 'processing'
        order.save(update_fields=['status', 'updated_at'])

        view = OrderTrackingView()
        tracking_data = view._build_tracking(order)
        return Response({
            'tracking': tracking_data,
            'message': f'Shipment status updated to "{tracking_data["statusText"]}".',
        })


# ── Cart Coupon ─────────────────────────────────────────────────────────

class CartCouponView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        code = request.data.get('code', '').strip()
        if not code:
            return Response({'error': 'Promo code is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            coupon = Coupon.objects.get(code__iexact=code, is_active=True)
        except Coupon.DoesNotExist:
            return Response({'error': 'Invalid promo code. Please check and try again.'},
                            status=status.HTTP_400_BAD_REQUEST)

        if coupon.expires_at and coupon.expires_at < timezone.now():
            return Response({'error': 'This promo code has expired.'}, status=status.HTTP_400_BAD_REQUEST)

        cart = get_or_create_cart(request)
        if coupon.min_spend and cart and cart.subtotal < coupon.min_spend:
            return Response(
                {'error': f'Minimum spend of ${coupon.min_spend} required for this promo code.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        coupon_data = CouponSerializer(coupon).data
        if cart:
            cart.applied_coupon = coupon_data
            cart.save(update_fields=['applied_coupon', 'updated_at'])

        cart_data = CartSerializer(cart).data if cart else {'appliedCoupon': coupon_data}
        return Response({
            'cart': cart_data,
            'appliedCoupon': coupon_data,
            'message': f'Promo code "{code.upper()}" applied!',
        })

    def delete(self, request):
        cart = get_or_create_cart(request)
        if cart:
            cart.applied_coupon = {}
            cart.save(update_fields=['applied_coupon', 'updated_at'])

        cart_data = CartSerializer(cart).data if cart else {'appliedCoupon': None}
        return Response({'cart': cart_data, 'appliedCoupon': None, 'message': 'Coupon removed.'})


# ── Loyalty ─────────────────────────────────────────────────────────────

class LoyaltyAccountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        txs = LoyaltyTransaction.objects.filter(user=request.user)
        total_points = sum(t.points for t in txs)

        # Tier calculation
        if total_points >= 5000:
            tier = {'name': 'Platinum', 'multiplier': 2.0}
        elif total_points >= 2000:
            tier = {'name': 'Gold', 'multiplier': 1.5}
        elif total_points >= 500:
            tier = {'name': 'Silver', 'multiplier': 1.2}
        else:
            tier = {'name': 'Bronze', 'multiplier': 1.0}

        return Response({
            'userId': request.user.id,
            'email': request.user.email,
            'currentPoints': max(0, total_points),
            'tier': tier,
            'transactions': [
                {
                    'id': t.id,
                    'type': t.type,
                    'points': t.points,
                    'description': t.description,
                    'orderId': t.order_id,
                    'createdAt': t.created_at.isoformat(),
                }
                for t in txs[:50]
            ],
        })


# ── OpenAPI Spec (basic) ───────────────────────────────────────────────

class OpenAPISpecView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            'openapi': '3.0.0',
            'info': {
                'title': 'VendoraShop API',
                'version': '1.0.0',
                'description': 'Django REST Framework API for VendoraShop e-commerce platform.',
            },
            'servers': [{'url': '/api'}],
            'paths': {},
        })
