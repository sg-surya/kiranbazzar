"use client";

import Link from "next/link";
import React from "react";
import { useAuth } from "@/app/context/AuthContext";

export default function AccountPage() {
  const { loggedIn, role, name, status, mobile, logout } = useAuth();

  if (!loggedIn) {
    return (
      <div className="auth-layout has-bottom-nav page-slide-enter" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 16 }}>
        <div style={{ textAlign: "center" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <h2 style={{ fontSize: 20, fontWeight: 900, marginTop: 16, color: "#1f2937" }}>Not Logged In</h2>
          <p style={{ fontSize: 14, color: "var(--color-text-secondary)", fontWeight: 600, marginTop: 8 }}>Login to access your account.</p>
          <Link href="/login" className="btn-premium btn-premium-primary" style={{ marginTop: 20, display: "inline-flex" }}>Login</Link>
        </div>
      </div>
    );
  }

  const items = [
    { href: "/profile", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, label: "My Profile", desc: "View and edit your personal details" },
    ...(role === "seller" ? [{ href: "/dashboard", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>, label: "Dashboard", desc: "Manage your products and orders" }] : []),
    ...(role === "owner" ? [{ href: "/owner", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c-4.97 0-9-2.24-9-5v-3c0-2.76 4.03-5 9-5s9 2.24 9 5v3c0 2.76-4.03 5-9 5z"/><path d="M3 14c0-2.76 4.03-5 9-5s9 2.24 9 5"/><path d="M12 4V2"/><path d="M8 5l-1-2"/><path d="M16 5l1-2"/></svg>, label: "Owner Panel", desc: "Full platform control and settings" }] : []),
    { href: "/my-orders", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, label: "My Orders", desc: "Track and view all your orders" },
    { href: "/cart", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>, label: "My Cart", desc: "Items saved in your cart" },
  ] as { href: string; icon: React.ReactNode; label: string; desc: string }[];

  return (
    <div className="page-slide-enter has-bottom-nav" style={{ background: "var(--color-bg)", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)", padding: "24px 16px 32px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-40%", right: "-20%", width: 250, height: 250, borderRadius: "50%", background: "rgba(255,255,255,0.08)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-30%", left: "-10%", width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 600, margin: "0 auto", position: "relative", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 22, color: "white", flexShrink: 0 }}>
            {name ? name.slice(0, 1).toUpperCase() : "?"}
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "white" }}>{name || "User"}</h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>
              {role === "seller" ? "Seller" : role === "owner" ? "Owner" : role === "dukandar" ? (status === "approved" ? "Dukandar" : "Dukandar · Pending") : "User"}
              {mobile && <> &middot; {mobile}</>}
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "16px", marginTop: -16, position: "relative" }}>
        <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="glass-card"
              style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, border: "none", textDecoration: "none", color: "inherit", borderRadius: 14 }}
            >
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)", flexShrink: 0 }}>
                {item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 600 }}>{item.desc}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </Link>
          ))}
        </div>

        <div style={{ marginTop: 24, display: "flex", justifyContent: "center" }}>
          <button
            onClick={() => { logout(); }}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 32px", borderRadius: 12, border: "2px solid #fecaca", background: "white", color: "#dc2626", fontWeight: 800, fontSize: 15, cursor: "pointer", transition: "all 0.2s" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
