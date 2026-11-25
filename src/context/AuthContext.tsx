import React, { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import type { Unsubscribe } from 'firebase/firestore';
import { auth } from '@/config/firebase';
import {
  loginUser,
  logoutUser,
  registerUser,
  subscribeUserProfile,
  mapAuthError,
} from '@/services/authService';
import type { UserProfile, UserRole } from '@/types';

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  isAssistant: boolean;
  isStudent: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string, confirm: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let unsubscribeProfile: Unsubscribe | null = null;

    // Listen to Firebase Auth state
    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (!active) return;

        // Clean up previous profile listener
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }

        if (firebaseUser) {
          setUser(firebaseUser);
          // Subscribe to real-time updates of the user profile document in Firestore
          unsubscribeProfile = subscribeUserProfile(
            firebaseUser.uid,
            (liveProfile) => {
              if (!active) return;
              setProfile(liveProfile);
              setLoading(false);
            },
            (err) => {
              if (!active) return;
              console.warn('Profile sync error:', err.message);
              setLoading(false);
            }
          );
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      },
      (err) => {
        if (!active) return;
        console.warn('Auth state error:', err.message);
        setLoading(false);
      }
    );

    return () => {
      active = false;
      if (unsubscribeProfile) unsubscribeProfile();
      unsubscribeAuth();
    };
  }, []);

  const clearError = () => setError(null);

  const login = async (email: string, pass: string) => {
    setActionLoading(true);
    setError(null);
    try {
      const userProfile = await loginUser(email, pass);
      if (auth.currentUser) {
        setUser(auth.currentUser);
      }
      setProfile(userProfile);
      setLoading(false);
    } catch (err: any) {
      const errorMsg = err?.code ? mapAuthError(err.code) : (err?.message || 'Gagal masuk.');
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const register = async (name: string, email: string, pass: string, confirm: string) => {
    setActionLoading(true);
    setError(null);
    try {
      const userProfile = await registerUser(name, email, pass, confirm);
      if (auth.currentUser) {
        setUser(auth.currentUser);
      }
      setProfile(userProfile);
      setLoading(false);
    } catch (err: any) {
      const errorMsg = err?.code ? mapAuthError(err.code) : (err?.message || 'Gagal mendaftar.');
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const logout = async () => {
    setActionLoading(true);
    setError(null);
    try {
      await logoutUser();
      setUser(null);
      setProfile(null);
    } catch (err: any) {
      setError(err?.message || 'Gagal keluar.');
    } finally {
      setActionLoading(false);
    }
  };

  const role: UserRole | null = profile?.role ?? null;
  const isAssistant = role === 'asisten';
  const isStudent = role === 'praktikan';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isAssistant,
        isStudent,
        isAuthenticated,
        loading,
        actionLoading,
        error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
