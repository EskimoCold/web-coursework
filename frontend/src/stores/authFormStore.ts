import { create } from 'zustand';

type LoginSlice = {
  username: string;
  password: string;
  error: string;
  isLoading: boolean;
};

type RegisterSlice = {
  username: string;
  password: string;
  confirmPassword: string;
  error: string;
  isLoading: boolean;
};

type AuthFormState = {
  login: LoginSlice;
  register: RegisterSlice;
  setLoginField: (field: keyof LoginSlice, value: string | boolean) => void;
  setRegisterField: (field: keyof RegisterSlice, value: string | boolean) => void;
  setLoginError: (error: string) => void;
  setRegisterError: (error: string) => void;
  setLoginLoading: (loading: boolean) => void;
  setRegisterLoading: (loading: boolean) => void;
  resetLogin: () => void;
  resetRegister: () => void;
  reset: () => void;
};

const baseLogin: LoginSlice = {
  username: '',
  password: '',
  error: '',
  isLoading: false,
};

const baseRegister: RegisterSlice = {
  username: '',
  password: '',
  confirmPassword: '',
  error: '',
  isLoading: false,
};

export const useAuthFormStore = create<AuthFormState>((set) => ({
  login: baseLogin,
  register: baseRegister,
  setLoginField: (field, value) =>
    set((state) => ({
      login: { ...state.login, [field]: value },
    })),
  setRegisterField: (field, value) =>
    set((state) => ({
      register: { ...state.register, [field]: value },
    })),
  setLoginError: (error) =>
    set((state) => ({
      login: { ...state.login, error },
    })),
  setRegisterError: (error) =>
    set((state) => ({
      register: { ...state.register, error },
    })),
  setLoginLoading: (isLoading) =>
    set((state) => ({
      login: { ...state.login, isLoading },
    })),
  setRegisterLoading: (isLoading) =>
    set((state) => ({
      register: { ...state.register, isLoading },
    })),
  resetLogin: () => set({ login: baseLogin }),
  resetRegister: () => set({ register: baseRegister }),
  reset: () => set({ login: baseLogin, register: baseRegister }),
}));

export const resetAuthFormStore = () => useAuthFormStore.getState().reset();
