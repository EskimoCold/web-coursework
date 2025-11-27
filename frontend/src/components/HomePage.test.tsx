import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import React from 'react';
import { afterEach, beforeEach, vi } from 'vitest';

// Mock API imports first - create separate mocks for each API
const mockGetTransactions = vi.fn();
const mockCreateTransaction = vi.fn();
const mockDeleteTransaction = vi.fn();
const mockGetCategoriesFromTransactions = vi.fn();
const mockGetCategoriesFromCategories = vi.fn();

vi.mock('../../api/transactions', () => ({
  transactionsApi: {
    getTransactions: mockGetTransactions,
    createTransaction: mockCreateTransaction,
    deleteTransaction: mockDeleteTransaction,
    getCategories: mockGetCategoriesFromTransactions,
  },
}));

vi.mock('../../api/categories', () => ({
  categoriesApi: {
    getCategories: mockGetCategoriesFromCategories,
  },
}));

import { CategoryProvider } from '../contexts/CategoriesContext';
import { CurrencyProvider } from '../contexts/CurrencyContext';
import { server } from '../test/setup';

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
    mockGetCategoriesFromTransactions.mockClear();
    mockGetCategoriesFromCategories.mockClear();
    // Set default mocks
    mockGetCategoriesFromTransactions.mockResolvedValue([]);
    mockGetCategoriesFromCategories.mockResolvedValue([]);
    // Set token in localStorage to avoid authorization errors
    localStorage.setItem('access_token', 'test-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('displays empty state when no transactions', async () => {
    // Override MSW handlers for this specific test
    server.use(
      http.get('*/api/v1/transactions', () => {
        return HttpResponse.json([]);
      }),
      http.get('*/api/v1/categories', () => {
        return HttpResponse.json([]);
      }),
    );

    mockGetTransactions.mockResolvedValue([]);
    mockGetCategoriesFromTransactions.mockResolvedValue([]);
    mockGetCategoriesFromCategories.mockResolvedValue([]);

    renderWithProviders(<HomePage />);

    await waitFor(
      () => {
        expect(screen.getByText(/нет транзакций для отображения/i)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it('handles API errors when loading transactions', async () => {
    // Override MSW handlers for this specific test
    server.use(
      http.get('*/api/v1/transactions', () => {
        return HttpResponse.json({ error: 'API Error' }, { status: 500 });
      }),
      http.get('*/api/v1/categories', () => {
        return HttpResponse.json([]);
      }),
    );

    mockGetTransactions.mockRejectedValue(new Error('API Error'));
    mockGetCategoriesFromTransactions.mockResolvedValue([]);
    mockGetCategoriesFromCategories.mockResolvedValue([]);

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/бэкенд недоступен/i)).toBeInTheDocument();
    });
  });

  it('opens transaction form when add button is clicked', async () => {
    // Override MSW handlers for this specific test
    server.use(
      http.get('*/api/v1/transactions', () => {
        return HttpResponse.json([]);
      }),
      http.get('*/api/v1/categories', () => {
        return HttpResponse.json([]);
      }),
    );

    mockGetTransactions.mockResolvedValue([]);
    mockGetCategoriesFromTransactions.mockResolvedValue([]);
    mockGetCategoriesFromCategories.mockResolvedValue([]);

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
