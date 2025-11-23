import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

// First: Mock API imports
vi.mock('../../api/transactions', () => ({
  transactionsApi: {
    getTransactions: vi.fn(() => Promise.resolve([])),
    createTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
  },
}));

import { transactionsApi } from '../api/transactions';

// Then: Context imports
import { CategoriesProvider } from '../contexts/CategoriesContext';
import { CurrencyProvider } from '../contexts/CurrencyContext';

// Finally: Local component imports
import { HomePage } from './HomePage';

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <CurrencyProvider>
      <CategoriesProvider>{component}</CategoriesProvider>
    </CurrencyProvider>,
  );
};

describe('HomePage Additional Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(transactionsApi.getTransactions).mockClear();
  });

  it('displays empty state when no transactions', async () => {
    vi.mocked(transactionsApi.getTransactions).mockResolvedValue([]);

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/нет операций/i)).toBeInTheDocument();
    });
  });

  it('handles API errors when loading transactions', async () => {
    vi.mocked(transactionsApi.getTransactions).mockRejectedValue(new Error('API Error'));

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/финансы/i)).toBeInTheDocument();
    });
  });

  it('opens transaction form when add button is clicked', async () => {
    vi.mocked(transactionsApi.getTransactions).mockResolvedValue([]);

    renderWithProviders(<HomePage />);

    const addButton = screen.getByText(/добавить операцию/i);
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/добавление операции/i)).toBeInTheDocument();
    });
  });
});
