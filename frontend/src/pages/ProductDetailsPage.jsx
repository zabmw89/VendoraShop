import { useState, useEffect, useMemo } from "react";
import {
  Star,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
  AlertCircle,
  ChevronRight,
  Plus,
  Minus,
  MessageSquare,
  ArrowLeft,
  Heart,
  ThumbsUp,
  Filter,
  UserCheck,
  Lock,
  Sparkles,
  Columns3,
  TrendingDown
} from "lucide-react";
import { api } from "../services/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useWishlist } from "../context/WishlistContext";
import { useComparison } from "../context/ComparisonContext";
import { ProductDetailsSkeleton } from "../components/skeletons/ProductDetailsSkeleton";
import { updateSeoMeta } from "../utils/seo";
import { ProductImageGallery } from "../components/product/ProductImageGallery";
import { HeroImage } from "../components/common/HeroImage";
import { LazyImage } from "../components/common/LazyImage";
import { PriceDropAlertModal } from "../components/product/PriceDropAlertModal";
const ProductDetailsPage = ({ productId, onNavigate }) => {
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [featuredPicks, setFeaturedPicks] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [ratingInput, setRatingInput] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [titleInput, setTitleInput] = useState("");
  const [commentInput, setCommentInput] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewFilter, setReviewFilter] = useState("all");
  const [helpfulVotes, setHelpfulVotes] = useState({});
  const [userVotedReviews, setUserVotedReviews] = useState(/* @__PURE__ */ new Set());
  const [hasPurchased, setHasPurchased] = useState(false);
  const [isPriceAlertModalOpen, setIsPriceAlertModalOpen] = useState(false);
  const [activePriceAlert, setActivePriceAlert] = useState(null);
  const { addToCart, openDrawer } = useCart();
  const { user, login } = useAuth();
  const { showToast } = useToast();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isInCompare, addToCompare, removeFromCompare, openCompareModal } = useComparison();
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const prod = await api.getProductById(productId);
        setProduct(prod);
        setSelectedImageIndex(0);
        setQuantity(1);
        if (prod) {
          updateSeoMeta("product", productId, {
            title: `${prod.name} | VendoraShop`,
            description: `${prod.description} Buy ${prod.name} at VendoraShop for $${prod.price.toFixed(2)} with free shipping.`,
            ogImage: prod.images?.[0]
          });
        }
        if (prod?.categoryId) {
          const catRes = await api.getProducts({ category: prod.categoryId, limit: 4 });
          setRelatedProducts(catRes.items.filter((p) => p.id !== prod.id));
        }
        // Load 3 curated products for the featured row
        try {
          const recRes = await api.getProducts({ limit: 10, sortBy: "rating" });
          const filtered = (recRes.items || []).filter((p) => p.id !== productId);
          setFeaturedPicks(filtered.slice(0, 3));
        } catch {
          // ignore error
        }
        if (user) {
          try {
            const userOrders = await api.getUserOrders();
            const bought = userOrders.some((o) => o.items.some((i) => i.productId === productId));
            setHasPurchased(bought);
          } catch {
          }
          try {
            const alerts = await api.getPriceAlerts(user.email || user.id);
            const found = alerts.find((a) => a.productId === productId && a.status === "active");
            setActivePriceAlert(found || null);
          } catch {
          }
        }
      } catch (err) {
        console.error("Failed to load product:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [productId, user]);
  const inWishlist = product ? isInWishlist(product.id) : false;
  const reviews = useMemo(() => product?.reviews || [], [product]);
  const ratingStats = useMemo(() => {
    const total = reviews.length;
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const rounded = Math.min(5, Math.max(1, Math.round(r.rating)));
      counts[rounded] = (counts[rounded] || 0) + 1;
    });
    const percentages = {
      5: total > 0 ? Math.round(counts[5] / total * 100) : 0,
      4: total > 0 ? Math.round(counts[4] / total * 100) : 0,
      3: total > 0 ? Math.round(counts[3] / total * 100) : 0,
      2: total > 0 ? Math.round(counts[2] / total * 100) : 0,
      1: total > 0 ? Math.round(counts[1] / total * 100) : 0
    };
    return { total, counts, percentages };
  }, [reviews]);
  const filteredReviews = useMemo(() => {
    if (reviewFilter === "all") return reviews;
    return reviews.filter((r) => Math.round(r.rating) === reviewFilter);
  }, [reviews, reviewFilter]);
  if (isLoading) {
    return <ProductDetailsSkeleton />;
  }
  if (!product) {
    return <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Product Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested product may have been discontinued or moved.
        </p>
        <button
      onClick={() => onNavigate("home")}
      className="px-5 py-2.5 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
    >
          Return to Storefront
        </button>
      </div>;
  }
  const discountPercent = product.originalPrice && product.originalPrice > product.price ? Math.round((product.originalPrice - product.price) / product.originalPrice * 100) : 0;
  const handleAddToCart = async () => {
    if (product.stock < 1) return;
    setIsAdding(true);
    const success = await addToCart(product, quantity);
    setIsAdding(false);
    if (success) {
      openDrawer();
    }
  };
  const handleBuyNow = async () => {
    if (product.stock < 1) return;
    const success = await addToCart(product, quantity);
    if (success) {
      onNavigate("checkout");
    }
  };
  const handleWishlistToggle = async () => {
    if (!product) return;
    await toggleWishlist(product);
  };
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast("Please sign in to post a verified review.", "info");
      onNavigate("auth");
      return;
    }
    if (!titleInput.trim() || !commentInput.trim()) {
      showToast("Please provide both a headline and detailed review comment.", "error");
      return;
    }
    try {
      setIsSubmittingReview(true);
      const res = await api.addProductReview(product.id, {
        rating: ratingInput,
        title: titleInput.trim(),
        comment: commentInput.trim()
      });
      showToast(res.message || "Your review was published successfully.", "success");
      const updated = await api.getProductById(product.id);
      setProduct(updated);
      setTitleInput("");
      setCommentInput("");
      setRatingInput(5);
    } catch (err) {
      showToast(err.message || "Failed to submit review", "error");
    } finally {
      setIsSubmittingReview(false);
    }
  };
  const handleQuickDemoLogin = async () => {
    try {
      await login("alex@example.com", "customer123");
      showToast("Signed in as Alex Johnson. You can now post a verified review.", "success");
    } catch {
      showToast("Failed to sign in demo account", "error");
    }
  };
  const handleHelpfulVote = (reviewId) => {
    if (userVotedReviews.has(reviewId)) {
      setUserVotedReviews((prev) => {
        const next = new Set(prev);
        next.delete(reviewId);
        return next;
      });
      setHelpfulVotes((prev) => ({
        ...prev,
        [reviewId]: Math.max(0, (prev[reviewId] || 1) - 1)
      }));
    } else {
      setUserVotedReviews((prev) => new Set(prev).add(reviewId));
      setHelpfulVotes((prev) => ({
        ...prev,
        [reviewId]: (prev[reviewId] || 0) + 1
      }));
      showToast("Thank you for your feedback!", "success");
    }
  };
  const ratingLabels = {
    1: "1 - Poor",
    2: "2 - Fair",
    3: "3 - Average",
    4: "4 - Good",
    5: "5 - Excellent"
  };
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
      {
    /* Breadcrumb Navigation */
  }
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <button
    onClick={() => onNavigate("home")}
    className="hover:text-blue-600 transition-colors flex items-center gap-1 cursor-pointer font-medium"
  >
          <ArrowLeft className="w-3.5 h-3.5" /> All Products
        </button>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <button
    onClick={() => onNavigate("home", `category=${product.categoryId}`)}
    className="hover:text-blue-600 capitalize transition-colors cursor-pointer font-medium"
  >
          {product.categoryName || "Department"}
        </button>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="text-slate-900 font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {
    /* Primary Product Showcase Section */
  }
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        {
    /* Left: Interactive Image Gallery with Modal Zoom */
  }
        <div className="lg:col-span-7">
          <ProductImageGallery
    images={product.images}
    productName={product.name}
    discountPercent={discountPercent}
    featured={product.featured}
  />
        </div>

        {
    /* Right: Specifications, Pricing & Add to Cart Controls */
  }
        <div className="lg:col-span-5 space-y-6">
          {
    /* Header */
  }
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-block text-xs font-bold text-blue-600 uppercase tracking-tight bg-blue-50 px-2.5 py-1 rounded">
                {product.categoryName || "Product"}
              </span>
              {product.featured && <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  Featured Choice
                </span>}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
              {product.name}
            </h1>

            {
    /* Ratings & Reviews summary */
  }
            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{product.rating.toFixed(1)}</span>
              </div>
              <span className="text-slate-300">|</span>
              <a href="#customer-reviews" className="text-xs font-semibold text-blue-600 hover:underline">
                {product.reviewCount} customer ratings
              </a>
            </div>
          </div>

          {
    /* Price & Savings */
  }
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-slate-900">
                ${product.price.toFixed(2)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && <>
                  <span className="text-base text-slate-400 line-through">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                  <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">
                    Save ${(product.originalPrice - product.price).toFixed(2)}
                  </span>
                </>}
            </div>
            <p className="text-[11px] text-slate-500">
              Tax calculated at checkout. Free standard shipping on orders over $75.
            </p>
          </div>

          {
    /* Stock Availability Pill */
  }
          <div className="flex items-center gap-2">
            {product.stock > 5 ? <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-green-50 text-green-700 text-xs font-semibold border border-green-200">
                <Check className="w-3.5 h-3.5" /> In Stock ({product.stock} units available)
              </span> : product.stock > 0 ? <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Only {product.stock} left in stock
              </span> : <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5" /> Currently Out of Stock
              </span>}
          </div>

          {
    /* Description */
  }
          <div className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {product.description}
          </div>

          {
    /* Quantity & CTA Buttons */
  }
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Quantity:
              </label>
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
                <button
    onClick={() => setQuantity(Math.max(1, quantity - 1))}
    disabled={quantity <= 1 || product.stock === 0}
    className="p-2 px-3 text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors cursor-pointer"
    aria-label="Decrease quantity"
  >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-4 text-xs font-bold text-slate-900">
                  {quantity}
                </span>
                <button
    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
    disabled={quantity >= product.stock || product.stock === 0}
    className="p-2 px-3 text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors cursor-pointer"
    aria-label="Increase quantity"
  >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-xs text-slate-400">
                (Max available: {product.stock})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
    onClick={handleAddToCart}
    disabled={product.stock === 0 || isAdding}
    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
    id="product-details-add-cart-btn"
  >
                <ShoppingBag className="w-4 h-4" />
                {isAdding ? "Adding..." : "Add to Cart"}
              </button>

              <button
    onClick={handleBuyNow}
    disabled={product.stock === 0}
    className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
    id="product-details-buy-now-btn"
  >
                Buy Now
              </button>
            </div>

            {
    /* Wishlist & Compare Buttons Grid */
  }
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
    onClick={handleWishlistToggle}
    id="product-details-wishlist-action-btn"
    className={`py-2.5 px-4 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-2 cursor-pointer ${inWishlist ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-rose-600 hover:border-rose-200"}`}
  >
                <Heart className={`w-4 h-4 ${inWishlist ? "fill-rose-500 text-rose-500" : "text-slate-400"}`} />
                {inWishlist ? "In Wishlist" : "Save to Wishlist"}
              </button>

              <button
    onClick={() => {
      if (product) {
        if (isInCompare(product.id)) {
          openCompareModal();
        } else {
          addToCompare(product);
        }
      }
    }}
    id="product-details-compare-action-btn"
    className={`py-2.5 px-4 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-2 cursor-pointer ${product && isInCompare(product.id) ? "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200"}`}
  >
                <Columns3 className="w-4 h-4" />
                {product && isInCompare(product.id) ? "Comparing (View)" : "Compare Specs"}
              </button>
            </div>

            {
    /* Notify Me When Price Drops CTA Button */
  }
            <button
    onClick={() => setIsPriceAlertModalOpen(true)}
    id="product-details-price-alert-btn"
    className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs ${activePriceAlert ? "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100" : "bg-amber-50/80 border-amber-200 text-amber-900 hover:bg-amber-100 hover:border-amber-300"}`}
  >
              <TrendingDown className={`w-4 h-4 ${activePriceAlert ? "text-emerald-600" : "text-amber-600"}`} />
              <span>
                {activePriceAlert ? `Price Drop Alert Active ($${activePriceAlert.targetPrice?.toFixed(2)} Target)` : "Notify me when price drops"}
              </span>
            </button>
          </div>

          {
    /* Guarantees & Trust List */
  }
          <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>Fast 2-4 Day Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-green-600" />
              <span>30-Day Free Returns</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              <span>2-Year Full Warranty</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-blue-600" />
              <span>100% Authentic Quality</span>
            </div>
          </div>
        </div>
      </div>

      {
    /* Specifications Table */
  }
      {product.specs && Object.keys(product.specs).length > 0 && <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
          <h3 className="text-lg font-bold text-slate-900">
            Technical Specifications
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 divide-y divide-slate-100">
            {Object.entries(product.specs).map(([specKey, specVal]) => <div key={specKey} className="pt-3 flex justify-between text-xs sm:text-sm">
                <span className="font-medium text-slate-500">{specKey}</span>
                <span className="font-bold text-slate-900 text-right">{specVal}</span>
              </div>)}
          </div>
        </section>}

      {
    /* Customer Reviews Section */
  }
      <section id="customer-reviews" className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-8 scroll-mt-24 shadow-xs">
        {
    /* Section Header */
  }
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Customer Reviews ({reviews.length})
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Verified feedback and ratings from customers who purchased this item.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">
            <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
            <div>
              <div className="text-xl font-extrabold text-amber-950 leading-tight">
                {product.rating.toFixed(1)} <span className="text-xs font-normal text-amber-800">/ 5.0</span>
              </div>
              <div className="text-[11px] text-amber-700 font-medium">
                Based on {reviews.length} verified ratings
              </div>
            </div>
          </div>
        </div>

        {
    /* Rating Breakdown & Stats Dashboard */
  }
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-slate-50/80 rounded-xl p-6 border border-slate-200">
          <div className="md:col-span-4 text-center md:text-left space-y-1">
            <div className="text-4xl font-extrabold text-slate-900">
              {product.rating.toFixed(1)}
            </div>
            <div className="flex items-center justify-center md:justify-start gap-1 text-amber-400 py-1">
              {Array.from({ length: 5 }).map((_, i) => <Star
    key={i}
    className={`w-4 h-4 ${i < Math.round(product.rating) ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
  />)}
            </div>
            <p className="text-xs text-slate-500">
              {ratingStats.percentages[5] + ratingStats.percentages[4]}% of customers recommend this product
            </p>
          </div>

          {
    /* Rating Progress Bars */
  }
          <div className="md:col-span-8 space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => <div
    key={stars}
    onClick={() => setReviewFilter(reviewFilter === stars ? "all" : stars)}
    className="flex items-center gap-3 text-xs cursor-pointer group"
  >
                <div className="w-12 font-medium text-slate-600 flex items-center gap-1 group-hover:text-blue-600">
                  <span>{stars}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </div>
                <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
    className="h-full bg-amber-400 rounded-full transition-all duration-500 group-hover:bg-amber-500"
    style={{ width: `${ratingStats.percentages[stars]}%` }}
  />
                </div>
                <div className="w-14 text-right text-slate-500 font-mono text-[11px] group-hover:text-slate-900">
                  {ratingStats.percentages[stars]}% ({ratingStats.counts[stars]})
                </div>
              </div>)}
          </div>
        </div>

        {
    /* Write a Review Section (Authenticated vs Unauthenticated) */
  }
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Share Your Experience
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Help other shoppers make informed purchasing decisions with your verified feedback.
              </p>
            </div>
            {user && <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Posting as <strong>{user.name}</strong></span>
              </div>}
          </div>

          {!user ? <div className="bg-white rounded-lg p-5 border border-slate-200 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5" />
              </div>
              <h5 className="text-sm font-bold text-slate-800">
                Sign in to post a verified customer review
              </h5>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Only authenticated customers can publish ratings and product testimonials to ensure high review integrity.
              </p>
              <div className="flex items-center justify-center gap-3 pt-1">
                <button
    onClick={() => onNavigate("auth")}
    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
  >
                  Sign In / Register
                </button>
                <button
    onClick={handleQuickDemoLogin}
    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
  >
                  Quick Demo Login (Alex)
                </button>
              </div>
            </div> : <form onSubmit={handleReviewSubmit} className="space-y-4 bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">Posting review as <strong>{user?.name}</strong></span>
                  {hasPurchased ? <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-100/80 border border-emerald-300 px-2 py-0.5 rounded">
                      <Check className="w-3 h-3 text-emerald-600" /> Verified Order Owner
                    </span> : <span className="text-[10px] text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded">
                      Community Reviewer
                    </span>}
                </div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-100/80 border border-amber-300 px-2.5 py-0.5 rounded-full">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>+100 Rewards Points on Publish</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Overall Rating
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => <button
    key={star}
    type="button"
    onClick={() => setRatingInput(star)}
    onMouseEnter={() => setHoverRating(star)}
    onMouseLeave={() => setHoverRating(0)}
    className="p-1 text-amber-400 hover:scale-125 transition-transform cursor-pointer"
    aria-label={`Rate ${star} stars`}
  >
                        <Star
    className={`w-6 h-6 transition-colors ${star <= (hoverRating || ratingInput) ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
  />
                      </button>)}
                  </div>
                  <span className="text-xs font-semibold text-slate-600">
                    {ratingLabels[hoverRating || ratingInput]}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Review Headline
                </label>
                <input
    type="text"
    placeholder="e.g. Outstanding audio fidelity and seamless pairing"
    value={titleInput}
    onChange={(e) => setTitleInput(e.target.value)}
    required
    className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
  />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Detailed Review Comments
                </label>
                <textarea
    rows={4}
    placeholder="Describe what you liked, battery life, design ergonomics, durability, or any areas for improvement..."
    value={commentInput}
    onChange={(e) => setCommentInput(e.target.value)}
    required
    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 focus:bg-white rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
  />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  Reviews are instantly verified and associated with your account.
                </span>
                <button
    type="submit"
    disabled={isSubmittingReview}
    className="px-6 py-2.5 bg-slate-900 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
    id="submit-review-btn"
  >
                  {isSubmittingReview ? "Submitting..." : "Post Verified Review"}
                </button>
              </div>
            </form>}
        </div>

        {
    /* Review Filter & Controls */
  }
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter by Rating:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
    onClick={() => setReviewFilter("all")}
    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${reviewFilter === "all" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
  >
                All ({reviews.length})
              </button>
              {[5, 4, 3, 2, 1].map((stars) => <button
    key={stars}
    onClick={() => setReviewFilter(stars)}
    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${reviewFilter === stars ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
  >
                  <span>{stars}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>({ratingStats.counts[stars] || 0})</span>
                </button>)}
            </div>
          </div>

          <div className="text-xs text-slate-400">
            Showing {filteredReviews.length} of {reviews.length} reviews
          </div>
        </div>

        {
    /* Reviews List */
  }
        <div className="space-y-4 divide-y divide-slate-100">
          {filteredReviews.length === 0 ? <div className="bg-slate-50 rounded-xl p-8 text-center space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-700">
                {reviewFilter === "all" ? "No reviews yet for this product. Be the first to share your thoughts!" : `No ${reviewFilter}-star reviews found.`}
              </p>
              {reviewFilter !== "all" && <button
    onClick={() => setReviewFilter("all")}
    className="text-xs text-blue-600 hover:underline font-semibold"
  >
                  View all reviews
                </button>}
            </div> : filteredReviews.map((rev) => <div key={rev.id} className="pt-5 first:pt-0 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                      {rev.userName ? rev.userName.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{rev.userName}</span>
                        {rev.verifiedPurchase && <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                            <Check className="w-3 h-3 text-emerald-600" /> Verified Purchase
                          </span>}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Reviewed on {new Date(rev.createdAt).toLocaleDateString(void 0, { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  </div>

                  {
    /* Rating Stars Badge */
  }
                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                    {Array.from({ length: 5 }).map((_, idx) => <Star
    key={idx}
    className={`w-3.5 h-3.5 ${idx < rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
  />)}
                  </div>
                </div>

                <div className="space-y-1.5 pl-10">
                  <h5 className="text-sm font-bold text-slate-900">{rev.title}</h5>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {rev.comment}
                  </p>
                </div>

                {
    /* Helpful feedback action */
  }
                <div className="pl-10 pt-1 flex items-center gap-4 text-xs text-slate-400">
                  <span>Was this review helpful?</span>
                  <button
    onClick={() => handleHelpfulVote(rev.id)}
    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-medium transition-colors cursor-pointer ${userVotedReviews.has(rev.id) ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>Helpful {helpfulVotes[rev.id] ? `(${helpfulVotes[rev.id]})` : ""}</span>
                  </button>
                </div>
              </div>)}
        </div>
      </section>

      {
    /* Brand Studio Showcase Banner (HeroImage component) */
  }
      <HeroImage
    variant="product-details"
    badgeText="Studio Grade Craftsmanship"
    title="Precision Engineering. Timeless Design."
    subtitle={`Experience superior durability and ergonomic comfort with ${product.brand || "Vendora"} flagship standards. Backed by full 2-year warranty and expedited worldwide dispatch.`}
    compact={true}
    primaryActionText="Explore Similar Products"
    onPrimaryAction={() => onNavigate("home", `category=${product.categoryId}`)}
  />

      {/* Curated Recommendations 3-Product Row */}
      {featuredPicks.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-slate-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Featured Recommendations</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Frequently Bought Together
              </h3>
            </div>
            <button
              onClick={() => onNavigate("home")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <span>Explore All</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredPicks.map((item) => {
              const itemDiscount = item.originalPrice && item.originalPrice > item.price 
                ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100) 
                : 0;
              return (
                <div
                  key={item.id}
                  onClick={() => onNavigate("product", item.id)}
                  className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 p-5 flex flex-col justify-between cursor-pointer relative"
                >
                  {itemDiscount > 0 && (
                    <span className="absolute top-4 left-4 z-10 bg-rose-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                      -{itemDiscount}% OFF
                    </span>
                  )}

                  <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-50 p-4 mb-4 flex items-center justify-center">
                    <LazyImage
                      src={item.images?.[0]}
                      alt={item.name}
                      objectFit="contain"
                      className="w-full h-full group-hover:scale-108 transition-transform duration-300"
                      wrapperClassName="w-full h-full flex items-center justify-center bg-slate-50"
                    />
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-blue-600 uppercase tracking-tight text-[11px]">
                        {item.categoryName || "Top Pick"}
                      </span>
                      <div className="flex items-center gap-1 text-amber-500 font-semibold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{item.rating?.toFixed(1) || "5.0"}</span>
                        <span className="text-slate-400 text-[11px]">({item.reviewCount || 8})</span>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {item.name}
                    </h4>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.shortDescription || item.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-base sm:text-lg font-extrabold text-slate-900">
                        ${item.price.toFixed(2)}
                      </span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span className="text-xs text-slate-400 line-through ml-2">
                          ${item.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await addToCart(item, 1);
                        openDrawer();
                      }}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {
    /* Related Products Section */
  }
      {relatedProducts.length > 0 && <section className="space-y-4 pt-4">
          <h3 className="text-lg font-bold text-slate-900">
            More in {product.categoryName || "This Department"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {relatedProducts.map((p) => <div
    key={p.id}
    onClick={() => onNavigate("product", p.id)}
    className="bg-white rounded-xl border border-slate-200 p-3 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex items-center gap-3 group"
  >
                <div className="w-16 h-16 shrink-0 rounded-lg bg-slate-50 p-1 overflow-hidden">
                  <LazyImage
    src={p.images[0]}
    alt={p.name}
    objectFit="contain"
    className="w-full h-full"
    wrapperClassName="w-full h-full bg-slate-50"
  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 truncate">
                    {p.name}
                  </h4>
                  <p className="text-xs font-bold text-slate-900 mt-1">
                    ${p.price.toFixed(2)}
                  </p>
                </div>
              </div>)}
          </div>
        </section>}
      {
    /* Price Drop Alert Modal */
  }
      {product && <PriceDropAlertModal
    isOpen={isPriceAlertModalOpen}
    onClose={() => {
      setIsPriceAlertModalOpen(false);
      if (user && product) {
        api.getPriceAlerts(user.email || user.id).then((alerts) => {
          const found = alerts.find((a) => a.productId === product.id && a.status === "active");
          setActivePriceAlert(found || null);
        }).catch(() => {
        });
      }
    }}
    product={product}
    onPriceUpdated={(newPrice, oldPrice) => {
      setProduct((prev) => prev ? { ...prev, price: newPrice, originalPrice: oldPrice } : null);
    }}
  />}
    </div>;
};
export {
  ProductDetailsPage
};
