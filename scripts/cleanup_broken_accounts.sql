-- Hapus akun auth yang rusak/tidak lengkap dari percobaan seed_accounts.sql
-- sebelumnya, supaya scripts/seed.mjs (Admin API resmi) bisa membuat ulang
-- dengan bersih. ON DELETE CASCADE otomatis membersihkan baris terkait di
-- public.users dan auth.identities juga.
DELETE FROM auth.users WHERE email LIKE '%@simkonsumsi.local';
