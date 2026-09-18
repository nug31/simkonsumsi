# SIMKONSUMSI

Sistem Permintaan Konsumsi Guru Tamu & Industri — React + TypeScript + Vite + Tailwind, dengan backend [Supabase](https://supabase.com) (Postgres + Auth + Storage + Realtime).

## Setup awal (sekali saja)

1. **Install dependency**
   ```bash
   npm install
   ```

2. **Isi kredensial Supabase**
   Salin `.env.example` menjadi `.env.local`, lalu isi dengan Project URL dan anon key project Supabase Anda (Dashboard → Project Settings → API):
   ```bash
   cp .env.example .env.local
   ```

3. **Jalankan schema database**
   Buka Supabase Dashboard → SQL Editor, tempel seluruh isi [`schema.sql`](./schema.sql), lalu jalankan. File ini membuat semua tabel, trigger nomor pengajuan otomatis, Row Level Security, storage bucket lampiran, dan mengaktifkan Realtime.

4. **Minimum panjang password**
   Dashboard Supabase tidak bisa diturunkan di bawah 6 karakter. Karena itu UX login tetap "PIN 4 digit", tapi PIN dipanjangkan otomatis dengan akhiran tetap (`pinToPassword` di `src/lib/supabaseClient.ts`) sebelum dikirim ke Supabase Auth — tidak ada yang perlu diubah di Dashboard untuk ini. Biarkan "Minimum password length" di nilai default (6).

5. **Deploy Edge Function `create-user`**
   Dipakai Master Data untuk menambah guru/staff baru. Deploy dengan Supabase CLI:
   ```bash
   supabase functions deploy create-user
   ```
   atau tempel isi [`supabase/functions/create-user/index.ts`](./supabase/functions/create-user/index.ts) lewat Dashboard → Edge Functions → New Function.

6. **Seed akun & departemen awal**
   Jalankan lewat Supabase Admin API resmi (bukan SQL langsung — insert manual ke `auth.users` terbukti rapuh dan bisa merusak state auth project):
   ```bash
   SUPABASE_URL=https://xxxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=ey... node scripts/seed.mjs
   ```
   (butuh Service Role Key dari Dashboard → Project Settings → API — JANGAN commit/bagikan/tempel key ini di tempat lain. Pakai sekali di terminal Anda sendiri, lalu pertimbangkan rotate key setelah selesai.)

   Ini membuat semua departemen (Produktif Jurusan + MGMP) dan akun login: Admin Konsumsi, Koordinator Jurusan, Wakasek, Superadmin (masing-masing dengan PIN berbeda, lihat `scripts/seed.mjs`), dan 1 akun requester per jurusan/MGMP dengan PIN default `1234`. Aman dijalankan ulang (skip akun/departemen yang sudah ada).

   Kalau akun admin/approver sudah pernah dibuat sebelumnya dengan PIN lama (1234 semua) dan ingin diperbarui ke PIN yang berbeda-beda tanpa membuat ulang akunnya, jalankan `scripts/update-admin-pins.mjs` dengan cara yang sama.

7. **Jalankan aplikasi**
   ```bash
   npm run dev
   ```

## Menambah pengguna baru

Login sebagai SUPERADMIN → menu **Master Data** → tab **Pengguna & Role** → **Tambah Pengguna**. Ini otomatis membuat akun login (lewat Edge Function `create-user`) sekaligus profil pengguna.

## Struktur backend

- `schema.sql` — schema Postgres lengkap (tabel, RLS, trigger, storage, realtime), authoritative, aman dijalankan ulang.
- `scripts/seed.mjs` — seed departemen & akun awal lewat Supabase Admin API resmi.
- `scripts/update-admin-pins.mjs` — ubah PIN akun admin/approver yang sudah ada.
- `src/lib/supabaseClient.ts` — Supabase client singleton.
- `src/services/storage.ts` — data layer aplikasi: in-memory cache + Supabase Realtime, dipakai seluruh komponen lewat `storageService`.
- `supabase/functions/create-user` — Edge Function pembuatan akun baru (perlu service_role, tidak boleh dari client langsung).
