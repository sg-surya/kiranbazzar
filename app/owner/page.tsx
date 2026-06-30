"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  getAllProducts,
  getAllOrders,
  getAllUsers,
  updateUserStatus,
  toggleUserActiveStatus,
  updateOrderStatus,
  deleteSellerProduct,
  getAllCategories,
  saveAllCategories,
  getPlatformSettings,
  savePlatformSettings,
  saveUser,
  deleteUser,
  getSalesAnalytics,
  deleteOrder,
  deleteOrdersBeforeDate,
  getOrdersForSeller,
  SellerProduct,
  getSellerProducts,
  type StoredUser,
  type Order,
  type OrderStatus,
  type Category,
  type PlatformSettings,
  type AnyProduct,
  type DailySale,
  type MonthlySale,
} from "@/lib/data";

type OwnerTab = "overview" | "users" | "products" | "orders" | "categories";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 10,
  border: "1px solid var(--color-border)", background: "white",
  fontSize: 14, outline: "none", fontWeight: 600,
  transition: "border-color 0.2s, box-shadow 0.2s",
};

const statusColors: Record<string, string> = {
  pending: "#fef3c7", approved: "#d1fae5", rejected: "#fef2f2",
  confirmed: "#e0e7ff", shipped: "#dbeafe", delivered: "#d1fae5", cancelled: "#fef2f2",
};

function IconUsers() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>); }
function IconStore() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>); }
function IconPackage() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4 7.55 4.24" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" y1="22" x2="12" y2="12" /></svg>); }
function IconTrending() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>); }
function IconClock() { return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>); }
function IconCheck() { return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>); }
function IconX() { return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>); }
function IconTrash() { return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>); }
function IconEye() { return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>); }
function IconPlus() { return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>); }
function IconDollar() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>); }
function IconAlertCircle() { return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>); }
function IconSettings() { return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>); }
function IconTag() { return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>); }

const statCards = [
  { key: "users", icon: IconUsers, gradient: "linear-gradient(135deg, #e0e7ff, #c7d2fe)", value: "", label: "Total Users" },
  { key: "sellers", icon: IconStore, gradient: "linear-gradient(135deg, #d1fae5, #a7f3d0)", value: "", label: "Sellers (Approved)" },
  { key: "pending", icon: IconClock, gradient: "linear-gradient(135deg, #fef3c7, #fde68a)", value: "", label: "Pending Approval" },
  { key: "products", icon: IconPackage, gradient: "linear-gradient(135deg, #dbeafe, #bfdbfe)", value: "", label: "Total Products" },
  { key: "orders", icon: IconTrending, gradient: "linear-gradient(135deg, #f3e8ff, #e9d5ff)", value: "", label: "Total Orders" },
  { key: "revenue", icon: IconDollar, gradient: "linear-gradient(135deg, #fce7f3, #fbcfe8)", value: "", label: "Revenue" },
];

export default function OwnerPage() {
  const { loggedIn, role, name } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<OwnerTab>("overview");
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [allProducts, setAllProducts] = useState<AnyProduct[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [platForm, setPlatForm] = useState<PlatformSettings>({
    siteName: "Kirana Bazzar", deliveryFee: "0", contactPhone: "", contactEmail: "", aboutText: "",
  });
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ role: "seller" as "seller" | "dukandar", name: "", mobile: "", whatsapp: "", password: "", address: "", pincode: "", status: "approved" as "pending" | "approved" });
  const [dailySales, setDailySales] = useState<DailySale[]>([]);
  const [monthlySales, setMonthlySales] = useState<MonthlySale[]>([]);
  const [viewingSeller, setViewingSeller] = useState<string | null>(null);
  const [sellerProducts, setSellerProducts] = useState<SellerProduct[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [deleteBeforeDate, setDeleteBeforeDate] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [addUserError, setAddUserError] = useState<string | null>(null);

  async function loadData() {
    setUsers(await getAllUsers());
    setAllProducts(await getAllProducts());
    setAllOrders(await getAllOrders());
    setCats(await getAllCategories());
    setPlatForm(await getPlatformSettings());
    const analytics = await getSalesAnalytics();
    setDailySales(analytics.daily);
    setMonthlySales(analytics.monthly);
  }

  useEffect(() => {
    if (!loggedIn) { router.replace("/login"); return; }
    if (role !== "owner") { router.replace("/"); return; }
    loadData();
  }, [loggedIn, role, router]);

  if (!loggedIn || role !== "owner") return null;

  const pendingUsers = users.filter((u) => u.role !== "owner" && u.status === "pending").length;
  const approvedSellers = users.filter((u) => u.role === "seller" && u.status === "approved").length;
  const totalRevenue = allOrders.filter((o) => o.status === "delivered").reduce((s, o) => s + o.total, 0);

  async function handleApprove(mobile: string) { await updateUserStatus(mobile, "approved"); await loadData(); }
  async function handleReject(mobile: string) { await updateUserStatus(mobile, "rejected"); await loadData(); }
  async function handleAddUser() {
    const mob = newUser.mobile.replace(/\D/g, "");
    if (!newUser.name.trim() || mob.length !== 10 || !newUser.password.trim()) {
      alert("Name, valid 10-digit mobile, and password are required.");
      return;
    }
    if (users.some((u) => u.mobileNumber === mob)) {
      alert("A user with this mobile number already exists.");
      return;
    }
    setAddUserError(null);
    const wa = newUser.whatsapp.replace(/\D/g, "");
    const profile: StoredUser = {
      role: newUser.role,
      mobileNumber: mob,
      password: newUser.password.trim(),
      status: newUser.status,
      name: newUser.role === "seller" ? newUser.name.trim() : undefined,
      dukanName: newUser.role === "dukandar" ? newUser.name.trim() : undefined,
      address: newUser.address.trim() || "N/A",
      pincode: newUser.pincode || "000000",
      whatsappNumber: wa.length >= 10 ? wa : undefined,
    };
    try {
      await saveUser(profile);
      setShowAddUser(false);
      setNewUser({ role: "seller", name: "", mobile: "", whatsapp: "", password: "", address: "", pincode: "", status: "approved" });
      await loadData();
    } catch (e) {
      setAddUserError(e instanceof Error ? e.message : "Failed to create user");
    }
  }

  async function handleDeleteUser(mobile: string) {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    await deleteUser(mobile);
    await loadData();
  }
  async function handleOrderStatus(orderId: string, status: OrderStatus) { await updateOrderStatus(orderId, status); await loadData(); }
  async function handleDeleteProduct(id: string) { if (!confirm("Delete this product?")) return; await deleteSellerProduct(id); await loadData(); }
  async function handleDeleteOrder(orderId: string) { if (!confirm("Delete this order?")) return; await deleteOrder(orderId); await loadData(); }
  async function handleDeleteBeforeDate() {
    if (!deleteBeforeDate) return;
    if (!confirm(`Delete all orders before ${deleteBeforeDate}? This cannot be undone.`)) return;
    const count = await deleteOrdersBeforeDate(deleteBeforeDate);
    alert(`Deleted ${count} order${count !== 1 ? "s" : ""}.`);
    setDeleteBeforeDate("");
    await loadData();
  }

  async function handleAddCategory(name: string) {
    if (!name.trim() || cats.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())) return;
    await saveAllCategories([...cats, { name: name.trim(), icon: "custom" }]);
    await loadData();
  }
  async function handleRemoveCategory(name: string) {
    if (!confirm(`Remove category "${name}"?`)) return;
    await saveAllCategories(cats.filter((c) => c.name !== name));
    await loadData();
  }

  async function handleSettingsSave(e: React.FormEvent) {
    e.preventDefault();
    await savePlatformSettings(platForm);
    alert("Platform settings saved!");
  }

  const tabs: { id: OwnerTab; label: string; badge?: number; icon: React.FC }[] = [
    { id: "overview", label: "Overview", icon: IconTrending },
    { id: "users", label: "Users", badge: pendingUsers || undefined, icon: IconUsers },
    { id: "products", label: "Products", icon: IconPackage },
    { id: "orders", label: "Orders", icon: IconTag },
    { id: "categories", label: "Categories", icon: IconStore },
  ];

  return (
    <div className="page-slide-enter has-bottom-nav" style={{ background: "var(--color-bg)", minHeight: "100vh" }}>
      {/* Premium Header Banner */}
      <div style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)", padding: "24px 16px 32px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-40%", right: "-20%", width: 250, height: 250, borderRadius: "50%", background: "rgba(255,255,255,0.08)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-30%", left: "-10%", width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1000, margin: "0 auto", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <Link href="/" className="btn-premium btn-premium-ghost btn-premium-sm" style={{ color: "rgba(255,255,255,0.8)", marginBottom: 12, width: "fit-content", padding: "6px 14px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                Back to Store
              </Link>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: "white", letterSpacing: "-0.5px" }}>{showSettings ? "Platform Settings" : tab === "overview" ? "Overview" : tabs.find((t) => t.id === tab)?.label || "Owner Dashboard"}</h1>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", fontWeight: 600, marginTop: 4 }}>Welcome, {name || "Owner"} &middot; Full platform control</p>
            </div>
            <button onClick={() => setShowSettings(!showSettings)} style={{ width: 40, height: 40, borderRadius: 12, border: "none", background: showSettings ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white", transition: "background 0.2s", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 16px 90px", marginTop: -20, position: "relative" }}>

        {showSettings ? (
          <div className="fade-in">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <button onClick={() => setShowSettings(false)} className="btn-premium btn-premium-ghost btn-premium-sm" style={{ padding: "8px 12px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
              </button>
              <IconSettings />
              <h3 style={{ fontSize: 18, fontWeight: 900 }}>Platform Settings</h3>
            </div>
            <div className="glass-card" style={{ padding: 24, maxWidth: 500, border: "none" }}>
              <form onSubmit={handleSettingsSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 6 }}>Site Name</label>
                  <input value={platForm.siteName} onChange={(e) => setPlatForm({ ...platForm, siteName: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 6 }}>Delivery Fee (₹)</label>
                  <input value={platForm.deliveryFee} onChange={(e) => setPlatForm({ ...platForm, deliveryFee: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 6 }}>Contact Phone</label>
                  <input value={platForm.contactPhone} onChange={(e) => setPlatForm({ ...platForm, contactPhone: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 6 }}>Contact Email</label>
                  <input value={platForm.contactEmail} onChange={(e) => setPlatForm({ ...platForm, contactEmail: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 6 }}>About Text</label>
                  <textarea value={platForm.aboutText} onChange={(e) => setPlatForm({ ...platForm, aboutText: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                </div>
                <button type="submit" className="btn-premium btn-premium-primary" style={{ alignSelf: "flex-start" }}>Save Settings</button>
              </form>
            </div>
          </div>
        ) : (
        <>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div>
            <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
              {statCards.map((s) => {
                const vals: Record<string, string> = {
                  users: String(users.length), sellers: String(approvedSellers),
                  pending: String(pendingUsers), products: String(allProducts.length),
                  orders: String(allOrders.length), revenue: `₹${totalRevenue}`,
                };
                return (
                  <div key={s.key} className="scale-in" style={{ background: s.gradient, borderRadius: 14, padding: 16, boxShadow: "var(--shadow-sm)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151" }}>
                        <s.icon />
                      </div>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#1f2937", letterSpacing: "-0.3px" }}>{vals[s.key] || "0"}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#4b5563", marginTop: 2 }}>{s.label}</div>
                  </div>
                );
              })}
            </div>

            {pendingUsers > 0 && (
              <div className="fade-in" style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)", borderRadius: 14, padding: "14px 18px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "var(--shadow-sm)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <IconAlertCircle />
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 14, color: "#92400e" }}>{pendingUsers} user{pendingUsers > 1 ? "s" : ""} pending approval</div>
                    <div style={{ fontSize: 12, color: "#92400e", fontWeight: 600 }}>Go to Users tab to review.</div>
                  </div>
                </div>
                <button onClick={() => setTab("users")} className="btn-premium btn-premium-primary btn-premium-sm">Review</button>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div className="glass-card" style={{ padding: 16, border: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  <h3 style={{ fontSize: 14, fontWeight: 800 }}>Daily Sales (Last 7)</h3>
                </div>
                {dailySales.length === 0 ? (
                  <div style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 700, textAlign: "center", padding: 16 }}>No sales data yet.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {dailySales.slice(0, 7).map((d) => (
                      <div key={d.date} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, padding: "4px 0", borderBottom: "1px solid var(--color-border-light)" }}>
                        <span style={{ color: "var(--color-text-secondary)" }}>{new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                        <span style={{ color: "#1f2937" }}>₹{d.total} <span style={{ color: "var(--color-text-muted)", fontWeight: 600 }}>({d.count})</span></span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="glass-card" style={{ padding: 16, border: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                  <h3 style={{ fontSize: 14, fontWeight: 800 }}>Monthly Sales</h3>
                </div>
                {monthlySales.length === 0 ? (
                  <div style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 700, textAlign: "center", padding: 16 }}>No sales data yet.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {monthlySales.map((m) => (
                      <div key={m.month} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, padding: "4px 0", borderBottom: "1px solid var(--color-border-light)" }}>
                        <span style={{ color: "var(--color-text-secondary)" }}>{m.month}</span>
                        <span style={{ color: "#1f2937" }}>₹{m.total} <span style={{ color: "var(--color-text-muted)", fontWeight: 600 }}>({m.count})</span></span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="glass-card" style={{ padding: 16, border: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                <h3 style={{ fontSize: 16, fontWeight: 800 }}>Recent Orders</h3>
              </div>
              {allOrders.length === 0 ? (
                <div style={{ textAlign: "center", padding: 30, color: "var(--color-text-muted)", fontWeight: 700 }}>No orders yet.</div>
              ) : (
                allOrders.slice(0, 5).map((o) => (
                  <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--color-border)" }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14, fontFamily: "monospace" }}>#{o.id.slice(0, 8)}</div>
                      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 600 }}>{o.buyerName} &middot; ₹{o.total} &middot; {o.items.length} item{o.items.length > 1 ? "s" : ""}</div>
                    </div>
                    <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800, background: statusColors[o.status] || "#f3f4f6", color: "#374151" }}>{o.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {tab === "users" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setShowAddUser((v) => !v)} className={showAddUser ? "btn-premium btn-premium-secondary" : "btn-premium btn-premium-primary"}>
                {showAddUser ? "Cancel" : <><IconPlus /> Add User</>}
              </button>
            </div>

            {showAddUser && (
              <div className="glass-card fade-in" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12, border: "none" }}>
                <h4 style={{ fontSize: 15, fontWeight: 800 }}>Add New User</h4>
                {addUserError && (
                  <div style={{ background: "var(--color-danger-light)", color: "#991b1b", border: "1px solid rgba(239, 68, 68, 0.35)", padding: "10px 12px", borderRadius: 10, fontWeight: 800, fontSize: 13 }}>
                    {addUserError}
                  </div>
                )}
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setNewUser({ ...newUser, role: "seller" })} className="btn-premium btn-premium-sm" style={{ flex: 1, border: `2px solid ${newUser.role === "seller" ? "var(--color-primary)" : "var(--color-border)"}`, background: newUser.role === "seller" ? "var(--color-primary-lighter)" : "white", color: "#374151" }}>Seller</button>
                  <button onClick={() => setNewUser({ ...newUser, role: "dukandar" })} className="btn-premium btn-premium-sm" style={{ flex: 1, border: `2px solid ${newUser.role === "dukandar" ? "var(--color-primary)" : "var(--color-border)"}`, background: newUser.role === "dukandar" ? "var(--color-primary-lighter)" : "white", color: "#374151" }}>Dukandar</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder={newUser.role === "seller" ? "Name" : "Dukan Name"} style={inputStyle} />
                  <input value={newUser.mobile} onChange={(e) => setNewUser({ ...newUser, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder="Mobile Number" inputMode="numeric" style={inputStyle} />
                </div>
                <input value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Password" type="password" style={inputStyle} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <input value={newUser.pincode} onChange={(e) => setNewUser({ ...newUser, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} placeholder="Pincode" inputMode="numeric" style={inputStyle} />
                  <input value={newUser.whatsapp} onChange={(e) => setNewUser({ ...newUser, whatsapp: e.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder="WhatsApp (optional)" inputMode="numeric" style={inputStyle} />
                  <select value={newUser.status} onChange={(e) => setNewUser({ ...newUser, status: e.target.value as "pending" | "approved" })} style={inputStyle}>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <input value={newUser.address} onChange={(e) => setNewUser({ ...newUser, address: e.target.value })} placeholder="Address" style={inputStyle} />
                <button onClick={handleAddUser} className="btn-premium btn-premium-primary" style={{ alignSelf: "flex-end" }}>Create User</button>
              </div>
            )}

{users.length === 0 ? (
              <div className="glass-card" style={{ textAlign: "center", padding: 60, color: "var(--color-text-muted)", fontWeight: 700, border: "none" }}>No users registered.</div>
            ) : (
              users.map((u) => (
                <div key={u.mobileNumber} className="glass-card fade-in" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", border: "none" }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: u.role === "owner" ? "linear-gradient(135deg, #fef3c7, #fde68a)" : u.role === "seller" ? "linear-gradient(135deg, #dbeafe, #bfdbfe)" : "linear-gradient(135deg, #d1fae5, #a7f3d0)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, color: "#374151", flexShrink: 0 }}>
                    {(u.name || u.dukanName || "?").slice(0, 1).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{u.name || u.dukanName || "Unknown"}</div>
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 600 }}>
                      <span style={{ color: u.role === "owner" ? "#d97706" : u.role === "seller" ? "#2563eb" : "#059669", fontWeight: 800 }}>{u.role.toUpperCase()}</span> &middot; {u.mobileNumber}
                      {u.status === "pending" ? <span style={{ color: "#d97706", marginLeft: 6 }}>&middot; Pending</span> : ""}
                      {u.role === "seller" && (u.isActive === false ? <span style={{ color: "#ef4444", marginLeft: 6 }}>&middot; Inactive</span> : <span style={{ color: "#059669", marginLeft: 6 }}>&middot; Active</span>)}
                    </div>
                  </div>
                  <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800, background: statusColors[u.status] || "#f3f4f6", color: "#374151" }}>{u.status.toUpperCase()}</span>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {u.role === "seller" && (
                      <button onClick={async () => {
                        await toggleUserActiveStatus(u.mobileNumber, !(u.isActive !== false));
                        await loadData();
                      }} className="btn-premium btn-premium-sm" style={{ 
                        background: u.isActive === false ? "linear-gradient(135deg, #fef2f2, #fee2e2)" : "linear-gradient(135deg, #d1fae5, #a7f3d0)", 
                        color: u.isActive === false ? "#991b1b" : "#059669",
                        border: "none",
                        fontWeight: 800,
                        fontSize: 11,
                      }}>
                        {u.isActive === false ? "Activate" : "Deactivate"}
                      </button>
                    )}
                    {u.role === "seller" && (
                      <button onClick={async () => {
                        setViewingSeller(viewingSeller === u.mobileNumber ? null : u.mobileNumber);
                        if (viewingSeller !== u.mobileNumber) {
                          setSellerProducts(await getSellerProducts(u.mobileNumber));
                          setSellerOrders(await getOrdersForSeller(u.mobileNumber));
                        }
                      }} className="btn-premium btn-premium-ghost btn-premium-sm" style={{ background: "#f3e8ff", color: "#6d28d9", border: "none" }}>
                        {viewingSeller === u.mobileNumber ? "Hide" : <><IconEye /> View</>}
                      </button>
                    )}
                    {u.role !== "owner" && u.status !== "approved" && <button onClick={() => handleApprove(u.mobileNumber)} className="btn-premium btn-premium-primary btn-premium-sm" style={{ display: "flex", alignItems: "center", gap: 4 }}><IconCheck /> Approve</button>}
                    {u.role !== "owner" && u.status !== "rejected" && <button onClick={() => handleReject(u.mobileNumber)} className="btn-premium btn-premium-danger btn-premium-sm" style={{ display: "flex", alignItems: "center", gap: 4 }}><IconX /> Reject</button>}
                    {u.role !== "owner" && <button onClick={() => handleDeleteUser(u.mobileNumber)} className="btn-premium btn-premium-ghost btn-premium-sm" style={{ display: "flex", alignItems: "center", gap: 4, color: "#991b1b" }}><IconTrash /> Delete</button>}
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{u.name || u.dukanName || "Unknown"}</div>
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 600 }}>
                      <span style={{ color: u.role === "owner" ? "#d97706" : u.role === "seller" ? "#2563eb" : "#059669", fontWeight: 800 }}>{u.role.toUpperCase()}</span> &middot; {u.mobileNumber}
                      {u.status === "pending" ? <span style={{ color: "#d97706", marginLeft: 6 }}>&middot; Pending</span> : ""}
                    </div>
                  </div>
                  <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800, background: statusColors[u.status] || "#f3f4f6", color: "#374151" }}>{u.status.toUpperCase()}</span>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {u.role === "seller" && (
                      <button onClick={async () => {
                        setViewingSeller(viewingSeller === u.mobileNumber ? null : u.mobileNumber);
                        if (viewingSeller !== u.mobileNumber) {
                          setSellerProducts(await getSellerProducts(u.mobileNumber));
                          setSellerOrders(await getOrdersForSeller(u.mobileNumber));
                        }
                      }} className="btn-premium btn-premium-ghost btn-premium-sm" style={{ background: "#f3e8ff", color: "#6d28d9", border: "none" }}>
                        {viewingSeller === u.mobileNumber ? "Hide" : <><IconEye /> View</>}
                      </button>
                    )}
                    {u.role !== "owner" && u.status !== "approved" && <button onClick={() => handleApprove(u.mobileNumber)} className="btn-premium btn-premium-primary btn-premium-sm" style={{ display: "flex", alignItems: "center", gap: 4 }}><IconCheck /> Approve</button>}
                    {u.role !== "owner" && u.status !== "rejected" && <button onClick={() => handleReject(u.mobileNumber)} className="btn-premium btn-premium-danger btn-premium-sm" style={{ display: "flex", alignItems: "center", gap: 4 }}><IconX /> Reject</button>}
                    {u.role !== "owner" && <button onClick={() => handleDeleteUser(u.mobileNumber)} className="btn-premium btn-premium-ghost btn-premium-sm" style={{ display: "flex", alignItems: "center", gap: 4, color: "#991b1b" }}><IconTrash /> Delete</button>}
                  </div>
                  {viewingSeller === u.mobileNumber && (
                    <div className="fade-in" style={{ width: "100%", marginTop: 8, background: "var(--color-bg)", borderRadius: 12, padding: 14 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8, marginBottom: 10 }}>
                        <div style={{ background: "linear-gradient(135deg, #e0e7ff, #c7d2fe)", borderRadius: 10, padding: 12, textAlign: "center" }}>
                          <div style={{ fontSize: 20, fontWeight: 900 }}>{sellerProducts.length}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#4b5563" }}>Products</div>
                        </div>
                        <div style={{ background: "linear-gradient(135deg, #d1fae5, #a7f3d0)", borderRadius: 10, padding: 12, textAlign: "center" }}>
                          <div style={{ fontSize: 20, fontWeight: 900 }}>{sellerOrders.filter((o) => o.status === "delivered").length}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#4b5563" }}>Delivered</div>
                        </div>
                        <div style={{ background: "linear-gradient(135deg, #f3e8ff, #e9d5ff)", borderRadius: 10, padding: 12, textAlign: "center" }}>
                          <div style={{ fontSize: 20, fontWeight: 900 }}>₹{sellerOrders.filter((o) => o.status === "delivered").reduce((s, o) => s + o.total, 0)}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#4b5563" }}>Earnings</div>
                        </div>
                        <div style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)", borderRadius: 10, padding: 12, textAlign: "center" }}>
                          <div style={{ fontSize: 20, fontWeight: 900 }}>{sellerOrders.filter((o) => o.status !== "delivered" && o.status !== "cancelled").length}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#4b5563" }}>Active Orders</div>
                        </div>
                      </div>
                      {sellerOrders.length > 0 && (
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 6 }}>Recent Orders</div>
                          {sellerOrders.slice(0, 3).map((o) => (
                            <div key={o.id} style={{ fontSize: 12, fontWeight: 700, display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--color-border)" }}>
                              <span>{o.id.slice(0, 8)}... &mdash; {o.buyerName}</span>
                              <span style={{ color: o.status === "delivered" ? "var(--color-primary)" : o.status === "cancelled" ? "#ef4444" : "#f59e0b" }}>₹{o.total} &middot; {o.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── PRODUCTS ── */}
        {tab === "products" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {allProducts.length === 0 ? (
              <div className="glass-card" style={{ textAlign: "center", padding: 60, color: "var(--color-text-muted)", fontWeight: 700, border: "none" }}>No products.</div>
            ) : (
              allProducts.map((p) => {
                const isSeller = "sellerMobile" in p;
                const discount = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
                return (
                  <div key={p.id} className="glass-card" style={{ padding: 12, display: "flex", gap: 12, alignItems: "center", border: "none" }}>
                    <img src={p.img} alt={p.name} style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover", background: "#f3f4f6" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 600 }}>₹{p.price} &middot; {p.category}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: isSeller ? "#6366f1" : "var(--color-text-muted)" }}>{p.sellerName || "Kirana Bazzar"}{isSeller ? " (Seller)" : " (Platform)"}</div>
                      {discount > 0 && <span style={{ fontSize: 10, color: "white", background: "var(--color-discount)", padding: "2px 7px", borderRadius: 6, fontWeight: 800, marginTop: 4, display: "inline-block" }}>{discount}% off</span>}
                    </div>
                    {isSeller && <button onClick={() => handleDeleteProduct(p.id)} className="btn-premium btn-premium-ghost btn-premium-sm" style={{ color: "#991b1b", border: "1px solid #fecaca", display: "flex", alignItems: "center", gap: 4 }}><IconTrash /> Delete</button>}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── ORDERS ── */}
        {tab === "orders" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)", borderRadius: 12, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <IconTrash />
              <span style={{ fontWeight: 800, fontSize: 13, color: "#92400e" }}>Bulk Delete:</span>
              <input type="date" value={deleteBeforeDate} onChange={(e) => setDeleteBeforeDate(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 13, fontWeight: 700 }} />
              <button onClick={handleDeleteBeforeDate} disabled={!deleteBeforeDate} className={deleteBeforeDate ? "btn-premium btn-premium-danger btn-premium-sm" : "btn-premium btn-premium-ghost btn-premium-sm"}>Delete All Before</button>
            </div>

            {allOrders.length === 0 ? (
              <div className="glass-card" style={{ textAlign: "center", padding: 60, color: "var(--color-text-muted)", fontWeight: 700, border: "none" }}>No orders placed yet.</div>
            ) : (
              allOrders.map((o) => (
                <div key={o.id} className="glass-card fade-in" style={{ padding: 16, border: "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14, fontFamily: "monospace" }}>#{o.id.slice(0, 8)}</div>
                      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 600 }}>{new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                    <span style={{ padding: "4px 12px", borderRadius: 8, fontSize: 11, fontWeight: 800, background: statusColors[o.status] || "#f3f4f6", color: "#374151" }}>{o.status.toUpperCase()}</span>
                  </div>
                  <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 10, marginBottom: 10 }}>
                    {o.items.map((item) => (
                      <div key={item.productId} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                        <img src={item.img} alt={item.productName} style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", background: "#f3f4f6" }} />
                        <div style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{item.productName} <span style={{ color: "var(--color-text-secondary)", fontWeight: 600 }}>x{item.quantity}</span></div>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>₹{item.price * item.quantity}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 10, fontSize: 13, color: "var(--color-text-secondary)", fontWeight: 600, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                    <span>Buyer: <strong style={{ color: "#1f2937" }}>{o.buyerName}</strong></span>
                    <span>Phone: <strong style={{ color: "#1f2937" }}>{o.buyerPhone}</strong></span>
                    <span>Payment: {o.paymentMethod === "cod" ? "Cash on Delivery" : "UPI / Online"}</span>
                    <span>OTP: <strong style={{ color: "#1f2937" }}>{o.otp || "N/A"}</strong></span>
                    <span style={{ gridColumn: "1 / -1" }}>Address: {o.buyerAddress}, {o.buyerCity}, {o.buyerState} - {o.buyerPincode}</span>
                    <span style={{ gridColumn: "1 / -1", fontWeight: 900, fontSize: 16, color: "#1f2937" }}>Total: ₹{o.total}</span>
                  </div>
                  <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    {(["pending", "confirmed", "shipped", "delivered", "cancelled"] as OrderStatus[]).map((s) => (
                      <button key={s} onClick={() => handleOrderStatus(o.id, s)} className="btn-premium btn-premium-ghost btn-premium-sm" style={{
                        border: o.status === s ? "2px solid #1f2937" : "1px solid var(--color-border)",
                        background: statusColors[s] || "#f3f4f6", opacity: o.status === s ? 1 : 0.7,
                      }}>{s}</button>
                    ))}
                    <button onClick={() => handleDeleteOrder(o.id)} className="btn-premium btn-premium-ghost btn-premium-sm" style={{ border: "1px solid #fecaca", color: "#991b1b", marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}><IconTrash /> Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── CATEGORIES ── */}
        {tab === "categories" && (
          <div className="fade-in">
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <AddCategoryInput onAdd={handleAddCategory} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {cats.map((c) => (
                <div key={c.name} className="glass-card" style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, border: "none" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-primary)" }} />
                  <span style={{ fontWeight: 800, fontSize: 14 }}>{c.name}</span>
                  <button onClick={() => handleRemoveCategory(c.name)} className="btn-premium btn-premium-ghost btn-premium-sm" style={{ color: "#ef4444", padding: "2px 6px", minWidth: 0 }}>
                    <IconX />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        </>
        )}

        <div style={{ height: 40 }} />
      </div>

      {/* Fixed Bottom Tab Bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 400, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderTop: "1px solid var(--color-border)", boxShadow: "0 -4px 20px rgba(0,0,0,0.06)", padding: "6px 0 env(safe-area-inset-bottom, 6px)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-around" }}>
          {tabs.map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "12px 8px", border: "none", background: isActive ? "rgba(5,150,105,0.1)" : "transparent", borderRadius: 12, cursor: "pointer", color: isActive ? "var(--color-primary)" : "var(--color-text-muted)", transition: "all 0.2s", position: "relative", WebkitTapHighlightColor: "transparent" }}
              >
                <div style={{ position: "relative", transform: "scale(1.35)", display: "flex" }}>
                  <t.icon />
                  {t.badge ? <span style={{ position: "absolute", top: -8, right: -12, background: "#ef4444", color: "white", fontSize: 9, fontWeight: 700, width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white", lineHeight: 1 }}>{t.badge > 9 ? "9+" : t.badge}</span> : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AddCategoryInput({ onAdd }: { onAdd: (name: string) => void }) {
  const [val, setVal] = useState("");
  return (
    <div style={{ display: "flex", gap: 8, width: "100%", maxWidth: 400 }}>
      <input value={val} onChange={(e) => setVal(e.target.value)} placeholder="New category name" style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid var(--color-border)", fontSize: 14, outline: "none", fontWeight: 600 }} />
      <button onClick={() => { if (val.trim()) { onAdd(val); setVal(""); } }} className="btn-premium btn-premium-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}><IconPlus /> Add</button>
    </div>
  );
}
