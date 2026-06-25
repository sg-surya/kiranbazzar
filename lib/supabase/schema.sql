-- Kirana Bazzar Supabase Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'seller', 'dukandar')),
  name TEXT,
  dukan_name TEXT,
  address TEXT,
  pincode TEXT,
  mobile_number TEXT UNIQUE,
  whatsapp_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PLATFORM PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  mrp DECIMAL(10,2) NOT NULL,
  img TEXT DEFAULT '/product_atta.png',
  images JSONB DEFAULT '[]',
  videos JSONB DEFAULT '[]',
  seller_name TEXT,
  ecard JSONB,
  rating DECIMAL(2,1) DEFAULT 0,
  category TEXT,
  description TEXT DEFAULT '',
  highlights JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SELLER PRODUCTS
CREATE TABLE IF NOT EXISTS seller_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price DECIMAL(10,2) NOT NULL,
  mrp DECIMAL(10,2) NOT NULL,
  img TEXT DEFAULT '/product_atta.png',
  videos JSONB DEFAULT '[]',
  category TEXT,
  unit TEXT DEFAULT '1 kg',
  brand TEXT DEFAULT '',
  stock INTEGER DEFAULT 0,
  sku TEXT DEFAULT '',
  tags JSONB DEFAULT '[]',
  highlights JSONB DEFAULT '[]',
  seller_mobile TEXT,
  seller_name TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  items JSONB NOT NULL DEFAULT '[]',
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  buyer_address TEXT DEFAULT '',
  buyer_city TEXT DEFAULT '',
  buyer_state TEXT DEFAULT '',
  buyer_pincode TEXT DEFAULT '',
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT 'custom',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. STORE SETTINGS
CREATE TABLE IF NOT EXISTS store_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_mobile TEXT UNIQUE NOT NULL,
  store_name TEXT DEFAULT 'My Store',
  store_logo TEXT DEFAULT '/product_atta.png',
  store_banner TEXT DEFAULT '',
  description TEXT DEFAULT 'Welcome to my store on Kirana Bazzar!',
  delivery_radius TEXT DEFAULT '10',
  return_policy TEXT DEFAULT '7-day return accepted',
  upi_id TEXT DEFAULT '',
  store_address TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. WISHLISTS
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- 8. PLATFORM SETTINGS (singleton row)
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_name TEXT DEFAULT 'Kirana Bazzar',
  delivery_fee TEXT DEFAULT '0',
  contact_phone TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  about_text TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════
-- TRIGGER: auto-create profile on signup
-- ══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, name, mobile_number, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'dukandar'),
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'mobile_number', NEW.email),
    'pending'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ══════════════════════════════════════════════════════════
-- SEED: default owner account (run after migration)
-- ══════════════════════════════════════════════════════════

-- First create the owner via Supabase Auth API (use API route).
-- Then insert profile:
-- INSERT INTO public.profiles (id, role, name, mobile_number, status)
-- VALUES ('<auth-user-id>', 'owner', 'Owner', '9999999999', 'approved');

-- ══════════════════════════════════════════════════════════
-- SEED: default categories
-- ══════════════════════════════════════════════════════════

INSERT INTO public.categories (name, icon) VALUES
  ('Grocery', 'grocery'),
  ('Atta & Dal', 'wheat'),
  ('Oil & Ghee', 'oil'),
  ('Spices', 'spice'),
  ('Snacks', 'snack'),
  ('Beverages', 'beverage'),
  ('Personal Care', 'care'),
  ('Household', 'household')
ON CONFLICT (name) DO NOTHING;

-- ══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ══════════════════════════════════════════════════════════

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
-- Owners can see all (for admin panel) — handled via service_role in API routes

-- Products: public read
CREATE POLICY "products_select_all" ON products FOR SELECT USING (true);

-- Seller products: public read
CREATE POLICY "seller_products_select_all" ON seller_products FOR SELECT USING (true);

-- Orders: users can see their own / owners can see all
CREATE POLICY "orders_select_own" ON orders FOR SELECT USING (true); -- simplified: app-level filtering

-- Categories: public read
CREATE POLICY "categories_select_all" ON categories FOR SELECT USING (true);

-- Store settings: public read
CREATE POLICY "store_settings_select_all" ON store_settings FOR SELECT USING (true);

-- Wishlists: users can see their own
CREATE POLICY "wishlists_select_own" ON wishlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wishlists_insert_own" ON wishlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wishlists_delete_own" ON wishlists FOR DELETE USING (auth.uid() = user_id);

-- Platform settings: public read
CREATE POLICY "platform_settings_select_all" ON platform_settings FOR SELECT USING (true);
