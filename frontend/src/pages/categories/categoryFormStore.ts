import { create } from 'zustand';

import { Category } from '../../types/category';

type CategoryFormFields = {
  name: string;
  description: string;
  icon: string;
};

type CategoryFormState = CategoryFormFields & {
  setField: (field: keyof CategoryFormFields, value: string) => void;
  hydrate: (category?: Category) => void;
  reset: () => void;
};

const baseState: CategoryFormFields = {
  name: '',
  description: '',
  icon: '',
};

export const createCategoryFormStore = () =>
  create<CategoryFormState>((set) => ({
    ...baseState,
    setField: (field, value) => set((state) => ({ ...state, [field]: value })),
    hydrate: (category) =>
      set({
        name: category?.name ?? '',
        description: category?.description ?? '',
        icon: category?.icon ?? '',
      }),
    reset: () => set(baseState),
  }));
