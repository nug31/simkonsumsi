import React, { useState } from 'react';
import { ConsumptionRequest, User } from '../types';
import { 
  CheckCircle2, 
  RotateCcw, 
  XCircle, 
  AlertTriangle, 
  X 
} from 'lucide-react';

interface Props {
  action: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION';
  request: ConsumptionRequest;
  currentUser: User;
  onClose: () => void;
  onSubmit: (notes: string) => void;
}

export const ApprovalActionModal: React.FC<Props> = ({
  action,
  request,
  currentUser,
  onClose,
  onSubmit,
}) => {
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const isReject = action === 'REJECT';
  const isRevision = action === 'REQUEST_REVISION';
  const isApprove = action === 'APPROVE';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((isReject || isRevision) && !notes.trim()) {
      setError(
        isReject 
          ? 'Alasan penolakan WAJIB diisi!' 
          : 'Catatan instruksi revisi WAJIB diisi agar pemohon mengetahui hal yang harus diperbaiki!'
      );
      return;
    }
    onSubmit(notes.trim());
  };

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between ${
          isApprove 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : isRevision 
            ? 'bg-amber-50 border-amber-200 text-amber-900' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-2.5">
            {isApprove && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            {isRevision && <RotateCcw className="w-5 h-5 text-amber-600" />}
            {isReject && <XCircle className="w-5 h-5 text-rose-600" />}
            <h3 className="font-bold text-base">
              {isApprove && 'Konfirmasi Persetujuan (Approve)'}
              {isRevision && 'Permintaan Revisi Pengajuan'}
              {isReject && 'Tolak Pengajuan Konsumsi'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
            <p><span className="text-slate-500 font-semibold">No. Pengajuan:</span> <strong className="font-mono">{request.request_number}</strong></p>
            <p><span className="text-slate-500 font-semibold">Kegiatan:</span> <strong>{request.activity_name}</strong></p>
            <p><span className="text-slate-500 font-semibold">Tamu/Penerima:</span> <strong>{request.guest_name} ({request.guest_count} org)</strong></p>
            <p><span className="text-slate-500 font-semibold">Kebutuhan:</span> <strong>{request.quantity} paket {request.consumption_type}</strong></p>
          </div>

          {/* Description banner */}
          {isApprove && (
            <p className="text-xs text-slate-600 leading-relaxed">
              Dengan menyetujui, status pengajuan akan berubah menjadi <strong className="text-blue-700">APPROVED</strong> dan diteruskan ke Dapur Konsumsi untuk segera diproses.
            </p>
          )}

          {isRevision && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 text-amber-800 text-xs border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                Status akan menjadi <strong className="font-semibold">REVISION_REQUIRED</strong>. Pemohon akan menerima notifikasi beserta catatan Anda untuk dapat mengedit dan mengirim ulang data pengajuan.
              </p>
            </div>
          )}

          {isReject && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 text-rose-800 text-xs border border-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p>
                Pengajuan yang ditolak <strong className="font-semibold">tidak dapat diproses lagi</strong> ke bagian konsumsi. Pastikan alasan penolakan jelas.
              </p>
            </div>
          )}

          {/* Note Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              {isApprove ? 'Catatan Tambahan (Opsional):' : isRevision ? 'Catatan Perbaikan / Instruksi Revisi (Wajib):' : 'Alasan Penolakan (Wajib):'}
            </label>
            <textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                if (error) setError('');
              }}
              rows={3}
              placeholder={
                isApprove
                  ? 'Contoh: Disetujui, mohon disajikan tepat waktu sebelum sesi dimulai...'
                  : isRevision
                  ? 'Contoh: Mohon rincikan menu snack dan lampirkan surat tugas...'
                  : 'Contoh: Anggaran konsumsi untuk kegiatan internal ini belum dialokasikan...'
              }
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-xs font-bold rounded-xl text-white shadow-xs transition-colors ${
                isApprove 
                  ? 'bg-emerald-600 hover:bg-emerald-700' 
                  : isRevision 
                  ? 'bg-amber-600 hover:bg-amber-700' 
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {isApprove && 'Konfirmasi Setuju'}
              {isRevision && 'Kirim Permintaan Revisi'}
              {isReject && 'Tolak Pengajuan'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
