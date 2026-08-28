import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CartPage } from "../pages/CartPage";
import { CheckoutPage } from "../pages/CheckoutPage";
import { OrderConfirmationPage } from "../pages/OrderConfirmationPage";
import { CartProvider } from "../context/CartContext";
import { ToastProvider } from "../context/ToastContext";
import { AuthProvider } from "../context/AuthContext";
import { WishlistProvider } from "../context/WishlistContext";
import { NotificationProvider } from "../context/NotificationContext";
import { api } from "../services/api";

vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}));

const mockProduct = {
  id: 101,
  name: "Pro Wireless Headphones",
  price: 120.0,
  stock: 10,
  images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80"],
  categoryName: "Audio",
};

const mockCart = {
  id: 1,
  items: [
    {
      id: 1,
      productId: 101,
      quantity: 2,
      product: mockProduct,
    },
  ],
  total_items: 2,
  subtotal: 240.0,
  appliedCoupon: null,
};

describe("Cart Management & Promo Code", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders cart items and allows updating quantity and removing items", async () => {
    vi.spyOn(api, "getCart").mockResolvedValue(mockCart);
    vi.spyOn(api, "updateCartItem").mockImplementation(async (id, qty) => ({
      ...mockCart,
      items: [
        {
          ...mockCart.items[0],
          quantity: qty,
        },
      ],
      subtotal: qty * 120.0,
      total_items: qty,
    }));
    vi.spyOn(api, "removeCartItem").mockResolvedValue({
      ...mockCart,
      items: [],
      total_items: 0,
      subtotal: 0,
    });

    render(
      <ToastProvider>
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <CartPage onNavigate={vi.fn()} />
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </ToastProvider>
    );

    // Verify item is displayed
    await waitFor(() => {
      expect(screen.getByText("Pro Wireless Headphones")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    // Test quantity increase
    const plusBtn = screen.getByLabelText("Increase quantity");
    fireEvent.click(plusBtn);
    await waitFor(() => {
      expect(api.updateCartItem).toHaveBeenCalledWith(101, 3);
    });

    // Test remove item
    const removeBtn = screen.getByLabelText("Remove item");
    fireEvent.click(removeBtn);
    await waitFor(() => {
      expect(api.removeCartItem).toHaveBeenCalledWith(101);
    });
  });

  it("applies promotional coupon code and calculates discount", async () => {
    vi.spyOn(api, "getCart").mockResolvedValue(mockCart);
    vi.spyOn(api, "applyCoupon").mockResolvedValue({
      cart: {
        ...mockCart,
        appliedCoupon: {
          code: "SAVE10",
          discountPercent: 10,
        },
      },
      message: 'Promo code "SAVE10" applied!',
    });

    render(
      <ToastProvider>
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <CartPage onNavigate={vi.fn()} />
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Pro Wireless Headphones")).toBeInTheDocument();
    });

    const couponInput = screen.getByPlaceholderText(/Promo code/i);
    fireEvent.change(couponInput, { target: { value: "SAVE10" } });
    const applyBtn = screen.getByRole("button", { name: /^Apply$/i });
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(api.applyCoupon).toHaveBeenCalledWith("SAVE10");
    });
  });
});

describe("Checkout Workflow & Confirmation", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("submits checkout order successfully and triggers confirmation navigation", async () => {
    const onNavigate = vi.fn();
    vi.spyOn(api, "getCart").mockResolvedValue(mockCart);
    vi.spyOn(api, "clearCart").mockResolvedValue({ items: [] });
    vi.spyOn(api, "createOrder").mockResolvedValue({
      order: {
        id: 789,
        customerName: "Alex Johnson",
        customerEmail: "alex@example.com",
        total: 240.0,
        items: mockCart.items,
      },
      id: 789,
    });

    render(
      <ToastProvider>
        <AuthProvider>
          <WishlistProvider>
            <NotificationProvider>
              <CartProvider>
                <CheckoutPage onNavigate={onNavigate} />
              </CartProvider>
            </NotificationProvider>
          </WishlistProvider>
        </AuthProvider>
      </ToastProvider>
    );

    // Step 1: Customer info
    await waitFor(() => {
      expect(screen.getByText(/Customer Information/i)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByPlaceholderText(/Alex Johnson/i), { target: { value: "Alex Johnson" } });
    fireEvent.change(screen.getByPlaceholderText(/alex@example.com/i), { target: { value: "alex@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: /Continue to Shipping/i }));

    // Step 2: Shipping info
    await waitFor(() => {
      expect(screen.getByText(/Shipping Destination/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /Continue to Payment/i }));

    // Step 3: Payment & Place Order
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Payment Method/i })).toBeInTheDocument();
    });
    const placeOrderBtn = screen.getByRole("button", { name: /Place Order/i });
    fireEvent.click(placeOrderBtn);

    await waitFor(() => {
      expect(api.createOrder).toHaveBeenCalled();
      expect(onNavigate).toHaveBeenCalledWith("confirmation", 789);
    });
  });

  it("renders order confirmation page with full details", async () => {
    const mockOrderDetails = {
      id: 789,
      customerName: "Alex Johnson",
      customerEmail: "alex@example.com",
      status: "confirmed",
      total: 240.0,
      subtotal: 240.0,
      shippingFee: 0,
      tax: 19.8,
      discount: 0,
      trackingNumber: "VDR-789000-US",
      createdAt: "2026-08-28T12:00:00Z",
      items: [
        {
          productId: 101,
          productName: "Pro Wireless Headphones",
          price: 120.0,
          quantity: 2,
          productImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
        },
      ],
      shippingAddress: {
        fullName: "Alex Johnson",
        street: "742 Evergreen Terrace",
        city: "Seattle",
        state: "WA",
        postalCode: "98101",
        country: "United States",
        phone: "+1 (555) 438-9102",
      },
    };

    vi.spyOn(api, "getOrderById").mockResolvedValue(mockOrderDetails);
    vi.spyOn(api, "getOrderTracking").mockResolvedValue({
      orderId: 789,
      trackingNumber: "VDR-789000-US",
      status: "confirmed",
      milestones: [],
    });

    render(
      <ToastProvider>
        <OrderConfirmationPage orderId={789} onNavigate={vi.fn()} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Thank you, Alex Johnson!/i)).toBeInTheDocument();
      expect(screen.getByText("789")).toBeInTheDocument();
      expect(screen.getByText("VDR-789000-US")).toBeInTheDocument();
    });
  });
});
