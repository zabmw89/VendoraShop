import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { api } from "../services/api";
import { useToast } from "./ToastContext";
const CartContext = createContext(void 0);
const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const refreshCart = useCallback(async () => {
    try {
      const data = await api.getCart();
      setCart(data);
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    }
  }, []);
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);
  const items = cart?.items || [];
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = Number(items.reduce((acc, item) => acc + item.product.price * item.quantity, 0).toFixed(2));
  const shippingFee = subtotal === 0 ? 0 : subtotal >= 75 ? 0 : 9.99;
  const tax = Number((subtotal * 0.0825).toFixed(2));
  let discount = 0;
  if (cart?.appliedCoupon) {
    const pct = Number(cart.appliedCoupon.discountPercent ?? cart.appliedCoupon.discount_percent ?? 0);
    const amt = Number(cart.appliedCoupon.discountAmount ?? cart.appliedCoupon.discount_amount ?? 0);
    if (pct > 0) {
      discount = Number((subtotal * pct / 100).toFixed(2));
    } else if (amt > 0) {
      discount = Math.min(amt, subtotal);
    }
  }
  const total = Number(Math.max(0, subtotal + shippingFee + tax - discount).toFixed(2));
  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);
  const addToCart = async (product, quantity = 1) => {
    try {
      setIsLoading(true);
      const updatedCart = await api.addToCart(product.id, quantity);
      setCart(updatedCart);
      showToast(`Added ${quantity}x "${product.name}" to cart!`, "success");
      return true;
    } catch (err) {
      showToast(err.message || "Failed to add item to cart", "error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  const updateQuantity = async (productId, quantity) => {
    try {
      setIsLoading(true);
      if (quantity <= 0) {
        return await removeItem(productId);
      }
      const updatedCart = await api.updateCartItem(productId, quantity);
      setCart(updatedCart);
    } catch (err) {
      showToast(err.message || "Failed to update quantity", "error");
    } finally {
      setIsLoading(false);
    }
  };
  const removeItem = async (productId) => {
    try {
      setIsLoading(true);
      const updatedCart = await api.removeCartItem(productId);
      setCart(updatedCart);
      showToast("Item removed from cart", "info");
    } catch (err) {
      showToast(err.message || "Failed to remove item", "error");
    } finally {
      setIsLoading(false);
    }
  };
  const applyCoupon = async (code) => {
    try {
      setIsLoading(true);
      const res = await api.applyCoupon(code);
      if (res.cart && typeof res.cart === 'object' && Array.isArray(res.cart.items)) {
        setCart(res.cart);
      } else {
        setCart((prev) => ({
          ...(prev || {}),
          appliedCoupon: res.appliedCoupon || res.cart?.appliedCoupon || null,
        }));
      }
      showToast(res.message || "Promo code applied!", "success");
    } catch (err) {
      showToast(err.message || "Invalid coupon code", "error");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  const removeCoupon = async () => {
    try {
      setIsLoading(true);
      const res = await api.removeCoupon();
      if (res.cart && typeof res.cart === 'object' && Array.isArray(res.cart.items)) {
        setCart(res.cart);
      } else {
        setCart((prev) => ({
          ...(prev || {}),
          appliedCoupon: null,
        }));
      }
      showToast(res.message || "Coupon removed", "info");
    } catch (err) {
      showToast(err.message || "Failed to remove coupon", "error");
    } finally {
      setIsLoading(false);
    }
  };
  const clearCart = async () => {
    try {
      setIsLoading(true);
      setCart((prev) => ({
        ...(prev || {}),
        items: [],
        appliedCoupon: null,
      }));
      await api.clearCart();
    } catch (err) {
      console.warn("Cart clear network warning:", err);
    } finally {
      await refreshCart();
      setIsLoading(false);
    }
  };
  const contextValue = useMemo(() => ({
      cart,
      items,
      itemCount,
      subtotal,
      shippingFee,
      tax,
      discount,
      total,
      isDrawerOpen,
      setIsDrawerOpen,
      openDrawer,
      closeDrawer,
      addToCart,
      updateQuantity,
      removeItem,
      applyCoupon,
      removeCoupon,
      clearCart,
      refreshCart,
      isLoading
    }), [
    cart,
    items,
    itemCount,
    subtotal,
    shippingFee,
    tax,
    discount,
    total,
    isDrawerOpen,
    addToCart,
    updateQuantity,
    removeItem,
    applyCoupon,
    removeCoupon,
    clearCart,
    refreshCart,
    isLoading
  ]);
  return <CartContext.Provider
    value={contextValue}
  >
      {children}
    </CartContext.Provider>;
};
function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
export {
  CartProvider,
  useCart
};
