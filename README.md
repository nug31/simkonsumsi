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
   Jalankan sekali dari komputer Anda (butuh Service Role Key dari Dashboard → Project Settings → API — JANGAN commit/bagikan key ini):
   ```bash
   SUPABASE_URL=https://xxxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=ey... node scripts/seed.mjs
   ```
   Ini membuat semua departemen/jurusan dan akun login awal (lihat `scripts/seed.mjs` untuk daftar nama & role). Semua PIN default: `1234` — segera diganti lewat guru/staf terkait setelah login pertama.

7. **Jalankan aplikasi**
   ```bash
   npm run dev
   ```

## Menambah pengguna baru

Login sebagai SUPERADMIN → menu **Master Data** → tab **Pengguna & Role** → **Tambah Pengguna**. Ini otomatis membuat akun login (lewat Edge Function `create-user`) sekaligus profil pengguna.

## Struktur backend

- `schema.sql` — schema Postgres lengkap (tabel, RLS, trigger, storage, realtime), authoritative, aman dijalankan ulang.
- `src/lib/supabaseClient.ts` — Supabase client singleton.
- `src/services/storage.ts` — data layer aplikasi: in-memory cache + Supabase Realtime, dipakai seluruh komponen lewat `storageService`.
- `supabase/functions/create-user` — Edge Function pembuatan akun baru (perlu service_role, tidak boleh dari client langsung).
- `scripts/seed.mjs` — seed data awal (departemen + akun demo), dijalankan manual sekali.
