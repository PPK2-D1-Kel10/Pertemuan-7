import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { LeaveRequest, LeaveStatus } from '@/types';
import { classifyLeaveReason } from '@/services/aiService';

export async function submitLeaveRequest(params: {
  sessionId: string;
  classId: string;
  practicumName: string;
  className: string;
  sessionDate: string;
  studentUid: string;
  studentName: string;
  studentEmail: string;
  reason: string;
}): Promise<LeaveRequest> {
  const {
    sessionId,
    classId,
    practicumName,
    className,
    sessionDate,
    studentUid,
    studentName,
    studentEmail,
    reason,
  } = params;

  if (!reason.trim()) {
    throw new Error('Alasan izin wajib diisi.');
  }

  const leaveDocId = `${sessionId}_${studentUid}`;
  const leaveRef = doc(db, 'leaveRequests', leaveDocId);
  const attendanceRef = doc(db, 'attendance', leaveDocId);

  // 1. Conflict prevention: Check if attendance already exists
  const attendanceSnap = await getDoc(attendanceRef);
  if (attendanceSnap.exists()) {
    throw new Error('Pengajuan izin ditolak: Anda telah tercatat hadir pada sesi ini.');
  }

  // 2. Anti-duplicate: Check if leave request already submitted
  const existingLeaveSnap = await getDoc(leaveRef);
  if (existingLeaveSnap.exists()) {
    throw new Error('Anda sudah mengajukan izin untuk sesi praktikum ini.');
  }

  const initialRequest: LeaveRequest = {
    id: leaveDocId,
    sessionId,
    classId,
    practicumName,
    className,
    sessionDate,
    studentUid,
    studentName: studentName.trim(),
    studentEmail: studentEmail.trim().toLowerCase(),
    reason: reason.trim(),
    status: 'pending',
    submittedAt: new Date().toISOString(),
    aiStatus: 'pending',
  };

  // 3. Save initial pending leave document to Firestore
  await setDoc(leaveRef, {
    sessionId,
    classId,
    practicumName,
    className,
    sessionDate,
    studentUid,
    studentName: studentName.trim(),
    studentEmail: studentEmail.trim().toLowerCase(),
    reason: reason.trim(),
    status: 'pending' as LeaveStatus,
    submittedAt: serverTimestamp(),
    aiStatus: 'pending',
  });

  // 4. Asynchronously process AI classification (non-blocking)
  void (async () => {
    try {
      const aiResult = await classifyLeaveReason(reason);
      await updateDoc(leaveRef, {
        aiCategory: aiResult.category,
        aiConfidence: aiResult.confidence,
        aiExplanation: aiResult.explanation,
        aiStatus: aiResult.status,
      });
    } catch (err: any) {
      console.warn('AI classification async failed:', err.message);
      try {
        await updateDoc(leaveRef, {
          aiStatus: 'failed',
          aiExplanation: 'Analisis AI tidak dapat diselesaikan.',
        });
      } catch {
        // ignore secondary error
      }
    }
  })();

  return initialRequest;
}

export async function reviewLeaveRequest(params: {
  leaveId: string;
  assistantUid: string;
  decision: 'approved' | 'rejected';
  notes?: string;
}): Promise<void> {
  const { leaveId, assistantUid, decision, notes } = params;

  const leaveRef = doc(db, 'leaveRequests', leaveId);
  const leaveSnap = await getDoc(leaveRef);
  if (!leaveSnap.exists()) {
    throw new Error('Pengajuan izin tidak ditemukan.');
  }

  await updateDoc(leaveRef, {
    status: decision,
    reviewedBy: assistantUid,
    reviewedAt: serverTimestamp(),
    reviewNotes: notes?.trim() || '',
  });
}

export function subscribeStudentLeaveRequests(
  studentUid: string,
  callback: (requests: LeaveRequest[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'leaveRequests'), where('studentUid', '==', studentUid));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: LeaveRequest[] = snapshot.docs.map((dSnap) => {
        const d = dSnap.data();
        return {
          id: dSnap.id,
          sessionId: d.sessionId || '',
          classId: d.classId || '',
          practicumName: d.practicumName || '',
          className: d.className || '',
          sessionDate: d.sessionDate || '',
          studentUid: d.studentUid || '',
          studentName: d.studentName || '',
          studentEmail: d.studentEmail || '',
          reason: d.reason || '',
          status: (d.status as LeaveStatus) || 'pending',
          submittedAt: d.submittedAt?.toDate ? d.submittedAt.toDate().toISOString() : (d.submittedAt || ''),
          reviewedAt: d.reviewedAt?.toDate ? d.reviewedAt.toDate().toISOString() : d.reviewedAt,
          reviewedBy: d.reviewedBy,
          reviewNotes: d.reviewNotes,
          aiCategory: d.aiCategory,
          aiConfidence: d.aiConfidence,
          aiExplanation: d.aiExplanation,
          aiStatus: d.aiStatus || 'pending',
        };
      });
      // Sort newest first
      list.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
      callback(list);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}

export function subscribeAssistantLeaveRequests(
  callback: (requests: LeaveRequest[]) => void,
  classId?: string,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, 'leaveRequests');
  const q = classId ? query(colRef, where('classId', '==', classId)) : colRef;

  return onSnapshot(
    q,
    (snapshot) => {
      const list: LeaveRequest[] = snapshot.docs.map((dSnap) => {
        const d = dSnap.data();
        return {
          id: dSnap.id,
          sessionId: d.sessionId || '',
          classId: d.classId || '',
          practicumName: d.practicumName || '',
          className: d.className || '',
          sessionDate: d.sessionDate || '',
          studentUid: d.studentUid || '',
          studentName: d.studentName || '',
          studentEmail: d.studentEmail || '',
          reason: d.reason || '',
          status: (d.status as LeaveStatus) || 'pending',
          submittedAt: d.submittedAt?.toDate ? d.submittedAt.toDate().toISOString() : (d.submittedAt || ''),
          reviewedAt: d.reviewedAt?.toDate ? d.reviewedAt.toDate().toISOString() : d.reviewedAt,
          reviewedBy: d.reviewedBy,
          reviewNotes: d.reviewNotes,
          aiCategory: d.aiCategory,
          aiConfidence: d.aiConfidence,
          aiExplanation: d.aiExplanation,
          aiStatus: d.aiStatus || 'pending',
        };
      });
      // Sort newest first
      list.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
      callback(list);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}

export function subscribeSessionLeaveRequests(
  sessionId: string,
  callback: (requests: LeaveRequest[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'leaveRequests'), where('sessionId', '==', sessionId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: LeaveRequest[] = snapshot.docs.map((dSnap) => {
        const d = dSnap.data();
        return {
          id: dSnap.id,
          sessionId: d.sessionId || '',
          classId: d.classId || '',
          practicumName: d.practicumName || '',
          className: d.className || '',
          sessionDate: d.sessionDate || '',
          studentUid: d.studentUid || '',
          studentName: d.studentName || '',
          studentEmail: d.studentEmail || '',
          reason: d.reason || '',
          status: (d.status as LeaveStatus) || 'pending',
          submittedAt: d.submittedAt?.toDate ? d.submittedAt.toDate().toISOString() : (d.submittedAt || ''),
          reviewedAt: d.reviewedAt?.toDate ? d.reviewedAt.toDate().toISOString() : d.reviewedAt,
          reviewedBy: d.reviewedBy,
          reviewNotes: d.reviewNotes,
          aiCategory: d.aiCategory,
          aiConfidence: d.aiConfidence,
          aiExplanation: d.aiExplanation,
          aiStatus: d.aiStatus || 'pending',
        };
      });
      callback(list);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}
