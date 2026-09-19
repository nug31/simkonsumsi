-- Tambahkan kolom "campus" (Kampus) untuk database yang sudah ada
-- (schema.sql sudah memuat baris ini juga, dijalankan otomatis kalau
-- Anda re-run seluruh schema.sql -- tapi ini versi cepatnya).
ALTER TABLE consumption_requests ADD COLUMN IF NOT EXISTS campus VARCHAR(100);
