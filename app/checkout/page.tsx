"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { useAuth } from "@/app/context/AuthContext";
import { saveOrder, type Order } from "@/lib/data";

export default function CheckoutPage() {
  const router = useRouter();
  const { loggedIn, role, status } = useAuth();
  const { items, totalItems, totalPrice, clearCart } = useCart();

  const [form, setForm] = React.useState({
    fullName: "",
    phone: "",
    pincode: "",
    addressLine: "",
    city: "",
    state: "",
  });

  const [placing, setPlacing] = React.useState(false);
  const [orderId, setOrderId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!loggedIn) router.replace("/login");
  }, [loggedIn, router]);

  React.useEffect(() => {
    if (items.length === 0) {
      router.replace("/cart");
    }
  }, [items.length, router]);

  if (!loggedIn) return null;

  if (role === "dukandar" && status === "pending") {
    return (
      <div className="checkout-container">
        <div className="checkout-topbar">
          <Link href="/" className="pdp-back-btn" aria-label="Go back">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <h2>Checkout</h2>
          <div style={{ width: 22 }} />
        </div>
        <div className="checkout-pending-msg">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h3>Approval Required</h3>
          <p>Your account is pending approval from the platform owner. You will be able to place orders once your account is approved.</p>
          <Link href="/" className="checkout-cta">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  const subtotal = items.reduce(
    (s, i) => s + i.product.price * i.quantity,
    0
  );

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canPlace =
    form.fullName.trim() &&
    form.phone.trim().length >= 10 &&
    form.pincode.trim().length >= 6 &&
    form.addressLine.trim();

  const handlePlaceOrder = async () => {
    if (!canPlace || items.length === 0) return;
    setPlacing(true);

    const id = `KB-${Math.floor(100000 + Math.random() * 900000)}`;

    const order: Order = {
      id,
      items: items.map((ci) => ({
        productId: ci.product.id,
        productName: ci.product.name,
        price: ci.product.price,
        quantity: ci.quantity,
        img: ci.product.img,
        sellerMobile: (ci.product as any).sellerMobile || "",
      })),
      buyerName: form.fullName.trim(),
      buyerPhone: form.phone.trim(),
      buyerAddress: form.addressLine.trim(),
      buyerCity: form.city.trim(),
      buyerState: form.state.trim(),
      buyerPincode: form.pincode.trim(),
      total: totalPrice,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    await saveOrder(order);
    setOrderId(id);
    clearCart();
  };

  if (items.length === 0) return null;

  if (orderId) {
    return (
      <div className="checkout-container">
        <div className="checkout-topbar">
          <Link href="/" className="pdp-back-btn" aria-label="Go back">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <h2>Order Placed</h2>
          <div style={{ width: 22 }} />
        </div>

        <div className="checkout-success">
          <div className="checkout-success-badge">✓</div>
          <h3>Your order has been placed successfully.</h3>
          <p>
            Order ID: <strong>{orderId}</strong>
          </p>
          <button
            className="checkout-cta"
            onClick={() => router.push("/")}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-topbar">
        <Link href="/cart" className="pdp-back-btn" aria-label="Go back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <h2>Checkout</h2>
        <div style={{ width: 22 }} />
      </div>

      <div className="checkout-body">
        <div className="checkout-section">
          <h3>Delivery Address</h3>

          <div className="checkout-field">
            <label>Full Name</label>
            <input
              value={form.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="checkout-field">
            <label>Phone</label>
            <input
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="10-digit mobile number"
              inputMode="tel"
            />
          </div>

          <div className="checkout-row2">
            <div className="checkout-field">
              <label>Pincode</label>
              <input
                value={form.pincode}
                onChange={(e) => handleChange("pincode", e.target.value)}
                placeholder="Pincode"
                inputMode="numeric"
              />
            </div>
            <div className="checkout-field">
              <label>City</label>
              <input
                value={form.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="City"
              />
            </div>
          </div>

          <div className="checkout-field">
            <label>Address</label>
            <textarea
              value={form.addressLine}
              onChange={(e) => handleChange("addressLine", e.target.value)}
              placeholder="House no, street, area"
              rows={3}
            />
          </div>

          <div className="checkout-field">
            <label>State</label>
            <input
              value={form.state}
              onChange={(e) => handleChange("state", e.target.value)}
              placeholder="State"
            />
          </div>
        </div>

        <div className="checkout-section checkout-summary">
          <h3>Order Summary</h3>

          <div className="checkout-summary-row">
            <span>Items ({totalItems})</span>
            <span>₹{subtotal}</span>
          </div>

          <div className="checkout-summary-row">
            <span>Delivery</span>
            <span className="checkout-free">FREE</span>
          </div>

          <div className="checkout-divider" />

          <div className="checkout-summary-row checkout-summary-total">
            <span>Total</span>
            <span>₹{totalPrice}</span>
          </div>

          <button
            className="checkout-place-btn"
            disabled={!canPlace || placing}
            onClick={handlePlaceOrder}
          >
            {placing ? "Placing..." : "Confirm Order"}
          </button>
        </div>
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}
