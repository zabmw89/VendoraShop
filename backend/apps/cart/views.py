from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Cart, CartItem
from apps.products.models import Product
from .serializers import CartSerializer, CartItemSerializer

def get_or_create_cart(request):
    data_cart_key = None
    if hasattr(request, 'data') and isinstance(request.data, dict):
        data_cart_key = request.data.get('cartKey') or request.data.get('cart_key')

    session_key = (
        request.headers.get('X-Cart-Key')
        or request.query_params.get('cartKey')
        or request.query_params.get('cart_key')
        or data_cart_key
        or request.session.session_key
    )

    if request.user.is_authenticated:
        cart, _ = Cart.objects.get_or_create(user=request.user)
        # If guest session_key was provided in headers or body, migrate items
        if session_key:
            guest_cart = Cart.objects.filter(session_key=session_key, user=None).first()
            if guest_cart and guest_cart.id != cart.id:
                for item in guest_cart.items.all():
                    existing_item = CartItem.objects.filter(cart=cart, product=item.product).first()
                    if existing_item:
                        existing_item.quantity += item.quantity
                        existing_item.save()
                    else:
                        item.cart = cart
                        item.save()
                guest_cart.delete()
        return cart
    else:
        if not session_key:
            if not request.session.session_key:
                request.session.create()
            session_key = request.session.session_key
        cart, _ = Cart.objects.get_or_create(session_key=session_key, user=None)
        return cart

class CartView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        cart = get_or_create_cart(request)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    def delete(self, request):
        cart = get_or_create_cart(request)
        cart.items.all().delete()
        cart.applied_coupon = {}
        cart.save()
        return Response(CartSerializer(cart).data)

class CartItemAddView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        cart = get_or_create_cart(request)
        product_id = request.data.get('product_id') or request.data.get('productId')
        try:
            quantity = int(request.data.get('quantity', 1))
        except (TypeError, ValueError):
            return Response({'error': 'quantity must be a valid integer.'}, status=status.HTTP_400_BAD_REQUEST)

        if not product_id:
            return Response({'error': 'product_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = Product.objects.get(pk=product_id)
        except (Product.DoesNotExist, ValueError):
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        if product.stock_quantity < quantity:
            return Response({'error': f'Only {product.stock_quantity} units available in stock.'}, status=status.HTTP_400_BAD_REQUEST)

        item, created = CartItem.objects.get_or_create(cart=cart, product=product)
        if not created:
            new_qty = item.quantity + quantity
            if new_qty > product.stock_quantity:
                return Response({'error': f'Cannot add more than {product.stock_quantity} available units.'}, status=status.HTTP_400_BAD_REQUEST)
            item.quantity = new_qty
        else:
            item.quantity = quantity
        item.save()

        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)

class CartItemDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def patch(self, request, pk):
        cart = get_or_create_cart(request)
        try:
            item = CartItem.objects.get(pk=pk, cart=cart)
        except CartItem.DoesNotExist:
            return Response({'error': 'Cart item not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            quantity = int(request.data.get('quantity', item.quantity))
        except (TypeError, ValueError):
            return Response({'error': 'quantity must be a valid integer.'}, status=status.HTTP_400_BAD_REQUEST)
        if quantity <= 0:
            item.delete()
        else:
            if item.product.stock_quantity < quantity:
                return Response({'error': f'Only {item.product.stock_quantity} units available.'}, status=status.HTTP_400_BAD_REQUEST)
            item.quantity = quantity
            item.save()

        return Response(CartSerializer(cart).data)

    def delete(self, request, pk):
        cart = get_or_create_cart(request)
        try:
            item = CartItem.objects.get(pk=pk, cart=cart)
            item.delete()
            return Response(CartSerializer(cart).data)
        except CartItem.DoesNotExist:
            return Response({'error': 'Cart item not found.'}, status=status.HTTP_404_NOT_FOUND)

class CartClearView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        cart = get_or_create_cart(request)
        cart.items.all().delete()
        return Response(CartSerializer(cart).data)

    def delete(self, request):
        cart = get_or_create_cart(request)
        cart.items.all().delete()
        return Response({'message': 'Cart cleared successfully.'})


class CartItemUpdateByProductView(APIView):
    """PUT /api/cart/item/ — update quantity by productId (Express-compatible)."""
    permission_classes = [permissions.AllowAny]

    def put(self, request):
        cart = get_or_create_cart(request)
        product_id = request.data.get('productId') or request.data.get('product_id')
        if not product_id:
            return Response({'error': 'Product ID and quantity are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quantity = int(request.data.get('quantity', 1))
        except (TypeError, ValueError):
            return Response({'error': 'quantity must be a valid integer.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = Product.objects.get(pk=product_id)
        except (Product.DoesNotExist, ValueError):
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            item = CartItem.objects.get(cart=cart, product=product)
        except CartItem.DoesNotExist:
            return Response({'error': 'Item not in cart.'}, status=status.HTTP_404_NOT_FOUND)

        if quantity <= 0:
            item.delete()
        else:
            if quantity > product.stock_quantity:
                return Response({'error': f'Only {product.stock_quantity} units available.'}, status=status.HTTP_400_BAD_REQUEST)
            item.quantity = quantity
            item.save()

        return Response(CartSerializer(cart).data)

    def delete(self, request):
        """DELETE /api/cart/item/?productId=X — remove item by product id."""
        cart = get_or_create_cart(request)
        data_pid = request.data.get('productId') or request.data.get('product_id') if hasattr(request, 'data') and isinstance(request.data, dict) else None
        product_id = request.query_params.get('productId') or request.query_params.get('product_id') or data_pid
        if not product_id:
            return Response({'error': 'Product ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        CartItem.objects.filter(cart=cart, product_id=product_id).delete()
        return Response(CartSerializer(cart).data)

