from django.urls import path
from .views import CategoryListView, ProductListView, ProductDetailView, ProductReviewCreateView
from .views_extra import (
    BrandListView,
    WishlistListView, WishlistToggleView, WishlistSyncView, WishlistItemDeleteView,
    PriceAlertCreateView, PriceAlertListView, PriceAlertDeleteView, SimulatePriceDropView,
    NewsletterSubscribeView, AdminNewsletterSubscribersView,
    StoreLocatorListView,
)

urlpatterns = [
    # Categories & Brands
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('brands/', BrandListView.as_view(), name='brand-list'),

    # Products
    path('products/', ProductListView.as_view(), name='product-list'),
    path('products/<str:pk_or_slug>/', ProductDetailView.as_view(), name='product-detail'),
    path('products/<int:pk>/reviews/', ProductReviewCreateView.as_view(), name='product-review-create'),

    # Price Alerts
    path('products/<int:product_id>/price-alert/', PriceAlertCreateView.as_view(), name='price-alert-create'),
    path('products/<int:product_id>/simulate-price-drop/', SimulatePriceDropView.as_view(), name='simulate-price-drop'),
    path('price-alerts/', PriceAlertListView.as_view(), name='price-alert-list'),
    path('price-alerts/<int:pk>/', PriceAlertDeleteView.as_view(), name='price-alert-delete'),

    # Wishlist
    path('wishlist/', WishlistListView.as_view(), name='wishlist-list'),
    path('wishlist/toggle/', WishlistToggleView.as_view(), name='wishlist-toggle'),
    path('wishlist/sync/', WishlistSyncView.as_view(), name='wishlist-sync'),
    path('wishlist/<int:product_id>/', WishlistItemDeleteView.as_view(), name='wishlist-item-delete'),

    # Newsletter
    path('newsletter/subscribe/', NewsletterSubscribeView.as_view(), name='newsletter-subscribe'),
    path('admin/subscribers/', AdminNewsletterSubscribersView.as_view(), name='admin-subscribers'),

    # Store Locator
    path('stores/', StoreLocatorListView.as_view(), name='store-list'),
]
