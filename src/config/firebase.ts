import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  browserLocalPersistence,
  type Auth,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Helper to safely get persistence across Web, React Native, and Node environments
function getStoragePersistence() {
  if (typeof window !== 'undefined' || typeof document !== 'undefined') {
    return browserLocalPersistence;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Platform } = require('react-native');
    if (Platform && Platform.OS === 'web') {
      return browserLocalPersistence;
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getReactNativePersistence } = require('firebase/auth');
    if (typeof getReactNativePersistence === 'function' && AsyncStorage) {
      return getReactNativePersistence(AsyncStorage);
    }
  } catch {
    // fallback for environments without react-native bindings
  }
  return browserLocalPersistence;
}

// Config with environment variables or default demo configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDemoProjectKeyForSprint2Attendance',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'praktiku-sprint2.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'praktiku-sprint2',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'praktiku-sprint2.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:123456789012:web:abcdef1234567890',
};

// Singleton initialization
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  try {
    auth = initializeAuth(app, {
      persistence: getStoragePersistence(),
    });
  } catch {
    auth = getAuth(app);
  }
} else {
  app = getApp();
  auth = getAuth(app);
}

db = getFirestore(app);

export { app, auth, db, firebaseConfig };
