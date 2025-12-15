import { create } from 'zustand';

export type SettingsSection = 'security' | 'data' | 'appearance';

type PasswordFormState = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
  error: string;
  success: string;
  isLoading: boolean;
};

type DeleteAccountState = {
  error: string;
  isLoading: boolean;
};

type SettingsState = {
  activeSection: SettingsSection;
  theme: string;
  currency: string;
  isPasswordModalOpen: boolean;
  isDeleteAccountModalOpen: boolean;
  passwordForm: PasswordFormState;
  deleteState: DeleteAccountState;
  setActiveSection: (section: SettingsSection) => void;
  setTheme: (theme: string) => void;
  setCurrency: (currency: string) => void;
  setPasswordModalOpen: (open: boolean) => void;
  setDeleteModalOpen: (open: boolean) => void;
  updatePasswordField: (field: keyof PasswordFormState, value: string) => void;
  setPasswordError: (error: string) => void;
  setPasswordSuccess: (success: string) => void;
  setPasswordLoading: (loading: boolean) => void;
  resetPasswordForm: () => void;
  setDeleteError: (error: string) => void;
  setDeleteLoading: (loading: boolean) => void;
  resetDeleteState: () => void;
  reset: () => void;
};

const basePasswordForm: PasswordFormState = {
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
  error: '',
  success: '',
  isLoading: false,
};

const baseDeleteState: DeleteAccountState = {
  error: '',
  isLoading: false,
};

export const useSettingsStore = create<SettingsState>((set) => ({
  activeSection: 'security',
  theme: 'light',
  currency: 'RUB',
  isPasswordModalOpen: false,
  isDeleteAccountModalOpen: false,
  passwordForm: basePasswordForm,
  deleteState: baseDeleteState,
  setActiveSection: (section) => set({ activeSection: section }),
  setTheme: (theme) => set({ theme }),
  setCurrency: (currency) => set({ currency }),
  setPasswordModalOpen: (open) => set({ isPasswordModalOpen: open }),
  setDeleteModalOpen: (open) => set({ isDeleteAccountModalOpen: open }),
  updatePasswordField: (field, value) =>
    set((state) => ({
      passwordForm: { ...state.passwordForm, [field]: value },
    })),
  setPasswordError: (error) =>
    set((state) => ({
      passwordForm: { ...state.passwordForm, error },
    })),
  setPasswordSuccess: (success) =>
    set((state) => ({
      passwordForm: { ...state.passwordForm, success },
    })),
  setPasswordLoading: (isLoading) =>
    set((state) => ({
      passwordForm: { ...state.passwordForm, isLoading },
    })),
  resetPasswordForm: () => set({ passwordForm: basePasswordForm }),
  setDeleteError: (error) =>
    set((state) => ({
      deleteState: { ...state.deleteState, error },
    })),
  setDeleteLoading: (isLoading) =>
    set((state) => ({
      deleteState: { ...state.deleteState, isLoading },
    })),
  resetDeleteState: () => set({ deleteState: baseDeleteState }),
  reset: () =>
    set({
      activeSection: 'security',
      theme: 'light',
      currency: 'RUB',
      isPasswordModalOpen: false,
      isDeleteAccountModalOpen: false,
      passwordForm: basePasswordForm,
      deleteState: baseDeleteState,
    }),
}));

export const resetSettingsStore = () => useSettingsStore.getState().reset();
