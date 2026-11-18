import type { AIStatus } from '@/types';

export type AIClassificationResult = {
  category: string;
  confidence: number;
  explanation: string;
  status: AIStatus;
};

// Heuristik lokal hanya digunakan untuk keperluan demonstrasi lokal
// dengan label eksplisit [SIMULASI LOKAL], TIDAK PERNAH diklaim sebagai API AI Pengajar.
function classifyReasonLocally(reason: string): { category: string; confidence: number; explanation: string } {
  const lower = reason.toLowerCase();
  let baseCategory = 'Lain-lain';
  let confidence = 0.70;
  let detail = 'Alasan memerlukan peninjauan manual langsung oleh asisten praktikum.';

  if (lower.match(/sakit|demam|flu|batuk|puskesmas|rumah sakit|dokter|opname|tenggorokan|mual|muntah/)) {
    baseCategory = 'Sakit';
    confidence = 0.90;
    detail = 'Terdeteksi indikasi masalah kesehatan atau kondisi medis.';
  } else if (lower.match(/lomba|seminar|konferensi|workshop|kuliah|tugas|ujian|magang|studi|akademik|sidang/)) {
    baseCategory = 'Kegiatan Akademik / Lomba';
    confidence = 0.85;
    detail = 'Terdeteksi indikasi penugasan akademik atau kompetisi kemahasiswaan.';
  } else if (lower.match(/keluarga|dika|duka|meninggal|orang tua|saudara|pernikahan|hajatan/)) {
    baseCategory = 'Urusan Keluarga';
    confidence = 0.85;
    detail = 'Terdeteksi indikasi keperluan keluarga mendesak.';
  } else if (lower.match(/banjir|bencana|kecelakaan|macet parah|kendaraan mogok|ban bocor/)) {
    baseCategory = 'Kondisi Darurat';
    confidence = 0.80;
    detail = 'Terdeteksi indikasi keadaan darurat insidental di luar kendali.';
  }

  return {
    category: `[SIMULASI LOKAL] ${baseCategory}`,
    confidence,
    explanation: `${detail} (Perhatian: Klasifikasi perkiraan lokal, API AI Pengajar belum terhubung).`,
  };
}

/**
 * Klasifikasi alasan izin praktikan.
 * 
 * Keamanan:
 * - Tidak menggunakan API key rahasia di sisi klien (tidak ada EXPO_PUBLIC_AI_API_KEY).
 * - Menghubungi endpoint backend tepercaya jika EXPO_PUBLIC_AI_API_URL dikonfigurasi.
 * - Jika backend belum tersedia, mengembalikan status 'unavailable' dengan label [SIMULASI LOKAL].
 * - Kegagalan AI tidak pernah membatalkan pengajuan izin praktikan.
 * - Keputusan izin mutlak ditentukan oleh asisten secara manual.
 */
export async function classifyLeaveReason(reason: string): Promise<AIClassificationResult> {
  const cleanReason = reason.trim();
  if (!cleanReason) {
    return {
      category: 'Tidak Diketahui',
      confidence: 0,
      explanation: 'Alasan kosong.',
      status: 'failed',
    };
  }

  const backendApiUrl = process.env.EXPO_PUBLIC_AI_API_URL;

  // Jika URL API Pengajar / backend tepercaya belum dikonfigurasi
  if (!backendApiUrl) {
    const localResult = classifyReasonLocally(cleanReason);
    return {
      ...localResult,
      status: 'unavailable',
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(backendApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason: cleanReason }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Backend AI proxy merespons dengan status HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      category: data.category || data.label || 'Lain-lain',
      confidence: typeof data.confidence === 'number' ? data.confidence : 0.85,
      explanation: data.explanation || data.summary || 'Dianalisis oleh API AI Pengajar terverifikasi.',
      status: 'success',
    };
  } catch (err: any) {
    console.warn('Komunikasi AI gagal, mengaktifkan fail-safe lokal:', err.message);
    const localFallback = classifyReasonLocally(cleanReason);
    return {
      ...localFallback,
      status: 'failed',
      explanation: 'Komunikasi ke layanan AI gagal. Asisten praktikum dipersilakan melakukan verifikasi manual.',
    };
  }
}
