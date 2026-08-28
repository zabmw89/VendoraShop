from django.test import TestCase
from django.contrib.auth.models import User
from apps.products.models import Category, Product, Review


class ProductTestCase(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name='Electronics', slug='electronics')
        self.audio_cat = Category.objects.create(name='Audio', slug='audio')

        self.headphones = Product.objects.create(
            category=self.audio_cat,
            name='Noise-Cancelling Headphones',
            slug='noise-cancelling-headphones',
            description='Premium wireless sound',
            price=199.99,
            original_price=249.99,
            stock_quantity=10,
            is_featured=True,
            rating=4.8,
            review_count=50,
        )
        self.laptop = Product.objects.create(
            category=self.category,
            name='NovaBook Pro Laptop',
            slug='novabook-pro-laptop',
            description='Ultra-thin aluminum workstation',
            price=1399.00,
            original_price=1549.00,
            stock_quantity=5,
            is_featured=False,
            rating=4.5,
            review_count=20,
        )
        self.earbuds = Product.objects.create(
            category=self.audio_cat,
            name='Earbuds Pro',
            slug='earbuds-pro',
            description='Crisp in-ear audio',
            price=79.99,
            stock_quantity=0,  # Out of stock
            is_featured=True,
            rating=4.2,
            review_count=10,
        )

    # --- Basic CRUD ---

    def test_product_list(self):
        response = self.client.get('/api/products/')
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 3)

    def test_product_detail_by_slug(self):
        response = self.client.get('/api/products/novabook-pro-laptop/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['name'], 'NovaBook Pro Laptop')

    def test_product_detail_by_id(self):
        response = self.client.get(f'/api/products/{self.laptop.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['name'], 'NovaBook Pro Laptop')

    def test_product_detail_not_found(self):
        response = self.client.get('/api/products/nonexistent-product/')
        self.assertEqual(response.status_code, 404)

    # --- Search ---

    def test_search_by_name(self):
        response = self.client.get('/api/products/?search=Headphones')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Noise-Cancelling Headphones')

    def test_search_by_description(self):
        response = self.client.get('/api/products/?search=aluminum')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['slug'], 'novabook-pro-laptop')

    def test_search_no_results(self):
        response = self.client.get('/api/products/?search=nonexistent')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 0)

    # --- Category filter ---

    def test_filter_by_category_slug(self):
        response = self.client.get('/api/products/?category=audio')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)  # headphones + earbuds

    def test_filter_by_category_name(self):
        response = self.client.get('/api/products/?category=Electronics')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'NovaBook Pro Laptop')

    def test_filter_by_category_all(self):
        response = self.client.get('/api/products/?category=all')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 3)

    # --- Stock filter ---

    def test_filter_in_stock(self):
        response = self.client.get('/api/products/?inStock=true')
        self.assertEqual(response.status_code, 200)
        names = [p['name'] for p in response.data]
        self.assertNotIn('Earbuds Pro', names)  # stock_quantity=0
        self.assertIn('NovaBook Pro Laptop', names)

    # --- Featured filter ---

    def test_filter_featured(self):
        response = self.client.get('/api/products/?featured=true')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)  # headphones + earbuds

    # --- Price range filters ---

    def test_filter_min_price(self):
        response = self.client.get('/api/products/?minPrice=100')
        self.assertEqual(response.status_code, 200)
        names = [p['name'] for p in response.data]
        self.assertIn('NovaBook Pro Laptop', names)
        self.assertNotIn('Earbuds Pro', names)

    def test_filter_max_price(self):
        response = self.client.get('/api/products/?maxPrice=200')
        self.assertEqual(response.status_code, 200)
        names = [p['name'] for p in response.data]
        self.assertIn('Noise-Cancelling Headphones', names)
        self.assertNotIn('NovaBook Pro Laptop', names)

    def test_filter_price_range(self):
        response = self.client.get('/api/products/?minPrice=50&maxPrice=300')
        self.assertEqual(response.status_code, 200)
        names = [p['name'] for p in response.data]
        self.assertIn('Noise-Cancelling Headphones', names)
        self.assertIn('Earbuds Pro', names)
        self.assertNotIn('NovaBook Pro Laptop', names)

    def test_filter_invalid_price(self):
        response = self.client.get('/api/products/?minPrice=abc')
        self.assertEqual(response.status_code, 200)  # Invalid price ignored

    # --- Sort ---

    def test_sort_price_asc(self):
        response = self.client.get('/api/products/?sort=price-asc')
        self.assertEqual(response.status_code, 200)
        prices = [float(p['price']) for p in response.data]
        self.assertEqual(prices, sorted(prices))

    def test_sort_price_desc(self):
        response = self.client.get('/api/products/?sort=price-desc')
        self.assertEqual(response.status_code, 200)
        prices = [float(p['price']) for p in response.data]
        self.assertEqual(prices, sorted(prices, reverse=True))

    def test_sort_rating(self):
        response = self.client.get('/api/products/?sort=rating')
        self.assertEqual(response.status_code, 200)
        ratings = [float(p['rating']) for p in response.data]
        self.assertEqual(ratings, sorted(ratings, reverse=True))

    def test_sort_newest_default(self):
        response = self.client.get('/api/products/')
        self.assertEqual(response.status_code, 200)

    # --- Category list ---

    def test_category_list(self):
        response = self.client.get('/api/categories/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)

    # --- Combined filters ---

    def test_combined_search_and_category(self):
        response = self.client.get('/api/products/?search=Headphones&category=audio')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_combined_featured_and_in_stock(self):
        response = self.client.get('/api/products/?featured=true&inStock=true')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)  # Only headphones (earbuds out of stock)

    # --- sortBy param (frontend sends sortBy, backend also accepts sort) ---

    def test_sort_by_param_from_frontend(self):
        """Frontend sends 'sortBy' — backend should accept it."""
        response = self.client.get('/api/products/?sortBy=price-asc')
        self.assertEqual(response.status_code, 200)
        prices = [float(p['price']) for p in response.data]
        self.assertEqual(prices, sorted(prices))

    def test_sort_by_param_price_desc(self):
        response = self.client.get('/api/products/?sortBy=price-desc')
        self.assertEqual(response.status_code, 200)
        prices = [float(p['price']) for p in response.data]
        self.assertEqual(prices, sorted(prices, reverse=True))

    def test_sort_by_param_rating(self):
        response = self.client.get('/api/products/?sortBy=rating')
        self.assertEqual(response.status_code, 200)
        ratings = [float(p['rating']) for p in response.data]
        self.assertEqual(ratings, sorted(ratings, reverse=True))

    def test_sort_invalid_value_defaults_to_newest(self):
        response = self.client.get('/api/products/?sort=invalid-sort')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 3)

    def test_max_price_invalid_value(self):
        response = self.client.get('/api/products/?maxPrice=xyz')
        self.assertEqual(response.status_code, 200)  # Invalid price ignored



class AdminProductCRUDTest(TestCase):
    """Test admin product create, update, delete endpoints."""

    def setUp(self):
        self.admin = User.objects.create_user('admin@test.com', 'admin@test.com', 'pass1234')
        self.admin.profile.role = 'admin'
        self.admin.profile.is_email_verified = True
        self.admin.profile.save()

        self.customer = User.objects.create_user('cust@test.com', 'cust@test.com', 'pass1234')
        self.customer.profile.role = 'customer'
        self.customer.profile.is_email_verified = True
        self.customer.profile.save()

        self.category = Category.objects.create(name='Tech', slug='tech')
        self.product = Product.objects.create(
            category=self.category,
            name='Test Product',
            slug='test-product',
            description='A test product',
            price=49.99,
            stock_quantity=20,
        )

    def _admin_login(self):
        self.client.login(username='admin@test.com', password='pass1234')

    def _customer_login(self):
        self.client.login(username='cust@test.com', password='pass1234')

    # --- POST (Create) ---

    def test_admin_create_product(self):
        self._admin_login()
        payload = {
            'name': 'New Widget',
            'slug': 'new-widget',
            'category': self.category.id,
            'description': 'A new widget',
            'price': 29.99,
            'stock_quantity': 50,
        }
        response = self.client.post('/api/products/', payload, content_type='application/json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['name'], 'New Widget')
        self.assertTrue(Product.objects.filter(slug='new-widget').exists())

    def test_admin_create_product_invalid_data(self):
        self._admin_login()
        response = self.client.post('/api/products/', {}, content_type='application/json')
        self.assertEqual(response.status_code, 400)

    def test_customer_cannot_create_product(self):
        self._customer_login()
        payload = {'name': 'Hack', 'slug': 'hack', 'price': 1, 'stock_quantity': 1}
        response = self.client.post('/api/products/', payload, content_type='application/json')
        self.assertEqual(response.status_code, 403)

    def test_unauthenticated_cannot_create_product(self):
        payload = {'name': 'Hack', 'slug': 'hack', 'price': 1, 'stock_quantity': 1}
        response = self.client.post('/api/products/', payload, content_type='application/json')
        self.assertEqual(response.status_code, 403)

    # --- PUT (Update) ---

    def test_admin_update_product_by_slug(self):
        self._admin_login()
        payload = {'name': 'Updated Product', 'price': 99.99}
        response = self.client.put('/api/products/test-product/', payload, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['name'], 'Updated Product')

    def test_admin_update_product_by_id(self):
        self._admin_login()
        payload = {'name': 'ID Updated', 'price': 59.99}
        response = self.client.put(f'/api/products/{self.product.id}/', payload, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['name'], 'ID Updated')

    def test_admin_update_nonexistent_product(self):
        self._admin_login()
        payload = {'name': 'Ghost'}
        response = self.client.put('/api/products/nonexistent/', payload, content_type='application/json')
        self.assertEqual(response.status_code, 404)

    def test_customer_cannot_update_product(self):
        self._customer_login()
        payload = {'name': 'Hacked'}
        response = self.client.put('/api/products/test-product/', payload, content_type='application/json')
        self.assertEqual(response.status_code, 403)

    # --- DELETE ---

    def test_admin_delete_product_by_slug(self):
        self._admin_login()
        response = self.client.delete('/api/products/test-product/')
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Product.objects.filter(slug='test-product').exists())

    def test_admin_delete_product_by_id(self):
        self._admin_login()
        p = Product.objects.create(
            category=self.category, name='Delete Me', slug='delete-me',
            description='Bye', price=10, stock_quantity=1
        )
        response = self.client.delete(f'/api/products/{p.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Product.objects.filter(pk=p.id).exists())

    def test_admin_delete_nonexistent_product(self):
        self._admin_login()
        response = self.client.delete('/api/products/ghost-product/')
        self.assertEqual(response.status_code, 404)

    def test_customer_cannot_delete_product(self):
        self._customer_login()
        response = self.client.delete('/api/products/test-product/')
        self.assertEqual(response.status_code, 403)



class ProductReviewTest(TestCase):
    """Test product review creation endpoint."""

    def setUp(self):
        self.user = User.objects.create_user('reviewer@test.com', 'reviewer@test.com', 'pass1234')
        self.user.profile.is_email_verified = True
        self.user.profile.save()

        self.category = Category.objects.create(name='Stuff', slug='stuff')
        self.product = Product.objects.create(
            category=self.category,
            name='Reviewable Product', slug='reviewable',
            description='Review me', price=25.00, stock_quantity=10,
            rating=0, review_count=0,
        )

    def _login(self):
        self.client.login(username='reviewer@test.com', password='pass1234')

    def test_create_review(self):
        self._login()
        payload = {'rating': 5, 'comment': 'Great product!'}
        response = self.client.post(
            f'/api/products/{self.product.id}/reviews/',
            payload, content_type='application/json'
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['rating'], 5)
        self.assertEqual(response.data['comment'], 'Great product!')

    def test_review_updates_product_rating(self):
        self._login()
        self.client.post(
            f'/api/products/{self.product.id}/reviews/',
            {'rating': 4, 'comment': 'Good'},
            content_type='application/json'
        )
        self.product.refresh_from_db()
        self.assertEqual(self.product.rating, 4.0)
        self.assertEqual(self.product.review_count, 1)

    def test_multiple_reviews_average(self):
        self._login()
        self.client.post(
            f'/api/products/{self.product.id}/reviews/',
            {'rating': 3, 'comment': 'Okay'},
            content_type='application/json'
        )
        self.client.post(
            f'/api/products/{self.product.id}/reviews/',
            {'rating': 5, 'comment': 'Excellent'},
            content_type='application/json'
        )
        self.product.refresh_from_db()
        self.assertEqual(self.product.rating, 4.0)
        self.assertEqual(self.product.review_count, 2)

    def test_review_invalid_rating_non_numeric(self):
        self._login()
        payload = {'rating': 'not-a-number', 'comment': 'Bad'}
        response = self.client.post(
            f'/api/products/{self.product.id}/reviews/',
            payload, content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)

    def test_review_rating_too_high(self):
        self._login()
        payload = {'rating': 10, 'comment': 'Too high'}
        response = self.client.post(
            f'/api/products/{self.product.id}/reviews/',
            payload, content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)

    def test_review_rating_too_low(self):
        self._login()
        payload = {'rating': 0, 'comment': 'Too low'}
        response = self.client.post(
            f'/api/products/{self.product.id}/reviews/',
            payload, content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)

    def test_review_rating_negative(self):
        self._login()
        payload = {'rating': -3, 'comment': 'Negative'}
        response = self.client.post(
            f'/api/products/{self.product.id}/reviews/',
            payload, content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)

    def test_review_product_not_found(self):
        self._login()
        payload = {'rating': 5, 'comment': 'Nice'}
        response = self.client.post(
            '/api/products/99999/reviews/',
            payload, content_type='application/json'
        )
        self.assertEqual(response.status_code, 404)

    def test_unauthenticated_review(self):
        payload = {'rating': 5, 'comment': 'No auth'}
        response = self.client.post(
            f'/api/products/{self.product.id}/reviews/',
            payload, content_type='application/json'
        )
        self.assertEqual(response.status_code, 401)
