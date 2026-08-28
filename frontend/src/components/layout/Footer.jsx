import { useState } from "react";
import {
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  Mail,
  MapPin,
  Columns3,
  Check,
  Sparkles,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { useComparison } from "../../context/ComparisonContext";
import { api } from "../../services/api";
import { StoreLocatorModal } from "../common/StoreLocatorModal";
const Footer = ({ onNavigate }) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscribedCoupon, setSubscribedCoupon] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const { showToast } = useToast();
  const { openCompareModal } = useComparison();
  const validateEmail = (str) => {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(str.trim());
  };
  const handleSubscribe = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    if (!validateEmail(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address (e.g. name@example.com).");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.subscribeNewsletter(trimmedEmail);
      setSubscribedCoupon(res.discountCode || "WELCOME10");
      showToast(res.message || "Subscribed successfully! Your 10% coupon is ready.", "success");
      setEmail("");
    } catch (err) {
      console.error("Newsletter subscription error:", err);
      const msg = err.message || "Subscription failed. Please try again.";
      setErrorMessage(msg);
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };
  return <>
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 mt-20">
        {
    /* Value propositions banner */
  }
        <div className="border-b border-slate-800 py-10 bg-slate-950/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Free Shipping</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Complimentary delivery on all orders exceeding $75 nationwide.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">30-Day Returns</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Zero hassle return policy with pre-paid return shipping labels.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Secure Payments</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Bank-level encrypted checkout protecting your financial details.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">24/7 Support</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Expert support team always ready to answer inquiries in real-time.
                </p>
              </div>
            </div>
          </div>
        </div>

        {
    /* Main Footer Links & Newsletter */
  }
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
            {
    /* Brand Info & Newsletter Subscription */
  }
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                  V
                </div>
                <span className="text-xl font-bold tracking-tight text-white">
                  Vendora<span className="text-blue-400">Shop</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                VendoraShop delivers precision-engineered everyday electronics, acoustic audio, ergonomic workspace gear, and travel essentials with uncompromising build quality.
              </p>

              {
    /* Newsletter Subscription with Form Validation & API */
  }
              <div className="pt-2">
                <h5 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Join VIP Club (Instant 10% Off)</span>
                </h5>
                <p className="text-[11px] text-slate-400 mb-2">
                  Subscribe to receive early drops, private discounts, and firmware updates.
                </p>

                {subscribedCoupon ? <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs space-y-1 animate-in fade-in">
                    <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Subscription Confirmed!</span>
                    </div>
                    <p className="text-emerald-200/80 text-[11px]">
                      Use code <strong className="text-white bg-emerald-900 px-1.5 py-0.5 rounded font-mono font-bold tracking-wider">{subscribedCoupon}</strong> at checkout for 10% off.
                    </p>
                  </div> : <form onSubmit={handleSubscribe} className="space-y-2 max-w-sm" noValidate>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
    type="email"
    placeholder="Enter your email address..."
    value={email}
    onChange={(e) => {
      setEmail(e.target.value);
      if (errorMessage) setErrorMessage(null);
    }}
    disabled={isSubmitting}
    className={`w-full pl-9 pr-3 py-2 bg-slate-800 text-xs text-white placeholder-slate-500 rounded-lg border outline-hidden transition-colors ${errorMessage ? "border-rose-500 focus:border-rose-500" : "border-slate-700 focus:border-blue-500"}`}
    id="newsletter-email-input"
    aria-label="Email address for newsletter"
  />
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      </div>
                      <button
    type="submit"
    disabled={isSubmitting}
    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 shadow-xs"
    id="newsletter-submit-btn"
  >
                        {isSubmitting ? <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Joining...</span>
                          </> : <span>Subscribe</span>}
                      </button>
                    </div>
                    {errorMessage && <p className="text-[11px] text-rose-400 flex items-center gap-1 animate-in fade-in">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{errorMessage}</span>
                      </p>}
                  </form>}
              </div>
            </div>

            {
    /* Catalog Departments */
  }
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                Departments
              </h5>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <button
    onClick={() => onNavigate("home", "category=electronics")}
    className="hover:text-white transition-colors cursor-pointer"
  >
                    Electronics & Computing
                  </button>
                </li>
                <li>
                  <button
    onClick={() => onNavigate("home", "category=audio")}
    className="hover:text-white transition-colors cursor-pointer"
  >
                    Audio & Acoustics
                  </button>
                </li>
                <li>
                  <button
    onClick={() => onNavigate("home", "category=wearables")}
    className="hover:text-white transition-colors cursor-pointer"
  >
                    Smart Wearables
                  </button>
                </li>
                <li>
                  <button
    onClick={() => onNavigate("home", "category=home-living")}
    className="hover:text-white transition-colors cursor-pointer"
  >
                    Home & Workspace
                  </button>
                </li>
                <li>
                  <button
    onClick={() => onNavigate("home", "category=travel-gear")}
    className="hover:text-white transition-colors cursor-pointer"
  >
                    Travel & Lifestyle
                  </button>
                </li>
              </ul>
            </div>

            {
    /* Customer Care */
  }
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                Customer Care
              </h5>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <button
    onClick={() => setIsStoreModalOpen(true)}
    className="transition-colors cursor-pointer flex items-center gap-1.5 text-blue-400 hover:text-blue-300"
    id="footer-find-store-btn"
  >
                    <MapPin className="w-3.5 h-3.5" /> Find Nearby Store & Pickups
                  </button>
                </li>
                <li>
                  <button
    onClick={openCompareModal}
    className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
    id="footer-compare-btn"
  >
                    <Columns3 className="w-3.5 h-3.5 text-blue-400" /> Side-by-Side Product Comparison
                  </button>
                </li>
                <li>
                  <button
    onClick={() => onNavigate("account", "orders")}
    className="hover:text-white transition-colors cursor-pointer"
  >
                    Track Order Status
                  </button>
                </li>
                <li>
                  <button
    onClick={() => onNavigate("cart")}
    className="hover:text-white transition-colors cursor-pointer"
  >
                    Shopping Bag & Checkout
                  </button>
                </li>
                <li>
                  <button
    onClick={() => onNavigate("account", "wishlist")}
    className="hover:text-white transition-colors cursor-pointer"
  >
                    Saved Wishlist
                  </button>
                </li>
                <li>
                  <button
    onClick={() => onNavigate("account")}
    className="hover:text-white transition-colors cursor-pointer"
  >
                    My Profile & Orders
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {
    /* Bottom Bar matching Professional Polish design */
  }
          <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <p>© 2026 VendoraShop Inc. All rights reserved. Production E-Commerce Engine.</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-slate-400">
                Coupons: <strong className="text-blue-400">WELCOME10</strong> (10% off) | <strong className="text-blue-400">VENDORA20</strong> (20% off)
              </span>
            </div>
          </div>
        </div>
      </footer>

      {
    /* Store Locator Modal */
  }
      <StoreLocatorModal
    isOpen={isStoreModalOpen}
    onClose={() => setIsStoreModalOpen(false)}
  />
    </>;
};
export {
  Footer
};
