import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

// Mock API imports first
const mockGetTransactions = vi.fn();
const mockCreateTransaction = vi.fn();
const mockDeleteTransaction = vi.fn();
const mockGetCategories = vi.fn();

vi.mock('../../api/transactions', () => ({
  transactionsApi: {
    getTransactions: mockGetTransactions,
    createTransaction: mockCreateTransaction,
    deleteTransaction: mockDeleteTransaction,
    getCategories: mockGetCategories,
  },
}));

vi.mock('../../api/categories', () => ({
  categoriesApi: {
    getCategories: mockGetCategories,
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
    mockGetCategories.mockClear();
    mockGetCategories.mockResolvedValue([]);
  });

  it('displays empty state when no transactions', async () => {
    mockGetTransactions.mockResolvedValue([]);
    mockGetCategories.mockResolvedValue([]);

    renderWithProviders(<HomePage />);

    await waitFor(
      () => {
        expect(screen.getByText(/нет транзакций для отображения/i)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it('handles API errors when loading transactions', async () => {
    mockGetTransactions.mockRejectedValue(new Error('API Error'));
    mockGetCategories.mockResolvedValue([]);

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/бэкенд недоступен/i)).toBeInTheDocument();
    });
  });

  it('opens transaction form when add button is clicked', async () => {
    mockGetTransactions.mockResolvedValue([]);
    mockGetCategories.mockResolvedValue([]);

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.queryByText(/загрузка данных/i)).not.toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /добавить транзакцию/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /добавить транзакцию/i })).toBeInTheDocument();
    });
  });
});
