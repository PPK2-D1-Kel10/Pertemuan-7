import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  browserLocalPersistence,
  type Auth,
  type Persistence,
} from 'firebase/auth';
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore';

// Safely resolve React Native Platform and AsyncStorage across Hermes and Node environments
let Platform: any = null;
let AsyncStorage: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const RN = require('react-native');
  Platform = RN ? RN.Platform : null;
} catch {
  Platform = { OS: 'node' };
}

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch {
  AsyncStorage = null;
}

// In-Memory fallback storage for environments where AsyncStorage is unavailable
const memoryStorageMap = new Map<string, string>();
const inMemoryStorage = {
  async setItem(key: string, value: string): Promise<void> {
    memoryStorageMap.set(key, value);
  },
  async getItem(key: string): Promise<string | null> {
    return memoryStorageMap.get(key) ?? null;
  },
  async removeItem(key: string): Promise<void> {
    memoryStorageMap.delete(key);
  },
};

// Robust React Native Persistence adapter conforming to the Firebase Auth Persistence protocol
function createReactNativePersistenceClass(storage: any): Persistence {
  const Cls = class {
    type = 'LOCAL';
    async _isAvailable() {
      try {
        if (!storage) return false;
        await storage.setItem('firebase:auth:storage_available', '1');
        await storage.removeItem('firebase:auth:storage_available');
        return true;
      } catch {
        return false;
      }
    }
    async _set(key: string, value: any) {
      try {
        await storage.setItem(key, JSON.stringify(value));
      } catch (err) {
        console.warn('Firebase Auth AsyncStorage write warning:', err);
      }
    }
    async _get(key: string) {
      try {
        const json = await storage.getItem(key);
        return json ? JSON.parse(json) : null;
      } catch (err) {
        console.warn('Firebase Auth AsyncStorage read warning:', err);
        return null;
      }
    }
    async _remove(key: string) {
      try {
        await storage.removeItem(key);
      } catch (err) {
        console.warn('Firebase Auth AsyncStorage remove warning:', err);
      }
    }
    _addListener(_key: any, _listener: any) {
      return;
    }
    _removeListener(_key: any, _listener: any) {
      return;
    }
  };
  (Cls as any).type = 'LOCAL';
  return Cls as unknown as Persistence;
}

// Safely resolve persistence: Web -> browserLocalPersistence, Mobile -> AsyncStorage adapter
function getStoragePersistence(): Persistence {
  // 1. Node.js environment (automated test runners)
  if (Platform && Platform.OS === 'node') {
    return createReactNativePersistenceClass(inMemoryStorage);
  }

  // 2. Web environment
  if (Platform && Platform.OS === 'web') {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      return browserLocalPersistence;
    }
  }

  // 3. React Native Mobile (Android / iOS)
  if (Platform && (Platform.OS === 'android' || Platform.OS === 'ios')) {
    if (AsyncStorage) {
      return createReactNativePersistenceClass(AsyncStorage);
    }
  }

  // 4. Fallback check for browser runtime
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    return browserLocalPersistence;
  }

  // 5. Default to AsyncStorage or in-memory fallback
  if (AsyncStorage) {
    return createReactNativePersistenceClass(AsyncStorage);
  }

  return createReactNativePersistenceClass(inMemoryStorage);
}

// Production Firebase Cloud config for ZerovaApp (with env variable override support)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDB3Eelu_0E1-GBaCet1dUi8SWJmhieCbg',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'zerovaapp.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'zerovaapp',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'zerovaapp.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '262603150759',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:262603150759:android:0fc752373d522fceb39282',
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
  } catch (err) {
    console.warn('initializeAuth fallback to getAuth:', err);
    auth = getAuth(app);
  }
} else {
  app = getApp();
  auth = getAuth(app);
}

try {
  db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  });
} catch {
  db = getFirestore(app);
}

export { app, auth, db, firebaseConfig };
