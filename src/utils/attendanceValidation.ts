import type { AttendanceRecord, PracticalSession, UserRole } from '../types';

type AttendanceInput = {
  studentId: string;
  role: UserRole | 'Praktikan' | 'Asisten' | null;
  session: (PracticalSession & { status?: string }) | undefined;
  attendance: readonly (AttendanceRecord & { studentId?: string; studentUid?: string })[];
  leaveRequests?: readonly { sessionId: string; studentUid?: string; studentId?: string; status: string }[];
};

export type AttendanceValidationResult =
  | { valid: true }
  | {
      valid: false;
      code: 'identity' | 'role' | 'session' | 'duplicate' | 'unopened' | 'closed' | 'leave_conflict';
      message: string;
    };

// Shared by UI, services, and tests; always validates invariants consistently.
export function validateAttendance({
  studentId,
  role,
  session,
  attendance,
  leaveRequests,
}: AttendanceInput): AttendanceValidationResult {
  if (!studentId || !studentId.trim()) {
    return { valid: false, code: 'identity', message: 'Identitas Praktikan tidak valid. Silakan login kembali.' };
  }

  // Accepts 'praktikan' (Sprint 2) or 'Praktikan' (Sprint 1)
  const isStudentRole = role === 'praktikan' || role === 'Praktikan';
  if (!isStudentRole) {
    return { valid: false, code: 'role', message: 'Presensi hanya tersedia untuk Praktikan.' };
  }

  if (!session) {
    return { valid: false, code: 'session', message: 'Sesi praktikum tidak ditemukan.' };
  }

  // Check duplicate attendance
  const alreadyAttended = attendance.some(
    (record) =>
      record.sessionId === session.id &&
      (record.studentId === studentId.trim() || record.studentUid === studentId.trim())
  );
  if (alreadyAttended) {
    return { valid: false, code: 'duplicate', message: 'Kehadiranmu sudah tercatat untuk sesi ini.' };
  }

  // Check conflicting approved leave
  if (leaveRequests) {
    const hasApprovedLeave = leaveRequests.some(
      (leave) =>
        leave.sessionId === session.id &&
        (leave.studentId === studentId.trim() || leave.studentUid === studentId.trim()) &&
        leave.status === 'approved'
    );
    if (hasApprovedLeave) {
      return {
        valid: false,
        code: 'leave_conflict',
        message: 'Presensi ditolak karena Anda telah memiliki izin yang disetujui pada sesi ini.',
      };
    }
  }

  // Session status check: supports 'scheduled' | 'Belum Dibuka', 'open' | 'Berlangsung', 'closed' | 'Selesai'
  const status = session.status;
  if (status === 'Belum Dibuka' || status === 'scheduled') {
    return { valid: false, code: 'unopened', message: 'Tunggu asisten membuka sesi presensi.' };
  }
  if (status !== 'Berlangsung' && status !== 'open') {
    return { valid: false, code: 'closed', message: 'Sesi sudah ditutup. Hubungi asisten jika ada kendala presensi.' };
  }

  return { valid: true };
}

export function formatAttendanceTime(date: Date): string {
  return date.toLocaleTimeString('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).replaceAll('.', ':');
}
