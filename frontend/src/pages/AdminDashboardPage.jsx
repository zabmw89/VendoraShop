import { useState, useEffect } from "react";
import {
  Package,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Search,
  Clock,
  RotateCcw,
  Layers,
  X,
  Save,
  Check,
  Bug,
  Terminal,
  RefreshCw,
  Gauge,
  Activity,
  Zap,
  ShieldOff,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../services/api";
import { AdminDashboardSkeleton } from "../components/skeletons/AdminDashboardSkeleton";
import { WebVitalsD3Dashboard } from "../components/common/WebVitalsD3Dashboard";
const AdminDashboardPage = ({ onNavigate }) => {
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [analytics, setAnalytics] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [errorLogs, setErrorLogs] = useState([]);
  const [performanceData, setPerformanceData] = useState(null);
  const [orderFilter, setOrderFilter] = useState("all");
  const [productSearch, setProductSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isClearingLogs, setIsClearingLogs] = useState(false);
  const [isClearingPerformance, setIsClearingPerformance] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productForm, setProductForm] = useState({
    name: "",
    categoryId: "electronics",
    price: 199.99,
    originalPrice: 249.99,
    stock: 25,
    shortDescription: "",
    description: "",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    featured: false
  });
  useEffect(() => {
    if (!authLoading && user?.role === "admin") {
      loadAllData();
    }
  }, [authLoading, user]);
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [analyticsData, productsRes, categoriesData, ordersData, logsData, perfData] = await Promise.all([
        api.getAdminAnalytics().catch(() => null),
        api.getProducts({ limit: 100 }),
        api.getCategories(),
        api.getAdminOrders().catch(() => []),
        api.getErrorLogs().catch(() => []),
        api.getAdminPerformance().catch(() => null)
      ]);
      if (analyticsData) setAnalytics(analyticsData);
      setProducts(productsRes.items);
      setCategories(categoriesData);
      setOrders(ordersData);
      if (Array.isArray(logsData)) setErrorLogs(logsData);
      if (perfData) setPerformanceData(perfData);
    } catch (err) {
      showToast(err.message || "Admin authorization required", "error");
    } finally {
      setIsLoading(false);
    }
  };
  const handleClearLogs = async () => {
    if (!window.confirm("Clear all recorded client runtime error logs?")) return;
    try {
      setIsClearingLogs(true);
      await api.clearErrorLogs();
      setErrorLogs([]);
      showToast("Client error telemetry logs cleared", "success");
    } catch (err) {
      showToast(err.message || "Failed to clear error logs", "error");
    } finally {
      setIsClearingLogs(false);
    }
  };
  const handleClearPerformance = async () => {
    if (!window.confirm("Reset all recorded web vitals and performance telemetry metrics?")) return;
    try {
      setIsClearingPerformance(true);
      await api.clearAdminPerformance();
      const updated = await api.getAdminPerformance().catch(() => null);
      setPerformanceData(updated);
      showToast("Performance metrics telemetry reset", "success");
    } catch (err) {
      showToast(err.message || "Failed to clear performance metrics", "error");
    } finally {
      setIsClearingPerformance(false);
    }
  };
  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await api.updateOrderStatus(orderId, status);
      showToast(`Order #${orderId} status changed to ${status}`, "success");
      loadAllData();
    } catch (err) {
      showToast(err.message || "Failed to update order", "error");
    }
  };
  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.deleteProduct(id);
      showToast(`Product "${name}" deleted`, "success");
      loadAllData();
    } catch (err) {
      showToast(err.message || "Failed to delete product", "error");
    }
  };
  const handleOpenCreateProduct = () => {
    setEditingProductId(null);
    setProductForm({
      name: "",
      categoryId: categories[0]?.id || "electronics",
      price: 99.99,
      originalPrice: 129.99,
      stock: 30,
      shortDescription: "",
      description: "",
      image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80",
      featured: false
    });
    setIsProductModalOpen(true);
  };
  const handleOpenEditProduct = (prod) => {
    setEditingProductId(prod.id);
    setProductForm({
      name: prod.name,
      categoryId: prod.categoryId,
      price: prod.price,
      originalPrice: prod.originalPrice || prod.price,
      stock: prod.stock,
      shortDescription: prod.shortDescription,
      description: prod.description,
      image: prod.images[0] || "",
      featured: !!prod.featured
    });
    setIsProductModalOpen(true);
  };
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingProductId) {
        await api.updateProduct(editingProductId, {
          ...productForm,
          images: [productForm.image]
        });
        showToast("Product updated successfully!", "success");
      } else {
        await api.createProduct({
          ...productForm,
          images: [productForm.image],
          specs: { "Origin": "Handcrafted", "Warranty": "2 Years" }
        });
        showToast("New product created!", "success");
      }
      setIsProductModalOpen(false);
      loadAllData();
    } catch (err) {
      showToast(err.message || "Failed to save product", "error");
    }
  };
  const handleResetDatabase = async () => {
    if (!window.confirm("Reset the database to initial factory seed items & orders?")) return;
    try {
      const res = await api.resetDatabase();
      showToast(res.message, "success");
      loadAllData();
    } catch (err) {
      showToast(err.message || "Failed to reset", "error");
    }
  };
  const filteredOrders = orderFilter === "all" ? orders : orders.filter((o) => (o.orderStatus || o.status) === orderFilter);
  const filteredProducts = products.filter(
    (p) => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.categoryName?.toLowerCase().includes(productSearch.toLowerCase())
  );
  if (isLoading) {
    return <AdminDashboardSkeleton />;
  }

  // ── Admin access guard ──────────────────────────────────────────────────
  // Placed after all hooks so React hook order is never broken.
  // Non-admin users see an access-denied screen instead of a broken dashboard.
  if (user?.role !== "admin") {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100 shadow-sm">
          <ShieldOff className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Access Denied</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            You are signed in as {user.email} ({user.role}), but the Store Admin Dashboard requires administrator privileges.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigate("account")}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Go to My Account
          </button>
          <button
            type="button"
            onClick={() => onNavigate("home")}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer border border-slate-200"
          >
            Browse Store
          </button>
        </div>
      </div>
    );
  }

  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {
    /* Dashboard Top Header */
  }
      <div className="bg-slate-900 rounded-xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-md border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-bold rounded border border-blue-500/30 uppercase tracking-tight">
              Admin Control Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Store Operations & Dispatch
          </h1>
          <p className="text-xs text-slate-400">
            Real-time telemetry, product inventory catalog management, and order fulfillment.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
    onClick={() => onNavigate("tests")}
    className="px-4 py-2 bg-green-950/80 hover:bg-green-900 text-green-300 border border-green-800/80 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
  >
            <Check className="w-4 h-4" /> Run Automated Tests
          </button>
          <button
    onClick={handleResetDatabase}
    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
    title="Reset to initial seed state"
  >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Demo DB
          </button>
        </div>
      </div>

      {
    /* KPI Cards Grid */
  }
      {analytics && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-tight">Total Gross Revenue</span>
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              ${analytics.totalRevenue?.toFixed(2) || "0.00"}
            </div>
            <p className="text-[11px] text-green-600 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Live store earnings
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-tight">Total Orders</span>
              <Package className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {analytics.totalOrders || 0}
            </div>
            <p className="text-[11px] text-slate-500">
              {analytics.statusBreakdown?.delivered || 0} fulfilled & delivered
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-tight">Catalog Products</span>
              <Layers className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {analytics.totalProducts || products.length}
            </div>
            <p className="text-[11px] text-slate-500">
              Across {categories.length} active departments
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-tight">Low Stock Warnings</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-600">
              {analytics.lowStockCount || 0}
            </div>
            <p className="text-[11px] text-amber-700 font-medium">
              Items with &le; 5 units left
            </p>
          </div>
        </div>}

      {
    /* Tabs */
  }
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold">
        <button
    onClick={() => setActiveTab("overview")}
    className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${activeTab === "overview" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-900"}`}
  >
          <TrendingUp className="w-4 h-4" /> Overview & Trends
        </button>
        <button
    onClick={() => setActiveTab("products")}
    className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${activeTab === "products" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-900"}`}
  >
          <Package className="w-4 h-4" /> Products Inventory ({products.length})
        </button>
        <button
    onClick={() => setActiveTab("orders")}
    className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${activeTab === "orders" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-900"}`}
  >
          <Clock className="w-4 h-4" /> Order Dispatch ({orders.length})
        </button>
        <button
    onClick={() => setActiveTab("logs")}
    className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${activeTab === "logs" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-900"}`}
  >
          <Bug className="w-4 h-4" /> Error Telemetry ({errorLogs.length})
        </button>
        <button
    onClick={() => setActiveTab("performance")}
    className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${activeTab === "performance" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-900"}`}
  >
          <Gauge className="w-4 h-4" /> Web Vitals & Performance
          {performanceData && <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded-full">
              {performanceData.totalRecordings}
            </span>}
        </button>
      </div>

      {
    /* TAB 1: OVERVIEW */
  }
      {activeTab === "overview" && analytics && <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {
    /* Order Status Distribution */
  }
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-bold text-slate-900">Order Fulfillment Funnel</h3>
            <div className="space-y-3">
              {[
    { label: "Pending Processing", key: "pending", color: "bg-amber-500" },
    { label: "In Packaging (Processing)", key: "processing", color: "bg-blue-500" },
    { label: "In Transit (Shipped)", key: "shipped", color: "bg-sky-500" },
    { label: "Completed (Delivered)", key: "delivered", color: "bg-green-500" },
    { label: "Cancelled / Refunded", key: "cancelled", color: "bg-rose-500" }
  ].map((st) => {
    const count = analytics.statusBreakdown?.[st.key] || 0;
    const percent = analytics.totalOrders ? count / analytics.totalOrders * 100 : 0;
    return <div key={st.key} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{st.label}</span>
                      <span>{count} orders ({Math.round(percent)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${st.color} rounded-full`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>;
  })}
            </div>
          </div>

          {
    /* Low Stock Alerts */
  }
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Low Stock Priority Restock</h3>
              <span className="text-xs text-amber-600 font-bold">Action Needed</span>
            </div>

            <div className="divide-y divide-slate-100">
              {products.filter((p) => p.stock <= 5).map((p) => <div key={p.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={p.images[0]} alt="" className="w-10 h-10 object-contain rounded bg-slate-50 p-1" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{p.name}</p>
                      <p className="text-[11px] text-slate-500">${p.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                    {p.stock} units left
                  </span>
                </div>)}
            </div>
          </div>
        </div>}

      {
    /* TAB 2: PRODUCTS INVENTORY */
  }
      {activeTab === "products" && <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {
    /* Search Input */
  }
            <div className="relative w-full sm:w-72">
              <input
    type="text"
    placeholder="Search products..."
    value={productSearch}
    onChange={(e) => setProductSearch(e.target.value)}
    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
  />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <button
    onClick={handleOpenCreateProduct}
    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
  >
              <Plus className="w-4 h-4" /> Add New Product
            </button>
          </div>

          {
    /* Table */
  }
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-900 uppercase font-bold text-[10px] tracking-tight border-b border-slate-200">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Stock Level</th>
                  <th className="p-3">Rating</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img src={p.images[0]} alt="" className="w-10 h-10 object-contain rounded bg-slate-50 shrink-0 p-1" />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate max-w-xs">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-blue-700">{p.categoryName || p.categoryId}</td>
                    <td className="p-3 font-bold text-slate-900">${p.price.toFixed(2)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${p.stock > 5 ? "bg-green-50 text-green-700" : "bg-rose-50 text-rose-700"}`}>
                        {p.stock} in stock
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-amber-600">★ {p.rating.toFixed(1)}</td>
                    <td className="p-3 text-right space-x-2">
                      <button
    onClick={() => handleOpenEditProduct(p)}
    className="p-1.5 text-slate-500 hover:text-blue-600 rounded hover:bg-blue-50 cursor-pointer"
    title="Edit Product"
  >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
    onClick={() => handleDeleteProduct(p.id, p.name)}
    className="p-1.5 text-slate-500 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
    title="Delete Product"
  >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>}

      {
    /* TAB 3: ORDER DISPATCH */
  }
      {activeTab === "orders" && <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-xs">
          {
    /* Filter pill bar */
  }
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {["all", "pending", "processing", "shipped", "delivered", "cancelled"].map((st) => <button
    key={st}
    onClick={() => setOrderFilter(st)}
    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${orderFilter === st ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
  >
                {st}
              </button>)}
          </div>

          <div className="space-y-4">
            {filteredOrders.length === 0 ? <div className="p-8 text-center text-xs text-slate-400">
                No orders in "{orderFilter}" status.
              </div> : filteredOrders.map((order) => <div
    key={order.id}
    className="bg-slate-50 rounded-xl border border-slate-200 p-4 sm:p-5 space-y-3"
  >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-900">Order #{order.id}</span>
                        <span className="text-xs font-semibold text-slate-600">• Customer: {order.customerName}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {order.customerEmail} • Placed {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-900">${order.total.toFixed(2)}</span>
                      <select
    value={order.orderStatus || order.status}
    onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800 outline-none"
  >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  {
    /* Items */
  }
                  <div className="text-xs text-slate-600">
                    <p className="font-semibold text-slate-700">Items:</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {order.items.map((item) => <span key={item.productId} className="bg-white border border-slate-200 rounded px-2 py-1 text-[11px]">
                          {item.quantity}x {item.productName} (${item.price.toFixed(2)})
                        </span>)}
                    </div>
                  </div>

                  {
    /* Shipping */
  }
                  <div className="text-[11px] text-slate-500 flex flex-wrap justify-between gap-2 pt-1">
                    <span>
                      Ship to: {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                    </span>
                    {order.trackingNumber && <span className="font-mono text-blue-600 font-semibold">Tracking: {order.trackingNumber}</span>}
                  </div>
                </div>)}
          </div>
        </div>}

      {
    /* TAB 4: ERROR LOGS TELEMETRY */
  }
      {activeTab === "logs" && <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-slate-700" />
                <h3 className="text-base font-bold text-slate-900">Client Runtime Error Telemetry</h3>
              </div>
              <p className="text-xs text-slate-500 max-w-xl">
                Real-time diagnostic records transmitted by client-side Error Boundaries and window error listeners. Use these traces to triage exceptions and unhandled promise rejections.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
    onClick={loadAllData}
    disabled={isLoading}
    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
  >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh
              </button>
              {errorLogs.length > 0 && <button
    onClick={handleClearLogs}
    disabled={isClearingLogs}
    className="px-3.5 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
  >
                  <Trash2 className="w-3.5 h-3.5" /> Clear All Logs
                </button>}
            </div>
          </div>

          {errorLogs.length === 0 ? <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
              <Check className="w-12 h-12 text-emerald-500 mx-auto p-2 bg-emerald-50 rounded-full" />
              <h4 className="text-sm font-bold text-slate-900">No Runtime Errors Recorded</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                All client subsystems and API communication pipelines are operating normally with zero captured unhandled exceptions.
              </p>
            </div> : <div className="space-y-4">
              {errorLogs.map((log) => <div
    key={log.id}
    className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs"
  >
                  <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                        <Bug className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 font-mono break-all">{log.message}</h4>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                          <span>Logged: {new Date(log.timestamp).toLocaleString()}</span>
                          {log.url && <span>• Path: {log.url}</span>}
                          {log.userId && <span>• User: {log.userId}</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 space-y-4 text-xs font-mono">
                    {log.stack && <div className="space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-sans">
                          Stack Trace
                        </span>
                        <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto text-[11px] leading-relaxed max-h-48 scrollbar-thin">
                          {log.stack}
                        </pre>
                      </div>}

                    {log.componentStack && <div className="space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-sans">
                          React Component Stack
                        </span>
                        <pre className="p-3 bg-slate-950 text-indigo-200 rounded-lg overflow-x-auto text-[11px] leading-relaxed max-h-48 scrollbar-thin">
                          {log.componentStack}
                        </pre>
                      </div>}

                    {log.userAgent && <div className="text-[11px] text-slate-500 font-sans">
                        <span className="font-semibold text-slate-700">Client Agent: </span>
                        <span className="font-mono">{log.userAgent}</span>
                      </div>}
                  </div>
                </div>)}
            </div>}
        </div>}

      {
    /* TAB 5: WEB VITALS & PERFORMANCE */
  }
      {activeTab === "performance" && <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Gauge className="w-5 h-5 text-blue-600" />
                Real-Time Core Web Vitals & Performance Telemetry
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Live metrics captured from user sessions and Core Web Vitals PerformanceObserver telemetry
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
    onClick={loadAllData}
    disabled={isLoading}
    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
  >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
    onClick={handleClearPerformance}
    disabled={isClearingPerformance || !performanceData || performanceData.totalRecordings === 0}
    className="px-3.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
  >
                <Trash2 className="w-3.5 h-3.5" />
                Reset Telemetry
              </button>
            </div>
          </div>

          {!performanceData || performanceData.totalRecordings === 0 ? <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Activity className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">No Performance Telemetry Recorded Yet</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                As users and browsers navigate the store, page load times, LCP, CLS, TTFB, and route transition durations will automatically appear here.
              </p>
            </div> : <>
              {
    /* D3-Powered Web Vitals & Load Time Telemetry Visualizer */
  }
              <WebVitalsD3Dashboard data={performanceData} onRefresh={loadAllData} />

              {
    /* Web Vitals KPI Cards */
  }
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {
    /* LCP Card */
  }
                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-bold uppercase tracking-tight">Largest Contentful Paint</span>
                    <span
    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${performanceData.statusOverview.lcpStatus === "good" ? "bg-emerald-100 text-emerald-800" : performanceData.statusOverview.lcpStatus === "needs_improvement" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"}`}
  >
                      {performanceData.statusOverview.lcpStatus.replace("_", " ")}
                    </span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-slate-900">
                    {performanceData.avgLCP} <span className="text-xs font-normal text-slate-500 font-sans">ms</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Target: &le; 2,500ms (Good)
                  </p>
                </div>

                {
    /* CLS Card */
  }
                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-bold uppercase tracking-tight">Cumulative Layout Shift</span>
                    <span
    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${performanceData.statusOverview.clsStatus === "good" ? "bg-emerald-100 text-emerald-800" : performanceData.statusOverview.clsStatus === "needs_improvement" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"}`}
  >
                      {performanceData.statusOverview.clsStatus.replace("_", " ")}
                    </span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-slate-900">
                    {performanceData.avgCLS.toFixed(3)}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Target: &le; 0.100 (Good)
                  </p>
                </div>

                {
    /* TTFB Card */
  }
                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-bold uppercase tracking-tight">Time To First Byte</span>
                    <span
    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${performanceData.statusOverview.ttfbStatus === "good" ? "bg-emerald-100 text-emerald-800" : performanceData.statusOverview.ttfbStatus === "needs_improvement" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"}`}
  >
                      {performanceData.statusOverview.ttfbStatus.replace("_", " ")}
                    </span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-slate-900">
                    {performanceData.avgTTFB} <span className="text-xs font-normal text-slate-500 font-sans">ms</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Target: &le; 800ms (Good)
                  </p>
                </div>

                {
    /* Page Load Time Card */
  }
                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-bold uppercase tracking-tight">Avg Page Load Time</span>
                    <Zap className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-slate-900">
                    {performanceData.avgPageLoadTime} <span className="text-xs font-normal text-slate-500 font-sans">ms</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    From navigation start to load complete
                  </p>
                </div>
              </div>

              {
    /* Route Latency Breakdown */
  }
              {performanceData.routeTimings.length > 0 && <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
                  <h4 className="text-sm font-bold text-slate-900">Client Route Transition Times</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {performanceData.routeTimings.map((rt) => <div key={rt.route} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                        <div className="text-xs font-bold text-slate-800 truncate">{rt.route}</div>
                        <div className="text-lg font-bold font-mono text-blue-600">
                          {rt.avgDurationMs} <span className="text-xs font-normal text-slate-500 font-sans">ms</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{rt.samples} sample(s)</div>
                      </div>)}
                  </div>
                </div>}

              {
    /* Telemetry Trace Recordings */
  }
              <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">Recent Session Metrics Log</h4>
                  <span className="text-xs text-slate-500 font-medium">
                    Showing latest {performanceData.recentMetrics.length} trace records
                  </span>
                </div>

                <div className="divide-y divide-slate-100 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-100 pb-2">
                        <th className="pb-2 font-medium">Timestamp</th>
                        <th className="pb-2 font-medium">View / Route</th>
                        <th className="pb-2 font-medium">Load Time</th>
                        <th className="pb-2 font-medium">TTFB</th>
                        <th className="pb-2 font-medium">FCP</th>
                        <th className="pb-2 font-medium">LCP</th>
                        <th className="pb-2 font-medium">CLS</th>
                        <th className="pb-2 font-medium">Network</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {performanceData.recentMetrics.map((m) => <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 text-slate-500 font-mono text-[11px]">
                            {new Date(m.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="py-2.5 font-semibold text-slate-800 font-mono text-[11px]">
                            {m.viewName || m.url}
                          </td>
                          <td className="py-2.5 font-mono text-slate-700">
                            {m.pageLoadTime ? `${m.pageLoadTime}ms` : "\u2014"}
                          </td>
                          <td className="py-2.5 font-mono text-slate-700">
                            {m.ttfb ? `${m.ttfb}ms` : "\u2014"}
                          </td>
                          <td className="py-2.5 font-mono text-slate-700">
                            {m.fcp ? `${m.fcp}ms` : "\u2014"}
                          </td>
                          <td className="py-2.5 font-mono text-slate-700">
                            {m.lcp ? `${m.lcp}ms` : "\u2014"}
                          </td>
                          <td className="py-2.5 font-mono text-slate-700">
                            {m.cls !== void 0 ? m.cls.toFixed(3) : "\u2014"}
                          </td>
                          <td className="py-2.5 text-slate-500 uppercase text-[10px]">
                            {m.effectiveConnectionType || "4G"}
                          </td>
                        </tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            </>}
        </div>}
      {isProductModalOpen && <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingProductId ? "Edit Product" : "Create New Product"}
              </h3>
              <button
    onClick={() => setIsProductModalOpen(false)}
    className="p-1.5 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
  >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Product Title</label>
                <input
    type="text"
    required
    value={productForm.name}
    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
    placeholder="e.g. Apex Ultra Headphones"
    className="w-full px-3.5 py-2 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
  />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Department</label>
                  <select
    value={productForm.categoryId}
    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
    className="w-full px-3 py-2 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none font-medium"
  >
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Inventory Stock</label>
                  <input
    type="number"
    min={0}
    required
    value={productForm.stock}
    onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
    className="w-full px-3.5 py-2 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Sale Price ($)</label>
                  <input
    type="number"
    step="0.01"
    min={1}
    required
    value={productForm.price}
    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
    className="w-full px-3.5 py-2 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Original / MSRP ($)</label>
                  <input
    type="number"
    step="0.01"
    min={1}
    value={productForm.originalPrice}
    onChange={(e) => setProductForm({ ...productForm, originalPrice: Number(e.target.value) })}
    className="w-full px-3.5 py-2 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Image URL</label>
                <input
    type="url"
    required
    value={productForm.image}
    onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
    placeholder="https://images.unsplash.com/..."
    className="w-full px-3.5 py-2 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none font-mono"
  />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Short Description</label>
                <input
    type="text"
    required
    value={productForm.shortDescription}
    onChange={(e) => setProductForm({ ...productForm, shortDescription: e.target.value })}
    placeholder="1-sentence summary"
    className="w-full px-3.5 py-2 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
  />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Full Description</label>
                <textarea
    rows={3}
    required
    value={productForm.description}
    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
    className="w-full px-3.5 py-2 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
  />
              </div>

              <div className="flex items-center gap-2">
                <input
    type="checkbox"
    id="featured-checkbox"
    checked={productForm.featured}
    onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })}
    className="w-4 h-4 rounded text-blue-600"
  />
                <label htmlFor="featured-checkbox" className="text-xs font-semibold text-slate-700">
                  Feature on store homepage spotlight banner
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
    type="button"
    onClick={() => setIsProductModalOpen(false)}
    className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
  >
                  Cancel
                </button>
                <button
    type="submit"
    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
  >
                  <Save className="w-3.5 h-3.5" /> Save Product
                </button>
              </div>
            </form>
          </div>
        </div>}
    </div>;
};
export {
  AdminDashboardPage
};
