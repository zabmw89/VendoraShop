import { useState, useEffect, useRef } from "react";
import {
  ShoppingBag,
  Search,
  User,
  ShieldCheck,
  Menu,
  X,
  Sparkles,
  ChevronDown,
  LogOut,
  Package,
  Heart,
  MapPin,
  Columns3,
  ArrowRight,
  TrendingUp,
  Star,
  Bell
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useComparison } from "../../context/ComparisonContext";
import { useNotifications } from "../../context/NotificationContext";
import { api } from "../../services/api";
import { StoreLocatorModal } from "../common/StoreLocatorModal";
const POPULAR_SEARCHES = [
  "Wireless Headphones",
  "Noise Cancelling",
  "Mechanical Keyboard",
  "Smartwatch OLED",
  "Studio Monitor",
  "USB-C Hub"
];
const Navbar = ({ currentView, onNavigate, setCurrentView }) => {
  const navigate = onNavigate || setCurrentView || (() => {
  });
  const { user, logout } = useAuth();
  const { itemCount, openDrawer } = useCart();
  const { wishlist } = useWishlist();
  const { comparedProducts, openCompareModal } = useComparison();
  const { openPermissionModal, permission } = useNotifications();
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isStoreLocatorOpen, setIsStoreLocatorOpen] = useState(false);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const userMenuRef = useRef(null);
  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error);
  }, []);
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(() => {
      api.getProducts({ search: searchQuery.trim(), limit: 6 }).then((res) => {
        setSearchResults(res.items);
        setIsSearchOpen(true);
        setHighlightedIndex(-1);
      }).catch(console.error).finally(() => {
        setIsSearching(false);
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (highlightedIndex >= 0 && searchResults[highlightedIndex]) {
      selectProduct(searchResults[highlightedIndex].id);
      return;
    }
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
      navigate("home", `search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  const handleKeyDown = (e) => {
    if (!isSearchOpen && e.key !== "ArrowDown") return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsSearchOpen(true);
      setHighlightedIndex((prev) => prev < searchResults.length - 1 ? prev + 1 : 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => prev > 0 ? prev - 1 : searchResults.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSearchSubmit();
    } else if (e.key === "Escape") {
      setIsSearchOpen(false);
    }
  };
  const selectProduct = (prodId) => {
    setIsSearchOpen(false);
    setIsMobileMenuOpen(false);
    setSearchQuery("");
    navigate("product", prodId);
  };
  const renderHighlightedText = (text, highlight) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    return <span>
        {parts.map(
      (part, i) => part.toLowerCase() === highlight.toLowerCase() ? <mark key={i} className="bg-blue-100 text-blue-900 font-semibold px-0.5 rounded">
              {part}
            </mark> : part
    )}
      </span>;
  };
  return <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        {
    /* Top utility alert banner */
  }
        <div className="bg-slate-950 text-slate-300 text-xs py-1.5 px-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                FREE SHIPPING
              </span>
              <span>Complimentary delivery on all domestic orders over $25</span>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-slate-400">
              <button
    onClick={() => setIsStoreLocatorOpen(true)}
    className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
    id="top-bar-find-store-btn"
  >
                <MapPin className="w-3.5 h-3.5 text-blue-400" /> Find Nearby Store
              </button>
            </div>
          </div>
        </div>

        {
    /* Main Navigation Bar */
  }
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
            {
    /* Brand Logo */
  }
            <div className="flex items-center gap-3">
              <button
    onClick={() => navigate("home")}
    className="flex items-center gap-2.5 text-left group cursor-pointer"
    id="brand-logo-btn"
  >
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white shadow-xs group-hover:bg-blue-700 transition-colors">
                  <span className="text-white font-bold text-lg">V</span>
                </div>
                <div>
                  <span className="text-xl font-bold tracking-tight text-slate-800 flex items-center">
                    Vendora<span className="text-blue-600">Shop</span>
                  </span>
                </div>
              </button>
            </div>

            {
    /* Predictive Search Bar with Live Autocomplete */
  }
            <div className="hidden md:flex flex-1 max-w-lg relative" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="w-full">
                <div className="relative">
                  <input
    type="text"
    placeholder="Search across 40+ products, brands, or categories..."
    value={searchQuery}
    onChange={(e) => {
      setSearchQuery(e.target.value);
      setIsSearchOpen(true);
    }}
    onFocus={() => setIsSearchOpen(true)}
    onKeyDown={handleKeyDown}
    className="w-full h-11 pl-11 pr-10 bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-sm text-slate-900 border border-slate-200/80 focus:border-blue-500 rounded-full focus:ring-4 focus:ring-blue-500/10 transition-all outline-hidden placeholder:text-slate-400 shadow-inner"
    id="navbar-search-input"
    aria-label="Predictive product search"
    autoComplete="off"
  />
                  <Search className={`w-4 h-4 text-slate-400 absolute left-4 top-3.5 ${isSearching ? "animate-pulse text-blue-600" : ""}`} />

                  {searchQuery && <button
    type="button"
    onClick={() => {
      setSearchQuery("");
      setSearchResults([]);
    }}
    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition-colors"
    aria-label="Clear search query"
  >
                      <X className="w-4 h-4" />
                    </button>}
                </div>
              </form>

              {
    /* Instant Predictive Search Results Overlay Dropdown */
  }
              {isSearchOpen && <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                  {
    /* When there's a query and search results */
  }
                  {searchQuery.trim() && searchResults.length > 0 && <div>
                      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          Predictive Catalog Matches ({searchResults.length})
                        </span>
                        <span className="text-[10px] text-slate-400">Use ↑↓ keys to navigate</span>
                      </div>

                      <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto p-1">
                        {searchResults.map((prod, index) => {
    const isHighlighted = highlightedIndex === index;
    const discount = prod.originalPrice && prod.originalPrice > prod.price ? Math.round((prod.originalPrice - prod.price) / prod.originalPrice * 100) : 0;
    return <button
      key={prod.id}
      type="button"
      onClick={() => selectProduct(prod.id)}
      onMouseEnter={() => setHighlightedIndex(index)}
      className={`w-full px-3 py-2.5 flex items-center gap-3.5 rounded-xl transition-all text-left ${isHighlighted ? "bg-blue-50/80 text-blue-900 shadow-xs" : "hover:bg-slate-50 text-slate-800"}`}
    >
                              <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-1 relative">
                                <img
      src={prod.images[0]}
      alt={prod.name}
      className="max-h-full max-w-full object-contain"
    />
                                {discount > 0 && <span className="absolute bottom-0.5 right-0.5 bg-rose-600 text-white text-[9px] font-bold px-1 rounded">
                                    -{discount}%
                                  </span>}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">
                                    {prod.categoryName || "Catalog"}
                                  </span>
                                  <div className="flex items-center gap-0.5 text-amber-500 text-[11px] font-semibold">
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                    <span>{prod.rating.toFixed(1)}</span>
                                  </div>
                                </div>

                                <p className="text-xs sm:text-sm font-semibold truncate">
                                  {renderHighlightedText(prod.name, searchQuery)}
                                </p>

                                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                  {prod.shortDescription}
                                </p>
                              </div>

                              <div className="text-right shrink-0">
                                <div className="text-sm font-bold text-slate-900">
                                  ${prod.price.toFixed(2)}
                                </div>
                                {prod.stock <= 5 && prod.stock > 0 ? <span className="text-[10px] font-semibold text-amber-600">
                                    Only {prod.stock} left
                                  </span> : prod.stock > 5 ? <span className="text-[10px] font-medium text-emerald-600">
                                    In Stock
                                  </span> : <span className="text-[10px] font-medium text-rose-600">
                                    Out of stock
                                  </span>}
                              </div>
                            </button>;
  })}
                      </div>

                      {
    /* Footer CTA */
  }
                      <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          Looking for something else?
                        </span>
                        <button
    type="button"
    onClick={() => handleSearchSubmit()}
    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
  >
                          <span>View all catalog results for "{searchQuery}"</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>}

                  {
    /* When search returned 0 items */
  }
                  {searchQuery.trim() && !isSearching && searchResults.length === 0 && <div className="p-6 text-center space-y-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                        <Search className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          No matching products for "{searchQuery}"
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Try searching for general keywords like "headphones", "oled", "keyboard", or "audio".
                        </p>
                      </div>
                      <div className="pt-2 flex flex-wrap gap-1.5 justify-center">
                        {POPULAR_SEARCHES.slice(0, 4).map((term) => <button
    key={term}
    onClick={() => setSearchQuery(term)}
    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 text-[11px] font-medium transition-colors"
  >
                            {term}
                          </button>)}
                      </div>
                    </div>}

                  {
    /* Empty input state: Trending searches & Categories */
  }
                  {!searchQuery.trim() && <div className="p-4 space-y-4">
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                          <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                          <span>Trending Searches</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {POPULAR_SEARCHES.map((term) => <button
    key={term}
    onClick={() => {
      setSearchQuery(term);
    }}
    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5"
  >
                              <Search className="w-3 h-3 text-slate-400" />
                              <span>{term}</span>
                            </button>)}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                          Explore by Category
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {categories.map((cat) => <button
    key={cat.id}
    onClick={() => {
      setIsSearchOpen(false);
      navigate("home", `category=${cat.slug}`);
    }}
    className="p-2 rounded-lg bg-slate-50 hover:bg-blue-50 text-left transition-colors flex items-center justify-between group"
  >
                              <span className="text-xs font-medium text-slate-700 group-hover:text-blue-600">
                                {cat.name}
                              </span>
                              <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-blue-600 transition-colors" />
                            </button>)}
                        </div>
                      </div>
                    </div>}
                </div>}
            </div>

            {
    /* Right Action Controls */
  }
            <div className="flex items-center gap-3 sm:gap-5">
              {
    /* Find Store Button */
  }
              <button
    onClick={() => setIsStoreLocatorOpen(true)}
    className="hidden lg:inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
    id="navbar-store-locator-btn"
    title="Locate nearest retail and pickup store"
  >
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Find Store</span>
              </button>

              {
    /* Compare Button with Badge */
  }
              <button
    onClick={openCompareModal}
    className="relative cursor-pointer group flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
    id="navbar-compare-btn"
    aria-label="Compare Products"
    title="Compare up to 3 products"
  >
                <div className="relative">
                  <Columns3 className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
                  {comparedProducts.length > 0 && <span className="absolute -top-1.5 -right-2 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full border-2 border-white shadow-xs">
                      {comparedProducts.length}
                    </span>}
                </div>
                <span className="hidden xl:inline text-xs font-medium text-slate-600 group-hover:text-blue-600 transition-colors">
                  Compare
                </span>
              </button>

              {
    /* Notification Alerts Trigger */
  }
              <button
    onClick={openPermissionModal}
    className="relative cursor-pointer group flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
    id="navbar-notifications-btn"
    aria-label="Browser Notification & Flash Sale Alerts"
    title={permission === "granted" ? "Notification alerts active" : "Enable browser alerts & flash sales"}
  >
                <div className="relative">
                  <Bell className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
                  {permission === "granted" ? <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white" /> : <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full ring-2 ring-white animate-pulse" />}
                </div>
                <span className="hidden xl:inline text-xs font-medium text-slate-600 group-hover:text-blue-600 transition-colors">
                  Alerts
                </span>
              </button>

              {
    /* Wishlist Shortcut */
  }
              <button
    onClick={() => navigate("account", "wishlist")}
    className="relative cursor-pointer group flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
    id="navbar-wishlist-btn"
    aria-label="View Saved Wishlist"
    title="Saved Wishlist"
  >
                <div className="relative">
                  <Heart
    className={`w-5 h-5 transition-colors ${wishlist.length > 0 ? "text-rose-500 fill-rose-500/20 group-hover:fill-rose-500" : "text-slate-600 group-hover:text-rose-500"}`}
  />
                  {wishlist.length > 0 && <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full border-2 border-white shadow-xs">
                      {wishlist.length}
                    </span>}
                </div>
                <span className="hidden xl:inline text-xs font-medium text-slate-600 group-hover:text-rose-600 transition-colors">
                  Wishlist
                </span>
              </button>

              {
    /* Shopping Cart Drawer Trigger */
  }
              <button
    onClick={openDrawer}
    className="relative cursor-pointer group flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
    id="navbar-cart-btn"
    aria-label="Open Shopping Cart"
  >
                <div className="relative">
                  <ShoppingBag className="w-5 h-5 text-slate-700 group-hover:text-blue-600 transition-colors" />
                  {itemCount > 0 && <span className="absolute -top-1.5 -right-2 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full border-2 border-white shadow-xs">
                      {itemCount}
                    </span>}
                </div>
                <span className="hidden sm:inline text-xs font-medium text-slate-700 group-hover:text-blue-600 transition-colors">
                  Cart
                </span>
              </button>

              {
    /* User Account Menu */
  }
              <div className="relative" ref={userMenuRef}>
                {user ? <button
    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
    className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all text-left cursor-pointer"
    id="user-menu-btn"
  >
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center uppercase">
                      {user.name.charAt(0)}
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-25">
                        {user.name.split(" ")[0]}
                      </p>
                      <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button> : <button
    onClick={() => navigate("auth")}
    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-medium transition-all shadow-xs cursor-pointer"
    id="login-register-nav-btn"
  >
                    <User className="w-3.5 h-3.5" /> Sign In
                  </button>}

                {
    /* User Dropdown Menu */
  }
                {isUserMenuOpen && user && <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 p-2 divide-y divide-slate-100">
                    <div className="px-3 py-2">
                      <p className="text-xs font-bold text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      <span
    className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-md ${user.role === "admin" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}`}
  >
                        {user.role === "admin" ? "Administrator" : "Customer Account"}
                      </span>
                    </div>

                    <div className="py-1">
                      <button
    onClick={() => {
      setIsUserMenuOpen(false);
      navigate("account", "wishlist");
    }}
    className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-rose-600 rounded-lg flex items-center justify-between transition-colors"
  >
                        <span className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-rose-500" /> Saved Wishlist
                        </span>
                        {wishlist.length > 0 && <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded-full text-[10px] font-bold">
                            {wishlist.length}
                          </span>}
                      </button>
                      <button
    onClick={() => {
      setIsUserMenuOpen(false);
      navigate("account", "orders");
    }}
    className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg flex items-center gap-2 transition-colors"
  >
                        <Package className="w-4 h-4 text-slate-400" /> Order History
                      </button>
                      <button
    onClick={() => {
      setIsUserMenuOpen(false);
      navigate("account", "profile");
    }}
    className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg flex items-center gap-2 transition-colors"
  >
                        <User className="w-4 h-4 text-slate-400" /> Profile & Address
                      </button>
                      {user.role === "admin" && <button
    onClick={() => {
      setIsUserMenuOpen(false);
      navigate("admin");
    }}
    className="w-full px-3 py-2 text-xs font-medium text-amber-800 hover:bg-amber-50 rounded-lg flex items-center gap-2 transition-colors"
  >
                          <ShieldCheck className="w-4 h-4 text-amber-600" /> Store Admin Portal
                        </button>}
                    </div>

                    <div className="pt-1">
                      <button
    onClick={() => {
      setIsUserMenuOpen(false);
      logout();
      navigate("home");
    }}
    className="w-full px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 transition-colors"
  >
                        <LogOut className="w-4 h-4 text-rose-500" /> Sign Out
                      </button>
                    </div>
                  </div>}
              </div>

              {
    /* Mobile menu toggle */
  }
              <button
    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
    className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
    aria-label="Toggle mobile menu"
  >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {
    /* Category Pills Secondary Subnav */
  }
        <div className="bg-slate-50 border-t border-slate-200/60 overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 sm:gap-2 py-2">
            <button
    onClick={() => navigate("home", "category=all")}
    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${currentView === "home" ? "bg-slate-900 text-white shadow-xs" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"}`}
  >
              All Products
            </button>
            {categories.map((cat) => <button
    key={cat.id}
    onClick={() => navigate("home", `category=${cat.slug}`)}
    className="px-3 py-1 rounded-full text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:text-slate-900 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer"
  >
                <span>{cat.name}</span>
                {cat.productCount !== void 0 && <span className="text-[10px] text-slate-400 bg-slate-100 rounded-full px-1.5 py-0.2">
                    {cat.productCount}
                  </span>}
              </button>)}
          </div>
        </div>

        {
    /* Mobile Drawer Navigation */
  }
        {isMobileMenuOpen && <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-3 relative" ref={mobileSearchRef}>
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <input
    type="text"
    placeholder="Search products, brands, or categories..."
    value={searchQuery}
    onChange={(e) => {
      setSearchQuery(e.target.value);
      setIsSearchOpen(true);
    }}
    onFocus={() => setIsSearchOpen(true)}
    className="w-full pl-9 pr-8 py-2 bg-slate-100 text-sm rounded-xl border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
  />
                <Search className={`w-4 h-4 text-slate-400 absolute left-3 top-2.5 ${isSearching ? "animate-pulse text-blue-600" : ""}`} />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>

            {/* Mobile Predictive Search Results Dropdown */}
            {isSearchOpen && searchQuery.trim() && (
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-100">
                {isSearching ? (
                  <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
                    <span>Searching catalog...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((prod) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => selectProduct(prod.id)}
                      className="w-full p-2.5 flex items-center gap-3 hover:bg-slate-50 text-left cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                        <img
                          src={prod.images?.[0]}
                          alt={prod.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {renderHighlightedText(prod.name, searchQuery)}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {prod.categoryName || "Product"} • ${prod.price.toFixed(2)}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-slate-500">
                    No products found for "{searchQuery}"
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-1 text-sm font-medium">
              <button
    onClick={() => {
      setIsMobileMenuOpen(false);
      navigate("home");
    }}
    className="px-3 py-2 text-left hover:bg-slate-50 rounded-lg"
  >
                Home & Products
              </button>
              <button
    onClick={() => {
      setIsMobileMenuOpen(false);
      openCompareModal();
    }}
    className="px-3 py-2 text-left hover:bg-slate-50 rounded-lg flex items-center justify-between text-blue-700"
  >
                <span className="flex items-center gap-2">
                  <Columns3 className="w-4 h-4" /> Compare Products
                </span>
                {comparedProducts.length > 0 && <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                    {comparedProducts.length}
                  </span>}
              </button>
              <button
    onClick={() => {
      setIsMobileMenuOpen(false);
      setIsStoreLocatorOpen(true);
    }}
    className="px-3 py-2 text-left hover:bg-slate-50 rounded-lg flex items-center gap-2 text-slate-700"
  >
                <MapPin className="w-4 h-4 text-blue-600" /> Find Nearby Stores
              </button>
              <button
    onClick={() => {
      setIsMobileMenuOpen(false);
      navigate("cart");
    }}
    className="px-3 py-2 text-left hover:bg-slate-50 rounded-lg flex items-center justify-between"
  >
                <span>Shopping Cart</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                  {itemCount}
                </span>
              </button>
              <button
    onClick={() => {
      setIsMobileMenuOpen(false);
      navigate("account", "wishlist");
    }}
    className="px-3 py-2 text-left hover:bg-slate-50 rounded-lg flex items-center justify-between text-slate-700"
  >
                <span className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500" /> Saved Wishlist
                </span>
                {wishlist.length > 0 && <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">
                    {wishlist.length}
                  </span>}
              </button>
              <button
    onClick={() => {
      setIsMobileMenuOpen(false);
      navigate("account");
    }}
    className="px-3 py-2 text-left hover:bg-slate-50 rounded-lg"
  >
                Account & Orders
              </button>

              {!user && <div className="pt-2 flex flex-col gap-2 border-t border-slate-100">
                  <button
    onClick={() => {
      setIsMobileMenuOpen(false);
      navigate("auth");
    }}
    className="w-full py-2.5 px-3 bg-slate-900 hover:bg-blue-600 text-white text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-2 transition-colors cursor-pointer"
  >
                    <User className="w-4 h-4" /> Sign In or Create Account
                  </button>

                </div>}
            </div>
          </div>}
      </header>

      {
    /* Store Locator Modal */
  }
      <StoreLocatorModal
    isOpen={isStoreLocatorOpen}
    onClose={() => setIsStoreLocatorOpen(false)}
  />
    </>;
};
export {
  Navbar
};
