"""
Payment API views for VendoraShop.

Exposes:
  * POST /api/payments/config/            → publishable key + enabled providers
  * POST /api/payments/create-intent/     → create a Stripe PaymentIntent for an order
  * POST /api/payments/webhook/stripe/    → verified Stripe webhook receiver

Security model:
  * The browser never tells us a payment succeeded — success is only recorded
    when Stripe calls the signature-verified webhook.
  * The webhook endpoint is CSRF-exempt (it's a server-to-server call
    authenticated by the Stripe signature) and public, but every request must
    carry a valid ``Stripe-Signature`` header or it is rejected with 400.
"""
import logging

from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from .models import Order, Payment
from .payment_service import PaymentService, PaymentError

logger = logging.getLogger(__name__)


class PaymentConfigView(APIView):
    """Expose the browser-safe payment configuration (publishable key)."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            'publishableKey': getattr(settings, 'STRIPE_PUBLISHABLE_KEY', ''),
            'currency': getattr(settings, 'PAYMENT_CURRENCY', 'USD'),
            'stripeEnabled': bool(getattr(settings, 'STRIPE_SECRET_KEY', '')),
        })


class CreatePaymentIntentView(APIView):
    """
    Create a Stripe PaymentIntent for an existing order and return the
    client_secret the frontend needs to confirm the card payment.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        order_id = request.data.get('order_id') or request.data.get('orderId')
        if not order_id:
            return Response({'error': 'order_id is required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            order = Order.objects.get(pk=order_id)
        except (Order.DoesNotExist, ValueError, TypeError):
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Authorization: an authenticated user may only pay for their own order
        # (admins excepted). Guest orders (order.user is None) are payable by
        # anyone holding the order id, matching the guest-checkout flow.
        if request.user.is_authenticated and order.user and order.user != request.user:
            is_admin = getattr(getattr(request.user, 'profile', None), 'role', '') == 'admin'
            if not is_admin:
                return Response({'error': 'Permission denied.'},
                                status=status.HTTP_403_FORBIDDEN)

        try:
            result = PaymentService.create_stripe_payment_intent(order)
        except PaymentError as e:
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)

        return Response({
            'clientSecret': result['client_secret'],
            'paymentIntentId': result['payment_intent_id'],
            'publishableKey': result['publishable_key'],
            'paymentId': result['payment'].id,
            'amount': str(order.total_amount),
            'currency': result['payment'].currency,
        }, status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    """
    Receive and process Stripe webhook events.

    Stripe authenticates itself with the ``Stripe-Signature`` header, which we
    verify against STRIPE_WEBHOOK_SECRET. Unverified requests get 400. We never
    require session/JWT auth here — this is a server-to-server callback.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # signature is the authentication

    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

        try:
            event = PaymentService.verify_and_parse_webhook(payload, sig_header)
        except PaymentError as e:
            logger.warning("Rejected Stripe webhook: %s", e)
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = PaymentService.handle_webhook_event(event)
        except Exception as e:  # pragma: no cover - defensive
            # Return 500 so Stripe retries; log for investigation.
            logger.exception("Error handling Stripe webhook event: %s", e)
            return Response({'error': 'Webhook handler error.'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'received': True, **result}, status=status.HTTP_200_OK)
