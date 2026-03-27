-- Jalankan kode SQL ini di menu "SQL Editor" Supabase Anda.
-- Ini akan mengubah tipe data harga menjadi teks dan menambahkan kolom untuk pembayaran.

ALTER TABLE orders ALTER COLUMN price TYPE TEXT USING price::TEXT;
ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'Belum Lunas';
ALTER TABLE orders ADD COLUMN amount_paid TEXT;
