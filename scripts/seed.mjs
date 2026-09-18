// Seed script SIMKONSUMSI -> Supabase
//
// Dijalankan MANUAL oleh admin sekolah, sekali saja, setelah schema.sql
// dijalankan di SQL Editor Supabase. Script ini butuh SERVICE ROLE KEY
// (bukan anon key) karena harus membuat akun Supabase Auth untuk tiap
// guru/staff -- key ini TIDAK BOLEH ditaruh di .env.local / dibagikan,
// cukup dipakai sekali lewat env var sesaat lalu dibuang dari shell history.
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

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Set env var SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY dulu sebelum menjalankan script ini.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// --- Data departemen (diambil dari src/data/initialData.ts) ---
// hodUsername diisi belakangan setelah user dibuat (lihat DEPT_HOD_USERNAME di bawah).
const DEPARTMENTS = [
  { code: 'TKR', name: 'Teknik Kendaraan Ringan Otomotif', type: 'JURUSAN' },
  { code: 'TSM', name: 'Teknik Bisnis Sepeda Motor', type: 'JURUSAN' },
  { code: 'Teknik Mesin', name: 'Teknik Pemesinan & CNC', type: 'JURUSAN' },
  { code: 'Listrik', name: 'Teknik Instalasi Tenaga Listrik', type: 'JURUSAN' },
  { code: 'Elind', name: 'Teknik Elektronika Industri', type: 'JURUSAN' },
  { code: 'Akuntansi', name: 'Akuntansi dan Keuangan Lembaga', type: 'JURUSAN' },
  { code: 'Perhotelan', name: 'Perhotelan & Kuliner', type: 'JURUSAN' },
  { code: 'TKI', name: 'Teknik Komputer dan Informatika', type: 'JURUSAN' },
  { code: 'Kurikulum', name: 'Bagian Pengembangan Kurikulum & Pembelajaran', type: 'NON_JURUSAN' },
  { code: 'Kesiswaan', name: 'Bagian Kesiswaan & Kedisiplinan Taruna', type: 'NON_JURUSAN' },
  { code: 'Hubin', name: 'Hubungan Industri & BKK (Bursa Kerja Khusus)', type: 'NON_JURUSAN' },
  { code: 'Sarpras', name: 'Sarana, Prasarana & Logistik Sekolah', type: 'NON_JURUSAN' },
  { code: 'Tata Usaha', name: 'Tata Usaha & Administrasi Umum', type: 'NON_JURUSAN' },
  { code: 'HR', name: 'Sumber Daya Manusia & Tenaga Pendidik', type: 'NON_JURUSAN' },
  { code: 'Management', name: 'Manajemen Mutu & Direksi Sekolah', type: 'NON_JURUSAN' },
];

// --- Data user (diambil dari src/data/initialData.ts) ---
// username dipakai sebagai login: {username}@simkonsumsi.local, password = pin.
const USERS = [
  { username: 'req-tkr', name: 'Bu Siti Rahmawati, S.Pd', role: 'REQUESTER', deptCode: 'TKR', title: 'Guru Produktif Otomotif TKR', phone: '6281234567801', pin: '1234' },
  { username: 'hod-tkr', name: 'Pak Bambang Haryono, S.T.', role: 'HOD', deptCode: 'TKR', title: 'Koordinator / Ka. Program Keahlian TKR', phone: '6281234567802', pin: '1234' },
  { username: 'req-kurikulum', name: 'Bu Ratna Kusuma, M.Pd', role: 'REQUESTER', deptCode: 'Kurikulum', title: 'Staff Pengembangan Kurikulum Merdeka', phone: '6281234567803', pin: '1234' },
  { username: 'wakasek', name: 'Drs. H. Mulyadi, M.M.', role: 'WAKASEK', deptCode: 'Management', title: 'Wakil Kepala Sekolah Bidang Kurikulum & Sarpras', phone: '6281234567804', pin: '1234' },
  { username: 'admin-konsumsi', name: 'Ibu Sri Utami, S.E.', role: 'ADMIN_KONSUMSI', deptCode: 'Sarpras', title: 'Koordinator Pelayanan Dapur & Logistik Konsumsi', phone: '6281234567805', pin: '1234' },
  { username: 'superadmin', name: 'Ahmad Fauzi, S.Kom', role: 'SUPERADMIN', deptCode: 'Tata Usaha', title: 'Administrator SIM Sekolah & IT Support', phone: '6281234567806', pin: '1234' },
  { username: 'hod-tsm', name: 'Pak Danang Prasetyo, S.Pd', role: 'HOD', deptCode: 'TSM', title: 'Ka. Program Keahlian TSM', phone: '6281234567807', pin: '1234' },
  { username: 'hod-mesin', name: 'Pak Tri Wahyudi, S.T.', role: 'HOD', deptCode: 'Teknik Mesin', title: 'Ka. Program Keahlian Mesin', phone: '6281234567808', pin: '1234' },
  { username: 'hod-listrik', name: 'Pak Eko Santoso, S.T.', role: 'HOD', deptCode: 'Listrik', title: 'Ka. Program Keahlian Listrik', phone: '6281234567809', pin: '1234' },
  { username: 'hod-elind', name: 'Bu Anisa Putri, M.T.', role: 'HOD', deptCode: 'Elind', title: 'Ka. Program Keahlian Elind', phone: '6281234567810', pin: '1234' },
  { username: 'hod-akuntansi', name: 'Bu Maya Sari, S.E.', role: 'HOD', deptCode: 'Akuntansi', title: 'Ka. Program Keahlian Akuntansi', phone: '6281234567811', pin: '1234' },
  { username: 'hod-perhotelan', name: 'Bu Dewi Lestari, S.Pd', role: 'HOD', deptCode: 'Perhotelan', title: 'Ka. Program Keahlian Perhotelan', phone: '6281234567812', pin: '1234' },
  { username: 'hod-tki', name: 'Pak Fajar Nugraha, M.Kom', role: 'HOD', deptCode: 'TKI', title: 'Ka. Program Keahlian TKI', phone: '6281234567813', pin: '1234' },
];

// Mapping deptCode -> username HOD (untuk mengisi departments.hod_user_id setelah user dibuat)
const DEPT_HOD_USERNAME = {
  TKR: 'hod-tkr',
  TSM: 'hod-tsm',
  'Teknik Mesin': 'hod-mesin',
  Listrik: 'hod-listrik',
  Elind: 'hod-elind',
  Akuntansi: 'hod-akuntansi',
  Perhotelan: 'hod-perhotelan',
  TKI: 'hod-tki',
};

async function main() {
  console.log('1/4 — Membuat departemen...');
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

  console.log('2/4 — Membuat akun Supabase Auth + baris users...');
  const userIdByUsername = {};
  for (const u of USERS) {
    const email = `${u.username}@${AUTH_EMAIL_DOMAIN}`;

    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    let authUser = existingUsers?.users?.find((au) => au.email === email);

    if (!authUser) {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: u.pin,
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
        phone_number: u.phone,
        is_active: true,
      },
      { onConflict: 'id' }
    );
    if (upsertError) throw new Error(`Gagal upsert public.users ${u.username}: ${upsertError.message}`);
  }

  console.log('3/4 — Menetapkan HOD tiap jurusan...');
  for (const [deptCode, hodUsername] of Object.entries(DEPT_HOD_USERNAME)) {
    const { error } = await supabase
      .from('departments')
      .update({ hod_user_id: userIdByUsername[hodUsername] })
      .eq('id', deptIdByCode[deptCode]);
    if (error) throw new Error(`Gagal set HOD ${deptCode}: ${error.message}`);
  }

  console.log('4/4 — Selesai.');
  console.log('\nAkun siap dipakai login (nama akan muncul di layar pilih-nama), semua PIN default: 1234');
  for (const u of USERS) {
    console.log(`  - ${u.name}  (${u.role})`);
  }
}

main().catch((err) => {
  console.error('\nSeed gagal:', err.message);
  process.exit(1);
});
