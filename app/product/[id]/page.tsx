"use client";

import React, { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getAnyProductById, getWishlist, toggleWishlist, type AnyProduct } from "@/lib/data";
import { useCart } from "@/app/context/CartContext";
import { useRouter } from "next/navigation";

export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [product, setProduct] = useState<AnyProduct | null>(null);
  const { addItem, totalItems } = useCart();
  const router = useRouter();
  const [liked, setLiked] = React.useState(false);

  useEffect(() => {
    getAnyProductById(id).then((p) => setProduct(p ?? null));
  }, [id]);

  useEffect(() => {
    setLiked(getWishlist().includes(id));
  }, [id]);

  if (!product) {
    return (
      <div className="pdp-not-found">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 15s1.5-2 4-2 4 2 4 2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
        <h2>Product not found</h2>
        <Link href="/" className="pdp-back-link">
          ← Back to Home
        </Link>
      </div>
    );
  }

  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  const productImages = "images" in product && product.images && product.images.length > 0 ? product.images : [product.img];
  const productVideos = "videos" in product ? product.videos || [] : [];
  const productRating = "rating" in product ? product.rating : "5.0";
  const productEcard = "ecard" in product ? product.ecard : undefined;
  const productHighlights = "highlights" in product ? product.highlights : ["Fresh & quality product"];

  const handleAddToCart = () => {
    addItem(product);
  };

  const handleBuyNow = () => {
    addItem(product);
    router.push("/checkout");
  };

  const mediaImages = productImages;
  const mediaVideos = productVideos;

  const slides: Array<{ type: "image"; src: string; alt: string } | { type: "video"; src: string }> = [
    ...mediaImages.map((src) => ({ type: "image" as const, src, alt: product.name })),
    ...mediaVideos.filter(Boolean).map((src) => ({ type: "video" as const, src })),
  ];

  const [activeIndex, setActiveIndex] = React.useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % slides.length);
    }, 3500);
    return () => window.clearInterval(t);
  }, [slides.length]);

  const activeSlide = slides[activeIndex] ?? slides[0];

  return (
    <div className="pdp-container">
      <div className="pdp-topbar">
        <Link href="/" className="pdp-back-btn" aria-label="Go back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <div className="pdp-topbar-actions">
          <button className="pdp-icon-btn" aria-label={liked ? "Remove from wishlist" : "Add to wishlist"} onClick={() => setLiked(toggleWishlist(id).includes(id))}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill={liked ? "#ef4444" : "none"} stroke={liked ? "#ef4444" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          <button className="pdp-icon-btn" aria-label="Share">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>
          <Link href="/cart" className="pdp-icon-btn pdp-cart-btn" aria-label="Cart">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {totalItems > 0 && <span className="pdp-cart-count">{totalItems}</span>}
          </Link>
        </div>
      </div>

      <div className="pdp-image-section">
        <div className="pdp-image-wrapper">
          {activeSlide.type === "image" ? (
            <Image
              src={activeSlide.src}
              alt={activeSlide.alt}
              width={400}
              height={400}
              priority={activeIndex === 0}
              style={{ objectFit: "contain", mixBlendMode: "multiply" }}
            />
          ) : (
            <div className="pdp-video-wrapper">
              <video src={activeSlide.src} controls playsInline preload="metadata" />
            </div>
          )}
        </div>

        {slides.length > 1 && (
          <div className="pdp-image-dots">
            {slides.map((s, i) => (
              <button
                key={i}
                type="button"
                className={`pdp-dot ${i === activeIndex ? "active" : ""}`}
                aria-label={`Slide ${i + 1}`}
                onClick={() => setActiveIndex(i)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="pdp-content">
        <div className="pdp-badges-row">
          <span className="pdp-badge-assured">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Assured Quality
          </span>
          {discount > 0 && (
            <span className="pdp-badge-discount">{discount}% OFF</span>
          )}
        </div>

        <h1 className="pdp-title">{product.name}</h1>

        <div className="pdp-rating-row">
          <span className="pdp-rating-pill">
            {productRating}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="none">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </span>
          <span className="pdp-review-count">1.2k ratings</span>
        </div>

        <div className="pdp-price-section">
          <span className="pdp-price">₹{product.price}</span>
          <span className="pdp-mrp">₹{product.mrp}</span>
          {discount > 0 && (
            <span className="pdp-save">You save ₹{product.mrp - product.price}</span>
          )}
        </div>

        <div className="pdp-delivery-info">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
          <div>
            <span className="pdp-delivery-free">FREE Delivery</span>
            <span className="pdp-delivery-date">Delivery by Tomorrow, 10 PM</span>
          </div>
        </div>

        <div className="pdp-seller-card">
          <div className="pdp-seller-top">
            <div className="pdp-seller-avatar" aria-hidden="true">
              {product.sellerName?.slice(0, 1) ?? "S"}
            </div>
            <div>
              <div className="pdp-seller-name">{product.sellerName ?? "Kirana Bazzar"}</div>
              <div className="pdp-seller-badge">
                {productEcard?.title ?? "Verified Seller"}
                {productEcard?.badgeText ? ` • ${productEcard.badgeText}` : ""}
              </div>
            </div>
          </div>
          {productEcard?.subtitle && (
            <div className="pdp-seller-subtitle">{productEcard.subtitle}</div>
          )}
        </div>

        <div className="pdp-divider" />

        <div className="pdp-description">
          <h3>Product Description</h3>
          <p>{product.description}</p>
        </div>

        <div className="pdp-highlights">
          <h3>Highlights</h3>
          <ul>
            {productHighlights.map((h, i) => (
              <li key={i}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {h}
              </li>
            ))}
          </ul>
        </div>

        {"brand" in product && (product.brand || product.sku || product.unit || ("stock" in product)) && (
          <>
            <div className="pdp-divider" />
            <div className="pdp-specs">
              <h3>Product Specifications</h3>
              <div className="pdp-specs-grid">
                {product.brand && (
                  <div className="pdp-spec-item">
                    <span className="pdp-spec-label">Brand</span>
                    <span className="pdp-spec-value">{product.brand}</span>
                  </div>
                )}
                {product.sku && (
                  <div className="pdp-spec-item">
                    <span className="pdp-spec-label">SKU</span>
                    <span className="pdp-spec-value">{product.sku}</span>
                  </div>
                )}
                {product.unit && (
                  <div className="pdp-spec-item">
                    <span className="pdp-spec-label">Unit</span>
                    <span className="pdp-spec-value">{product.unit}</span>
                  </div>
                )}
                {"stock" in product && (
                  <div className="pdp-spec-item">
                    <span className="pdp-spec-label">Stock</span>
                    <span className="pdp-spec-value" style={{ color: product.stock > 0 ? "#22C55E" : "#ef4444" }}>{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</span>
                  </div>
                )}
                {"tags" in product && product.tags.length > 0 && (
                  <div className="pdp-spec-item pdp-spec-full">
                    <span className="pdp-spec-label">Tags</span>
                    <span className="pdp-spec-value">
                      {product.tags.map((t) => (
                        <span key={t} className="pdp-tag">{t}</span>
                      ))}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <div className="pdp-divider" />

        <div className="pdp-policy-row">
          <div className="pdp-policy">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            <span>7-Day<br />Returns</span>
          </div>
          <div className="pdp-policy">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
            <span>Cash on<br />Delivery</span>
          </div>
          <div className="pdp-policy">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Secure<br />Payment</span>
          </div>
          <div className="pdp-policy">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>Genuine<br />Product</span>
          </div>
        </div>

        <div style={{ height: "90px" }} />
      </div>

      <div className="pdp-bottom-bar">
        <button className="pdp-btn-add" onClick={handleAddToCart}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          Add to Cart
        </button>
        <button className="pdp-btn-buy" onClick={handleBuyNow}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          Buy Now
        </button>
      </div>
    </div>
  );
}
