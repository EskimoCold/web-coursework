import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { CurrencyProvider } from '../contexts/CurrencyContext';

import { HomePage } from './HomePage';

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
  it('displays transactions correctly', async () => {
    render(
      <CurrencyProvider>
        <HomePage />
      </CurrencyProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Продукты в супермаркете')).toBeInTheDocument();
      expect(screen.getByText('Зарплата за январь')).toBeInTheDocument();
    });
  });

  it('shows transaction count', async () => {
    render(
      <CurrencyProvider>
        <HomePage />
      </CurrencyProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Показано/)).toBeInTheDocument();
    });
  });
});
