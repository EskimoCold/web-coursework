import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { CategoriesProvider } from '../contexts/CategoriesContext';
import { CurrencyProvider } from '../contexts/CurrencyContext';

import { HomePage } from './HomePage';

// Mock transactions API
vi.mock('../../api/transactions', () => ({
  transactionsApi: {
    getTransactions: vi.fn(),
    createTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
  },
}));

const mockTransactionsApi = await import('../api/transactions');

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
  });

  it('displays empty state when no transactions', async () => {
    mockTransactionsApi.transactionsApi.getTransactions.mockResolvedValue([]);

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/нет операций/i)).toBeInTheDocument();
    });
  });

  it('handles API errors when loading transactions', async () => {
    mockTransactionsApi.transactionsApi.getTransactions.mockRejectedValue(new Error('API Error'));

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      // Компонент должен отображаться без падения
      expect(screen.getByText(/финансы/i)).toBeInTheDocument();
    });
  });

  it('opens transaction form when add button is clicked', async () => {
    mockTransactionsApi.transactionsApi.getTransactions.mockResolvedValue([]);

    renderWithProviders(<HomePage />);

    const addButton = screen.getByText(/добавить операцию/i);
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/добавление операции/i)).toBeInTheDocument();
    });
  });
});
