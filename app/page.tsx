"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState, useRef, useEffect } from "react";
import { getAllProducts, getAllCategories, categories as staticCategories, getWishlist, toggleWishlist, type AnyProduct } from "@/lib/data";
import { useCart } from "@/app/context/CartContext";
import { useAuth } from "@/app/context/AuthContext";

function CategoryIcon({ type }: { type: string }) {
  const s = { width: 28, height: 28, viewBox: "0 0 24 24", fill: "none", stroke: "#22C55E", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (type) {
    case "grocery":
      return <svg {...s}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>;
    case "wheat":
      return <svg {...s}><path d="M2 22 16 8"/><path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/></svg>;
    case "oil":
      return <svg {...s}><path d="M10 2v4a2 2 0 0 1-2 2H6l-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10l-2-2h-2a2 2 0 0 1-2-2V2"/><path d="M8.5 2h7"/><path d="M12 12v6"/></svg>;
    case "spice":
      return <svg {...s}><path d="M12 22c-4.97 0-9-2.24-9-5v-3c0-2.76 4.03-5 9-5s9 2.24 9 5v3c0 2.76-4.03 5-9 5z"/><path d="M3 14c0-2.76 4.03-5 9-5s9 2.24 9 5"/><path d="M12 4V2"/><path d="M8 5l-1-2"/><path d="M16 5l1-2"/></svg>;
    case "snack":
      return <svg {...s}><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/><path d="M8.5 8.5v.01"/><path d="M16 15.5v.01"/><path d="M12 12v.01"/><path d="M11 17v.01"/><path d="M7 14v.01"/></svg>;
    case "beverage":
      return <svg {...s}><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>;
    case "care":
      return <svg {...s}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
    case "household":
      return <svg {...s}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
    default:
      return <svg {...s}><circle cx="12" cy="12" r="10"/></svg>;
  }
}

export default function Home() {
  const { totalItems } = useCart();
  const { loggedIn, role, name, status, logout } = useAuth();
  const [allProducts, setAllProducts] = useState<AnyProduct[]>([]);
  const [catList, setCatList] = useState(staticCategories);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAllProducts().then(setAllProducts);
    getAllCategories().then(setCatList);
    setWishlist(getWishlist());
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    if (profileOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [profileOpen]);

  return (
    <div className="container">

      <header className="kb-header">
        <Link href="/" className="kb-logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          KiranaBazzar
        </Link>
        <div className="kb-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" placeholder="Search products, brands and more" />
        </div>
        <div className="kb-actions">
          <Link href="/cart" className="kb-cart-btn" aria-label="Cart">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {totalItems > 0 && <span className="kb-cart-badge">{totalItems}</span>}
          </Link>
          <div ref={profileRef} style={{ position: "relative" }}>
            {loggedIn ? (
              <>
                <button onClick={() => setProfileOpen((p) => !p)} className="kb-avatar" title={name || "Account"}>
                  {name ? name.slice(0, 1).toUpperCase() : "?"}
                </button>
                {profileOpen && (
                  <div className="kb-dropdown">
                    <div className="kb-dropdown-header">{name}<span style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 700 }}>{role === "seller" ? " (Seller)" : role === "owner" ? " (Owner)" : role === "dukandar" ? (status === "approved" ? " (Dukandar)" : " (Dukandar · Pending)") : ""}</span></div>
                    <div className="kb-dropdown-divider" />
                    {role === "seller" && <Link href="/dashboard" className="kb-dropdown-item" onClick={() => setProfileOpen(false)}>📊 Dashboard</Link>}
                    {role === "owner" && <Link href="/owner" className="kb-dropdown-item" onClick={() => setProfileOpen(false)}>⚙️ Owner Panel</Link>}
                    <Link href="/cart" className="kb-dropdown-item" onClick={() => setProfileOpen(false)}>🛒 My Cart</Link>
                    <button className="kb-dropdown-item kb-dropdown-logout" onClick={() => { setProfileOpen(false); logout(); }}>🚪 Logout</button>
                  </div>
                )}
              </>
            ) : (
              <Link href="/login" className="kb-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="hero-slider-wrapper">
        <div className="hero-banner">
          <h2>Lowest Prices<br />Best Quality Shopping</h2>
          <div className="hero-cards">
            <div className="hero-card">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
              Free Delivery
            </div>
            <div className="hero-card">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              Cash on Delivery
            </div>
            <div className="hero-card">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Easy Returns
            </div>
          </div>
          <div className="hero-bg-img">
            <Image src="/mango_banner.png" alt="Fresh produce" width={200} height={200} style={{ mixBlendMode: "multiply" }} />
          </div>
        </div>
      </div>

      <div className="category-scroll">
        {catList.map((cat, i) => (
          <div key={i} className="cat-item">
            <div className="cat-circle">
              <CategoryIcon type={cat.icon} />
            </div>
            <div className="cat-name">{cat.name}</div>
          </div>
        ))}
      </div>

      <div className="product-section">
        <div className="section-header">
          <h3>Products For You</h3>
          <span className="section-view-all">View All
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
        </div>
        <div className="meesho-product-grid">
          {allProducts.map((prod) => {
            const discount = Math.round(((prod.mrp - prod.price) / prod.mrp) * 100);
            return (
              <div key={prod.id} className="product-card-wrapper">
              <Link href={`/product/${prod.id}`} className="product-card">
                <div className="product-img">
                  <Image src={prod.img} alt={prod.name} width={150} height={150} style={{ margin: "0 auto", mixBlendMode: "multiply" }} />
                  {discount > 0 && <span className="product-discount-tag">{discount}% OFF</span>}
                </div>
                <div className="product-info">
                  <div className="product-title">{prod.name}</div>
                  <div className="product-price">
                    ₹{prod.price} <span className="product-mrp">₹{prod.mrp}</span>
                  </div>
                  <div className="free-delivery-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="3" width="15" height="13" />
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                    Free Delivery
                  </div>
                  <div className="product-rating">
                    {"rating" in prod && prod.rating}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="none">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                </div>
              </Link>
              <button
                onClick={(e) => { e.preventDefault(); const next = toggleWishlist(prod.id); setWishlist(next); }}
                className="wishlist-btn"
                aria-label={wishlist.includes(prod.id) ? "Remove from wishlist" : "Add to wishlist"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={wishlist.includes(prod.id) ? "#ef4444" : "none"} stroke={wishlist.includes(prod.id) ? "#ef4444" : "#6b7280"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
