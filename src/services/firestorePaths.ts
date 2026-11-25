import {
  collection,
  doc,
  type Firestore,
  type CollectionReference,
  type DocumentReference,
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export const SPRINT2_ROOT_COLLECTION = 'sprint2Data';
export const SPRINT2_APP_DOC = 'app';

export type Sprint2SubCollection =
  | 'users'
  | 'classes'
  | 'enrollments'
  | 'sessions'
  | 'attendance'
  | 'leaveRequests';

/**
 * Returns a typed CollectionReference pointing to:
 * /sprint2Data/app/{subCollection}
 */
export function getSprint2Collection(
  subCollection: Sprint2SubCollection,
  database: Firestore = db
): CollectionReference {
  return collection(database, SPRINT2_ROOT_COLLECTION, SPRINT2_APP_DOC, subCollection);
}

/**
 * Returns a typed DocumentReference pointing to:
 * /sprint2Data/app/{subCollection}/{docId}
 */
export function getSprint2Doc(
  subCollection: Sprint2SubCollection,
  docId: string,
  database: Firestore = db
): DocumentReference {
  return doc(database, SPRINT2_ROOT_COLLECTION, SPRINT2_APP_DOC, subCollection, docId);
}
