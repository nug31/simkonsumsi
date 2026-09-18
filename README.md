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

4. **Turunkan minimum panjang password**
   Buka Dashboard → Authentication → Providers → Email, turunkan "Minimum password length" ke 4 (PIN login memakai 4 digit sebagai password).

5. **Deploy Edge Function `create-user`**
   Dipakai Master Data untuk menambah guru/staff baru. Deploy dengan Supabase CLI:
   ```bash
   supabase functions deploy create-user
   ```
   atau tempel isi [`supabase/functions/create-user/index.ts`](./supabase/functions/create-user/index.ts) lewat Dashboard → Edge Functions → New Function.

6. **Seed akun & departemen awal**

   **Opsi A (disarankan, paling simpel): lewat SQL Editor.**
   Buka SQL Editor, tempel seluruh isi [`seed_accounts.sql`](./seed_accounts.sql), lalu jalankan. Ini langsung membuat semua departemen (Produktif Jurusan + MGMP) dan akun login (Admin Konsumsi, Koordinator Jurusan, Wakasek, Superadmin, dan 1 akun requester per jurusan/MGMP). Aman dijalankan ulang.

   **Opsi B: lewat Admin API (Node script)**, kalau opsi A bermasalah di project Anda:
   ```bash
   SUPABASE_URL=https://xxxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=ey... node scripts/seed.mjs
   ```
   (butuh Service Role Key dari Dashboard → Project Settings → API — JANGAN commit/bagikan key ini)

   Semua PIN default: `1234` — segera diganti lewat guru/staf terkait setelah login pertama.

7. **Jalankan aplikasi**
   ```bash
   npm run dev
   ```

## Menambah pengguna baru

Login sebagai SUPERADMIN → menu **Master Data** → tab **Pengguna & Role** → **Tambah Pengguna**. Ini otomatis membuat akun login (lewat Edge Function `create-user`) sekaligus profil pengguna.

## Struktur backend

- `schema.sql` — schema Postgres lengkap (tabel, RLS, trigger, storage, realtime), authoritative, aman dijalankan ulang.
- `seed_accounts.sql` — seed departemen & akun awal lewat SQL langsung (opsi A, disarankan).
- `scripts/seed.mjs` — seed departemen & akun awal lewat Supabase Admin API (opsi B).
- `src/lib/supabaseClient.ts` — Supabase client singleton.
- `src/services/storage.ts` — data layer aplikasi: in-memory cache + Supabase Realtime, dipakai seluruh komponen lewat `storageService`.
- `supabase/functions/create-user` — Edge Function pembuatan akun baru (perlu service_role, tidak boleh dari client langsung).
