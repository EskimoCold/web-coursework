import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

// Mock API imports first
const mockGetTransactions = vi.fn();
const mockCreateTransaction = vi.fn();
const mockDeleteTransaction = vi.fn();

vi.mock('../../api/transactions', () => ({
  transactionsApi: {
    getTransactions: mockGetTransactions,
    createTransaction: mockCreateTransaction,
    deleteTransaction: mockDeleteTransaction,
  },
}));

import { CategoryProvider } from '../contexts/CategoriesContext';
import { CurrencyProvider } from '../contexts/CurrencyContext';

import { HomePage } from './HomePage';

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <CurrencyProvider>
      <CategoryProvider>{component}</CategoryProvider>
    </CurrencyProvider>,
  );
};

describe('HomePage Additional Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTransactions.mockClear();
  });

  it('displays empty state when no transactions', async () => {
    mockGetTransactions.mockResolvedValue([]);

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/нет операций/i)).toBeInTheDocument();
    });
  });

  it('handles API errors when loading transactions', async () => {
    mockGetTransactions.mockRejectedValue(new Error('API Error'));

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/финансы/i)).toBeInTheDocument();
    });
  });

  it('opens transaction form when add button is clicked', async () => {
    mockGetTransactions.mockResolvedValue([]);

    renderWithProviders(<HomePage />);

    const addButton = screen.getByText(/добавить операцию/i);
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/добавление операции/i)).toBeInTheDocument();
    });
  });
});
