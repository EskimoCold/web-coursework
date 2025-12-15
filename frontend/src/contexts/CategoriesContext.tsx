import React, { createContext, useContext, useEffect, ReactNode } from 'react';

import {
  CategoryStoreState,
  resetCategoryStore,
  useCategoryStore,
} from '../stores/categoryStore';
import { useAuthStore } from '../stores/authStore';
import { Category } from '../types/category';

type CategoryContextType = Pick<CategoryStoreState, 'categories' | 'setCategories' | 'icons'> & {
  fetchCategories: () => Promise<void>;
};

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const CategoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const categories = useCategoryStore((state) => state.categories);
  const setCategories = useCategoryStore((state) => state.setCategories);
  const icons = useCategoryStore((state) => state.icons);
  const fetchCategories = useCategoryStore((state) => state.fetchCategories);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (accessToken) {
      fetchCategories();
    }
  }, [accessToken, fetchCategories]);

  return (
    <CategoryContext.Provider value={{ categories, setCategories, icons, fetchCategories }}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) throw new Error('useCategories must be used within CategoryProvider');
  return context;
};

export type { Category };
export { resetCategoryStore };
