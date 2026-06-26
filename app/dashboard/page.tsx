"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { playClickSound } from "@/lib/sounds";
import {
  SellerProduct,
  getSellerProducts,
  saveSellerProduct,
  deleteSellerProduct,
  getAllCategories,
  saveAllCategories,
  getOrdersForSeller,
  updateOrderStatus,
  verifyDeliveryOTP,
  getStoreSettings,
  saveStoreSettings,
  getSellerInventoryStats,
  toggleSellerOnlineStatus,
  ORDER_STEPS,
  getOrderProgressIndex,
  type Order,
  type OrderStatus,
  type StoreSettings,
  type Category,
  type InventoryStats,
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

  if (status === "rejected" || role === "dukandar") {
    return (
      <div className="checkout-container">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", textAlign: "center", padding: 24 }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={status === "rejected" ? "#ef4444" : "#f59e0b"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2 style={{ fontSize: 22, fontWeight: 900, marginTop: 16, color: "#1f2937" }}>{status === "rejected" ? "Account Rejected" : "Access Denied"}</h2>
          <p style={{ fontSize: 15, color: "var(--color-text-secondary)", fontWeight: 700, marginTop: 8, maxWidth: 400, lineHeight: 1.5 }}>
            {status === "rejected" ? "Your account has been rejected by the platform owner." : "Only sellers can access the dashboard."}
          </p>
          <Link href="/" style={{ marginTop: 20, padding: "12px 28px", borderRadius: 8, background: "var(--color-primary)", color: "white", fontWeight: 800, fontSize: 15, textDecoration: "none" }}>Go to Home</Link>
        </div>
      </div>
    );
  }

  const [tab, setTab] = useState<Tab>("overview");
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
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
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [otpErrors, setOtpErrors] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: "My Store",
    storeDescription: "",
    storeLogo: "/product_atta.png",
    deliveryRadius: "10",
    returnPolicy: "7-day return accepted",
    upiId: "",
    upiQr: "",
    storeAddress: "",
    isOnline: true,
  });
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(null);

  const loadData = useCallback(async () => {
    setProducts(await getSellerProducts(mobile || undefined));
    setCats(await getAllCategories());
    if (mobile) {
      setOrders(await getOrdersForSeller(mobile));
      setSettings(await getStoreSettings(mobile));
      setInventoryStats(await getSellerInventoryStats(mobile));
    }
  }, [mobile]);

  useEffect(() => {
    if (!loggedIn) { router.replace("/login"); return; }
    if (role !== "seller") { router.replace("/"); return; }
    loadData();
  }, [loggedIn, role, router, loadData]);

  const totalEarnings = useMemo(() =>
    orders.filter((o) => o.status === "delivered").reduce((sum, o) => sum + o.total, 0),
    [orders]
  );
  const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "confirmed" || o.status === "shipped").length;

  if (!loggedIn || role !== "seller") return null;

  function resetProductForm() {
    setProductForm({ name: "", description: "", price: "", mrp: "", category: "Grocery", unit: "1 kg", img: "", videos: "", brand: "", stock: "100", sku: "", tags: "", highlights: "" });
    setImgPreview(null);
    setVideoFiles([]);
    setEditingId(null);
    setSuccessMsg(null);
  }

  async function handleProductSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productForm.name.trim() || !productForm.price || !productForm.mrp) return;
    if (submitting) return;
    setSubmitting(true);

    const product: SellerProduct = {
      id: editingId || crypto.randomUUID(),
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
      soldCount: 0,
      sku: productForm.sku.trim(),
      tags: productForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
      highlights: productForm.highlights.split("\n").map((h) => h.trim()).filter(Boolean),
      sellerMobile: mobile || "",
      sellerName: name || "Seller",
      available: true,
      createdAt: editingId ? (products.find((p) => p.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
    };

    try {
      await saveSellerProduct(product);
    } catch (e) {
      alert("Failed to save product: " + (e instanceof Error ? e.message : "Unknown error"));
      setSubmitting(false);
      return;
    }

    await loadData();
    resetProductForm();
    setSubmitting(false);
    setSuccessMsg(editingId ? "Product updated!" : "Product added!");
    setTimeout(() => setSuccessMsg(null), 2500);
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

  async function handleDeleteProduct(id: string) {
    if (!confirm("Delete this product?")) return;
    await deleteSellerProduct(id);
    await loadData();
  }

  async function toggleAvailability(id: string) {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    p.available = !p.available;
    await saveSellerProduct(p);
    await loadData();
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Please select an image file."); return; }
    if (file.size > MAX_IMAGE_SIZE) { alert("Image too large. Max 2MB allowed."); return; }
    const data = await readFileAsDataURL(file);
    setImgPreview(data);
  }

  function handleRemoveImage() { setImgPreview(null); }

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

  function handleRemoveVideo(index: number) { setVideoFiles((prev) => prev.filter((_, i) => i !== index)); }

  async function handleOrderStatusChange(orderId: string, status: OrderStatus) {
    await updateOrderStatus(orderId, status);
    await loadData();
  }

  async function handleOTPDelivery(orderId: string) {
    const otp = otpInputs[orderId];
    if (!otp || otp.length !== 6) {
      setOtpErrors((prev) => ({ ...prev, [orderId]: "Please enter a valid 6-digit OTP" }));
      return;
    }
    const ok = await verifyDeliveryOTP(orderId, otp);
    if (ok) {
      setOtpErrors((prev) => ({ ...prev, [orderId]: "" }));
      setOtpInputs((prev) => ({ ...prev, [orderId]: "" }));
      await loadData();
    } else {
      setOtpErrors((prev) => ({ ...prev, [orderId]: "Invalid OTP. Please check with the buyer." }));
    }
  }

  const statusColors: Record<OrderStatus, string> = {
    pending: "#fef3c7", confirmed: "#e0e7ff", shipped: "#dbeafe", delivered: "#d1fae5", cancelled: "#fef2f2",
  };

  async function handleSettingsSave(e: React.FormEvent) {
    e.preventDefault();
    if (!mobile) return;
    await saveStoreSettings(mobile, settings);
    alert("Store settings saved!");
  }

  function TabBtn({ id, label }: { id: Tab; label: string }) {
    return (
      <button
        onClick={() => { if (id === "products") { resetProductForm(); setEditingId("__list__"); } setTab(id); }}
        style={{
          padding: "10px 18px", borderRadius: 8, border: "none", fontWeight: 800, fontSize: 13,
          cursor: "pointer", background: tab === id ? "var(--color-primary)" : "#e5e7eb",
          color: tab === id ? "white" : "#374151", whiteSpace: "nowrap",
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

        {tab === "overview" && (
          <div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
              <div style={{ flex: 1, fontSize: 16, fontWeight: 800, color: "var(--color-text)" }}>Store Status</div>
              <button
                onClick={async () => {
                  if (!mobile) return;
                  const next = !settings.isOnline;
                  const ok = await toggleSellerOnlineStatus(mobile, next);
                  if (ok) setSettings({ ...settings, isOnline: next });
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 18px", borderRadius: 20, border: "none",
                  background: settings.isOnline ? "#d1fae5" : "#fef2f2",
                  color: settings.isOnline ? "#065f46" : "#991b1b",
                  fontWeight: 800, fontSize: 13, cursor: "pointer",
                }}
              >
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: settings.isOnline ? "#22C55E" : "#ef4444", display: "inline-block" }} />
                {settings.isOnline ? "Online — Accepting Orders" : "Offline"}
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Total Products", value: inventoryStats?.totalProducts ?? products.length, color: "#e0e7ff" },
                { label: "Active Products", value: inventoryStats?.activeProducts ?? products.filter((p) => p.available).length, color: "#d1fae5" },
                { label: "Sold Units", value: inventoryStats?.soldUnits ?? 0, color: "#f3e8ff" },
                { label: "Remaining Stock", value: inventoryStats?.remainingStock ?? 0, color: "#dbeafe" },
                { label: "Out of Stock", value: inventoryStats?.outOfStock ?? 0, color: inventoryStats && inventoryStats.outOfStock > 0 ? "#fef2f2" : "#d1fae5" },
                { label: "Pending Orders", value: pendingOrders, color: "#fef3c7" },
                { label: "Completed Orders", value: orders.filter((o) => o.status === "delivered").length, color: "#dbeafe" },
                { label: "Total Earnings", value: `₹${totalEarnings}`, color: "#f3e8ff" },
              ].map((s) => (
                <div key={s.label} style={{ background: s.color, borderRadius: 12, padding: 16, textAlign: "center" }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: "#1f2937" }}>{s.value}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#4b5563", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div style={{ background: "var(--color-surface)", borderRadius: 12, border: "1px solid var(--color-border)", padding: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>📍 Delivery Info</h3>
                <div style={{ fontSize: 13, color: "var(--color-text-secondary)", fontWeight: 700, display: "flex", flexDirection: "column", gap: 4 }}>
                  <span>Radius: <strong style={{ color: "#1f2937" }}>{settings.deliveryRadius} km</strong></span>
                  {settings.storeAddress && <span>Address: <strong style={{ color: "#1f2937" }}>{settings.storeAddress}</strong></span>}
                  <span>UPI: <strong style={{ color: "#1f2937" }}>{settings.upiId || "Not set"}</strong></span>
                </div>
              </div>
              <div style={{ background: "var(--color-surface)", borderRadius: 12, border: "1px solid var(--color-border)", padding: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>📊 Quick Actions</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <button onClick={() => { resetProductForm(); setTab("products"); }} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#e0e7ff", fontWeight: 800, fontSize: 12, cursor: "pointer", textAlign: "left" }}>+ Add Product</button>
                  <button onClick={() => setTab("orders")} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#fef3c7", fontWeight: 800, fontSize: 12, cursor: "pointer", textAlign: "left" }}>📦 View Orders ({pendingOrders})</button>
                  <button onClick={() => setTab("settings")} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#f3e8ff", fontWeight: 800, fontSize: 12, cursor: "pointer", textAlign: "left" }}>⚙️ Store Settings</button>
                </div>
              </div>
            </div>

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

        {tab === "products" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <button onClick={resetProductForm} style={{ padding: "8px 16px", borderRadius: 8, border: "none", fontWeight: 800, fontSize: 13, cursor: "pointer", background: !editingId ? "var(--color-primary)" : "#e5e7eb", color: !editingId ? "white" : "#374151" }}>Add New</button>
              <button onClick={() => { resetProductForm(); setEditingId("__list__"); }} style={{ padding: "8px 16px", borderRadius: 8, border: "none", fontWeight: 800, fontSize: 13, cursor: "pointer", background: editingId === "__list__" ? "var(--color-primary)" : "#e5e7eb", color: editingId === "__list__" ? "white" : "#374151" }}>All Products</button>
            </div>

            {successMsg && (
              <div style={{ background: "#d1fae5", color: "#065f46", borderRadius: 12, padding: 14, marginBottom: 16, fontWeight: 800, fontSize: 14, textAlign: "center", animation: "successPop 0.4s ease" }}>
                ✅ {successMsg}
              </div>
            )}

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

                <button type="submit" disabled={submitting} style={{ marginTop: 16, padding: "12px 28px", borderRadius: 8, border: "none", background: submitting ? "#9ca3af" : "var(--color-primary)", color: "white", fontWeight: 800, fontSize: 15, cursor: submitting ? "not-allowed" : "pointer" }}>{submitting ? "Saving..." : "Add Product"}</button>
              </form>
            )}

            {editingId === "__list__" && (
              <div>
                {products.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 60, color: "var(--color-text-muted)", fontWeight: 700 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
                    <div style={{ fontSize: 16, marginBottom: 16 }}>No products yet. Start adding your products!</div>
                    <button onClick={resetProductForm} style={{ padding: "12px 28px", borderRadius: 8, border: "none", background: "var(--color-primary)", color: "white", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>+ Add Product</button>
                  </div>
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
                  <button type="submit" disabled={submitting} style={{ padding: "12px 28px", borderRadius: 8, border: "none", background: submitting ? "#9ca3af" : "var(--color-primary)", color: "white", fontWeight: 800, fontSize: 15, cursor: submitting ? "not-allowed" : "pointer" }}>{submitting ? "Saving..." : "Update Product"}</button>
                  <button type="button" onClick={resetProductForm} style={{ padding: "12px 28px", borderRadius: 8, border: "1px solid var(--color-border)", background: "white", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        )}

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

                    <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 10, display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
                      {o.buyerPhoto && (
                        <img src={o.buyerPhoto} alt="Dukan" style={{ width: 50, height: 50, borderRadius: 8, objectFit: "cover", border: "1px solid var(--color-border)", flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, fontSize: 13, color: "var(--color-text-secondary)", fontWeight: 700, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                        <span>Buyer: <strong style={{ color: "#1f2937" }}>{o.buyerName}</strong></span>
                        <span>Phone: <strong style={{ color: "#1f2937" }}>{o.buyerPhone}</strong></span>
                        {o.buyerDukanName && <span style={{ gridColumn: "1 / -1" }}>Dukan: <strong style={{ color: "#1f2937" }}>{o.buyerDukanName}</strong></span>}
                        <span>Payment: {o.paymentMethod === "cod" ? "Cash on Delivery" : "UPI / Online"}</span>
                        <span>Status: {o.status.toUpperCase()}</span>
                        <span style={{ gridColumn: "1 / -1" }}>Address: {o.buyerAddress}, {o.buyerCity}, {o.buyerState} - {o.buyerPincode}</span>
                        <span style={{ gridColumn: "1 / -1", fontWeight: 900, fontSize: 15, color: "#1f2937" }}>Total: ₹{o.total}</span>
                      </div>
                    </div>

                    <OrderProgress status={o.status} />

                    <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      {(["pending", "confirmed", "shipped", "cancelled"] as OrderStatus[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => { playClickSound(); handleOrderStatusChange(o.id, s); }}
                          style={{
                            padding: "6px 14px", borderRadius: 6,
                            border: o.status === s ? "2px solid #1f2937" : "1px solid var(--color-border)",
                            background: statusColors[s], fontWeight: 800, fontSize: 12,
                            cursor: "pointer", color: "#374151", opacity: o.status === s ? 1 : 0.7,
                          }}
                        >
                          {s}
                        </button>
                      ))}
                      {o.status !== "delivered" && o.status !== "cancelled" && (
                        <div style={{ display: "flex", gap: 6, alignItems: "center", marginLeft: 8 }}>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="Enter OTP"
                            value={otpInputs[o.id] || ""}
                            onChange={(e) => {
                              setOtpInputs((prev) => ({ ...prev, [o.id]: e.target.value.replace(/\D/g, "").slice(0, 6) }));
                              setOtpErrors((prev) => ({ ...prev, [o.id]: "" }));
                            }}
                            style={{
                              width: 110, padding: "6px 10px", borderRadius: 6, border: "1px solid var(--color-border)",
                              fontSize: 14, fontWeight: 800, textAlign: "center", letterSpacing: 4,
                            }}
                          />
                          <button
                            onClick={() => { playClickSound(); handleOTPDelivery(o.id); }}
                            style={{
                              padding: "6px 14px", borderRadius: 6, border: "none",
                              background: "#d1fae5", color: "#065f46", fontWeight: 800, fontSize: 12,
                              cursor: "pointer",
                            }}
                          >
                            Verify & Deliver
                          </button>
                        </div>
                      )}
                      {o.status === "delivered" && (
                        <span style={{ padding: "6px 14px", borderRadius: 6, background: "#d1fae5", color: "#065f46", fontWeight: 800, fontSize: 12 }}>✅ Delivered</span>
                      )}
                      {otpErrors[o.id] && (
                        <div style={{ width: "100%", fontSize: 12, color: "#ef4444", fontWeight: 700, marginTop: 4 }}>{otpErrors[o.id]}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>UPI QR Code</label>
                <input type="file" accept="image/*" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 2 * 1024 * 1024) { alert("Image too large. Max 2MB."); return; }
                  const reader = new FileReader();
                  reader.onload = () => setSettings({ ...settings, upiQr: reader.result as string });
                  reader.readAsDataURL(file);
                }} style={{ fontSize: 13, width: "100%" }} />
                {settings.upiQr && (
                  <div style={{ marginTop: 6, position: "relative", display: "inline-block" }}>
                    <img src={settings.upiQr} alt="UPI QR" style={{ width: 100, height: 100, borderRadius: 8, objectFit: "contain", border: "1px solid var(--color-border)" }} />
                    <button type="button" onClick={() => setSettings({ ...settings, upiQr: "" })} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", border: "none", background: "#ef4444", color: "white", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                  </div>
                )}
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
