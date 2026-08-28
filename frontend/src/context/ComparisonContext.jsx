import { createContext, useContext, useState, useEffect, useMemo} from "react";
import { useToast } from "./ToastContext";
const ComparisonContext = createContext(void 0);
const MAX_COMPARE_ITEMS = 3;
const STORAGE_KEY = "vendora_compared_products_v1";
const ComparisonProvider = ({ children }) => {
  const [comparedProducts, setComparedProducts] = useState([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const { showToast } = useToast();
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setComparedProducts(parsed.slice(0, MAX_COMPARE_ITEMS));
        }
      }
    } catch (e) {
      console.warn("Failed to load compared products from storage:", e);
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(comparedProducts));
    } catch (e) {
      console.warn("Failed to save compared products:", e);
    }
  }, [comparedProducts]);
  const isInCompare = (productId) => {
    return comparedProducts.some((p) => p.id === productId);
  };
  const addToCompare = (product) => {
    if (isInCompare(product.id)) {
      showToast(`"${product.name}" is already in your comparison list.`, "info");
      return false;
    }
    if (comparedProducts.length >= MAX_COMPARE_ITEMS) {
      showToast(`You can compare up to ${MAX_COMPARE_ITEMS} products at a time. Remove an item first.`, "warning");
      return false;
    }
    const updated = [...comparedProducts, product];
    setComparedProducts(updated);
    showToast(`Added "${product.name}" to comparison (${updated.length}/${MAX_COMPARE_ITEMS}).`, "success");
    return true;
  };
  const removeFromCompare = (productId) => {
    setComparedProducts((prev) => {
      const removed = prev.find((p) => p.id === productId);
      const updated = prev.filter((p) => p.id !== productId);
      if (removed) {
        showToast(`Removed "${removed.name}" from comparison.`, "info");
      }
      return updated;
    });
  };
  const clearCompare = () => {
    setComparedProducts([]);
    showToast("Comparison list cleared.", "info");
  };
  const openCompareModal = () => setIsCompareModalOpen(true);
  const closeCompareModal = () => setIsCompareModalOpen(false);
  const value = useMemo(() => ({
    comparedProducts,
    addToCompare,
    removeFromCompare,
    clearCompare,
    isInCompare,
    isCompareModalOpen,
    openCompareModal,
    closeCompareModal
  }), [comparedProducts, isCompareModalOpen]);
  return <ComparisonContext.Provider
    value={value}
  >
      {children}
    </ComparisonContext.Provider>;
};
const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error("useComparison must be used within a ComparisonProvider");
  }
  return context;
};
export {
  ComparisonProvider,
  useComparison
};
