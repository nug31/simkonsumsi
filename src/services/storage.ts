import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, usernameToAuthEmail, pinToPassword } from '../lib/supabaseClient';
import {
  Department,
  User,
  ConsumptionRequest,
  ApprovalRecord,
  ConsumptionProcessing,
  NotificationItem,
  AuditLogItem,
  RequestStatus,
  ApproverInfo,
  StaffDirectoryEntry,
} from '../types';

function upsertById<T extends { id: string }>(list: T[], item: T): T[] {
  const idx = list.findIndex(i => i.id === item.id);
  if (idx === -1) return [item, ...list];
  const next = [...list];
  next[idx] = item;
  return next;
}

function removeById<T extends { id: string }>(list: T[], id: string): T[] {
  return list.filter(i => i.id !== id);
}

function byCreatedAtDesc<T extends { created_at: string }>(a: T, b: T): number {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

class SupabaseDataService {
  private departments: Department[] = [];
  private users: User[] = [];
  private requests: ConsumptionRequest[] = [];
  private approvals: ApprovalRecord[] = [];
  private processing: ConsumptionProcessing[] = [];
  private notifications: NotificationItem[] = [];
  private auditLogs: AuditLogItem[] = [];
  private staffDirectory: StaffDirectoryEntry[] = [];

  private currentUser: User | null = null;
  private authLoading = true;
  private channel: RealtimeChannel | null = null;
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadStaffDirectory();
    this.loadPublicDepartments();
    supabase.auth.onAuthStateChange((_event, session) => {
      this.handleSession(session?.user?.id ?? null);
    });
  }

  // Departemen bisa dibaca publik (anon) supaya layar login bisa
  // menampilkan nama unit/jurusan sebelum user login.
  private async loadPublicDepartments(): Promise<void> {
    const { data, error } = await supabase.from('departments').select('*').order('name');
    if (error) {
      console.error('Gagal memuat departemen publik:', error.message);
      return;
    }
    this.departments = (data || []) as Department[];
    this.notify();
  }

  // ---- Subscribe (Observer pattern for React) ----
  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(fn => fn());
  }

  // ---- Session / bootstrap ----
  private async handleSession(userId: string | null): Promise<void> {
    if (!userId) {
      this.currentUser = null;
      this.requests = [];
      this.approvals = [];
      this.processing = [];
      this.notifications = [];
      this.auditLogs = [];
      this.unsubscribeRealtime();
      this.authLoading = false;
      this.notify();
      return;
    }

    await this.loadCurrentUser(userId);
    if (this.currentUser) {
      await this.loadAllData();
      this.subscribeRealtime();
    }
    this.authLoading = false;
    this.notify();
  }

  private async loadCurrentUser(userId: string): Promise<void> {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
    if (error || !data) {
      console.error('Gagal memuat profil user:', error?.message);
      this.currentUser = null;
      return;
    }
    this.currentUser = data as User;
  }

  private async loadStaffDirectory(): Promise<void> {
    const { data, error } = await supabase.from('staff_directory').select('*').order('name');
    if (error) {
      console.error('Gagal memuat staff directory:', error.message);
      return;
    }
    this.staffDirectory = (data || []) as StaffDirectoryEntry[];
    this.notify();
  }

  private async loadAllData(): Promise<void> {
    const [deptRes, usersRes, reqRes, apprRes, procRes, notifRes, auditRes] = await Promise.all([
      supabase.from('departments').select('*').order('name'),
      supabase.from('users').select('*').order('name'),
      supabase.from('consumption_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('approvals').select('*').order('approved_at', { ascending: false }),
      supabase.from('consumption_processing').select('*').order('processed_at', { ascending: false }),
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', this.currentUser!.id)
        .order('created_at', { ascending: false }),
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }),
    ]);

    if (deptRes.error) console.error('departments:', deptRes.error.message);
    if (usersRes.error) console.error('users:', usersRes.error.message);
    if (reqRes.error) console.error('consumption_requests:', reqRes.error.message);
    if (apprRes.error) console.error('approvals:', apprRes.error.message);
    if (procRes.error) console.error('consumption_processing:', procRes.error.message);
    if (notifRes.error) console.error('notifications:', notifRes.error.message);
    if (auditRes.error) console.error('audit_logs:', auditRes.error.message);

    this.departments = (deptRes.data || []) as Department[];
    this.users = (usersRes.data || []) as User[];
    this.requests = (reqRes.data || []) as ConsumptionRequest[];
    this.approvals = (apprRes.data || []) as ApprovalRecord[];
    this.processing = (procRes.data || []) as ConsumptionProcessing[];
    this.notifications = (notifRes.data || []) as NotificationItem[];
    this.auditLogs = (auditRes.data || []) as AuditLogItem[];
  }

  private subscribeRealtime(): void {
    this.unsubscribeRealtime();

    this.channel = supabase
      .channel('simkonsumsi-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consumption_requests' }, payload => {
        this.requests = this.reduceChange(this.requests, payload, true);
        this.notify();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'approvals' }, payload => {
        this.approvals = this.reduceChange(this.approvals, payload, false);
        this.notify();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consumption_processing' }, payload => {
        this.processing = this.reduceChange(this.processing, payload, false);
        this.notify();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, payload => {
        this.notifications = this.reduceChange(this.notifications, payload, false);
        this.notify();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, payload => {
        this.auditLogs = this.reduceChange(this.auditLogs, payload, true);
        this.notify();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'departments' }, payload => {
        this.departments = this.reduceChange(this.departments, payload, false);
        this.notify();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, payload => {
        this.users = this.reduceChange(this.users, payload, false);
        this.notify();
      })
      .subscribe();
  }

  private unsubscribeRealtime(): void {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }

  private reduceChange<T extends { id: string; created_at?: string }>(
    list: T[],
    payload: { eventType: string; new: unknown; old: unknown },
    sortByCreatedAt: boolean
  ): T[] {
    if (payload.eventType === 'DELETE') {
      return removeById(list, (payload.old as T).id);
    }
    const updated = upsertById(list, payload.new as T);
    if (sortByCreatedAt) updated.sort(byCreatedAtDesc as (a: T, b: T) => number);
    return updated;
  }

  // ---- GETTERS (synchronous, read from in-memory cache) ----
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public isAuthLoading(): boolean {
    return this.authLoading;
  }

  public getStaffDirectory(): StaffDirectoryEntry[] {
    return [...this.staffDirectory];
  }

  public getUsers(): User[] {
    return [...this.users];
  }

  public getDepartments(): Department[] {
    return [...this.departments];
  }

  public getDepartmentById(id: string): Department | undefined {
    return this.departments.find(d => d.id === id);
  }

  public getUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  public getRequests(): ConsumptionRequest[] {
    return [...this.requests];
  }

  public getRequestById(id: string): ConsumptionRequest | undefined {
    return this.requests.find(r => r.id === id);
  }

  public getApprovalsByRequestId(requestId: string): ApprovalRecord[] {
    return this.approvals.filter(a => a.request_id === requestId);
  }

  public getProcessingByRequestId(requestId: string): ConsumptionProcessing[] {
    return this.processing.filter(p => p.request_id === requestId);
  }

  public getNotificationsForUser(userId: string): NotificationItem[] {
    return this.notifications
      .filter(n => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getAuditLogs(): AuditLogItem[] {
    return [...this.auditLogs];
  }

  // AUTOMATIC APPROVAL ROUTING ENGINE
  public getApproverForUser(user: User): ApproverInfo {
    const dept = this.departments.find(d => d.id === user.department_id);

    if (dept && dept.type === 'JURUSAN') {
      let hodUser: User | null = null;
      if (dept.hod_user_id) {
        hodUser = this.users.find(u => u.id === dept.hod_user_id) || null;
      }
      if (!hodUser) {
        hodUser = this.users.find(u => u.department_id === dept.id && u.role === 'HOD') || null;
      }
      return { approverUser: hodUser, approvalType: 'HOD', departmentName: dept.name };
    } else {
      const wakasekUser = this.users.find(u => u.role === 'WAKASEK' && u.is_active) || null;
      return {
        approverUser: wakasekUser,
        approvalType: 'WAKASEK',
        departmentName: dept ? dept.name : 'Unit Non-Jurusan',
      };
    }
  }

  // ---- Internal helpers to write audit log / notification rows ----
  private async insertAuditLog(entry: {
    user_id: string;
    user_name: string;
    request_id?: string;
    action: string;
    description: string;
  }): Promise<void> {
    const { data, error } = await supabase.from('audit_logs').insert(entry).select().single();
    if (error) {
      console.error('Gagal menulis audit log:', error.message);
      return;
    }
    this.auditLogs = upsertById(this.auditLogs, data as AuditLogItem).sort(byCreatedAtDesc);
  }

  private async insertNotification(entry: {
    user_id: string;
    request_id?: string;
    title: string;
    message: string;
    type: NotificationItem['type'];
  }): Promise<void> {
    const { error } = await supabase.from('notifications').insert({ ...entry, is_read: false });
    if (error) console.error('Gagal menulis notifikasi:', error.message);
  }

  // ---- AUTH ----
  public async loginWithPin(
    username: string,
    pin: string
  ): Promise<{ success: boolean; message?: string; user?: User }> {
    const email = usernameToAuthEmail(username);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pinToPassword(pin) });
    if (error || !data.user) {
      return { success: false, message: 'Nama/PIN tidak valid. Coba lagi.' };
    }
    await this.loadCurrentUser(data.user.id);
    if (!this.currentUser) {
      await supabase.auth.signOut();
      return { success: false, message: 'Akun ditemukan tapi profil pengguna belum lengkap. Hubungi Superadmin.' };
    }
    await this.loadAllData();
    this.subscribeRealtime();
    this.authLoading = false;
    this.notify();
    return { success: true, user: this.currentUser };
  }

  public async logout(): Promise<void> {
    await supabase.auth.signOut();
    this.currentUser = null;
    this.requests = [];
    this.approvals = [];
    this.processing = [];
    this.notifications = [];
    this.auditLogs = [];
    this.unsubscribeRealtime();
    this.notify();
  }

  // ---- ACTIONS ----

  // 1. Create Request
  public async createRequest(params: {
    activity_type: ConsumptionRequest['activity_type'];
    activity_name: string;
    guest_name: string;
    consumption_date: string;
    consumption_time: string;
    guest_count: number;
    consumption_type: ConsumptionRequest['consumption_type'];
    consumption_detail: string;
    quantity: number;
    estimated_budget?: number;
    notes?: string;
    attachment_name?: string;
    attachment_url?: string;
    isDraft?: boolean;
  }): Promise<ConsumptionRequest> {
    if (!this.currentUser) throw new Error('Anda belum login.');
    const user = this.currentUser;
    const approverInfo = this.getApproverForUser(user);

    const initialStatus: RequestStatus = params.isDraft
      ? 'DRAFT'
      : approverInfo.approvalType === 'HOD'
        ? 'WAITING_HOD'
        : 'WAITING_WAKASEK';

    const { data: inserted, error } = await supabase
      .from('consumption_requests')
      .insert({
        requester_id: user.id,
        department_id: user.department_id,
        activity_type: params.activity_type,
        activity_name: params.activity_name,
        guest_name: params.guest_name,
        consumption_date: params.consumption_date,
        consumption_time: params.consumption_time,
        guest_count: Number(params.guest_count) || 1,
        consumption_type: params.consumption_type,
        consumption_detail: params.consumption_detail,
        quantity: Number(params.quantity) || 1,
        estimated_budget: params.estimated_budget ? Number(params.estimated_budget) : 0,
        notes: params.notes,
        attachment_name: params.attachment_name,
        attachment_url: params.attachment_url,
        status: initialStatus,
        target_approver_id: approverInfo.approverUser?.id || null,
        target_approval_type: approverInfo.approvalType,
      })
      .select()
      .single();

    if (error || !inserted) throw new Error(error?.message || 'Gagal membuat pengajuan.');

    const newRequest = inserted as ConsumptionRequest;
    this.requests = upsertById(this.requests, newRequest).sort(byCreatedAtDesc);
    this.notify();

    await this.insertAuditLog({
      user_id: user.id,
      user_name: user.name,
      request_id: newRequest.id,
      action: params.isDraft ? 'SAVE_DRAFT' : 'SUBMIT_REQUEST',
      description: `Membuat pengajuan konsumsi ${newRequest.request_number} (${newRequest.activity_name}) untuk ${newRequest.guest_name}.`,
    });

    if (!params.isDraft && approverInfo.approverUser) {
      await this.insertNotification({
        user_id: approverInfo.approverUser.id,
        request_id: newRequest.id,
        title: 'Pengajuan Konsumsi Masuk',
        message: `${user.name} mengajukan ${newRequest.consumption_type} untuk ${newRequest.guest_name} (${newRequest.quantity} paket).`,
        type: 'INFO',
      });
    }

    return newRequest;
  }

  // 2. Update Request (Only for DRAFT or REVISION_REQUIRED)
  public async updateRequest(
    id: string,
    params: Partial<ConsumptionRequest>,
    resubmit: boolean = false
  ): Promise<ConsumptionRequest> {
    if (!this.currentUser) throw new Error('Anda belum login.');
    const user = this.currentUser;
    const existing = this.getRequestById(id);
    if (!existing) throw new Error('Pengajuan tidak ditemukan');

    const patch: Partial<ConsumptionRequest> = { ...params };
    if (resubmit) {
      patch.status = existing.target_approval_type === 'HOD' ? 'WAITING_HOD' : 'WAITING_WAKASEK';
    }

    const { data: updated, error } = await supabase
      .from('consumption_requests')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error || !updated) throw new Error(error?.message || 'Gagal memperbarui pengajuan.');

    const updatedRequest = updated as ConsumptionRequest;
    this.requests = upsertById(this.requests, updatedRequest).sort(byCreatedAtDesc);
    this.notify();

    await this.insertAuditLog({
      user_id: user.id,
      user_name: user.name,
      request_id: updatedRequest.id,
      action: resubmit ? 'RESUBMIT_REQUEST' : 'UPDATE_REQUEST',
      description: `${user.name} memperbarui data pengajuan ${updatedRequest.request_number}${resubmit ? ' dan mengirimkan kembali untuk approval' : ''}.`,
    });

    if (resubmit && updatedRequest.target_approver_id) {
      await this.insertNotification({
        user_id: updatedRequest.target_approver_id,
        request_id: updatedRequest.id,
        title: 'Revisi Pengajuan Telah Diperbaiki',
        message: `${user.name} telah memperbarui pengajuan ${updatedRequest.request_number} dan siap ditinjau kembali.`,
        type: 'INFO',
      });
    }

    return updatedRequest;
  }

  // 3. Approve Request (By HOD or Wakasek)
  public async approveRequest(requestId: string, notes: string = ''): Promise<void> {
    if (!this.currentUser) throw new Error('Anda belum login.');
    const req = this.getRequestById(requestId);
    if (!req) throw new Error('Pengajuan tidak ditemukan');
    const user = this.currentUser;

    const newStatus: RequestStatus = req.target_approval_type === 'HOD' ? 'APPROVED_HOD' : 'APPROVED_WAKASEK';
    const { data: updated, error } = await supabase
      .from('consumption_requests')
      .update({ status: newStatus })
      .eq('id', requestId)
      .select()
      .single();
    if (error || !updated) throw new Error(error?.message || 'Gagal menyetujui pengajuan.');
    this.requests = upsertById(this.requests, updated as ConsumptionRequest).sort(byCreatedAtDesc);
    this.notify();

    const approvalNotes = notes || 'Disetujui untuk dipersiapkan oleh bagian konsumsi.';
    const { data: approvalRow, error: approvalError } = await supabase
      .from('approvals')
      .insert({
        request_id: req.id,
        approver_id: user.id,
        approver_role: user.role === 'WAKASEK' || user.role === 'HOD' || user.role === 'SUPERADMIN' ? user.role : 'HOD',
        action: 'APPROVE',
        notes: approvalNotes,
      })
      .select()
      .single();
    if (approvalError) console.error('Gagal menyimpan approval:', approvalError.message);
    else {
      this.approvals = upsertById(this.approvals, approvalRow as ApprovalRecord);
      this.notify();
    }

    await this.insertAuditLog({
      user_id: user.id,
      user_name: user.name,
      request_id: req.id,
      action: user.role === 'WAKASEK' ? 'APPROVE_WAKASEK' : 'APPROVE_HOD',
      description: `${user.name} menyetujui pengajuan ${req.request_number}. Catatan: ${approvalNotes}`,
    });

    await this.insertNotification({
      user_id: req.requester_id,
      request_id: req.id,
      title: 'Pengajuan Konsumsi Disetujui! 🎉',
      message: `Pengajuan ${req.request_number} telah disetujui oleh ${user.name} dan diteruskan ke Dapur Konsumsi.`,
      type: 'SUCCESS',
    });

    const adminUsers = this.users.filter(u => u.role === 'ADMIN_KONSUMSI' && u.is_active);
    for (const admin of adminUsers) {
      await this.insertNotification({
        user_id: admin.id,
        request_id: req.id,
        title: 'Pesanan Konsumsi Baru Masuk 🍽️',
        message: `Pengajuan ${req.request_number} (${req.activity_name}) telah disetujui ${user.name}. Mohon segera dijadwalkan.`,
        type: 'INFO',
      });
    }
  }

  // 4. Reject Request (Requires reason)
  public async rejectRequest(requestId: string, reason: string): Promise<void> {
    if (!reason || !reason.trim()) throw new Error('Alasan penolakan wajib diisi!');
    if (!this.currentUser) throw new Error('Anda belum login.');
    const req = this.getRequestById(requestId);
    if (!req) throw new Error('Pengajuan tidak ditemukan');
    const user = this.currentUser;

    const { data: updated, error } = await supabase
      .from('consumption_requests')
      .update({ status: 'REJECTED' })
      .eq('id', requestId)
      .select()
      .single();
    if (error || !updated) throw new Error(error?.message || 'Gagal menolak pengajuan.');
    this.requests = upsertById(this.requests, updated as ConsumptionRequest).sort(byCreatedAtDesc);
    this.notify();

    const { data: approvalRow, error: approvalError } = await supabase
      .from('approvals')
      .insert({
        request_id: req.id,
        approver_id: user.id,
        approver_role: user.role === 'WAKASEK' || user.role === 'HOD' || user.role === 'SUPERADMIN' ? user.role : 'HOD',
        action: 'REJECT',
        notes: reason.trim(),
      })
      .select()
      .single();
    if (approvalError) console.error('Gagal menyimpan approval:', approvalError.message);
    else {
      this.approvals = upsertById(this.approvals, approvalRow as ApprovalRecord);
      this.notify();
    }

    await this.insertAuditLog({
      user_id: user.id,
      user_name: user.name,
      request_id: req.id,
      action: 'REJECT_REQUEST',
      description: `${user.name} menolak pengajuan ${req.request_number}. Alasan: ${reason}`,
    });

    await this.insertNotification({
      user_id: req.requester_id,
      request_id: req.id,
      title: 'Pengajuan Konsumsi Ditolak',
      message: `Pengajuan ${req.request_number} ditolak oleh ${user.name}. Alasan: ${reason}`,
      type: 'DANGER',
    });
  }

  // 5. Request Revision (Requires revision note)
  public async requestRevision(requestId: string, revisionNotes: string): Promise<void> {
    if (!revisionNotes || !revisionNotes.trim()) throw new Error('Catatan instruksi revisi wajib diisi!');
    if (!this.currentUser) throw new Error('Anda belum login.');
    const req = this.getRequestById(requestId);
    if (!req) throw new Error('Pengajuan tidak ditemukan');
    const user = this.currentUser;

    const { data: updated, error } = await supabase
      .from('consumption_requests')
      .update({ status: 'REVISION_REQUIRED' })
      .eq('id', requestId)
      .select()
      .single();
    if (error || !updated) throw new Error(error?.message || 'Gagal meminta revisi.');
    this.requests = upsertById(this.requests, updated as ConsumptionRequest).sort(byCreatedAtDesc);
    this.notify();

    const { data: approvalRow, error: approvalError } = await supabase
      .from('approvals')
      .insert({
        request_id: req.id,
        approver_id: user.id,
        approver_role: user.role === 'WAKASEK' || user.role === 'HOD' || user.role === 'SUPERADMIN' ? user.role : 'HOD',
        action: 'REQUEST_REVISION',
        notes: revisionNotes.trim(),
      })
      .select()
      .single();
    if (approvalError) console.error('Gagal menyimpan approval:', approvalError.message);
    else {
      this.approvals = upsertById(this.approvals, approvalRow as ApprovalRecord);
      this.notify();
    }

    await this.insertAuditLog({
      user_id: user.id,
      user_name: user.name,
      request_id: req.id,
      action: 'REQUEST_REVISION',
      description: `${user.name} meminta revisi untuk ${req.request_number}. Instruksi: ${revisionNotes}`,
    });

    await this.insertNotification({
      user_id: req.requester_id,
      request_id: req.id,
      title: 'Permintaan Revisi Pengajuan',
      message: `${user.name} meminta perbaikan pada pengajuan ${req.request_number}. Catatan: ${revisionNotes}`,
      type: 'WARNING',
    });
  }

  // 6. Admin Konsumsi Processing Workflow
  public async updateKitchenStatus(
    requestId: string,
    status: 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED',
    notes?: string
  ): Promise<void> {
    if (!this.currentUser) throw new Error('Anda belum login.');
    const req = this.getRequestById(requestId);
    if (!req) throw new Error('Pengajuan tidak ditemukan');
    const user = this.currentUser;

    const { data: updated, error } = await supabase
      .from('consumption_requests')
      .update({ status })
      .eq('id', requestId)
      .select()
      .single();
    if (error || !updated) throw new Error(error?.message || 'Gagal mengubah status konsumsi.');
    this.requests = upsertById(this.requests, updated as ConsumptionRequest).sort(byCreatedAtDesc);
    this.notify();

    const { data: procRow, error: procError } = await supabase
      .from('consumption_processing')
      .insert({ request_id: req.id, admin_id: user.id, status, notes })
      .select()
      .single();
    if (procError) console.error('Gagal menyimpan processing:', procError.message);
    else {
      this.processing = upsertById(this.processing, procRow as ConsumptionProcessing);
      this.notify();
    }

    let actionLabel = '';
    let notifTitle = '';
    let notifMsg = '';
    let notifType: NotificationItem['type'] = 'INFO';

    if (status === 'PROCESSING') {
      actionLabel = 'PROSES_KONSUMSI';
      notifTitle = 'Pesanan Konsumsi Sedang Diproses 🍳';
      notifMsg = `Pesanan konsumsi untuk ${req.guest_name} sedang disiapkan oleh bagian konsumsi (${user.name}).`;
      notifType = 'INFO';
    } else if (status === 'READY') {
      actionLabel = 'KONSUMSI_SIAP';
      notifTitle = 'Konsumsi Siap Diambil / Disajikan! 📦';
      notifMsg = `Konsumsi untuk ${req.guest_name} (${req.quantity} paket) SUDAH SIAP. Silakan ambil atau hubungi pantry konsumsi.`;
      notifType = 'SUCCESS';
    } else if (status === 'COMPLETED') {
      actionLabel = 'KONSUMSI_SELESAI';
      notifTitle = 'Konsumsi Telah Selesai ✅';
      notifMsg = `Pelayanan konsumsi untuk kegiatan ${req.activity_name} telah selesai.`;
      notifType = 'SUCCESS';
    } else if (status === 'CANCELLED') {
      actionLabel = 'BATALKAN_KONSUMSI';
      notifTitle = 'Pengajuan Dibatalkan';
      notifMsg = `Pengajuan konsumsi ${req.request_number} telah dibatalkan oleh bagian dapur. Catatan: ${notes || '-'}`;
      notifType = 'DANGER';
    }

    await this.insertAuditLog({
      user_id: user.id,
      user_name: user.name,
      request_id: req.id,
      action: actionLabel,
      description: `${user.name} mengubah status konsumsi ${req.request_number} menjadi ${status}.${notes ? ' Catatan: ' + notes : ''}`,
    });

    await this.insertNotification({
      user_id: req.requester_id,
      request_id: req.id,
      title: notifTitle,
      message: notifMsg,
      type: notifType,
    });
  }

  // 7. Cancel by Requester
  public async cancelRequestByRequester(requestId: string, reason: string = ''): Promise<void> {
    if (!this.currentUser) throw new Error('Anda belum login.');
    const req = this.getRequestById(requestId);
    if (!req) throw new Error('Pengajuan tidak ditemukan');
    const user = this.currentUser;

    const { data: updated, error } = await supabase
      .from('consumption_requests')
      .update({ status: 'CANCELLED' })
      .eq('id', requestId)
      .select()
      .single();
    if (error || !updated) throw new Error(error?.message || 'Gagal membatalkan pengajuan.');
    this.requests = upsertById(this.requests, updated as ConsumptionRequest).sort(byCreatedAtDesc);
    this.notify();

    await this.insertAuditLog({
      user_id: user.id,
      user_name: user.name,
      request_id: req.id,
      action: 'CANCEL_BY_REQUESTER',
      description: `${user.name} membatalkan pengajuan ${req.request_number}.${reason ? ' Alasan: ' + reason : ''}`,
    });
  }

  // 8. Notifications
  public async markNotificationAsRead(id: string): Promise<void> {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (error) {
      console.error('Gagal menandai notifikasi:', error.message);
      return;
    }
    this.notifications = this.notifications.map(n => (n.id === id ? { ...n, is_read: true } : n));
    this.notify();
  }

  public async markAllNotificationsAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) {
      console.error('Gagal menandai semua notifikasi:', error.message);
      return;
    }
    this.notifications = this.notifications.map(n => (n.user_id === userId ? { ...n, is_read: true } : n));
    this.notify();
  }

  // 9. Master Data Management (SUPERADMIN)
  public async addDepartment(dept: Omit<Department, 'id'>): Promise<Department> {
    const { data, error } = await supabase.from('departments').insert(dept).select().single();
    if (error || !data) throw new Error(error?.message || 'Gagal menambah departemen.');
    this.departments = upsertById(this.departments, data as Department);
    this.notify();
    return data as Department;
  }

  public async updateDepartment(id: string, updates: Partial<Department>): Promise<void> {
    const { data, error } = await supabase.from('departments').update(updates).eq('id', id).select().single();
    if (error || !data) throw new Error(error?.message || 'Gagal memperbarui departemen.');
    this.departments = upsertById(this.departments, data as Department);
    this.notify();
  }

  // Tambah user baru = buat akun login (Supabase Auth) + profil, harus lewat
  // Edge Function 'create-user' karena butuh service_role (client/anon key
  // tidak bisa membuat auth user).
  public async addUser(params: {
    username: string;
    name: string;
    pin: string;
    role: User['role'];
    department_id: string;
    title?: string;
    phone_number?: string;
  }): Promise<void> {
    const { data, error } = await supabase.functions.invoke('create-user', { body: params });
    if (error) throw new Error(error.message || 'Gagal menambah pengguna.');
    if (data?.error) throw new Error(data.error);
    // Baris users baru akan masuk lewat realtime subscription.
  }

  public async updateUser(id: string, updates: Partial<User>): Promise<void> {
    const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single();
    if (error || !data) throw new Error(error?.message || 'Gagal memperbarui pengguna (hanya lewat admin).');
    this.users = upsertById(this.users, data as User);
    if (this.currentUser?.id === id) this.currentUser = data as User;
    this.notify();
  }

  // ---- Attachments (Supabase Storage) ----
  public async uploadAttachment(file: File): Promise<{ path: string; name: string }> {
    if (!this.currentUser) throw new Error('Anda belum login.');
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${this.currentUser.id}/${Date.now()}_${safeName}`;
    const { error } = await supabase.storage.from('attachments').upload(path, file, { upsert: false });
    if (error) throw new Error(`Gagal mengunggah lampiran: ${error.message}`);
    return { path, name: file.name };
  }

  public async getAttachmentSignedUrl(path: string, expiresInSeconds = 3600): Promise<string | null> {
    const { data, error } = await supabase.storage.from('attachments').createSignedUrl(path, expiresInSeconds);
    if (error || !data) {
      console.error('Gagal membuat signed URL lampiran:', error?.message);
      return null;
    }
    return data.signedUrl;
  }
}

export const storageService = new SupabaseDataService();
