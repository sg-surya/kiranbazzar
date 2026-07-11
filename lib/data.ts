import { createClient } from "@/lib/supabase/client";

export interface Product {
  id: string;
  name: string;
  price: number;
  mrp: number;
  img: string;
  images?: string[];
  videos?: string[];
  sellerName?: string;
  ecard?: {
    title: string;
    subtitle?: string;
    badgeText?: string;
  };
  rating: string;
  category: string;
  description: string;
  highlights: string[];
}

export interface Category {
  name: string;
  icon: string;
}

export const categories: Category[] = [
  { name: "Grocery", icon: "grocery" },
  { name: "Atta & Dal", icon: "wheat" },
  { name: "Oil & Ghee", icon: "oil" },
  { name: "Spices", icon: "spice" },
  { name: "Snacks", icon: "snack" },
  { name: "Beverages", icon: "beverage" },
  { name: "Personal Care", icon: "care" },
  { name: "Household", icon: "household" },
];

export async function getAllCategories(): Promise<Category[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase.from("categories").select("name, icon").order("name");
    if (data && data.length > 0) return data;
  } catch {}
  return categories;
}

export async function saveAllCategories(cats: Category[]): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.from("categories").delete().neq("name", "__nonexistent__");
    const { error } = await supabase.from("categories").insert(cats.map((c) => ({ name: c.name, icon: c.icon })));
    if (error) throw error;
  } catch (e) {
    console.error("saveAllCategories error:", e);
    throw e;
  }
}

export type PlatformSettings = {
  siteName: string;
  deliveryFee: string;
  contactPhone: string;
  contactEmail: string;
  aboutText: string;
};

export async function getPlatformSettings(): Promise<PlatformSettings> {
  try {
    const supabase = createClient();
    const { data } = await supabase.from("platform_settings").select("*").maybeSingle();
    if (data) {
      return {
        siteName: data.site_name || "Kirana Bazzar",
        deliveryFee: data.delivery_fee || "0",
        contactPhone: data.contact_phone || "",
        contactEmail: data.contact_email || "",
        aboutText: data.about_text || "",
      };
    }
  } catch {}
  return { siteName: "Kirana Bazzar", deliveryFee: "0", contactPhone: "", contactEmail: "", aboutText: "" };
}

export async function savePlatformSettings(s: PlatformSettings): Promise<void> {
  try {
    const supabase = createClient();
    const { data: existing } = await supabase.from("platform_settings").select("id").maybeSingle();
    if (existing) {
      await supabase.from("platform_settings").update({
        site_name: s.siteName,
        delivery_fee: s.deliveryFee,
        contact_phone: s.contactPhone,
        contact_email: s.contactEmail,
        about_text: s.aboutText,
        updated_at: new Date().toISOString(),
      }).eq("id", existing.id);
    } else {
      await supabase.from("platform_settings").insert({
        site_name: s.siteName,
        delivery_fee: s.deliveryFee,
        contact_phone: s.contactPhone,
        contact_email: s.contactEmail,
        about_text: s.aboutText,
      });
    }
  } catch {}
}

export const products: Product[] = [];

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export async function getAnyProductById(id: string): Promise<Product | SellerProduct | undefined> {
  const supabase = createClient();
  const { data: plat } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (plat) return mapProduct(plat);
  const { data: seller } = await supabase.from("seller_products").select("*").eq("id", id).maybeSingle();
  if (seller) return mapSellerProduct(seller);
  return getProductById(id);
}

export type SellerProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  mrp: number;
  img: string;
  videos: string[];
  category: string;
  unit: string;
  brand: string;
  stock: number;
  soldCount: number;
  sku: string;
  tags: string[];
  highlights: string[];
  sellerMobile: string;
  sellerName: string;
  available: boolean;
  createdAt: string;
};

export type AnyProduct = Product | SellerProduct;

export async function getSellerProducts(sellerMobile?: string): Promise<SellerProduct[]> {
  const supabase = createClient();
  let query = supabase.from("seller_products").select("*").order("created_at", { ascending: false });
  if (sellerMobile) {
    query = query.eq("seller_mobile", sellerMobile);
  }
  const { data } = await query;
  return (data || []).map(mapSellerProduct);
}

export async function saveSellerProduct(product: SellerProduct): Promise<void> {
  const res = await fetch("/api/seller-products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to save product");
  }
}

export async function deleteSellerProduct(id: string): Promise<void> {
  const res = await fetch(`/api/seller-products?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to delete product");
  }
}

export async function getAllProducts(): Promise<(Product | SellerProduct)[]> {
  const supabase = createClient();
  const [platRes, sellerRes] = await Promise.all([
    supabase.from("products").select("*"),
    supabase.from("seller_products").select("*").eq("available", true),
  ]);
  const plat = (platRes.data || []).map(mapProduct);
  const seller = (sellerRes.data || []).map(mapSellerProduct);
  return [...plat, ...seller];
}

/* ── Orders ───────────────────────────────────────────── */

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

export const ORDER_STEPS: { key: OrderStatus; label: string }[] = [
  { key: "pending", label: "Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

export function getOrderProgressIndex(status: OrderStatus): number {
  if (status === "cancelled") return -1;
  return ORDER_STEPS.findIndex((s) => s.key === status);
}

export type PaymentMethod = "cod" | "upi";

export type OrderItem = {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  img: string;
  sellerMobile: string;
};

export type Order = {
  id: string;
  items: OrderItem[];
  buyerName: string;
  buyerDukanName: string;
  buyerPhone: string;
  buyerAddress: string;
  buyerCity: string;
  buyerState: string;
  buyerPincode: string;
  buyerLatitude?: number;
  buyerLongitude?: number;
  buyerPhoto: string;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  otp: string;
  createdAt: string;
};

export async function getAllOrders(): Promise<Order[]> {
  const supabase = createClient();
  const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  return (data || []).map(mapOrder);
}

export async function saveOrder(order: Order): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("orders").insert({
    id: order.id,
    items: order.items,
    buyer_name: order.buyerName,
    buyer_dukan_name: order.buyerDukanName,
    buyer_phone: order.buyerPhone,
    buyer_address: order.buyerAddress,
    buyer_city: order.buyerCity,
    buyer_state: order.buyerState,
    buyer_pincode: order.buyerPincode,
    buyer_latitude: order.buyerLatitude || null,
    buyer_longitude: order.buyerLongitude || null,
    buyer_photo: order.buyerPhoto,
    total: order.total,
    status: order.status,
    payment_method: order.paymentMethod,
    otp: order.otp,
    created_at: order.createdAt,
  });
  if (error) {
    const { error: error2 } = await supabase.from("orders").insert({
      id: order.id,
      items: order.items,
      buyer_name: order.buyerName,
      buyer_dukan_name: order.buyerDukanName,
      buyer_phone: order.buyerPhone,
      buyer_address: order.buyerAddress,
      buyer_city: order.buyerCity,
      buyer_state: order.buyerState,
      buyer_pincode: order.buyerPincode,
      buyer_latitude: order.buyerLatitude || null,
      buyer_longitude: order.buyerLongitude || null,
      buyer_photo: order.buyerPhoto,
      total: order.total,
      status: order.status,
      created_at: order.createdAt,
    });
    if (error2) {
      console.error("saveOrder failed (both attempts):", JSON.stringify(error2));
      return false;
    }
  }
  return true;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
  if (error) {
    console.error("updateOrderStatus failed:", error);
    return false;
  }
  return true;
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function verifyDeliveryOTP(orderId: string, otp: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase.from("orders").select("otp").eq("id", orderId).maybeSingle();
  if (error || !data) return false;
  if (data.otp === otp) {
    const { error: updateError } = await supabase.from("orders").update({ status: "delivered" }).eq("id", orderId);
    if (updateError) {
      console.error("verifyDeliveryOTP update failed:", updateError);
      return false;
    }
    return true;
  }
  return false;
}

export async function getOrdersForSeller(mobile: string): Promise<Order[]> {
  const orders = await getAllOrders();
  return orders.filter((o) => o.items.some((item) => item.sellerMobile === mobile));
}

export async function getOrdersForBuyer(phone: string): Promise<Order[]> {
  const orders = await getAllOrders();
  return orders.filter((o) => o.buyerPhone === phone);
}

/* ── Inventory Management ─────────────────────────────── */

export async function decrementProductStock(productId: string, quantity: number): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: product } = await supabase.from("seller_products").select("stock, sold_count").eq("id", productId).maybeSingle();
    if (!product) return false;
    const newStock = Math.max(0, (product.stock || 0) - quantity);
    const newSold = (product.sold_count || 0) + quantity;
    const updates: Record<string, any> = { stock: newStock, sold_count: newSold };
    if (newStock <= 0) updates.available = false;
    const { error } = await supabase.from("seller_products").update(updates).eq("id", productId);
    return !error;
  } catch { return false; }
}

export type InventoryStats = {
  totalProducts: number;
  activeProducts: number;
  soldUnits: number;
  remainingStock: number;
  outOfStock: number;
};

export async function getSellerInventoryStats(mobile: string): Promise<InventoryStats> {
  const products = await getSellerProducts(mobile);
  const stats: InventoryStats = {
    totalProducts: products.length,
    activeProducts: products.filter((p) => p.available).length,
    soldUnits: products.reduce((s, p) => s + (p.soldCount || 0), 0),
    remainingStock: products.reduce((s, p) => s + (p.stock || 0), 0),
    outOfStock: products.filter((p) => p.stock <= 0).length,
  };
  return stats;
}

/* ── Sales Analytics (Owner) ──────────────────────────── */

export type DailySale = { date: string; total: number; count: number };
export type MonthlySale = { month: string; total: number; count: number };

export async function getSalesAnalytics(): Promise<{ daily: DailySale[]; monthly: MonthlySale[] }> {
  const orders = await getAllOrders();
  const delivered = orders.filter((o) => o.status === "delivered");

  const dailyMap = new Map<string, { total: number; count: number }>();
  const monthlyMap = new Map<string, { total: number; count: number }>();

  for (const o of delivered) {
    const d = new Date(o.createdAt);
    const dayKey = d.toISOString().slice(0, 10);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    const day = dailyMap.get(dayKey) || { total: 0, count: 0 };
    day.total += o.total;
    day.count += 1;
    dailyMap.set(dayKey, day);

    const month = monthlyMap.get(monthKey) || { total: 0, count: 0 };
    month.total += o.total;
    month.count += 1;
    monthlyMap.set(monthKey, month);
  }

  const daily = Array.from(dailyMap.entries()).map(([date, data]) => ({ date, ...data })).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
  const monthly = Array.from(monthlyMap.entries()).map(([month, data]) => ({ month, ...data })).sort((a, b) => b.month.localeCompare(a.month));

  return { daily, monthly };
}

/* ── Seller Online Status ─────────────────────────────── */

export async function toggleSellerOnlineStatus(mobile: string, isOnline: boolean): Promise<boolean> {
  try {
    const supabase = createClient();
    const existing = await supabase.from("store_settings").select("id").eq("seller_mobile", mobile).maybeSingle();
    if (existing.data) {
      const { error } = await supabase.from("store_settings").update({ is_online: isOnline }).eq("id", existing.data.id);
      return !error;
    }
    return false;
  } catch { return false; }
}

export async function getSellerOnlineStatus(mobile: string): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data } = await supabase.from("store_settings").select("is_online").eq("seller_mobile", mobile).maybeSingle();
    return data?.is_online !== false;
  } catch { return true; }
}

/* ── Order Deletion (Owner) ───────────────────────────── */

export async function deleteOrder(orderId: string): Promise<boolean> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from("orders").delete().eq("id", orderId);
    return !error;
  } catch { return false; }
}

export async function deleteOrdersBeforeDate(date: string): Promise<number> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("orders").select("id").lt("created_at", date);
    if (error || !data) return 0;
    const ids = data.map((r: any) => r.id);
    if (ids.length === 0) return 0;
    const { error: delErr } = await supabase.from("orders").delete().in("id", ids);
    return delErr ? 0 : ids.length;
  } catch { return 0; }
}

/* ── Store Settings ───────────────────────────────────── */

export type StoreSettings = {
  storeName: string;
  storeDescription: string;
  storeLogo: string;
  deliveryRadius: string;
  returnPolicy: string;
  upiId: string;
  upiQr: string;
  storeAddress: string;
  isOnline: boolean;
};

export async function getStoreSettings(mobile: string): Promise<StoreSettings> {
  try {
    const supabase = createClient();
    const { data } = await supabase.from("store_settings").select("*").eq("seller_mobile", mobile).maybeSingle();
    if (data) {
      return {
        storeName: data.store_name || "My Store",
        storeDescription: data.description || "Welcome to my store on Kirana Bazzar!",
        storeLogo: data.store_logo || "/product_atta.png",
        deliveryRadius: data.delivery_radius || "10",
        returnPolicy: data.return_policy || "7-day return accepted",
        upiId: data.upi_id || "",
        upiQr: data.upi_qr || "",
        storeAddress: data.store_address || "",
        isOnline: data.is_online !== false,
      };
    }
  } catch {}
  return {
    storeName: "My Store",
    storeDescription: "Welcome to my store on Kirana Bazzar!",
    storeLogo: "/product_atta.png",
    deliveryRadius: "10",
    returnPolicy: "7-day return accepted",
    upiId: "",
    upiQr: "",
    storeAddress: "",
    isOnline: true,
  };
}

export async function saveStoreSettings(mobile: string, settings: StoreSettings): Promise<void> {
  const supabase = createClient();
  const existing = await supabase.from("store_settings").select("id").eq("seller_mobile", mobile).maybeSingle();
  const row = {
    seller_mobile: mobile,
    store_name: settings.storeName,
    description: settings.storeDescription,
    store_logo: settings.storeLogo,
    delivery_radius: settings.deliveryRadius,
    return_policy: settings.returnPolicy,
    upi_id: settings.upiId,
    upi_qr: settings.upiQr,
    store_address: settings.storeAddress,
    is_online: settings.isOnline,
  };
  if (existing.data) {
    await supabase.from("store_settings").update(row).eq("id", existing.data.id);
  } else {
    await supabase.from("store_settings").insert(row);
  }
}

export async function getDukandarProfile(mobile: string): Promise<{
  name: string;
  dukanName: string;
  address: string;
  pincode: string;
  photo: string;
} | null> {
  try {
    const supabase = createClient();
    const { data } = await supabase.from("profiles").select("name, dukan_name, address, pincode, photo").eq("mobile_number", mobile).maybeSingle();
    if (data) {
      return {
        name: data.name || "",
        dukanName: data.dukan_name || "",
        address: data.address || "",
        pincode: data.pincode || "",
        photo: data.photo || "",
      };
    }
  } catch {}
  return null;
}

export async function getStoreSettingsMap(mobiles: string[]): Promise<Record<string, Pick<StoreSettings, "upiId" | "upiQr" | "storeName">>> {
  if (mobiles.length === 0) return {};
  const supabase = createClient();
  const unique = [...new Set(mobiles.filter(Boolean))];
  const { data } = await supabase.from("store_settings").select("seller_mobile, upi_id, upi_qr, store_name").in("seller_mobile", unique);
  const map: Record<string, any> = {};
  for (const row of data || []) {
    map[row.seller_mobile] = {
      upiId: row.upi_id || "",
      upiQr: row.upi_qr || "",
      storeName: row.store_name || "Store",
    };
  }
  return map;
}

/* ── User / Admin System ───────────────────────────── */

export const OWNER_SECRET_CODE = "admin@123";

export type UserStatus = "pending" | "approved" | "rejected";

export type StoredUser = {
  role: "seller" | "dukandar" | "owner";
  name?: string;
  dukanName?: string;
  password: string;
  address: string;
  pincode: string;
  mobileNumber: string;
  whatsappNumber?: string;
  status: UserStatus;
  isActive?: boolean;
};

export async function getAllUsers(): Promise<StoredUser[]> {
  try {
    const res = await fetch("/api/profiles", { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return (data || []).map(mapProfileToUser);
  } catch {
    return [];
  }
}

export async function saveUser(user: StoredUser): Promise<void> {
  const row = {
    role: user.role,
    name: user.role === "seller" ? user.name || null : null,
    dukan_name: user.role === "dukandar" ? user.dukanName || user.name || null : null,
    address: user.address,
    pincode: user.pincode,
    mobile_number: user.mobileNumber,
    whatsapp_number: user.whatsappNumber || null,
    status: user.status,
    password: user.password,
  };
  const res = await fetch("/api/profiles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to create user");
  }
}

export async function updateUserStatus(mobile: string, status: UserStatus): Promise<void> {
  await fetch("/api/profiles", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile_number: mobile, updates: { status } }),
  });
}

export async function toggleUserActiveStatus(mobile: string, isActive: boolean): Promise<void> {
  await fetch("/api/profiles", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile_number: mobile, updates: { is_active: isActive } }),
  });
}

export async function deleteUser(mobile: string): Promise<void> {
  const res = await fetch(`/api/profiles?mobile=${encodeURIComponent(mobile)}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to delete user");
  }
}

export async function getProfileByMobile(mobile: string): Promise<Record<string, any> | null> {
  try {
    const supabase = createClient();
    const { data } = await supabase.from("profiles").select("*").eq("mobile_number", mobile).maybeSingle();
    return data;
  } catch { return null; }
}

export async function updateProfile(mobile: string, updates: Record<string, any>): Promise<boolean> {
  try {
    const res = await fetch("/api/profiles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile_number: mobile, updates }),
    });
    return res.ok;
  } catch { return false; }
}

export async function getUsersByRole(role: string): Promise<StoredUser[]> {
  const users = await getAllUsers();
  return users.filter((u) => u.role === role);
}

export async function addProfileFromAuth(userId: string, profile: {
  role: string;
  name?: string;
  dukanName?: string;
  mobileNumber: string;
  address?: string;
  pincode?: string;
  whatsappNumber?: string;
  photo?: string;
  status?: string;
}): Promise<void> {
  const supabase = createClient();
  const row: Record<string, any> = {
    id: userId,
    role: profile.role,
    mobile_number: profile.mobileNumber,
    status: profile.status || "pending",
  };
  if (profile.name) row.name = profile.name;
  if (profile.dukanName) row.dukan_name = profile.dukanName;
  if (profile.address) row.address = profile.address;
  if (profile.pincode) row.pincode = profile.pincode;
  if (profile.whatsappNumber) row.whatsapp_number = profile.whatsappNumber;
  if (profile.photo) row.photo = profile.photo;
  await supabase.from("profiles").upsert(row);
}

/* ── Wishlist / Likes ──────────────────────────────── */

const LS_WISHLIST_KEY = "kb_wishlist";

export function getWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_WISHLIST_KEY) || "[]");
  } catch { return []; }
}

export function toggleWishlist(productId: string): string[] {
  const list = getWishlist();
  const idx = list.indexOf(productId);
  if (idx >= 0) list.splice(idx, 1);
  else list.push(productId);
  localStorage.setItem(LS_WISHLIST_KEY, JSON.stringify(list));
  return list;
}

export function isInWishlist(productId: string): boolean {
  return getWishlist().includes(productId);
}

/* ── Dislikes ──────────────────────────────────────── */

const LS_DISLIKE_KEY = "kb_dislikes";

export function getDislikes(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_DISLIKE_KEY) || "[]");
  } catch { return []; }
}

export function toggleDislike(productId: string): string[] {
  const list = getDislikes();
  const idx = list.indexOf(productId);
  if (idx >= 0) list.splice(idx, 1);
  else list.push(productId);
  localStorage.setItem(LS_DISLIKE_KEY, JSON.stringify(list));
  return list;
}

export function isDisliked(productId: string): boolean {
  return getDislikes().includes(productId);
}

/* ── Mapping helpers ──────────────────────────────── */

function mapProfileToUser(p: any): StoredUser {
  return {
    role: p.role || "dukandar",
    name: p.name || undefined,
    dukanName: p.dukan_name || undefined,
    password: "",
    address: p.address || "",
    pincode: p.pincode || "",
    mobileNumber: p.mobile_number || "",
    whatsappNumber: p.whatsapp_number || undefined,
    status: p.status || "pending",
    isActive: p.is_active !== false,
  };
}

function mapProduct(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    price: Number(p.price),
    mrp: Number(p.mrp),
    img: p.img || "/product_atta.png",
    images: p.images || [],
    videos: p.videos || [],
    sellerName: p.seller_name,
    ecard: p.ecard,
    rating: String(p.rating || "0"),
    category: p.category || "",
    description: p.description || "",
    highlights: p.highlights || [],
  };
}

function mapSellerProduct(p: any): SellerProduct {
  return {
    id: p.id,
    name: p.name,
    description: p.description || "",
    price: Number(p.price),
    mrp: Number(p.mrp),
    img: p.img || "/product_atta.png",
    videos: p.videos || [],
    category: p.category || "",
    unit: p.unit || "1 kg",
    brand: p.brand || "",
    stock: p.stock || 0,
    soldCount: p.sold_count || 0,
    sku: p.sku || "",
    tags: p.tags || [],
    highlights: p.highlights || [],
    sellerMobile: p.seller_mobile || "",
    sellerName: p.seller_name || "",
    available: p.available !== false,
    createdAt: p.created_at || new Date().toISOString(),
  };
}

function mapOrder(o: any): Order {
  return {
    id: o.id,
    items: o.items || [],
    buyerName: o.buyer_name || "",
    buyerDukanName: o.buyer_dukan_name || "",
    buyerPhone: o.buyer_phone || "",
    buyerAddress: o.buyer_address || "",
    buyerCity: o.buyer_city || "",
    buyerState: o.buyer_state || "",
    buyerPincode: o.buyer_pincode || "",
    buyerLatitude: o.buyer_latitude ? Number(o.buyer_latitude) : undefined,
    buyerLongitude: o.buyer_longitude ? Number(o.buyer_longitude) : undefined,
    buyerPhoto: o.buyer_photo || "",
    total: Number(o.total),
    status: o.status || "pending",
    paymentMethod: o.payment_method || "cod",
    otp: o.otp || "",
    createdAt: o.created_at || new Date().toISOString(),
  };
}
