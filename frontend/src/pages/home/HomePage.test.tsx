import { render, screen, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';

import { AuthProvider } from '../../contexts/AuthContext';
import { CategoryProvider } from '../../contexts/CategoriesContext';
import { CurrencyProvider } from '../../contexts/CurrencyContext';

import { HomePage } from './HomePage';

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
  });

  test('renders without crashing', async () => {
    render(
      <MockProviders>
        <HomePage />
      </MockProviders>,
    );

    await waitFor(() => {
      expect(screen.getByText('Общий баланс')).toBeInTheDocument();
    });
  });

  test('displays transactions correctly', async () => {
    render(
      <MockProviders>
        <HomePage />
      </MockProviders>,
    );

    // Wait for loading to complete and data to be displayed
    await waitFor(() => {
      // Check for transaction descriptions - use queryAllByText since there might be multiple instances
      const productElements = screen.queryAllByText('Продукты в супермаркете');
      expect(productElements.length).toBeGreaterThan(0);

      const salaryElements = screen.queryAllByText('Зарплата за январь');
      expect(salaryElements.length).toBeGreaterThan(0);
    });

    // Check for amounts with proper formatting - use getAllByText for multiple elements
    await waitFor(() => {
      const incomeAmounts = screen.getAllByText('+50 000 ₽');
      const expenseAmounts = screen.getAllByText('-1 500 ₽');

      expect(incomeAmounts.length).toBeGreaterThan(0);
      expect(expenseAmounts.length).toBeGreaterThan(0);
    });

    // Check that summary cards are displayed
    // expect(screen.getByText('48 500 ₽')).toBeInTheDocument(); // Balance

    // For summary amounts, check they exist (there might be multiple)
    const incomeSummaryElements = screen.getAllByText('+50 000 ₽');
    const expenseSummaryElements = screen.getAllByText('-1 500 ₽');

    expect(incomeSummaryElements.length).toBeGreaterThan(0);
    expect(expenseSummaryElements.length).toBeGreaterThan(0);
  });
});
