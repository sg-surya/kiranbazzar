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

export default function MyOrdersPage() {
  const { loggedIn, mobile, name } = useAuth();
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

  return (
    <div className="auth-layout" style={{ padding: 16 }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-muted)", textDecoration: "none" }}>&larr; Back</Link>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--color-text)", margin: 0 }}>My Orders</h1>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--color-text-muted)", fontWeight: 700 }}>
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--color-text-muted)", fontWeight: 700, background: "var(--color-surface)", borderRadius: 12, border: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <div style={{ fontSize: 16, marginBottom: 16 }}>No orders yet. Start shopping!</div>
            <Link href="/" style={{ padding: "12px 28px", borderRadius: 8, background: "var(--color-primary)", color: "white", fontWeight: 800, fontSize: 15, textDecoration: "none", display: "inline-block" }}>Browse Products</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {orders.map((o) => (
              <div key={o.id} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>Order {o.id}</div>
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 700 }}>
                      {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 800, background: statusColors[o.status], color: "#374151" }}>{o.status.toUpperCase()}</span>
                    <span style={{ padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 800, background: o.paymentMethod === "cod" ? "#e0e7ff" : "#f3e8ff", color: "#374151" }}>{o.paymentMethod === "cod" ? "COD" : "UPI"}</span>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 10, marginBottom: 10 }}>
                  {o.items.map((item) => (
                    <div key={item.productId} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                      <img src={item.img} alt={item.productName} style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover", background: "#f3f4f6" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{item.productName}</div>
                        <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>₹{item.price} x {item.quantity}</div>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>₹{item.price * item.quantity}</div>
                    </div>
                  ))}
                </div>

                <OrderProgress status={o.status} />

                <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 900, fontSize: 16, color: "#1f2937" }}>Total: ₹{o.total}</div>
                  {o.status !== "delivered" && o.status !== "cancelled" && o.otp && (
                    <div style={{ background: "#fef3c7", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#92400e" }}>Delivery OTP</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: "#1f2937", letterSpacing: 6 }}>{o.otp}</div>
                      <div style={{ fontSize: 10, color: "#92400e", fontWeight: 700 }}>Share only when you receive delivery</div>
                    </div>
                  )}
                  {o.status === "delivered" && (
                    <div style={{ background: "#d1fae5", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#065f46" }}>✅ Delivered</div>
                    </div>
                  )}
                  {o.status === "cancelled" && (
                    <div style={{ background: "#fef2f2", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#991b1b" }}>❌ Cancelled</div>
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
              <div className={`order-progress-line ${i < progressIdx && !isCancelled ? "completed" : ""} {isCancelled ? "cancelled" : ""}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
