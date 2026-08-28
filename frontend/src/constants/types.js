/**
 * @file VendoraShop Type Definitions (JSDoc)
 * Provides comprehensive documentation for all core domain models and application data structures.
 */

/**
 * @typedef {'customer' | 'admin'} Role
 */

/**
 * @typedef {Object} Address
 * @property {string} [street]
 * @property {string} [city]
 * @property {string} [state]
 * @property {string} [postalCode]
 * @property {string} [country]
 * @property {string} [fullName]
 * @property {string} [email]
 * @property {string} [phone]
 * @property {string} [zip]
 * @property {string} [apartment]
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {Role} role
 * @property {string} [phone]
 * @property {Address} [address]
 * @property {string} createdAt
 * @property {string} [passwordHash]
 */

/**
 * @typedef {Object} Category
 * @property {string} id
 * @property {string} slug
 * @property {string} name
 * @property {string} [description]
 * @property {string} [iconName]
 * @property {number} [productCount]
 */

/**
 * @typedef {Object} Review
 * @property {string} id
 * @property {string} productId
 * @property {string} [userId]
 * @property {string} [userName]
 * @property {number} rating
 * @property {string} [title]
 * @property {string} [comment]
 * @property {string} [createdAt]
 * @property {boolean} [verifiedPurchase]
 */

/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} name
 * @property {string} slug
 * @property {number} price
 * @property {number} [originalPrice]
 * @property {string} [brand]
 * @property {string} categoryId
 * @property {string} shortDescription
 * @property {string} description
 * @property {string[]} images
 * @property {number} stock
 * @property {number} rating
 * @property {number} [reviewCount]
 * @property {boolean} [featured]
 * @property {string[]} tags
 * @property {Record<string, string>} [specs]
 * @property {string} createdAt
 * @property {string} [categoryName]
 * @property {string} [sku]
 */

/**
 * @typedef {Object} CartItem
 * @property {string} productId
 * @property {number} quantity
 * @property {number} [price]
 * @property {string} [name]
 * @property {string} [image]
 * @property {Product} [product]
 * @property {number} [totalPrice]
 * @property {string} [addedAt]
 */

/**
 * @typedef {Object} Coupon
 * @property {string} [id]
 * @property {string} code
 * @property {number} [discountPercent]
 * @property {number} [discountAmount]
 * @property {string} [expiresAt]
 * @property {boolean} [isActive]
 * @property {number} [minSpend]
 * @property {string} [description]
 */

/**
 * @typedef {Object} Cart
 * @property {string} [id]
 * @property {string} [userId]
 * @property {string} [sessionId]
 * @property {CartItem[]} items
 * @property {number} [subtotal]
 * @property {number} [tax]
 * @property {number} [total]
 * @property {Coupon | null} [appliedCoupon]
 * @property {string} [updatedAt]
 */

/**
 * @typedef {Object} OrderItem
 * @property {string} productId
 * @property {string} productName
 * @property {string} productImage
 * @property {number} quantity
 * @property {number} price
 * @property {number} [totalPrice]
 */

/**
 * @typedef {'pending' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled'} OrderStatus
 */

/**
 * @typedef {Object} Order
 * @property {string} id
 * @property {string} [userId]
 * @property {string} [customerName]
 * @property {string} [customerEmail]
 * @property {string} [customerPhone]
 * @property {OrderItem[]} items
 * @property {number} total
 * @property {OrderStatus} [status]
 * @property {string} createdAt
 * @property {string} [trackingNumber]
 * @property {Address} shippingAddress
 * @property {string} [paymentMethod]
 * @property {OrderStatus} [orderStatus]
 * @property {string} [email]
 * @property {string} [paymentStatus]
 * @property {number} [subtotal]
 * @property {number} [shippingFee]
 * @property {number} [tax]
 * @property {number} [discount]
 * @property {number} [loyaltyDiscount]
 * @property {number} [loyaltyPointsRedeemed]
 * @property {number} [loyaltyPointsEarned]
 * @property {string} [couponCode]
 * @property {string} [notes]
 * @property {string} [estimatedDelivery]
 */

/**
 * @typedef {Object} ProductFilters
 * @property {string} [category]
 * @property {string} [search]
 * @property {number} [minPrice]
 * @property {number} [maxPrice]
 * @property {string} [brand]
 * @property {string[]} [brands]
 * @property {string} [sortBy]
 * @property {number} [page]
 * @property {number} [limit]
 * @property {number} [minRating]
 * @property {boolean} [onSaleOnly]
 * @property {boolean} [inStockOnly]
 */

/**
 * @template T
 * @typedef {Object} PaginatedResponse
 * @property {T[]} items
 * @property {number} page
 * @property {number} limit
 * @property {number} total
 * @property {number} totalPages
 */

/**
 * @typedef {Object} AdminAnalytics
 * @property {number} totalRevenue
 * @property {number} totalOrders
 * @property {number} totalCustomers
 * @property {number} totalProducts
 * @property {number} lowStockCount
 * @property {Record<OrderStatus, number>} ordersByStatus
 * @property {Record<string, number>} [salesByMonth]
 * @property {Array<{ category: string, count: number, revenue: number }>} [salesByCategory]
 * @property {Order[]} [recentOrders]
 */

/**
 * @typedef {Object} TrackingMilestone
 * @property {string} [id]
 * @property {string} status
 * @property {string} [title]
 * @property {string} [location]
 * @property {string} [timestamp]
 * @property {string} [description]
 * @property {boolean} [completed]
 * @property {boolean} [current]
 */

/**
 * @typedef {Object} ShipmentTracking
 * @property {string} [orderId]
 * @property {string} [trackingNumber]
 * @property {string} [carrier]
 * @property {string} [carrierService]
 * @property {string} [status]
 * @property {string} [statusText]
 * @property {string} [currentLocation]
 * @property {string} [estimatedDelivery]
 * @property {TrackingMilestone[]} [milestones]
 * @property {string} [lastUpdated]
 * @property {string} [origin]
 * @property {string} [destination]
 * @property {string} [recipientName]
 * @property {Address} [shippingAddress]
 * @property {number} [progressPercent]
 */

/**
 * @typedef {Object} ClientErrorLog
 * @property {string} id
 * @property {string} message
 * @property {string} [name]
 * @property {string} [stack]
 * @property {string} [componentStack]
 * @property {string} [url]
 * @property {string} [userAgent]
 * @property {string} [errorType]
 * @property {string} timestamp
 * @property {string} [userId]
 * @property {Record<string, unknown>} [metadata]
 */

/**
 * @typedef {Object} LoyaltyTier
 * @property {string} name
 * @property {number} multiplier
 * @property {string[]} perks
 * @property {number} [minPoints]
 * @property {string} [color]
 */

/**
 * @typedef {Object} LoyaltyTransaction
 * @property {string} id
 * @property {string} [userId]
 * @property {'earned' | 'redeemed' | 'bonus' | 'adjustment'} type
 * @property {number} points
 * @property {string} description
 * @property {string} timestamp
 * @property {string} [orderId]
 */

/**
 * @typedef {Object} LoyaltyAccount
 * @property {string} userId
 * @property {number} currentPoints
 * @property {number} lifetimePoints
 * @property {LoyaltyTier} tier
 * @property {{ tier: LoyaltyTier, pointsNeeded: number, progressPercent: number }} [nextTier]
 * @property {LoyaltyTransaction[]} transactions
 * @property {number} [redemptionRate]
 */

/**
 * @typedef {Object} PerformanceMetric
 * @property {string} id
 * @property {string} [label]
 * @property {number} [value]
 * @property {string} [unit]
 * @property {string} [timestamp]
 * @property {string} [url]
 * @property {string} [viewName]
 * @property {string} [userAgent]
 * @property {number} [fcp]
 * @property {number} [lcp]
 * @property {number} [cls]
 * @property {number} [fid]
 * @property {number} [inp]
 * @property {number} [ttfb]
 * @property {number} [domComplete]
 * @property {number} [pageLoadTime]
 * @property {number} [routeTransitionTime]
 * @property {number | string} [deviceMemory]
 * @property {string} [effectiveConnectionType]
 */

/**
 * @typedef {Object} PerformanceSummary
 * @property {number} totalRecordings
 * @property {number} avgPageLoadTime
 * @property {number} avgTTFB
 * @property {number} avgFCP
 * @property {number} avgLCP
 * @property {number} avgCLS
 * @property {number} avgRouteTransitionTime
 * @property {{ lcpStatus: 'good' | 'needs_improvement' | 'poor', clsStatus: 'good' | 'needs_improvement' | 'poor', fcpStatus: 'good' | 'needs_improvement' | 'poor', ttfbStatus: 'good' | 'needs_improvement' | 'poor' }} statusOverview
 * @property {Array<{ route: string, avgDurationMs: number, samples: number }>} routeTimings
 * @property {PerformanceMetric[]} recentMetrics
 */

/**
 * @typedef {Object} StoreLocation
 * @property {string} id
 * @property {string} name
 * @property {string} address
 * @property {string} city
 * @property {string} state
 * @property {string} zip
 * @property {string} phone
 * @property {string} hours
 * @property {number} latitude
 * @property {number} longitude
 * @property {boolean} pickupAvailable
 * @property {boolean} inStock
 * @property {number} [distanceMiles]
 */

/**
 * @typedef {Object} NewsletterSubscriber
 * @property {string} email
 * @property {string} subscribedAt
 * @property {string} [discountCode]
 */

/**
 * @typedef {Object} PriceAlert
 * @property {string} id
 * @property {string} [userId]
 * @property {string} productId
 * @property {string} [productName]
 * @property {string} [productImage]
 * @property {number} [currentPrice]
 * @property {number} targetPrice
 * @property {string} [email]
 * @property {boolean} [active]
 * @property {string} [createdAt]
 * @property {'active' | 'triggered'} [status]
 * @property {number} [lastPriceDrop]
 */

/**
 * @typedef {Object} TestResultItem
 * @property {string} id
 * @property {string} suite
 * @property {string} name
 * @property {'passed' | 'failed'} status
 * @property {number} durationMs
 * @property {string} [error]
 */

/**
 * @typedef {Object} TestSuiteSummary
 * @property {number} total
 * @property {number} passed
 * @property {number} failed
 * @property {number} durationMs
 * @property {TestResultItem[]} results
 * @property {string} [timestamp]
 */

export const OrderStatuses = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

export const UserRoles = {
  CUSTOMER: 'customer',
  ADMIN: 'admin'
};
