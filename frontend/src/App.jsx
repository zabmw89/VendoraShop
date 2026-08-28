import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { ComparisonProvider } from "./context/ComparisonContext";
import { NotificationProvider } from "./context/NotificationContext";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { CartDrawer } from "./components/cart/CartDrawer";
import { ComparisonBar } from "./components/product/ComparisonBar";
import { ProductComparisonModal } from "./components/product/ProductComparisonModal";
import { OfflineBanner } from "./components/layout/OfflineBanner";
import { NotificationPromptBanner } from "./components/layout/NotificationPromptBanner";
import { NotificationPermissionModal } from "./components/common/NotificationPermissionModal";
import { ScrollProgressBar } from "./components/layout/ScrollProgressBar";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { initGlobalErrorLogging } from "./utils/logger";
initGlobalErrorLogging();
import { BrandLoadingOverlay } from "./components/layout/BrandLoadingOverlay";
import { HomePage } from "./pages/HomePage";
import { ProductDetailsPage } from "./pages/ProductDetailsPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { OrderConfirmationPage } from "./pages/OrderConfirmationPage";
import { AccountPage } from "./pages/AccountPage";
import { AuthPage } from "./pages/AuthPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { ApiDocsPage } from "./pages/ApiDocsPage";
import { TestRunnerPage } from "./pages/TestRunnerPage";
import { updateSeoMeta } from "./utils/seo";
function MainApp() {
  const [currentView, setCurrentView] = useState("home");
  const [viewParam, setViewParam] = useState(void 0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash) {
        const [view, param] = hash.split(":");
        setCurrentView(view || "home");
        setViewParam(param);
      }
    };
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);
  useEffect(() => {
    updateSeoMeta(currentView, viewParam);
  }, [currentView, viewParam]);
  const handleNavigate = (view, param) => {
    setIsTransitioning(true);
    setCurrentView(view);
    setViewParam(param);
    window.location.hash = param ? `${view}:${param}` : view;
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      setIsTransitioning(false);
    }, 450);
  };
  const renderView = () => {
    switch (currentView) {
      case "product":
        return <ProductDetailsPage productId={viewParam || "prod_1"} onNavigate={handleNavigate} />;
      case "cart":
        return <CartPage onNavigate={handleNavigate} />;
      case "checkout":
        return <CheckoutPage onNavigate={handleNavigate} />;
      case "confirmation":
        return <OrderConfirmationPage orderId={viewParam || ""} onNavigate={handleNavigate} />;
      case "account":
        return <AccountPage onNavigate={handleNavigate} initialTab={viewParam} />;
      case "auth":
        return <AuthPage onNavigate={handleNavigate} redirectParam={viewParam} />;
      case "admin":
        return <AdminDashboardPage onNavigate={handleNavigate} />;
      case "docs":
        return <ApiDocsPage />;
      case "tests":
        return <TestRunnerPage onNavigate={handleNavigate} />;
      case "home":
      default:
        return <HomePage onNavigate={handleNavigate} initialQuery={viewParam} />;
    }
  };
  return <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Brand Loading Overlay for Page Transitions */}
      <BrandLoadingOverlay isLoading={isTransitioning} />

      {
    /* Scroll Progress Bar at the top of the viewport and main container */
  }
      <ScrollProgressBar position="fixed" />

      {
    /* Offline Connectivity Banner */
  }
      <OfflineBanner />

      {
    /* Browser Notification Opt-In Prompt */
  }
      <NotificationPromptBanner />

      {
    /* Navigation Header */
  }
      <Navbar currentView={currentView} onNavigate={handleNavigate} />

      {
    /* Main Page Workspace with Framer Motion 'fade-in-up' Page Transition */
  }
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative" id="main-content-container">
        {
    /* Subtle sticky progress cue at the top of the main container */
  }
        <ScrollProgressBar position="sticky" className="-mt-6 mb-4" />

        <ErrorBoundary name={`PageView-${currentView}`} onReset={() => setCurrentView("home")}>
          <AnimatePresence mode="wait">
            <motion.div
    key={`${currentView}-${viewParam || ""}`}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -12 }}
    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    className="w-full"
  >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
      </main>

      {
    /* Slide-out Cart Drawer */
  }
      <CartDrawer onNavigate={handleNavigate} />

      {
    /* Floating Comparison Bar & Modal */
  }
      <ComparisonBar />
      <ProductComparisonModal onNavigate={handleNavigate} />

      {
    /* Notification Permission & Settings Modal */
  }
      <NotificationPermissionModal />

      {
    /* Global Application Footer */
  }
      <Footer onNavigate={handleNavigate} />
    </div>;
}
function App() {
  return <ErrorBoundary name="RootApplicationBoundary">
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <ComparisonProvider>
                <NotificationProvider>
                  <MainApp />
                </NotificationProvider>
              </ComparisonProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>;
}
export default App;

