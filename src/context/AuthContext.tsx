'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import type { User, StoreSettings } from '@/lib/types';
import { getStoreSettings } from '@/lib/db';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isFirstTime: boolean;
  login: (user: User) => void;
  logout: () => void;
  settings: StoreSettings | null;
  reloadSettings: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const router = useRouter();
  const pathname = usePathname();


  const reloadSettings = useCallback(async () => {
    try {
      const newSettings = await getStoreSettings();
      setSettings(newSettings);
    } catch (error) {
      console.error("Failed to reload settings:", error);
      setSettings(null);
    }
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const usersCollection = collection(firestore, 'users');
        const userSnapshot = await getDocs(usersCollection);
        const isDbEmpty = userSnapshot.empty;
        
        setIsFirstTime(isDbEmpty);
        
        const storedUserJson = sessionStorage.getItem('smart-seller-user');
        const storedUser: User | null = storedUserJson ? JSON.parse(storedUserJson) : null;
        
        if (!isDbEmpty) {
          await reloadSettings();
          if (storedUser) {
            setUser(storedUser);
          }
        }
        
        // --- Centralized Redirection Logic ---
        if (isDbEmpty) {
          if (pathname !== '/login') {
            router.replace('/login');
          }
        } else {
          if (storedUser) {
            // If user is logged in, but on the login page, redirect them to kasir
            if (pathname === '/login' || pathname === '/') {
              router.replace('/kasir');
            }
          } else {
            // If no user is logged in and it's not the first time, they should be on the login page
            if (pathname !== '/login') {
              router.replace('/login');
            }
          }
        }

      } catch (error) {
        console.error('Critical error during initial data check:', error);
        // Fallback to a safe state if the database is unreachable
        setIsFirstTime(false);
        setUser(null);
        setSettings(null);
        if (pathname !== '/login') {
            router.replace('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on initial mount

  const login = (loggedInUser: User) => {
    sessionStorage.setItem('smart-seller-user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    reloadSettings().then(() => {
        router.push('/kasir');
    });
  };

  const logout = () => {
    sessionStorage.removeItem('smart-seller-user');
    setUser(null);
    router.push('/login'); 
  };

  return (
    <AuthContext.Provider value={{ user, loading, isFirstTime, login, logout, settings, reloadSettings }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
