from django.urls import path
from .views import (
    CartView, CartItemAddView, CartItemDetailView,
    CartClearView, CartItemUpdateByProductView,
)
from apps.orders.views_extra import CartCouponView

urlpatterns = [
    path('', CartView.as_view(), name='cart-detail'),
    path('items/', CartItemAddView.as_view(), name='cart-item-add'),
    path('items/<int:pk>/', CartItemDetailView.as_view(), name='cart-item-detail'),
    path('item/', CartItemUpdateByProductView.as_view(), name='cart-item-update-by-product'),
    path('coupon/', CartCouponView.as_view(), name='cart-coupon-direct'),
    path('clear/', CartClearView.as_view(), name='cart-clear'),
]
