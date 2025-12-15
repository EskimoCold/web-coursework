import React, { createContext, useContext, useEffect, ReactNode } from 'react';

import { AuthStoreState, resetAuthStore, useAuthStore } from '../stores/authStore';

const AuthContext = createContext<AuthStoreState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const storeState = useAuthStore();
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return <AuthContext.Provider value={storeState}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export { resetAuthStore };
