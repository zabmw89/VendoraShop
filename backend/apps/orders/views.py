from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Order
from .serializers import OrderSerializer, CheckoutSerializer
from .services import process_checkout_atomic, OrderProcessingError

class OrderListCreateView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if not request.user.is_authenticated:
            email = request.query_params.get('email')
            if email:
                orders = Order.objects.filter(email__iexact=email).order_by('-created_at')
                return Response(OrderSerializer(orders, many=True).data)
            return Response({'error': 'Authentication required to view orders.'}, status=status.HTTP_401_UNAUTHORIZED)

        orders = Order.objects.filter(user=request.user).order_by('-created_at')
        return Response(OrderSerializer(orders, many=True).data)

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = process_checkout_atomic(
                user=request.user if request.user.is_authenticated else None,
                customer_data=serializer.validated_data
            )
            order_data = OrderSerializer(order).data
            return Response({
                'order': order_data,
                'message': 'Order placed successfully.',
                **order_data,
            }, status=status.HTTP_201_CREATED)
        except OrderProcessingError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f'Failed to process order: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class OrderDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.is_authenticated:
            if order.user and order.user != request.user and getattr(request.user.profile, 'role', '') != 'admin':
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        else:
            email = request.query_params.get('email')
            if not email or email.lower() != order.email.lower():
                return Response({'error': 'Permission denied. Please provide the order email.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = OrderSerializer(order)
        return Response(serializer.data)
