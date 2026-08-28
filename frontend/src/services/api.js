import { executeWithRetry, isTransientError } from "../hooks/useRetryableApi";
const API_BASE = "/api";
function getAuthToken() {
  return localStorage.getItem("vendora_auth_token");
}
function getCartKey() {
  let key = localStorage.getItem("vendora_cart_key");
  if (!key) {
    const randomBytes = new Uint8Array(6);
    crypto.getRandomValues(randomBytes);
    key = `session_${Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('')}`;
    localStorage.setItem("vendora_cart_key", key);
  }
  return key;
}
async function request(endpoint, options = {}) {
  const isGetOrSafe = !options.method || options.method === "GET" || options.retry === true;
  const shouldRetry = options.retry !== false && isGetOrSafe;
  const performFetch = async () => {
    const token = getAuthToken();
    const cartKey = getCartKey();
    const headers = {
      "Content-Type": "application/json",
      "X-Cart-Key": cartKey,
      ...options.headers
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  };
  if (shouldRetry) {
    return executeWithRetry(performFetch, {
      maxRetries: options.maxRetries ?? 2,
      initialDelayMs: 600,
      backoffFactor: 2,
      retryCondition: isTransientError
    });
  }
  return performFetch();
}
function normalizeProduct(product) {
  if (!product || typeof product !== "object") return product;
  const normalized = { ...product };
  for (const field of ["price", "original_price", "originalPrice", "rating"]) {
    if (normalized[field] !== null && normalized[field] !== void 0) {
      normalized[field] = Number(normalized[field]);
    }
  }
  if (normalized.stock === undefined) {
    normalized.stock = Number(normalized.stock_quantity ?? normalized.stockQuantity ?? 10);
  }
  return normalized;
}
function normalizeCart(cart) {
  if (!cart || typeof cart !== "object") return cart;
  const items = Array.isArray(cart.items) ? cart.items.map((item) => {
    const prod = normalizeProduct(item.product);
    const pId = item.productId ?? item.product_id ?? prod?.id;
    return {
      ...item,
      id: item.id,
      productId: pId,
      product_id: pId,
      quantity: Number(item.quantity ?? 1),
      product: prod
    };
  }) : [];

  return {
    ...cart,
    items,
    subtotal: Number(cart.subtotal ?? (items.reduce((sum, it) => sum + (it.product?.price || 0) * it.quantity, 0))),
    total_items: Number(cart.total_items ?? cart.totalItems ?? items.reduce((sum, it) => sum + it.quantity, 0)),
    appliedCoupon: cart.appliedCoupon || cart.applied_coupon || null
  };
}

function normalizeOrder(order) {
  if (!order || typeof order !== "object") return order;
  const items = Array.isArray(order.items)
    ? order.items.map((item) => ({
        ...item,
        productId: item.productId || item.product_id || item.product?.id || item.id,
        productName: item.productName || item.product_name || item.product?.name || "Product",
        productImage: item.productImage || item.product_image || (item.product && item.product.images && item.product.images[0]) || "",
        price: Number(item.price ?? item.unit_price ?? 0),
        quantity: Number(item.quantity ?? 1),
        subtotal: Number(item.subtotal ?? (Number(item.price ?? item.unit_price ?? 0) * Number(item.quantity ?? 1))),
      }))
    : [];

  const rawAddress = order.shippingAddress || order.shipping_address;
  const shippingAddress = typeof rawAddress === "object" && rawAddress !== null
    ? {
        fullName: rawAddress.fullName || rawAddress.full_name || order.customerName || order.full_name || "",
        street: rawAddress.street || rawAddress.address || "",
        apartment: rawAddress.apartment || "",
        city: rawAddress.city || order.city || "",
        state: rawAddress.state || order.state || "",
        postalCode: rawAddress.postalCode || rawAddress.postal_code || rawAddress.zip_code || order.zip_code || "",
        country: rawAddress.country || "United States",
        phone: rawAddress.phone || order.phone || "",
      }
    : {
        fullName: order.customerName || order.full_name || "",
        street: typeof rawAddress === "string" ? rawAddress : "",
        apartment: "",
        city: order.city || "",
        state: order.state || "",
        postalCode: order.zip_code || "",
        country: "United States",
        phone: order.phone || "",
      };

  return {
    ...order,
    id: String(order.id),
    customerName: order.customerName || order.full_name || "Valued Customer",
    customerEmail: order.customerEmail || order.email || "",
    customerPhone: order.customerPhone || order.phone || "",
    total: Number(order.total ?? order.total_amount ?? 0),
    subtotal: Number(order.subtotal ?? order.subtotal_amount ?? 0),
    tax: Number(order.tax ?? order.tax_amount ?? 0),
    shippingFee: Number(order.shippingFee ?? order.shipping_amount ?? 0),
    discount: Number(order.discount ?? order.discount_amount ?? 0),
    orderStatus: order.orderStatus || order.status || "processing",
    status: order.status || order.orderStatus || "processing",
    createdAt: order.createdAt || order.created_at || new Date().toISOString(),
    trackingNumber: order.trackingNumber || order.tracking_number || `VDR-${order.id}-US`,
    items,
    shippingAddress,
  };
}

const api = {
  // Auth
  async register(payload) {
    return request("/auth/register/", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  async login(payload) {
    return request("/auth/login/", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  async getMe() {
    return request("/auth/me/");
  },
  async updateProfile(payload) {
    return request("/auth/profile/", {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  },
  async verifyEmail(payload) {
    return request("/auth/verify-email/", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  async resendVerification(payload) {
    return request("/auth/resend-verification/", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  async changePassword(payload) {
    return request("/auth/change-password/", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  async socialLogin(payload) {
    return request("/auth/social/login/", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  async forgotPassword(payload) {
    return request("/auth/forgot-password/", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  async resetPassword(payload) {
    return request("/auth/reset-password/", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  async refreshToken(payload) {
    return request("/auth/token/refresh/", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  // Categories & Brands
  async getCategories() {
    return request("/categories/");
  },
  async getBrands() {
    return request("/brands/");
  },
  // Products
  async getProducts(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.category) params.append("category", filters.category);
    if (filters.brand) params.append("brand", filters.brand);
    if (filters.brands && filters.brands.length > 0) {
      params.append("brands", filters.brands.join(","));
    }
    if (filters.minRating) params.append("minRating", filters.minRating.toString());
    if (filters.onSaleOnly) params.append("onSaleOnly", "true");
    if (filters.minPrice !== void 0) params.append("minPrice", filters.minPrice.toString());
    if (filters.maxPrice !== void 0) params.append("maxPrice", filters.maxPrice.toString());
    if (filters.inStockOnly) params.append("inStockOnly", "true");
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    const response = await request(`/products/?${params.toString()}`);
    if (!Array.isArray(response)) {
      return response?.items
        ? { ...response, items: response.items.map(normalizeProduct) }
        : response;
    }
    const allItems = response.map(normalizeProduct);
    const limit = Number(filters.limit);
    const page = Math.max(1, Number(filters.page) || 1);
    const total = allItems.length;

    if (limit > 0) {
      const startIndex = (page - 1) * limit;
      const items = allItems.slice(startIndex, startIndex + limit);
      return {
        items,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      };
    }

    return {
      items: allItems,
      total,
      totalPages: 1
    };
  },
  async getProductById(id) {
    return normalizeProduct(await request(`/products/${id}/`));
  },
  async addProductReview(productId, payload) {
    return request(`/products/${productId}/reviews/`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  // Cart
  async getCart() {
    const cartKey = getCartKey();
    return normalizeCart(await request(`/cart/?cartKey=${encodeURIComponent(cartKey)}`));
  },
  async addToCart(productId, quantity = 1) {
    const cartKey = getCartKey();
    return normalizeCart(await request("/cart/items/", {
      method: "POST",
      body: JSON.stringify({ productId, quantity, cartKey })
    }));
  },
  async updateCartItem(productId, quantity) {
    const cartKey = getCartKey();
    return normalizeCart(await request("/cart/item/", {
      method: "PUT",
      body: JSON.stringify({ productId, quantity, cartKey })
    }));
  },
  async removeCartItem(productId) {
    const cartKey = getCartKey();
    return normalizeCart(await request(`/cart/item/?productId=${encodeURIComponent(productId)}&cartKey=${encodeURIComponent(cartKey)}`, {
      method: "DELETE"
    }));
  },
  async applyCoupon(code) {
    const cartKey = getCartKey();
    return request("/cart/coupon/", {
      method: "POST",
      body: JSON.stringify({ code, cartKey })
    });
  },
  async removeCoupon() {
    const cartKey = getCartKey();
    return request(`/cart/coupon/?cartKey=${encodeURIComponent(cartKey)}`, {
      method: "DELETE"
    });
  },
  async clearCart() {
    const cartKey = getCartKey();
    return normalizeCart(await request(`/cart/?cartKey=${encodeURIComponent(cartKey)}`, {
      method: "DELETE"
    }));
  },
  // Wishlist
  async getWishlist() {
    const cartKey = getCartKey();
    return request(`/wishlist/?cartKey=${encodeURIComponent(cartKey)}`);
  },
  async toggleWishlist(productId) {
    const cartKey = getCartKey();
    return request("/wishlist/toggle/", {
      method: "POST",
      body: JSON.stringify({ productId, cartKey })
    });
  },
  async addToWishlist(productId) {
    const cartKey = getCartKey();
    return request("/wishlist/", {
      method: "POST",
      body: JSON.stringify({ productId, cartKey })
    });
  },
  async removeFromWishlist(productId) {
    const cartKey = getCartKey();
    return request(`/wishlist/${productId}/?cartKey=${encodeURIComponent(cartKey)}`, {
      method: "DELETE"
    });
  },
  async clearWishlist() {
    const cartKey = getCartKey();
    return request(`/wishlist/?cartKey=${encodeURIComponent(cartKey)}`, {
      method: "DELETE"
    });
  },
  async syncWishlist(productIds) {
    const cartKey = getCartKey();
    return request("/wishlist/sync/", {
      method: "POST",
      body: JSON.stringify({ productIds, cartKey })
    });
  },
  // Loyalty & Rewards
  async getLoyaltyAccount() {
    return request("/loyalty/");
  },
  // Orders
  async createOrder(payload) {
    const cartKey = getCartKey();
    const res = await request("/orders/", {
      method: "POST",
      body: JSON.stringify({ ...payload, cartKey: payload.cartKey || cartKey })
    });
    if (res?.order) {
      return { ...res, order: normalizeOrder(res.order), ...normalizeOrder(res.order) };
    }
    return normalizeOrder(res);
  },
  async getUserOrders(email) {
    const query = email ? `?email=${encodeURIComponent(email)}` : "";
    const res = await request(`/orders/${query}`);
    return Array.isArray(res) ? res.map(normalizeOrder) : [];
  },
  async getOrderById(id) {
    const res = await request(`/orders/${id}/`);
    return normalizeOrder(res?.order || res);
  },
  async getOrderTracking(id) {
    return request(`/orders/${id}/tracking/`);
  },
  async getShipmentTracking(id) {
    return this.getOrderTracking(id);
  },
  async advanceOrderTracking(id) {
    return request(`/orders/${id}/advance-tracking/`, {
      method: "POST"
    });
  },
  // Admin
  async getAdminAnalytics() {
    return request("/admin/analytics/");
  },
  async getAdminProducts() {
    return request("/admin/products/");
  },
  async createAdminProduct(productData) {
    return request("/admin/products/", {
      method: "POST",
      body: JSON.stringify(productData)
    });
  },
  async updateAdminProduct(id, updates) {
    return request(`/admin/products/${id}/`, {
      method: "PUT",
      body: JSON.stringify(updates)
    });
  },
  async deleteAdminProduct(id) {
    return request(`/admin/products/${id}/`, {
      method: "DELETE"
    });
  },
  async getAdminOrders() {
    return request("/admin/orders/");
  },
  async updateAdminOrderStatus(id, status) {
    return request(`/admin/orders/${id}/status/`, {
      method: "PUT",
      body: JSON.stringify({ status })
    });
  },
  async updateOrderStatus(id, status) {
    return this.updateAdminOrderStatus(id, status);
  },
  async createProduct(productData) {
    return this.createAdminProduct(productData);
  },
  async updateProduct(id, updates) {
    return this.updateAdminProduct(id, updates);
  },
  async deleteProduct(id) {
    return this.deleteAdminProduct(id);
  },
  async resetDatabase() {
    return request("/admin/reset-db/", {
      method: "POST"
    });
  },
  // Swagger Specs & Tests
  async getSwaggerSpec() {
    return request("/docs/spec.json");
  },
  async getApiDocs() {
    return this.getSwaggerSpec();
  },
  async runDiagnosticsTests() {
    return request("/tests/run/", {
      method: "POST"
    });
  },
  async runTests() {
    return this.runDiagnosticsTests();
  },
  // Error Logs Telemetry
  async logClientError(payload) {
    return request("/logs/error/", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  async getErrorLogs() {
    return request("/admin/error-logs/");
  },
  async clearErrorLogs() {
    return request("/admin/error-logs/", {
      method: "DELETE"
    });
  },
  // Performance Telemetry & Web Vitals
  async logPerformanceMetric(metric) {
    return request("/logs/performance/", {
      method: "POST",
      body: JSON.stringify(metric)
    });
  },
  async getAdminPerformance() {
    return request("/admin/performance/");
  },
  async clearAdminPerformance() {
    return request("/admin/performance/", {
      method: "DELETE"
    });
  },
  // Store Locator & In-Store Pickup
  async getStores(params) {
    const searchParams = new URLSearchParams();
    if (params?.lat !== void 0) searchParams.set("lat", String(params.lat));
    if (params?.lng !== void 0) searchParams.set("lng", String(params.lng));
    if (params?.query) searchParams.set("query", params.query);
    const qs = searchParams.toString();
    return request(`/stores/${qs ? "?" + qs : ""}`);
  },
  // Newsletter Subscription
  async subscribeNewsletter(email) {
    return request("/newsletter/subscribe/", {
      method: "POST",
      body: JSON.stringify({ email })
    });
  },
  async getNewsletterSubscribers() {
    return request("/admin/subscribers/");
  },
  // Price Drop Alerts & Watchlist
  async createPriceAlert(productId, payload) {
    return request(`/products/${productId}/price-alert/`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  async getPriceAlerts(email) {
    const qs = email ? `?email=${encodeURIComponent(email)}` : "";
    return request(`/price-alerts/${qs}`);
  },
  async deletePriceAlert(alertId) {
    return request(`/price-alerts/${alertId}/`, {
      method: "DELETE"
    });
  },
  async simulatePriceDrop(productId, dropPercentage) {
    return request(`/products/${productId}/simulate-price-drop/`, {
      method: "POST",
      body: JSON.stringify({ dropPercentage })
    });
  }
};
export {
  api,
  getCartKey
};
