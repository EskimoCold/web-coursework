import { create } from 'zustand';

import { categoriesApi } from '../../api/categories';
import { Transaction, transactionsApi } from '../../api/transactions';
import { predictExpenses, ExpenseForecastPoint } from '../../ml/expensePredictor';
import { Category } from '../../types/category';

type DailyIncomeExpensePoint = { date: Date; income: number; expense: number };
export type FilterOption = 'week' | 'month' | 'year' | 'all';

type AnalyticsState = {
  transactions: Transaction[];
  categories: Category[];
  filter: FilterOption;
  expenseForecast: ExpenseForecastPoint[];
  isForecasting: boolean;
  forecastError: string | null;
  setFilter: (filter: FilterOption) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setCategories: (categories: Category[]) => void;
  fetchInitialData: () => Promise<void>;
  runForecast: (points: DailyIncomeExpensePoint[]) => Promise<void>;
  reset: () => void;
};

const baseState = {
  transactions: [] as Transaction[],
  categories: [] as Category[],
  filter: 'all' as FilterOption,
  expenseForecast: [] as ExpenseForecastPoint[],
  isForecasting: false,
  forecastError: null as string | null,
};

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  ...baseState,
  setFilter: (filter) => set({ filter }),
  setTransactions: (transactions) => set({ transactions }),
  setCategories: (categories) => set({ categories }),
  fetchInitialData: async () => {
    const [tx, cats] = await Promise.all([
      transactionsApi.getTransactions(),
      categoriesApi.getCategories(),
    ]);
    set({ transactions: tx, categories: cats });
  },
  runForecast: async (points) => {
    if (!points.length) {
      set({ expenseForecast: [], forecastError: null, isForecasting: false });
      return;
    }

    set({ isForecasting: true, forecastError: null });

    try {
      const expensesOnly = points.filter((p) => p.expense > 0);
      const predictions = await predictExpenses(expensesOnly.length ? expensesOnly : points);
      set({ expenseForecast: predictions, forecastError: null });
    } catch (error) {
      console.error(error);
      set({ expenseForecast: [], forecastError: 'Не удалось построить прогноз расходов' });
    } finally {
      set({ isForecasting: false });
    }
  },
  reset: () => set({ ...baseState }),
}));

export const resetAnalyticsStore = () => useAnalyticsStore.getState().reset();
