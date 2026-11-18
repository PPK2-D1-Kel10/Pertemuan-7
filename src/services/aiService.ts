import type { AIStatus } from '@/types';

export type AIClassificationResult = {
  category: string;
  confidence: number;
  explanation: string;
  status: AIStatus;
};

// Fallback rule-based heuristic when external API endpoint is not set or network fails
function classifyReasonLocally(reason: string): { category: string; confidence: number; explanation: string } {
  const lower = reason.toLowerCase();
  if (lower.match(/sakit|demam|flu|batuk|puskesmas|rumah sakit|dokter|opname|tenggorokan|mual|muntah/)) {
    return {
      category: 'Sakit',
      confidence: 0.92,
      explanation: 'Alasan terindikasi masalah kesehatan / kondisi medis.',
    };
  }
  if (lower.match(/lomba|seminar|konferensi|workshop|kuliah|tugas|ujian|magang|studi|akademik|sidang/)) {
    return {
      category: 'Kegiatan Akademik / Lomba',
      confidence: 0.88,
      explanation: 'Alasan terkait penugasan atau kegiatan akademik resmi.',
    };
  }
  if (lower.match(/keluarga|dika|duka|meninggal|orang tua|saudara|pernikahan|hajatan/)) {
    return {
      category: 'Urusan Keluarga',
      confidence: 0.86,
      explanation: 'Alasan terkait keperluan keluarga penting / darurat.',
    };
  }
  if (lower.match(/banjir|bencana|kecelakaan|macet parah|kendaraan mogok|ban bocor/)) {
    return {
      category: 'Kondisi Darurat / Insidental',
      confidence: 0.84,
      explanation: 'Alasan terkait keadaan darurat di luar kendali praktikan.',
    };
  }
  return {
    category: 'Lain-lain',
    confidence: 0.65,
    explanation: 'Alasan memerlukan tinjauan manual lebih lanjut oleh asisten.',
  };
}

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

  const apiUrl = process.env.EXPO_PUBLIC_AI_API_URL;
  const apiKey = process.env.EXPO_PUBLIC_AI_API_KEY;

  // If no external API configured by teacher, use resilient local fallback
  if (!apiUrl) {
    const localResult = classifyReasonLocally(cleanReason);
    return {
      ...localResult,
      status: 'not_available',
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
      headers['x-api-key'] = apiKey;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ reason: cleanReason }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`AI API responded with status ${response.status}`);
    }

    const data = await response.json();
    return {
      category: data.category || data.label || 'Lain-lain',
      confidence: typeof data.confidence === 'number' ? data.confidence : 0.85,
      explanation: data.explanation || data.summary || 'Dianalisis oleh AI Pengajar.',
      status: 'success',
    };
  } catch (err: any) {
    console.warn('AI API call encountered an issue, falling back safely:', err.message);
    const localFallback = classifyReasonLocally(cleanReason);
    return {
      ...localFallback,
      status: 'failed',
      explanation: 'Analisis AI eksternal gagal. Menggunakan estimasi lokal sebagai pendukung.',
    };
  }
}
