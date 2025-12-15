import { create } from 'zustand';

import { transactionsApi, Transaction, Category, TransactionCreate } from '../../api/transactions';

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 1,
    amount: 1500,
    transaction_type: 'expense',
    transaction_date: '2024-01-15T00:00:00Z',
    description: 'Продукты в супермаркете',
    category: { id: 1, name: 'Продукты' },
  },
  {
    id: 2,
    amount: 50000,
    transaction_type: 'income',
    transaction_date: '2024-01-10T00:00:00Z',
    description: 'Зарплата за январь',
    category: { id: 2, name: 'Зарплата' },
  },
  {
    id: 3,
    amount: 800,
    transaction_type: 'expense',
    transaction_date: '2024-01-08T00:00:00Z',
    description: 'Проездной на метро',
    category: { id: 3, name: 'Транспорт' },
  },
];

type HomeFilter = 'all' | 'income' | 'expense';

type HomeFormState = {
  amount: string;
  description: string;
  transaction_type: 'income' | 'expense';
  category_id: string;
  transaction_date: string;
};

type HomeState = {
  currentPage: number;
  filter: HomeFilter;
  allTransactions: Transaction[];
  categories: Category[];
  loading: boolean;
  useBackend: boolean;
  backendError: string | null;
  showAddModal: boolean;
  formLoading: boolean;
  formData: HomeFormState;
  loadData: () => Promise<void>;
  setCurrentPage: (page: number) => void;
  setFilter: (filter: HomeFilter) => void;
  setShowAddModal: (open: boolean) => void;
  setFormLoading: (loading: boolean) => void;
  setFormData: (updater: HomeFormState | ((prev: HomeFormState) => HomeFormState)) => void;
  resetForm: () => void;
  setUseBackend: (value: boolean) => void;
  setBackendError: (message: string | null) => void;
  setAllTransactions: (
    updater: Transaction[] | ((prev: Transaction[]) => Transaction[]),
  ) => void;
  setCategories: (updater: Category[] | ((prev: Category[]) => Category[])) => void;
  addLocalTransaction: (transaction: Transaction) => void;
  reset: () => void;
};

const getBaseForm = (): HomeFormState => ({
  amount: '',
  description: '',
  transaction_type: 'expense',
  category_id: '',
  transaction_date: new Date().toISOString().split('T')[0],
});

export const useHomeStore = create<HomeState>((set, get) => ({
  currentPage: 1,
  filter: 'all',
  allTransactions: [],
  categories: [],
  loading: true,
  useBackend: true,
  backendError: null,
  showAddModal: false,
  formLoading: false,
  formData: getBaseForm(),
  loadData: async () => {
    set({ loading: true, backendError: null });
    try {
      if (get().useBackend) {
        try {
          const [transactionsData, categoriesData] = await Promise.all([
            transactionsApi.getTransactions(),
            transactionsApi.getCategories(),
          ]);
          set({
            allTransactions: transactionsData,
            categories: categoriesData,
            backendError: null,
            loading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
          set({
            backendError: `Бэкенд недоступен: ${message}`,
            useBackend: false,
            allTransactions: MOCK_TRANSACTIONS,
            categories: [],
            loading: false,
          });
        }
      } else {
        set({
          allTransactions: MOCK_TRANSACTIONS,
          categories: [],
          loading: false,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
      set({
        backendError: `Ошибка: ${message}`,
        allTransactions: MOCK_TRANSACTIONS,
        categories: [],
        loading: false,
      });
    }
  },
  setCurrentPage: (page) => set({ currentPage: page }),
  setFilter: (filter) => set({ filter }),
  setShowAddModal: (open) => set({ showAddModal: open }),
  setFormLoading: (loading) => set({ formLoading: loading }),
  setFormData: (updater) =>
    set((state) => ({
      formData: typeof updater === 'function' ? (updater as (prev: HomeFormState) => HomeFormState)(state.formData) : updater,
    })),
  resetForm: () => set({ formData: getBaseForm() }),
  setUseBackend: (value) => set({ useBackend: value }),
  setBackendError: (message) => set({ backendError: message }),
  setAllTransactions: (updater) =>
    set((state) => ({
      allTransactions:
        typeof updater === 'function'
          ? (updater as (prev: Transaction[]) => Transaction[])(state.allTransactions)
          : updater,
    })),
  setCategories: (updater) =>
    set((state) => ({
      categories:
        typeof updater === 'function'
          ? (updater as (prev: Category[]) => Category[])(state.categories)
          : updater,
    })),
  addLocalTransaction: (transaction) =>
    set((state) => ({
      allTransactions: [transaction, ...state.allTransactions],
    })),
  reset: () =>
    set({
      currentPage: 1,
      filter: 'all',
      allTransactions: [],
      categories: [],
      loading: true,
      useBackend: true,
      backendError: null,
      showAddModal: false,
      formLoading: false,
      formData: getBaseForm(),
    }),
}));

export const resetHomeStore = () => useHomeStore.getState().reset();
