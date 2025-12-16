import { create } from 'zustand';

import { transactionsApi, TransactionCreate, Category } from '../api/transactions';

type TransactionFormState = {
  categories: Category[];
  loading: boolean;
  formData: TransactionCreate;
  loadCategories: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setFormField: (
    field: keyof TransactionCreate,
    value: TransactionCreate[keyof TransactionCreate],
  ) => void;
  reset: () => void;
};

const getBaseForm = (): TransactionCreate => ({
  amount: 0,
  description: '',
  transaction_type: 'expense',
  category_id: null,
  transaction_date: new Date().toISOString().split('T')[0],
});

export const useTransactionFormStore = create<TransactionFormState>((set) => ({
  categories: [],
  loading: false,
  formData: getBaseForm(),
  loadCategories: async () => {
    try {
      const categoriesData = await transactionsApi.getCategories();
      set({ categories: categoriesData });
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
    }
  },
  setLoading: (loading) => set({ loading }),
  setFormField: (field, value) =>
    set((state) => ({
      formData: { ...state.formData, [field]: value },
    })),
  reset: () => set({ categories: [], loading: false, formData: getBaseForm() }),
}));

export const resetTransactionFormStore = () => useTransactionFormStore.getState().reset();
