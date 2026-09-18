import React, { useState } from 'react';
import { 
  User, 
  Department, 
  ConsumptionRequest, 
  RequestStatus 
} from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  ChefHat, 
  XCircle, 
  RotateCcw, 
  AlertCircle,
  Eye,
  FileEdit,
  Trash2,
  Calendar,
  Building2,
  Users,
  Search,
  Filter,
  Sparkles,
  ArrowRight,
  PackageCheck
} from 'lucide-react';

interface Props {
  currentUser: User;
  departments: Department[];
  users: User[];
  requests: ConsumptionRequest[];
  onOpenCreate: () => void;
  onOpenDetail: (requestId: string) => void;
  onEditRequest: (request: ConsumptionRequest) => void;
  onCancelRequest: (requestId: string) => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<Props> = ({
  currentUser,
  departments,
  users,
  requests,
  onOpenCreate,
  onOpenDetail,
  onEditRequest,
  onCancelRequest,
  onNavigateTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const currentDept = departments.find(d => d.id === currentUser.department_id);

  // Filter requests according to role context
  // Requester: sees own requests on their personal list
  // HOD: sees their department's requests
  // Wakasek: sees non-jurusan requests
  // Admin Konsumsi & Superadmin: sees all
  const myRequests = requests.filter(r => r.requester_id === currentUser.id);

  const pendingApprovals = requests.filter(r => {
    if (currentUser.role === 'SUPERADMIN') {
      return r.status === 'WAITING_HOD' || r.status === 'WAITING_WAKASEK';
    }
    if (currentUser.role === 'HOD') {
      return r.status === 'WAITING_HOD' && (r.target_approver_id === currentUser.id || r.department_id === currentUser.department_id);
    }
    if (currentUser.role === 'WAKASEK') {
      return r.status === 'WAITING_WAKASEK';
    }
    return false;
  });

  const kitchenOrders = requests.filter(r => 
    ['APPROVED_HOD', 'APPROVED_WAKASEK', 'PROCESSING', 'READY'].includes(r.status)
  );

  // Statistics Calculation
  const totalCount = currentUser.role === 'REQUESTER' ? myRequests.length : requests.length;
  const waitingApprovalCount = requests.filter(r => r.status === 'WAITING_HOD' || r.status === 'WAITING_WAKASEK').length;
  const approvedCount = requests.filter(r => r.status === 'APPROVED_HOD' || r.status === 'APPROVED_WAKASEK').length;
  const processingCount = requests.filter(r => r.status === 'PROCESSING').length;
  const readyCount = requests.filter(r => r.status === 'READY').length;
  const completedCount = requests.filter(r => r.status === 'COMPLETED').length;
  const rejectedCount = requests.filter(r => r.status === 'REJECTED').length;

  // Personal requester counts
  const myWaitingCount = myRequests.filter(r => r.status === 'WAITING_HOD' || r.status === 'WAITING_WAKASEK').length;
  const myApprovedCount = myRequests.filter(r => r.status === 'APPROVED_HOD' || r.status === 'APPROVED_WAKASEK').length;
  const myProcessingCount = myRequests.filter(r => r.status === 'PROCESSING' || r.status === 'READY').length;
  const myCompletedCount = myRequests.filter(r => r.status === 'COMPLETED').length;
  const myRejectedCount = myRequests.filter(r => r.status === 'REJECTED').length;

  // Filtered table rows
  const displayList = (currentUser.role === 'REQUESTER' ? myRequests : requests).filter(r => {
    const matchSearch = 
      r.request_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.activity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.guest_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'ALL') return matchSearch;
    return matchSearch && r.status === filterStatus;
  });

  const getUserName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || 'User';
  };

  const getDeptName = (deptId: string) => {
    const d = departments.find(item => item.id === deptId);
    return d ? d.code : '-';
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 rounded-3xl p-6 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs border border-white/20 uppercase tracking-wider">
                Portal Internal • {currentUser.role}
              </span>
              <span className="text-xs text-blue-200">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Selamat Datang, {currentUser.name}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl leading-relaxed">
              SIMKONSUMSI mendigitalkan alur pengajuan konsumsi guru tamu, mitra industri & pelatihan sekolah secara transparan dan akuntabel.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {['REQUESTER', 'HOD', 'WAKASEK', 'SUPERADMIN'].includes(currentUser.role) && (
              <button
                onClick={onOpenCreate}
                className="px-4 py-2.5 bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all shrink-0"
              >
                <PlusCircle className="w-4 h-4 text-blue-700" />
                Buat Pengajuan Baru
              </button>
            )}
          </div>
        </div>

        {/* Ambient Decorative glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* Role-Specific Alert Cards */}
      {/* HOD or Wakasek: Pending Approval Callout */}
      {['HOD', 'WAKASEK'].includes(currentUser.role) && pendingApprovals.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                Ada {pendingApprovals.length} Pengajuan Menunggu Persetujuan Anda!
              </h3>
              <p className="text-xs text-amber-800">
                Sebagai approver yang berwenang, mohon tinjau pengajuan agar segera diteruskan ke dapur konsumsi.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('approvals')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
          >
            Buka Approval
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Admin Konsumsi: Pending Kitchen Queue Callout */}
      {currentUser.role === 'ADMIN_KONSUMSI' && kitchenOrders.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-300 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-indigo-950">
                {kitchenOrders.length} Pesanan Konsumsi Perlu Dipersiapkan Dapur!
              </h3>
              <p className="text-xs text-indigo-800">
                Pesanan telah mendapatkan approval resmi dari HOD/Wakasek dan siap dimasak / disajikan.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('kitchen')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
          >
            Buka Antrean Dapur
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Stats Cards (Requirement 6, 7, 9) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Card 1: Total */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total</span>
            <Sparkles className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {currentUser.role === 'REQUESTER' ? myRequests.length : requests.length}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {currentUser.role === 'REQUESTER' ? 'Pengajuan Saya' : 'Seluruh Sekolah'}
          </span>
        </div>

        {/* Card 2: Menunggu Approval */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Menunggu</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-700">
            {currentUser.role === 'REQUESTER' ? myWaitingCount : waitingApprovalCount}
          </p>
          <span className="text-[11px] text-amber-600 mt-1 block">Approval Pimpinan</span>
        </div>

        {/* Card 3: Disetujui */}
        <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-xs">
          <div className="flex items-center justify-between text-blue-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Disetujui</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-700">
            {currentUser.role === 'REQUESTER' ? myApprovedCount : approvedCount}
          </p>
          <span className="text-[11px] text-blue-600 mt-1 block">Approved HOD/Wakasek</span>
        </div>

        {/* Card 4: Diproses Dapur */}
        <div className="bg-white p-4 rounded-2xl border border-indigo-200 bg-indigo-50/20 shadow-xs">
          <div className="flex items-center justify-between text-indigo-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Diproses</span>
            <ChefHat className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-indigo-700">
            {currentUser.role === 'REQUESTER' ? myProcessingCount : processingCount}
          </p>
          <span className="text-[11px] text-indigo-600 mt-1 block">Persiapan Masak</span>
        </div>

        {/* Card 5: Konsumsi Siap / Selesai */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Selesai</span>
            <PackageCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-700">
            {currentUser.role === 'REQUESTER' ? myCompletedCount : completedCount}
          </p>
          <span className="text-[11px] text-emerald-600 mt-1 block">Siap / Disajikan</span>
        </div>

        {/* Card 6: Ditolak */}
        <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Ditolak</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-700">
            {currentUser.role === 'REQUESTER' ? myRejectedCount : rejectedCount}
          </p>
          <span className="text-[11px] text-rose-600 mt-1 block">Tidak Disetujui</span>
        </div>

      </div>

      {/* Main Table Section (Requirement 6) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Table Filter & Search Header */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              {currentUser.role === 'REQUESTER' ? 'Daftar Pengajuan Konsumsi Saya' : 'Semua Daftar Pengajuan Konsumsi'}
            </h3>
            <p className="text-xs text-slate-500">
              Format: Tanggal | Kegiatan | Jumlah | Department | Approver | Status | Action
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari kegiatan/tamu/no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs p-1.5 rounded-xl border border-slate-300 bg-white focus:outline-hidden"
            >
              <option value="ALL">Semua Status</option>
              <option value="WAITING_HOD">Menunggu HOD</option>
              <option value="WAITING_WAKASEK">Menunggu Wakasek</option>
              <option value="APPROVED_HOD">Disetujui HOD</option>
              <option value="APPROVED_WAKASEK">Disetujui Wakasek</option>
              <option value="PROCESSING">Diproses Dapur</option>
              <option value="READY">Konsumsi Siap</option>
              <option value="COMPLETED">Selesai</option>
              <option value="REVISION_REQUIRED">Perlu Revisi</option>
              <option value="REJECTED">Ditolak</option>
            </select>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Kegiatan & Tamu</th>
                <th className="p-3.5 text-center">Jumlah</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Approver</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Tidak ada data pengajuan yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                displayList.map(req => {
                  const approverUser = users.find(u => u.id === req.target_approver_id);
                  const isOwner = req.requester_id === currentUser.id;
                  const canEditThis = (isOwner || currentUser.role === 'SUPERADMIN') && (req.status === 'DRAFT' || req.status === 'REVISION_REQUIRED');
                  const canCancelThis = (isOwner || currentUser.role === 'SUPERADMIN') && ['DRAFT', 'WAITING_HOD', 'WAITING_WAKASEK', 'REVISION_REQUIRED'].includes(req.status);

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Tanggal */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-mono text-[11px] font-bold text-blue-700 block">
                          {req.request_number}
                        </span>
                        <span className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(req.consumption_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}, {req.consumption_time}
                        </span>
                      </td>

                      {/* Kegiatan & Tamu */}
                      <td className="p-3.5 max-w-xs">
                        <p className="font-bold text-slate-900 truncate" title={req.activity_name}>
                          {req.activity_name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate" title={req.guest_name}>
                          Tamu: <span className="font-medium text-slate-700">{req.guest_name}</span>
                        </p>
                      </td>

                      {/* Jumlah */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span className="font-extrabold text-slate-900 block">
                          {req.quantity} Paket
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {req.guest_count} Orang
                        </span>
                      </td>

                      {/* Department */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {getDeptName(req.department_id)}
                        </span>
                      </td>

                      {/* Approver */}
                      <td className="p-3.5 whitespace-nowrap">
                        <p className="font-medium text-slate-800 leading-tight">
                          {approverUser?.name || (req.target_approval_type === 'HOD' ? 'HOD Jurusan' : 'Wakasek')}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {req.target_approval_type === 'HOD' ? 'Koordinator HOD' : 'Wakil Kepala Sekolah'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 whitespace-nowrap">
                        <StatusBadge status={req.status} size="sm" />
                      </td>

                      {/* Actions: Detail, Edit, Cancel */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Detail button */}
                          <button
                            onClick={() => onOpenDetail(req.id)}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                            title="Lihat Detail & Timeline"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit button (only for DRAFT and REVISION_REQUIRED) */}
                          {canEditThis && (
                            <button
                              onClick={() => onEditRequest(req)}
                              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors"
                              title="Edit Pengajuan"
                            >
                              <FileEdit className="w-4 h-4" />
                            </button>
                          )}

                          {/* Cancel button */}
                          {canCancelThis && (
                            <button
                              onClick={() => {
                                if (confirm(`Yakin ingin membatalkan pengajuan ${req.request_number}?`)) {
                                  onCancelRequest(req.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                              title="Batalkan Pengajuan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
