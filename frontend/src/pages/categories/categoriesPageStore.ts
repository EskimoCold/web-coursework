import { create } from 'zustand';

import { Category } from '../../types/category';

type CategoriesPageState = {
  cardWindow?: Category;
  isOpen: boolean;
  showAddForm: boolean;
  searchQuery: string;
  setCardWindow: (cat?: Category) => void;
  setIsOpen: (open: boolean) => void;
  setShowAddForm: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  reset: () => void;
};

export const useCategoriesPageStore = create<CategoriesPageState>((set) => ({
  cardWindow: undefined,
  isOpen: false,
  showAddForm: false,
  searchQuery: '',
  setCardWindow: (cat) => set({ cardWindow: cat }),
  setIsOpen: (open) => set({ isOpen: open }),
  setShowAddForm: (open) => set({ showAddForm: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  reset: () => set({ cardWindow: undefined, isOpen: false, showAddForm: false, searchQuery: '' }),
}));

export const resetCategoriesPageStore = () => useCategoriesPageStore.getState().reset();
