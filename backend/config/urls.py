from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.sitemaps.views import sitemap

from apps.products.sitemaps import ProductSitemap, CategorySitemap, StaticViewSitemap

from apps.orders.views_extra import (
    HealthCheckView,
    AdminAnalyticsView,
    AdminProductListView,
    AdminProductDetailView,
    AdminResetDBView,
    CartCouponView,
    LoyaltyAccountView,
    OpenAPISpecView,
)

sitemaps = {
    'products': ProductSitemap,
    'categories': CategorySitemap,
    'static': StaticViewSitemap,
}

urlpatterns = [
    path('sitemap.xml', sitemap, {'sitemaps': sitemaps}, name='django.contrib.sitemaps.views.sitemap'),
    path('admin/', admin.site.urls),
    path('accounts/', include('allauth.urls')),

    # Auth
    path('api/auth/', include('apps.accounts.urls')),

    # Products, categories, brands, wishlist, price alerts, newsletter, stores
    path('api/', include('apps.products.urls')),

    # Cart
    path('api/cart/', include('apps.cart.urls')),
    path('api/cart/coupon/', CartCouponView.as_view(), name='cart-coupon'),

    # Orders, tracking, admin orders
    path('api/orders/', include('apps.orders.urls')),

    # Payments (Stripe intents + verified webhook)
    path('api/payments/', include(('apps.orders.payment_urls', 'payments'), namespace='payments')),

    # Loyalty
    path('api/loyalty/', LoyaltyAccountView.as_view(), name='loyalty-account'),

    # Telemetry (error logs, performance)
    path('api/', include('apps.telemetry.urls')),

    # Admin endpoints
    path('api/admin/analytics/', AdminAnalyticsView.as_view(), name='admin-analytics'),
    path('api/admin/products/', AdminProductListView.as_view(), name='admin-product-list'),
    path('api/admin/products/<str:pk>/', AdminProductDetailView.as_view(), name='admin-product-detail'),
    path('api/admin/reset-db/', AdminResetDBView.as_view(), name='admin-reset-db'),

    # Health check & OpenAPI
    path('api/health/', HealthCheckView.as_view(), name='health-check'),
    path('api/docs/spec.json', OpenAPISpecView.as_view(), name='openapi-spec'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Serve the compiled React SPA (production / single-service deploys). Mounted
# last as a catch-all so /api/, /admin/, /static/, etc. keep priority. Only
# active when a built frontend (dist/) is present.
if getattr(settings, 'SPA_DIST_DIR', None) and settings.SPA_DIST_DIR.exists():
    from django.urls import re_path
    from config.spa import SPAView

    urlpatterns += [
        re_path(r'^(?!api/|admin/|accounts/|static/|media/|sitemap\.xml).*$',
                SPAView.as_view(), name='spa'),
    ]
