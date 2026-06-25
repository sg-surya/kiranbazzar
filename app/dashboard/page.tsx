"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  SellerProduct,
  getSellerProducts,
  saveSellerProduct,
  deleteSellerProduct,
  getAllCategories,
  getOrdersForSeller,
  updateOrderStatus,
  getStoreSettings,
  saveStoreSettings,
  type Order,
  type OrderStatus,
  type StoreSettings,
} from "@/lib/data";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const MAX_VIDEO_SIZE = 10 * 1024 * 1024;

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type Tab = "overview" | "products" | "orders" | "settings";

export default function DashboardPage() {
  const { loggedIn, role, mobile, name, status } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    mrp: "",
    category: "Grocery",
    unit: "1 kg",
    img: "",
    videos: "",
    brand: "",
    stock: "100",
    sku: "",
    tags: "",
    highlights: "",
  });
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [videoFiles, setVideoFiles] = useState<{ name: string; data: string }[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: "My Store",
    storeDescription: "",
    storeLogo: "/product_atta.png",
    deliveryRadius: "10",
    returnPolicy: "7-day return accepted",
    upiId: "",
    storeAddress: "",
  });

  useEffect(() => {
    if (!loggedIn) { router.replace("/login"); return; }
    if (role !== "seller") { router.replace("/"); return; }
    setProducts(getSellerProducts());
    if (mobile) {
      setOrders(getOrdersForSeller(mobile));
      setSettings(getStoreSettings(mobile));
    }
  }, [loggedIn, role, router, mobile]);

  const cats = getAllCategories();
  const totalEarnings = useMemo(() =>
    orders.filter((o) => o.status === "delivered").reduce((sum, o) => sum + o.total, 0),
    [orders]
  );
  const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "confirmed" || o.status === "shipped").length;

  if (!loggedIn || role !== "seller") return null;

  /* ── Product helpers ──────────────────────────────── */

  function resetProductForm() {
    setProductForm({ name: "", description: "", price: "", mrp: "", category: "Grocery", unit: "1 kg", img: "", videos: "", brand: "", stock: "100", sku: "", tags: "", highlights: "" });
    setImgPreview(null);
    setVideoFiles([]);
    setEditingId(null);
  }

  function handleProductSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productForm.name.trim() || !productForm.price || !productForm.mrp) return;

    const product: SellerProduct = {
      id: editingId || `seller_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      price: Number(productForm.price),
      mrp: Number(productForm.mrp),
      img: imgPreview || productForm.img || "/product_atta.png",
      videos: videoFiles.map((v) => v.data),
      category: productForm.category,
      unit: productForm.unit,
      brand: productForm.brand.trim(),
      stock: Math.max(0, Number(productForm.stock) || 0),
      sku: productForm.sku.trim(),
      tags: productForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
      highlights: productForm.highlights.split("\n").map((h) => h.trim()).filter(Boolean),
      sellerMobile: mobile || "",
      sellerName: name || "Seller",
      available: true,
      createdAt: editingId ? (products.find((p) => p.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
    };

    saveSellerProduct(product);
    setProducts(getSellerProducts());
    resetProductForm();
    setTab("products");
  }

  function handleEditProduct(p: SellerProduct) {
    setProductForm({
      name: p.name,
      description: p.description,
      price: String(p.price),
      mrp: String(p.mrp),
      category: p.category,
      unit: p.unit,
      img: "",
      videos: "",
      brand: p.brand,
      stock: String(p.stock),
      sku: p.sku,
      tags: p.tags.join(", "),
      highlights: p.highlights.join("\n"),
    });
    setImgPreview(p.img);
    setVideoFiles(p.videos.map((v) => ({ name: "video.mp4", data: v })));
    setEditingId(p.id);
    setTab("products");
  }

  function handleDeleteProduct(id: string) {
    if (!confirm("Delete this product?")) return;
    deleteSellerProduct(id);
    setProducts(getSellerProducts());
  }

  function toggleAvailability(id: string) {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    p.available = !p.available;
    saveSellerProduct(p);
    setProducts(getSellerProducts());
  }

  /* ── File upload handlers ──────────────────────────── */

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Please select an image file."); return; }
    if (file.size > MAX_IMAGE_SIZE) { alert("Image too large. Max 2MB allowed."); return; }
    const data = await readFileAsDataURL(file);
    setImgPreview(data);
  }

  function handleRemoveImage() {
    setImgPreview(null);
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newVideos = [...videoFiles];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("video/")) { alert(`"${file.name}" is not a video file.`); continue; }
      if (file.size > MAX_VIDEO_SIZE) { alert(`"${file.name}" is too large. Max 10MB per video.`); continue; }
      const data = await readFileAsDataURL(file);
      newVideos.push({ name: file.name, data });
    }
    setVideoFiles(newVideos);
  }

  function handleRemoveVideo(index: number) {
    setVideoFiles((prev) => prev.filter((_, i) => i !== index));
  }

  /* ── Order helpers ────────────────────────────────── */

  function handleOrderStatus(orderId: string, status: OrderStatus) {
    updateOrderStatus(orderId, status);
    if (mobile) setOrders(getOrdersForSeller(mobile));
  }

  /* ── Seed Demo Data ──────────────────────────────── */

  function seedDemoData() {
    if (!mobile) return;
    const demoProducts: SellerProduct[] = [
      { id: `demo_${Date.now()}_1`, name: "Fresh Apples", description: "Crisp and juicy red apples directly from Himachal orchards.", price: 99, mrp: 140, img: "/product_atta.png", videos: [], category: "Grocery", unit: "1 kg", brand: "HimFresh", stock: 50, sku: "FRU-APP-001", tags: ["organic", "fresh", "apple"], highlights: ["Farm fresh", "Juicy & crispy", "Himachal apples"], sellerMobile: mobile, sellerName: name || "Demo Seller", available: true, createdAt: new Date().toISOString() },
      { id: `demo_${Date.now()}_2`, name: "Amul Gold Milk 1L", description: "Full-cream milk rich in taste and nutrition.", price: 68, mrp: 76, img: "/category_dairy.png", videos: [], category: "Grocery", unit: "1 L", brand: "Amul", stock: 100, sku: "MLK-AMUL-001", tags: ["milk", "dairy", "full-cream"], highlights: ["Full-cream", "Rich in calcium", "Pure & fresh"], sellerMobile: mobile, sellerName: name || "Demo Seller", available: true, createdAt: new Date().toISOString() },
      { id: `demo_${Date.now()}_3`, name: "Organic Turmeric Powder", description: "Pure organic turmeric powder from certified farms.", price: 45, mrp: 60, img: "/category_dairy.png", videos: [], category: "Spices", unit: "200 g", brand: "Organic Valley", stock: 30, sku: "SPC-TUR-001", tags: ["organic", "turmeric", "spice"], highlights: ["Certified organic", "Rich curcumin", "No additives"], sellerMobile: mobile, sellerName: name || "Demo Seller", available: true, createdAt: new Date().toISOString() },
      { id: `demo_${Date.now()}_4`, name: "Multigrain Atta 5kg", description: "Healthy multigrain flour mix of 5 grains.", price: 299, mrp: 375, img: "/product_atta.png", videos: [], category: "Atta & Dal", unit: "5 kg", brand: "HealthyGrains", stock: 25, sku: "ATTA-MG-001", tags: ["multigrain", "healthy", "whole-wheat"], highlights: ["5 grain mix", "High fiber", "No maida"], sellerMobile: mobile, sellerName: name || "Demo Seller", available: true, createdAt: new Date().toISOString() },
      { id: `demo_${Date.now()}_5`, name: "Herbal Shampoo 200ml", description: "Natural herbal shampoo with aloe vera and neem.", price: 129, mrp: 175, img: "/category_dairy.png", videos: [], category: "Personal Care", unit: "200 ml", brand: "Herbals", stock: 40, sku: "HBC-SHM-001", tags: ["herbal", "shampoo", "natural"], highlights: ["Aloe vera & neem", "Chemical-free", "All hair types"], sellerMobile: mobile, sellerName: name || "Demo Seller", available: true, createdAt: new Date().toISOString() },
      { id: `demo_${Date.now()}_6`, name: "Cold Pressed Coconut Oil 500ml", description: "Pure cold-pressed virgin coconut oil for cooking and skin.", price: 199, mrp: 250, img: "/category_dairy.png", videos: [], category: "Oil & Ghee", unit: "500 ml", brand: "CocoPure", stock: 20, sku: "OIL-CCN-001", tags: ["cold-pressed", "coconut", "virgin"], highlights: ["Cold-pressed", "Virgin quality", "Multi-purpose"], sellerMobile: mobile, sellerName: name || "Demo Seller", available: true, createdAt: new Date().toISOString() },
    ];
    demoProducts.forEach((p) => saveSellerProduct(p));
    saveStoreSettings(mobile, { storeName: `${name || "Demo"}'s Kirana Store`, storeDescription: "Welcome to our store! We offer fresh groceries, spices, and daily essentials at the best prices.", storeLogo: "/product_atta.png", deliveryRadius: "15", returnPolicy: "7-day easy returns", upiId: "demo@sbi", storeAddress: "123, Main Road, New Delhi" });
    setProducts(getSellerProducts());
    if (mobile) setOrders(getOrdersForSeller(mobile));
    setSettings(getStoreSettings(mobile));
  }

  const statusColors: Record<OrderStatus, string> = {
    pending: "#fef3c7",
    confirmed: "#e0e7ff",
    shipped: "#dbeafe",
    delivered: "#d1fae5",
    cancelled: "#fef2f2",
  };

  /* ── Settings helpers ─────────────────────────────── */

  function handleSettingsSave(e: React.FormEvent) {
    e.preventDefault();
    if (!mobile) return;
    saveStoreSettings(mobile, settings);
    alert("Store settings saved!");
  }

  /* ── Tab switcher ─────────────────────────────────── */

  function TabBtn({ id, label }: { id: Tab; label: string }) {
    return (
      <button
        onClick={() => { if (id === "products") resetProductForm(); setTab(id); }}
        style={{
          padding: "10px 18px",
          borderRadius: 8,
          border: "none",
          fontWeight: 800,
          fontSize: 13,
          cursor: "pointer",
          background: tab === id ? "var(--color-primary)" : "#e5e7eb",
          color: tab === id ? "white" : "#374151",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="auth-layout" style={{ padding: 16 }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
          <div>
            <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-muted)", textDecoration: "none" }}>&larr; Back to Store</Link>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--color-text)", marginTop: 4 }}>Seller Dashboard</h1>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", fontWeight: 700 }}>Welcome, {name || "Seller"}</p>
          </div>
        </div>

        {status === "pending" && (
          <div style={{ background: "#fef3c7", borderRadius: 12, padding: 16, marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>⏳</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: 15, color: "#92400e" }}>Account Pending Approval</div>
              <div style={{ fontSize: 13, color: "#92400e", fontWeight: 700 }}>Your account is waiting for owner approval. You can browse products but cannot add or sell items until approved.</div>
            </div>
          </div>
        )}

        {status === "rejected" && (
          <div style={{ background: "#fef2f2", borderRadius: 12, padding: 16, marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>🚫</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: 15, color: "#991b1b" }}>Account Rejected</div>
              <div style={{ fontSize: 13, color: "#991b1b", fontWeight: 700 }}>Your seller account has been rejected by the owner. Please contact support.</div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <TabBtn id="overview" label="Overview" />
          {status === "approved" && (
            <>
              <TabBtn id="products" label={`Products (${products.length})`} />
              <TabBtn id="orders" label={`Orders (${pendingOrders})`} />
              <TabBtn id="settings" label="Store Settings" />
            </>
          )}
        </div>

        {/* ── TAB: Overview ────────────────────────────── */}
        {tab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Total Products", value: products.length, color: "#e0e7ff" },
                { label: "Active Products", value: products.filter((p) => p.available).length, color: "#d1fae5" },
                { label: "Pending Orders", value: pendingOrders, color: "#fef3c7" },
                { label: "Completed Orders", value: orders.filter((o) => o.status === "delivered").length, color: "#dbeafe" },
                { label: "Total Earnings", value: `₹${totalEarnings}`, color: "#f3e8ff" },
              ].map((s) => (
                <div key={s.label} style={{ background: s.color, borderRadius: 12, padding: 18, textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "#1f2937" }}>{s.value}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#4b5563", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {products.length === 0 && (
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <button onClick={seedDemoData} style={{ padding: "12px 24px", borderRadius: 8, border: "none", background: "#22C55E", color: "white", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
                  🌱 Seed Demo Data (products + settings)
                </button>
                <div style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 700, marginTop: 6 }}>One-click to add sample products and store settings for testing</div>
              </div>
            )}

            {orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--color-text-muted)", fontWeight: 700, background: "var(--color-surface)", borderRadius: 12, border: "1px solid var(--color-border)" }}>
                No orders yet. Orders will appear here when buyers purchase your products.
              </div>
            ) : (
              <div style={{ background: "var(--color-surface)", borderRadius: 12, border: "1px solid var(--color-border)", padding: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Recent Orders</h3>
                {orders.slice(0, 5).map((o) => (
                  <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--color-border)" }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>{o.id}</div>
                      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 700 }}>{o.buyerName} &middot; ₹{o.total}</div>
                    </div>
                    <span style={{ padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 800, background: statusColors[o.status], color: "#374151" }}>{o.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Products (Add + List) ───────────────── */}
        {tab === "products" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <button onClick={resetProductForm} style={{ padding: "8px 16px", borderRadius: 8, border: "none", fontWeight: 800, fontSize: 13, cursor: "pointer", background: !editingId ? "var(--color-primary)" : "#e5e7eb", color: !editingId ? "white" : "#374151" }}>Add New</button>
              <button onClick={() => { resetProductForm(); setEditingId("__list__"); }} style={{ padding: "8px 16px", borderRadius: 8, border: "none", fontWeight: 800, fontSize: 13, cursor: "pointer", background: editingId === "__list__" ? "var(--color-primary)" : "#e5e7eb", color: editingId === "__list__" ? "white" : "#374151" }}>All Products</button>
            </div>

            {!editingId && (
              <form onSubmit={handleProductSubmit} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Add New Product</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>Product Name *</label>
                    <input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} placeholder="e.g. Fresh Apples" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14 }} required />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>Category</label>
                    <select value={cats.some((c) => c.name === productForm.category) ? productForm.category : "__custom__"} onChange={(e) => setProductForm({ ...productForm, category: e.target.value === "__custom__" ? "" : e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14, background: "white" }}>
                      {cats.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                      <option value="__custom__">+ Custom</option>
                    </select>
                    {(productForm.category === "" || !cats.some((c) => c.name === productForm.category)) && (
                      <input value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} placeholder="Type your custom category" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14, marginTop: 6 }} />
                    )}
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>Brand</label>
                    <input value={productForm.brand} onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })} placeholder="e.g. Tata, Amul" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14 }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>SKU / Item Code</label>
                    <input value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} placeholder="e.g. FRU-APP-001" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14 }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>Selling Price (₹) *</label>
                    <input type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} placeholder="e.g. 99" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14 }} required min={0} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>MRP (₹) *</label>
                    <input type="number" value={productForm.mrp} onChange={(e) => setProductForm({ ...productForm, mrp: e.target.value })} placeholder="e.g. 120" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14 }} required min={0} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>Stock (Qty)</label>
                    <input type="number" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} placeholder="e.g. 100" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14 }} min={0} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>Unit</label>
                    <input value={productForm.unit} onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })} placeholder="e.g. 1 kg, 500 g, 1 L" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14 }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>Product Photo</label>
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ fontSize: 13, width: "100%" }} />
                    {imgPreview && (
                      <div style={{ marginTop: 6, position: "relative", display: "inline-block" }}>
                        <img src={imgPreview} alt="Preview" style={{ width: 80, height: 80, borderRadius: 8, objectFit: "cover", border: "1px solid var(--color-border)" }} />
                        <button type="button" onClick={handleRemoveImage} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", border: "none", background: "#ef4444", color: "white", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>Tags (comma-separated)</label>
                    <input value={productForm.tags} onChange={(e) => setProductForm({ ...productForm, tags: e.target.value })} placeholder="e.g. organic, fresh, premium" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14 }} />
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>Description</label>
                  <textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} rows={3} placeholder="Full product description..." style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14, resize: "vertical" }} />
                </div>

                <div style={{ marginTop: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>Highlights (one per line)</label>
                  <textarea value={productForm.highlights} onChange={(e) => setProductForm({ ...productForm, highlights: e.target.value })} rows={3} placeholder="100% Organic&#10;Farm Fresh&#10;Direct from Farmer" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14, resize: "vertical" }} />
                </div>

                <div style={{ marginTop: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>Product Videos</label>
                  <input type="file" accept="video/*" multiple onChange={handleVideoUpload} style={{ fontSize: 13, width: "100%" }} />
                  {videoFiles.length > 0 && (
                    <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
                      {videoFiles.map((v, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "var(--color-text-secondary)" }}>
                          <span>🎬 {v.name}</span>
                          <button type="button" onClick={() => handleRemoveVideo(i)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14, fontWeight: 800 }}>Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button type="submit" style={{ marginTop: 16, padding: "12px 28px", borderRadius: 8, border: "none", background: "var(--color-primary)", color: "white", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>Add Product</button>
              </form>
            )}

            {editingId === "__list__" && (
              <div>
                {products.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 60, color: "var(--color-text-muted)", fontWeight: 700 }}>No products yet. Add your first product!</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {products.map((p) => {
                      const discount = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
                      return (
                        <div key={p.id} style={{ display: "flex", gap: 16, alignItems: "center", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 16 }}>
                          <img src={p.img} alt={p.name} style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover", background: "#f3f4f6" }} />
                          <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: 15 }}>{p.name}</div>
                        <div style={{ fontSize: 13, color: "var(--color-text-secondary)", fontWeight: 700 }}>₹{p.price} <span style={{ textDecoration: "line-through", color: "#9ca3af" }}>₹{p.mrp}</span> {discount > 0 && <span style={{ color: "var(--color-primary)" }}>{discount}% off</span>}</div>
                        <div style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 700 }}>{p.brand ? `${p.brand} · ` : ""}{p.category} · {p.unit} · Stock: {p.stock} · {p.available ? "Available" : "Hidden"}</div>
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => toggleAvailability(p.id)} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--color-border)", background: p.available ? "#fef3c7" : "#d1fae5", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>{p.available ? "Hide" : "Show"}</button>
                            <button onClick={() => handleEditProduct(p)} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--color-border)", background: "#e0e7ff", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>Edit</button>
                            <button onClick={() => handleDeleteProduct(p.id)} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #fecaca", background: "#fef2f2", color: "#991b1b", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>Delete</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {editingId && editingId !== "__list__" && (
              <form onSubmit={handleProductSubmit} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Edit Product</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>Product Name *</label>
                    <input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14 }} required />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>Category</label>
                    <select value={cats.some((c) => c.name === productForm.category) ? productForm.category : "__custom__"} onChange={(e) => setProductForm({ ...productForm, category: e.target.value === "__custom__" ? "" : e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14, background: "white" }}>
                      {cats.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                      <option value="__custom__">+ Custom</option>
                    </select>
                    {(productForm.category === "" || !cats.some((c) => c.name === productForm.category)) && (
                      <input value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} placeholder="Type your custom category" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14, marginTop: 6 }} />
                    )}
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>Brand</label>
                    <input value={productForm.brand} onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14 }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>SKU / Item Code</label>
                    <input value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14 }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>Selling Price (₹) *</label>
                    <input type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14 }} required min={0} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>MRP (₹) *</label>
                    <input type="number" value={productForm.mrp} onChange={(e) => setProductForm({ ...productForm, mrp: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14 }} required min={0} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>Stock (Qty)</label>
                    <input type="number" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14 }} min={0} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>Unit</label>
                    <input value={productForm.unit} onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14 }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>Product Photo</label>
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ fontSize: 13, width: "100%" }} />
                    {imgPreview && (
                      <div style={{ marginTop: 6, position: "relative", display: "inline-block" }}>
                        <img src={imgPreview} alt="Preview" style={{ width: 80, height: 80, borderRadius: 8, objectFit: "cover", border: "1px solid var(--color-border)" }} />
                        <button type="button" onClick={handleRemoveImage} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", border: "none", background: "#ef4444", color: "white", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>Tags (comma-separated)</label>
                    <input value={productForm.tags} onChange={(e) => setProductForm({ ...productForm, tags: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14 }} />
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>Description</label>
                  <textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} rows={3} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14, resize: "vertical" }} />
                </div>

                <div style={{ marginTop: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>Highlights (one per line)</label>
                  <textarea value={productForm.highlights} onChange={(e) => setProductForm({ ...productForm, highlights: e.target.value })} rows={3} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14, resize: "vertical" }} />
                </div>

                <div style={{ marginTop: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>Product Videos</label>
                  <input type="file" accept="video/*" multiple onChange={handleVideoUpload} style={{ fontSize: 13, width: "100%" }} />
                  {videoFiles.length > 0 && (
                    <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
                      {videoFiles.map((v, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "var(--color-text-secondary)" }}>
                          <span>🎬 {v.name}</span>
                          <button type="button" onClick={() => handleRemoveVideo(i)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14, fontWeight: 800 }}>Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button type="submit" style={{ padding: "12px 28px", borderRadius: 8, border: "none", background: "var(--color-primary)", color: "white", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>Update Product</button>
                  <button type="button" onClick={resetProductForm} style={{ padding: "12px 28px", borderRadius: 8, border: "1px solid var(--color-border)", background: "white", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ── TAB: Orders ──────────────────────────────── */}
        {tab === "orders" && (
          <div>
            {orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "var(--color-text-muted)", fontWeight: 700, background: "var(--color-surface)", borderRadius: 12, border: "1px solid var(--color-border)" }}>
                No orders received yet. Orders will appear here when buyers purchase your products.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {orders.map((o) => (
                  <div key={o.id} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 15 }}>{o.id}</div>
                        <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 700 }}>{new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                      <span style={{ padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 800, background: statusColors[o.status], color: "#374151" }}>{o.status.toUpperCase()}</span>
                    </div>

                    <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 10, marginBottom: 10 }}>
                      {o.items.filter((item) => item.sellerMobile === mobile).map((item) => (
                        <div key={item.productId} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                          <img src={item.img} alt={item.productName} style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", background: "#f3f4f6" }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{item.productName}</div>
                            <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>₹{item.price} x {item.quantity}</div>
                          </div>
                          <div style={{ fontWeight: 800, fontSize: 14 }}>₹{item.price * item.quantity}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 10, fontSize: 13, color: "var(--color-text-secondary)", fontWeight: 700, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                      <span>Buyer: {o.buyerName}</span>
                      <span>Phone: {o.buyerPhone}</span>
                      <span style={{ gridColumn: "1 / -1" }}>Address: {o.buyerAddress}, {o.buyerCity}, {o.buyerState} - {o.buyerPincode}</span>
                      <span style={{ gridColumn: "1 / -1", fontWeight: 900, fontSize: 15, color: "#1f2937" }}>Total: ₹{o.total}</span>
                    </div>

                    <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {(["pending", "confirmed", "shipped", "delivered", "cancelled"] as OrderStatus[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => handleOrderStatus(o.id, s)}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 6,
                            border: o.status === s ? "2px solid #1f2937" : "1px solid var(--color-border)",
                            background: statusColors[s],
                            fontWeight: 800,
                            fontSize: 12,
                            cursor: "pointer",
                            color: "#374151",
                            opacity: o.status === s ? 1 : 0.7,
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Store Settings ──────────────────────── */}
        {tab === "settings" && (
          <form onSubmit={handleSettingsSave} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Store Settings</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>Store Name</label>
                <input value={settings.storeName} onChange={(e) => setSettings({ ...settings, storeName: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>Store Logo URL</label>
                <input value={settings.storeLogo} onChange={(e) => setSettings({ ...settings, storeLogo: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>Delivery Radius (km)</label>
                <input value={settings.deliveryRadius} onChange={(e) => setSettings({ ...settings, deliveryRadius: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>UPI ID (for payments)</label>
                <input value={settings.upiId} onChange={(e) => setSettings({ ...settings, upiId: e.target.value })} placeholder="seller@upi" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14 }} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>Store Address</label>
                <input value={settings.storeAddress} onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })} placeholder="Your store location" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14 }} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>Store Description</label>
                <textarea value={settings.storeDescription} onChange={(e) => setSettings({ ...settings, storeDescription: e.target.value })} rows={3} placeholder="Welcome to my store!" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14, resize: "vertical" }} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>Return Policy</label>
                <input value={settings.returnPolicy} onChange={(e) => setSettings({ ...settings, returnPolicy: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14 }} />
              </div>
            </div>
            <button type="submit" style={{ marginTop: 16, padding: "12px 28px", borderRadius: 8, border: "none", background: "var(--color-primary)", color: "white", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>Save Settings</button>
          </form>
        )}
      </div>
    </div>
  );
}
