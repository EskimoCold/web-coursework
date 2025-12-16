import { render, screen, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';

import { AuthProvider } from '../../contexts/AuthContext';
import { CategoryProvider } from '../../contexts/CategoriesContext';
import { CurrencyProvider } from '../../contexts/CurrencyContext';


import { HomePage } from './HomePage';
import { resetHomeStore } from './homeStore';

// Mock CSS files
vi.mock('./home.css', () => ({}));

// Mock the modules that are causing issues
vi.mock('../../api/transactions', () => ({
  transactionsApi: {
    getTransactions: vi.fn(() =>
      Promise.resolve([
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
      ]),
    ),
    getCategories: vi.fn(() => Promise.resolve([])),
    createTransaction: vi.fn(),
  },
}));

// Mock categories API to avoid authorization errors
vi.mock('../../api/categories', () => ({
  categoriesApi: {
    getCategories: vi.fn(() => Promise.resolve([])),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  },
}));

// Mock the contexts to avoid nested context issues
const MockProviders = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <CurrencyProvider>
      <CategoryProvider>{children}</CategoryProvider>
    </CurrencyProvider>
  </AuthProvider>
);


describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetHomeStore();
  });

  test('renders without crashing', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Дашборд финансов')).toBeInTheDocument();
    });
  });

  test('displays transactions correctly', async () => {
    render(<HomePage />);

    // Wait for loading to complete and data to be displayed
    await waitFor(() => {
      const productElements = screen.queryAllByText('Продукты в супермаркете');
      expect(productElements.length).toBeGreaterThan(0);

      const salaryElements = screen.queryAllByText('Зарплата за январь');
      expect(salaryElements.length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      const incomeAmounts = screen.getAllByText('+50000 ₽');
      const expenseAmounts = screen.getAllByText('-1500 ₽');

      expect(incomeAmounts.length).toBeGreaterThan(0);
      expect(expenseAmounts.length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText('Доходы').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Расходы').length).toBeGreaterThan(0);
    expect(screen.getByText('Баланс')).toBeInTheDocument();
  });
});
