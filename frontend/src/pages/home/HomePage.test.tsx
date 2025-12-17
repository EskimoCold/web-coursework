import { render, screen, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';

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

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetHomeStore();
  });

  test('renders without crashing', async () => {
    render(
      <CurrencyProvider>
        <HomePage />
      </CurrencyProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Дашборд финансов')).toBeInTheDocument();
    });
  });

  test('displays transactions correctly', async () => {
    render(
      <CurrencyProvider>
        <HomePage />
      </CurrencyProvider>,
    );

    // Wait for loading to complete and data to be displayed
    await waitFor(() => {
      const productElements = screen.queryAllByText('Продукты в супермаркете');
      expect(productElements.length).toBeGreaterThan(0);

      const salaryElements = screen.queryAllByText('Зарплата за январь');
      expect(salaryElements.length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      // Текст разбит на несколько элементов: "+", "50 000", "₽"
      // Используем более гибкий поиск
      const incomeCard = screen.getByText('Доходы').closest('.summary-card');
      const expenseCard = screen.getByText('Расходы').closest('.summary-card');

      expect(incomeCard).toBeInTheDocument();
      expect(expenseCard).toBeInTheDocument();

      // Проверяем, что суммы присутствуют (могут быть разбиты на элементы)
      expect(incomeCard?.textContent).toContain('50 000');
      expect(incomeCard?.textContent).toContain('₽');
      expect(expenseCard?.textContent).toContain('1 500');
      expect(expenseCard?.textContent).toContain('₽');
    });

    expect(screen.getAllByText('Доходы').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Расходы').length).toBeGreaterThan(0);
    expect(screen.getByText('Баланс')).toBeInTheDocument();
  });
});
