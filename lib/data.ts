export interface Product {
  id: string;
  name: string;
  price: number;
  mrp: number;

  /** Legacy single image (still used by some UI) */
  img: string;

  /** PDP media */
  images?: string[];
  videos?: string[]; // can be URLs or public paths

  /** Seller */
  sellerName?: string;
  ecard?: {
    title: string; // e.g. "Verified Seller"
    subtitle?: string; // e.g. "Ships in 24h"
    badgeText?: string; // e.g. "e-Certified"
  };

  rating: string;
  category: string;
  description: string;
  highlights: string[];
}


export interface Category {
  name: string;
  icon: string; // SVG icon identifier
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

export const LS_CATEGORIES_KEY = "kb_categories";

export function getAllCategories(): Category[] {
  if (typeof window === "undefined") return categories;
  try {
    const raw = localStorage.getItem(LS_CATEGORIES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return categories;
}

export function saveAllCategories(cats: Category[]): void {
  localStorage.setItem(LS_CATEGORIES_KEY, JSON.stringify(cats));
}

export type PlatformSettings = {
  siteName: string;
  deliveryFee: string;
  contactPhone: string;
  contactEmail: string;
  aboutText: string;
};

export const LS_PLATFORM_KEY = "kb_platform";

export function getPlatformSettings(): PlatformSettings {
  try {
    const raw = localStorage.getItem(LS_PLATFORM_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { siteName: "Kirana Bazzar", deliveryFee: "0", contactPhone: "", contactEmail: "", aboutText: "" };
}

export function savePlatformSettings(s: PlatformSettings): void {
  localStorage.setItem(LS_PLATFORM_KEY, JSON.stringify(s));
}

export const products: Product[] = [];

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getAnyProductById(id: string): Product | SellerProduct | undefined {
  return getProductById(id) || getSellerProducts().find((p) => p.id === id);
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

const LS_SELLER_PRODUCTS_KEY = "kb_seller_products";

export function getSellerProducts(): SellerProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_SELLER_PRODUCTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSellerProduct(product: SellerProduct): void {
  const list = getSellerProducts();
  const idx = list.findIndex((p) => p.id === product.id);
  if (idx >= 0) list[idx] = product;
  else list.push(product);
  localStorage.setItem(LS_SELLER_PRODUCTS_KEY, JSON.stringify(list));
}

export function deleteSellerProduct(id: string): void {
  const list = getSellerProducts().filter((p) => p.id !== id);
  localStorage.setItem(LS_SELLER_PRODUCTS_KEY, JSON.stringify(list));
}

export function getAllProducts(): (Product | SellerProduct)[] {
  return [...products, ...getSellerProducts().filter((p) => p.available)];
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

const LS_ORDERS_KEY = "kb_orders";

export function getAllOrders(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveOrder(order: Order): void {
  const list = getAllOrders();
  list.push(order);
  localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(list));
}

export function updateOrderStatus(orderId: string, status: OrderStatus): void {
  const list = getAllOrders();
  const order = list.find((o) => o.id === orderId);
  if (order) order.status = status;
  localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(list));
}

export function getOrdersForSeller(mobile: string): Order[] {
  return getAllOrders().filter((o) =>
    o.items.some((item) => item.sellerMobile === mobile)
  );
}

export function getOrdersForBuyer(phone: string): Order[] {
  return getAllOrders().filter((o) => o.buyerPhone === phone);
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

const LS_STORE_KEY_PREFIX = "kb_store_";

export function getStoreSettings(mobile: string): StoreSettings {
  try {
    const raw = localStorage.getItem(LS_STORE_KEY_PREFIX + mobile);
    if (raw) return JSON.parse(raw);
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

export function saveStoreSettings(mobile: string, settings: StoreSettings): void {
  localStorage.setItem(LS_STORE_KEY_PREFIX + mobile, JSON.stringify(settings));
}

/* ── User / Admin System ───────────────────────────── */

export const OWNER_SECRET_CODE = "admin@123";
export const LS_USERS_KEY = "kb_users";

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

export function getAllUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_USERS_KEY) || "[]");
  } catch { return []; }
}

export function saveUser(user: StoredUser): void {
  const users = getAllUsers();
  const idx = users.findIndex((u) => u.mobileNumber === user.mobileNumber);
  if (idx >= 0) users[idx] = user;
  else users.push(user);
  localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));
}

export function updateUserStatus(mobile: string, status: UserStatus): void {
  const users = getAllUsers();
  const user = users.find((u) => u.mobileNumber === mobile);
  if (user) {
    user.status = status;
    localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));
  }
}

export function seedAdmin(): void {
  const users = getAllUsers();
  if (users.some((u) => u.role === "owner")) return;
  const admin: StoredUser = {
    role: "owner",
    name: "Owner",
    password: "admin123",
    address: "Admin Office",
    pincode: "110001",
    mobileNumber: "9999999999",
    status: "approved",
  };
  saveUser(admin);
}

export function getUsersByRole(role: string): StoredUser[] {
  return getAllUsers().filter((u) => u.role === role);
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
