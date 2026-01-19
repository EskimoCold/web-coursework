import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

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
          currency: 'RUB',
          transaction_type: 'expense',
          transaction_date: '2024-01-15T00:00:00Z',
          description: 'Продукты в супермаркете',
          category: { id: 1, name: 'Продукты' },
        },
        {
          id: 2,
          amount: 50000,
          currency: 'RUB',
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

  test('shows mobile view summary cards', async () => {
    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = vi.fn().mockReturnValue({
      fontSize: '16px',
      width: '375px',
    } as CSSStyleDeclaration);

    render(
      <CurrencyProvider>
        <HomePage />
      </CurrencyProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Дашборд финансов')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Доходы'));

    await waitFor(() => {
      expect(screen.getAllByText('Доходы')[0]).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Расходы'));

    await waitFor(() => {
      expect(screen.getAllByText('Расходы')[0]).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Все'));

    await waitFor(() => {
      expect(screen.getAllByText('Баланс')[0]).toBeInTheDocument();
    });

    window.getComputedStyle = originalGetComputedStyle;
  });

  test('shows transaction details when clicking mobile card', async () => {
    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = vi.fn().mockReturnValue({
      fontSize: '16px',
      width: '375px',
    } as CSSStyleDeclaration);

    render(
      <CurrencyProvider>
        <HomePage />
      </CurrencyProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Продукты в супермаркете')).toBeInTheDocument();
    });

    const mobileCards = document.querySelectorAll('.mobile-transaction-card');
    expect(mobileCards.length).toBeGreaterThan(0);

    fireEvent.click(mobileCards[0]);

    await waitFor(() => {
      expect(screen.getByText('Продукты')).toBeInTheDocument();
      expect(screen.getAllByText('Продукты в супермаркете')[0]).toBeInTheDocument();
    });

    window.getComputedStyle = originalGetComputedStyle;
  });

  test('handles multiple clicks on mobile cards', async () => {
    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = vi.fn().mockReturnValue({
      fontSize: '16px',
      width: '375px',
    } as CSSStyleDeclaration);

    render(
      <CurrencyProvider>
        <HomePage />
      </CurrencyProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Продукты в супермаркете')).toBeInTheDocument();
      expect(screen.getByText('Зарплата за январь')).toBeInTheDocument();
    });

    const mobileCards = document.querySelectorAll('.mobile-transaction-card');
    expect(mobileCards.length).toBe(2);

    fireEvent.click(mobileCards[0]);

    await waitFor(() => {
      expect(screen.getByText('Продукты')).toBeInTheDocument();
    });

    fireEvent.click(mobileCards[1]);

    await waitFor(() => {
      expect(screen.getByText('Зарплата')).toBeInTheDocument();
    });

    window.getComputedStyle = originalGetComputedStyle;
  });

  test('mobile cards show correct transaction type styling', async () => {
    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = vi.fn().mockReturnValue({
      fontSize: '16px',
      width: '375px',
    } as CSSStyleDeclaration);

    render(
      <CurrencyProvider>
        <HomePage />
      </CurrencyProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Продукты в супермаркете')).toBeInTheDocument();
    });

    const mobileCards = document.querySelectorAll('.mobile-transaction-card');

    expect(mobileCards[0]).toHaveClass('expense');
    expect(mobileCards[1]).toHaveClass('income');

    window.getComputedStyle = originalGetComputedStyle;
  });
});
