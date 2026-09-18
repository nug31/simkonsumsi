import React, { useState } from 'react';
import { 
  ConsumptionRequest, 
  User, 
  Department, 
  ApprovalRecord, 
  ConsumptionProcessing 
} from '../types';
import { StatusBadge } from './StatusBadge';
import { storageService } from '../services/storage';
import { 
  X, 
  Calendar, 
  Clock, 
  Users, 
  Utensils, 
  Building2, 
  User as UserIcon, 
  FileText, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  Printer, 
  RotateCcw,
  ChefHat,
  PackageCheck,
  Send,
  Sparkles
} from 'lucide-react';

interface Props {
  request: ConsumptionRequest;
  currentUser: User;
  users: User[];
  departments: Department[];
  approvals: ApprovalRecord[];
  processings: ConsumptionProcessing[];
  onClose: () => void;
  onOpenApprovalModal?: (action: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION') => void;
  onUpdateKitchenStatus?: (status: 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED', notes?: string) => void;
  onOpenWhatsAppModal?: () => void;
  onPrintSlip?: () => void;
  onEditRequest?: () => void;
  onCancelRequest?: () => void;
}

export const RequestDetailModal: React.FC<Props> = ({
  request,
  currentUser,
  users,
  departments,
  approvals,
  processings,
  onClose,
  onOpenApprovalModal,
  onUpdateKitchenStatus,
  onOpenWhatsAppModal,
  onPrintSlip,
  onEditRequest,
  onCancelRequest,
}) => {
  const requester = users.find(u => u.id === request.requester_id);
  const department = departments.find(d => d.id === request.department_id);
  const targetApprover = users.find(u => u.id === request.target_approver_id);

  const [kitchenNotes, setKitchenNotes] = useState('');
  const [showKitchenNoteInput, setShowKitchenNoteInput] = useState(false);

  // Check if current user is the authorized approver for this request
  const canApprove = 
    (request.status === 'WAITING_HOD' || request.status === 'WAITING_WAKASEK') &&
    (
      currentUser.role === 'SUPERADMIN' ||
      (request.target_approval_type === 'HOD' && (currentUser.id === request.target_approver_id || (currentUser.role === 'HOD' && currentUser.department_id === request.department_id))) ||
      (request.target_approval_type === 'WAKASEK' && currentUser.role === 'WAKASEK')
    );

  // Check if current user is admin konsumsi and can process
  const canProcessKitchen = 
    (currentUser.role === 'ADMIN_KONSUMSI' || currentUser.role === 'SUPERADMIN') &&
    ['APPROVED_HOD', 'APPROVED_WAKASEK', 'PROCESSING', 'READY'].includes(request.status);

  // Check if current requester can edit
  const canEdit = 
    (currentUser.id === request.requester_id || currentUser.role === 'SUPERADMIN') &&
    (request.status === 'DRAFT' || request.status === 'REVISION_REQUIRED');

  // Check if current requester can cancel
  const canCancel = 
    (currentUser.id === request.requester_id || currentUser.role === 'SUPERADMIN') &&
    ['DRAFT', 'WAITING_HOD', 'WAITING_WAKASEK', 'REVISION_REQUIRED'].includes(request.status);

  // Get approval records for this request
  const relevantApprovals = approvals.filter(a => a.request_id === request.id);
  const latestApproval = relevantApprovals[relevantApprovals.length - 1];

  // Get processing records for this request
  const relevantProcessing = processings.filter(p => p.request_id === request.id);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateTime = (isoStr: string) => {
    const d = new Date(isoStr);
    return `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} pukul ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                  Detail Pengajuan Konsumsi
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-bold">
                  {request.request_number}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Diajukan pada {formatDateTime(request.created_at)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <StatusBadge status={request.status} size="md" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Two Columns */}
        <div className="p-5 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left / Main Details (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Requester & Routing Notice */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Pemohon
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-7 h-7 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-xs font-bold">
                    {requester?.name.charAt(0) || 'P'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 leading-tight">
                      {requester?.name || 'Tidak diketahui'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {department?.name} ({department?.code})
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Jalur Approval Otomatis
                </span>
                <div className="mt-1">
                  <p className="text-xs font-semibold text-slate-800">
                    {request.target_approval_type === 'HOD' ? 'Koordinator HOD Jurusan' : 'Wakil Kepala Sekolah'}
                  </p>
                  <p className="text-xs text-blue-600 font-medium">
                    {targetApprover?.name || (request.target_approval_type === 'HOD' ? 'HOD ' + department?.code : 'Drs. H. Mulyadi, M.M.')}
                  </p>
                </div>
              </div>
            </div>

            {/* Activity Details Card */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Informasi Kegiatan & Narasumber
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-slate-500">Nama Kegiatan:</span>
                  <p className="font-semibold text-slate-900">{request.activity_name}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Jenis Kegiatan:</span>
                  <p className="font-medium text-slate-800">
                    <span className="inline-block px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700 text-xs border border-slate-200">
                      {request.activity_type}
                    </span>
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-xs text-slate-500">Nama Guru Tamu / Narasumber:</span>
                  <p className="font-bold text-blue-900 text-base">{request.guest_name}</p>
                </div>
              </div>
            </div>

            {/* Consumption Needs Card */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Utensils className="w-4 h-4 text-amber-600" />
                Rincian Kebutuhan Konsumsi
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                <div>
                  <span className="text-[11px] text-amber-800 font-medium block">Tanggal</span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">
                    {new Date(request.consumption_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-amber-800 font-medium block">Jam Saji</span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">
                    {request.consumption_time} WIB
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-amber-800 font-medium block">Jumlah Tamu</span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">
                    {request.guest_count} Orang
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-amber-800 font-medium block">Jumlah Paket</span>
                  <p className="text-xs font-bold text-blue-700 mt-0.5">
                    {request.quantity} Paket
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm pt-2">
                <div>
                  <span className="text-xs text-slate-500">Kategori Konsumsi:</span>
                  <p className="font-semibold text-slate-800">{request.consumption_type}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Detail Menu / Item Konsumsi:</span>
                  <p className="font-medium text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {request.consumption_detail}
                  </p>
                </div>
                {request.notes && (
                  <div>
                    <span className="text-xs text-slate-500">Catatan Khusus Pemohon:</span>
                    <p className="text-xs italic text-slate-700 bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                      "{request.notes}"
                    </p>
                  </div>
                )}
                {request.estimated_budget && (
                  <div>
                    <span className="text-xs text-slate-500">Estimasi Anggaran:</span>
                    <p className="text-xs font-bold text-emerald-700">
                      Rp {request.estimated_budget.toLocaleString('id-ID')}
                    </p>
                  </div>
                )}
                {request.attachment_url && (
                  <div>
                    <span className="text-xs text-slate-500">Lampiran Dokumen:</span>
                    <button
                      type="button"
                      onClick={async () => {
                        const url = await storageService.getAttachmentSignedUrl(request.attachment_url!);
                        if (url) window.open(url, '_blank');
                        else alert('Gagal membuka lampiran.');
                      }}
                      className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline bg-blue-50/50 p-2 rounded-lg border border-blue-100 w-full text-left"
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      {request.attachment_name || 'Lihat lampiran'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Action Bars for Context Roles */}
            {/* 1. If Approver can act */}
            {canApprove && onOpenApprovalModal && (
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-300">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    Tindakan Persetujuan ({request.target_approval_type === 'HOD' ? 'HOD' : 'Wakasek'})
                  </h4>
                </div>
                <p className="text-xs text-amber-800 mb-3">
                  Sebagai approver yang berwenang, silakan tentukan tindakan untuk pengajuan ini:
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onOpenApprovalModal('APPROVE')}
                    className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-colors shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Setujui (Approve)
                  </button>
                  <button
                    onClick={() => onOpenApprovalModal('REQUEST_REVISION')}
                    className="flex-1 sm:flex-none px-3.5 py-2 bg-amber-600 text-white rounded-xl font-bold text-xs hover:bg-amber-700 transition-colors shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Minta Revisi
                  </button>
                  <button
                    onClick={() => onOpenApprovalModal('REJECT')}
                    className="flex-1 sm:flex-none px-3.5 py-2 bg-rose-600 text-white rounded-xl font-bold text-xs hover:bg-rose-700 transition-colors shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    Tolak Pengajuan
                  </button>
                </div>
              </div>
            )}

            {/* 2. If Admin Konsumsi Kitchen can act */}
            {canProcessKitchen && onUpdateKitchenStatus && (
              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                <div className="flex items-center gap-2 mb-2">
                  <ChefHat className="w-4 h-4 text-indigo-700" />
                  <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                    Tindakan Dapur & Pelayanan Konsumsi
                  </h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {request.status.startsWith('APPROVED') && (
                    <button
                      onClick={() => onUpdateKitchenStatus('PROCESSING', 'Pesanan konsumsi mulai disiapkan oleh tim dapur.')}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-colors shadow-xs flex items-center gap-1.5"
                    >
                      <ChefHat className="w-4 h-4" />
                      Mulai Memasak / Menyiapkan
                    </button>
                  )}
                  {request.status === 'PROCESSING' && (
                    <button
                      onClick={() => onUpdateKitchenStatus('READY', 'Konsumsi telah siap disajikan di pantry/ruangan.')}
                      className="px-4 py-2 bg-teal-600 text-white rounded-xl font-bold text-xs hover:bg-teal-700 transition-colors shadow-xs flex items-center gap-1.5"
                    >
                      <PackageCheck className="w-4 h-4" />
                      Tandai Konsumsi Siap
                    </button>
                  )}
                  {request.status === 'READY' && (
                    <button
                      onClick={() => onUpdateKitchenStatus('COMPLETED', 'Konsumsi telah diserahkan dan selesai digunakan.')}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Selesaikan Pesanan
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 3. If Requester needs revision */}
            {canEdit && onEditRequest && (
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-orange-900 uppercase">
                    Pengajuan Perlu Diperbaiki
                  </h4>
                  <p className="text-xs text-orange-800">
                    Klik tombol edit untuk memperbarui data sesuai instruksi approver.
                  </p>
                </div>
                <button
                  onClick={onEditRequest}
                  className="px-4 py-2 bg-orange-600 text-white rounded-xl font-bold text-xs hover:bg-orange-700 transition-colors"
                >
                  Edit Sekarang
                </button>
              </div>
            )}

          </div>

          {/* Right Column: Approval Timeline (Requirement 11) */}
          <div className="space-y-4">
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Timeline Persetujuan & Dapur
              </h4>

              {/* Vertical Stepper Timeline */}
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                
                {/* Step 1: Dibuat */}
                <div className="relative">
                  <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-4 ring-white">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Pengajuan Dibuat</p>
                    <p className="text-[11px] text-slate-500">{requester?.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(request.created_at)}</p>
                  </div>
                </div>

                {/* Step 2: Dikirim ke Approver */}
                <div className="relative">
                  <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${
                    request.status !== 'DRAFT' ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-600'
                  }`}>
                    <Send className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Dikirim ke Approver</p>
                    <p className="text-[11px] text-slate-500">
                      Tujuan: {request.target_approval_type === 'HOD' ? `HOD ${department?.code}` : 'Wakasek'}
                    </p>
                  </div>
                </div>

                {/* Step 3: Menunggu / Status Approver */}
                <div className="relative">
                  <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${
                    ['APPROVED_HOD', 'APPROVED_WAKASEK', 'PROCESSING', 'READY', 'COMPLETED'].includes(request.status)
                      ? 'bg-emerald-500 text-white'
                      : request.status === 'REJECTED'
                      ? 'bg-rose-500 text-white'
                      : request.status === 'REVISION_REQUIRED'
                      ? 'bg-orange-500 text-white'
                      : 'bg-amber-400 text-white animate-pulse'
                  }`}>
                    {['APPROVED_HOD', 'APPROVED_WAKASEK', 'PROCESSING', 'READY', 'COMPLETED'].includes(request.status) ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : request.status === 'REJECTED' ? (
                      <X className="w-3 h-3" />
                    ) : request.status === 'REVISION_REQUIRED' ? (
                      <RotateCcw className="w-3 h-3" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {latestApproval
                        ? latestApproval.action === 'APPROVE'
                          ? `Disetujui ${latestApproval.approver_role}`
                          : latestApproval.action === 'REJECT'
                          ? 'Ditolak'
                          : 'Perlu Revisi'
                        : `Menunggu ${request.target_approval_type === 'HOD' ? 'HOD' : 'Wakasek'}`}
                    </p>
                    {latestApproval && (
                      <>
                        <p className="text-[11px] text-slate-600">
                          Oleh: {users.find(u => u.id === latestApproval.approver_id)?.name || 'Approver'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {formatDateTime(latestApproval.approved_at)}
                        </p>
                        <div className="mt-1 bg-white p-2 rounded border border-slate-200 text-[11px] text-slate-700 italic">
                          "{latestApproval.notes}"
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Step 4: Diproses Admin Dapur */}
                <div className="relative">
                  <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${
                    ['PROCESSING', 'READY', 'COMPLETED'].includes(request.status)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}>
                    <ChefHat className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Diproses Dapur Konsumsi</p>
                    {relevantProcessing.find(p => p.status === 'PROCESSING') ? (
                      <>
                        <p className="text-[11px] text-slate-600">
                          Oleh: {users.find(u => u.id === relevantProcessing.find(p => p.status === 'PROCESSING')?.admin_id)?.name || 'Admin Konsumsi'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {formatDateTime(relevantProcessing.find(p => p.status === 'PROCESSING')!.processed_at)}
                        </p>
                      </>
                    ) : (
                      <p className="text-[10px] text-slate-400">
                        {request.status.startsWith('APPROVED') ? 'Siap dijadwalkan memasak' : 'Menunggu approval'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Step 5: Konsumsi Siap */}
                <div className="relative">
                  <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${
                    ['READY', 'COMPLETED'].includes(request.status)
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}>
                    <PackageCheck className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Konsumsi Siap</p>
                    {relevantProcessing.find(p => p.status === 'READY') ? (
                      <p className="text-[10px] text-slate-400">
                        {formatDateTime(relevantProcessing.find(p => p.status === 'READY')!.processed_at)}
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400">Pantry Dapur</p>
                    )}
                  </div>
                </div>

                {/* Step 6: Selesai */}
                <div className="relative">
                  <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${
                    request.status === 'COMPLETED'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}>
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Selesai</p>
                    {request.status === 'COMPLETED' && (
                      <p className="text-[10px] text-emerald-600 font-medium">
                        Kegiatan terlaksana
                      </p>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Helper Action Buttons */}
            <div className="space-y-2">
              {onOpenWhatsAppModal && (
                <button
                  onClick={onOpenWhatsAppModal}
                  className="w-full py-2.5 px-3 rounded-xl border border-emerald-500/30 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  Kirim Notifikasi WhatsApp
                </button>
              )}

              {onPrintSlip && (
                <button
                  onClick={onPrintSlip}
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  Cetak Lembar Pesanan
                </button>
              )}

              {canCancel && onCancelRequest && (
                <button
                  onClick={() => {
                    if (confirm('Yakin ingin membatalkan pengajuan ini?')) {
                      onCancelRequest();
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl text-rose-600 hover:bg-rose-50 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Batalkan Pengajuan
                </button>
              )}
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>SIMKONSUMSI - SMK Unggulan</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
