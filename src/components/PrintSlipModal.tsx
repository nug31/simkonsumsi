import React from 'react';
import { ConsumptionRequest, User, Department } from '../types';
import { Printer, X, Download } from 'lucide-react';

interface Props {
  request?: ConsumptionRequest; // If printing single slip
  requestsList?: ConsumptionRequest[]; // If printing batch list (e.g. today's consumption list)
  filterDate?: string;
  users: User[];
  departments: Department[];
  onClose: () => void;
}

export const PrintSlipModal: React.FC<Props> = ({
  request,
  requestsList,
  filterDate,
  users,
  departments,
  onClose,
}) => {
  const isSingle = !!request;
  const list = requestsList || (request ? [request] : []);

  const totalPackages = list.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalGuests = list.reduce((acc, curr) => acc + curr.guest_count, 0);

  const handlePrint = () => {
    window.print();
  };

  const getDepartmentName = (deptId: string) => {
    const d = departments.find(item => item.id === deptId);
    return d ? `${d.name} (${d.code})` : '-';
  };

  const getUserName = (userId: string) => {
    const u = users.find(item => item.id === userId);
    return u ? u.name : '-';
  };

  return (
    <div className="fixed inset-0 z-70 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="px-5 py-3.5 bg-slate-800 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm">
              {isSingle ? 'Cetak Lembar Pesanan Konsumsi' : 'Cetak Rekapitulasi Dapur Konsumsi'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              Cetak Sekarang
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-white text-black font-sans text-xs">
          
          {/* Official Letterhead (KOP SURAT) */}
          <div className="border-b-2 border-black pb-4 mb-6 text-center">
            <h2 className="font-extrabold text-sm uppercase tracking-wider">
              SMK NEGERI UNGGULAN & MITRA INDUSTRI
            </h2>
            <h1 className="font-extrabold text-lg uppercase tracking-tight text-slate-900">
              UNIT LOGISTIK & DAPUR PELAYANAN KONSUMSI
            </h1>
            <p className="text-[11px] text-slate-700">
              Jl. Pendidikan Industri No. 01, Kawasan Vokasi Unggulan • Telp: (021) 8901234 • Email: konsumsi@sekolah.sch.id
            </p>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h3 className="text-sm font-bold uppercase underline tracking-wide">
              {isSingle ? 'SURAT BUKTI KEBUTUHAN KONSUMSI KEGIATAN' : 'DAFTAR KEBUTUHAN KONSUMSI HARIAN'}
            </h3>
            <p className="text-xs text-slate-700 mt-1">
              Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Table of Consumption Items */}
          <div className="mb-6 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse border border-black text-left text-xs">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-black text-slate-900">
                  <th className="border border-black p-2 text-center w-8">No</th>
                  <th className="border border-black p-2 w-28">No. Pengajuan</th>
                  <th className="border border-black p-2 w-20">Jam</th>
                  <th className="border border-black p-2">Kegiatan & Tamu</th>
                  <th className="border border-black p-2 w-28">Unit/Jurusan</th>
                  <th className="border border-black p-2">Rincian Menu</th>
                  <th className="border border-black p-2 text-center w-14">Qty</th>
                </tr>
              </thead>
              <tbody>
                {list.map((item, idx) => (
                  <tr key={item.id} className="border-b border-black">
                    <td className="border border-black p-2 text-center">{idx + 1}</td>
                    <td className="border border-black p-2 font-mono font-semibold">{item.request_number}</td>
                    <td className="border border-black p-2 font-bold">{item.consumption_time} WIB</td>
                    <td className="border border-black p-2">
                      <p className="font-bold">{item.activity_name}</p>
                      <p className="text-[11px] text-slate-700">Tamu: {item.guest_name}</p>
                    </td>
                    <td className="border border-black p-2">{getDepartmentName(item.department_id)}</td>
                    <td className="border border-black p-2">
                      <span className="font-semibold underline">{item.consumption_type}</span>
                      <p className="text-[11px] text-slate-700">{item.consumption_detail}</p>
                      {item.notes && <p className="text-[10px] italic text-slate-600">Ket: {item.notes}</p>}
                    </td>
                    <td className="border border-black p-2 text-center font-bold text-sm">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-black font-bold bg-slate-50">
                  <td colSpan={6} className="border border-black p-2 text-right">TOTAL KEBUTUHAN PAKET:</td>
                  <td className="border border-black p-2 text-center text-sm font-extrabold">{totalPackages} Paket</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-6 text-center mt-10 pt-4 text-xs">
            <div>
              <p className="text-slate-600">Mengetahui / Menyetujui,</p>
              <p className="font-bold">Wakasek / Koordinator HOD</p>
              <div className="h-16"></div>
              <p className="font-bold underline">(................................................)</p>
              <p className="text-[10px] text-slate-500">NIP.</p>
            </div>

            <div>
              <p className="text-slate-600">Disiapkan Oleh,</p>
              <p className="font-bold">Koordinator Dapur Konsumsi</p>
              <div className="h-16"></div>
              <p className="font-bold underline">Ibu Sri Utami, S.E.</p>
              <p className="text-[10px] text-slate-500">PIC Logistik Konsumsi</p>
            </div>

            <div>
              <p className="text-slate-600">Diterima Oleh,</p>
              <p className="font-bold">Pemohon / Penanggung Jawab</p>
              <div className="h-16"></div>
              <p className="font-bold underline">
                {isSingle && request ? getUserName(request.requester_id) : '(................................................)'}
              </p>
              <p className="text-[10px] text-slate-500">Tanda Tangan & Tanggal</p>
            </div>
          </div>

          <div className="mt-8 pt-3 border-t border-slate-300 text-[10px] text-slate-400 text-center">
            Dokumen ini dicetak otomatis oleh SIMKONSUMSI - Sistem Permintaan Konsumsi Guru Tamu & Mitra Industri
          </div>

        </div>

      </div>
    </div>
  );
};
