import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

import { authApi, User, LoginRequest, RegisterRequest } from '../api/auth';
import { tokenStore } from '../api/tokenStore';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateAccessToken = useCallback((token: string | null) => {
    setAccessToken(token);
    tokenStore.setAccessToken(token);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await authApi.refreshToken();
        updateAccessToken(response.access_token);
        const userData = await authApi.getCurrentUser(response.access_token);
        setUser(userData);
      } catch {
        updateAccessToken(null);
      }
      setIsLoading(false);
    };

    initAuth();
  }, [updateAccessToken]);

  const login = async (data: LoginRequest) => {
    const response = await authApi.login(data);
    updateAccessToken(response.access_token);
    const userData = await authApi.getCurrentUser(response.access_token);
    setUser(userData);
  };

  const register = async (data: RegisterRequest) => {
    await authApi.register(data);
    await login({ username: data.username, password: data.password });
  };

  const logout = () => {
    authApi.logout().catch(() => {});
    updateAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        accessToken,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
