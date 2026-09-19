import React, { useState } from 'react';
import { 
  User, 
  Department, 
  ConsumptionRequest, 
  ApprovalRecord 
} from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { 
  CheckSquare, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  RotateCcw, 
  Search, 
  Eye, 
  Check, 
  X, 
  Building2, 
  AlertTriangle 
} from 'lucide-react';

interface Props {
  currentUser: User;
  departments: Department[];
  users: User[];
  requests: ConsumptionRequest[];
  approvals: ApprovalRecord[];
  onOpenDetail: (requestId: string) => void;
  onOpenApprovalModal: (request: ConsumptionRequest, action: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION') => void;
}

export const ApprovalListView: React.FC<Props> = ({
  currentUser,
  departments,
  users,
  requests,
  approvals,
  onOpenDetail,
  onOpenApprovalModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'PENDING' | 'HISTORY'>('PENDING');

  const currentDept = departments.find(d => d.id === currentUser.department_id);

  // STRICT ACCESS CONTROL (Requirement 7, 8, 15):
  // - HOD: ONLY requests from their Jurusan
  // - WAKASEK: ONLY requests from NON_JURUSAN units
  // - SUPERADMIN: all requests
  const eligibleRequests = requests.filter(req => {
    const reqDept = departments.find(d => d.id === req.department_id);
    if (!reqDept) return false;

    if (currentUser.role === 'SUPERADMIN') return true;

    if (currentUser.role === 'HOD') {
      // HOD only sees requests from their specific Jurusan
      return reqDept.type === 'JURUSAN' && (req.department_id === currentUser.department_id || req.target_approver_id === currentUser.id);
    }

    if (currentUser.role === 'WAKASEK') {
      // Wakasek only sees requests from NON_JURUSAN departments
      return reqDept.type === 'NON_JURUSAN';
    }

    return false;
  });

  // Calculate metrics
  const pendingRequests = eligibleRequests.filter(r => 
    currentUser.role === 'WAKASEK' ? r.status === 'WAITING_WAKASEK' : r.status === 'WAITING_HOD' || r.status === 'WAITING_WAKASEK'
  );

  const approvedList = eligibleRequests.filter(r => 
    r.status === 'APPROVED_HOD' || r.status === 'APPROVED_WAKASEK' || r.status === 'PROCESSING' || r.status === 'READY' || r.status === 'COMPLETED'
  );

  const rejectedList = eligibleRequests.filter(r => r.status === 'REJECTED');
  const revisionList = eligibleRequests.filter(r => r.status === 'REVISION_REQUIRED');

  // Filtered list based on active tab & search
  const filteredList = (filterTab === 'PENDING' ? pendingRequests : eligibleRequests).filter(r => {
    return (
      r.request_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.activity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.guest_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'User';
  const getDeptName = (deptId: string) => departments.find(d => d.id === deptId)?.name || '-';

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <CheckSquare className="w-6 h-6 text-emerald-600" />
              Persetujuan Konsumsi ({currentUser.role === 'WAKASEK' ? 'Wakasek' : 'Koordinator HOD'})
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
              {currentUser.role === 'WAKASEK' ? 'Unit Non-Jurusan' : `Jurusan ${currentDept?.code || ''}`}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentUser.role === 'WAKASEK'
              ? 'Menangani persetujuan pengajuan dari Bagian Non-Jurusan (Kurikulum, Kesiswaan, Hubin, Sarpras, dll.)'
              : `Menangani persetujuan pengajuan dari Departemen/Jurusan ${currentDept?.name || ''}`}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setFilterTab('PENDING')}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all ${
              filterTab === 'PENDING' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Menunggu Approval ({pendingRequests.length})
          </button>
          <button
            onClick={() => setFilterTab('HISTORY')}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all ${
              filterTab === 'HISTORY' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua Riwayat ({eligibleRequests.length})
          </button>
        </div>
      </div>

      {/* KPI Summary Cards (Requirement 7 & 8) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Approval</span>
            <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-amber-700">{pendingRequests.length}</p>
          <span className="text-[11px] text-amber-600 mt-1 block">Perlu Tindakan Anda Segera</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-sky-200 bg-sky-50/20 shadow-xs">
          <div className="flex items-center justify-between text-sky-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Disetujui</span>
            <CheckCircle2 className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-black text-sky-700">{approvedList.length}</p>
          <span className="text-[11px] text-sky-600 mt-1 block">Diteruskan ke Dapur</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-orange-200 bg-orange-50/20 shadow-xs">
          <div className="flex items-center justify-between text-orange-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Perlu Revisi</span>
            <RotateCcw className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-black text-orange-700">{revisionList.length}</p>
          <span className="text-[11px] text-orange-600 mt-1 block">Menunggu Pemohon Edit</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Ditolak</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-700">{rejectedList.length}</p>
          <span className="text-[11px] text-rose-600 mt-1 block">Tidak Memenuhi Syarat</span>
        </div>
      </div>

      {/* Main Approval Table (Requirement 7 & 8) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              {filterTab === 'PENDING' ? 'Pengajuan Konsumsi Masuk (Menunggu Keputusan)' : 'Seluruh Riwayat Pengajuan Masuk'}
            </h3>
            <p className="text-xs text-slate-500">
              Format: Tanggal | Pemohon | Jurusan/Unit | Kegiatan | Tanggal Konsumsi | Jumlah | Jenis Konsumsi | Status | Aksi
            </p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari pengajuan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Pemohon</th>
                <th className="p-3.5">Jurusan / Unit</th>
                <th className="p-3.5">Kegiatan & Tamu</th>
                <th className="p-3.5">Tgl Konsumsi</th>
                <th className="p-3.5 text-center">Jumlah</th>
                <th className="p-3.5">Jenis Konsumsi</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Tidak ada pengajuan yang membutuhkan tindakan persetujuan saat ini.
                  </td>
                </tr>
              ) : (
                filteredList.map(req => {
                  const requesterUser = users.find(u => u.id === req.requester_id);
                  const isPending = req.status === 'WAITING_HOD' || req.status === 'WAITING_WAKASEK';

                  return (
                    <tr key={req.id} className={`hover:bg-slate-50/80 transition-colors ${isPending ? 'bg-amber-50/20' : ''}`}>
                      {/* Tanggal Pengajuan */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-mono text-[11px] font-bold text-emerald-700 block">
                          {req.request_number}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(req.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </td>

                      {/* Pemohon */}
                      <td className="p-3.5 whitespace-nowrap">
                        <p className="font-bold text-slate-800 leading-tight">
                          {requesterUser?.name || 'Pemohon'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {requesterUser?.title || requesterUser?.email}
                        </p>
                      </td>

                      {/* Jurusan / Unit */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {getDeptName(req.department_id)}
                        </span>
                      </td>

                      {/* Kegiatan & Tamu */}
                      <td className="p-3.5 max-w-xs">
                        <p className="font-bold text-slate-900 truncate" title={req.activity_name}>
                          {req.activity_name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          Tamu: <strong className="text-slate-700">{req.guest_name}</strong>
                        </p>
                      </td>

                      {/* Tanggal Konsumsi */}
                      <td className="p-3.5 whitespace-nowrap">
                        <p className="font-semibold text-slate-800">
                          {new Date(req.consumption_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </p>
                        <span className="text-[11px] text-emerald-600 font-bold">
                          {req.consumption_time} WIB
                        </span>
                      </td>

                      {/* Jumlah */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span className="font-extrabold text-emerald-700 block text-sm">
                          {req.quantity} Paket
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {req.guest_count} Orang
                        </span>
                      </td>

                      {/* Jenis Konsumsi */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-medium text-slate-800 block">
                          {req.consumption_type}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[120px] block" title={req.consumption_detail}>
                          {req.consumption_detail}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 whitespace-nowrap">
                        <StatusBadge status={req.status} size="sm" />
                      </td>

                      {/* Tindakan: [APPROVE], [REQUEST REVISION], [REJECT], [DETAIL] */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending ? (
                            <>
                              <button
                                onClick={() => onOpenApprovalModal(req, 'APPROVE')}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors"
                                title="Setujui (Approve)"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Approve
                              </button>

                              <button
                                onClick={() => onOpenApprovalModal(req, 'REQUEST_REVISION')}
                                className="px-2 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs flex items-center gap-1 transition-colors"
                                title="Minta Revisi"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Revisi
                              </button>

                              <button
                                onClick={() => onOpenApprovalModal(req, 'REJECT')}
                                className="px-2 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs flex items-center gap-1 transition-colors"
                                title="Tolak Pengajuan"
                              >
                                <X className="w-3.5 h-3.5" />
                                Tolak
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => onOpenDetail(req.id)}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Detail
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
