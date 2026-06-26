"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { useAuth } from "@/app/context/AuthContext";
import { saveOrder, generateOTP, getStoreSettingsMap, getDukandarProfile, decrementProductStock, type Order, type PaymentMethod } from "@/lib/data";
import { playClickSound } from "@/lib/sounds";

export default function CheckoutPage() {
  const router = useRouter();
  const { loggedIn, role, status, mobile } = useAuth();
  const { items, totalItems, totalPrice, clearCart } = useCart();

  const [form, setForm] = React.useState({
    fullName: "",
    phone: "",
    pincode: "",
    addressLine: "",
    city: "",
    state: "",
  });

  const [dukanName, setDukanName] = React.useState("");
  const [dukanPhoto, setDukanPhoto] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("cod");
  const [upiSellers, setUpiSellers] = React.useState<Record<string, { upiId: string; upiQr: string; storeName: string }>>({});
  const [placing, setPlacing] = React.useState(false);
  const [orderId, setOrderId] = React.useState<string | null>(null);
  const [orderError, setOrderError] = React.useState("");

  React.useEffect(() => {
    if (!loggedIn) router.replace("/login");
  }, [loggedIn, router]);

  React.useEffect(() => {
    if (!mobile) return;
    getDukandarProfile(mobile).then((profile) => {
      if (profile) {
        setForm((prev) => ({
          ...prev,
          fullName: profile.name || prev.fullName,
          addressLine: profile.address || prev.addressLine,
          pincode: profile.pincode || prev.pincode,
        }));
        setDukanName(profile.dukanName);
        setDukanPhoto(profile.photo);
      }
    });
  }, [mobile]);

  React.useEffect(() => {
    if (mobile) {
      setForm((prev) => ({ ...prev, phone: mobile }));
    }
  }, [mobile]);

  React.useEffect(() => {
    if (items.length === 0) {
      router.replace("/cart");
    }
  }, [items.length, router]);

  React.useEffect(() => {
    if (paymentMethod !== "upi") return;
    const mobiles = items.map((ci) => (ci.product as any).sellerMobile).filter(Boolean);
    if (mobiles.length === 0) return;
    getStoreSettingsMap(mobiles).then(setUpiSellers);
  }, [paymentMethod, items]);

  if (!loggedIn) return null;

  if (role !== "dukandar") {
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
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <h3>Only Dukandar Can Purchase</h3>
          <p>{role === "seller" ? "You are registered as a Seller. Sellers can only sell products, not purchase them." : "Only Dukandar (buyer) accounts can place orders."}</p>
          <Link href="/" className="checkout-cta">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="checkout-container">
        <div className="checkout-topbar">
          <Link href="/" className="pdp-back-btn" aria-label="Go back"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><polyline points="12 19 5 12 12 5" /></svg></Link>
          <h2>Checkout</h2>
          <div style={{ width: 22 }} />
        </div>
        <div className="checkout-pending-msg">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
          <h3>Account Rejected</h3>
          <p>Your account has been rejected by the platform owner. You cannot place orders.</p>
          <Link href="/" className="checkout-cta">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  if (status === "pending") {
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
    setOrderError("");

    const id = crypto.randomUUID();
    const otp = generateOTP();

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
      buyerDukanName: dukanName,
      buyerPhone: form.phone.trim(),
      buyerAddress: form.addressLine.trim(),
      buyerCity: form.city.trim(),
      buyerState: form.state.trim(),
      buyerPincode: form.pincode.trim(),
      buyerPhoto: dukanPhoto,
      total: totalPrice,
      status: "pending",
      paymentMethod,
      otp,
      createdAt: new Date().toISOString(),
    };

    const ok = await saveOrder(order);
    if (!ok) {
      setOrderError("Order save failed. Please check database migration (add payment_method & otp columns to orders table).");
      setPlacing(false);
      return;
    }

    for (const item of order.items) {
      if (item.sellerMobile) {
        await decrementProductStock(item.productId, item.quantity);
      }
    }

    setOrderId(id);
    clearCart();
  };

  React.useEffect(() => {
    if (!orderId) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
    } catch {}
    const timer = setTimeout(() => router.replace("/my-orders"), 2000);
    return () => clearTimeout(timer);
  }, [orderId, router]);

  if (items.length === 0) return null;

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

        <div className="checkout-section">
          <h3>Payment Method</h3>
          <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", border: `2px solid ${paymentMethod === "cod" ? "var(--color-primary)" : "var(--color-border)"}`, borderRadius: 10, cursor: "pointer", background: paymentMethod === "cod" ? "#f0fdf4" : "white" }}>
              <input type="radio" name="payment" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} style={{ accentColor: "var(--color-primary)" }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>Cash on Delivery</div>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 700 }}>Pay with cash when your order is delivered</div>
              </div>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", border: `2px solid ${paymentMethod === "upi" ? "var(--color-primary)" : "var(--color-border)"}`, borderRadius: 10, cursor: "pointer", background: paymentMethod === "upi" ? "#f0fdf4" : "white" }}>
              <input type="radio" name="payment" checked={paymentMethod === "upi"} onChange={() => setPaymentMethod("upi")} style={{ accentColor: "var(--color-primary)" }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>UPI / Online Payment</div>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 700 }}>Pay via UPI, Card, or Net Banking</div>
              </div>
            </label>
          </div>

          {paymentMethod === "upi" && Object.keys(upiSellers).length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 10 }}>Pay to these sellers:</div>
              {Object.entries(upiSellers).map(([mobile, info]) => (
                <div key={mobile} style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: 14, marginBottom: 10 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>{info.storeName}</div>
                  <div style={{ fontSize: 13, color: "var(--color-text-secondary)", fontWeight: 700 }}>UPI ID: <strong style={{ color: "#1f2937" }}>{info.upiId || "Not set"}</strong></div>
                  {info.upiQr && (
                    <div style={{ marginTop: 8 }}>
                      <img src={info.upiQr} alt={`${info.storeName} UPI QR`} style={{ width: 140, height: 140, borderRadius: 8, objectFit: "contain", border: "1px solid #bbf7d0" }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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

          {orderError && (
            <div style={{ background: "#fef2f2", color: "#991b1b", borderRadius: 8, padding: 12, fontSize: 13, fontWeight: 700, marginBottom: 10, textAlign: "center" }}>
              {orderError}
            </div>
          )}
          <button
            className="checkout-place-btn"
            disabled={!canPlace || placing}
            onClick={() => { playClickSound(); handlePlaceOrder(); }}
          >
            {placing ? "Placing..." : "Confirm Order"}
          </button>
        </div>
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}
