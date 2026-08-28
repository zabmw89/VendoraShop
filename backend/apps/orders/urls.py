from django.urls import path
from .views import OrderListCreateView, OrderDetailView
from .views_extra import (
    OrderTrackingView,
    OrderAdvanceTrackingView,
    AdminOrderListView,
    AdminOrderStatusView,
)
from .payment_views import (
    PaymentConfigView,
    CreatePaymentIntentView,
    StripeWebhookView,
)

urlpatterns = [
    path('', OrderListCreateView.as_view(), name='order-list-create'),
    path('<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('<int:pk>/tracking/', OrderTrackingView.as_view(), name='order-tracking'),
    path('<int:pk>/advance-tracking/', OrderAdvanceTrackingView.as_view(), name='order-advance-tracking'),

    # Admin order management
    path('admin/orders/', AdminOrderListView.as_view(), name='admin-order-list'),
    path('admin/orders/<int:pk>/status/', AdminOrderStatusView.as_view(), name='admin-order-status'),
]

# Payment endpoints (mounted under /api/payments/ from config.urls)
payment_urlpatterns = [
    path('config/', PaymentConfigView.as_view(), name='payment-config'),
    path('create-intent/', CreatePaymentIntentView.as_view(), name='payment-create-intent'),
    path('webhook/stripe/', StripeWebhookView.as_view(), name='payment-webhook-stripe'),
]
