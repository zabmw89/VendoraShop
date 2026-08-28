"""
Tests for payment integration and Stripe webhook handling.

These tests never contact Stripe's servers — the Stripe SDK calls are mocked —
so they run deterministically in CI without any API keys.
"""
from decimal import Decimal
from unittest import mock

from django.test import TestCase, override_settings
from django.urls import reverse

from apps.products.models import Category, Product
from apps.orders.models import Order, Payment
from apps.orders.payment_service import PaymentService, PaymentError


def _make_order(status='pending', total='100.00'):
    return Order.objects.create(
        status=status,
        total_amount=Decimal(total),
        subtotal_amount=Decimal(total),
        full_name='Test Buyer',
        email='buyer@example.com',
        phone='+1000000000',
        shipping_address='1 Test St',
        payment_method='stripe',
    )


@override_settings(
    STRIPE_SECRET_KEY='sk_test_dummy',
    STRIPE_PUBLISHABLE_KEY='pk_test_dummy',
    STRIPE_WEBHOOK_SECRET='whsec_dummy',
)
class CreatePaymentIntentTest(TestCase):
    def setUp(self):
        self.order = _make_order()

    def test_create_intent_success(self):
        fake_intent = mock.Mock()
        fake_intent.id = 'pi_test_123'
        fake_intent.client_secret = 'pi_test_123_secret_abc'

        with mock.patch('stripe.PaymentIntent.create', return_value=fake_intent) as create:
            res = self.client.post(
                '/api/payments/create-intent/',
                {'order_id': self.order.id},
                content_type='application/json',
            )

        self.assertEqual(res.status_code, 201, res.content)
        body = res.json()
        self.assertEqual(body['clientSecret'], 'pi_test_123_secret_abc')
        self.assertEqual(body['paymentIntentId'], 'pi_test_123')
        self.assertEqual(body['publishableKey'], 'pk_test_dummy')

        # A processing Payment linked to the intent must exist.
        payment = Payment.objects.get(order=self.order)
        self.assertEqual(payment.status, 'processing')
        self.assertEqual(payment.provider, 'stripe')
        self.assertEqual(payment.provider_payment_id, 'pi_test_123')

        # Stripe was called with amount in cents.
        _, kwargs = create.call_args
        self.assertEqual(kwargs['amount'], 10000)
        self.assertEqual(kwargs['metadata']['order_id'], str(self.order.id))

    def test_create_intent_missing_order_id(self):
        res = self.client.post('/api/payments/create-intent/', {}, content_type='application/json')
        self.assertEqual(res.status_code, 400)

    def test_create_intent_order_not_found(self):
        res = self.client.post(
            '/api/payments/create-intent/',
            {'order_id': 999999},
            content_type='application/json',
        )
        self.assertEqual(res.status_code, 404)

    def test_create_intent_stripe_failure_marks_payment_failed(self):
        with mock.patch('stripe.PaymentIntent.create', side_effect=Exception('boom')):
            res = self.client.post(
                '/api/payments/create-intent/',
                {'order_id': self.order.id},
                content_type='application/json',
            )
        self.assertEqual(res.status_code, 502)
        payment = Payment.objects.get(order=self.order)
        self.assertEqual(payment.status, 'failed')
        self.assertIn('boom', payment.error_message)


class PaymentConfigTest(TestCase):
    @override_settings(STRIPE_PUBLISHABLE_KEY='pk_test_xyz', STRIPE_SECRET_KEY='sk_test_xyz')
    def test_config_exposes_publishable_key_only(self):
        res = self.client.get('/api/payments/config/')
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body['publishableKey'], 'pk_test_xyz')
        self.assertTrue(body['stripeEnabled'])
        # Secret key must never be exposed.
        self.assertNotIn('sk_test_xyz', res.content.decode())


@override_settings(STRIPE_WEBHOOK_SECRET='whsec_dummy', STRIPE_SECRET_KEY='sk_test_dummy')
class StripeWebhookVerificationTest(TestCase):
    def setUp(self):
        self.order = _make_order(status='pending')
        self.payment = Payment.objects.create(
            order=self.order,
            provider='stripe',
            status='processing',
            amount=self.order.total_amount,
            currency='USD',
            provider_payment_id='pi_test_abc',
        )

    def test_webhook_rejects_missing_signature(self):
        # construct_event will raise because the signature header is empty.
        res = self.client.post(
            '/api/payments/webhook/stripe/',
            data='{}',
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='',
        )
        self.assertEqual(res.status_code, 400)

    def test_webhook_rejects_invalid_signature(self):
        res = self.client.post(
            '/api/payments/webhook/stripe/',
            data='{"id": "evt_1"}',
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='t=1,v1=bogus',
        )
        self.assertEqual(res.status_code, 400)

    @override_settings(STRIPE_WEBHOOK_SECRET='')
    def test_webhook_rejects_when_secret_not_configured(self):
        res = self.client.post(
            '/api/payments/webhook/stripe/',
            data='{"id": "evt_1"}',
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='t=1,v1=whatever',
        )
        self.assertEqual(res.status_code, 400)

    def _post_verified_event(self, event):
        """Send a webhook whose signature verification is mocked to succeed."""
        with mock.patch(
            'apps.orders.payment_service.PaymentService.verify_and_parse_webhook',
            return_value=event,
        ):
            return self.client.post(
                '/api/payments/webhook/stripe/',
                data='{}',
                content_type='application/json',
                HTTP_STRIPE_SIGNATURE='t=1,v1=valid',
            )

    def test_webhook_payment_succeeded_updates_state(self):
        event = {
            'type': 'payment_intent.succeeded',
            'data': {'object': {
                'id': 'pi_test_abc',
                'metadata': {'payment_id': str(self.payment.id), 'order_id': str(self.order.id)},
                'charges': {'data': [{
                    'payment_method_details': {'card': {'brand': 'visa', 'last4': '4242'}}
                }]},
            }},
        }
        res = self._post_verified_event(event)
        self.assertEqual(res.status_code, 200, res.content)

        self.payment.refresh_from_db()
        self.order.refresh_from_db()
        self.assertEqual(self.payment.status, 'succeeded')
        self.assertEqual(self.payment.card_brand, 'visa')
        self.assertEqual(self.payment.card_last4, '4242')
        # Order advanced out of pending.
        self.assertEqual(self.order.status, 'processing')

    def test_webhook_succeeded_is_idempotent(self):
        self.payment.status = 'succeeded'
        self.payment.save()
        event = {
            'type': 'payment_intent.succeeded',
            'data': {'object': {'id': 'pi_test_abc', 'metadata': {}}},
        }
        res = self._post_verified_event(event)
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json().get('idempotent'))

    def test_webhook_payment_failed_updates_state(self):
        event = {
            'type': 'payment_intent.payment_failed',
            'data': {'object': {
                'id': 'pi_test_abc',
                'metadata': {'payment_id': str(self.payment.id)},
                'last_payment_error': {'message': 'Your card was declined.'},
            }},
        }
        res = self._post_verified_event(event)
        self.assertEqual(res.status_code, 200)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, 'failed')
        self.assertIn('declined', self.payment.error_message)

    def test_webhook_charge_refunded_updates_state(self):
        self.payment.status = 'succeeded'
        self.payment.save()
        event = {
            'type': 'charge.refunded',
            'data': {'object': {
                'payment_intent': 'pi_test_abc',
                'amount_refunded': 10000,
            }},
        }
        res = self._post_verified_event(event)
        self.assertEqual(res.status_code, 200)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, 'refunded')
        self.assertEqual(self.payment.metadata.get('refund_amount'), '100')

    def test_webhook_unknown_event_ignored(self):
        event = {'type': 'customer.created', 'data': {'object': {}}}
        res = self._post_verified_event(event)
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.json().get('handled'))


class WebhookServiceUnitTest(TestCase):
    """Directly exercise verify_and_parse_webhook error mapping."""

    @override_settings(STRIPE_WEBHOOK_SECRET='')
    def test_missing_secret_raises(self):
        with self.assertRaises(PaymentError):
            PaymentService.verify_and_parse_webhook(b'{}', 'sig')

    @override_settings(STRIPE_WEBHOOK_SECRET='whsec_dummy')
    def test_bad_signature_raises(self):
        with self.assertRaises(PaymentError):
            PaymentService.verify_and_parse_webhook(b'{}', 't=1,v1=bad')
