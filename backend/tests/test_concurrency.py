"""
Concurrency tests for transactional inventory handling.

These tests exercise the atomic checkout path (apps.orders.services.process_checkout_atomic)
under simultaneous requests to prove that inventory is never oversold when
multiple customers race for the last units of stock.

We use TransactionTestCase (not TestCase) because the behaviour under test
depends on real transaction commits/rollbacks — TestCase wraps each test in a
single outer transaction, which would hide the concurrency semantics.
"""
import threading

from django.db import connection, connections
from django.test import TransactionTestCase

from apps.products.models import Category, Product
from apps.cart.models import Cart, CartItem
from apps.orders.models import Order, OrderItem
from apps.orders.services import process_checkout_atomic, OrderProcessingError


class InventoryConcurrencyTest(TransactionTestCase):
    reset_sequences = True

    def setUp(self):
        self.category = Category.objects.create(name='Tech', slug='tech-concurrency')

    def _make_product(self, stock):
        return Product.objects.create(
            category=self.category,
            name='Limited Edition Gadget',
            slug='limited-edition-gadget',
            description='Only a few in stock.',
            price='20.00',
            stock_quantity=stock,
        )

    def _make_cart_for(self, product, qty, session_key):
        cart = Cart.objects.create(session_key=session_key)
        CartItem.objects.create(cart=cart, product=product, quantity=qty)
        return cart

    def _checkout_worker(self, session_key, results, index):
        """Run a single checkout in its own thread/connection."""
        customer_data = {
            'fullName': f'Racer {index}',
            'email': f'racer{index}@example.com',
            'phone': '+1000000000',
            'address': '1 Race Street',
            'cartKey': session_key,
        }
        try:
            order = process_checkout_atomic(user=None, customer_data=customer_data)
            results[index] = ('ok', order.id)
        except OrderProcessingError as exc:
            results[index] = ('rejected', str(exc))
        except Exception as exc:  # pragma: no cover - surfaces unexpected errors
            results[index] = ('error', repr(exc))
        finally:
            # Each thread uses its own DB connection; close it to release locks.
            connections.close_all()

    def test_no_oversell_under_concurrent_checkouts(self):
        """
        10 buyers each try to buy 1 unit of a product that only has 3 in stock.
        Exactly 3 orders must succeed, 7 must be rejected, and final stock == 0.
        """
        stock = 3
        buyers = 10
        product = self._make_product(stock)

        sessions = []
        for i in range(buyers):
            key = f'race-{i}'
            self._make_cart_for(product, qty=1, session_key=key)
            sessions.append(key)

        results = [None] * buyers
        threads = [
            threading.Thread(target=self._checkout_worker, args=(sessions[i], results, i))
            for i in range(buyers)
        ]
        for t in threads:
            t.start()
        for t in threads:
            t.join(timeout=30)

        successes = [r for r in results if r and r[0] == 'ok']
        rejections = [r for r in results if r and r[0] == 'rejected']
        errors = [r for r in results if r and r[0] == 'error']

        self.assertEqual(errors, [], f"Unexpected errors during checkout: {errors}")
        self.assertEqual(
            len(successes), stock,
            f"Expected exactly {stock} successful orders, got {len(successes)}. "
            f"results={results}"
        )
        self.assertEqual(len(rejections), buyers - stock)

        product.refresh_from_db()
        self.assertEqual(product.stock_quantity, 0, "Stock must never go negative.")

        # Total quantity across all created orders must equal the original stock.
        total_ordered = sum(
            oi.quantity for oi in OrderItem.objects.filter(product=product)
        )
        self.assertEqual(total_ordered, stock)
        self.assertEqual(Order.objects.count(), stock)

    def test_no_oversell_with_multi_unit_carts(self):
        """
        Product has 5 units. Three buyers want 2, 2, and 2 units respectively.
        At most 2 can succeed (2+2=4 <= 5); the third must be rejected, and
        stock must never go negative.
        """
        stock = 5
        product = self._make_product(stock)

        sessions = []
        for i in range(3):
            key = f'multi-{i}'
            self._make_cart_for(product, qty=2, session_key=key)
            sessions.append(key)

        results = [None] * 3
        threads = [
            threading.Thread(target=self._checkout_worker, args=(sessions[i], results, i))
            for i in range(3)
        ]
        for t in threads:
            t.start()
        for t in threads:
            t.join(timeout=30)

        successes = [r for r in results if r and r[0] == 'ok']
        errors = [r for r in results if r and r[0] == 'error']

        self.assertEqual(errors, [], f"Unexpected errors: {errors}")
        product.refresh_from_db()

        # Never oversold: remaining stock is non-negative and consistent with sales.
        self.assertGreaterEqual(product.stock_quantity, 0)
        sold = sum(oi.quantity for oi in OrderItem.objects.filter(product=product))
        self.assertEqual(sold + product.stock_quantity, stock)
        # 2 units per successful order.
        self.assertEqual(sold, len(successes) * 2)
        # Given 2-unit carts and 5 in stock, at most two orders can clear.
        self.assertLessEqual(len(successes), 2)

    def test_sequential_checkout_rejects_when_depleted(self):
        """A straightforward (non-threaded) guard: once stock hits zero the next
        checkout is rejected rather than driving inventory negative."""
        product = self._make_product(1)
        self._make_cart_for(product, qty=1, session_key='seq-1')
        self._make_cart_for(product, qty=1, session_key='seq-2')

        order = process_checkout_atomic(user=None, customer_data={
            'fullName': 'First Buyer', 'email': 'first@example.com',
            'phone': '+1', 'address': 'x', 'cartKey': 'seq-1',
        })
        self.assertIsNotNone(order.id)

        with self.assertRaises(OrderProcessingError):
            process_checkout_atomic(user=None, customer_data={
                'fullName': 'Second Buyer', 'email': 'second@example.com',
                'phone': '+1', 'address': 'x', 'cartKey': 'seq-2',
            })

        product.refresh_from_db()
        self.assertEqual(product.stock_quantity, 0)
