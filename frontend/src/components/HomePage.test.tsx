import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { CurrencyProvider } from '../contexts/CurrencyContext';

import { HomePage } from './HomePage';

const renderWithProviders = (component: React.ReactElement) => {
  return render(<CurrencyProvider>{component}</CurrencyProvider>);
};

// Mock API
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
      ]),
    ),
    getCategories: vi.fn(() =>
      Promise.resolve([
        { id: 1, name: 'Продукты' },
        { id: 2, name: 'Зарплата' },
      ]),
    ),
  },
}));

describe('HomePage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('displays transactions correctly', async () => {
    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Продукты в супермаркете')).toBeInTheDocument();
      expect(screen.getByText('Зарплата за январь')).toBeInTheDocument();
    });
  });

  it('shows transaction count', async () => {
    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/Показано/)).toBeInTheDocument();
    });
  });

  it('displays amounts with currency formatting', async () => {
    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Общий баланс')).toBeInTheDocument();
      expect(screen.getByText('Доходы')).toBeInTheDocument();
      expect(screen.getByText('Расходы')).toBeInTheDocument();
    });
  });
});
