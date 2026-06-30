"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { useAuth } from "@/app/context/AuthContext";
import { saveOrder, generateOTP, getStoreSettingsMap, getDukandarProfile, decrementProductStock, type Order, type PaymentMethod } from "@/lib/data";
import { playClickSound } from "@/lib/sounds";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px", borderRadius: 12,
  border: "1px solid var(--color-border)", background: "white",
  fontSize: 14, outline: "none", fontWeight: 600,
  transition: "border-color 0.2s, box-shadow 0.2s",
};

const steps = [
  { key: "address", label: "Address" },
  { key: "payment", label: "Payment" },
  { key: "confirm", label: "Confirm" },
];

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
  const [step, setStep] = React.useState(0);

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
        <div className="checkout-topbar glass-strong">
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
          <Link href="/" className="btn-premium btn-premium-primary">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="checkout-container">
        <div className="checkout-topbar glass-strong">
          <Link href="/" className="pdp-back-btn" aria-label="Go back"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><polyline points="12 19 5 12 12 5" /></svg></Link>
          <h2>Checkout</h2>
          <div style={{ width: 22 }} />
        </div>
        <div className="checkout-pending-msg">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
          <h3>Account Rejected</h3>
          <p>Your account has been rejected by the platform owner. You cannot place orders.</p>
          <Link href="/" className="btn-premium btn-premium-primary">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="checkout-container">
        <div className="checkout-topbar glass-strong">
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
          <Link href="/" className="btn-premium btn-premium-primary">Continue Shopping</Link>
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

  const canProceedToPayment = canPlace && step === 0;
  const canProceedToConfirm = step === 1;

  const handlePlaceOrder = async () => {
    if (!canPlace || items.length === 0) return;
    setPlacing(true);
    setOrderError("");

    // Get user's location
    let latitude: number | undefined;
    let longitude: number | undefined;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, enableHighAccuracy: true });
      });
      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;
    } catch {
      // Location permission denied or unavailable
    }

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
      buyerLatitude: latitude,
      buyerLongitude: longitude,
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
    <div className="checkout-container page-slide-enter">
      <div className="checkout-topbar glass-strong">
        <Link href="/cart" className="pdp-back-btn" aria-label="Go back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <h2>Checkout</h2>
        <div style={{ width: 22 }} />
      </div>

      {/* Stepped Progress */}
      <div style={{ display: "flex", alignItems: "center", padding: "16px 16px 0", gap: 0 }}>
        {steps.map((s, i) => (
          <React.Fragment key={s.key}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 900,
                background: i <= step ? "var(--color-primary)" : "var(--color-border)",
                color: i <= step ? "white" : "var(--color-text-muted)",
                transition: "all 0.3s var(--ease-out)",
              }}>
                {i < step ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : i + 1}
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, marginTop: 4, color: i <= step ? "var(--color-primary)" : "var(--color-text-muted)" }}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < step ? "var(--color-primary)" : "var(--color-border)", borderRadius: 1, margin: "0 4px", marginTop: -16 }} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="checkout-body">
        {/* Step 1: Address */}
        {step === 0 && (
          <div className="fade-in" style={{ width: "100%" }}>
            <div className="checkout-section glass-card">
              <h3>Delivery Address</h3>

              <div className="checkout-field">
                <label>Full Name</label>
                <input value={form.fullName} onChange={(e) => handleChange("fullName", e.target.value)} placeholder="Your name" style={inputStyle} />
              </div>

              <div className="checkout-field">
                <label>Phone</label>
                <input value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="10-digit mobile number" inputMode="tel" style={inputStyle} />
              </div>

              <div className="checkout-row2">
                <div className="checkout-field">
                  <label>Pincode</label>
                  <input value={form.pincode} onChange={(e) => handleChange("pincode", e.target.value)} placeholder="Pincode" inputMode="numeric" style={inputStyle} />
                </div>
                <div className="checkout-field">
                  <label>City</label>
                  <input value={form.city} onChange={(e) => handleChange("city", e.target.value)} placeholder="City" style={inputStyle} />
                </div>
              </div>

              <div className="checkout-field">
                <label>Address</label>
                <textarea value={form.addressLine} onChange={(e) => handleChange("addressLine", e.target.value)} placeholder="House no, street, area" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              </div>

              <div className="checkout-field">
                <label>State</label>
                <input value={form.state} onChange={(e) => handleChange("state", e.target.value)} placeholder="State" style={inputStyle} />
              </div>

              <button
                className="btn-premium btn-premium-primary"
                style={{ width: "100%", marginTop: 8, opacity: canProceedToPayment ? 1 : 0.5 }}
                disabled={!canProceedToPayment}
                onClick={() => { playClickSound(); setStep(1); }}
              >
                Continue to Payment
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 1 && (
          <div className="fade-in" style={{ width: "100%" }}>
            <div className="checkout-section glass-card">
              <h3>Payment Method</h3>
              <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", border: `2px solid ${paymentMethod === "cod" ? "var(--color-primary)" : "var(--color-border)"}`, borderRadius: 12, cursor: "pointer", background: paymentMethod === "cod" ? "var(--color-primary-lighter)" : "white", transition: "all 0.2s" }}>
                  <input type="radio" name="payment" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} style={{ accentColor: "var(--color-primary)", width: 18, height: 18 }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>Cash on Delivery</div>
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 600 }}>Pay with cash when your order is delivered</div>
                  </div>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", border: `2px solid ${paymentMethod === "upi" ? "var(--color-primary)" : "var(--color-border)"}`, borderRadius: 12, cursor: "pointer", background: paymentMethod === "upi" ? "var(--color-primary-lighter)" : "white", transition: "all 0.2s" }}>
                  <input type="radio" name="payment" checked={paymentMethod === "upi"} onChange={() => setPaymentMethod("upi")} style={{ accentColor: "var(--color-primary)", width: 18, height: 18 }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>UPI / Online Payment</div>
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 600 }}>Pay via UPI, Card, or Net Banking</div>
                  </div>
                </label>
              </div>

              {paymentMethod === "upi" && Object.keys(upiSellers).length > 0 && (
                <div className="fade-in" style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 10 }}>Pay to these sellers:</div>
                  {Object.entries(upiSellers).map(([mobile, info]) => (
                    <div key={mobile} style={{ background: "var(--color-primary-lighter)", border: "1px solid #bbf7d0", borderRadius: 12, padding: 14, marginBottom: 10 }}>
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

              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button className="btn-premium btn-premium-ghost" style={{ flex: 1 }} onClick={() => { playClickSound(); setStep(0); }}>Back</button>
                <button className="btn-premium btn-premium-primary" style={{ flex: 1 }} onClick={() => { playClickSound(); setStep(2); }}>Review Order</button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 2 && (
          <div className="fade-in" style={{ width: "100%" }}>
            <div className="checkout-section glass-card">
              <h3>Order Summary</h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                {items.map((item) => (
                  <div key={item.product.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <img src={item.product.img} alt={item.product.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", background: "#f3f4f6" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{item.product.name}</div>
                      <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>₹{item.product.price} x {item.quantity}</div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>₹{item.product.price * item.quantity}</div>
                  </div>
                ))}
              </div>

              <div className="checkout-divider" />
              <div className="checkout-summary-row"><span>Items ({totalItems})</span><span>₹{subtotal}</span></div>
              <div className="checkout-summary-row"><span>Delivery</span><span className="checkout-free">FREE</span></div>
              <div className="checkout-divider" />
              <div className="checkout-summary-row checkout-summary-total"><span>Total</span><span>₹{totalPrice}</span></div>

              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button className="btn-premium btn-premium-ghost" style={{ flex: 1 }} onClick={() => { playClickSound(); setStep(1); }}>Back</button>
                <button className="btn-premium btn-premium-primary" style={{ flex: 1 }} onClick={() => { playClickSound(); setStep(0); }}>Edit Address</button>
              </div>

              {orderError && (
                <div style={{ background: "var(--color-danger-light)", color: "#991b1b", borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 700, marginTop: 12, textAlign: "center" }}>
                  {orderError}
                </div>
              )}

              <button
                className="btn-premium btn-premium-primary"
                style={{ width: "100%", marginTop: 16, opacity: placing ? 0.6 : 1, cursor: placing ? "not-allowed" : "pointer" }}
                disabled={!canPlace || placing}
                onClick={() => { playClickSound(); handlePlaceOrder(); }}
              >
                {placing ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                    <span className="spinner" /> Placing Order...
                  </span>
                ) : "Confirm & Place Order"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}
