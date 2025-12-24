import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { currencyApi, CurrencyRates } from '../api/currency';

type Currency = 'RUB' | 'USD' | 'EUR' | 'CNY';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  rates: CurrencyRates | null;
  loading: boolean;
  error: string | null;
  convertAmount: (amount: number) => number;
  revertAmount: (amount: number) => number;
  getCurrencySymbol: () => string;
  refreshRates: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_STORAGE_KEY = 'fintrack_currency';

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  CNY: '¥',
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
    return (saved as Currency) || 'RUB';
  });
  const [rates, setRates] = useState<CurrencyRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);
  };

  const refreshRates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await currencyApi.getRates();
      setRates(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load currency rates';
      setError(errorMessage);
      console.error('Error loading currency rates:', err);
      setRates({
        base: 'RUB',
        date: new Date().toISOString().split('T')[0],
        rates: {
          RUB: 1.0,
          USD: 0.011,
          EUR: 0.01,
          CNY: 0.08,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshRates();
    const interval = setInterval(refreshRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const convertAmount = (amount: number): number => {
    if (!rates) return amount;
    return amount * rates.rates[currency];
  };

  const revertAmount = (amount: number): number => {
    if (!rates) return amount;
    return amount / rates.rates[currency];
  };

  const getCurrencySymbol = (): string => {
    return CURRENCY_SYMBOLS[currency];
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        rates,
        loading,
        error,
        convertAmount,
        revertAmount,
        getCurrencySymbol,
        refreshRates,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
