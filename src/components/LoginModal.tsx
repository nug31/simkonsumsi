import React, { useState } from 'react';
import { User, StaffDirectoryEntry } from '../types';
import { storageService } from '../services/storage';
import {
  Search,
  Building2,
  ArrowLeft,
  AlertCircle,
  UtensilsCrossed,
  Delete
} from 'lucide-react';

interface Props {
  users: StaffDirectoryEntry[];
  currentUser: User | null;
  onLoginSuccess: (user: User) => void;
  onClose?: () => void;
  isMandatory?: boolean;
}

export const LoginModal: React.FC<Props> = ({
  users,
  currentUser,
  onLoginSuccess,
  onClose,
  isMandatory = false,
}) => {
  const departments = storageService.getDepartments();
  const [selectedUser, setSelectedUser] = useState<StaffDirectoryEntry | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtered users by search
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.title && u.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDeptName = (deptId: string) => {
    const d = departments.find(item => item.id === deptId);
    return d ? `${d.code} - ${d.name}` : '-';
  };

  const handleSelectUser = (user: StaffDirectoryEntry) => {
    setSelectedUser(user);
    setPin('');
    setError('');
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 4 && !isVerifying) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError('');
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const verifyPin = async (pinToTest: string) => {
    if (!selectedUser) return;
    setIsVerifying(true);
    const res = await storageService.loginWithPin(selectedUser.username, pinToTest);
    setIsVerifying(false);
    if (res.success && res.user) {
      onLoginSuccess(res.user);
    } else {
      setError(res.message || 'PIN salah!');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-70 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">
                Portal SIMKONSUMSI
              </h3>
              <p className="text-[11px] text-emerald-100">
                Pilih Nama Guru & Masukkan PIN Singkat
              </p>
            </div>
          </div>

          {!isMandatory && onClose && (
            <button
              onClick={onClose}
              className="text-xs text-white/80 hover:text-white px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              Tutup
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="p-6">
          
          {/* STEP 1: SELECT TEACHER */}
          {!selectedUser ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Langkah 1: Pilih Nama Anda
                  </h4>
                  <p className="text-xs text-slate-500">
                    Pilih akun Anda dari daftar guru & staf sekolah berikut
                  </p>
                </div>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ketik nama guru, jabatan, atau jurusan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>

              {/* Teacher Cards Grid */}
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {filteredUsers.map(u => {
                  const dept = departments.find(d => d.id === u.department_id);
                  const isCurrent = currentUser?.id === u.id;

                  return (
                    <button
                      key={u.id}
                      onClick={() => handleSelectUser(u)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between group ${
                        isCurrent 
                          ? 'bg-emerald-50/70 border-emerald-300 hover:border-emerald-400' 
                          : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50/70 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}`}
                          alt={u.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {u.name}
                          </p>
                          <p className="text-[11px] text-slate-500 leading-tight">
                            {u.title || u.role}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {dept?.code} • {dept?.type}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.role === 'REQUESTER' ? 'bg-emerald-100 text-emerald-800' :
                          u.role === 'HOD' ? 'bg-sky-100 text-sky-800' :
                          u.role === 'WAKASEK' ? 'bg-purple-100 text-purple-800' :
                          u.role === 'ADMIN_KONSUMSI' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {u.role}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-semibold group-hover:underline">
                          Pilih & Masuk →
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* STEP 2: INPUT 4-DIGIT PIN */
            <div className="space-y-5 text-center">
              
              {/* Selected User Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="text-xs text-emerald-600 hover:text-emerald-800 flex items-center gap-1 font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Ganti Guru Lain
                </button>
                <span className="text-[10px] text-slate-400">
                  Langkah 2 dari 2
                </span>
              </div>

              <div className="space-y-1">
                <img
                  src={selectedUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}`}
                  alt={selectedUser.name}
                  className="w-16 h-16 rounded-2xl mx-auto object-cover border-2 border-emerald-500 shadow-md"
                />
                <h3 className="text-base font-extrabold text-slate-900 pt-1">
                  {selectedUser.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedUser.title} ({getDeptName(selectedUser.department_id)})
                </p>
              </div>

              {/* PIN Bubbles Display */}
              <div className="py-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Masukkan PIN 4 Digit:
                </label>
                <div className="flex items-center justify-center gap-3">
                  {[0, 1, 2, 3].map(idx => (
                    <div
                      key={idx}
                      className={`w-11 h-12 rounded-xl border-2 flex items-center justify-center text-lg font-black transition-all ${
                        pin.length > idx
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                          : 'border-slate-300 bg-slate-50 text-transparent'
                      }`}
                    >
                      {pin.length > idx ? '●' : ''}
                    </div>
                  ))}
                </div>

                {error ? (
                  <p className="text-xs text-rose-600 font-bold mt-2 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {error}
                  </p>
                ) : isVerifying ? (
                  <p className="text-[11px] text-slate-400 mt-2">Memeriksa PIN...</p>
                ) : null}
              </div>

              {/* Virtual Numpad */}
              <div className="max-w-[260px] mx-auto grid grid-cols-3 gap-2 pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeyPress(num)}
                    className="h-12 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 text-slate-800 text-lg font-bold border border-slate-200 transition-all active:scale-95 shadow-xs"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPin('')}
                  className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-semibold border border-slate-200"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => handleKeyPress('0')}
                  className="h-12 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 text-slate-800 text-lg font-bold border border-slate-200 transition-all active:scale-95 shadow-xs"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="h-12 rounded-2xl bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-600 flex items-center justify-center border border-slate-200"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
          <span>SIMKONSUMSI - Keamanan & Akuntabilitas Sekolah</span>
          <span className="font-semibold text-emerald-600">SMK Mitra Industri</span>
        </div>

      </div>
    </div>
  );
};
