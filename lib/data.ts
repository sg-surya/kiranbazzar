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
  } catch {}
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
  sku: string;
  tags: string[];
  highlights: string[];
  sellerMobile: string;
  sellerName: string;
  available: boolean;
  createdAt: string;
};

export type AnyProduct = Product | SellerProduct;

export async function getSellerProducts(): Promise<SellerProduct[]> {
  const supabase = createClient();
  const { data } = await supabase.from("seller_products").select("*").order("created_at", { ascending: false });
  return (data || []).map(mapSellerProduct);
}

export async function saveSellerProduct(product: SellerProduct): Promise<void> {
  const supabase = createClient();
  const row = {
    name: product.name,
    description: product.description,
    price: product.price,
    mrp: product.mrp,
    img: product.img,
    videos: product.videos || [],
    category: product.category,
    unit: product.unit,
    brand: product.brand,
    stock: product.stock,
    sku: product.sku,
    tags: product.tags || [],
    highlights: product.highlights || [],
    seller_mobile: product.sellerMobile,
    seller_name: product.sellerName,
    available: product.available,
  };

  const existing = await supabase.from("seller_products").select("id").eq("id", product.id).maybeSingle();
  if (existing.data) {
    await supabase.from("seller_products").update(row).eq("id", product.id);
  } else {
    await supabase.from("seller_products").insert({ id: product.id, ...row });
  }
}

export async function deleteSellerProduct(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("seller_products").delete().eq("id", id);
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
  buyerPhone: string;
  buyerAddress: string;
  buyerCity: string;
  buyerState: string;
  buyerPincode: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
};

export async function getAllOrders(): Promise<Order[]> {
  const supabase = createClient();
  const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  return (data || []).map(mapOrder);
}

export async function saveOrder(order: Order): Promise<void> {
  const supabase = createClient();
  await supabase.from("orders").insert({
    id: order.id,
    items: order.items,
    buyer_name: order.buyerName,
    buyer_phone: order.buyerPhone,
    buyer_address: order.buyerAddress,
    buyer_city: order.buyerCity,
    buyer_state: order.buyerState,
    buyer_pincode: order.buyerPincode,
    total: order.total,
    status: order.status,
    created_at: order.createdAt,
  });
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const supabase = createClient();
  await supabase.from("orders").update({ status }).eq("id", orderId);
}

export async function getOrdersForSeller(mobile: string): Promise<Order[]> {
  const orders = await getAllOrders();
  return orders.filter((o) => o.items.some((item) => item.sellerMobile === mobile));
}

export async function getOrdersForBuyer(phone: string): Promise<Order[]> {
  const orders = await getAllOrders();
  return orders.filter((o) => o.buyerPhone === phone);
}

/* ── Store Settings ───────────────────────────────────── */

export type StoreSettings = {
  storeName: string;
  storeDescription: string;
  storeLogo: string;
  deliveryRadius: string;
  returnPolicy: string;
  upiId: string;
  storeAddress: string;
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
        storeAddress: data.store_address || "",
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
    storeAddress: "",
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
    store_address: settings.storeAddress,
  };
  if (existing.data) {
    await supabase.from("store_settings").update(row).eq("id", existing.data.id);
  } else {
    await supabase.from("store_settings").insert(row);
  }
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
};

export async function getAllUsers(): Promise<StoredUser[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    return (data || []).map(mapProfileToUser);
  } catch {
    return [];
  }
}

export async function saveUser(user: StoredUser): Promise<void> {
  const supabase = createClient();
  const existing = await supabase
    .from("profiles")
    .select("id")
    .eq("mobile_number", user.mobileNumber)
    .maybeSingle();

  const row = {
    role: user.role,
    name: user.role === "seller" ? user.name || null : null,
    dukan_name: user.role === "dukandar" ? user.dukanName || user.name || null : null,
    address: user.address,
    pincode: user.pincode,
    mobile_number: user.mobileNumber,
    whatsapp_number: user.whatsappNumber || null,
    status: user.status,
  };

  if (existing.data) {
    await supabase.from("profiles").update(row).eq("id", existing.data.id);
  } else {
    await supabase.from("profiles").insert(row);
  }
}

export async function updateUserStatus(mobile: string, status: UserStatus): Promise<void> {
  const supabase = createClient();
  await supabase.from("profiles").update({ status }).eq("mobile_number", mobile);
}

export async function seedAdmin(): Promise<void> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("mobile_number", "9999999999")
    .eq("role", "owner")
    .maybeSingle();
  if (data) return;

  try {
    await fetch("/api/seed-admin", { method: "POST" });
  } catch {}
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
    buyerPhone: o.buyer_phone || "",
    buyerAddress: o.buyer_address || "",
    buyerCity: o.buyer_city || "",
    buyerState: o.buyer_state || "",
    buyerPincode: o.buyer_pincode || "",
    total: Number(o.total),
    status: o.status || "pending",
    createdAt: o.created_at || new Date().toISOString(),
  };
}
