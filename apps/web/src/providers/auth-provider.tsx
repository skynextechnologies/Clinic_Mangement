'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Role, hasPermission } from '@clinicos/shared';

import { fetchApi } from '../lib/api-client';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[];
  branchIds: string[];
  mustChangePassword?: boolean;
  twoFactorEnabled?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ requires2Factor?: boolean; tempToken?: string }>;
  verify2fa: (tempToken: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
  can: (permission: string) => boolean;
  idleWarningVisible: boolean;
  stayLoggedIn: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const IDLE_TIMEOUT_MS = 14 * 60 * 1000; // 14 mins idle warning
const IDLE_DISCONNECT_MS = 15 * 60 * 1000; // 15 mins forced logout

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [idleWarningVisible, setIdleWarningVisible] = useState<boolean>(false);

  const lastActivityRef = useRef<number>(Date.now());
  const router = useRouter();

  // Helper to check user permissions
  const can = (permission: string): boolean => {
    if (!user) return false;
    return user.roles.some((role) => hasPermission(role, permission));
  };

  // Perform silent refresh using httpOnly cookie
  const refreshSession = async (): Promise<string | null> => {
    try {
      const res = await fetchApi<{ accessToken: string | null }>('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (res.data?.accessToken) {
        setAccessToken(res.data.accessToken);

        // Fetch /auth/me to populate user profile
        const meRes = await fetchApi<UserProfile>('/api/v1/auth/me', {
          headers: { Authorization: `Bearer ${res.data.accessToken}` },
        });

        setUser(meRes.data);
        return res.data.accessToken;
      } else {
        setAccessToken(null);
        setUser(null);
        return null;
      }
    } catch {
      setAccessToken(null);
      setUser(null);
      return null;
    }
  };

  // Initial silent refresh on app load
  useEffect(() => {
    refreshSession().finally(() => setIsLoading(false));
  }, []);

  // User activity listeners for idle timeout
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      if (idleWarningVisible) {
        setIdleWarningVisible(false);
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    const interval = setInterval(() => {
      if (!user) return;
      const elapsed = Date.now() - lastActivityRef.current;

      if (elapsed >= IDLE_DISCONNECT_MS) {
        logout();
      } else if (elapsed >= IDLE_TIMEOUT_MS) {
        setIdleWarningVisible(true);
      }
    }, 10000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      clearInterval(interval);
    };
  }, [user, idleWarningVisible]);

  const login = async (email: string, password: string) => {
    const res = await fetchApi<{
      requires2Factor?: boolean;
      tempToken?: string;
      accessToken?: string;
      user?: UserProfile;
    }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    if (res.data?.requires2Factor) {
      return {
        requires2Factor: true,
        tempToken: res.data.tempToken,
      };
    }

    if (res.data?.accessToken && res.data?.user) {
      setAccessToken(res.data.accessToken);
      setUser(res.data.user);
      lastActivityRef.current = Date.now();
    }

    return {};
  };

  const verify2fa = async (tempToken: string, code: string) => {
    const res = await fetchApi<{
      accessToken: string;
      user: UserProfile;
    }>('/api/v1/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ tempToken, code }),
      credentials: 'include',
    });

    if (res.data?.accessToken && res.data?.user) {
      setAccessToken(res.data.accessToken);
      setUser(res.data.user);
      lastActivityRef.current = Date.now();
    }
  };

  const logout = async () => {
    try {
      if (accessToken) {
        await fetchApi('/api/v1/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: 'include',
        });
      }
    } catch {
      // Ignore network logout errors
    } finally {
      setAccessToken(null);
      setUser(null);
      setIdleWarningVisible(false);
      router.push('/login');
    }
  };

  const logoutAll = async () => {
    try {
      if (accessToken) {
        await fetchApi('/api/v1/auth/logout-all', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: 'include',
        });
      }
    } finally {
      setAccessToken(null);
      setUser(null);
      setIdleWarningVisible(false);
      router.push('/login');
    }
  };

  const stayLoggedIn = () => {
    lastActivityRef.current = Date.now();
    setIdleWarningVisible(false);
    refreshSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        login,
        verify2fa,
        logout,
        logoutAll,
        refreshSession,
        can,
        idleWarningVisible,
        stayLoggedIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
