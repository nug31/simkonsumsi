-- ====================================================================
-- SIMKONSUMSI: SISTEM PERMINTAAN KONSUMSI GURU TAMU (POSTGRESQL / SUPABASE)
-- Schema, Enum, Relasi, Auth linkage, Trigger Nomor Otomatis, RLS, Storage
--
-- Jalankan file ini SEKALI, utuh, di Supabase SQL Editor pada project
-- yang masih kosong (public schema baru). Aman dijalankan ulang
-- (idempotent) berkat IF NOT EXISTS / DROP POLICY IF EXISTS / CREATE OR REPLACE.
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS (dibungkus DO block supaya aman dijalankan ulang)
DO $$ BEGIN
  CREATE TYPE department_type_enum AS ENUM ('JURUSAN', 'NON_JURUSAN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM ('REQUESTER', 'HOD', 'WAKASEK', 'ADMIN_KONSUMSI', 'SUPERADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE request_status_enum AS ENUM (
      'DRAFT',
      'WAITING_HOD',
      'WAITING_WAKASEK',
      'APPROVED_HOD',
      'APPROVED_WAKASEK',
      'PROCESSING',
      'READY',
      'COMPLETED',
      'REJECTED',
      'REVISION_REQUIRED',
      'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE approval_action_enum AS ENUM ('APPROVE', 'REJECT', 'REQUEST_REVISION');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_type_enum AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'DANGER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    type department_type_enum NOT NULL,
    hod_user_id UUID, -- References users(id), nullable
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. USERS TABLE
-- id SENGAJA tidak punya default: harus sama persis dengan auth.users(id)
-- (dibuat lewat Supabase Auth admin API / Edge Function create-user, bukan insert biasa)
-- sehingga auth.uid() di RLS langsung match dengan public.users.id.
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL UNIQUE, -- dipakai untuk login: {username}@simkonsumsi.local + PIN sebagai password
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE, -- email login sintetis (sama dgn auth.users.email)
    role user_role_enum NOT NULL DEFAULT 'REQUESTER',
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    title VARCHAR(150),
    phone_number VARCHAR(25),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tambahkan foreign key untuk hod_user_id di departments
DO $$ BEGIN
  ALTER TABLE departments
  ADD CONSTRAINT fk_department_hod
  FOREIGN KEY (hod_user_id) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. CONSUMPTION REQUESTS TABLE
CREATE TABLE IF NOT EXISTS consumption_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_number VARCHAR(30) NOT NULL UNIQUE,
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    activity_type VARCHAR(50) NOT NULL,
    activity_name VARCHAR(255) NOT NULL,
    guest_name VARCHAR(255) NOT NULL,
    consumption_date DATE NOT NULL,
    consumption_time TIME NOT NULL,
    guest_count INT NOT NULL CHECK (guest_count > 0),
    consumption_type VARCHAR(50) NOT NULL,
    consumption_detail TEXT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    estimated_budget NUMERIC(12, 2) DEFAULT 0,
    notes TEXT,
    location VARCHAR(150),
    attachment_name VARCHAR(255),
    attachment_url TEXT,
    status request_status_enum NOT NULL DEFAULT 'DRAFT',
    target_approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    target_approval_type VARCHAR(20) NOT NULL DEFAULT 'HOD',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrasi untuk database yang sudah ada sebelum kolom ini ditambahkan
-- (CREATE TABLE IF NOT EXISTS di atas tidak menyentuh tabel yang sudah ada).
ALTER TABLE consumption_requests ADD COLUMN IF NOT EXISTS location VARCHAR(150);

-- 6. APPROVALS TABLE
CREATE TABLE IF NOT EXISTS approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES consumption_requests(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    approver_role VARCHAR(20) NOT NULL,
    action approval_action_enum NOT NULL,
    notes TEXT,
    approved_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CONSUMPTION PROCESSING TABLE
CREATE TABLE IF NOT EXISTS consumption_processing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES consumption_requests(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status VARCHAR(30) NOT NULL,
    notes TEXT,
    processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_id UUID REFERENCES consumption_requests(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type notification_type_enum DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name VARCHAR(150) NOT NULL,
    request_id UUID REFERENCES consumption_requests(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 10. NOMOR PENGAJUAN OTOMATIS (KNS-YYYYMMDD-XXX) — ATOMIC, ANTI RACE CONDITION
-- ====================================================================

-- Tabel counter per-hari. Tidak digrant ke anon/authenticated secara
-- langsung -- hanya diakses lewat fungsi SECURITY DEFINER di bawah.
CREATE TABLE IF NOT EXISTS request_number_seq (
    seq_date DATE PRIMARY KEY,
    counter INT NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TRIGGER AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
    today_str VARCHAR(8) := TO_CHAR(today_date, 'YYYYMMDD');
    next_seq INT;
BEGIN
    -- INSERT ... ON CONFLICT DO UPDATE ... RETURNING adalah operasi atomic
    -- tunggal di Postgres: aman dari race condition saat banyak pengajuan
    -- masuk bersamaan di hari yang sama (tidak seperti SELECT COUNT(*)+1).
    INSERT INTO request_number_seq (seq_date, counter)
    VALUES (today_date, 1)
    ON CONFLICT (seq_date) DO UPDATE SET counter = request_number_seq.counter + 1
    RETURNING counter INTO next_seq;

    NEW.request_number := 'KNS-' || today_str || '-' || LPAD(next_seq::TEXT, 3, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_generate_request_number ON consumption_requests;
CREATE TRIGGER trg_generate_request_number
BEFORE INSERT ON consumption_requests
FOR EACH ROW
WHEN (NEW.request_number IS NULL OR NEW.request_number = '')
EXECUTE FUNCTION generate_request_number();

-- ====================================================================
-- 11. HELPER FUNCTIONS UNTUK RLS (SECURITY DEFINER supaya tidak rekursif)
-- ====================================================================

CREATE OR REPLACE FUNCTION public.current_role()
RETURNS user_role_enum
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_department_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT department_id FROM public.users WHERE id = auth.uid();
$$;

-- ====================================================================
-- 12. STAFF DIRECTORY VIEW (untuk daftar "pilih nama" di layar login,
-- sebelum user authenticated -- TIDAK berisi email/kolom sensitif).
-- View ini SENGAJA dibuat tanpa security_invoker, sehingga berjalan
-- dengan hak akses pemilik view (bypass RLS tabel users) supaya anon
-- bisa membaca daftar staff aktif untuk memilih akun sebelum login.
-- ====================================================================
CREATE OR REPLACE VIEW public.staff_directory AS
SELECT id, username, name, title, role, department_id, avatar_url, is_active
FROM public.users
WHERE is_active = true;

GRANT SELECT ON public.staff_directory TO anon, authenticated;
GRANT SELECT ON public.departments TO anon, authenticated;

-- ====================================================================
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumption_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumption_processing ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ---- departments ----
-- SELECT dibuka juga untuk anon: dipakai layar login (pilih nama) untuk
-- menampilkan nama unit/jurusan staff SEBELUM user login.
DROP POLICY IF EXISTS "Authenticated can view departments" ON departments;
DROP POLICY IF EXISTS "Anyone can view departments" ON departments;
CREATE POLICY "Anyone can view departments"
ON departments FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Superadmin can manage departments" ON departments;
CREATE POLICY "Superadmin can manage departments"
ON departments FOR ALL
TO authenticated
USING (public.current_role() = 'SUPERADMIN')
WITH CHECK (public.current_role() = 'SUPERADMIN');

-- ---- users ----
-- Semua user authenticated boleh lihat seluruh directory pegawai (perlu
-- untuk dropdown approver/penerima notifikasi). Insert/update/delete
-- TIDAK diizinkan lewat client -- hanya lewat Edge Function create-user
-- yang memakai service_role key (bypass RLS sepenuhnya).
DROP POLICY IF EXISTS "Authenticated can view users" ON users;
CREATE POLICY "Authenticated can view users"
ON users FOR SELECT
TO authenticated
USING (true);

-- ---- consumption_requests ----
DROP POLICY IF EXISTS "Requester can view own requests" ON consumption_requests;
DROP POLICY IF EXISTS "Admin and Superadmin can view all requests" ON consumption_requests;
DROP POLICY IF EXISTS "HOD can view department requests" ON consumption_requests;
DROP POLICY IF EXISTS "Wakasek can view non-jurusan requests" ON consumption_requests;
DROP POLICY IF EXISTS "cr_select" ON consumption_requests;
CREATE POLICY "cr_select"
ON consumption_requests FOR SELECT
TO authenticated
USING (
    requester_id = auth.uid()
    OR target_approver_id = auth.uid()
    OR public.current_role() IN ('ADMIN_KONSUMSI', 'SUPERADMIN')
    OR (public.current_role() = 'HOD' AND department_id = public.current_department_id())
    OR (
        public.current_role() = 'WAKASEK'
        AND EXISTS (
            SELECT 1 FROM departments d
            WHERE d.id = consumption_requests.department_id AND d.type = 'NON_JURUSAN'
        )
    )
);

DROP POLICY IF EXISTS "cr_insert" ON consumption_requests;
CREATE POLICY "cr_insert"
ON consumption_requests FOR INSERT
TO authenticated
WITH CHECK (requester_id = auth.uid());

-- Requester boleh ubah pengajuannya sendiri kecuali sudah final
-- (COMPLETED/CANCELLED); approver (HOD/Wakasek target) boleh ubah saat
-- menunggu approval-nya; Admin Konsumsi/Superadmin boleh ubah saat
-- proses dapur berjalan.
DROP POLICY IF EXISTS "cr_update" ON consumption_requests;
CREATE POLICY "cr_update"
ON consumption_requests FOR UPDATE
TO authenticated
USING (
    (requester_id = auth.uid() AND status NOT IN ('COMPLETED', 'CANCELLED'))
    OR (target_approver_id = auth.uid() AND status IN ('WAITING_HOD', 'WAITING_WAKASEK'))
    OR (public.current_role() IN ('ADMIN_KONSUMSI', 'SUPERADMIN'))
)
WITH CHECK (
    (requester_id = auth.uid() AND status NOT IN ('COMPLETED', 'CANCELLED'))
    OR (target_approver_id = auth.uid())
    OR (public.current_role() IN ('ADMIN_KONSUMSI', 'SUPERADMIN'))
);

-- ---- approvals ----
-- Siapapun yang boleh melihat consumption_requests induknya (lewat RLS
-- cr_select) otomatis boleh melihat riwayat approval-nya juga.
DROP POLICY IF EXISTS "ap_select" ON approvals;
CREATE POLICY "ap_select"
ON approvals FOR SELECT
TO authenticated
USING (
    EXISTS (SELECT 1 FROM consumption_requests r WHERE r.id = approvals.request_id)
);

-- SUPERADMIN boleh approve/reject atas nama siapapun (override), selain
-- approver asli (target_approver_id) yang mengajukan approval untuk dirinya sendiri.
DROP POLICY IF EXISTS "ap_insert" ON approvals;
CREATE POLICY "ap_insert"
ON approvals FOR INSERT
TO authenticated
WITH CHECK (
    approver_id = auth.uid()
    AND (
        public.current_role() = 'SUPERADMIN'
        OR EXISTS (
            SELECT 1 FROM consumption_requests r
            WHERE r.id = approvals.request_id AND r.target_approver_id = auth.uid()
        )
    )
);

-- ---- consumption_processing ----
-- Sama seperti approvals: mengikuti visibilitas consumption_requests induknya.
DROP POLICY IF EXISTS "cp_select" ON consumption_processing;
CREATE POLICY "cp_select"
ON consumption_processing FOR SELECT
TO authenticated
USING (
    EXISTS (SELECT 1 FROM consumption_requests r WHERE r.id = consumption_processing.request_id)
);

DROP POLICY IF EXISTS "cp_insert" ON consumption_processing;
CREATE POLICY "cp_insert"
ON consumption_processing FOR INSERT
TO authenticated
WITH CHECK (
    admin_id = auth.uid()
    AND public.current_role() IN ('ADMIN_KONSUMSI', 'SUPERADMIN')
);

-- ---- notifications ----
DROP POLICY IF EXISTS "notif_select" ON notifications;
CREATE POLICY "notif_select"
ON notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notif_update" ON notifications;
CREATE POLICY "notif_update"
ON notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- INSERT dibuka untuk semua authenticated: notifikasi selalu dibuat
-- sebagai efek samping dari aksi yang sudah divalidasi RLS tabel lain
-- (mis. approve request memicu notifikasi ke requester & admin).
DROP POLICY IF EXISTS "notif_insert" ON notifications;
CREATE POLICY "notif_insert"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- ---- audit_logs ----
DROP POLICY IF EXISTS "audit_select" ON audit_logs;
CREATE POLICY "audit_select"
ON audit_logs FOR SELECT
TO authenticated
USING (public.current_role() IN ('ADMIN_KONSUMSI', 'SUPERADMIN', 'WAKASEK'));

DROP POLICY IF EXISTS "audit_insert" ON audit_logs;
CREATE POLICY "audit_insert"
ON audit_logs FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- ====================================================================
-- 14. STORAGE: bucket lampiran pengajuan (private)
-- ====================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Path lampiran wajib berformat {auth.uid()}/nama-file agar policy folder bekerja.
DROP POLICY IF EXISTS "attachments_insert_own_folder" ON storage.objects;
CREATE POLICY "attachments_insert_own_folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "attachments_select_own_or_reviewer" ON storage.objects;
CREATE POLICY "attachments_select_own_or_reviewer"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'attachments'
    AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR public.current_role() IN ('HOD', 'WAKASEK', 'ADMIN_KONSUMSI', 'SUPERADMIN')
    )
);

-- ====================================================================
-- 15. REALTIME: daftarkan tabel ke publication supaya perubahan
-- ter-push otomatis ke client lewat supabase.channel(...).on('postgres_changes', ...)
-- (dibungkus DO block karena ALTER PUBLICATION ADD TABLE gagal jika dijalankan dua kali)
-- ====================================================================
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE consumption_requests; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE approvals; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE consumption_processing; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE notifications; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE departments; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE users; EXCEPTION WHEN OTHERS THEN NULL; END $$;
