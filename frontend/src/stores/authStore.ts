import { create } from 'zustand';

import { authApi, User, LoginRequest, RegisterRequest } from '../api/auth';
import { tokenStore } from '../api/tokenStore';

type AuthState = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initAuth: () => Promise<void>;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  reset: () => void;
};

const baseState = {
  user: null as User | null,
  accessToken: null as string | null,
  isAuthenticated: false,
  isLoading: true,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ...baseState,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  initAuth: async () => {
    set({ isLoading: true });
    try {
      const response = await authApi.refreshToken();
      tokenStore.setAccessToken(response.access_token);
      const user = await authApi.getCurrentUser(response.access_token);
      set({
        user,
        accessToken: response.access_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      tokenStore.clearAccessToken();
      set({ ...baseState, isLoading: false });
    }
  },
  login: async (data) => {
    set({ isLoading: true });
    const response = await authApi.login(data);
    tokenStore.setAccessToken(response.access_token);
    const user = await authApi.getCurrentUser(response.access_token);
    set({
      user,
      accessToken: response.access_token,
      isAuthenticated: true,
      isLoading: false,
    });
  },
  register: async (data) => {
    set({ isLoading: true });
    await authApi.register(data);
    await get().login({ username: data.username, password: data.password });
  },
  logout: async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error(err);
    } finally {
      tokenStore.clearAccessToken();
      set({ ...baseState, isLoading: false });
    }
  },
  reset: () => {
    tokenStore.clearAccessToken();
    set({ ...baseState });
  },
}));

export type AuthStoreState = AuthState;

export const resetAuthStore = () => useAuthStore.getState().reset();
