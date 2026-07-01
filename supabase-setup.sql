-- ==========================================
-- SCRIPT DEPLOYMENT SUPABASE IKARIZ.ID
-- ==========================================
-- Cara Penggunaan:
-- 1. Buka Supabase Dashboard > Project Anda > SQL Editor
-- 2. Buat "New Query"
-- 3. Copy paste semua kode ini dan klik "Run"
-- ==========================================

-- 1. Buat tabel profiles (menyimpan data owner & reseller)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'reseller')),
  display_name TEXT NOT NULL,
  commission_rate NUMERIC DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Mengaktifkan Row Level Security (RLS) untuk profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy untuk profiles: Semua orang yang login bisa baca
CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT TO authenticated USING (true);

-- Policy untuk profiles: Hanya bisa diinsert/update/delete oleh role owner (kita bypass sementara agar mudah dari FE)
CREATE POLICY "Profiles can be inserted by anyone" 
ON public.profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Profiles can be updated by anyone" 
ON public.profiles FOR UPDATE USING (true);

-- 2. Buat tabel orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  order_date TEXT NOT NULL,
  deadline TEXT NOT NULL,
  price TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT DEFAULT 'Pending',
  notes TEXT,
  reseller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  commission_amount NUMERIC DEFAULT 0,
  commission_paid BOOLEAN DEFAULT false,
  invoice_title TEXT,
  invoice_notes TEXT,
  file_url TEXT,
  payment_status TEXT DEFAULT 'Belum Lunas',
  amount_paid TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Mengaktifkan RLS untuk orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policy untuk orders: Bisa dibaca/ditulis oleh semua user yang login (diatur via aplikasi FE)
CREATE POLICY "Orders are fully accessible by authenticated users" 
ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow anon access temporer jika aplikasi diakses tanpa login supabase auth yg ketat (opsional, disarankan hanya authenticated)
CREATE POLICY "Orders are viewable by anon" ON public.orders FOR SELECT TO anon USING (true);
CREATE POLICY "Orders can be inserted by anon" ON public.orders FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Orders can be updated by anon" ON public.orders FOR UPDATE TO anon USING (true);
CREATE POLICY "Orders can be deleted by anon" ON public.orders FOR DELETE TO anon USING (true);

-- Sama untuk profiles (jika login sistemnya custom)
CREATE POLICY "Profiles are viewable by anon" ON public.profiles FOR SELECT TO anon USING (true);
CREATE POLICY "Profiles can be inserted by anon" ON public.profiles FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Profiles can be updated by anon" ON public.profiles FOR UPDATE TO anon USING (true);

-- 3. Setup Storage (Bucket untuk file order)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('order-files', 'order-files', true)
ON CONFLICT (id) DO NOTHING;

-- Policy untuk storage: Semua bisa baca file
CREATE POLICY "Files are publicly accessible"
ON storage.objects FOR SELECT TO public
USING ( bucket_id = 'order-files' );

-- Policy untuk storage: Semua bisa upload/update/delete file
CREATE POLICY "Anyone can upload files"
ON storage.objects FOR INSERT TO public
WITH CHECK ( bucket_id = 'order-files' );

CREATE POLICY "Anyone can update files"
ON storage.objects FOR UPDATE TO public
USING ( bucket_id = 'order-files' );

CREATE POLICY "Anyone can delete files"
ON storage.objects FOR DELETE TO public
USING ( bucket_id = 'order-files' );

-- ==========================================
-- SELESAI
-- ==========================================
