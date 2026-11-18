import {
  collection,
  doc,
  runTransaction,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { AttendanceRecord, SessionRecap } from '@/types';
import { formatAttendanceTime } from '@/utils/attendanceValidation';

export async function recordAttendance(params: {
  sessionId: string;
  studentUid: string;
  studentName: string;
  studentEmail: string;
  studentNim?: string;
}): Promise<AttendanceRecord> {
  const { sessionId, studentUid, studentName, studentEmail, studentNim } = params;

  if (!sessionId || !studentUid) {
    throw new Error('Identitas sesi atau praktikan tidak valid.');
  }

  const attendanceDocId = `${sessionId}_${studentUid}`;
  const attendanceRef = doc(db, 'attendance', attendanceDocId);
  const sessionRef = doc(db, 'sessions', sessionId);
  const leaveRef = doc(db, 'leaveRequests', attendanceDocId);

  // Atomic transaction to ensure anti-duplicate, session status check, and conflict prevention
  const resultTime = await runTransaction(db, async (transaction) => {
    // 1. Check session state
    const sessionSnap = await transaction.get(sessionRef);
    if (!sessionSnap.exists()) {
      throw new Error('Sesi praktikum tidak ditemukan.');
    }
    const sessionData = sessionSnap.data();
    if (sessionData.status !== 'open') {
      if (sessionData.status === 'closed') {
        throw new Error('Presensi gagal: Sesi praktikum sudah ditutup.');
      }
      throw new Error('Presensi gagal: Sesi praktikum belum dibuka oleh asisten.');
    }

    // 2. Check if attendance already recorded (anti-duplicate)
    const attendanceSnap = await transaction.get(attendanceRef);
    if (attendanceSnap.exists()) {
      throw new Error('Anda sudah melakukan presensi pada sesi ini.');
    }

    // 3. Check if approved leave request exists for this session (conflict prevention)
    const leaveSnap = await transaction.get(leaveRef);
    if (leaveSnap.exists()) {
      const leaveData = leaveSnap.data();
      if (leaveData.status === 'approved') {
        throw new Error('Presensi ditolak karena Anda telah memiliki izin yang disetujui pada sesi ini.');
      }
    }

    // Format current Jakarta WIB time
    const now = new Date();
    const timeFormatted = `${formatAttendanceTime(now)} WIB`;

    // 4. Record attendance
    transaction.set(attendanceRef, {
      sessionId,
      studentUid,
      studentName: studentName.trim(),
      studentEmail: studentEmail.trim().toLowerCase(),
      studentId: studentNim || studentEmail.split('@')[0],
      attendanceTime: timeFormatted,
      status: 'hadir',
      timestamp: serverTimestamp(),
    });

    return timeFormatted;
  });

  return {
    id: attendanceDocId,
    sessionId,
    studentUid,
    studentName,
    studentEmail,
    studentId: studentNim || studentEmail.split('@')[0],
    attendanceTime: resultTime,
    timestamp: new Date().toISOString(),
  };
}

export function subscribeSessionAttendance(
  sessionId: string,
  callback: (records: AttendanceRecord[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'attendance'), where('sessionId', '==', sessionId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: AttendanceRecord[] = snapshot.docs.map((dSnap) => {
        const d = dSnap.data();
        return {
          id: dSnap.id,
          sessionId: d.sessionId || '',
          studentUid: d.studentUid || '',
          studentName: d.studentName || '',
          studentEmail: d.studentEmail || '',
          studentId: d.studentId,
          attendanceTime: d.attendanceTime || '',
          timestamp: d.timestamp?.toDate ? d.timestamp.toDate().toISOString() : (d.timestamp || ''),
        };
      });
      callback(list);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}

export function subscribeStudentAttendance(
  studentUid: string,
  callback: (records: AttendanceRecord[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'attendance'), where('studentUid', '==', studentUid));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: AttendanceRecord[] = snapshot.docs.map((dSnap) => {
        const d = dSnap.data();
        return {
          id: dSnap.id,
          sessionId: d.sessionId || '',
          studentUid: d.studentUid || '',
          studentName: d.studentName || '',
          studentEmail: d.studentEmail || '',
          studentId: d.studentId,
          attendanceTime: d.attendanceTime || '',
          timestamp: d.timestamp?.toDate ? d.timestamp.toDate().toISOString() : (d.timestamp || ''),
        };
      });
      callback(list);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}

export function computeSessionRecap(
  totalEnrolled: number,
  presentCount: number,
  approvedLeaveCount: number
): SessionRecap {
  const absentCount = Math.max(0, totalEnrolled - presentCount - approvedLeaveCount);
  return {
    sessionId: '',
    totalEnrolled,
    presentCount,
    leaveCount: approvedLeaveCount,
    absentCount,
  };
}
