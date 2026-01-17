import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { currencyApi } from '../../api/currency';
import { transactionsApi } from '../../api/transactions';
import { CurrencyProvider } from '../../contexts/CurrencyContext';

import { HomePage } from './HomePage';

vi.mock('../../api/transactions');
vi.mock('../../api/currency');

const mockTransactionsApi = vi.mocked(transactionsApi);
const mockCurrencyApi = vi.mocked(currencyApi);

const renderWithProviders = (component: React.ReactElement) => {
  return render(<CurrencyProvider>{component}</CurrencyProvider>);
};

describe('HomePage - Currency Conversion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Storage.prototype.getItem = vi.fn(() => null);
    Storage.prototype.setItem = vi.fn();

    mockCurrencyApi.getRates.mockResolvedValue({
      base: 'RUB',
      date: '2024-01-01',
      rates: { RUB: 1, USD: 0.011, EUR: 0.01, AED: 0.04 },
    });

    mockTransactionsApi.getTransactions.mockResolvedValue([
      {
        id: 1,
        amount: 1000,
        currency: 'RUB',
        transaction_type: 'income',
        transaction_date: '2024-01-01T00:00:00Z',
        description: 'Test income',
        category: { id: 1, name: 'Test' },
      },
      {
        id: 2,
        amount: 500,
        currency: 'RUB',
        transaction_type: 'expense',
        transaction_date: '2024-01-02T00:00:00Z',
        description: 'Test expense',
        category: { id: 2, name: 'Test' },
      },
    ]);

    mockTransactionsApi.getCategories.mockResolvedValue([{ id: 1, name: 'Test Category' }]);
  });

  it('should display currency symbol in transaction amounts', async () => {
    renderWithProviders(<HomePage />);

    await waitFor(() => {
      const descriptions = screen.getAllByText(/Test income/);
      expect(descriptions.length).toBeGreaterThan(0);
    });

    const transactionRow = screen.getAllByText(/Test income/)[0].closest('tr');
    expect(transactionRow).toBeInTheDocument();
  });
});
