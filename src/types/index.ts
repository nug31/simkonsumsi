export type DepartmentType = 'JURUSAN' | 'NON_JURUSAN';

export type UserRole = 'REQUESTER' | 'HOD' | 'WAKASEK' | 'ADMIN_KONSUMSI' | 'SUPERADMIN';

export type ActivityType = 
  | 'Guru Tamu'
  | 'Trainer'
  | 'Instruktur'
  | 'Narasumber'
  | 'Pendalaman Materi'
  | 'Meeting'
  | 'Workshop'
  | 'Pelatihan'
  | 'Kegiatan Sekolah'
  | 'Lainnya';

export type ConsumptionType = 
  | 'Snack'
  | 'Makan'
  | 'Snack + Makan'
  | 'Minuman'
  | 'Lainnya';

export type RequestStatus = 
  | 'DRAFT'
  | 'WAITING_HOD'
  | 'WAITING_WAKASEK'
  | 'APPROVED_HOD'
  | 'APPROVED_WAKASEK'
  | 'PROCESSING'
  | 'READY'
  | 'COMPLETED'
  | 'REJECTED'
  | 'REVISION_REQUIRED'
  | 'CANCELLED';

export interface Department {
  id: string;
  code: string;
  name: string;
  type: DepartmentType;
  hod_user_id: string | null; // null for non-jurusan or unassigned
  is_active: boolean;
}

export interface User {
  id: string;
  username: string; // login: {username}@simkonsumsi.local, password = PIN
  name: string;
  email: string;
  role: UserRole;
  department_id: string;
  avatar_url?: string;
  phone_number?: string;
  title?: string;
  is_active: boolean;
  created_at: string;
}

// Kolom aman yang boleh dilihat publik (belum login) di layar "pilih nama".
export interface StaffDirectoryEntry {
  id: string;
  username: string;
  name: string;
  title?: string;
  role: UserRole;
  department_id: string;
  avatar_url?: string;
  is_active: boolean;
}

export interface ConsumptionRequest {
  id: string;
  request_number: string; // e.g. KNS-20260914-001
  requester_id: string;
  department_id: string;
  activity_type: ActivityType;
  activity_name: string;
  guest_name: string;
  consumption_date: string; // YYYY-MM-DD
  consumption_time: string; // HH:MM
  guest_count: number;
  consumption_type: ConsumptionType;
  consumption_detail: string;
  quantity: number;
  estimated_budget?: number;
  notes?: string;
  attachment_name?: string;
  attachment_url?: string;
  status: RequestStatus;
  target_approver_id: string; // Auto-resolved approver user id
  target_approval_type: 'HOD' | 'WAKASEK';
  created_at: string;
  updated_at: string;
}

export interface ApprovalRecord {
  id: string;
  request_id: string;
  approver_id: string;
  approver_role: 'HOD' | 'WAKASEK' | 'SUPERADMIN';
  action: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION';
  notes: string;
  approved_at: string;
}

export interface ConsumptionProcessing {
  id: string;
  request_id: string;
  admin_id: string;
  status: 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  processed_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  request_id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER';
  is_read: boolean;
  created_at: string;
}

export interface AuditLogItem {
  id: string;
  user_id: string;
  user_name: string;
  request_id?: string;
  action: string;
  description: string;
  created_at: string;
}

export interface ApproverInfo {
  approverUser: User | null;
  approvalType: 'HOD' | 'WAKASEK';
  departmentName: string;
}
