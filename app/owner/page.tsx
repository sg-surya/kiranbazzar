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
  updateOrderStatus,
  deleteSellerProduct,
  getAllCategories,
  saveAllCategories,
  getPlatformSettings,
  savePlatformSettings,
  saveUser,
  type StoredUser,
  type Order,
  type OrderStatus,
  type Category,
  type PlatformSettings,
  type AnyProduct,
} from "@/lib/data";

type OwnerTab = "overview" | "users" | "products" | "orders" | "categories" | "settings";

const statusColors: Record<string, string> = {
  pending: "#fef3c7", approved: "#d1fae5", rejected: "#fef2f2",
  confirmed: "#e0e7ff", shipped: "#dbeafe", delivered: "#d1fae5", cancelled: "#fef2f2",
};

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

  async function loadData() {
    setUsers(await getAllUsers());
    setAllProducts(await getAllProducts());
    setAllOrders(await getAllOrders());
    setCats(await getAllCategories());
    setPlatForm(await getPlatformSettings());
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
    await saveUser(profile);
    setShowAddUser(false);
    setNewUser({ role: "seller", name: "", mobile: "", whatsapp: "", password: "", address: "", pincode: "", status: "approved" });
    await loadData();
  }

  async function handleDeleteUser(mobile: string) {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    const supabase = (await import("@/lib/supabase/client")).createClient();
    await supabase.from("profiles").delete().eq("mobile_number", mobile);
    await loadData();
  }
  async function handleOrderStatus(orderId: string, status: OrderStatus) { await updateOrderStatus(orderId, status); await loadData(); }
  async function handleDeleteProduct(id: string) { if (!confirm("Delete this product?")) return; await deleteSellerProduct(id); await loadData(); }

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

  const stats = [
    { label: "Total Users", value: users.length, color: "#e0e7ff" },
    { label: "Sellers (Approved)", value: approvedSellers, color: "#d1fae5" },
    { label: "Pending Approval", value: pendingUsers, color: "#fef3c7" },
    { label: "Total Products", value: allProducts.length, color: "#dbeafe" },
    { label: "Total Orders", value: allOrders.length, color: "#f3e8ff" },
    { label: "Revenue (Delivered)", value: `₹${totalRevenue}`, color: "#fce7f3" },
  ];

  const tabs: { id: OwnerTab; label: string; badge?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "users", label: "Users", badge: pendingUsers || undefined },
    { id: "products", label: "Products" },
    { id: "orders", label: "Orders" },
    { id: "categories", label: "Categories" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div style={{ padding: 16 }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
          <div>
            <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-muted)", textDecoration: "none" }}>&larr; Back to Store</Link>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--color-text)", marginTop: 4 }}>Owner Dashboard</h1>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", fontWeight: 700 }}>Welcome, {name || "Owner"} &middot; Full platform control</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "10px 16px", borderRadius: 8, border: "none", fontWeight: 800, fontSize: 13,
                cursor: "pointer", background: tab === t.id ? "#22C55E" : "#e5e7eb",
                color: tab === t.id ? "white" : "#374151", whiteSpace: "nowrap", position: "relative",
              }}
            >
              {t.label}
              {t.badge ? <span style={{ marginLeft: 6, background: "#ef4444", color: "white", padding: "2px 7px", borderRadius: 4, fontSize: 11 }}>{t.badge}</span> : null}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
              {stats.map((s) => (
                <div key={s.label} style={{ background: s.color, borderRadius: 12, padding: 16, textAlign: "center" }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: "#1f2937" }}>{s.value}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#4b5563", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {pendingUsers > 0 && (
              <div style={{ background: "#fef3c7", borderRadius: 12, padding: 16, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 15, color: "#92400e" }}>{pendingUsers} user{pendingUsers > 1 ? "s" : ""} pending approval</div>
                  <div style={{ fontSize: 13, color: "#92400e", fontWeight: 700 }}>Go to Users tab to review.</div>
                </div>
                <button onClick={() => setTab("users")} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#f59e0b", color: "white", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>Review</button>
              </div>
            )}

            <div style={{ background: "var(--color-surface)", borderRadius: 12, border: "1px solid var(--color-border)", padding: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Recent Orders</h3>
              {allOrders.length === 0 ? (
                <div style={{ textAlign: "center", padding: 30, color: "var(--color-text-muted)", fontWeight: 700 }}>No orders yet.</div>
              ) : (
                allOrders.slice(0, 5).map((o) => (
                  <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--color-border)" }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>{o.id}</div>
                      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 700 }}>{o.buyerName} &middot; ₹{o.total} &middot; {o.items.length} item{o.items.length > 1 ? "s" : ""}</div>
                    </div>
                    <span style={{ padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 800, background: statusColors[o.status] || "#f3f4f6", color: "#374151" }}>{o.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === "users" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setShowAddUser((v) => !v)} style={{ padding: "10px 18px", borderRadius: 8, border: "none", background: showAddUser ? "#6b7280" : "#22C55E", color: "white", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
                {showAddUser ? "Cancel" : "+ Add User"}
              </button>
            </div>

            {showAddUser && (
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
                <h4 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Add New User</h4>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setNewUser({ ...newUser, role: "seller" })} style={{ flex: 1, padding: "8px 12px", borderRadius: 6, border: `1px solid ${newUser.role === "seller" ? "#22C55E" : "var(--color-border)"}`, background: newUser.role === "seller" ? "#d1fae5" : "white", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>Seller</button>
                  <button onClick={() => setNewUser({ ...newUser, role: "dukandar" })} style={{ flex: 1, padding: "8px 12px", borderRadius: 6, border: `1px solid ${newUser.role === "dukandar" ? "#22C55E" : "var(--color-border)"}`, background: newUser.role === "dukandar" ? "#d1fae5" : "white", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>Dukandar</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder={newUser.role === "seller" ? "Name" : "Dukan Name"} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 13 }} />
                  <input value={newUser.mobile} onChange={(e) => setNewUser({ ...newUser, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder="Mobile Number" inputMode="numeric" style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 13 }} />
                </div>
                <input value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Password" type="password" style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 13 }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <input value={newUser.pincode} onChange={(e) => setNewUser({ ...newUser, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} placeholder="Pincode" inputMode="numeric" style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 13 }} />
                  <input value={newUser.whatsapp} onChange={(e) => setNewUser({ ...newUser, whatsapp: e.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder="WhatsApp (optional)" inputMode="numeric" style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 13 }} />
                  <select value={newUser.status} onChange={(e) => setNewUser({ ...newUser, status: e.target.value as "pending" | "approved" })} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 13, background: "white" }}>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <input value={newUser.address} onChange={(e) => setNewUser({ ...newUser, address: e.target.value })} placeholder="Address" style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 13 }} />
                <button onClick={handleAddUser} style={{ alignSelf: "flex-end", padding: "10px 24px", borderRadius: 8, border: "none", background: "#22C55E", color: "white", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>Create User</button>
              </div>
            )}

            {users.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "var(--color-text-muted)", fontWeight: 700, background: "var(--color-surface)", borderRadius: 12, border: "1px solid var(--color-border)" }}>No users registered.</div>
            ) : (
              users.map((u) => (
                <div key={u.mobileNumber} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 14, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: u.role === "owner" ? "#fef3c7" : u.role === "seller" ? "#dbeafe" : "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15, color: "#374151", flexShrink: 0 }}>
                    {(u.name || u.dukanName || "?").slice(0, 1).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{u.name || u.dukanName || "Unknown"}</div>
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 700 }}>{u.role.toUpperCase()} &middot; {u.mobileNumber}{u.status === "pending" ? " · ⏳ Pending" : ""}</div>
                  </div>
                  <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 800, background: statusColors[u.status] || "#f3f4f6", color: "#374151" }}>{u.status.toUpperCase()}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    {u.role !== "owner" && u.status !== "approved" && <button onClick={() => handleApprove(u.mobileNumber)} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#22C55E", color: "white", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>Approve</button>}
                    {u.role !== "owner" && u.status !== "rejected" && <button onClick={() => handleReject(u.mobileNumber)} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#ef4444", color: "white", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>Reject</button>}
                    {u.role !== "owner" && <button onClick={() => handleDeleteUser(u.mobileNumber)} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #fecaca", background: "#fef2f2", color: "#991b1b", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>Delete</button>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "products" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {allProducts.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "var(--color-text-muted)", fontWeight: 700, background: "var(--color-surface)", borderRadius: 12, border: "1px solid var(--color-border)" }}>No products.</div>
            ) : (
              allProducts.map((p) => {
                const isSeller = "sellerMobile" in p;
                const discount = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
                return (
                  <div key={p.id} style={{ display: "flex", gap: 12, alignItems: "center", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 12 }}>
                    <img src={p.img} alt={p.name} style={{ width: 50, height: 50, borderRadius: 8, objectFit: "cover", background: "#f3f4f6" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 700 }}>₹{p.price} &middot; {p.category}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: isSeller ? "#6366f1" : "var(--color-text-muted)" }}>{p.sellerName || "Kirana Bazzar"}{isSeller ? " (Seller)" : " (Platform)"}</div>
                      {discount > 0 && <div style={{ fontSize: 11, color: "#22C55E", fontWeight: 800 }}>{discount}% off</div>}
                    </div>
                    {isSeller && <button onClick={() => handleDeleteProduct(p.id)} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #fecaca", background: "#fef2f2", color: "#991b1b", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>Delete</button>}
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === "orders" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {allOrders.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "var(--color-text-muted)", fontWeight: 700, background: "var(--color-surface)", borderRadius: 12, border: "1px solid var(--color-border)" }}>No orders placed yet.</div>
            ) : (
              allOrders.map((o) => (
                <div key={o.id} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15 }}>{o.id}</div>
                      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 700 }}>{new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                    <span style={{ padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 800, background: statusColors[o.status] || "#f3f4f6", color: "#374151" }}>{o.status.toUpperCase()}</span>
                  </div>
                  <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 10, marginBottom: 10 }}>
                    {o.items.map((item) => (
                      <div key={item.productId} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                        <img src={item.img} alt={item.productName} style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover", background: "#f3f4f6" }} />
                        <div style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{item.productName} <span style={{ color: "var(--color-text-secondary)", fontWeight: 700 }}>x{item.quantity}</span></div>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>₹{item.price * item.quantity}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 10, fontSize: 13, color: "var(--color-text-secondary)", fontWeight: 700, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                    <span>Buyer: {o.buyerName}</span>
                    <span>Phone: {o.buyerPhone}</span>
                    <span style={{ gridColumn: "1 / -1" }}>Address: {o.buyerAddress}, {o.buyerCity}, {o.buyerState} - {o.buyerPincode}</span>
                    <span style={{ gridColumn: "1 / -1", fontWeight: 900, fontSize: 16, color: "#1f2937" }}>Total: ₹{o.total}</span>
                  </div>
                  <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {(["pending", "confirmed", "shipped", "delivered", "cancelled"] as OrderStatus[]).map((s) => (
                      <button key={s} onClick={() => handleOrderStatus(o.id, s)} style={{
                        padding: "5px 12px", borderRadius: 6, border: o.status === s ? "2px solid #1f2937" : "1px solid var(--color-border)",
                        background: statusColors[s] || "#f3f4f6", fontWeight: 800, fontSize: 11, cursor: "pointer", color: "#374151", opacity: o.status === s ? 1 : 0.7,
                      }}>{s}</button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "categories" && (
          <div>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <AddCategoryInput onAdd={handleAddCategory} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {cats.map((c) => (
                <div key={c.name} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: 800, fontSize: 14 }}>{c.name}</span>
                  <button onClick={() => handleRemoveCategory(c.name)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16, fontWeight: 800, padding: 0 }}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "settings" && (
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 20, maxWidth: 500 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Platform Settings</h3>
            <form onSubmit={handleSettingsSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>Site Name</label>
                <input value={platForm.siteName} onChange={(e) => setPlatForm({ ...platForm, siteName: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>Delivery Fee (₹)</label>
                <input value={platForm.deliveryFee} onChange={(e) => setPlatForm({ ...platForm, deliveryFee: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>Contact Phone</label>
                <input value={platForm.contactPhone} onChange={(e) => setPlatForm({ ...platForm, contactPhone: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>Contact Email</label>
                <input value={platForm.contactEmail} onChange={(e) => setPlatForm({ ...platForm, contactEmail: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 4 }}>About Text</label>
                <textarea value={platForm.aboutText} onChange={(e) => setPlatForm({ ...platForm, aboutText: e.target.value })} rows={3} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14, resize: "vertical" }} />
              </div>
              <button type="submit" style={{ padding: "12px 24px", borderRadius: 8, border: "none", background: "#22C55E", color: "white", fontWeight: 800, fontSize: 14, cursor: "pointer", alignSelf: "flex-start" }}>Save Settings</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function AddCategoryInput({ onAdd }: { onAdd: (name: string) => void }) {
  const [val, setVal] = useState("");
  return (
    <div style={{ display: "flex", gap: 8, width: "100%", maxWidth: 400 }}>
      <input value={val} onChange={(e) => setVal(e.target.value)} placeholder="New category name" style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 14 }} />
      <button onClick={() => { if (val.trim()) { onAdd(val); setVal(""); } }} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "#22C55E", color: "white", fontWeight: 800, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>+ Add</button>
    </div>
  );
}
