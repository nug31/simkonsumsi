import React, { useState } from 'react';
import { 
  User, 
  Department, 
  ConsumptionRequest, 
  ActivityType, 
  ConsumptionType, 
  RequestStatus 
} from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { 
  BarChart3, 
  Download, 
  Printer, 
  Search, 
  Filter, 
  Calendar, 
  Building2, 
  Users, 
  Utensils, 
  DollarSign, 
  FileSpreadsheet,
  FileText
} from 'lucide-react';

interface Props {
  departments: Department[];
  users: User[];
  requests: ConsumptionRequest[];
  onOpenPrintModal: (list: ConsumptionRequest[]) => void;
  onOpenDetail: (requestId: string) => void;
}

export const RekapReportView: React.FC<Props> = ({
  departments,
  users,
  requests,
  onOpenPrintModal,
  onOpenDetail,
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [activityFilter, setActivityFilter] = useState('ALL');
  const [consumptionFilter, setConsumptionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtered requests
  const filteredList = requests.filter(req => {
    if (startDate && req.consumption_date < startDate) return false;
    if (endDate && req.consumption_date > endDate) return false;
    if (deptFilter !== 'ALL' && req.department_id !== deptFilter) return false;
    if (activityFilter !== 'ALL' && req.activity_type !== activityFilter) return false;
    if (consumptionFilter !== 'ALL' && req.consumption_type !== consumptionFilter) return false;
    if (statusFilter !== 'ALL' && req.status !== statusFilter) return false;

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

  // Calculate Metrics (Requirement 18: Total pengajuan, Total orang, Total paket, Total estimasi budget)
  const totalPengajuan = filteredList.length;
  const totalOrang = filteredList.reduce((acc, curr) => acc + curr.guest_count, 0);
  const totalPaket = filteredList.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalBudget = filteredList.reduce((acc, curr) => acc + (curr.estimated_budget || 0), 0);

  // Export CSV Function (Excel Compatible)
  const handleExportCSV = () => {
    const headers = [
      'No. Pengajuan',
      'Tanggal Konsumsi',
      'Jam',
      'Department/Jurusan',
      'Jenis Kegiatan',
      'Nama Kegiatan',
      'Guru Tamu/Narasumber',
      'Jumlah Orang',
      'Jumlah Paket',
      'Jenis Konsumsi',
      'Rincian Menu',
      'Estimasi Biaya',
      'Status',
    ];

    const rows = filteredList.map(req => {
      const dept = departments.find(d => d.id === req.department_id);
      return [
        `"${req.request_number}"`,
        `"${req.consumption_date}"`,
        `"${req.consumption_time}"`,
        `"${dept?.name || ''} (${dept?.code || ''})"`,
        `"${req.activity_type}"`,
        `"${req.activity_name.replace(/"/g, '""')}"`,
        `"${req.guest_name.replace(/"/g, '""')}"`,
        req.guest_count,
        req.quantity,
        `"${req.consumption_type}"`,
        `"${req.consumption_detail.replace(/"/g, '""')}"`,
        req.estimated_budget || 0,
        `"${req.status}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Konsumsi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDeptName = (deptId: string) => departments.find(d => d.id === deptId)?.code || '-';
  const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'User';

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            Rekapitulasi & Laporan Konsumsi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Laporan agregat kebutuhan konsumsi, rincian paket per jurusan, dan ekspor data audit
          </p>
        </div>

        {/* Action Buttons: Export & Print (Requirement 18) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            Ekspor Excel / CSV
          </button>

          <button
            onClick={() => onOpenPrintModal(filteredList)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            Cetak Rekap Laporan
          </button>
        </div>
      </div>

      {/* Summary KPI Cards (Requirement 18: Total pengajuan, Total orang, Total paket, Total estimasi budget) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* Card 1: Total Pengajuan */}
        <div className="bg-white p-4 rounded-2xl border border-sky-200 bg-sky-50/20 shadow-xs">
          <div className="flex items-center justify-between text-sky-700 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Pengajuan</span>
            <FileText className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-black text-sky-800">{totalPengajuan}</p>
          <span className="text-[11px] text-sky-600 mt-1 block">Kegiatan Terekam</span>
        </div>

        {/* Card 2: Total Orang */}
        <div className="bg-white p-4 rounded-2xl border border-purple-200 bg-purple-50/20 shadow-xs">
          <div className="flex items-center justify-between text-purple-700 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Tamu/Orang</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-800">{totalOrang} Orang</p>
          <span className="text-[11px] text-purple-600 mt-1 block">Penerima Manfaat</span>
        </div>

        {/* Card 3: Total Paket */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Paket Konsumsi</span>
            <Utensils className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-800">{totalPaket} Paket</p>
          <span className="text-[11px] text-emerald-600 mt-1 block">Porsi Tersajikan</span>
        </div>

        {/* Card 4: Total Estimasi Budget */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Estimasi Anggaran</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-black text-amber-800 truncate">
            Rp {totalBudget.toLocaleString('id-ID')}
          </p>
          <span className="text-[11px] text-amber-600 mt-1 block">Total Alokasi Biaya</span>
        </div>

      </div>

      {/* Filter Matrix (Requirement 18: Tanggal, Department, Jenis Kegiatan, Jenis Konsumsi, Status) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-emerald-600" />
          Filter Rekapitulasi Data
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs">
          
          {/* Tanggal Dari */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Dari Tanggal:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-300 bg-white focus:outline-hidden"
            />
          </div>

          {/* Tanggal Sampai */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Sampai Tanggal:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-300 bg-white focus:outline-hidden"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Department / Jurusan:</label>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-300 bg-white focus:outline-hidden"
            >
              <option value="ALL">Semua Unit</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.code}</option>
              ))}
            </select>
          </div>

          {/* Jenis Kegiatan */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Jenis Kegiatan:</label>
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-300 bg-white focus:outline-hidden"
            >
              <option value="ALL">Semua Jenis Kegiatan</option>
              <option value="Guru Tamu">Guru Tamu</option>
              <option value="Trainer">Trainer</option>
              <option value="Instruktur">Instruktur</option>
              <option value="Narasumber">Narasumber</option>
              <option value="Pendalaman Materi">Pendalaman Materi</option>
              <option value="Meeting">Meeting</option>
              <option value="Workshop">Workshop</option>
              <option value="Pelatihan">Pelatihan</option>
              <option value="Kegiatan Sekolah">Kegiatan Sekolah</option>
            </select>
          </div>

          {/* Jenis Konsumsi */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Jenis Konsumsi:</label>
            <select
              value={consumptionFilter}
              onChange={(e) => setConsumptionFilter(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-300 bg-white focus:outline-hidden"
            >
              <option value="ALL">Semua Konsumsi</option>
              <option value="Snack">Snack</option>
              <option value="Makan">Makan</option>
              <option value="Snack + Makan">Snack + Makan</option>
              <option value="Minuman">Minuman</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status Pengajuan:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-300 bg-white focus:outline-hidden"
            >
              <option value="ALL">Semua Status</option>
              <option value="WAITING_HOD">Menunggu Koordinator HOD</option>
              <option value="WAITING_WAKASEK">Menunggu Wakasek</option>
              <option value="APPROVED_HOD">Disetujui Koordinator HOD</option>
              <option value="APPROVED_WAKASEK">Approved Wakasek</option>
              <option value="PROCESSING">Diproses</option>
              <option value="READY">Siap</option>
              <option value="COMPLETED">Selesai</option>
              <option value="REJECTED">Ditolak</option>
            </select>
          </div>

        </div>

        {/* Reset Filter Button */}
        {(startDate || endDate || deptFilter !== 'ALL' || activityFilter !== 'ALL' || consumptionFilter !== 'ALL' || statusFilter !== 'ALL') && (
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setDeptFilter('ALL');
                setActivityFilter('ALL');
                setConsumptionFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="text-xs text-emerald-600 hover:underline font-semibold"
            >
              Reset Semua Filter
            </button>
          </div>
        )}
      </div>

      {/* Rekap Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">No. Pengajuan</th>
                <th className="p-3.5">Tanggal & Jam</th>
                <th className="p-3.5">Jurusan / Unit</th>
                <th className="p-3.5">Kegiatan & Tamu</th>
                <th className="p-3.5">Menu Konsumsi</th>
                <th className="p-3.5 text-center">Jumlah</th>
                <th className="p-3.5 text-right">Estimasi Biaya</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Tidak ada data pengajuan yang sesuai kriteria laporan.
                  </td>
                </tr>
              ) : (
                filteredList.map(req => (
                  <tr 
                    key={req.id} 
                    onClick={() => onOpenDetail(req.id)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="p-3.5 whitespace-nowrap font-mono font-bold text-emerald-700">
                      {req.request_number}
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <p className="font-semibold text-slate-800">
                        {new Date(req.consumption_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <span className="text-[10px] text-slate-500">{req.consumption_time} WIB</span>
                    </td>

                    <td className="p-3.5 whitespace-nowrap font-semibold text-slate-800">
                      {getDeptName(req.department_id)}
                    </td>

                    <td className="p-3.5 max-w-xs">
                      <p className="font-bold text-slate-900 truncate" title={req.activity_name}>
                        {req.activity_name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        Tamu: {req.guest_name}
                      </p>
                    </td>

                    <td className="p-3.5 max-w-xs">
                      <span className="font-bold text-slate-800 block">{req.consumption_type}</span>
                      <span className="text-[10px] text-slate-500 truncate block" title={req.consumption_detail}>
                        {req.consumption_detail}
                      </span>
                    </td>

                    <td className="p-3.5 text-center whitespace-nowrap">
                      <span className="font-bold text-emerald-700 block">{req.quantity} Paket</span>
                      <span className="text-[10px] text-slate-400">{req.guest_count} Tamu</span>
                    </td>

                    <td className="p-3.5 text-right whitespace-nowrap font-mono font-semibold text-slate-800">
                      {req.estimated_budget ? `Rp ${req.estimated_budget.toLocaleString('id-ID')}` : '-'}
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <StatusBadge status={req.status} size="sm" />
                    </td>

                  </tr>
                ))
              )}
            </tbody>
            {filteredList.length > 0 && (
              <tfoot className="bg-slate-100 font-bold text-slate-900 border-t border-slate-200">
                <tr>
                  <td colSpan={5} className="p-3.5 text-right uppercase text-xs">Total Agregat:</td>
                  <td className="p-3.5 text-center text-emerald-800 font-black">{totalPaket} Paket</td>
                  <td className="p-3.5 text-right font-mono font-black text-amber-800">Rp {totalBudget.toLocaleString('id-ID')}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

    </div>
  );
};
