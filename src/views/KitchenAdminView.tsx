import React, { useState } from 'react';
import { 
  User, 
  Department, 
  ConsumptionRequest, 
  ConsumptionProcessing 
} from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { 
  ChefHat, 
  Printer, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  PackageCheck, 
  Eye, 
  Building2, 
  Calendar,
  Sparkles,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

interface Props {
  currentUser: User;
  departments: Department[];
  users: User[];
  requests: ConsumptionRequest[];
  onOpenDetail: (requestId: string) => void;
  onUpdateStatus: (requestId: string, status: 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED', notes?: string) => void;
  onOpenPrintModal: (list: ConsumptionRequest[]) => void;
}

export const KitchenAdminView: React.FC<Props> = ({
  currentUser,
  departments,
  users,
  requests,
  onOpenDetail,
  onUpdateStatus,
  onOpenPrintModal,
}) => {
  const [timeFilter, setTimeFilter] = useState<'TODAY' | 'TOMORROW' | 'THIS_WEEK' | 'THIS_MONTH' | 'ALL'>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Orders that are approved or in kitchen lifecycle
  const eligibleRequests = requests.filter(r => 
    ['APPROVED_HOD', 'APPROVED_WAKASEK', 'PROCESSING', 'READY', 'COMPLETED'].includes(r.status)
  );

  // Time-based filtering logic
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

  const filteredRequests = eligibleRequests.filter(req => {
    // 1. Time Filter
    if (timeFilter === 'TODAY' && req.consumption_date !== todayStr) return false;
    if (timeFilter === 'TOMORROW' && req.consumption_date !== tomorrowStr) return false;
    if (timeFilter === 'THIS_MONTH') {
      const reqMonth = new Date(req.consumption_date).getMonth();
      const currentMonth = now.getMonth();
      if (reqMonth !== currentMonth) return false;
    }

    // 2. Department Filter
    if (deptFilter !== 'ALL' && req.department_id !== deptFilter) return false;

    // 3. Status Filter
    if (statusFilter !== 'ALL' && req.status !== statusFilter) return false;

    // 4. Search term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match = 
        req.request_number.toLowerCase().includes(q) ||
        req.activity_name.toLowerCase().includes(q) ||
        req.guest_name.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  // Calculate quick metrics
  const approvedQueue = eligibleRequests.filter(r => r.status === 'APPROVED_HOD' || r.status === 'APPROVED_WAKASEK');
  const cookingQueue = eligibleRequests.filter(r => r.status === 'PROCESSING');
  const readyQueue = eligibleRequests.filter(r => r.status === 'READY');
  const completedQueue = eligibleRequests.filter(r => r.status === 'COMPLETED');

  const totalPackagesInView = filteredRequests.reduce((acc, curr) => acc + curr.quantity, 0);

  const getDeptName = (deptId: string) => departments.find(d => d.id === deptId)?.code || '-';
  const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'User';

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Dapur & Penyiapan Konsumsi
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola proses memasak, paket siap saji, dan cetak kebutuhan konsumsi harian
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Print button (Requirement 9) */}
          <button
            onClick={() => onOpenPrintModal(filteredRequests)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4 text-blue-400" />
            Print Daftar Konsumsi ({filteredRequests.length})
          </button>
        </div>
      </div>

      {/* Kanban / Stage Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* Stage 1: Disetujui (Approved) */}
        <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-xs">
          <div className="flex items-center justify-between text-blue-700 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Approved (Antre)</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-800">{approvedQueue.length}</p>
          <span className="text-[11px] text-blue-600 mt-1 block">Menunggu Dapur Mulai</span>
        </div>

        {/* Stage 2: Sedang Diproses (Cooking) */}
        <div className="bg-white p-4 rounded-2xl border border-indigo-200 bg-indigo-50/20 shadow-xs">
          <div className="flex items-center justify-between text-indigo-700 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Sedang Diproses</span>
            <ChefHat className="w-4 h-4 text-indigo-500 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-indigo-800">{cookingQueue.length}</p>
          <span className="text-[11px] text-indigo-600 mt-1 block">Proses Masak / Packing</span>
        </div>

        {/* Stage 3: Konsumsi Siap (Ready) */}
        <div className="bg-white p-4 rounded-2xl border border-teal-200 bg-teal-50/20 shadow-xs">
          <div className="flex items-center justify-between text-teal-700 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Konsumsi Siap</span>
            <PackageCheck className="w-4 h-4 text-teal-500" />
          </div>
          <p className="text-2xl font-black text-teal-800">{readyQueue.length}</p>
          <span className="text-[11px] text-teal-600 mt-1 block">Siap Diambil di Pantry</span>
        </div>

        {/* Stage 4: Selesai */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Selesai</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-800">{completedQueue.length}</p>
          <span className="text-[11px] text-emerald-600 mt-1 block">Kegiatan Tuntas</span>
        </div>

      </div>

      {/* Filter Toolbar (Requirement 9: Filter Hari ini, Besok, Minggu ini, Bulan ini, Dept, Jenis, Status) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Quick Date Filters */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setTimeFilter('ALL')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                timeFilter === 'ALL' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Waktu
            </button>
            <button
              onClick={() => setTimeFilter('TODAY')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                timeFilter === 'TODAY' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setTimeFilter('TOMORROW')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                timeFilter === 'TOMORROW' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Besok
            </button>
            <button
              onClick={() => setTimeFilter('THIS_MONTH')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                timeFilter === 'THIS_MONTH' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulan Ini
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari pesanan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Department:</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="p-1.5 rounded-lg border border-slate-300 bg-white focus:outline-hidden"
            >
              <option value="ALL">Semua Department / Jurusan</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Status Dapur:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-1.5 rounded-lg border border-slate-300 bg-white focus:outline-hidden"
            >
              <option value="ALL">Semua Status Dapur</option>
              <option value="APPROVED_HOD">Disetujui Koordinator HOD</option>
              <option value="APPROVED_WAKASEK">Approved Wakasek</option>
              <option value="PROCESSING">Diproses Dapur</option>
              <option value="READY">Konsumsi Siap</option>
              <option value="COMPLETED">Selesai</option>
            </select>
          </div>

          <div className="ml-auto text-slate-500 font-medium">
            Total Kebutuhan: <strong className="text-blue-700 font-bold">{totalPackagesInView} Paket</strong>
          </div>

        </div>
      </div>

      {/* Main Table (Requirement 9: Tanggal | Jam | Department | Kegiatan | Pemohon | Jenis Konsumsi | Jumlah | Status) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Jam Saji</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Kegiatan & Narasumber</th>
                <th className="p-3.5">Pemohon</th>
                <th className="p-3.5">Jenis & Rincian Menu</th>
                <th className="p-3.5 text-center">Jumlah</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Update Status Dapur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Tidak ada pesanan konsumsi aktif pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredRequests.map(req => {
                  const requesterUser = users.find(u => u.id === req.requester_id);

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Tanggal */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-bold text-slate-800 block">
                          {new Date(req.consumption_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="font-mono text-[10px] text-blue-700 block">
                          {req.request_number}
                        </span>
                      </td>

                      {/* Jam Saji */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-extrabold text-blue-800 text-xs px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                          <Clock className="w-3 h-3 text-blue-600" />
                          {req.consumption_time} WIB
                        </span>
                      </td>

                      {/* Department */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-bold text-slate-800 block">
                          {getDeptName(req.department_id)}
                        </span>
                      </td>

                      {/* Kegiatan & Tamu */}
                      <td className="p-3.5 max-w-xs">
                        <p className="font-bold text-slate-900 truncate" title={req.activity_name}>
                          {req.activity_name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          Tamu: <span className="font-semibold text-slate-700">{req.guest_name}</span>
                        </p>
                      </td>

                      {/* Pemohon */}
                      <td className="p-3.5 whitespace-nowrap">
                        <p className="font-medium text-slate-800 leading-tight">
                          {requesterUser?.name || 'Pemohon'}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {requesterUser?.phone_number || ''}
                        </span>
                      </td>

                      {/* Jenis & Rincian Konsumsi */}
                      <td className="p-3.5 max-w-xs">
                        <span className="font-bold text-slate-900 block">
                          {req.consumption_type}
                        </span>
                        <p className="text-[11px] text-slate-600 truncate" title={req.consumption_detail}>
                          {req.consumption_detail}
                        </p>
                        {req.notes && (
                          <p className="text-[10px] italic text-amber-700 truncate mt-0.5">
                            Catatan: {req.notes}
                          </p>
                        )}
                      </td>

                      {/* Jumlah */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span className="font-black text-blue-700 text-sm block">
                          {req.quantity} Paket
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {req.guest_count} Orang
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 whitespace-nowrap">
                        <StatusBadge status={req.status} size="sm" />
                      </td>

                      {/* Update Status Actions (APPROVED -> PROCESSING -> READY -> COMPLETED) */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1. If currently Approved -> can start Processing */}
                          {req.status.startsWith('APPROVED') && (
                            <button
                              onClick={() => onUpdateStatus(req.id, 'PROCESSING', 'Mulai dimasak dan disiapkan')}
                              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                              title="Mulai Masak / Siapkan"
                            >
                              <ChefHat className="w-3.5 h-3.5" />
                              Mulai Masak
                            </button>
                          )}

                          {/* 2. If currently Processing -> can mark Ready */}
                          {req.status === 'PROCESSING' && (
                            <button
                              onClick={() => onUpdateStatus(req.id, 'READY', 'Paket konsumsi sudah siap di meja pantry konsumsi')}
                              className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                              title="Tandai Siap"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              Tandai Siap
                            </button>
                          )}

                          {/* 3. If currently Ready -> can mark Completed */}
                          {req.status === 'READY' && (
                            <button
                              onClick={() => onUpdateStatus(req.id, 'COMPLETED', 'Konsumsi telah diserahkan dan selesai')}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                              title="Selesaikan"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Selesai
                            </button>
                          )}

                          {/* Detail inspector */}
                          <button
                            onClick={() => onOpenDetail(req.id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
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
