"""
Sitemap generation for SEO.
"""
from django.contrib.sitemaps import Sitemap
from django.urls import reverse
from apps.products.models import Product, Category


class ProductSitemap(Sitemap):
    changefreq = 'weekly'
    priority = 0.8

    def items(self):
        return Product.objects.filter(stock_quantity__gt=0).order_by('-created_at')

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return f'/products/{obj.id}'


class CategorySitemap(Sitemap):
    changefreq = 'daily'
    priority = 0.7

    def items(self):
        return Category.objects.all()

    def location(self, obj):
        return f'/products?category={obj.slug}'


class StaticViewSitemap(Sitemap):
    priority = 1.0
    changefreq = 'daily'

    def items(self):
        return ['home', 'products', 'about']

    def location(self, item):
        if item == 'home':
            return '/'
        elif item == 'products':
            return '/products'
        elif item == 'about':
            return '/about'
        return '/'
