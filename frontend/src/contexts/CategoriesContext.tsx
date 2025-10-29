import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { categoriesApi } from '../api/categories';

export type Category = {
  id: number;
  name: string;
  //  type: number;
  //  icon: string;
  description: string;
};

type CategoryContextType = {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
};

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const CategoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoriesApi.getCategories();
        setCategories(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchCategories();
  }, []);

  return (
    <CategoryContext.Provider value={{ categories, setCategories }}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) throw new Error('useCategories must be used within CategoryProvider');
  return context;
};
