'use client';
import { useState, useEffect } from 'react';

const CRM_AUTH_KEY = 'crm_auth_v1';
// Simple shared password for BD team — in production use proper auth
const CRM_PASSWORD = process.env.NEXT_PUBLIC_CRM_PASSWORD || 'freedom2024';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const auth = localStorage.getItem(CRM_AUTH_KEY);
      setIsAuthenticated(auth === 'true');
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (password: string): boolean => {
    if (password === CRM_PASSWORD) {
      localStorage.setItem(CRM_AUTH_KEY, 'true');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(CRM_AUTH_KEY);
    setIsAuthenticated(false);
  };

  return { isAuthenticated, isLoading, login, logout };
}
