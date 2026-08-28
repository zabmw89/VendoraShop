from django.test import TestCase
from django.contrib.auth.models import User
from apps.products.models import Category, Product, Coupon
from apps.cart.models import Cart, CartItem


class CartTestCase(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name='Audio', slug='audio')
        self.product = Product.objects.create(
            category=self.category,
            name='Earbuds Pro',
            slug='earbuds-pro',
            description='Crisp audio',
            price=99.00,
            stock_quantity=15,
        )
        self.headphones = Product.objects.create(
            category=self.category,
            name='Headphones',
            slug='headphones',
            description='Over-ear',
            price=199.99,
            stock_quantity=3,
        )
        self.cart_key = 'test_session_123'

    def _add_item(self, product_id=None, quantity=2, cart_key=None):
        """Helper to add an item to the cart."""
        pk = product_id or self.product.id
        key = cart_key or self.cart_key
        return self.client.post('/api/cart/items/', {
            'productId': pk,
            'quantity': quantity,
            'cartKey': key,
        }, content_type='application/json', HTTP_X_CART_KEY=key)

    # --- Add items ---

    def test_add_to_cart(self):
        response = self._add_item()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['total_items'], 2)

    def test_add_same_item_twice_merges_quantity(self):
        self._add_item(quantity=2)
        response = self._add_item(quantity=3)
        self.assertEqual(response.status_code, 200)
        # Find the earbuds item — product is a nested object
        items = response.data.get('items', [])
        earbuds = [i for i in items if i['product']['id'] == self.product.id]
        self.assertEqual(len(earbuds), 1)
        self.assertEqual(earbuds[0]['quantity'], 5)

    def test_add_item_exceeds_stock(self):
        response = self._add_item(quantity=20)
        self.assertEqual(response.status_code, 400)
        self.assertIn('stock', str(response.data).lower())

    def test_add_item_merge_exceeds_stock(self):
        self._add_item(quantity=13)
        response = self._add_item(quantity=5)  # 13+5=18 > 15 stock
        self.assertEqual(response.status_code, 400)

    def test_add_item_not_found(self):
        response = self._add_item(product_id=99999)
        self.assertEqual(response.status_code, 404)

    def test_add_item_missing_product_id(self):
        response = self.client.post('/api/cart/items/', {
            'quantity': 1,
        }, content_type='application/json', HTTP_X_CART_KEY=self.cart_key)
        self.assertEqual(response.status_code, 400)

    # --- Get cart ---

    def test_get_cart(self):
        self._add_item()
        response = self.client.get('/api/cart/', HTTP_X_CART_KEY=self.cart_key)
        self.assertEqual(response.status_code, 200)
        self.assertIn('items', response.data)
        self.assertEqual(len(response.data['items']), 1)

    def test_get_empty_cart(self):
        response = self.client.get('/api/cart/', HTTP_X_CART_KEY='empty_cart_key')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['items']), 0)

    # --- Update cart item (PATCH) ---

    def test_update_cart_item_quantity(self):
        self._add_item(quantity=2)
        cart = Cart.objects.get(session_key=self.cart_key)
        item = CartItem.objects.get(cart=cart, product=self.product)

        response = self.client.patch(
            f'/api/cart/items/{item.pk}/',
            {'quantity': 5},
            content_type='application/json',
            HTTP_X_CART_KEY=self.cart_key,
        )
        self.assertEqual(response.status_code, 200)
        item.refresh_from_db()
        self.assertEqual(item.quantity, 5)

    def test_update_cart_item_delete_when_zero(self):
        self._add_item(quantity=3)
        cart = Cart.objects.get(session_key=self.cart_key)
        item = CartItem.objects.get(cart=cart, product=self.product)

        response = self.client.patch(
            f'/api/cart/items/{item.pk}/',
            {'quantity': 0},
            content_type='application/json',
            HTTP_X_CART_KEY=self.cart_key,
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(CartItem.objects.filter(pk=item.pk).exists())

    def test_update_cart_item_exceeds_stock(self):
        self._add_item(quantity=2)
        cart = Cart.objects.get(session_key=self.cart_key)
        item = CartItem.objects.get(cart=cart, product=self.product)

        response = self.client.patch(
            f'/api/cart/items/{item.pk}/',
            {'quantity': 99},
            content_type='application/json',
            HTTP_X_CART_KEY=self.cart_key,
        )
        self.assertEqual(response.status_code, 400)

    def test_update_cart_item_not_found(self):
        response = self.client.patch(
            '/api/cart/items/99999/',
            {'quantity': 1},
            content_type='application/json',
            HTTP_X_CART_KEY=self.cart_key,
        )
        self.assertEqual(response.status_code, 404)

    # --- Delete cart item ---

    def test_delete_cart_item(self):
        self._add_item()
        cart = Cart.objects.get(session_key=self.cart_key)
        item = CartItem.objects.get(cart=cart, product=self.product)

        response = self.client.delete(
            f'/api/cart/items/{item.pk}/',
            HTTP_X_CART_KEY=self.cart_key,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['items']), 0)

    def test_delete_cart_item_not_found(self):
        response = self.client.delete(
            '/api/cart/items/99999/',
            HTTP_X_CART_KEY=self.cart_key,
        )
        self.assertEqual(response.status_code, 404)

    # --- Clear cart ---

    def test_clear_cart(self):
        self._add_item()
        self._add_item(product_id=self.headphones.id, quantity=1)
        response = self.client.post('/api/cart/clear/', {}, HTTP_X_CART_KEY=self.cart_key)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['items']), 0)

    # --- Non-numeric quantity bug fix ---

    def test_add_item_non_numeric_quantity(self):
        response = self.client.post('/api/cart/items/', {
            'productId': self.product.id,
            'quantity': 'abc',
        }, content_type='application/json', HTTP_X_CART_KEY=self.cart_key)
        self.assertEqual(response.status_code, 400)
        self.assertIn('quantity', str(response.data).lower())

    def test_update_item_non_numeric_quantity(self):
        self._add_item(quantity=2)
        cart = Cart.objects.get(session_key=self.cart_key)
        item = CartItem.objects.get(cart=cart, product=self.product)

        response = self.client.patch(
            f'/api/cart/items/{item.pk}/',
            {'quantity': 'not_a_number'},
            content_type='application/json',
            HTTP_X_CART_KEY=self.cart_key,
        )
        self.assertEqual(response.status_code, 400)

    # --- Authenticated user with guest cart migration (lines 10-25) ---

    def test_authenticated_user_migrates_guest_cart(self):
        # Create guest cart with items
        self._add_item(quantity=2)
        guest_cart = Cart.objects.get(session_key=self.cart_key, user=None)
        self.assertEqual(guest_cart.items.count(), 1)

        # Now authenticate and add via cartKey — should migrate guest cart
        user = User.objects.create_user(username='testuser', email='test@example.com', password='testpass123')
        self.client.force_login(user)

        # Add an item to the authenticated user's cart with the guest cartKey
        response = self.client.post('/api/cart/items/', {
            'productId': self.headphones.id,
            'quantity': 1,
            'cartKey': self.cart_key,
        }, content_type='application/json', HTTP_X_CART_KEY=self.cart_key)
        self.assertEqual(response.status_code, 200)

        # Verify guest cart was deleted
        self.assertFalse(Cart.objects.filter(session_key=self.cart_key, user=None).exists())

        # Verify authenticated cart has both items
        user_cart = Cart.objects.get(user=user)
        self.assertEqual(user_cart.items.count(), 2)

    def test_authenticated_user_merges_duplicate_products(self):
        # Add earbuds to guest cart
        self._add_item(product_id=self.product.id, quantity=3)

        user = User.objects.create_user(username='testuser2', email='test2@example.com', password='testpass123')
        self.client.force_login(user)

        # Add the same product to authenticated user's cart with guest cartKey
        response = self.client.post('/api/cart/items/', {
            'productId': self.product.id,
            'quantity': 2,
            'cartKey': self.cart_key,
        }, content_type='application/json', HTTP_X_CART_KEY=self.cart_key)
        self.assertEqual(response.status_code, 200)

        # Verify quantities merged (3+2=5)
        user_cart = Cart.objects.get(user=user)
        item = CartItem.objects.get(cart=user_cart, product=self.product)
        self.assertEqual(item.quantity, 5)

    def test_guest_cart_migration_merges_with_existing_user_item(self):
        """Lines 19-20: user cart already has same product as guest cart during migration."""
        user = User.objects.create_user(username='mergeuser', email='merge@example.com', password='pass123')
        self.client.force_login(user)

        # First add earbuds to the user's own cart (no guest migration)
        response = self.client.post('/api/cart/items/', {
            'productId': self.product.id,
            'quantity': 4,
        }, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        user_cart = Cart.objects.get(user=user)
        self.assertEqual(CartItem.objects.get(cart=user_cart, product=self.product).quantity, 4)

        # Now create a guest cart with the SAME product
        guest_cart = Cart.objects.create(session_key='guest_merge_key')
        CartItem.objects.create(cart=guest_cart, product=self.product, quantity=3)

        # Call get_or_create_cart with guest cartKey — triggers migration + merge
        response = self.client.get('/api/cart/', HTTP_X_CART_KEY='guest_merge_key')
        self.assertEqual(response.status_code, 200)

        # Guest cart should be deleted
        self.assertFalse(Cart.objects.filter(session_key='guest_merge_key').exists())

        # Quantities should be merged (4+3=7)
        user_cart.refresh_from_db()
        item = CartItem.objects.get(cart=user_cart, product=self.product)
        self.assertEqual(item.quantity, 7)

    def test_authenticated_user_no_guest_cart(self):
        # Authenticated user with no guest cart to migrate
        user = User.objects.create_user(username='testuser3', email='test3@example.com', password='testpass123')
        self.client.force_login(user)

        response = self.client.post('/api/cart/items/', {
            'productId': self.product.id,
            'quantity': 1,
        }, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        user_cart = Cart.objects.get(user=user)
        self.assertEqual(user_cart.items.count(), 1)

    # --- Session key fallback (lines 29-31) ---

    def test_guest_cart_uses_session_key_fallback(self):
        # No X-Cart-Key header, no cartKey param — should use session_key
        response = self.client.post('/api/cart/items/', {
            'productId': self.product.id,
            'quantity': 1,
        }, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        # Cart should exist with the session key
        self.assertEqual(Cart.objects.count(), 1)
        cart = Cart.objects.first()
        self.assertIsNone(cart.user)
        self.assertTrue(len(cart.session_key) > 0)

    def test_guest_cart_get_without_cart_key(self):
        # GET cart without X-Cart-Key should use session
        response = self.client.get('/api/cart/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['items']), 0)

    # --- Model __str__ methods ---

    def test_cart_str_with_user(self):
        user = User.objects.create_user(username='cartuser', email='cart@example.com', password='pass123')
        cart = Cart.objects.create(user=user)
        self.assertIn(user.username, str(cart))

    def test_cart_str_guest(self):
        cart = Cart.objects.create(session_key='guest_abc')
        self.assertIn('Guest', str(cart))
        self.assertIn('guest_abc', str(cart))

    def test_cart_item_str(self):
        self._add_item()
        cart = Cart.objects.get(session_key=self.cart_key)
        item = CartItem.objects.get(cart=cart, product=self.product)
        s = str(item)
        self.assertIn(self.product.name, s)
        self.assertIn(str(item.quantity), s)

    # --- CartItemUpdateByProductView (PUT & DELETE by product ID) ---

    def test_update_item_quantity_by_product_id_increase(self):
        self._add_item(quantity=1)
        response = self.client.put('/api/cart/item/', {
            'productId': self.product.id,
            'quantity': 3,
            'cartKey': self.cart_key,
        }, content_type='application/json', HTTP_X_CART_KEY=self.cart_key)
        self.assertEqual(response.status_code, 200)
        cart = Cart.objects.get(session_key=self.cart_key)
        item = CartItem.objects.get(cart=cart, product=self.product)
        self.assertEqual(item.quantity, 3)

    def test_update_item_quantity_by_product_id_decrease(self):
        self._add_item(quantity=4)
        response = self.client.put('/api/cart/item/', {
            'productId': self.product.id,
            'quantity': 2,
            'cartKey': self.cart_key,
        }, content_type='application/json', HTTP_X_CART_KEY=self.cart_key)
        self.assertEqual(response.status_code, 200)
        cart = Cart.objects.get(session_key=self.cart_key)
        item = CartItem.objects.get(cart=cart, product=self.product)
        self.assertEqual(item.quantity, 2)

    def test_update_item_quantity_by_product_id_zero_deletes(self):
        self._add_item(quantity=2)
        response = self.client.put('/api/cart/item/', {
            'productId': self.product.id,
            'quantity': 0,
            'cartKey': self.cart_key,
        }, content_type='application/json', HTTP_X_CART_KEY=self.cart_key)
        self.assertEqual(response.status_code, 200)
        cart = Cart.objects.get(session_key=self.cart_key)
        self.assertFalse(CartItem.objects.filter(cart=cart, product=self.product).exists())

    def test_delete_item_by_product_id(self):
        self._add_item(quantity=2)
        response = self.client.delete(
            f'/api/cart/item/?productId={self.product.id}&cartKey={self.cart_key}',
            HTTP_X_CART_KEY=self.cart_key
        )
        self.assertEqual(response.status_code, 200)
        cart = Cart.objects.get(session_key=self.cart_key)
        self.assertFalse(CartItem.objects.filter(cart=cart, product=self.product).exists())

    # --- Coupon Application and Removal ---

    def test_apply_valid_coupon(self):
        Coupon.objects.create(
            code='SAVE10',
            discount_percent=10,
            is_active=True
        )
        self._add_item(quantity=1)
        response = self.client.post('/api/cart/coupon/', {
            'code': 'SAVE10',
            'cartKey': self.cart_key,
        }, content_type='application/json', HTTP_X_CART_KEY=self.cart_key)
        self.assertEqual(response.status_code, 200)
        self.assertIn('cart', response.data)
        self.assertEqual(response.data['appliedCoupon']['code'], 'SAVE10')

    def test_apply_coupon_minimum_spend_not_met(self):
        Coupon.objects.create(
            code='BIGSPENDER',
            discount_amount=50,
            min_spend=500,
            is_active=True
        )
        self._add_item(quantity=1)  # $99 < $500
        response = self.client.post('/api/cart/coupon/', {
            'code': 'BIGSPENDER',
            'cartKey': self.cart_key,
        }, content_type='application/json', HTTP_X_CART_KEY=self.cart_key)
        self.assertEqual(response.status_code, 400)
        self.assertIn('Minimum spend', response.data.get('error', ''))

    def test_apply_invalid_coupon(self):
        response = self.client.post('/api/cart/coupon/', {
            'code': 'NONEXISTENT',
            'cartKey': self.cart_key,
        }, content_type='application/json', HTTP_X_CART_KEY=self.cart_key)
        self.assertEqual(response.status_code, 400)

    def test_remove_coupon(self):
        Coupon.objects.create(
            code='PROMO15',
            discount_percent=15,
            is_active=True
        )
        self._add_item(quantity=1)
        self.client.post('/api/cart/coupon/', {
            'code': 'PROMO15',
            'cartKey': self.cart_key,
        }, content_type='application/json', HTTP_X_CART_KEY=self.cart_key)

        response = self.client.delete(
            f'/api/cart/coupon/?cartKey={self.cart_key}',
            HTTP_X_CART_KEY=self.cart_key
        )
        self.assertEqual(response.status_code, 200)
        cart = Cart.objects.get(session_key=self.cart_key)
        self.assertEqual(cart.applied_coupon, {})

    def test_delete_cart_clears_cart(self):
        self._add_item(quantity=2)
        response = self.client.delete(
            f'/api/cart/?cartKey={self.cart_key}',
            HTTP_X_CART_KEY=self.cart_key
        )
        self.assertEqual(response.status_code, 200)
        cart = Cart.objects.get(session_key=self.cart_key)
        self.assertEqual(cart.items.count(), 0)
