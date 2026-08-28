"""
Payment service abstraction for VendoraShop.
Provides a unified interface for processing payments across different providers.
"""
import os
import logging
from decimal import Decimal

from django.conf import settings
from django.db import transaction

from apps.orders.models import Order
from apps.orders.models import Payment

logger = logging.getLogger(__name__)


class PaymentError(Exception):
    """Raised when a payment operation fails."""
    pass


def _stripe_secret_key():
    """Resolve the Stripe secret key from settings (env-backed)."""
    return getattr(settings, 'STRIPE_SECRET_KEY', '') or os.environ.get('STRIPE_SECRET_KEY', '')


def _stripe_webhook_secret():
    """Resolve the Stripe webhook signing secret from settings (env-backed)."""
    return getattr(settings, 'STRIPE_WEBHOOK_SECRET', '') or os.environ.get('STRIPE_WEBHOOK_SECRET', '')


class PaymentService:
    """
    Abstract payment service interface.
    Subclass this for specific payment providers (Stripe, PayPal, etc.).
    """
    
    @staticmethod
    def process_payment(order, provider='credit_card', payment_data=None):
        """
        Process a payment for the given order.
        
        Args:
            order: Order instance
            provider: Payment provider ('stripe', 'paypal', 'credit_card', 'cash_on_delivery')
            payment_data: Provider-specific payment data (e.g., Stripe token, card details)
        
        Returns:
            Payment instance
        
        Raises:
            PaymentError: If payment processing fails
        """
        payment_data = payment_data or {}
        
        # Create payment record
        payment = Payment.objects.create(
            order=order,
            user=order.user,
            provider=provider,
            amount=order.total_amount,
            currency='USD',
            status='processing',
        )
        
        try:
            if provider == 'stripe':
                payment = PaymentService._process_stripe_payment(payment, payment_data)
            elif provider == 'paypal':
                payment = PaymentService._process_paypal_payment(payment, payment_data)
            elif provider == 'credit_card':
                # Mock credit card payment (always succeeds in dev)
                payment = PaymentService._process_mock_payment(payment, payment_data)
            elif provider == 'cash_on_delivery':
                payment.status = 'pending'
                payment.save()
            else:
                raise PaymentError(f"Unsupported payment provider: {provider}")
            
            return payment
        
        except Exception as e:
            payment.status = 'failed'
            payment.error_message = str(e)
            payment.save()
            logger.error(f"Payment failed for order #{order.id}: {e}")
            raise PaymentError(f"Payment processing failed: {e}")
    
    @staticmethod
    def _process_stripe_payment(payment, payment_data):
        """
        Process payment via Stripe.
        Requires stripe package and STRIPE_SECRET_KEY env var.
        """
        try:
            import stripe
        except ImportError:
            raise PaymentError("Stripe package not installed. Run: pip install stripe")
        
        stripe.api_key = _stripe_secret_key()
        if not stripe.api_key:
            raise PaymentError("STRIPE_SECRET_KEY not configured")
        
        # Get payment method ID from frontend
        payment_method_id = payment_data.get('payment_method_id')
        if not payment_method_id:
            raise PaymentError("payment_method_id required for Stripe payments")
        
        try:
            # Create PaymentIntent
            intent = stripe.PaymentIntent.create(
                amount=int(payment.amount * 100),  # Stripe uses cents
                currency=payment.currency.lower(),
                payment_method=payment_method_id,
                confirm=True,
                automatic_payment_methods={
                    'enabled': True,
                    'allow_redirects': 'never',
                },
            )
            
            if intent.status == 'succeeded':
                payment.status = 'succeeded'
                payment.provider_payment_id = intent.id
                payment.card_brand = intent.charges.data[0].payment_method_details.card.brand if intent.charges.data else ''
                payment.card_last4 = intent.charges.data[0].payment_method_details.card.last4 if intent.charges.data else ''
                payment.save()
            else:
                raise PaymentError(f"Payment intent status: {intent.status}")
        
        except stripe.error.CardError as e:
            raise PaymentError(f"Card declined: {e.user_message}")
        except stripe.error.StripeError as e:
            raise PaymentError(f"Stripe error: {str(e)}")
        
        return payment
    
    @staticmethod
    def _process_paypal_payment(payment, payment_data):
        """
        Process payment via PayPal.
        Placeholder for future PayPal integration.
        """
        raise PaymentError("PayPal integration not yet implemented")
    
    @staticmethod
    def _process_mock_payment(payment, payment_data):
        """
        Mock credit card payment for development/testing.
        Always succeeds unless payment_data contains 'fail': True.
        """
        if payment_data.get('fail'):
            raise PaymentError("Mock payment failure (as requested)")
        
        payment.status = 'succeeded'
        payment.provider_payment_id = f"mock_{payment.id}"
        payment.card_brand = payment_data.get('card_brand', 'Visa')
        payment.card_last4 = payment_data.get('card_last4', '4242')
        payment.save()
        
        return payment
    
    @staticmethod
    def create_stripe_payment_intent(order, metadata=None):
        """
        Create a Stripe PaymentIntent for an order and a matching local Payment
        record in the 'processing' state.

        The returned dict contains the ``client_secret`` the frontend needs to
        confirm the payment with Stripe.js. The Payment is only marked
        'succeeded' later, when Stripe calls our verified webhook — we never
        trust the browser to tell us a payment succeeded.

        Returns:
            dict with keys: payment (Payment), client_secret (str),
            payment_intent_id (str), publishable_key (str)
        """
        try:
            import stripe
        except ImportError:
            raise PaymentError("Stripe package not installed. Run: pip install stripe")

        stripe.api_key = _stripe_secret_key()
        if not stripe.api_key:
            raise PaymentError("STRIPE_SECRET_KEY not configured")

        currency = getattr(settings, 'PAYMENT_CURRENCY', 'USD')

        payment = Payment.objects.create(
            order=order,
            user=order.user,
            provider='stripe',
            amount=order.total_amount,
            currency=currency,
            status='processing',
        )

        try:
            intent = stripe.PaymentIntent.create(
                amount=int(order.total_amount * 100),  # cents
                currency=currency.lower(),
                metadata={
                    'order_id': str(order.id),
                    'payment_id': str(payment.id),
                    **(metadata or {}),
                },
                automatic_payment_methods={'enabled': True},
            )
        except Exception as e:  # stripe.error.StripeError and friends
            payment.status = 'failed'
            payment.error_message = str(e)
            payment.save(update_fields=['status', 'error_message', 'updated_at'])
            logger.error("Failed to create Stripe PaymentIntent for order #%s: %s", order.id, e)
            raise PaymentError(f"Failed to initialize payment: {e}")

        payment.provider_payment_id = intent.id
        payment.save(update_fields=['provider_payment_id', 'updated_at'])

        return {
            'payment': payment,
            'client_secret': intent.client_secret,
            'payment_intent_id': intent.id,
            'publishable_key': getattr(settings, 'STRIPE_PUBLISHABLE_KEY', ''),
        }

    @staticmethod
    def verify_and_parse_webhook(payload, sig_header):
        """
        Verify a Stripe webhook signature and return the parsed event.

        Args:
            payload: Raw request body (bytes).
            sig_header: Value of the ``Stripe-Signature`` request header.

        Returns:
            The verified Stripe Event object (dict-like).

        Raises:
            PaymentError: If the signing secret is missing, the payload is
                malformed, or the signature does not verify. Callers should map
                this to HTTP 400 so Stripe retries / flags the delivery.
        """
        try:
            import stripe
        except ImportError:
            raise PaymentError("Stripe package not installed. Run: pip install stripe")

        webhook_secret = _stripe_webhook_secret()
        if not webhook_secret:
            raise PaymentError("STRIPE_WEBHOOK_SECRET not configured")

        try:
            event = stripe.Webhook.construct_event(
                payload=payload,
                sig_header=sig_header,
                secret=webhook_secret,
            )
        except ValueError as e:
            # Invalid payload
            raise PaymentError(f"Invalid webhook payload: {e}")
        except stripe.error.SignatureVerificationError as e:
            raise PaymentError(f"Invalid webhook signature: {e}")

        return event

    @staticmethod
    @transaction.atomic
    def handle_webhook_event(event):
        """
        Apply a verified Stripe webhook event to local Payment/Order state.

        Idempotent: reprocessing the same event (Stripe delivers at-least-once)
        does not double-apply side effects. Unknown event types are ignored.

        Returns:
            dict describing what happened (for logging / the HTTP response).
        """
        event_type = event.get('type', '')
        data_object = event.get('data', {}).get('object', {})

        handlers = {
            'payment_intent.succeeded': PaymentService._on_payment_intent_succeeded,
            'payment_intent.payment_failed': PaymentService._on_payment_intent_failed,
            'charge.refunded': PaymentService._on_charge_refunded,
        }
        handler = handlers.get(event_type)
        if handler is None:
            logger.info("Ignoring unhandled Stripe event type: %s", event_type)
            return {'handled': False, 'type': event_type}

        return handler(data_object)

    @staticmethod
    def _find_payment_for_intent(intent):
        """Locate the local Payment for a Stripe PaymentIntent object."""
        intent_id = intent.get('id', '')
        metadata = intent.get('metadata', {}) or {}

        payment = Payment.objects.filter(provider_payment_id=intent_id).first()
        if payment is None and metadata.get('payment_id'):
            payment = Payment.objects.filter(id=metadata['payment_id']).first()
        return payment

    @staticmethod
    def _on_payment_intent_succeeded(intent):
        payment = PaymentService._find_payment_for_intent(intent)
        if payment is None:
            logger.warning("Stripe succeeded event for unknown PaymentIntent %s", intent.get('id'))
            return {'handled': True, 'type': 'payment_intent.succeeded', 'matched': False}

        if payment.status == 'succeeded':
            # Already processed — idempotent no-op.
            return {'handled': True, 'type': 'payment_intent.succeeded', 'idempotent': True}

        charges = (intent.get('charges', {}) or {}).get('data', [])
        card = {}
        if charges:
            card = (charges[0].get('payment_method_details', {}) or {}).get('card', {}) or {}

        payment.status = 'succeeded'
        payment.provider_payment_id = intent.get('id', payment.provider_payment_id)
        payment.card_brand = card.get('brand', payment.card_brand)
        payment.card_last4 = card.get('last4', payment.card_last4)
        payment.error_message = ''
        payment.save()

        # Move the order out of the initial state now that funds are captured.
        order = payment.order
        if order and order.status == 'pending':
            order.status = 'processing'
            order.save(update_fields=['status', 'updated_at'])

        logger.info("Payment #%s for order #%s marked succeeded via webhook.",
                    payment.id, order.id if order else None)
        return {'handled': True, 'type': 'payment_intent.succeeded', 'payment_id': payment.id}

    @staticmethod
    def _on_payment_intent_failed(intent):
        payment = PaymentService._find_payment_for_intent(intent)
        if payment is None:
            return {'handled': True, 'type': 'payment_intent.payment_failed', 'matched': False}

        if payment.status in ('succeeded', 'refunded'):
            return {'handled': True, 'type': 'payment_intent.payment_failed', 'idempotent': True}

        last_error = intent.get('last_payment_error', {}) or {}
        payment.status = 'failed'
        payment.error_message = last_error.get('message', 'Payment failed.')
        payment.save(update_fields=['status', 'error_message', 'updated_at'])
        logger.info("Payment #%s marked failed via webhook.", payment.id)
        return {'handled': True, 'type': 'payment_intent.payment_failed', 'payment_id': payment.id}

    @staticmethod
    def _on_charge_refunded(charge):
        intent_id = charge.get('payment_intent', '')
        payment = Payment.objects.filter(provider_payment_id=intent_id).first()
        if payment is None:
            return {'handled': True, 'type': 'charge.refunded', 'matched': False}

        if payment.status == 'refunded':
            return {'handled': True, 'type': 'charge.refunded', 'idempotent': True}

        payment.status = 'refunded'
        amount_refunded = charge.get('amount_refunded')
        if amount_refunded is not None:
            payment.metadata['refund_amount'] = str(Decimal(amount_refunded) / 100)
        payment.save()
        logger.info("Payment #%s marked refunded via webhook.", payment.id)
        return {'handled': True, 'type': 'charge.refunded', 'payment_id': payment.id}

    @staticmethod
    def refund_payment(payment, amount=None):
        """
        Refund a payment (full or partial).
        
        Args:
            payment: Payment instance
            amount: Amount to refund (None = full refund)
        
        Returns:
            Updated Payment instance
        """
        if not payment.is_successful:
            raise PaymentError("Can only refund successful payments")
        
        refund_amount = amount or payment.amount
        
        if payment.provider == 'stripe':
            try:
                import stripe
                stripe.api_key = _stripe_secret_key()
                
                stripe.Refund.create(
                    payment_intent=payment.provider_payment_id,
                    amount=int(refund_amount * 100),
                )
            except Exception as e:
                raise PaymentError(f"Stripe refund failed: {e}")
        
        payment.status = 'refunded'
        payment.metadata['refund_amount'] = str(refund_amount)
        payment.save()
        
        return payment
