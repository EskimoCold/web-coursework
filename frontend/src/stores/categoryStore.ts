import { create } from 'zustand';

import { categoriesApi } from '../api/categories';
import { tokenStore } from '../api/tokenStore';
import { Category } from '../types/category';

type CategoryState = {
  categories: Category[];
  icons: string[];
  isLoading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  setCategories: (updater: Category[] | ((prev: Category[]) => Category[])) => void;
  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  removeCategory: (id: number) => void;
  reset: () => void;
};

const iconsList = Array.from({ length: 18 }, (_, i) => `icons/categories/${i + 1}.svg`);

export const useCategoryStore = create<CategoryState>((set) => ({
  categories: [],
  icons: iconsList,
  isLoading: false,
  error: null,
  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    const token = tokenStore.getAccessToken();
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const data = await categoriesApi.getCategories();
      set({ categories: data, isLoading: false });
    } catch (err) {
      console.error(err);
      set({
        error: err instanceof Error ? err.message : 'Не удалось загрузить категории',
        isLoading: false,
      });
    }
  },
  setCategories: (updater) =>
    set((state) => ({
      categories:
        typeof updater === 'function'
          ? (updater as (prev: Category[]) => Category[])(state.categories)
          : updater,
    })),
  addCategory: (category) => set((state) => ({ categories: [...state.categories, category] })),
  updateCategory: (category) =>
    set((state) => ({
      categories: state.categories.map((c) => (c.id === category.id ? category : c)),
    })),
  removeCategory: (id) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    })),
  reset: () => set({ categories: [], isLoading: false, error: null }),
}));

export type CategoryStoreState = CategoryState;

export const resetCategoryStore = () => useCategoryStore.getState().reset();
