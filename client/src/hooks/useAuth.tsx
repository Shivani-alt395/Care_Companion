import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setAccessToken } from '../services/api';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  language?: string;
  timezone?: string;
  checkInTime?: string;
  bloodGroup?: string;
  allergies?: string[];
  conditions?: string[];
  emergencyContacts?: { name: string; relation: string; phone: string }[];
  avatarUrl?: string;
}

export interface User {
  id: string;
  email: string;
  role: 'SENIOR' | 'CAREGIVER';
  profile: UserProfile | null;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  role: 'SENIOR' | 'CAREGIVER';
  firstName: string;
  lastName: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const bootstrapAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        const data: { accessToken: string; user: User } = await res.json();
        setAccessToken(data.accessToken);
        setUser(data.user);
      }
    } catch {
      // Not logged in
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrapAuth();
  }, [bootstrapAuth]);

  // Listen for auth:logout events (from API client)
  useEffect(() => {
    const handler = () => {
      setUser(null);
      setAccessToken(null);
    };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<{ accessToken: string; user: User }>('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const register = useCallback(async (formData: RegisterData) => {
    const data = await api.post<{ accessToken: string; user: User }>('/auth/register', formData);
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (_e) {
      // Logout error is non-critical; proceed with client-side cleanup
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
