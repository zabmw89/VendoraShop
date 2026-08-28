import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  Building2,
  User as UserIcon,
  Award,
  Sparkles,
  Coins
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useNotifications } from "../context/NotificationContext";
import { api } from "../services/api";
import { LazyImage } from "../components/common/LazyImage";
import { triggerOrderSuccessHaptic, triggerStepChangeHaptic } from "../utils/haptics";
import {
  formatPhoneNumber,
  formatCardNumber,
  formatCardExpiry,
  formatCardCvc
} from "../utils/masking";
const CheckoutPage = ({ onNavigate }) => {
  const { items, subtotal, shippingFee, tax, discount, cart, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { permission, requestPermission, sendOrderConfirmedAlert } = useNotifications();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loyaltyAccount, setLoyaltyAccount] = useState(null);
  const [redeemPoints, setRedeemPoints] = useState(0);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "+1 (555) 438-9102",
    street: user?.address?.street || "742 Evergreen Terrace",
    apartment: "Apt 4B",
    city: user?.address?.city || "Seattle",
    state: user?.address?.state || "WA",
    postalCode: user?.address?.postalCode || "98101",
    country: user?.address?.country || "United States",
    paymentMethod: "credit_card",
    // Credit card simulation fields
    cardNumber: "4532 8901 2345 6789",
    cardExpiry: "08/28",
    cardCvc: "842",
    cardHolder: user?.name || "ALEX JOHNSON",
    notes: "Please leave at front doorstep if not home."
  });
  useEffect(() => {
    if (user) {
      api.getLoyaltyAccount().then((acc) => setLoyaltyAccount(acc)).catch((err) => console.error("Failed to load loyalty account in checkout:", err));
    } else {
      setLoyaltyAccount(null);
      setRedeemPoints(0);
      setUseLoyaltyPoints(false);
    }
  }, [user]);
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name,
        email: prev.email || user.email,
        phone: prev.phone || user.phone || "",
        street: prev.street || user.address?.street || "",
        city: prev.city || user.address?.city || "",
        state: prev.state || user.address?.state || "",
        postalCode: prev.postalCode || user.address?.postalCode || "",
        country: prev.country || user.address?.country || "United States"
      }));
    }
  }, [user]);
  const maxRedeemablePoints = loyaltyAccount ? Math.min(
    loyaltyAccount.currentPoints,
    Math.floor(Math.max(0, subtotal - discount) * 20)
  ) : 0;
  const actualPointsToRedeem = useLoyaltyPoints ? Math.min(redeemPoints, maxRedeemablePoints) : 0;
  const loyaltyDiscount = Number((actualPointsToRedeem / 20).toFixed(2));
  const finalTotal = Number(
    Math.max(0, subtotal + shippingFee + tax - discount - loyaltyDiscount).toFixed(2)
  );
  const pointsEarnMultiplier = loyaltyAccount?.tier?.multiplier || 1;
  const estimatedPointsEarned = Math.floor(
    Math.max(0, subtotal - discount - loyaltyDiscount) * 10 * pointsEarnMultiplier
  );
  if (items.length === 0) {
    return <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500">
          Please add products to your cart before proceeding to checkout.
        </p>
        <button
      onClick={() => onNavigate("home")}
      className="px-5 py-2.5 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
    >
          Return to Store
        </button>
      </div>;
  }
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    if (name === "phone") {
      formattedValue = formatPhoneNumber(value);
    } else if (name === "cardNumber") {
      formattedValue = formatCardNumber(value);
    } else if (name === "cardExpiry") {
      formattedValue = formatCardExpiry(value);
    } else if (name === "cardCvc") {
      formattedValue = formatCardCvc(value);
    }
    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
  };
  const handleNextStep = (e) => {
    e.preventDefault();
    if (step === 1) {
      if (!formData.fullName || !formData.email || !formData.phone) {
        showToast("Please fill out all contact information fields.", "error");
        return;
      }
      triggerStepChangeHaptic();
      setStep(2);
    } else if (step === 2) {
      if (!formData.street || !formData.city || !formData.state || !formData.postalCode) {
        showToast("Please provide a complete shipping address.", "error");
        return;
      }
      triggerStepChangeHaptic();
      setStep(3);
    }
  };
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const shippingAddress = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        street: formData.street,
        apartment: formData.apartment,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        country: formData.country
      };
      const res = await api.createOrder({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: `${formData.street}${formData.apartment ? ', ' + formData.apartment : ''}, ${formData.city}, ${formData.state} ${formData.postalCode}, ${formData.country}`,
        city: formData.city,
        state: formData.state,
        zipCode: formData.postalCode,
        paymentMethod: formData.paymentMethod,
        cartKey: cart?.session_key || undefined,
        couponCode: cart?.appliedCoupon?.code,
        redeemLoyaltyPoints: actualPointsToRedeem > 0 ? actualPointsToRedeem : 0,
        notes: formData.notes
      });
      const placedOrderId = res.order?.id || res.id;
      triggerOrderSuccessHaptic();
      if (placedOrderId) {
        sendOrderConfirmedAlert(placedOrderId, finalTotal);
      }
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {
      }
      showToast("Order successfully placed! Thank you.", "success");
      await clearCart();
      onNavigate("confirmation", placedOrderId);
    } catch (err) {
      showToast(err.message || "Failed to place order", "error");
    } finally {
      setIsSubmitting(false);
    }
  };
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {
    /* Checkout Progress Stepper */
  }
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <div
    onClick={() => setStep(1)}
    className={`flex items-center gap-2 cursor-pointer ${step >= 1 ? "text-blue-600 font-bold" : "text-slate-400"}`}
  >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step > 1 ? "bg-green-600 text-white" : step === 1 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"}`}>
              {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : "1"}
            </div>
            <span className="text-xs hidden sm:inline">1. Contact Info</span>
          </div>

          <div className="flex-1 h-0.5 mx-4 bg-slate-200" />

          <div
    onClick={() => step >= 2 && setStep(2)}
    className={`flex items-center gap-2 ${step >= 2 ? "text-blue-600 font-bold cursor-pointer" : "text-slate-400"}`}
  >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step > 2 ? "bg-green-600 text-white" : step === 2 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"}`}>
              {step > 2 ? <CheckCircle2 className="w-4 h-4" /> : "2"}
            </div>
            <span className="text-xs hidden sm:inline">2. Shipping Address</span>
          </div>

          <div className="flex-1 h-0.5 mx-4 bg-slate-200" />

          <div className={`flex items-center gap-2 ${step === 3 ? "text-blue-600 font-bold" : "text-slate-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step === 3 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"}`}>
              3
            </div>
            <span className="text-xs hidden sm:inline">3. Payment & Review</span>
          </div>
        </div>
      </div>

      {
    /* Main Checkout Form + Order Review Sidebar */
  }
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {
    /* Form Steps */
  }
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          {
    /* STEP 1: Contact Information */
  }
          {step === 1 && <form onSubmit={handleNextStep} className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-blue-600" />
                  Customer Information
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  We'll send order tracking updates and receipt to this email.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Full Legal Name *
                  </label>
                  <input
    type="text"
    name="fullName"
    value={formData.fullName}
    onChange={handleInputChange}
    required
    placeholder="e.g. Alex Johnson"
    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 focus:bg-white rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Email Address *
                    </label>
                    <input
    type="email"
    name="email"
    value={formData.email}
    onChange={handleInputChange}
    required
    placeholder="alex@example.com"
    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 focus:bg-white rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
  />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Phone Number *
                    </label>
                    <input
    type="tel"
    name="phone"
    value={formData.phone}
    onChange={handleInputChange}
    required
    maxLength={18}
    placeholder="(555) 000-0000"
    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 focus:bg-white rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none font-mono"
  />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
    type="button"
    onClick={() => onNavigate("cart")}
    className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
  >
                  <ArrowLeft className="w-4 h-4" /> Back to Cart
                </button>

                <button
    type="submit"
    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
  >
                  Continue to Shipping <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>}

          {
    /* STEP 2: Shipping Destination */
  }
          {step === 2 && <form onSubmit={handleNextStep} className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  Shipping Destination
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter the address where you'd like your order delivered.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Street Address *
                    </label>
                    <input
    type="text"
    name="street"
    value={formData.street}
    onChange={handleInputChange}
    required
    placeholder="123 Main St"
    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 focus:bg-white rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
  />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Apt / Suite
                    </label>
                    <input
    type="text"
    name="apartment"
    value={formData.apartment}
    onChange={handleInputChange}
    placeholder="Apt 4B"
    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 focus:bg-white rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
  />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      City *
                    </label>
                    <input
    type="text"
    name="city"
    value={formData.city}
    onChange={handleInputChange}
    required
    placeholder="Seattle"
    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 focus:bg-white rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
  />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      State / Province *
                    </label>
                    <input
    type="text"
    name="state"
    value={formData.state}
    onChange={handleInputChange}
    required
    placeholder="WA"
    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 focus:bg-white rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
  />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Postal Code *
                    </label>
                    <input
    type="text"
    name="postalCode"
    value={formData.postalCode}
    onChange={handleInputChange}
    required
    placeholder="98101"
    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 focus:bg-white rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
  />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Country *
                  </label>
                  <select
    name="country"
    value={formData.country}
    onChange={handleInputChange}
    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 focus:bg-white rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none font-medium"
  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Germany">Germany</option>
                    <option value="Australia">Australia</option>
                    <option value="Japan">Japan</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Delivery Instructions / Notes
                  </label>
                  <textarea
    name="notes"
    rows={2}
    value={formData.notes}
    onChange={handleInputChange}
    placeholder="Gate code, porch instructions, etc."
    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 focus:bg-white rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
  />
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
    type="button"
    onClick={() => setStep(1)}
    className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
  >
                  <ArrowLeft className="w-4 h-4" /> Back to Contact Info
                </button>

                <button
    type="submit"
    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
  >
                  Continue to Payment <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>}

          {
    /* STEP 3: Payment Simulation & Place Order */
  }
          {step === 3 && <form onSubmit={handlePlaceOrder} className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Payment Method
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select your preferred payment method. Encrypted & simulated in sandbox mode.
                </p>
              </div>

              {
    /* Payment Method Selector Cards */
  }
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
    { id: "credit_card", label: "Credit Card", icon: CreditCard },
    { id: "paypal", label: "PayPal", icon: ShieldCheck },
    { id: "apple_pay", label: "Apple Pay", icon: Building2 },
    { id: "cash_on_delivery", label: "Pay on Delivery", icon: Truck }
  ].map((pm) => {
    const Icon = pm.icon;
    const isSelected = formData.paymentMethod === pm.id;
    return <button
      key={pm.id}
      type="button"
      onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: pm.id }))}
      className={`p-3 rounded-xl border text-center flex flex-col items-center gap-2 transition-all cursor-pointer ${isSelected ? "border-blue-600 bg-blue-50/60 text-blue-900 font-bold shadow-xs ring-2 ring-blue-500/20" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
    >
                      <Icon className={`w-5 h-5 ${isSelected ? "text-blue-600" : "text-slate-400"}`} />
                      <span className="text-[11px] leading-tight">{pm.label}</span>
                    </button>;
  })}
              </div>

              {
    /* Simulated Card Preview & Inputs if Credit Card selected */
  }
              {formData.paymentMethod === "credit_card" && <div className="space-y-4 pt-2">
                  {
    /* Visual Card Mock */
  }
                  <div className="bg-linear-to-tr from-slate-950 via-slate-900 to-blue-950 text-white p-5 rounded-xl shadow-lg border border-slate-800 space-y-4 max-w-sm mx-auto">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold tracking-wider text-slate-400">VENDORA CARD</span>
                      <CreditCard className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="font-mono text-base tracking-widest text-slate-200">
                      {formData.cardNumber || "\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022"}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 uppercase">
                      <div>
                        <span className="block text-[8px]">Cardholder</span>
                        <span className="font-bold text-white tracking-wider">{formData.cardHolder || "NAME"}</span>
                      </div>
                      <div>
                        <span className="block text-[8px]">Expires</span>
                        <span className="font-bold text-white">{formData.cardExpiry || "MM/YY"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Card Number
                      </label>
                      <input
    type="text"
    name="cardNumber"
    maxLength={19}
    placeholder="4532 8901 2345 6789"
    value={formData.cardNumber}
    onChange={handleInputChange}
    required
    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 focus:bg-white rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none font-mono"
  />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Expiration (MM/YY)
                      </label>
                      <input
    type="text"
    name="cardExpiry"
    maxLength={5}
    value={formData.cardExpiry}
    onChange={handleInputChange}
    required
    placeholder="08/28"
    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 focus:bg-white rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none font-mono"
  />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Security CVC / CVV
                      </label>
                      <input
    type="password"
    name="cardCvc"
    maxLength={4}
    value={formData.cardCvc}
    onChange={handleInputChange}
    required
    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 focus:bg-white rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none font-mono"
  />
                    </div>
                  </div>
                </div>}

              {
    /* Delivery Summary Verification */
  }
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-900">Ship To:</span>
                  <span className="text-right">{formData.fullName} • {formData.street}, {formData.city}, {formData.state} {formData.postalCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-900">Contact:</span>
                  <span>{formData.email} • {formData.phone}</span>
                </div>
              </div>

              {
    /* Order Updates & Mobile Haptics Toggle */
  }
              <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-600 text-white shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Instant Order Updates & Mobile Haptics</div>
                    <div className="text-[11px] text-slate-500">
                      Receive live shipping notifications and tactile confirmation on completion.
                    </div>
                  </div>
                </div>
                {permission !== "granted" && <button
    type="button"
    onClick={() => requestPermission()}
    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-[11px] font-bold rounded-lg shadow-xs transition-all shrink-0 cursor-pointer"
  >
                    Enable Alerts
                  </button>}
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
    type="button"
    onClick={() => setStep(2)}
    className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
  >
                  <ArrowLeft className="w-4 h-4" /> Back to Shipping
                </button>

                <button
    type="submit"
    disabled={isSubmitting}
    className="px-8 py-3.5 bg-green-600 hover:bg-green-700 active:scale-[0.99] text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
    id="place-order-submit-btn"
  >
                  <Lock className="w-4 h-4" />
                  {isSubmitting ? "Authorizing & Placing Order..." : `Pay ${finalTotal.toFixed(2)} & Place Order`}
                </button>
              </div>
            </form>}
        </div>

        {
    /* Order Review Sidebar */
  }
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>Your Items ({items.length})</span>
              <button
    onClick={() => onNavigate("cart")}
    className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
  >
                Edit Cart
              </button>
            </h3>

            {
    /* Line Items */
  }
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
              {items.map((item) => <div key={item.productId} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
                  <div className="w-14 h-14 shrink-0 rounded-lg bg-slate-50 border border-slate-200 p-1 overflow-hidden">
                    <LazyImage
    src={item.product.images[0]}
    alt={item.product.name}
    objectFit="contain"
    className="w-full h-full"
    wrapperClassName="w-full h-full bg-slate-50"
  />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{item.product.name}</p>
                    <p className="text-[11px] text-slate-500">Qty: {item.quantity} × ${item.product.price.toFixed(2)}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>)}
            </div>

            {
    /* Loyalty Points Redemption Box */
  }
            {user && loyaltyAccount && loyaltyAccount.currentPoints > 0 && <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span>Vendora Loyalty Rewards</span>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-300">
                    {loyaltyAccount.currentPoints.toLocaleString()} pts available
                  </span>
                </div>

                <div className="flex items-start gap-2.5">
                  <input
    type="checkbox"
    id="redeem-loyalty-check"
    checked={useLoyaltyPoints}
    onChange={(e) => {
      setUseLoyaltyPoints(e.target.checked);
      if (e.target.checked && redeemPoints === 0) {
        setRedeemPoints(maxRedeemablePoints);
      }
    }}
    className="mt-0.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
  />
                  <label htmlFor="redeem-loyalty-check" className="text-xs text-amber-900 cursor-pointer leading-tight">
                    <span className="font-semibold">Redeem points for instant discount</span>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      20 points = $1.00 USD off. Max redeemable for this cart: {maxRedeemablePoints} pts (${(maxRedeemablePoints / 20).toFixed(2)}).
                    </p>
                  </label>
                </div>

                {useLoyaltyPoints && <div className="pt-2 border-t border-amber-200/60 space-y-2">
                    <div className="flex items-center gap-3">
                      <input
    type="range"
    min="20"
    max={maxRedeemablePoints}
    step="20"
    value={redeemPoints || maxRedeemablePoints}
    onChange={(e) => setRedeemPoints(Number(e.target.value))}
    className="flex-1 accent-amber-600 cursor-pointer"
  />
                      <span className="text-xs font-mono font-bold text-amber-900 shrink-0">
                        {actualPointsToRedeem} pts (-${loyaltyDiscount.toFixed(2)})
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-amber-700">
                      <span>Minimum 20 pts ($1.00)</span>
                      <button
    type="button"
    onClick={() => setRedeemPoints(maxRedeemablePoints)}
    className="font-bold underline hover:text-amber-900 cursor-pointer"
  >
                        Apply Max ({maxRedeemablePoints} pts)
                      </button>
                    </div>
                  </div>}
              </div>}

            {
    /* Calculation details */
  }
            <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && <div className="flex justify-between text-green-700 font-semibold">
                  <span>Promo Discount ({cart?.appliedCoupon?.code})</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>}
              {loyaltyDiscount > 0 && <div className="flex justify-between text-amber-700 font-semibold">
                  <span className="flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                    Loyalty Reward ({actualPointsToRedeem} pts)
                  </span>
                  <span>-${loyaltyDiscount.toFixed(2)}</span>
                </div>}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shippingFee === 0 ? <strong className="text-green-600">FREE</strong> : `${shippingFee.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Sales Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-3 border-t border-slate-200">
                <span>Order Total</span>
                <span className="text-blue-600 text-lg">${finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {
    /* Points earning preview */
  }
            {user && <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200/80 flex items-center justify-between text-[11px] text-blue-900">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>You'll earn <strong>+{estimatedPointsEarned} pts</strong> on this purchase!</span>
                </div>
                {loyaltyAccount && <span className="text-[10px] bg-blue-100 font-semibold text-blue-800 px-1.5 py-0.5 rounded">
                    {loyaltyAccount.tier.name} {loyaltyAccount.tier.multiplier}x
                  </span>}
              </div>}

            <div className="p-3 bg-green-50 rounded-lg border border-green-200 flex items-center gap-2.5 text-green-800 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
              <span>Real-time inventory lock. Your items are secured upon order confirmation.</span>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export {
  CheckoutPage
};
