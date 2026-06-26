"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { getOrdersForBuyer, ORDER_STEPS, getOrderProgressIndex, type Order, type OrderStatus } from "@/lib/data";

const statusColors: Record<string, string> = {
  pending: "#fef3c7",
  confirmed: "#e0e7ff",
  shipped: "#dbeafe",
  delivered: "#d1fae5",
  cancelled: "#fef2f2",
};

const statusTextColors: Record<string, string> = {
  pending: "#92400e",
  confirmed: "#3730a3",
  shipped: "#1e40af",
  delivered: "#065f46",
  cancelled: "#991b1b",
};

export default function MyOrdersPage() {
  const { loggedIn, mobile, name, status } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loggedIn) {
      router.replace("/login");
      return;
    }
  }, [loggedIn, router]);

  useEffect(() => {
    if (!loggedIn) return;
    (async () => {
      if (!mobile) return;
      setOrders(await getOrdersForBuyer(mobile));
      setLoading(false);
    })();
  }, [loggedIn, mobile]);

  if (!loggedIn) return null;
  if (status === "rejected") return <RejectedScreen />;

  const totalSpent = orders.reduce((s, o) => s + o.total, 0);
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const pendingCount = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled").length;

  return (
    <div className="auth-layout has-bottom-nav page-slide-enter" style={{ padding: 16 }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <Link href="/" className="btn-premium btn-premium-ghost btn-premium-sm">← Back</Link>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--color-text)", margin: 0 }}>My Orders</h1>
        </div>

        {!loading && orders.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Total Orders", value: orders.length, color: "var(--color-primary-light)", textColor: "var(--color-primary-dark)" },
              { label: "Total Spent", value: `₹${totalSpent}`, color: "#d1fae5", textColor: "#065f46" },
              { label: "Delivered", value: deliveredCount, color: "#bbf7d0", textColor: "#065f46" },
              { label: "Pending", value: pendingCount, color: "#fef3c7", textColor: "#92400e" },
            ].map((s) => (
              <div key={s.label} className="glass-card" style={{ padding: 16, textAlign: "center", background: s.color, border: "none" }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: s.textColor }}>{s.value}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: s.textColor, marginTop: 2, opacity: 0.8 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 180, borderRadius: 16 }} />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="glass-card" style={{ textAlign: "center", padding: 60, border: "none" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--color-primary-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>No orders yet. Start shopping!</div>
            <Link href="/" className="btn-premium btn-premium-primary">Browse Products</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {orders.map((o) => (
              <div key={o.id} className="glass-card" style={{ padding: 18, border: "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>Order #{o.id.slice(0, 8)}</div>
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 600 }}>
                      {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800, background: statusColors[o.status], color: statusTextColors[o.status] }}>{o.status.toUpperCase()}</span>
                    <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800, background: o.paymentMethod === "cod" ? "#e0e7ff" : "#f3e8ff", color: "#374151" }}>{o.paymentMethod === "cod" ? "COD" : "UPI"}</span>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 10, marginBottom: 10 }}>
                  {o.items.map((item) => (
                    <div key={item.productId} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                      <img src={item.img} alt={item.productName} style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", background: "#f3f4f6" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{item.productName}</div>
                        <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>₹{item.price} x {item.quantity}</div>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>₹{item.price * item.quantity}</div>
                    </div>
                  ))}
                </div>

                <OrderProgress status={o.status} />

                <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ fontWeight: 900, fontSize: 17, color: "#1f2937" }}>Total: ₹{o.total}</div>
                  {o.status !== "delivered" && o.status !== "cancelled" && o.otp && (
                    <div style={{ background: "#fef3c7", borderRadius: 12, padding: "8px 16px", textAlign: "center" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#92400e" }}>Delivery OTP</div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: "#1f2937", letterSpacing: 8, fontFamily: "monospace" }}>{o.otp}</div>
                      <div style={{ fontSize: 9, color: "#92400e", fontWeight: 700 }}>Share only when you receive delivery</div>
                    </div>
                  )}
                  {o.status === "delivered" && (
                    <div style={{ background: "#d1fae5", borderRadius: 12, padding: "8px 16px", textAlign: "center" }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#065f46" }}>✅ Delivered</div>
                    </div>
                  )}
                  {o.status === "cancelled" && (
                    <div style={{ background: "#fef2f2", borderRadius: 12, padding: "8px 16px", textAlign: "center" }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#991b1b" }}>✕ Cancelled</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RejectedScreen() {
  return (
    <div className="auth-layout has-bottom-nav" style={{ padding: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center", padding: 24 }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <h2 style={{ fontSize: 22, fontWeight: 900, marginTop: 16, color: "#1f2937" }}>Account Rejected</h2>
        <p style={{ fontSize: 15, color: "var(--color-text-secondary)", fontWeight: 700, marginTop: 8, maxWidth: 400, lineHeight: 1.5 }}>Your account has been rejected by the platform owner.</p>
        <Link href="/" className="btn-premium btn-premium-primary" style={{ marginTop: 20 }}>Go to Home</Link>
      </div>
    </div>
  );
}

function OrderProgress({ status }: { status: OrderStatus }) {
  const progressIdx = getOrderProgressIndex(status);
  const isCancelled = status === "cancelled";
  return (
    <div className="order-progress" style={{ margin: "8px 0" }}>
      {ORDER_STEPS.map((step, i) => {
        let cls = "";
        if (isCancelled) cls = "cancelled";
        else if (i < progressIdx) cls = "completed";
        else if (i === progressIdx) cls = "active";
        return (
          <div key={step.key} className="order-progress-step">
            <div className={`order-progress-circle ${cls}`}>
              {i < progressIdx && !isCancelled ? "✓" : isCancelled ? "✕" : i + 1}
            </div>
            <div className={`order-progress-label ${cls}`}>{step.label}</div>
            {i < ORDER_STEPS.length - 1 && (
              <div className={`order-progress-line ${i < progressIdx && !isCancelled ? "completed" : ""}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
