"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/app/context/CartContext";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { playClickSound } from "@/lib/sounds";

function RejectedScreen() {
  return (
    <div className="cart-container">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", textAlign: "center", padding: 24 }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <h2 style={{ fontSize: 22, fontWeight: 900, marginTop: 16, color: "#1f2937" }}>Account Rejected</h2>
        <p style={{ fontSize: 15, color: "var(--color-text-secondary)", fontWeight: 700, marginTop: 8, maxWidth: 400, lineHeight: 1.5 }}>
          Your account has been rejected by the platform owner.
        </p>
        <Link href="/" style={{ marginTop: 20, padding: "12px 28px", borderRadius: 8, background: "var(--color-primary)", color: "white", fontWeight: 800, fontSize: 15, textDecoration: "none" }}>
          Go to Home
        </Link>
      </div>
    </div>
  );
}

export default function CartPage() {
  const router = useRouter();
  const { loggedIn, status } = useAuth();
  const { items, removeItem, updateQuantity, totalItems, totalPrice, clearCart } =
    useCart();

  React.useEffect(() => {
    if (!loggedIn) router.replace("/login");
  }, [loggedIn, router]);

  if (!loggedIn) return null;
  if (status === "rejected") return <RejectedScreen />;


  const totalSavings = items.reduce(
    (sum, item) =>
      sum + (item.product.mrp - item.product.price) * item.quantity,
    0
  );

  if (items.length === 0) {
    return (
      <div className="cart-container">
        <div className="cart-topbar">
          <Link href="/" className="pdp-back-btn" aria-label="Go back">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <h2>My Cart</h2>
          <div style={{ width: 22 }} />
        </div>
        <div className="cart-empty">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <h3>Your cart is empty</h3>
          <p>Looks like you haven&apos;t added anything to your cart yet.</p>
          <Link href="/" className="cart-shop-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      {/* Top Bar */}
      <div className="cart-topbar">
        <Link href="/" className="pdp-back-btn" aria-label="Go back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <h2>My Cart ({totalItems})</h2>
        <button onClick={clearCart} className="cart-clear-btn" aria-label="Clear cart">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>

      {/* Savings Banner */}
      {totalSavings > 0 && (
        <div className="cart-savings-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
          You&apos;re saving <strong>₹{totalSavings}</strong> on this order!
        </div>
      )}

      {/* Cart Items */}
      <div className="cart-items">
        {items.map((item) => {
          const discount = Math.round(
            ((item.product.mrp - item.product.price) / item.product.mrp) * 100
          );
          return (
            <div key={item.product.id} className="cart-item">
              <Link href={`/product/${item.product.id}`} className="cart-item-img">
                <Image
                  src={item.product.img}
                  alt={item.product.name}
                  width={100}
                  height={100}
                  style={{ objectFit: "contain", mixBlendMode: "multiply" }}
                />
              </Link>
              <div className="cart-item-details">
                <Link href={`/product/${item.product.id}`} className="cart-item-name">
                  {item.product.name}
                </Link>
                <div className="cart-item-price-row">
                  <span className="cart-item-price">₹{item.product.price}</span>
                  <span className="cart-item-mrp">₹{item.product.mrp}</span>
                  {discount > 0 && (
                    <span className="cart-item-discount">{discount}% off</span>
                  )}
                </div>
                <div className="cart-item-delivery">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                  Free Delivery
                </div>
                <div className="cart-qty-controls">
                  <button
                    onClick={() => {
                      playClickSound();
                      updateQuantity(item.product.id, item.quantity - 1);
                    }}
                    className="cart-qty-btn"
                    aria-label="Decrease quantity"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                  <span className="cart-qty-value">{item.quantity}</span>
                  <button
                    onClick={() => {
                      playClickSound();
                      updateQuantity(item.product.id, item.quantity + 1);
                    }}
                    className="cart-qty-btn"
                    aria-label="Increase quantity"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      playClickSound();
                      removeItem(item.product.id);
                    }}
                    className="cart-remove-btn"
                    aria-label="Remove item"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Summary */}
      <div className="cart-summary">
        <h3>Order Summary</h3>
        <div className="cart-summary-row">
          <span>Subtotal ({totalItems} items)</span>
          <span>₹{items.reduce((s, i) => s + i.product.mrp * i.quantity, 0)}</span>
        </div>
        <div className="cart-summary-row cart-summary-discount">
          <span>Discount</span>
          <span>- ₹{totalSavings}</span>
        </div>
        <div className="cart-summary-row">
          <span>Delivery</span>
          <span className="cart-summary-free">FREE</span>
        </div>
        <div className="cart-summary-divider" />
        <div className="cart-summary-row cart-summary-total">
          <span>Total Amount</span>
          <span>₹{totalPrice}</span>
        </div>
      </div>

      {/* Spacer for bottom bar */}
      <div style={{ height: "80px" }} />

      {/* Fixed Bottom */}
      <div className="cart-bottom-bar">
        <div className="cart-bottom-price">
          <span className="cart-bottom-total">₹{totalPrice}</span>
          <span className="cart-bottom-items">{totalItems} item{totalItems > 1 ? "s" : ""}</span>
        </div>
        <button
          className="cart-checkout-btn"
          onClick={() => { playClickSound(); router.push("/checkout"); }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          Place Order
        </button>
      </div>
    </div>
  );
}
