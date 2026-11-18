import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { auth } from '@/config/firebase';
import { getSprint2Doc } from '@/services/firestorePaths';
import type { UserProfile, UserRole } from '@/types';

// Map Firebase Auth error codes to user-friendly Indonesian messages
export function mapAuthError(errorCode: string): string {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'Email sudah terdaftar. Silakan masuk atau gunakan email lain.';
    case 'auth/invalid-email':
      return 'Format email tidak valid. Gunakan format seperti nama@email.com.';
    case 'auth/weak-password':
      return 'Kata sandi terlalu lemah. Gunakan minimal 6 karakter.';
    case 'auth/user-not-found':
      return 'Akun dengan email ini tidak ditemukan. Silakan daftar terlebih dahulu.';
    case 'auth/wrong-password':
      return 'Kata sandi yang Anda masukkan salah.';
    case 'auth/invalid-credential':
      return 'Email atau kata sandi tidak cocok.';
    case 'auth/network-request-failed':
      return 'Koneksi gagal. Periksa koneksi internet atau emulator Firebase Anda.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan gagal. Coba lagi dalam beberapa saat.';
    case 'auth/user-disabled':
      return 'Akun ini telah dinonaktifkan oleh administrator.';
    default:
      return 'Terjadi kendala autentikasi. Silakan periksa kembali data Anda.';
  }
}

export function validateRegistrationInput(
  name: string,
  email: string,
  password: string,
  confirmPassword: string
): { valid: boolean; message: string } {
  if (!name.trim()) {
    return { valid: false, message: 'Nama lengkap wajib diisi.' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.trim() || !emailRegex.test(email.trim())) {
    return { valid: false, message: 'Format email tidak valid.' };
  }
  if (!password || password.length < 6) {
    return { valid: false, message: 'Kata sandi minimal 6 karakter.' };
  }
  if (password !== confirmPassword) {
    return { valid: false, message: 'Konfirmasi kata sandi tidak cocok.' };
  }
  return { valid: true, message: '' };
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
  confirmPassword: string
): Promise<UserProfile> {
  const validation = validateRegistrationInput(name, email, password, confirmPassword);
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  // Create Firebase Auth user
  const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
  const user = userCredential.user;

  // Public registration ALWAYS assigns role 'praktikan'
  const initialRole: UserRole = 'praktikan';
  const now = new Date().toISOString();

  const profileData: UserProfile = {
    uid: user.uid,
    name: cleanName,
    email: cleanEmail,
    role: initialRole,
    createdAt: now,
    updatedAt: now,
  };

  // Write to Firestore sprint2Data/app/users/{uid}
  const userDocRef = getSprint2Doc('users', user.uid);
  await setDoc(userDocRef, {
    uid: user.uid,
    name: cleanName,
    email: cleanEmail,
    role: initialRole,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return profileData;
}

export async function loginUser(email: string, password: string): Promise<UserProfile> {
  if (!email.trim() || !password) {
    throw new Error('Email dan kata sandi wajib diisi.');
  }

  const cleanEmail = email.trim().toLowerCase();
  const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
  const user = userCredential.user;

  // Retrieve Firestore profile
  const profile = await getUserProfile(user.uid);
  if (!profile) {
    // If profile document missing, create fallback 'praktikan' profile safely
    const fallbackProfile: UserProfile = {
      uid: user.uid,
      name: user.displayName || cleanEmail.split('@')[0],
      email: cleanEmail,
      role: 'praktikan',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(getSprint2Doc('users', user.uid), {
      ...fallbackProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return fallbackProfile;
  }

  return profile;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userDoc = await getDoc(getSprint2Doc('users', uid));
  if (!userDoc.exists()) {
    return null;
  }
  const data = userDoc.data();
  return {
    uid,
    name: data.name || '',
    email: data.email || '',
    role: (data.role === 'asisten' || data.role === 'Asisten') ? 'asisten' : 'praktikan',
    nim: data.nim,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : (data.updatedAt || new Date().toISOString()),
  };
}

export function subscribeUserProfile(
  uid: string,
  callback: (profile: UserProfile | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const userDocRef = getSprint2Doc('users', uid);
  return onSnapshot(
    userDocRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }
      const data = snapshot.data();
      callback({
        uid,
        name: data.name || '',
        email: data.email || '',
        role: (data.role === 'asisten' || data.role === 'Asisten') ? 'asisten' : 'praktikan',
        nim: data.nim,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : (data.updatedAt || new Date().toISOString()),
      });
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}
