import { create } from 'zustand';

type NavigationState = {
  activePage: string;
  setActivePage: (page: string) => void;
  reset: () => void;
};

export const useNavigationStore = create<NavigationState>((set) => ({
  activePage: 'Главная',
  setActivePage: (page) => set({ activePage: page }),
  reset: () => set({ activePage: 'Главная' }),
}));

export const resetNavigationStore = () => useNavigationStore.getState().reset();
