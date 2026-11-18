export type UserRole = 'asisten' | 'praktikan' | 'Asisten' | 'Praktikan' | null;

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  role: 'asisten' | 'praktikan';
  nim?: string;
  createdAt: string;
  updatedAt: string;
};

export type PracticumClass = {
  id: string;
  name: string;
  practicumName: string;
  assistantUid: string;
  assistantName?: string;
  createdAt: string;
  updatedAt: string;
};

export type ClassEnrollment = {
  id: string;
  classId: string;
  studentUid: string;
  studentName: string;
  studentEmail: string;
  enrolledAt: string;
};

export type SessionStatus =
  | 'scheduled'
  | 'open'
  | 'closed'
  | 'Belum Dibuka'
  | 'Berlangsung'
  | 'Selesai';

// Helper to convert database status to Indonesian display label
export function getSessionStatusLabel(status: SessionStatus | string): 'Belum Dibuka' | 'Berlangsung' | 'Selesai' {
  if (status === 'open' || status === 'Berlangsung') return 'Berlangsung';
  if (status === 'closed' || status === 'Selesai') return 'Selesai';
  return 'Belum Dibuka';
}

export type PracticumSession = {
  id: string;
  classId: string;
  className: string;
  practicumName: string;
  assistantUid: string;
  assistantName?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
};

// Alias for UI components
export type PracticalSession = {
  id: string;
  practicalName: string;
  className: string;
  date: string;
  startTime: string;
  endTime: string;
  status: SessionStatus;
  classId?: string;
  assistantUid?: string;
};

export type AttendanceRecord = {
  id: string;
  sessionId: string;
  studentUid?: string;
  studentName: string;
  studentEmail?: string;
  studentId: string;
  attendanceTime: string;
  timestamp?: string;
};

export type LeaveStatus = 'pending' | 'approved' | 'rejected';
export type AIStatus = 'pending' | 'success' | 'failed' | 'not_available';

export type LeaveRequest = {
  id: string;
  sessionId: string;
  classId: string;
  practicumName: string;
  className: string;
  studentUid: string;
  studentName: string;
  studentEmail: string;
  sessionDate: string;
  reason: string;
  status: LeaveStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  aiCategory?: string;
  aiConfidence?: number;
  aiExplanation?: string;
  aiStatus: AIStatus;
};

export type SessionRecap = {
  sessionId: string;
  totalEnrolled: number;
  presentCount: number;
  leaveCount: number;
  absentCount: number;
};
