import React, { useState } from 'react';
import { ConsumptionRequest, User, Department } from '../types';
import { formatWhatsAppMessage } from '../services/whatsapp';
import { MessageSquare, Copy, Check, ExternalLink, Search, Send, Clock, UserCheck } from 'lucide-react';

interface Props {
  requests: ConsumptionRequest[];
  users: User[];
  departments: Department[];
}

export const WhatsAppHubView: React.FC<Props> = ({ requests, users, departments }) => {
  const [selectedReqId, setSelectedReqId] = useState<string>(requests[0]?.id || '');
  const [msgType, setMsgType] = useState<'NEW_SUBMISSION' | 'APPROVED' | 'REVISION_REQUIRED' | 'REJECTED' | 'READY'>('NEW_SUBMISSION');
  const [copied, setCopied] = useState(false);

  const selectedRequest = requests.find(r => r.id === selectedReqId) || requests[0];
  const requester = users.find(u => u.id === selectedRequest?.requester_id) || users[0];
  const department = departments.find(d => d.id === selectedRequest?.department_id) || departments[0];
  const approver = users.find(u => u.id === selectedRequest?.target_approver_id);

  const { text, waUrl } = selectedRequest ? formatWhatsAppMessage({
    type: msgType,
    request: selectedRequest,
    requester,
    department,
    approver,
    notes: selectedRequest.notes,
  }) : { text: '', waUrl: '' };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              WhatsApp Notification Gateway Hub
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulasi format pesan notifikasi otomatis untuk integrasi WhatsApp API internal
            </p>
          </div>
        </div>

        <div className="text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 font-medium">
          Status Engine: <strong>Siap API (Fonnte / Webhook Ready)</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Select Request & Template */}
        <div className="space-y-4">
          
          {/* Select Request */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              1. Pilih Pengajuan Terkait:
            </label>
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {requests.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReqId(r.id)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${
                    selectedReqId === r.id
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-blue-700">{r.request_number}</span>
                    <span className="text-[10px] text-slate-400">{r.consumption_date}</span>
                  </div>
                  <p className="text-xs font-bold truncate mt-0.5">{r.activity_name}</p>
                  <p className="text-[11px] text-slate-500 truncate">Tamu: {r.guest_name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Select Template */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              2. Skenario Status Notifikasi:
            </label>
            <div className="grid grid-cols-1 gap-1.5 text-xs">
              <button
                onClick={() => setMsgType('NEW_SUBMISSION')}
                className={`p-2.5 rounded-xl font-semibold text-left border transition-colors flex items-center justify-between ${
                  msgType === 'NEW_SUBMISSION'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Pengajuan Baru $\rightarrow$ Ke Approver</span>
                <span className="text-[10px] opacity-80 font-normal">Koordinator HOD/Wakasek</span>
              </button>

              <button
                onClick={() => setMsgType('APPROVED')}
                className={`p-2.5 rounded-xl font-semibold text-left border transition-colors flex items-center justify-between ${
                  msgType === 'APPROVED'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Persetujuan Disetujui $\rightarrow$ Ke Pemohon & Dapur</span>
                <span className="text-[10px] opacity-80 font-normal">Dapur</span>
              </button>

              <button
                onClick={() => setMsgType('READY')}
                className={`p-2.5 rounded-xl font-semibold text-left border transition-colors flex items-center justify-between ${
                  msgType === 'READY'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Konsumsi Siap Saji $\rightarrow$ Ke Pemohon</span>
                <span className="text-[10px] opacity-80 font-normal">Ambil</span>
              </button>

              <button
                onClick={() => setMsgType('REVISION_REQUIRED')}
                className={`p-2.5 rounded-xl font-semibold text-left border transition-colors flex items-center justify-between ${
                  msgType === 'REVISION_REQUIRED'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Permintaan Revisi $\rightarrow$ Ke Pemohon</span>
                <span className="text-[10px] opacity-80 font-normal">Edit</span>
              </button>

              <button
                onClick={() => setMsgType('REJECTED')}
                className={`p-2.5 rounded-xl font-semibold text-left border transition-colors flex items-center justify-between ${
                  msgType === 'REJECTED'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Penolakan Pengajuan $\rightarrow$ Ke Pemohon</span>
                <span className="text-[10px] opacity-80 font-normal">Ditolak</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: WhatsApp Mock Phone Preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">SIMKONSUMSI Notification Bot</h3>
                  <p className="text-[11px] text-slate-500">+62 812-9988-7766 • Otomatisasi Sekolah</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  {copied ? 'Tersalin!' : 'Salin Pesan'}
                </button>

                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  Kirim Pesan
                  <ExternalLink className="w-3 h-3 opacity-75" />
                </a>
              </div>
            </div>

            {/* Simulated WhatsApp Chat Screen */}
            <div className="bg-[#efeae2] p-4 rounded-2xl border border-slate-300 min-h-[360px] flex flex-col justify-end">
              <div className="max-w-xl bg-white p-4 rounded-2xl rounded-tl-xs shadow-md border border-slate-200 text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed space-y-2">
                {text}
                <div className="text-right text-[10px] text-slate-400 mt-1">
                  {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} ✓✓
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              Pesan di atas diformat menggunakan sintaks WhatsApp (*bold*, _italic_, bullet points) dan dapat langsung dikirimkan ke nomor WhatsApp PIC terkait.
            </p>

          </div>
        </div>

      </div>

    </div>
  );
};
