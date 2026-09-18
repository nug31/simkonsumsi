import React, { useState } from 'react';
import { Department, User, UserRole } from '../types';
import { storageService } from '../services/storage';
import { Database, Building2, Users, Plus, Check, UserPlus } from 'lucide-react';

interface Props {
  departments: Department[];
  users: User[];
}

const ROLE_OPTIONS: UserRole[] = ['REQUESTER', 'HOD', 'WAKASEK', 'ADMIN_KONSUMSI', 'SUPERADMIN'];

export const MasterDataView: React.FC<Props> = ({ departments, users }) => {
  const [activeSubTab, setActiveSubTab] = useState<'DEPARTMENTS' | 'USERS'>('DEPARTMENTS');

  // New Department Form State
  const [showAddDept, setShowAddDept] = useState(false);
  const [deptCode, setDeptCode] = useState('');
  const [deptName, setDeptName] = useState('');
  const [deptType, setDeptType] = useState<'JURUSAN' | 'NON_JURUSAN'>('JURUSAN');
  const [deptHodId, setDeptHodId] = useState('');
  const [isSavingDept, setIsSavingDept] = useState(false);

  // New User Form State
  const [showAddUser, setShowAddUser] = useState(false);
  const [userName, setUserName] = useState('');
  const [userUsername, setUserUsername] = useState('');
  const [userPin, setUserPin] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('REQUESTER');
  const [userDeptId, setUserDeptId] = useState('');
  const [userTitle, setUserTitle] = useState('');
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [addUserError, setAddUserError] = useState('');

  // Handle Add Department
  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptCode || !deptName) return;
    setIsSavingDept(true);
    try {
      await storageService.addDepartment({
        code: deptCode.trim().toUpperCase(),
        name: deptName.trim(),
        type: deptType,
        hod_user_id: deptHodId || null,
        is_active: true,
      });
      setDeptCode('');
      setDeptName('');
      setDeptHodId('');
      setShowAddDept(false);
    } catch (err: any) {
      alert(err.message || 'Gagal menambah departemen.');
    } finally {
      setIsSavingDept(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userUsername || !userPin || !userDeptId) return;
    setAddUserError('');
    setIsSavingUser(true);
    try {
      await storageService.addUser({
        username: userUsername.trim().toLowerCase(),
        name: userName.trim(),
        pin: userPin,
        role: userRole,
        department_id: userDeptId,
        title: userTitle.trim() || undefined,
      });
      setUserName('');
      setUserUsername('');
      setUserPin('');
      setUserTitle('');
      setUserDeptId('');
      setUserRole('REQUESTER');
      setShowAddUser(false);
    } catch (err: any) {
      setAddUserError(err.message || 'Gagal menambah pengguna.');
    } finally {
      setIsSavingUser(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Master Data & Konfigurasi Approver
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola daftar Jurusan/Unit, penetapan Koordinator HOD, dan data pengguna sistem
            </p>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('DEPARTMENTS')}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'DEPARTMENTS' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Unit & Jurusan ({departments.length})
          </button>
          <button
            onClick={() => setActiveSubTab('USERS')}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'USERS' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Pengguna & Role ({users.length})
          </button>
        </div>
      </div>

      {/* SUBTAB 1: DEPARTMENTS & APPROVER MAPPINGS */}
      {activeSubTab === 'DEPARTMENTS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Daftar Departemen & Koordinator Approver Terdaftar
            </h3>
            <button
              onClick={() => setShowAddDept(!showAddDept)}
              className="self-start sm:self-auto px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              Tambah Departemen
            </button>
          </div>

          {/* Add Form */}
          {showAddDept && (
            <form onSubmit={handleAddDept} className="bg-purple-50/60 p-4 rounded-2xl border border-purple-200 space-y-3">
              <h4 className="text-xs font-bold text-purple-950 uppercase">Form Tambah Departemen / Jurusan</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode:</label>
                  <input
                    type="text"
                    placeholder="e.g. RPL / BP"
                    value={deptCode}
                    onChange={(e) => setDeptCode(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Departemen:</label>
                  <input
                    type="text"
                    placeholder="e.g. Rekayasa Perangkat Lunak"
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori:</label>
                  <select
                    value={deptType}
                    onChange={(e) => setDeptType(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white focus:outline-hidden"
                  >
                    <option value="JURUSAN">JURUSAN (Approve oleh HOD)</option>
                    <option value="NON_JURUSAN">NON_JURUSAN (Approve oleh Wakasek)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Koordinator HOD (Jika Jurusan):</label>
                  <select
                    value={deptHodId}
                    onChange={(e) => setDeptHodId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white focus:outline-hidden"
                  >
                    <option value="">-- Belum Dipilih --</option>
                    {users.filter(u => u.role === 'HOD').map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDept(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingDept}
                  className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-purple-700 disabled:opacity-60"
                >
                  {isSavingDept ? 'Menyimpan...' : 'Simpan Departemen'}
                </button>
              </div>
            </form>
          )}

          {/* Departments Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Kode</th>
                  <th className="p-3.5">Nama Departemen</th>
                  <th className="p-3.5">Tipe Kategori</th>
                  <th className="p-3.5">Target Approver Otomatis</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departments.map(dept => {
                  const hodUser = users.find(u => u.id === dept.hod_user_id);
                  const wakasekUser = users.find(u => u.role === 'WAKASEK');

                  return (
                    <tr key={dept.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">{dept.code}</td>
                      <td className="p-3.5 font-semibold text-slate-800">{dept.name}</td>
                      <td className="p-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          dept.type === 'JURUSAN' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {dept.type}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {dept.type === 'JURUSAN' ? (
                          <div className="flex items-center gap-1 text-slate-800">
                            <span className="font-bold text-blue-700">Koordinator HOD:</span>{' '}
                            {hodUser?.name || <span className="text-amber-600 italic">Belum disetel</span>}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-slate-800">
                            <span className="font-bold text-purple-700">Wakasek:</span>{' '}
                            {wakasekUser?.name || <span className="text-amber-600 italic">Belum disetel</span>}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                          <Check className="w-3.5 h-3.5" /> Aktif
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: USERS & ROLES */}
      {activeSubTab === 'USERS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Daftar Pengguna Sistem
            </h3>
            <button
              onClick={() => setShowAddUser(!showAddUser)}
              className="self-start sm:self-auto px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              Tambah Pengguna
            </button>
          </div>

          {showAddUser && (
            <form onSubmit={handleAddUser} className="bg-purple-50/60 p-4 rounded-2xl border border-purple-200 space-y-3">
              <h4 className="text-xs font-bold text-purple-950 uppercase">Form Tambah Pengguna (Membuat Akun Login Baru)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap:</label>
                  <input
                    type="text"
                    placeholder="e.g. Bu Endah Kusuma, S.Pd"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username Login:</label>
                  <input
                    type="text"
                    placeholder="e.g. endah-tkj"
                    value={userUsername}
                    onChange={(e) => setUserUsername(e.target.value.replace(/[^a-z0-9._-]/gi, ''))}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PIN Awal (min. 4 digit):</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="1234"
                    value={userPin}
                    onChange={(e) => setUserPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white focus:outline-hidden"
                    minLength={4}
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role:</label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as UserRole)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white focus:outline-hidden"
                  >
                    {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Departemen / Unit:</label>
                  <select
                    value={userDeptId}
                    onChange={(e) => setUserDeptId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white focus:outline-hidden"
                    required
                  >
                    <option value="">-- Pilih Departemen --</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jabatan (Opsional):</label>
                  <input
                    type="text"
                    placeholder="e.g. Guru Produktif TKJ"
                    value={userTitle}
                    onChange={(e) => setUserTitle(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white focus:outline-hidden"
                  />
                </div>
              </div>
              {addUserError && <p className="text-xs text-rose-600 font-semibold">{addUserError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingUser}
                  className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-purple-700 disabled:opacity-60"
                >
                  {isSavingUser ? 'Menyimpan...' : 'Simpan Pengguna'}
                </button>
              </div>
            </form>
          )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">Nama Pengguna</th>
                <th className="p-3.5">Email Akun</th>
                <th className="p-3.5">Role Sistem</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Jabatan / Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => {
                const d = departments.find(item => item.id === u.department_id);
                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <img
                          src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}`}
                          alt={u.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <span className="font-bold text-slate-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-600">{u.email}</td>
                    <td className="p-3.5">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'REQUESTER' ? 'bg-emerald-100 text-emerald-800' :
                        u.role === 'HOD' ? 'bg-blue-100 text-blue-800' :
                        u.role === 'WAKASEK' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'ADMIN_KONSUMSI' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-800">{d?.name || '-'} ({d?.code || '-'})</td>
                    <td className="p-3.5 text-slate-500">{u.title || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
        </div>
      )}

    </div>
  );
};
