import { useEffect } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { currencyApi } from '../api/currency';

import { CurrencyProvider, useCurrency } from './CurrencyContext';

vi.mock('../api/currency');

const mockCurrencyApi = vi.mocked(currencyApi);

const TestComponent = () => {
  const { currency, setCurrency, convertAmount, getCurrencySymbol, rates, loading } = useCurrency();

  return (
    <div>
      <div data-testid="currency">{currency}</div>
      <div data-testid="symbol">{getCurrencySymbol()}</div>
      <div data-testid="converted">{convertAmount(100)}</div>
      <div data-testid="loading">{loading ? 'loading' : 'loaded'}</div>
      <div data-testid="rates">{rates ? 'rates-loaded' : 'no-rates'}</div>
      <button onClick={() => setCurrency('USD')}>Set USD</button>
      <button onClick={() => setCurrency('EUR')}>Set EUR</button>
    </div>
  );
};

const DateConversionComponent = ({ date }: { date: string }) => {
  const { convertAmount, prefetchRatesForDates, setCurrency } = useCurrency();

  useEffect(() => {
    setCurrency('USD');
    prefetchRatesForDates([date]);
  }, [date, prefetchRatesForDates, setCurrency]);

  return (
    <div data-testid="converted-date">{convertAmount(100, 'AED', date).toFixed(2)}</div>
  );
};

describe('CurrencyContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Storage.prototype.getItem = vi.fn(() => null);
    Storage.prototype.setItem = vi.fn();
  });

  it('should provide default currency RUB', async () => {
    mockCurrencyApi.getRates.mockResolvedValue({
      base: 'RUB',
      date: '2024-01-01',
      rates: { RUB: 1, USD: 0.011, EUR: 0.01, AED: 0.04 },
    });

    render(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>,
    );

    // Ждем завершения начальной загрузки курсов
    await waitFor(() => {
      expect(screen.getByTestId('rates')).toHaveTextContent('rates-loaded');
    });

    expect(screen.getByTestId('currency')).toHaveTextContent('RUB');
  });

  it('should load currency rates on mount', async () => {
    const mockRates = {
      base: 'RUB',
      date: '2024-01-01',
      rates: { RUB: 1, USD: 0.011, EUR: 0.01, AED: 0.04 },
    };

    mockCurrencyApi.getRates.mockResolvedValue(mockRates);

    render(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>,
    );

    await waitFor(() => {
      expect(mockCurrencyApi.getRates).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByTestId('rates')).toHaveTextContent('rates-loaded');
    });
  });

  it('should convert amount correctly', async () => {
    const mockRates = {
      base: 'RUB',
      date: '2024-01-01',
      rates: { RUB: 1, USD: 0.011, EUR: 0.01, AED: 0.04 },
    };

    mockCurrencyApi.getRates.mockResolvedValue(mockRates);

    render(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('rates')).toHaveTextContent('rates-loaded');
    });

    // 100 RUB должно остаться 100 RUB (базовая валюта)
    const converted = screen.getByTestId('converted');
    expect(converted).toHaveTextContent('100');
  });

  it('should return correct currency symbol', async () => {
    mockCurrencyApi.getRates.mockResolvedValue({
      base: 'RUB',
      date: '2024-01-01',
      rates: { RUB: 1, USD: 0.011, EUR: 0.01, AED: 0.04 },
    });

    render(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>,
    );

    // Ждем завершения начальной загрузки курсов
    await waitFor(() => {
      expect(screen.getByTestId('rates')).toHaveTextContent('rates-loaded');
    });

    expect(screen.getByTestId('symbol')).toHaveTextContent('₽');
  });

  it('should save currency to localStorage when changed', async () => {
    const user = userEvent.setup();
    mockCurrencyApi.getRates.mockResolvedValue({
      base: 'RUB',
      date: '2024-01-01',
      rates: { RUB: 1, USD: 0.011, EUR: 0.01, AED: 0.04 },
    });

    render(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('rates')).toHaveTextContent('rates-loaded');
    });

    const setUsdButton = screen.getByText('Set USD');
    await act(async () => {
      await user.click(setUsdButton);
    });

    expect(Storage.prototype.setItem).toHaveBeenCalledWith('fintrack_currency', 'USD');
  });

  it('should normalize stored currency values', async () => {
    Storage.prototype.getItem = vi.fn(() => 'aed');
    mockCurrencyApi.getRates.mockResolvedValue({
      base: 'RUB',
      date: '2024-01-01',
      rates: { RUB: 1, USD: 0.011, EUR: 0.01, AED: 0.04 },
    });

    render(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('currency')).toHaveTextContent('AED');
    });
  });

  it('should use historical rates when available', async () => {
    const latestRates = {
      base: 'RUB',
      date: '2000-01-02',
      rates: { RUB: 1, USD: 0.01, EUR: 0.02, AED: 0.05 },
    };
    const historicalRates = {
      base: 'RUB',
      date: '2000-01-01',
      rates: { RUB: 1, USD: 0.02, EUR: 0.01, AED: 0.04 },
    };

    mockCurrencyApi.getRates.mockImplementation((date?: string) => {
      if (date) {
        return Promise.resolve(historicalRates);
      }
      return Promise.resolve(latestRates);
    });

    render(
      <CurrencyProvider>
        <DateConversionComponent date="2000-01-01" />
      </CurrencyProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('converted-date')).toHaveTextContent('50.00');
    });
  });

  it('should fall back to latest rates when historical rates are unavailable', async () => {
    const latestRates = {
      base: 'RUB',
      date: '2000-01-02',
      rates: { RUB: 1, USD: 0.01, EUR: 0.02, AED: 0.05 },
    };

    mockCurrencyApi.getRates.mockImplementation((date?: string) => {
      if (date) {
        return Promise.reject(new Error('no rates'));
      }
      return Promise.resolve(latestRates);
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <CurrencyProvider>
        <DateConversionComponent date="2000-01-01" />
      </CurrencyProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('converted-date')).toHaveTextContent('20.00');
    });

    consoleSpy.mockRestore();
  });
});
