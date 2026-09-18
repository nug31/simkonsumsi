import { ConsumptionRequest, User, Department } from '../types';

// Link deep-link ke pengajuan terkait di web/app SIMKONSUMSI. Memakai
// origin saat ini (localhost saat dev, domain Netlify setelah deploy)
// supaya tidak perlu di-hardcode. App.tsx membaca query param `req` ini
// untuk otomatis membuka detail pengajuan begitu approver login.
function getRequestDeepLink(requestId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/?req=${requestId}`;
}

export function formatWhatsAppMessage(params: {
  type: 'NEW_SUBMISSION' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUIRED' | 'READY' | 'COMPLETED';
  request: ConsumptionRequest;
  requester: User;
  department: Department;
  approver?: User;
  notes?: string;
}): { text: string; waUrl: string } {
  const { type, request, requester, department, approver, notes } = params;
  const link = getRequestDeepLink(request.id);
  let text = '';

  const dateFormatted = new Date(request.consumption_date).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  switch (type) {
    case 'NEW_SUBMISSION':
      text = 
`🔔 *PENGAJUAN KONSUMSI BARU - SIMKONSUMSI*
--------------------------------------------
No. Pengajuan: *${request.request_number}*
Pemohon: *${requester.name}*
Unit/Jurusan: *${department.name} (${department.code})*

📌 *Detail Kegiatan:*
• Kegiatan: ${request.activity_name} (${request.activity_type})
• Tamu/Narasumber: *${request.guest_name}*
• Tanggal: *${dateFormatted}*
• Jam Saji: *${request.consumption_time} WIB*

🍱 *Kebutuhan Konsumsi:*
• Jenis: *${request.consumption_type}* (${request.quantity} paket)
• Detail: ${request.consumption_detail}
• Catatan: ${request.notes || '-'}

Mohon Bapak/Ibu Approver dapat meninjau dan memberikan persetujuan pada sistem SIMKONSUMSI.

🔗 Buka & Setujui di Portal SIMKONSUMSI:
${link}

Terima kasih.`;
      break;

    case 'APPROVED':
      text = 
`✅ *PENGAJUAN KONSUMSI DISETUJUI*
--------------------------------------------
No. Pengajuan: *${request.request_number}*
Kegiatan: *${request.activity_name}*
Tamu: *${request.guest_name}*
Tanggal Konsumsi: *${dateFormatted} | ${request.consumption_time} WIB*
Approver: *${approver?.name || 'Pimpinan'}*
Catatan Approver: "${notes || 'Disetujui'}"

Status saat ini telah diteruskan ke Bagian Dapur & Konsumsi untuk diproses dan disiapkan.

🔗 Lihat detail di Portal SIMKONSUMSI:
${link}`;
      break;

    case 'REVISION_REQUIRED':
      text = 
`⚠️ *PERMINTAAN REVISI KONSUMSI*
--------------------------------------------
No. Pengajuan: *${request.request_number}*
Pemohon: *${requester.name}*
Kegiatan: *${request.activity_name}*

Mohon perbaiki data pengajuan sesuai arahan Approver (${approver?.name || 'Pimpinan'}):
📝 *Catatan Revisi:*
"${notes || 'Mohon lengkapi rincian menu dan jumlah paket.'}"

Silakan buka kembali portal SIMKONSUMSI untuk mengedit dan mengirim ulang pengajuan.

🔗 Buka & Edit di Portal SIMKONSUMSI:
${link}`;
      break;

    case 'REJECTED':
      text = 
`❌ *PENGAJUAN KONSUMSI DITOLAK*
--------------------------------------------
No. Pengajuan: *${request.request_number}*
Kegiatan: *${request.activity_name}*
Approver: *${approver?.name || 'Pimpinan'}*

Mohon maaf, pengajuan konsumsi belum dapat disetujui dengan alasan:
❗ *Alasan Penolakan:*
"${notes || 'Tidak memenuhi kriteria penganggaran sekolah.'}"

🔗 Lihat detail di Portal SIMKONSUMSI:
${link}`;
      break;

    case 'READY':
      text = 
`🍽️ *KONSUMSI SUDAH SIAP DISAJIKAN!*
--------------------------------------------
No. Pengajuan: *${request.request_number}*
Pemohon: *${requester.name}*
Kegiatan: *${request.activity_name}*
Tamu: *${request.guest_name}*
Jumlah: *${request.quantity} paket (${request.consumption_type})*

Paket konsumsi sudah selesai disiapkan oleh Dapur Konsumsi.
Silakan diambil di Ruang Pantry Konsumsi atau dikoordinasikan dengan petugas.

🔗 Lihat detail di Portal SIMKONSUMSI:
${link}

Terima kasih!`;
      break;

    case 'COMPLETED':
      text = 
`🎉 *PELAYANAN KONSUMSI SELESAI*
--------------------------------------------
No. Pengajuan: *${request.request_number}*
Kegiatan: *${request.activity_name}* telah selesai dan tercatat dalam sistem audit SIMKONSUMSI.

🔗 Lihat detail di Portal SIMKONSUMSI:
${link}`;
      break;
  }

  const encodedText = encodeURIComponent(text);
  const waUrl = `https://wa.me/?text=${encodedText}`;

  return { text, waUrl };
}
