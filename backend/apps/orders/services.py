import logging
import time

from django.db import transaction, models, OperationalError
from django.utils import timezone
from decimal import Decimal
from apps.products.models import Product, Coupon
from apps.cart.models import Cart
from .models import Order, OrderItem
from apps.accounts.models import LoyaltyTransaction

logger = logging.getLogger(__name__)

# Number of times to retry a checkout that fails with a transient database
# serialization / lock error, and the base backoff (seconds) between attempts.
CHECKOUT_MAX_RETRIES = 12
CHECKOUT_RETRY_BACKOFF = 0.05


class OrderProcessingError(Exception):
    pass


def process_checkout_atomic(user, customer_data, cart_instance=None):
    """
    Transaction-safe checkout with automatic retry on transient DB contention.

    The heavy lifting happens in :func:`_process_checkout_atomic_once`, which
    runs inside a single atomic block using row-level locks and conditional
    inventory decrements. Under heavy concurrency a database may reject a
    transaction with a transient error (SQLite ``database is locked``,
    PostgreSQL serialization failures/deadlocks). Those are safe to retry
    because the whole transaction is rolled back atomically, so we do so with a
    short exponential backoff before giving up.
    """
    last_exc = None
    for attempt in range(1, CHECKOUT_MAX_RETRIES + 1):
        try:
            return _process_checkout_atomic_once(user, customer_data, cart_instance)
        except OperationalError as exc:
            last_exc = exc
            if attempt >= CHECKOUT_MAX_RETRIES:
                break
            sleep_for = CHECKOUT_RETRY_BACKOFF * attempt
            logger.warning(
                "Checkout hit transient DB contention (attempt %s/%s): %s. Retrying in %.3fs.",
                attempt, CHECKOUT_MAX_RETRIES, exc, sleep_for,
            )
            time.sleep(sleep_for)

    raise OrderProcessingError(
        "The store is experiencing heavy demand right now. Please try again in a moment."
    ) from last_exc


def _process_checkout_atomic_once(user, customer_data, cart_instance=None):
    """
    Executes transaction-safe order processing with atomic stock inventory updates.
    Uses database transaction & row-level locking (select_for_update) to prevent race conditions.
    """
    with transaction.atomic():
        if cart_instance is None:
            if user and user.is_authenticated:
                cart_instance = Cart.objects.filter(user=user).first()
                if not cart_instance or not cart_instance.items.exists():
                    session_key = customer_data.get('cartKey')
                    if session_key:
                        cart_instance = Cart.objects.filter(session_key=session_key).first()
            else:
                session_key = customer_data.get('cartKey')
                if session_key:
                    cart_instance = Cart.objects.filter(session_key=session_key, user=None).first()
                if not cart_instance and session_key:
                    cart_instance = Cart.objects.filter(session_key=session_key).first()

        if not cart_instance or not cart_instance.items.exists():
            raise OrderProcessingError("Cannot checkout with an empty cart.")

        cart_items = list(cart_instance.items.select_related('product').all())
        product_ids = [item.product_id for item in cart_items]

        # Acquire lock on products to guarantee atomic inventory deduction
        locked_products = {
            p.id: p for p in Product.objects.select_for_update().filter(id__in=product_ids)
        }

        # Validate stock availability
        subtotal = Decimal('0.00')
        order_items_to_create = []

        for item in cart_items:
            product = locked_products.get(item.product_id)
            if not product:
                raise OrderProcessingError(f"Product '{item.product.name}' is no longer available.")

            if product.stock_quantity < item.quantity:
                raise OrderProcessingError(
                    f"Insufficient stock for '{product.name}'. Requested {item.quantity}, available {product.stock_quantity}."
                )

            item_subtotal = product.price * item.quantity
            subtotal += item_subtotal

            order_items_to_create.append({
                'product': product,
                'product_name': product.name,
                'product_image': product.image,
                'unit_price': product.price,
                'quantity': item.quantity,
                'subtotal': item_subtotal,
            })

        # Calculate shipping and taxes on server
        shipping_amount = Decimal('0.00') if subtotal >= Decimal('50.00') else Decimal('5.00')
        tax_amount = round(subtotal * Decimal('0.08'), 2)
        discount_amount = Decimal('0.00')

        # Apply coupon discount
        coupon_code = customer_data.get('couponCode', '')
        if coupon_code and cart_instance:
            try:
                coupon = Coupon.objects.get(code__iexact=coupon_code, is_active=True)
                if coupon.expires_at and coupon.expires_at < timezone.now():
                    raise OrderProcessingError("This promo code has expired.")
                if coupon.min_spend and subtotal < coupon.min_spend:
                    raise OrderProcessingError(f"Minimum spend of ${coupon.min_spend} required for this promo code.")
                if coupon.discount_percent:
                    discount_amount += Decimal(str(round(float(subtotal * coupon.discount_percent / 100, 2))))
                elif coupon.discount_amount:
                    discount_amount += min(coupon.discount_amount, subtotal)
            except Coupon.DoesNotExist:
                raise OrderProcessingError("Invalid promo code.")

        # Apply loyalty points discount
        redeem_points = customer_data.get('redeemLoyaltyPoints', 0)
        if redeem_points and user and user.is_authenticated:
            txs = LoyaltyTransaction.objects.filter(user=user)
            total_points = sum(t.points for t in txs)
            if total_points < redeem_points:
                raise OrderProcessingError("Insufficient loyalty points.")
            max_redeemable = min(total_points, int(float(subtotal - discount_amount) * 20))
            actual_redeem = min(redeem_points, max_redeemable)
            if actual_redeem > 0:
                discount_amount += Decimal(str(round(actual_redeem / 20, 2)))
                LoyaltyTransaction.objects.create(
                    user=user,
                    type='redeem',
                    points=-actual_redeem,
                    description=f'Redeemed {actual_redeem} points for order discount',
                    order_id=None,
                )

        discount_amount = min(discount_amount, subtotal)
        total_amount = subtotal + shipping_amount + tax_amount - discount_amount

        # Create Order record
        order = Order.objects.create(
            user=user if (user and user.is_authenticated) else None,
            status='processing',
            subtotal_amount=subtotal,
            tax_amount=tax_amount,
            shipping_amount=shipping_amount,
            discount_amount=discount_amount,
            total_amount=total_amount,
            full_name=customer_data.get('fullName', customer_data.get('full_name', '')),
            email=customer_data.get('email', ''),
            phone=customer_data.get('phone', ''),
            shipping_address=customer_data.get('address', customer_data.get('shipping_address', '')),
            city=customer_data.get('city', ''),
            state=customer_data.get('state', ''),
            zip_code=customer_data.get('zipCode', customer_data.get('zip_code', '')),
            payment_method=customer_data.get('paymentMethod', 'credit_card'),
        )

        # Create OrderItems and decrease inventory atomically.
        #
        # Two complementary guards make this safe under concurrent checkouts:
        #   1. select_for_update() above takes row-level locks so a second
        #      transaction blocks until the first commits (PostgreSQL/MySQL).
        #   2. The conditional UPDATE ... WHERE stock_quantity >= quantity below
        #      is a single atomic statement, so it cannot oversell even on
        #      backends where select_for_update is a no-op (e.g. SQLite). If the
        #      row no longer has enough stock, update() returns 0 and we abort
        #      the whole transaction, rolling back any earlier decrements.
        for item_data in order_items_to_create:
            product = item_data['product']
            quantity = item_data['quantity']

            rows_updated = Product.objects.filter(
                id=product.id,
                stock_quantity__gte=quantity,
            ).update(
                stock_quantity=models.F('stock_quantity') - quantity
            )

            if rows_updated == 0:
                # Another concurrent order consumed the stock between our
                # validation read and this write. Abort atomically.
                raise OrderProcessingError(
                    f"Insufficient stock for '{product.name}'. "
                    f"The item sold out while your order was being processed."
                )

            OrderItem.objects.create(
                order=order,
                product=product,
                product_name=item_data['product_name'],
                product_image=item_data['product_image'],
                unit_price=item_data['unit_price'],
                quantity=item_data['quantity'],
                subtotal=item_data['subtotal']
            )

        # Clear cart items and coupon upon successful order creation
        cart_instance.items.all().delete()
        cart_instance.applied_coupon = {}
        cart_instance.save(update_fields=['applied_coupon', 'updated_at'])

        return order
