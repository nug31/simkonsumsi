import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase env vars belum diset. Salin .env.example menjadi .env.local dan isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const AUTH_EMAIL_DOMAIN = 'simkonsumsi.local';

export function usernameToAuthEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${AUTH_EMAIL_DOMAIN}`;
}

// Supabase Auth menolak password < 6 karakter dan dashboard tidak bisa
// diturunkan lagi di bawah itu. UX tetap "PIN 4 digit" di layar login;
// PIN dipanjangkan dengan akhiran tetap ini sebelum dikirim ke Supabase
// Auth, supaya lolos validasi tanpa mengubah pengalaman pengguna.
// Dipakai di sini (login) DAN di scripts/seed.mjs + Edge Function
// create-user (harus identik di ketiga tempat).
const PIN_PASSWORD_SUFFIX = '-SKN';

export function pinToPassword(pin: string): string {
  return `${pin}${PIN_PASSWORD_SUFFIX}`;
}
