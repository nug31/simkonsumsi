import React, { useState } from 'react';
import { ConsumptionRequest, User, Department } from '../types';
import { formatWhatsAppMessage } from '../services/whatsapp';
import { MessageSquare, Copy, Check, ExternalLink, X, Send } from 'lucide-react';

interface Props {
  request: ConsumptionRequest;
  requester: User;
  department: Department;
  approver?: User;
  onClose: () => void;
}

export const WhatsAppModal: React.FC<Props> = ({
  request,
  requester,
  department,
  approver,
  onClose,
}) => {
  const [msgType, setMsgType] = useState<'NEW_SUBMISSION' | 'APPROVED' | 'REVISION_REQUIRED' | 'REJECTED' | 'READY'>('NEW_SUBMISSION');
  const [copied, setCopied] = useState(false);

  const { text, waUrl } = formatWhatsAppMessage({
    type: msgType,
    request,
    requester,
    department,
    approver,
    notes: request.notes,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 bg-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">WhatsApp Notification Gateway</h3>
              <p className="text-[11px] text-emerald-100">Pratinjau pesan otomatis WhatsApp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          
          {/* Message Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Pilih Template Notifikasi WhatsApp:
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <button
                onClick={() => setMsgType('NEW_SUBMISSION')}
                className={`p-2 rounded-lg font-medium border text-center transition-colors ${
                  msgType === 'NEW_SUBMISSION'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Pengajuan Baru
              </button>
              <button
                onClick={() => setMsgType('APPROVED')}
                className={`p-2 rounded-lg font-medium border text-center transition-colors ${
                  msgType === 'APPROVED'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Disetujui
              </button>
              <button
                onClick={() => setMsgType('READY')}
                className={`p-2 rounded-lg font-medium border text-center transition-colors ${
                  msgType === 'READY'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Konsumsi Siap
              </button>
              <button
                onClick={() => setMsgType('REVISION_REQUIRED')}
                className={`p-2 rounded-lg font-medium border text-center transition-colors ${
                  msgType === 'REVISION_REQUIRED'
                    ? 'bg-amber-50 border-amber-500 text-amber-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Minta Revisi
              </button>
              <button
                onClick={() => setMsgType('REJECTED')}
                className={`p-2 rounded-lg font-medium border text-center transition-colors ${
                  msgType === 'REJECTED'
                    ? 'bg-rose-50 border-rose-500 text-rose-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Ditolak
              </button>
            </div>
          </div>

          {/* WhatsApp Preview Bubble */}
          <div className="bg-[#e5ddd5] p-3 rounded-2xl border border-slate-300">
            <div className="bg-white p-3.5 rounded-xl shadow-xs text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
              {text}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleCopy}
              className="flex-1 py-2 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  Tersalin ke Clipboard!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  Salin Teks Pesan
                </>
              )}
            </button>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Send className="w-4 h-4" />
              Buka WhatsApp
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          </div>

        </div>

        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
          <span>Format siap diintegrasikan dengan Fonnte / Wablas API</span>
          <button
            onClick={onClose}
            className="text-slate-600 hover:underline font-semibold"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
