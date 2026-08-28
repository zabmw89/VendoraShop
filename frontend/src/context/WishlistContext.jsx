import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../services/api";
import { useToast } from "./ToastContext";
import { useAuth } from "./AuthContext";
const WishlistContext = createContext(void 0);
const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState(() => {
    try {
      const cached = localStorage.getItem("vendora_cached_wishlist");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const { user } = useAuth();
  const refreshWishlist = useCallback(async () => {
    try {
      setIsLoading(true);
      const localCachedRaw = localStorage.getItem("vendora_cached_wishlist");
      const localCached = localCachedRaw ? JSON.parse(localCachedRaw) : [];
      if (user && localCached.length > 0) {
        const localIds = localCached.map((p) => p.id);
        const res = await api.syncWishlist(localIds);
        const items = Array.isArray(res.items) ? res.items : [];
        setWishlist(items);
        localStorage.setItem("vendora_cached_wishlist", JSON.stringify(items));
        return;
      }
      const raw = await api.getWishlist();
      const items = Array.isArray(raw) ? raw : [];
      setWishlist(items);
      localStorage.setItem("vendora_cached_wishlist", JSON.stringify(items));
    } catch (err) {
      console.error("Failed to fetch wishlist:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  useEffect(() => {
    refreshWishlist();
  }, [user, refreshWishlist]);
  useEffect(() => {
    try {
      localStorage.setItem("vendora_cached_wishlist", JSON.stringify(wishlist));
    } catch {
    }
  }, [wishlist]);
  const wishlistIds = React.useMemo(() => {
    return new Set(wishlist.map((item) => item.id));
  }, [wishlist]);
  const isInWishlist = useCallback((productId) => {
    return wishlistIds.has(productId);
  }, [wishlistIds]);
  const toggleWishlist = async (product) => {
    const wasInWishlist = isInWishlist(product.id);
    if (wasInWishlist) {
      setWishlist((prev) => prev.filter((item) => item.id !== product.id));
    } else {
      setWishlist((prev) => [product, ...prev]);
    }
    try {
      const res = await api.toggleWishlist(product.id);
      if (Array.isArray(res.items)) setWishlist(res.items);
      showToast(
        res.inWishlist ? `Added "${product.name}" to your wishlist.` : `Removed "${product.name}" from your wishlist.`,
        "success"
      );
      return res.inWishlist;
    } catch (err) {
      refreshWishlist();
      showToast(err.message || "Failed to update wishlist.", "error");
      return wasInWishlist;
    }
  };
  const addToWishlist = async (product) => {
    if (isInWishlist(product.id)) return;
    setWishlist((prev) => [product, ...prev]);
    try {
      const res = await api.addToWishlist(product.id);
      if (Array.isArray(res.items)) setWishlist(res.items);
      showToast(`Added "${product.name}" to your wishlist.`, "success");
    } catch (err) {
      refreshWishlist();
      showToast(err.message || "Failed to add to wishlist.", "error");
    }
  };
  const removeFromWishlist = async (productId) => {
    const target = wishlist.find((p) => p.id === productId);
    setWishlist((prev) => prev.filter((item) => item.id !== productId));
    try {
      const res = await api.removeFromWishlist(productId);
      if (Array.isArray(res.items)) setWishlist(res.items);
      if (target) {
        showToast(`Removed "${target.name}" from your wishlist.`, "info");
      }
    } catch (err) {
      refreshWishlist();
      showToast(err.message || "Failed to remove from wishlist.", "error");
    }
  };
  const clearWishlist = async () => {
    setWishlist([]);
    try {
      await api.clearWishlist();
      showToast("Wishlist has been cleared.", "info");
    } catch (err) {
      refreshWishlist();
      showToast(err.message || "Failed to clear wishlist.", "error");
    }
  };
  const contextValue = React.useMemo(() => ({
      wishlist,
      wishlistIds,
      itemCount: wishlist.length,
      isInWishlist,
      toggleWishlist,
      addToWishlist,
      removeFromWishlist,
      clearWishlist,
      refreshWishlist,
      isLoading
    }), [
      wishlist,
      wishlistIds,
      isInWishlist,
      toggleWishlist,
      addToWishlist,
      removeFromWishlist,
      clearWishlist,
      refreshWishlist,
      isLoading
    ]);
  return <WishlistContext.Provider
    value={contextValue}
  >
      {children}
    </WishlistContext.Provider>;
};
const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};
export {
  WishlistProvider,
  useWishlist
};
