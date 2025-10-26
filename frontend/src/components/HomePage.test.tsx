// src/components/HomePage.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

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
  it('renders homepage with title', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('FinTrack')).toBeInTheDocument();
    });
  });

  it('displays transactions correctly', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Продукты в супермаркете')).toBeInTheDocument();
      expect(screen.getByText('Зарплата за январь')).toBeInTheDocument();
    });
  });

  it('shows transaction count', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/Показано/)).toBeInTheDocument();
    });
  });
});
