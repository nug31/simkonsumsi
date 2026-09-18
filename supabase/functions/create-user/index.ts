// Edge Function: create-user
//
// Dipanggil dari MasterDataView (SUPERADMIN) lewat supabase.functions.invoke('create-user', ...).
// Berjalan di server Supabase (Deno), memakai SUPABASE_SERVICE_ROLE_KEY yang
// diset sebagai secret Edge Function (bukan di client) untuk:
//   1. Memverifikasi pemanggil benar-benar SUPERADMIN.
//   2. Membuat akun Supabase Auth baru (email sintetis + PIN sebagai password).
//   3. Insert baris public.users dengan id yang sama dengan auth user.
//
// Deploy manual:
//   supabase functions deploy create-user
// (SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY sudah otomatis tersedia sebagai
// env var bawaan Edge Function di project Supabase, tidak perlu diset manual.)

import { createClient } from 'jsr:@supabase/supabase-js@2';

const AUTH_EMAIL_DOMAIN = 'simkonsumsi.local';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Client dengan hak pemanggil (JWT dari Authorization header) -- untuk verifikasi identitas & role.
  const callerClient = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user: callerAuthUser },
    error: callerAuthError,
  } = await callerClient.auth.getUser();

  if (callerAuthError || !callerAuthUser) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { data: callerProfile, error: callerProfileError } = await callerClient
    .from('users')
    .select('role')
    .eq('id', callerAuthUser.id)
    .single();

  if (callerProfileError || callerProfile?.role !== 'SUPERADMIN') {
    return new Response(JSON.stringify({ error: 'Hanya SUPERADMIN yang boleh menambah pengguna.' }), { status: 403 });
  }

  let body: {
    username?: string;
    name?: string;
    pin?: string;
    role?: string;
    department_id?: string;
    title?: string;
    phone_number?: string;
  };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Body JSON tidak valid' }), { status: 400 });
  }

  const { username, name, pin, role, department_id, title, phone_number } = body;

  if (!username || !name || !pin || !role || !department_id) {
    return new Response(
      JSON.stringify({ error: 'username, name, pin, role, dan department_id wajib diisi.' }),
      { status: 400 }
    );
  }
  if (!/^[a-z0-9._-]+$/.test(username)) {
    return new Response(
      JSON.stringify({ error: 'username hanya boleh huruf kecil, angka, titik, underscore, strip.' }),
      { status: 400 }
    );
  }
  if (pin.length < 4) {
    return new Response(JSON.stringify({ error: 'PIN minimal 4 karakter.' }), { status: 400 });
  }

  // Client admin (service_role) untuk operasi yang butuh bypass RLS / Auth Admin API.
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const email = `${username.toLowerCase()}@${AUTH_EMAIL_DOMAIN}`;

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password: pin,
    email_confirm: true,
    user_metadata: { name, username },
  });

  if (createError || !created.user) {
    return new Response(JSON.stringify({ error: `Gagal membuat akun: ${createError?.message}` }), { status: 400 });
  }

  const { error: insertError } = await adminClient.from('users').insert({
    id: created.user.id,
    username: username.toLowerCase(),
    name,
    email,
    role,
    department_id,
    title: title || null,
    phone_number: phone_number || null,
    is_active: true,
  });

  if (insertError) {
    // Rollback auth user supaya tidak jadi akun yatim tanpa profil.
    await adminClient.auth.admin.deleteUser(created.user.id);
    return new Response(JSON.stringify({ error: `Gagal menyimpan profil user: ${insertError.message}` }), {
      status: 400,
    });
  }

  return new Response(JSON.stringify({ success: true, id: created.user.id, email }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
