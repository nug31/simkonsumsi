import React from 'react';
import { RequestStatus } from '../types';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  ChefHat, 
  PackageCheck, 
  FileEdit,
  RotateCcw
} from 'lucide-react';

interface Props {
  status: RequestStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold',
  }[size];

  switch (status) {
    case 'DRAFT':
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-300 ${sizeClasses}`}>
          <FileEdit className="w-3.5 h-3.5 text-slate-500" />
          Draft
        </span>
      );

    case 'WAITING_HOD':
      return (
        <span className={`inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-300 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          Menunggu Koordinator HOD
        </span>
      );

    case 'WAITING_WAKASEK':
      return (
        <span className={`inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-300 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          Menunggu Wakasek
        </span>
      );

    case 'APPROVED_HOD':
      return (
        <span className={`inline-flex items-center rounded-full bg-sky-50 text-sky-700 border border-sky-300 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
          Disetujui Koordinator HOD
        </span>
      );

    case 'APPROVED_WAKASEK':
      return (
        <span className={`inline-flex items-center rounded-full bg-sky-50 text-sky-700 border border-sky-300 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
          Disetujui Wakasek
        </span>
      );

    case 'PROCESSING':
      return (
        <span className={`inline-flex items-center rounded-full bg-cyan-50 text-cyan-700 border border-cyan-300 ${sizeClasses}`}>
          <ChefHat className="w-3.5 h-3.5 text-cyan-600" />
          Diproses Dapur
        </span>
      );

    case 'READY':
      return (
        <span className={`inline-flex items-center rounded-full bg-teal-50 text-teal-700 border border-teal-300 ${sizeClasses}`}>
          <PackageCheck className="w-3.5 h-3.5 text-teal-600" />
          Konsumsi Siap
        </span>
      );

    case 'COMPLETED':
      return (
        <span className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Selesai
        </span>
      );

    case 'REVISION_REQUIRED':
      return (
        <span className={`inline-flex items-center rounded-full bg-orange-50 text-orange-700 border border-orange-300 ${sizeClasses}`}>
          <RotateCcw className="w-3.5 h-3.5 text-orange-600" />
          Perlu Revisi
        </span>
      );

    case 'REJECTED':
      return (
        <span className={`inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-300 ${sizeClasses}`}>
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Ditolak
        </span>
      );

    case 'CANCELLED':
      return (
        <span className={`inline-flex items-center rounded-full bg-gray-100 text-gray-600 border border-gray-300 ${sizeClasses}`}>
          <AlertCircle className="w-3.5 h-3.5 text-gray-400" />
          Dibatalkan
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-gray-100 text-gray-700 ${sizeClasses}`}>
          {status}
        </span>
      );
  }
};
