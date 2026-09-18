-- ====================================================================
-- SIMKONSUMSI: SEED DEPARTEMEN & AKUN AWAL (VERSI SQL MURNI)
--
-- Jalankan file ini di Supabase SQL Editor SETELAH schema.sql.
-- Aman dijalankan berkali-kali (idempotent): departemen & user yang
-- sudah ada akan di-update, bukan diduplikasi.
--
-- CATATAN PENTING: cara ini membuat baris auth.users langsung lewat SQL
-- (bukan lewat Admin API resmi Supabase). Ini teknik yang umum dipakai
-- untuk seeding, TAPI tidak didukung resmi oleh Supabase dan skema
-- internal tabel auth.* bisa berubah di versi Postgres/GoTrue mendatang.
-- Kalau login gagal setelah menjalankan file ini, gunakan jalur resmi
-- sebagai gantinya: scripts/seed.mjs (lewat Supabase Admin API).
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- --------------------------------------------------------------------
-- 1. DEPARTEMEN
-- --------------------------------------------------------------------
INSERT INTO departments (code, name, type, is_active) VALUES
  -- Produktif / Jurusan (approval: Koordinator Jurusan / HOD)
  ('TKR',       'Produktif Teknik Kendaraan Ringan',        'JURUSAN', true),
  ('Mesin',     'Produktif Teknik Pemesinan',                'JURUSAN', true),
  ('Elind',     'Produktif Teknik Elektronika Industri',     'JURUSAN', true),
  ('TSM',       'Produktif Teknik Bisnis Sepeda Motor',      'JURUSAN', true),
  ('TKI',       'Produktif Teknik Komputer dan Informatika', 'JURUSAN', true),
  ('Akuntansi', 'Produktif Akuntansi dan Keuangan Lembaga',  'JURUSAN', true),
  ('Hotel',     'Produktif Perhotelan & Kuliner',            'JURUSAN', true),
  ('Listrik',   'Produktif Teknik Instalasi Tenaga Listrik', 'JURUSAN', true),

  -- MGMP / Non-Jurusan (approval: Wakasek)
  ('MGMP-MTK',  'MGMP Matematika',                'NON_JURUSAN', true),
  ('MGMP-INA',  'MGMP Bahasa Indonesia',          'NON_JURUSAN', true),
  ('MGMP-ING',  'MGMP Bahasa Inggris',            'NON_JURUSAN', true),
  ('MGMP-JPG',  'MGMP Bahasa Jepang',             'NON_JURUSAN', true),
  ('MGMP-JER',  'MGMP Bahasa Jerman',             'NON_JURUSAN', true),
  ('MGMP-MND',  'MGMP Bahasa Mandarin',           'NON_JURUSAN', true),
  ('MGMP-PAI',  'MGMP Pendidikan Agama Islam',    'NON_JURUSAN', true),
  ('MGMP-INF',  'MGMP Informatika',               'NON_JURUSAN', true),
  ('MGMP-PJOK', 'MGMP PJOK',                      'NON_JURUSAN', true),

  -- Unit pendukung untuk akun admin/koordinator/wakasek/superadmin
  ('Management', 'Manajemen & Administrasi Sekolah', 'NON_JURUSAN', true)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------------------
-- 2. AKUN LOGIN (auth.users + public.users sekaligus)
-- Username login: {username}@simkonsumsi.local, password = PIN.
-- --------------------------------------------------------------------
DO $$
DECLARE
  v_user RECORD;
  v_email TEXT;
  v_dept_id UUID;
  v_user_id UUID;
BEGIN
  FOR v_user IN
    SELECT * FROM (VALUES
      -- username,            name,                              pin,    role,               dept_code,     title
      ('admin-konsumsi',      'Admin Konsumsi',                   '1234', 'ADMIN_KONSUMSI',   'Management',  'Koordinator Pelayanan Dapur & Logistik Konsumsi'),
      ('koordinator-jurusan', 'Koordinator Jurusan',               '1234', 'HOD',              'Management',  'Koordinator Approval Produktif Jurusan'),
      ('wakasek',             'Wakil Kepala Sekolah',              '1234', 'WAKASEK',          'Management',  'Wakasek - Approval MGMP'),
      ('superadmin',          'Super Admin',                       '1234', 'SUPERADMIN',       'Management',  'Administrator Sistem'),

      ('req-tkr',             'Guru Produktif TKR',                '1234', 'REQUESTER',        'TKR',         'Guru Produktif Teknik Kendaraan Ringan'),
      ('req-mesin',           'Guru Produktif Mesin',              '1234', 'REQUESTER',        'Mesin',       'Guru Produktif Teknik Pemesinan'),
      ('req-elind',           'Guru Produktif Elind',              '1234', 'REQUESTER',        'Elind',       'Guru Produktif Teknik Elektronika Industri'),
      ('req-tsm',             'Guru Produktif TSM',                '1234', 'REQUESTER',        'TSM',         'Guru Produktif Teknik Bisnis Sepeda Motor'),
      ('req-tki',             'Guru Produktif TKI',                '1234', 'REQUESTER',        'TKI',         'Guru Produktif Teknik Komputer dan Informatika'),
      ('req-akuntansi',       'Guru Produktif Akuntansi',          '1234', 'REQUESTER',        'Akuntansi',   'Guru Produktif Akuntansi dan Keuangan Lembaga'),
      ('req-hotel',           'Guru Produktif Perhotelan',         '1234', 'REQUESTER',        'Hotel',       'Guru Produktif Perhotelan & Kuliner'),
      ('req-listrik',         'Guru Produktif Listrik',            '1234', 'REQUESTER',        'Listrik',     'Guru Produktif Teknik Instalasi Tenaga Listrik'),

      ('mgmp-matematika',     'Guru MGMP Matematika',              '1234', 'REQUESTER',        'MGMP-MTK',    'Guru MGMP Matematika'),
      ('mgmp-bindo',          'Guru MGMP Bahasa Indonesia',        '1234', 'REQUESTER',        'MGMP-INA',    'Guru MGMP Bahasa Indonesia'),
      ('mgmp-inggris',        'Guru MGMP Bahasa Inggris',          '1234', 'REQUESTER',        'MGMP-ING',    'Guru MGMP Bahasa Inggris'),
      ('mgmp-jepang',         'Guru MGMP Bahasa Jepang',           '1234', 'REQUESTER',        'MGMP-JPG',    'Guru MGMP Bahasa Jepang'),
      ('mgmp-jerman',         'Guru MGMP Bahasa Jerman',           '1234', 'REQUESTER',        'MGMP-JER',    'Guru MGMP Bahasa Jerman'),
      ('mgmp-mandarin',       'Guru MGMP Bahasa Mandarin',         '1234', 'REQUESTER',        'MGMP-MND',    'Guru MGMP Bahasa Mandarin'),
      ('mgmp-pai',            'Guru MGMP PAI',                     '1234', 'REQUESTER',        'MGMP-PAI',    'Guru MGMP Pendidikan Agama Islam'),
      ('mgmp-informatika',    'Guru MGMP Informatika',             '1234', 'REQUESTER',        'MGMP-INF',    'Guru MGMP Informatika'),
      ('mgmp-pjok',           'Guru MGMP PJOK',                    '1234', 'REQUESTER',        'MGMP-PJOK',   'Guru MGMP PJOK')
    ) AS t(username, name, pin, role, dept_code, title)
  LOOP
    v_email := v_user.username || '@simkonsumsi.local';

    SELECT id INTO v_dept_id FROM departments WHERE code = v_user.dept_code;
    IF v_dept_id IS NULL THEN
      RAISE EXCEPTION 'Departemen dengan code % tidak ditemukan untuk user %', v_user.dept_code, v_user.username;
    END IF;

    -- Buat / update akun Supabase Auth (email + PIN sebagai password).
    -- Dicek manual (bukan ON CONFLICT) karena auth.users.email di Supabase
    -- di-unique-kan lewat partial index, bukan constraint biasa yang bisa
    -- dipakai sebagai target ON CONFLICT.
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

    IF v_user_id IS NULL THEN
      v_user_id := gen_random_uuid();
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        is_super_admin, is_sso_user, created_at, updated_at, last_sign_in_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
        v_email, crypt(v_user.pin, gen_salt('bf')),
        now(), '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('name', v_user.name, 'username', v_user.username),
        false, false, now(), now(), now()
      );
    ELSE
      UPDATE auth.users
      SET encrypted_password = crypt(v_user.pin, gen_salt('bf')),
          updated_at = now()
      WHERE id = v_user_id;
    END IF;

    -- Buat / update profil aplikasi
    INSERT INTO public.users (id, username, name, email, role, department_id, title, is_active)
    VALUES (
      v_user_id, v_user.username, v_user.name, v_email,
      v_user.role::user_role_enum, v_dept_id, v_user.title, true
    )
    ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          role = EXCLUDED.role,
          department_id = EXCLUDED.department_id,
          title = EXCLUDED.title,
          is_active = true;
  END LOOP;

  -- --------------------------------------------------------------------
  -- 3. Set "Koordinator Jurusan" sebagai HOD untuk semua departemen JURUSAN
  -- (satu akun approve semua produktif jurusan)
  -- --------------------------------------------------------------------
  UPDATE departments
  SET hod_user_id = (SELECT id FROM public.users WHERE username = 'koordinator-jurusan')
  WHERE type = 'JURUSAN';
END $$;
