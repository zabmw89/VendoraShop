"""
Additional product-adjacent views: Brands, Wishlist, Price Alerts,
Newsletter, Store Locator.
Migrated from Express server.ts to Django REST Framework.
"""
import string
import random

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from django.db.models import Q

from .models import (
    Product, Wishlist, PriceAlert, NewsletterSubscriber, StoreLocation
)
from .serializers import (
    WishlistSerializer, PriceAlertSerializer,
    NewsletterSerializer, StoreLocationSerializer,
)


def _is_admin(user):
    return (
        user.is_authenticated
        and hasattr(user, 'profile')
        and user.profile.role == 'admin'
    )


# ── Brands ──────────────────────────────────────────────────────────────

class BrandListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        brands = (
            Product.objects
            .values_list('brand', flat=True)
            .distinct()
            .order_by('brand')
        )
        brand_list = [
            {'id': b.lower().replace(' ', '-'), 'name': b, 'slug': b.lower().replace(' ', '-')}
            for b in brands if b
        ]
        return Response(brand_list)


# ── Wishlist ────────────────────────────────────────────────────────────

def _wishlist_key(request):
    """Return a user-id or session-based key for wishlist lookup."""
    if request.user.is_authenticated:
        return {'user': request.user}
    cart_key = request.query_params.get('cartKey') or request.data.get('cartKey', '')
    return {'session_key': cart_key or 'guest_session'}


class WishlistListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        lookup = _wishlist_key(request)
        items = Wishlist.objects.filter(**lookup).select_related('product')
        products = [w.product for w in items]
        from .serializers import ProductSerializer
        return Response(ProductSerializer(products, many=True).data)

    def post(self, request):
        product_id = request.data.get('productId')
        if not product_id:
            return Response({'error': 'Product ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            product = Product.objects.get(pk=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        lookup = _wishlist_key(request)
        Wishlist.objects.get_or_create(product=product, defaults=lookup)

        items = Wishlist.objects.filter(**lookup).select_related('product')
        products = [w.product for w in items]
        from .serializers import ProductSerializer
        return Response(ProductSerializer(products, many=True).data)

    def delete(self, request):
        lookup = _wishlist_key(request)
        Wishlist.objects.filter(**lookup).delete()
        return Response({'message': 'Wishlist cleared.'})


class WishlistToggleView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        product_id = request.data.get('productId')
        if not product_id:
            return Response({'error': 'Product ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            product = Product.objects.get(pk=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        lookup = _wishlist_key(request)
        existing = Wishlist.objects.filter(product=product, **lookup).first()
        if existing:
            existing.delete()
            in_wishlist = False
        else:
            Wishlist.objects.create(product=product, **lookup)
            in_wishlist = True

        items = Wishlist.objects.filter(**lookup).select_related('product')
        products = [w.product for w in items]
        from .serializers import ProductSerializer
        return Response({
            'inWishlist': in_wishlist,
            'items': ProductSerializer(products, many=True).data,
            'message': 'Saved to your wishlist.' if in_wishlist else 'Removed from your wishlist.',
        })


class WishlistSyncView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        product_ids = request.data.get('productIds', [])
        lookup = _wishlist_key(request)

        for pid in product_ids:
            try:
                product = Product.objects.get(pk=pid)
                Wishlist.objects.get_or_create(product=product, defaults=lookup)
            except Product.DoesNotExist:
                continue

        items = Wishlist.objects.filter(**lookup).select_related('product')
        products = [w.product for w in items]
        from .serializers import ProductSerializer
        return Response({
            'items': ProductSerializer(products, many=True).data,
            'message': 'Wishlist synced successfully.',
        })


class WishlistItemDeleteView(APIView):
    permission_classes = [permissions.AllowAny]

    def delete(self, request, product_id):
        lookup = _wishlist_key(request)
        Wishlist.objects.filter(product_id=product_id, **lookup).delete()
        items = Wishlist.objects.filter(**lookup).select_related('product')
        products = [w.product for w in items]
        from .serializers import ProductSerializer
        return Response({
            'items': ProductSerializer(products, many=True).data,
            'message': 'Removed from wishlist.',
        })


# ── Price Alerts ────────────────────────────────────────────────────────

class PriceAlertCreateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, product_id):
        try:
            product = Product.objects.get(pk=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        email = request.data.get('email', '')
        if request.user.is_authenticated:
            email = email or request.user.email

        if not email:
            return Response({'error': 'Email address is required for price drop alerts.'},
                            status=status.HTTP_400_BAD_REQUEST)

        target_price = request.data.get('targetPrice')
        alert = PriceAlert.objects.create(
            product=product,
            user=request.user if request.user.is_authenticated else None,
            email=email,
            target_price=target_price or product.price,
        )
        return Response(PriceAlertSerializer(alert).data, status=status.HTTP_201_CREATED)


class PriceAlertListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if request.user.is_authenticated:
            alerts = PriceAlert.objects.filter(
                Q(user=request.user) | Q(email=request.user.email)
            ).select_related('product')
        else:
            email = request.query_params.get('email', '')
            alerts = PriceAlert.objects.filter(email=email).select_related('product')
        return Response(PriceAlertSerializer(alerts, many=True).data)


class PriceAlertDeleteView(APIView):
    permission_classes = [permissions.AllowAny]

    def delete(self, request, pk):
        try:
            alert = PriceAlert.objects.get(pk=pk)
            alert.delete()
            return Response({'message': 'Price alert cancelled successfully.'})
        except PriceAlert.DoesNotExist:
            return Response({'error': 'Price alert not found.'}, status=status.HTTP_404_NOT_FOUND)


class SimulatePriceDropView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, product_id):
        if not _is_admin(request.user):
            return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            product = Product.objects.get(pk=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        drop_pct = float(request.data.get('dropPercentage', 15))
        old_price = float(product.price)
        new_price = round(old_price * (1 - drop_pct / 100), 2)
        product.price = new_price
        product.save(update_fields=['price', 'updated_at'])

        # Trigger any active alerts
        triggered = []
        for alert in PriceAlert.objects.filter(product=product, is_active=True, status='active'):
            if new_price <= float(alert.target_price):
                alert.status = 'triggered'
                alert.is_active = False
                alert.save()
                triggered.append(alert.email)

        from .serializers import ProductSerializer
        return Response({
            'product': ProductSerializer(product).data,
            'oldPrice': old_price,
            'newPrice': new_price,
            'triggeredAlerts': triggered,
            'message': f'Price for "{product.name}" updated from ${old_price} to ${new_price} ({drop_pct}% drop).',
        })


# ── Newsletter ──────────────────────────────────────────────────────────

class NewsletterSubscribeView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        if not email:
            return Response({'error': 'A valid email address is required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        discount_code = 'VENDORA10'
        existing = NewsletterSubscriber.objects.filter(email__iexact=email).first()
        if existing:
            return Response({
                'success': True,
                'isNew': False,
                'discountCode': existing.discount_code or discount_code,
                'message': f"You're already subscribed! Remember to use your promo code {discount_code} for 10% off.",
            })

        sub = NewsletterSubscriber.objects.create(email=email, discount_code=discount_code)
        return Response({
            'success': True,
            'isNew': True,
            'discountCode': discount_code,
            'message': f"Welcome to Vendora VIP! Use code {discount_code} for 10% off your next purchase.",
        })


class AdminNewsletterSubscribersView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
        subs = NewsletterSubscriber.objects.all().order_by('-subscribed_at')
        return Response(NewsletterSerializer(subs, many=True).data)


# ── Store Locator ───────────────────────────────────────────────────────

class StoreLocatorListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        queryset = StoreLocation.objects.all()
        query = request.query_params.get('query', '')
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query) | Q(city__icontains=query) | Q(state__icontains=query)
            )
        return Response(StoreLocationSerializer(queryset, many=True).data)
