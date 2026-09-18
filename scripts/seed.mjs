// Seed script SIMKONSUMSI -> Supabase (jalur resmi via Admin API)
//
// Alternatif dari seed_accounts.sql (yang insert langsung ke auth.users
// lewat SQL). Script ini memakai Supabase Admin API resmi, jadi lebih
// aman terhadap perubahan skema internal auth.* di masa depan, tapi
// perlu dijalankan manual dari komputer Anda dengan SERVICE ROLE KEY
// (bukan anon key) -- key ini TIDAK BOLEH ditaruh di .env.local /
// dibagikan, cukup dipakai sekali lewat env var sesaat.
//
// Cara pakai (PowerShell):
//   $env:SUPABASE_URL="https://xxxx.supabase.co"
//   $env:SUPABASE_SERVICE_ROLE_KEY="ey..."
//   node scripts/seed.mjs
//
// Cara pakai (bash):
//   SUPABASE_URL=https://xxxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=ey... node scripts/seed.mjs

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const AUTH_EMAIL_DOMAIN = 'simkonsumsi.local';
// Harus identik dengan src/lib/supabaseClient.ts (pinToPassword) dan
// supabase/functions/create-user -- Supabase Auth menolak password
// < 6 karakter, jadi PIN 4 digit dipanjangkan dengan akhiran tetap ini.
const PIN_PASSWORD_SUFFIX = '-SKN';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Set env var SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY dulu sebelum menjalankan script ini.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// --- Departemen ---
const DEPARTMENTS = [
  // Produktif / Jurusan (approval: Koordinator Jurusan / HOD)
  { code: 'TKR', name: 'Produktif Teknik Kendaraan Ringan', type: 'JURUSAN' },
  { code: 'Mesin', name: 'Produktif Teknik Pemesinan', type: 'JURUSAN' },
  { code: 'Elind', name: 'Produktif Teknik Elektronika Industri', type: 'JURUSAN' },
  { code: 'TSM', name: 'Produktif Teknik Bisnis Sepeda Motor', type: 'JURUSAN' },
  { code: 'TKI', name: 'Produktif Teknik Komputer dan Informatika', type: 'JURUSAN' },
  { code: 'Akuntansi', name: 'Produktif Akuntansi dan Keuangan Lembaga', type: 'JURUSAN' },
  { code: 'Hotel', name: 'Produktif Perhotelan & Kuliner', type: 'JURUSAN' },
  { code: 'Listrik', name: 'Produktif Teknik Instalasi Tenaga Listrik', type: 'JURUSAN' },
  // MGMP / Non-Jurusan (approval: Wakasek)
  { code: 'MGMP-MTK', name: 'MGMP Matematika', type: 'NON_JURUSAN' },
  { code: 'MGMP-INA', name: 'MGMP Bahasa Indonesia', type: 'NON_JURUSAN' },
  { code: 'MGMP-ING', name: 'MGMP Bahasa Inggris', type: 'NON_JURUSAN' },
  { code: 'MGMP-JPG', name: 'MGMP Bahasa Jepang', type: 'NON_JURUSAN' },
  { code: 'MGMP-JER', name: 'MGMP Bahasa Jerman', type: 'NON_JURUSAN' },
  { code: 'MGMP-MND', name: 'MGMP Bahasa Mandarin', type: 'NON_JURUSAN' },
  { code: 'MGMP-PAI', name: 'MGMP Pendidikan Agama Islam', type: 'NON_JURUSAN' },
  { code: 'MGMP-INF', name: 'MGMP Informatika', type: 'NON_JURUSAN' },
  { code: 'MGMP-PJOK', name: 'MGMP PJOK', type: 'NON_JURUSAN' },
  // Unit pendukung untuk akun admin/koordinator/wakasek/superadmin
  { code: 'Management', name: 'Manajemen & Administrasi Sekolah', type: 'NON_JURUSAN' },
];

// --- Akun login: username dipakai sebagai {username}@simkonsumsi.local, password = pin ---
const USERS = [
  { username: 'admin-konsumsi', name: 'Admin Konsumsi', role: 'ADMIN_KONSUMSI', deptCode: 'Management', title: 'Koordinator Pelayanan Dapur & Logistik Konsumsi', pin: '1234' },
  { username: 'koordinator-jurusan', name: 'Koordinator Jurusan', role: 'HOD', deptCode: 'Management', title: 'Koordinator Approval Produktif Jurusan', pin: '1234' },
  { username: 'wakasek', name: 'Wakil Kepala Sekolah', role: 'WAKASEK', deptCode: 'Management', title: 'Wakasek - Approval MGMP', pin: '1234' },
  { username: 'superadmin', name: 'Super Admin', role: 'SUPERADMIN', deptCode: 'Management', title: 'Administrator Sistem', pin: '1234' },

  { username: 'req-tkr', name: 'Guru Produktif TKR', role: 'REQUESTER', deptCode: 'TKR', title: 'Guru Produktif Teknik Kendaraan Ringan', pin: '1234' },
  { username: 'req-mesin', name: 'Guru Produktif Mesin', role: 'REQUESTER', deptCode: 'Mesin', title: 'Guru Produktif Teknik Pemesinan', pin: '1234' },
  { username: 'req-elind', name: 'Guru Produktif Elind', role: 'REQUESTER', deptCode: 'Elind', title: 'Guru Produktif Teknik Elektronika Industri', pin: '1234' },
  { username: 'req-tsm', name: 'Guru Produktif TSM', role: 'REQUESTER', deptCode: 'TSM', title: 'Guru Produktif Teknik Bisnis Sepeda Motor', pin: '1234' },
  { username: 'req-tki', name: 'Guru Produktif TKI', role: 'REQUESTER', deptCode: 'TKI', title: 'Guru Produktif Teknik Komputer dan Informatika', pin: '1234' },
  { username: 'req-akuntansi', name: 'Guru Produktif Akuntansi', role: 'REQUESTER', deptCode: 'Akuntansi', title: 'Guru Produktif Akuntansi dan Keuangan Lembaga', pin: '1234' },
  { username: 'req-hotel', name: 'Guru Produktif Perhotelan', role: 'REQUESTER', deptCode: 'Hotel', title: 'Guru Produktif Perhotelan & Kuliner', pin: '1234' },
  { username: 'req-listrik', name: 'Guru Produktif Listrik', role: 'REQUESTER', deptCode: 'Listrik', title: 'Guru Produktif Teknik Instalasi Tenaga Listrik', pin: '1234' },

  { username: 'mgmp-matematika', name: 'Guru MGMP Matematika', role: 'REQUESTER', deptCode: 'MGMP-MTK', title: 'Guru MGMP Matematika', pin: '1234' },
  { username: 'mgmp-bindo', name: 'Guru MGMP Bahasa Indonesia', role: 'REQUESTER', deptCode: 'MGMP-INA', title: 'Guru MGMP Bahasa Indonesia', pin: '1234' },
  { username: 'mgmp-inggris', name: 'Guru MGMP Bahasa Inggris', role: 'REQUESTER', deptCode: 'MGMP-ING', title: 'Guru MGMP Bahasa Inggris', pin: '1234' },
  { username: 'mgmp-jepang', name: 'Guru MGMP Bahasa Jepang', role: 'REQUESTER', deptCode: 'MGMP-JPG', title: 'Guru MGMP Bahasa Jepang', pin: '1234' },
  { username: 'mgmp-jerman', name: 'Guru MGMP Bahasa Jerman', role: 'REQUESTER', deptCode: 'MGMP-JER', title: 'Guru MGMP Bahasa Jerman', pin: '1234' },
  { username: 'mgmp-mandarin', name: 'Guru MGMP Bahasa Mandarin', role: 'REQUESTER', deptCode: 'MGMP-MND', title: 'Guru MGMP Bahasa Mandarin', pin: '1234' },
  { username: 'mgmp-pai', name: 'Guru MGMP PAI', role: 'REQUESTER', deptCode: 'MGMP-PAI', title: 'Guru MGMP Pendidikan Agama Islam', pin: '1234' },
  { username: 'mgmp-informatika', name: 'Guru MGMP Informatika', role: 'REQUESTER', deptCode: 'MGMP-INF', title: 'Guru MGMP Informatika', pin: '1234' },
  { username: 'mgmp-pjok', name: 'Guru MGMP PJOK', role: 'REQUESTER', deptCode: 'MGMP-PJOK', title: 'Guru MGMP PJOK', pin: '1234' },
];

async function main() {
  console.log('1/3 — Membuat departemen...');
  const deptIdByCode = {};
  for (const dept of DEPARTMENTS) {
    const { data: existing } = await supabase.from('departments').select('id').eq('code', dept.code).maybeSingle();
    if (existing) {
      deptIdByCode[dept.code] = existing.id;
      console.log(`  = ${dept.code} sudah ada, dilewati`);
      continue;
    }
    const { data, error } = await supabase
      .from('departments')
      .insert({ code: dept.code, name: dept.name, type: dept.type, is_active: true })
      .select('id')
      .single();
    if (error) throw new Error(`Gagal insert departemen ${dept.code}: ${error.message}`);
    deptIdByCode[dept.code] = data.id;
    console.log(`  + ${dept.code}`);
  }

  console.log('2/3 — Membuat akun Supabase Auth + baris users...');
  const userIdByUsername = {};
  for (const u of USERS) {
    const email = `${u.username}@${AUTH_EMAIL_DOMAIN}`;

    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    let authUser = existingUsers?.users?.find((au) => au.email === email);

    if (!authUser) {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: `${u.pin}${PIN_PASSWORD_SUFFIX}`,
        email_confirm: true,
        user_metadata: { name: u.name, username: u.username },
      });
      if (error) throw new Error(`Gagal membuat auth user ${u.username}: ${error.message}`);
      authUser = data.user;
      console.log(`  + auth: ${u.username}`);
    } else {
      console.log(`  = auth: ${u.username} sudah ada, dilewati`);
    }

    userIdByUsername[u.username] = authUser.id;

    const { error: upsertError } = await supabase.from('users').upsert(
      {
        id: authUser.id,
        username: u.username,
        name: u.name,
        email,
        role: u.role,
        department_id: deptIdByCode[u.deptCode],
        title: u.title,
        is_active: true,
      },
      { onConflict: 'id' }
    );
    if (upsertError) throw new Error(`Gagal upsert public.users ${u.username}: ${upsertError.message}`);
  }

  console.log('3/3 — Menetapkan "Koordinator Jurusan" sebagai HOD semua departemen JURUSAN...');
  const { error: hodError } = await supabase
    .from('departments')
    .update({ hod_user_id: userIdByUsername['koordinator-jurusan'] })
    .eq('type', 'JURUSAN');
  if (hodError) throw new Error(`Gagal set koordinator jurusan: ${hodError.message}`);

  console.log('\nSelesai. Akun siap dipakai login (nama akan muncul di layar pilih-nama), semua PIN default: 1234');
  for (const u of USERS) {
    console.log(`  - ${u.name}  (${u.role})`);
  }
}

main().catch((err) => {
  console.error('\nSeed gagal:', err.message);
  process.exit(1);
});
