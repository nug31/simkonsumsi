// Update PIN akun admin & approver (Admin Konsumsi, Koordinator Jurusan,
// Wakasek, Superadmin) supaya berbeda satu sama lain -- bukan default 1234
// lagi. Akun requester/guru mata pelajaran TIDAK diubah (tetap 1234).
//
// Jalankan sekali dari komputer Anda (butuh Service Role Key dari
// Dashboard -> Project Settings -> API -- JANGAN taruh di .env.local /
// dibagikan ke siapapun, cukup dipakai sesaat di terminal Anda sendiri):
//
//   PowerShell:
//     $env:SUPABASE_URL="https://ugkdkfgjumrvifrgprsa.supabase.co"
//     $env:SUPABASE_SERVICE_ROLE_KEY="ey..."
//     node scripts/update-admin-pins.mjs
//
//   bash:
//     SUPABASE_URL=https://ugkdkfgjumrvifrgprsa.supabase.co SUPABASE_SERVICE_ROLE_KEY=ey... node scripts/update-admin-pins.mjs

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const AUTH_EMAIL_DOMAIN = 'simkonsumsi.local';
const PIN_PASSWORD_SUFFIX = '-SKN'; // harus sama dengan src/lib/supabaseClient.ts

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Set env var SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY dulu sebelum menjalankan script ini.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// PIN baru per akun -- catat & sampaikan ke orang yang bersangkutan.
const NEW_PINS = {
  'admin-konsumsi': '5827',
  'koordinator-jurusan': '3164',
  wakasek: '9042',
  superadmin: '7359',
};

async function main() {
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw new Error(`Gagal mengambil daftar user: ${listError.message}`);

  for (const [username, pin] of Object.entries(NEW_PINS)) {
    const email = `${username}@${AUTH_EMAIL_DOMAIN}`;
    const authUser = existingUsers.users.find((u) => u.email === email);
    if (!authUser) {
      console.log(`  ! ${username}: akun tidak ditemukan (${email}), dilewati`);
      continue;
    }
    const { error } = await supabase.auth.admin.updateUserById(authUser.id, {
      password: `${pin}${PIN_PASSWORD_SUFFIX}`,
    });
    if (error) {
      console.log(`  ! ${username}: gagal update - ${error.message}`);
    } else {
      console.log(`  + ${username}: PIN diperbarui menjadi ${pin}`);
    }
  }

  console.log('\nSelesai. PIN baru per akun:');
  for (const [username, pin] of Object.entries(NEW_PINS)) {
    console.log(`  - ${username}: ${pin}`);
  }
  console.log('\nAkun requester/guru mata pelajaran lain tetap PIN default 1234.');
}

main().catch((err) => {
  console.error('\nGagal:', err.message);
  process.exit(1);
});
