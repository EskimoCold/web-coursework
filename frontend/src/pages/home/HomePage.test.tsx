import { render, screen, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';

import { CurrencyProvider } from '../../contexts/CurrencyContext';

import { HomePage } from './HomePage';
import { resetHomeStore } from './homeStore';

vi.mock('./home.css', () => ({}));

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

    await waitFor(() => {
      const productElements = screen.queryAllByText('Продукты в супермаркете');
      expect(productElements.length).toBeGreaterThan(0);

      const salaryElements = screen.queryAllByText('Зарплата за январь');
      expect(salaryElements.length).toBeGreaterThan(0);
    });

    await waitFor(
      () => {
        // expect(screen.getByText('Общий баланс')).toBeInTheDocument();

        // const incomeCards = screen.getAllByText('Доходы');
        // const expenseCards = screen.getAllByText('Расходы');

        //expect(incomeCards.length).toBeGreaterThan(0);
        //expect(expenseCards.length).toBeGreaterThan(0);

        const incomeCard = document.querySelector('.summary-card.income');
        const expenseCard = document.querySelector('.summary-card.expense');

        expect(incomeCard).toBeInTheDocument();
        expect(expenseCard).toBeInTheDocument();

        const incomeAmount = incomeCard?.querySelector('.amount');
        const expenseAmount = expenseCard?.querySelector('.amount');

        expect(incomeAmount).toBeInTheDocument();
        expect(expenseAmount).toBeInTheDocument();

        const incomeText = incomeAmount?.textContent?.replace(/\s+/g, ' ').trim() || '';
        const expenseText = expenseAmount?.textContent?.replace(/\s+/g, ' ').trim() || '';

        expect(incomeText).toMatch(/50\s*000/);
        expect(incomeText).toContain('₽');
        expect(expenseText).toMatch(/1\s*500/);
        expect(expenseText).toContain('₽');
      },
      { timeout: 3000 },
    );
  });
});
