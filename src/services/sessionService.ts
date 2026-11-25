import {
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { getSprint2Collection, getSprint2Doc } from '@/services/firestorePaths';
import type { PracticumSession, SessionStatus } from '@/types';

export async function createSession(data: {
  classId: string;
  className: string;
  practicumName: string;
  assistantUid: string;
  assistantName?: string;
  date: string;
  startTime: string;
  endTime: string;
}): Promise<string> {
  if (!data.classId || !data.date || !data.startTime || !data.endTime) {
    throw new Error('Data sesi tidak lengkap (kelas, tanggal, waktu mulai, dan selesai wajib diisi).');
  }

  const sessionRef = doc(getSprint2Collection('sessions'));
  await setDoc(sessionRef, {
    classId: data.classId,
    className: data.className,
    practicumName: data.practicumName,
    assistantUid: data.assistantUid,
    assistantName: data.assistantName || 'Asisten',
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    status: 'scheduled' as SessionStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return sessionRef.id;
}

export async function updateSession(
  sessionId: string,
  data: Partial<Pick<PracticumSession, 'date' | 'startTime' | 'endTime' | 'className' | 'practicumName'>>
): Promise<void> {
  const sessionRef = getSprint2Doc('sessions', sessionId);
  await updateDoc(sessionRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteSession(sessionId: string): Promise<void> {
  // Safe delete: Check if attendance records exist
  const attendanceQuery = query(getSprint2Collection('attendance'), where('sessionId', '==', sessionId));
  const attendanceSnap = await getDocs(attendanceQuery);
  if (!attendanceSnap.empty) {
    throw new Error('Sesi tidak dapat dihapus karena sudah memiliki data presensi praktikan.');
  }

  // Safe delete: Check if leave requests exist
  const leaveQuery = query(getSprint2Collection('leaveRequests'), where('sessionId', '==', sessionId));
  const leaveSnap = await getDocs(leaveQuery);
  if (!leaveSnap.empty) {
    throw new Error('Sesi tidak dapat dihapus karena memiliki pengajuan izin praktikan.');
  }

  await deleteDoc(getSprint2Doc('sessions', sessionId));
}

export async function openSession(sessionId: string): Promise<void> {
  const sessionRef = getSprint2Doc('sessions', sessionId);
  await updateDoc(sessionRef, {
    status: 'open' as SessionStatus,
    updatedAt: serverTimestamp(),
  });
}

export async function closeSession(sessionId: string): Promise<void> {
  const sessionRef = getSprint2Doc('sessions', sessionId);
  await updateDoc(sessionRef, {
    status: 'closed' as SessionStatus,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeSessions(
  callback: (sessions: PracticumSession[]) => void,
  assistantUid?: string,
  onError?: (error: Error) => void
): Unsubscribe {
  const sessionsCol = getSprint2Collection('sessions');
  const q = assistantUid
    ? query(sessionsCol, where('assistantUid', '==', assistantUid))
    : sessionsCol;

  return onSnapshot(
    q,
    (snapshot) => {
      const list: PracticumSession[] = snapshot.docs.map((dSnap) => {
        const d = dSnap.data();
        return {
          id: dSnap.id,
          classId: d.classId || '',
          className: d.className || '',
          practicumName: d.practicumName || '',
          assistantUid: d.assistantUid || '',
          assistantName: d.assistantName,
          date: d.date || '',
          startTime: d.startTime || '',
          endTime: d.endTime || '',
          status: (d.status as SessionStatus) || 'scheduled',
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : (d.createdAt || ''),
          updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : (d.updatedAt || ''),
        };
      });
      // Sort by date and startTime descending or upcoming
      list.sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));
      callback(list);
    },
    (error) => {
      console.warn('subscribeSessions snapshot error:', error?.message);
      if (onError) onError(error);
    }
  );
}

export function subscribeSessionDetail(
  sessionId: string,
  callback: (session: PracticumSession | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const sessionRef = getSprint2Doc('sessions', sessionId);
  return onSnapshot(
    sessionRef,
    (docSnap) => {
      if (!docSnap.exists()) {
        callback(null);
        return;
      }
      const d = docSnap.data();
      callback({
        id: docSnap.id,
        classId: d.classId || '',
        className: d.className || '',
        practicumName: d.practicumName || '',
        assistantUid: d.assistantUid || '',
        assistantName: d.assistantName,
        date: d.date || '',
        startTime: d.startTime || '',
        endTime: d.endTime || '',
        status: (d.status as SessionStatus) || 'scheduled',
        createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : (d.createdAt || ''),
        updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : (d.updatedAt || ''),
      });
    },
    (error) => {
      console.warn('subscribeSessions snapshot error:', error?.message);
      if (onError) onError(error);
    }
  );
}
