import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { HomePage } from './HomePage';

// Mock the transactions API
vi.mock('../../api/transactions', () => ({
  transactionsApi: {
    getTransactions: vi.fn(() =>
      Promise.resolve({
        transactions: [
          {
            id: 1,
            amount: -1500,
            description: 'Продукты в супермаркете',
            category: 'Продукты',
            type: 'expense',
            date: '2024-01-15',
          },
          {
            id: 2,
            amount: 50000,
            description: 'Зарплата за январь',
            category: 'Зарплата',
            type: 'income',
            date: '2024-01-10',
          },
          {
            id: 3,
            amount: -800,
            description: 'Проездной на метро',
            category: 'Транспорт',
            type: 'expense',
            date: '2024-01-08',
          },
        ],
        total_count: 3,
      }),
    ),
  },
}));

// Mock the categories API to avoid MSW errors
vi.mock('../../api/categories', () => ({
  categoriesApi: {
    getCategories: vi.fn(() =>
      Promise.resolve({
        categories: [
          { id: 1, name: 'Продукты', type: 'expense' },
          { id: 2, name: 'Зарплата', type: 'income' },
          { id: 3, name: 'Транспорт', type: 'expense' },
        ],
      }),
    ),
  },
}));

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders homepage with title', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('FinTrack')).toBeInTheDocument();
    });
  });

  it('renders summary cards with correct data', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Общий баланс')).toBeInTheDocument();
    });

    // Use data-testid or more specific queries to avoid duplicate text issues
    const incomeCard = screen.getByText('+ 50 000 ₽').closest('.summary-card');
    const expenseCard = screen.getByText('- 2 300 ₽').closest('.summary-card');

    expect(incomeCard).toBeInTheDocument();
    expect(expenseCard).toBeInTheDocument();

    // Check that the cards contain the correct headers
    expect(incomeCard).toHaveTextContent('Доходы');
    expect(expenseCard).toHaveTextContent('Расходы');
    expect(screen.getByText('+ 50 000 ₽')).toBeInTheDocument();
    expect(screen.getByText('- 2 300 ₽')).toBeInTheDocument();
  });

  it('renders transactions table', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Продукты')).toBeInTheDocument();
      expect(screen.getByText('Зарплата')).toBeInTheDocument();
      expect(screen.getByText('Транспорт')).toBeInTheDocument();
    });
  });

  it('filters transactions by type', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Зарплата')).toBeInTheDocument();
    });

    // Use getByRole for buttons to be more specific
    const incomeButton = screen.getByRole('button', { name: 'Доходы' });
    fireEvent.click(incomeButton);

    await waitFor(() => {
      // Should only show income transactions
      expect(screen.getByText('Зарплата')).toBeInTheDocument();
      expect(screen.queryByText('Продукты')).not.toBeInTheDocument();
      expect(screen.queryByText('Транспорт')).not.toBeInTheDocument();
    });

    // Test expense filter
    const expenseButton = screen.getByRole('button', { name: 'Расходы' });
    fireEvent.click(expenseButton);

    await waitFor(() => {
      // Should only show expense transactions
      expect(screen.getByText('Продукты')).toBeInTheDocument();
      expect(screen.getByText('Транспорт')).toBeInTheDocument();
      expect(screen.queryByText('Зарплата')).not.toBeInTheDocument();
    });

    // Test all filter
    const allButton = screen.getByRole('button', { name: 'Все' });
    fireEvent.click(allButton);

    await waitFor(() => {
      // Should show all transactions
      expect(screen.getByText('Продукты')).toBeInTheDocument();
      expect(screen.getByText('Зарплата')).toBeInTheDocument();
      expect(screen.getByText('Транспорт')).toBeInTheDocument();
    });
  });

  it('shows correct transaction count', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Показано 3 из 3 операций')).toBeInTheDocument();
    });
  });
});
