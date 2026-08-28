from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db.models import Q
from .models import Category, Product, Review
from .serializers import CategorySerializer, ProductSerializer, ProductDetailSerializer, ReviewSerializer

class CategoryListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)

class ProductListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        queryset = Product.objects.all()

        category = request.query_params.get('category')
        search = request.query_params.get('search')
        in_stock = request.query_params.get('inStock') or request.query_params.get('inStockOnly')
        featured = request.query_params.get('featured')
        min_price = request.query_params.get('minPrice')
        max_price = request.query_params.get('maxPrice')
        brand = request.query_params.get('brand')
        brands = request.query_params.get('brands')
        sort = request.query_params.get('sort') or request.query_params.get('sortBy', 'newest')

        if category and category.strip().lower() not in ['all', 'all categories', '']:
            queryset = queryset.filter(Q(category__slug__iexact=category) | Q(category__name__iexact=category))

        if brand and brand.strip().lower() not in ['all', 'all brands', '']:
            queryset = queryset.filter(brand__iexact=brand)

        if brands:
            brand_list = [b.strip() for b in brands.split(',') if b.strip()]
            if brand_list:
                queryset = queryset.filter(brand__in=brand_list)

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(short_description__icontains=search) |
                Q(brand__icontains=search)
            ).distinct()

        if in_stock == 'true':
            queryset = queryset.filter(stock_quantity__gt=0)

        if featured == 'true':
            queryset = queryset.filter(is_featured=True)

        if min_price:
            try:
                queryset = queryset.filter(price__gte=float(min_price))
            except ValueError:
                pass

        if max_price:
            try:
                queryset = queryset.filter(price__lte=float(max_price))
            except ValueError:
                pass

        if sort in ['price-asc', 'price_asc', 'low-to-high']:
            queryset = queryset.order_by('price')
        elif sort in ['price-desc', 'price_desc', 'high-to-low']:
            queryset = queryset.order_by('-price')
        elif sort == 'rating':
            queryset = queryset.order_by('-rating')
        elif sort == 'featured':
            queryset = queryset.order_by('-is_featured', '-rating', '-created_at')
        else:
            queryset = queryset.order_by('-created_at')

        serializer = ProductSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.is_authenticated or getattr(request.user.profile, 'role', '') != 'admin':
            return Response({'error': 'Admin permissions required'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = ProductSerializer(data=request.data)
        if serializer.is_valid():
            product = serializer.save()
            return Response(ProductSerializer(product).data, status=status.HTTP_201_CREATED)
        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

class ProductDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk_or_slug):
        try:
            if pk_or_slug.isdigit():
                product = Product.objects.get(pk=int(pk_or_slug))
            else:
                product = Product.objects.get(slug=pk_or_slug)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProductDetailSerializer(product)
        return Response(serializer.data)

    def put(self, request, pk_or_slug):
        if not request.user.is_authenticated or getattr(request.user.profile, 'role', '') != 'admin':
            return Response({'error': 'Admin permissions required'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            product = Product.objects.get(pk=int(pk_or_slug)) if pk_or_slug.isdigit() else Product.objects.get(slug=pk_or_slug)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProductSerializer(product, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            return Response(ProductSerializer(updated).data)
        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk_or_slug):
        if not request.user.is_authenticated or getattr(request.user.profile, 'role', '') != 'admin':
            return Response({'error': 'Admin permissions required'}, status=status.HTTP_403_FORBIDDEN)

        try:
            product = Product.objects.get(pk=int(pk_or_slug)) if pk_or_slug.isdigit() else Product.objects.get(slug=pk_or_slug)
            product.delete()
            return Response({'message': 'Product deleted successfully.'})
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

class ProductReviewCreateView(APIView):
    def post(self, request, pk):
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required to post a review'}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            product = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            rating = int(request.data.get('rating', 5))
        except (TypeError, ValueError):
            return Response({'error': 'Rating must be a valid integer between 1 and 5'}, status=status.HTTP_400_BAD_REQUEST)

        if not (1 <= rating <= 5):
            return Response({'error': 'Rating must be between 1 and 5'}, status=status.HTTP_400_BAD_REQUEST)

        comment = request.data.get('comment', '')

        review = Review.objects.create(
            product=product,
            user=request.user,
            rating=rating,
            comment=comment
        )

        # Update product average rating
        reviews = product.reviews.all()
        avg_rating = sum(r.rating for r in reviews) / len(reviews) if reviews else 5.0
        product.rating = round(avg_rating, 1)
        product.review_count = len(reviews)
        product.save()

        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)
