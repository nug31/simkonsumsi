import React, { useState } from 'react';
import { 
  User, 
  Department, 
  ActivityType, 
  ConsumptionType, 
  ConsumptionRequest 
} from '../types';
import { storageService } from '../services/storage';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Users, 
  Utensils, 
  FileText, 
  Send, 
  Sparkles, 
  Info, 
  AlertCircle,
  MessageSquare,
  Building2,
  Check,
  FileCheck
} from 'lucide-react';

interface Props {
  currentUser: User;
  departments: Department[];
  users: User[];
  onSuccess: (newRequest: ConsumptionRequest) => void;
  onCancel: () => void;
  editRequest?: ConsumptionRequest; // If editing draft or revision
}

export const CreateRequestView: React.FC<Props> = ({
  currentUser,
  departments,
  users,
  onSuccess,
  onCancel,
  editRequest,
}) => {
  const currentDept = departments.find(d => d.id === currentUser.department_id);
  const approverInfo = storageService.getApproverForUser(currentUser);

  // Step state (1: Info Kegiatan, 2: Detail Tamu & Konsumsi, 3: Review, 4: Selesai)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states
  const [activityType, setActivityType] = useState<ActivityType>(
    editRequest?.activity_type || 'Guru Tamu'
  );
  const [activityName, setActivityName] = useState(
    editRequest?.activity_name || ''
  );
  const [guestName, setGuestName] = useState(
    editRequest?.guest_name || ''
  );
  const [consumptionDate, setConsumptionDate] = useState(
    editRequest?.consumption_date || new Date().toISOString().split('T')[0]
  );
  const [consumptionTime, setConsumptionTime] = useState(
    editRequest?.consumption_time || '10:00'
  );
  const [guestCount, setGuestCount] = useState<number>(
    editRequest?.guest_count || 2
  );
  const [consumptionType, setConsumptionType] = useState<ConsumptionType>(
    editRequest?.consumption_type || 'Snack + Makan'
  );
  const [consumptionDetail, setConsumptionDetail] = useState(
    editRequest?.consumption_detail || 'Snack box (kue basah & lemper), Air mineral botol 330ml, Nasi box'
  );
  const [quantity, setQuantity] = useState<number>(
    editRequest?.quantity || 2
  );
  const [estimatedBudget, setEstimatedBudget] = useState<string>(
    editRequest?.estimated_budget ? String(editRequest.estimated_budget) : ''
  );
  const [notes, setNotes] = useState(
    editRequest?.notes || 'Support konsumsi untuk trainer tamu industri'
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<ConsumptionRequest | null>(null);

  // Presets for quick autofill
  const handleApplyPreset = (presetName: string) => {
    if (presetName === 'jotun') {
      setActivityType('Pendalaman Materi');
      setActivityName('Pendalaman Materi Seleksi Magang Industri PT Jotun Indonesia');
      setGuestName('Trainer Technical Support PT Jotun (Bpk. Hendra & Bpk. Arif)');
      setGuestCount(2);
      setQuantity(2);
      setConsumptionType('Snack + Minuman' as any);
      setConsumptionDetail('Snack box kue basah premium + air mineral botol + kopi/teh');
      setNotes('Support snack dan konsumsi untuk trainer.');
    } else if (presetName === 'kurikulum') {
      setActivityType('Workshop');
      setActivityName('Workshop Penyusunan KOSP & Modul Ajar Vokasi Berbasis Industri');
      setGuestName('Dr. H. Sudirman, M.Pd (Pengawas Pembina Cabang Dinas)');
      setGuestCount(5);
      setQuantity(5);
      setConsumptionType('Snack + Makan');
      setConsumptionDetail('Snack pagi tradisional & Nasi box lauk ayam bakar madu');
      setNotes('Rapat pleno penyelarasan kurikulum.');
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!activityName.trim()) newErrors.activityName = 'Nama kegiatan wajib diisi';
    if (!guestName.trim()) newErrors.guestName = 'Nama guru tamu / narasumber wajib diisi';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!consumptionDate) newErrors.consumptionDate = 'Tanggal konsumsi wajib dipilih';
    if (!consumptionTime) newErrors.consumptionTime = 'Jam konsumsi wajib diisi';
    if (guestCount <= 0) newErrors.guestCount = 'Jumlah orang minimal 1';
    if (quantity <= 0) newErrors.quantity = 'Jumlah paket minimal 1';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2);
    } else if (currentStep === 2) {
      if (validateStep2()) setCurrentStep(3);
    }
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    setIsSubmitting(true);

    try {
      let req: ConsumptionRequest;

      if (editRequest) {
        req = await storageService.updateRequest(
          editRequest.id,
          {
            activity_type: activityType,
            activity_name: activityName,
            guest_name: guestName,
            consumption_date: consumptionDate,
            consumption_time: consumptionTime,
            guest_count: Number(guestCount),
            consumption_type: consumptionType,
            consumption_detail: consumptionDetail,
            quantity: Number(quantity),
            estimated_budget: estimatedBudget ? Number(estimatedBudget) : undefined,
            notes: notes,
          },
          !isDraft
        );
      } else {
        req = await storageService.createRequest({
          activity_type: activityType,
          activity_name: activityName,
          guest_name: guestName,
          consumption_date: consumptionDate,
          consumption_time: consumptionTime,
          guest_count: Number(guestCount),
          consumption_type: consumptionType,
          consumption_detail: consumptionDetail,
          quantity: Number(quantity),
          estimated_budget: estimatedBudget ? Number(estimatedBudget) : undefined,
          notes: notes,
          isDraft: isDraft,
        });
      }

      setSubmittedRequest(req);
      setCurrentStep(4);

      // Trigger Confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore if not supported
      }

    } catch (err: any) {
      alert('Terjadi kesalahan: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Utensils className="w-6 h-6 text-blue-600" />
            {editRequest ? 'Perbarui Pengajuan Konsumsi' : 'Form Pengajuan Konsumsi Baru'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sistem Digital Permintaan Konsumsi Guru Tamu & Kegiatan Sekolah
          </p>
        </div>

        {/* Demo Quick Autofill Buttons */}
        {!editRequest && currentStep === 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Contoh Cepat:</span>
            <button
              type="button"
              onClick={() => handleApplyPreset('jotun')}
              className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg border border-blue-200 font-semibold transition-colors"
            >
              + Contoh TKR (Jotun)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('kurikulum')}
              className="text-xs px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg border border-purple-200 font-semibold transition-colors"
            >
              + Contoh Kurikulum
            </button>
          </div>
        )}
      </div>

      {/* Step Indicators (UX Requirement 17) */}
      <div className="grid grid-cols-4 gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className={`p-2.5 rounded-xl text-center transition-all ${
          currentStep === 1 ? 'bg-blue-600 text-white font-bold' : currentStep > 1 ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-400'
        }`}>
          <div className="flex items-center justify-center gap-1.5 text-xs">
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-black/10 font-bold">1</span>
            <span className="hidden sm:inline">Info Kegiatan</span>
          </div>
        </div>

        <div className={`p-2.5 rounded-xl text-center transition-all ${
          currentStep === 2 ? 'bg-blue-600 text-white font-bold' : currentStep > 2 ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-400'
        }`}>
          <div className="flex items-center justify-center gap-1.5 text-xs">
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-black/10 font-bold">2</span>
            <span className="hidden sm:inline">Tamu & Konsumsi</span>
          </div>
        </div>

        <div className={`p-2.5 rounded-xl text-center transition-all ${
          currentStep === 3 ? 'bg-blue-600 text-white font-bold' : currentStep > 3 ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-400'
        }`}>
          <div className="flex items-center justify-center gap-1.5 text-xs">
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-black/10 font-bold">3</span>
            <span className="hidden sm:inline">Review & Jalur</span>
          </div>
        </div>

        <div className={`p-2.5 rounded-xl text-center transition-all ${
          currentStep === 4 ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400'
        }`}>
          <div className="flex items-center justify-center gap-1.5 text-xs">
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-black/10 font-bold">4</span>
            <span className="hidden sm:inline">Selesai</span>
          </div>
        </div>
      </div>

      {/* STEP 1: Informasi Kegiatan */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">
              Langkah 1: Identitas Pemohon & Kegiatan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Data pemohon dan departemen terisi otomatis dari akun Anda saat ini.
            </p>
          </div>

          {/* Locked profile & department cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                1. Nama Pemohon (Otomatis Akun Login)
              </label>
              <div className="mt-1 flex items-center gap-2">
                <img
                  src={currentUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}`}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover"
                />
                <span className="text-sm font-bold text-slate-800">{currentUser.name}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                2. Department / Unit (Otomatis Profil)
              </label>
              <div className="mt-1 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold text-slate-800">
                  {currentDept?.name} ({currentDept?.code})
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  currentDept?.type === 'JURUSAN' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                }`}>
                  {currentDept?.type}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Jenis Kegiatan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                3. Jenis Kegiatan <span className="text-rose-500">*</span>
              </label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value as ActivityType)}
                className="w-full text-sm p-3 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Guru Tamu">Guru Tamu</option>
                <option value="Trainer">Trainer Industri</option>
                <option value="Instruktur">Instruktur</option>
                <option value="Narasumber">Narasumber</option>
                <option value="Pendalaman Materi">Pendalaman Materi</option>
                <option value="Meeting">Meeting / Rapat Dinas</option>
                <option value="Workshop">Workshop</option>
                <option value="Pelatihan">Pelatihan</option>
                <option value="Kegiatan Sekolah">Kegiatan Sekolah</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            {/* Nama Kegiatan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                4. Nama Kegiatan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                placeholder="Contoh: Pendalaman Materi Seleksi Magang Industri PT Jotun Indonesia"
                className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.activityName && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{errors.activityName}</p>
              )}
            </div>

            {/* Nama Tamu / Narasumber */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                5. Nama Guru Tamu / Trainer / Narasumber / Penerima <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Contoh: Bpk. Hendra & Bpk. Arif (Technical Trainer PT Jotun)"
                className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.guestName && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{errors.guestName}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
            >
              Lanjut ke Langkah 2
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Detail Tamu & Konsumsi */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">
              Langkah 2: Jadwal, Jumlah & Rincian Konsumsi
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rincikan kebutuhan konsumsi secara lengkap agar dapur dapat menyiapkan tepat waktu.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tanggal Konsumsi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                6. Tanggal Konsumsi <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={consumptionDate}
                  onChange={(e) => setConsumptionDate(e.target.value)}
                  className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {errors.consumptionDate && (
                <p className="text-xs text-rose-600 mt-1">{errors.consumptionDate}</p>
              )}
            </div>

            {/* Jam Konsumsi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                7. Jam Konsumsi Disajikan <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                value={consumptionTime}
                onChange={(e) => setConsumptionTime(e.target.value)}
                className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              {errors.consumptionTime && (
                <p className="text-xs text-rose-600 mt-1">{errors.consumptionTime}</p>
              )}
            </div>

            {/* Jumlah Orang */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                8. Jumlah Orang (Tamu/Peserta) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={guestCount}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setGuestCount(val);
                  setQuantity(val); // Sync default quantity
                }}
                className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              {errors.guestCount && (
                <p className="text-xs text-rose-600 mt-1">{errors.guestCount}</p>
              )}
            </div>

            {/* Jenis Konsumsi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                9. Jenis Konsumsi <span className="text-rose-500">*</span>
              </label>
              <select
                value={consumptionType}
                onChange={(e) => setConsumptionType(e.target.value as ConsumptionType)}
                className="w-full text-sm p-3 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="Snack">Snack</option>
                <option value="Makan">Makan (Nasi Box / Prasmanan)</option>
                <option value="Snack + Makan">Snack + Makan</option>
                <option value="Minuman">Minuman (Kopi/Teh/Air Mineral)</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          {/* Detail Konsumsi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              10. Detail Konsumsi (Rincian Menu) <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>
            <textarea
              rows={3}
              value={consumptionDetail}
              onChange={(e) => setConsumptionDetail(e.target.value)}
              placeholder="Contoh: Snack box (lemper, kue lapis, risoles), air mineral botol 330ml, nasi box lauk ayam bakar..."
              className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            {errors.consumptionDetail && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{errors.consumptionDetail}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Jumlah Paket */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                11. Jumlah Paket Konsumsi <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              {errors.quantity && (
                <p className="text-xs text-rose-600 mt-1">{errors.quantity}</p>
              )}
            </div>

            {/* Estimasi Budget */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                13. Estimasi Budget (Opsional, Rp)
              </label>
              <input
                type="number"
                value={estimatedBudget}
                onChange={(e) => setEstimatedBudget(e.target.value)}
                placeholder="Contoh: 70000"
                className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Catatan / Keterangan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              12. Catatan / Keterangan Khusus
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Mohon disajikan di Ruang Bengkel Otomotif sebelum sesi pukul 10:00..."
              className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
            >
              Lanjut ke Review & Routing
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Review & Routing Verification (Requirement 17) */}
      {currentStep === 3 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">
              Langkah 3: Tinjauan Data & Konfirmasi Jalur Approval
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pastikan seluruh rincian telah benar sebelum dikirimkan ke approver otomatis.
            </p>
          </div>

          {/* CRITICAL UX REQUIREMENT 17: Notification Routing Destination */}
          <div className="p-5 rounded-2xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-900 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                  Target Approval Otomatis Sistem
                </span>
                <h4 className="text-base font-extrabold text-blue-950">
                  Pengajuan ini akan dikirim kepada:{' '}
                  <span className="underline decoration-blue-500">
                    {approverInfo.approvalType === 'HOD'
                      ? `Koordinator HOD ${currentDept?.code || ''} (${approverInfo.approverUser?.name || 'HOD'})`
                      : `Wakasek (${approverInfo.approverUser?.name || 'Drs. H. Mulyadi, M.M.'})`}
                  </span>
                </h4>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Berdasarkan departemen Anda (<strong>{currentDept?.name}</strong>), sistem menentukan approver secara otomatis tanpa pemilihan manual.
                </p>
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
            <div className="p-3.5 bg-slate-50 font-bold text-slate-900 uppercase tracking-wider">
              Ringkasan Data Pengajuan
            </div>
            
            <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-slate-500 block">Nama Pemohon:</span>
                <span className="font-bold text-slate-800">{currentUser.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Jurusan / Unit:</span>
                <span className="font-bold text-slate-800">{currentDept?.name} ({currentDept?.code})</span>
              </div>
            </div>

            <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-slate-500 block">Kegiatan:</span>
                <span className="font-semibold text-slate-800">{activityName}</span>
                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                  {activityType}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Guru Tamu / Narasumber:</span>
                <span className="font-bold text-blue-800">{guestName}</span>
              </div>
            </div>

            <div className="p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/50">
              <div>
                <span className="text-slate-500 block">Tanggal:</span>
                <span className="font-semibold text-slate-800">{consumptionDate}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Jam:</span>
                <span className="font-semibold text-slate-800">{consumptionTime} WIB</span>
              </div>
              <div>
                <span className="text-slate-500 block">Jumlah Orang:</span>
                <span className="font-semibold text-slate-800">{guestCount} Orang</span>
              </div>
              <div>
                <span className="text-slate-500 block">Jumlah Paket:</span>
                <span className="font-extrabold text-blue-700">{quantity} Paket</span>
              </div>
            </div>

            <div className="p-3.5 space-y-1.5">
              <span className="text-slate-500 block">Detail Menu Konsumsi ({consumptionType}):</span>
              <p className="font-medium text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200">
                {consumptionDetail}
              </p>
              {notes && (
                <p className="text-slate-600 italic">
                  Catatan: {notes}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons: Kembali & Submit (Requirement 17) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit(true)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Simpan Sebagai Draft
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit(false)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-colors"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Mengirimkan...' : 'Submit Pengajuan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Success Screen */}
      {currentStep === 4 && submittedRequest && (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20 animate-in zoom-in-50 duration-300">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-slate-900">
              Pengajuan Konsumsi Berhasil Dikirim! 🎉
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Pengajuan Anda telah tercatat dan secara otomatis diteruskan ke antrean approval pimpinan terkait.
            </p>
          </div>

          <div className="inline-block bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <span className="text-[11px] text-slate-500 uppercase font-semibold block">
              Nomor Pengajuan Resmi
            </span>
            <span className="font-mono text-xl font-extrabold text-blue-700 tracking-wider">
              {submittedRequest.request_number}
            </span>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl max-w-lg mx-auto text-left text-xs text-blue-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-blue-950">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Jalur Approval Aktif:
            </p>
            <p>
              {currentUser.name} ({currentDept?.code}) →{' '}
              <strong className="underline">
                {submittedRequest.target_approval_type === 'HOD' ? 'Koordinator HOD Jurusan' : 'Wakasek'}
              </strong>{' '}
              → Admin Dapur Konsumsi
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => onSuccess(submittedRequest)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              Lihat Status Pengajuan
            </button>
            <button
              type="button"
              onClick={() => {
                // Reset form for next submission
                setCurrentStep(1);
                setActivityName('');
                setGuestName('');
                setConsumptionDetail('');
              }}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              Buat Pengajuan Lainnya
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
