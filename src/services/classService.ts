import {
  collection,
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
import { db } from '@/config/firebase';
import type { PracticumClass, ClassEnrollment } from '@/types';

export async function createClass(data: {
  name: string;
  practicumName: string;
  assistantUid: string;
  assistantName?: string;
}): Promise<string> {
  if (!data.name.trim() || !data.practicumName.trim()) {
    throw new Error('Nama kelas dan nama praktikum wajib diisi.');
  }

  const classRef = doc(collection(db, 'classes'));
  await setDoc(classRef, {
    name: data.name.trim(),
    practicumName: data.practicumName.trim(),
    assistantUid: data.assistantUid,
    assistantName: data.assistantName || 'Asisten',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return classRef.id;
}

export async function updateClass(
  classId: string,
  data: { name: string; practicumName: string }
): Promise<void> {
  if (!data.name.trim() || !data.practicumName.trim()) {
    throw new Error('Nama kelas dan nama praktikum wajib diisi.');
  }

  const classRef = doc(db, 'classes', classId);
  await updateDoc(classRef, {
    name: data.name.trim(),
    practicumName: data.practicumName.trim(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteClass(classId: string): Promise<void> {
  // Safe delete: Check if sessions exist for this class
  const sessionsQuery = query(collection(db, 'sessions'), where('classId', '==', classId));
  const sessionsSnap = await getDocs(sessionsQuery);
  if (!sessionsSnap.empty) {
    throw new Error('Kelas tidak dapat dihapus karena masih memiliki sesi praktikum.');
  }

  await deleteDoc(doc(db, 'classes', classId));
}

export async function enrollStudent(
  classId: string,
  studentUid: string,
  studentName: string,
  studentEmail: string
): Promise<void> {
  const enrollmentId = `${classId}_${studentUid}`;
  const enrollmentRef = doc(db, 'enrollments', enrollmentId);
  await setDoc(enrollmentRef, {
    classId,
    studentUid,
    studentName,
    studentEmail,
    enrolledAt: serverTimestamp(),
  });
}

export function subscribeClasses(
  callback: (classes: PracticumClass[]) => void,
  assistantUid?: string,
  onError?: (error: Error) => void
): Unsubscribe {
  const classesCol = collection(db, 'classes');
  const q = assistantUid
    ? query(classesCol, where('assistantUid', '==', assistantUid))
    : classesCol;

  return onSnapshot(
    q,
    (snapshot) => {
      const list: PracticumClass[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          name: d.name || '',
          practicumName: d.practicumName || '',
          assistantUid: d.assistantUid || '',
          assistantName: d.assistantName,
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : (d.createdAt || ''),
          updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : (d.updatedAt || ''),
        };
      });
      callback(list);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}

export function subscribeStudentEnrollments(
  studentUid: string,
  callback: (enrollments: ClassEnrollment[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'enrollments'), where('studentUid', '==', studentUid));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: ClassEnrollment[] = snapshot.docs.map((dSnap) => {
        const d = dSnap.data();
        return {
          id: dSnap.id,
          classId: d.classId,
          studentUid: d.studentUid,
          studentName: d.studentName || '',
          studentEmail: d.studentEmail || '',
          enrolledAt: d.enrolledAt?.toDate ? d.enrolledAt.toDate().toISOString() : (d.enrolledAt || ''),
        };
      });
      callback(list);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}

export function subscribeClassStudents(
  classId: string,
  callback: (students: ClassEnrollment[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'enrollments'), where('classId', '==', classId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: ClassEnrollment[] = snapshot.docs.map((dSnap) => {
        const d = dSnap.data();
        return {
          id: dSnap.id,
          classId: d.classId,
          studentUid: d.studentUid,
          studentName: d.studentName || '',
          studentEmail: d.studentEmail || '',
          enrolledAt: d.enrolledAt?.toDate ? d.enrolledAt.toDate().toISOString() : (d.enrolledAt || ''),
        };
      });
      callback(list);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}
