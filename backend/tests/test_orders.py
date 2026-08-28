from django.test import TestCase
from django.contrib.auth.models import User
from apps.products.models import Category, Product
from apps.cart.models import Cart, CartItem
from apps.orders.models import Order


class OrderTestCase(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name='Tech', slug='tech')
        self.product = Product.objects.create(
            category=self.category,
            name='Smart Watch',
            slug='smart-watch',
            description='Fitness tracking',
            price=150.00,
            stock_quantity=5,
        )
        self.cart = Cart.objects.create(session_key='session_order_test')
        CartItem.objects.create(cart=self.cart, product=self.product, quantity=2)

        # Create a test user
        self.user = User.objects.create_user(
            username='orderuser@example.com',
            email='orderuser@example.com',
            password='testpass123',
        )
        self.user.profile.is_email_verified = True
        self.user.profile.save()

    # --- Create order ---

    def test_order_creation_and_atomic_stock_deduction(self):
        payload = {
            'fullName': 'Alice Wonderland',
            'email': 'alice@example.com',
            'phone': '+1987654321',
            'address': '123 Wonderland Ave',
            'cartKey': 'session_order_test',
        }
        response = self.client.post('/api/orders/', payload, content_type='application/json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Order.objects.count(), 1)

        # Verify atomic stock deduction
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 3)

    def test_order_missing_required_fields(self):
        response = self.client.post('/api/orders/', {'email': 'x@x.com'}, content_type='application/json')
        self.assertEqual(response.status_code, 400)

    def test_order_empty_cart(self):
        empty_cart = Cart.objects.create(session_key='empty_cart')
        payload = {
            'fullName': 'No Items',
            'email': 'noitems@example.com',
            'phone': '+1000000000',
            'address': 'Nowhere',
            'cartKey': 'empty_cart',
        }
        response = self.client.post('/api/orders/', payload, content_type='application/json')
        self.assertEqual(response.status_code, 400)

    # --- Order list (authenticated) ---

    def test_order_list_authenticated(self):
        # Create an order for this user
        self.client.login(username='orderuser@example.com', password='testpass123')
        cart = Cart.objects.create(user=self.user, session_key='user_cart')
        CartItem.objects.create(cart=cart, product=self.product, quantity=1)

        payload = {
            'fullName': 'Test User',
            'email': 'orderuser@example.com',
            'phone': '+1111111111',
            'address': '123 Test St',
            'cartKey': 'user_cart',
        }
        self.client.post('/api/orders/', payload, content_type='application/json')

        # Now list orders
        response = self.client.get('/api/orders/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_order_list_unauthenticated(self):
        response = self.client.get('/api/orders/')
        self.assertEqual(response.status_code, 401)

    def test_order_list_only_own_orders(self):
        # Create order for another user
        other_user = User.objects.create_user(
            username='other@example.com',
            email='other@example.com',
            password='otherpass123',
        )
        other_cart = Cart.objects.create(user=other_user, session_key='other_cart')
        CartItem.objects.create(cart=other_cart, product=self.product, quantity=1)

        self.client.login(username='other@example.com', password='otherpass123')
        self.client.post('/api/orders/', {
            'fullName': 'Other User',
            'email': 'other@example.com',
            'phone': '+2222222222',
            'address': '456 Other St',
            'cartKey': 'other_cart',
        }, content_type='application/json')

        # Login as our user — should see 0 orders
        self.client.login(username='orderuser@example.com', password='testpass123')
        response = self.client.get('/api/orders/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 0)

    # --- Order detail ---

    def test_order_detail(self):
        # Create an order
        payload = {
            'fullName': 'Detail Test',
            'email': 'detail@example.com',
            'phone': '+3333333333',
            'address': '789 Detail Blvd',
            'cartKey': 'session_order_test',
        }
        res = self.client.post('/api/orders/', payload, content_type='application/json')
        order_id = res.data['id']

        response = self.client.get(f'/api/orders/{order_id}/?email=detail@example.com')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['id'], order_id)

    def test_order_detail_not_found(self):
        response = self.client.get('/api/orders/99999/')
        self.assertEqual(response.status_code, 404)

    def test_order_detail_other_user_forbidden(self):
        # Create order as user A (authenticated)
        cart_a = Cart.objects.create(user=self.user, session_key='user_a_cart')
        CartItem.objects.create(cart=cart_a, product=self.product, quantity=1)

        self.client.login(username='orderuser@example.com', password='testpass123')
        res = self.client.post('/api/orders/', {
            'fullName': 'User A',
            'email': 'orderuser@example.com',
            'phone': '+4444444444',
            'address': '123 A St',
            'cartKey': 'user_a_cart',
        }, content_type='application/json')
        order_id = res.data['id']

        # Login as user B and try to view user A's order
        other_user = User.objects.create_user(
            username='userb@example.com',
            email='userb@example.com',
            password='passb123',
        )
        self.client.login(username='userb@example.com', password='passb123')
        response = self.client.get(f'/api/orders/{order_id}/')
        self.assertEqual(response.status_code, 403)

    def test_order_detail_owner_can_view(self):
        # Create order as user
        cart = Cart.objects.create(user=self.user, session_key='owner_cart')
        CartItem.objects.create(cart=cart, product=self.product, quantity=1)

        self.client.login(username='orderuser@example.com', password='testpass123')
        res = self.client.post('/api/orders/', {
            'fullName': 'Owner',
            'email': 'orderuser@example.com',
            'phone': '+5555555555',
            'address': 'Owner St',
            'cartKey': 'owner_cart',
        }, content_type='application/json')
        order_id = res.data['id']

        response = self.client.get(f'/api/orders/{order_id}/')
        self.assertEqual(response.status_code, 200)

    def test_order_creation_returns_order_wrapper_and_fields(self):
        payload = {
            'fullName': 'Bob Builder',
            'email': 'bob@builder.com',
            'phone': '+15551234567',
            'address': '10 Construction Way',
            'cartKey': 'session_order_test',
        }
        res = self.client.post('/api/orders/', payload, content_type='application/json')
        self.assertEqual(res.status_code, 201)
        self.assertIn('order', res.data)
        self.assertIn('id', res.data)
        self.assertEqual(res.data['customerName'], 'Bob Builder')
        self.assertEqual(res.data['customerEmail'], 'bob@builder.com')
        self.assertTrue(len(res.data['items']) > 0)
        self.assertIn('price', res.data['items'][0])
        self.assertIn('productId', res.data['items'][0])

    def test_guest_tracking_lookup(self):
        payload = {
            'fullName': 'Guest Tracker',
            'email': 'guesttrack@example.com',
            'phone': '+15559876543',
            'address': '100 Main St',
            'cartKey': 'session_order_test',
        }
        res = self.client.post('/api/orders/', payload, content_type='application/json')
        self.assertEqual(res.status_code, 201)
        order_id = res.data['id']

        response = self.client.get(f'/api/orders/{order_id}/tracking/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('milestones', response.data)
        self.assertIn('trackingNumber', response.data)
