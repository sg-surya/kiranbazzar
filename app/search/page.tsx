"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getAllProducts, getAllCategories, categories as staticCategories, getWishlist, toggleWishlist, type AnyProduct } from "@/lib/data";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") || "";
  const [allProducts, setAllProducts] = useState<AnyProduct[]>([]);
  const [catList, setCatList] = useState(staticCategories);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState(q);
  const [filterCat, setFilterCat] = useState("");
  const [sortBy, setSortBy] = useState<"relevance" | "price-low" | "price-high" | "name">("relevance");

  useEffect(() => {
    getAllProducts().then(setAllProducts).finally(() => setLoading(false));
    getAllCategories().then(setCatList);
    setWishlist(getWishlist());
  }, []);

  const filtered = allProducts.filter((prod) => {
    const query = q.toLowerCase().trim();
    const matchSearch = !query || prod.name.toLowerCase().includes(query) || ("brand" in prod && (prod as any).brand?.toLowerCase().includes(query)) || prod.category?.toLowerCase().includes(query);
    const matchCat = !filterCat || prod.category === filterCat;
    return matchSearch && matchCat;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    if (sortBy === "name") return a.name.localeCompare(b.name);
    return 0;
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim()) {
      router.push(`/search?q=${encodeURIComponent(input.trim())}`);
    }
  }

  const uniqueCats = [...new Set(allProducts.map((p) => p.category).filter(Boolean))];

  return (
    <div className="page-slide-enter has-bottom-nav" style={{ background: "var(--color-bg)", minHeight: "100vh" }}>
      {/* Search Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--color-border)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "12px 16px" }}>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button type="button" onClick={() => router.back()} style={{ background: "transparent", border: "none", padding: 4, cursor: "pointer", display: "flex", color: "var(--color-text)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
            </button>
            <div style={{ flex: 1, display: "flex", alignItems: "center", background: "var(--color-bg)", borderRadius: 12, border: "1px solid var(--color-border)", padding: "8px 14px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search products, brands and more" style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 15, fontWeight: 600, marginLeft: 10, color: "var(--color-text)" }} autoFocus />
            </div>
            <button type="submit" className="btn-premium btn-premium-primary btn-premium-sm" style={{ padding: "10px 20px" }}>Search</button>
          </form>
        </div>

        {/* Filter Bar */}
        <div style={{ padding: "0 16px 10px", maxWidth: 1000, margin: "0 auto", display: "flex", gap: 8, overflowX: "auto", flexWrap: "nowrap", scrollbarWidth: "none" }}>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={{ padding: "7px 12px", borderRadius: 10, border: "1px solid var(--color-border)", fontSize: 12, fontWeight: 700, background: "white", outline: "none", flexShrink: 0 }}>
            <option value="">All Categories</option>
            {uniqueCats.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} style={{ padding: "7px 12px", borderRadius: 10, border: "1px solid var(--color-border)", fontSize: 12, fontWeight: 700, background: "white", outline: "none", flexShrink: 0 }}>
            <option value="relevance">Sort: Relevance</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name">Name: A to Z</option>
          </select>
          {q && <div style={{ padding: "7px 12px", fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", flexShrink: 0, whiteSpace: "nowrap" }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{q}&rdquo;</div>}
        </div>
      </div>

      {/* Results */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "4px 16px 90px" }}>
        {loading ? (
          <div className="meesho-product-grid" style={{ marginTop: 12 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="product-card" style={{ padding: 0 }}>
                <div className="product-img" style={{ background: "#e5e7eb", animation: "pulse 1.5s ease-in-out infinite" }} />
                <div className="product-info" style={{ gap: 8 }}>
                  <div style={{ height: 14, background: "#e5e7eb", borderRadius: 4, width: "80%", animation: "pulse 1.5s ease-in-out infinite" }} />
                  <div style={{ height: 20, background: "#e5e7eb", borderRadius: 4, width: "50%", animation: "pulse 1.5s ease-in-out infinite" }} />
                  <div style={{ height: 12, background: "#e5e7eb", borderRadius: 4, width: "40%", animation: "pulse 1.5s ease-in-out infinite" }} />
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--color-text-muted)" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 12px", display: "block" }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <p style={{ fontWeight: 700, fontSize: 15 }}>No products found</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Try a different search term or filter</p>
          </div>
        ) : (
          <div className="meesho-product-grid fade-in">
            {sorted.map((prod) => {
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
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                        Free Delivery
                      </div>
                      <div className="product-rating">
                        {"rating" in prod && prod.rating}
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={(e) => { e.preventDefault(); const next = toggleWishlist(prod.id); setWishlist(next); }}
                    className="wishlist-btn"
                    aria-label={wishlist.includes(prod.id) ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={wishlist.includes(prod.id) ? "#ef4444" : "none"} stroke={wishlist.includes(prod.id) ? "#ef4444" : "#6b7280"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}><div style={{ width: 32, height: 32, border: "3px solid var(--color-border)", borderTopColor: "var(--color-primary)", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} /></div>}>
      <SearchContent />
    </Suspense>
  );
}
