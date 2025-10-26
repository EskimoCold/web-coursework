// src/components/HomePage.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { HomePage } from './HomePage';

// Mock the API calls
vi.mock('../api/transactions', () => ({
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
        {
          id: 3,
          amount: 800,
          transaction_type: 'expense',
          transaction_date: '2024-01-08T00:00:00Z',
          description: 'Проездной на метро',
          category: { id: 3, name: 'Транспорт' },
        },
      ]),
    ),
    getCategories: vi.fn(() =>
      Promise.resolve([
        { id: 1, name: 'Продукты' },
        { id: 2, name: 'Зарплата' },
        { id: 3, name: 'Транспорт' },
      ]),
    ),
  },
}));

describe('HomePage', () => {
  it('renders homepage with title', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('FinTrack')).toBeInTheDocument();
    });
  });

  it('renders summary cards with correct data', async () => {
    render(<HomePage />);

    await waitFor(() => {
      // Используем data-testid или более специфичные селекторы
      const incomeCard =
        screen.getByTestId('summary-income') ||
        screen.getByText('Доходы').closest('.summary-card.income');
      const expenseCard =
        screen.getByTestId('summary-expense') ||
        screen.getByText('Расходы').closest('.summary-card.expense');
      const balanceCard =
        screen.getByTestId('summary-balance') ||
        screen.getByText('Общий баланс').closest('.summary-card.balance');

      expect(incomeCard).toHaveTextContent('50,000');
      expect(expenseCard).toHaveTextContent('2,300');
      expect(balanceCard).toHaveTextContent('47,700');
    });
  });

  it('renders transactions table', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Продукты в супермаркете')).toBeInTheDocument();
      expect(screen.getByText('Зарплата за январь')).toBeInTheDocument();
      expect(screen.getByText('Проездной на метро')).toBeInTheDocument();
    });
  });

  it('filters transactions by type', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Продукты в супермаркете')).toBeInTheDocument();
    });

    // Используем role или более специфичный селектор для кнопки фильтра
    const incomeFilterButton = screen.getByRole('button', { name: /доходы/i });
    const expenseFilterButton = screen.getByRole('button', { name: /расходы/i });

    // Click on income filter
    fireEvent.click(incomeFilterButton);

    await waitFor(() => {
      expect(screen.getByText('Зарплата за январь')).toBeInTheDocument();
      expect(screen.queryByText('Продукты в супермаркете')).not.toBeInTheDocument();
    });

    // Click on expense filter
    fireEvent.click(expenseFilterButton);

    await waitFor(() => {
      expect(screen.getByText('Продукты в супермаркете')).toBeInTheDocument();
      expect(screen.queryByText('Зарплата за январь')).not.toBeInTheDocument();
    });
  });

  it('shows correct transaction count', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Показано 3 из 3 операций')).toBeInTheDocument();
    });
  });
});
