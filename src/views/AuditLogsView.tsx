import React, { useState } from 'react';
import { AuditLogItem } from '../types';
import { History, Search, ShieldCheck, UserCheck, Clock } from 'lucide-react';

interface Props {
  logs: AuditLogItem[];
  onOpenRequest?: (requestId: string) => void;
}

export const AuditLogsView: React.FC<Props> = ({ logs, onOpenRequest }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(log => 
    log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Audit Trail & Riwayat Aktivitas Sistem
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Seluruh riwayat aksi pengguna, perubahan status approval, dan log pemrosesan konsumsi
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari aktivitas/user/aksi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5 w-44">Waktu</th>
                <th className="p-3.5 w-48">Pengguna (Aktor)</th>
                <th className="p-3.5 w-44">Aksi</th>
                <th className="p-3.5">Deskripsi Perubahan</th>
                <th className="p-3.5 text-right">No. Pengajuan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-sans text-xs">
                    Belum ada rekaman audit log.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 whitespace-nowrap text-slate-500">
                      {new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3.5 whitespace-nowrap font-bold text-slate-800 font-sans">
                      {log.user_name}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200 text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 font-sans text-xs text-slate-800">
                      {log.description}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap font-bold text-blue-700">
                      {log.request_id ? (
                        <button
                          onClick={() => onOpenRequest && onOpenRequest(log.request_id!)}
                          className="hover:underline"
                        >
                          Lihat Terkait
                        </button>
                      ) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
