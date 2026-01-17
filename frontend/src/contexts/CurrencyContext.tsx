import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { currencyApi, CurrencyCode, CurrencyRates } from '../api/currency';

export type Currency = CurrencyCode;

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  rates: CurrencyRates | null;
  loading: boolean;
  error: string | null;
  convertAmount: (amount: number, fromCurrency?: Currency, date?: string | Date) => number;
  getCurrencySymbol: (currency?: Currency) => string;
  refreshRates: () => Promise<void>;
  prefetchRatesForDates: (dates: string[]) => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_STORAGE_KEY = 'fintrack_currency';

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  AED: 'د.إ',
};

const SUPPORTED_CURRENCIES = Object.keys(CURRENCY_SYMBOLS) as Currency[];

const normalizeCurrencyCode = (value: string | null | undefined): Currency => {
  if (!value) return 'RUB';
  const upper = value.toUpperCase();
  return SUPPORTED_CURRENCIES.includes(upper as Currency) ? (upper as Currency) : 'RUB';
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() =>
    normalizeCurrencyCode(localStorage.getItem(CURRENCY_STORAGE_KEY)),
  );
  const [rates, setRates] = useState<CurrencyRates | null>(null);
  const [ratesByDate, setRatesByDate] = useState<Record<string, CurrencyRates>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setCurrency = useCallback((newCurrency: Currency) => {
    const normalized = normalizeCurrencyCode(newCurrency);
    setCurrencyState(normalized);
    localStorage.setItem(CURRENCY_STORAGE_KEY, normalized);
  }, []);

  const refreshRates = useCallback(async () => {
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
          AED: 0.04,
        },
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshRates();
    const interval = setInterval(refreshRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshRates]);

  const normalizeDateKey = useCallback((value: string | Date) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date > today) return null;
    return date.toISOString().split('T')[0];
  }, []);

  const prefetchRatesForDates = useCallback(
    async (dates: string[]) => {
      const todayKey = new Date().toISOString().split('T')[0];
      const uniqueDates = Array.from(new Set(dates))
        .filter(Boolean)
        .filter((date) => date <= todayKey);
      const missing = uniqueDates.filter((date) => !ratesByDate[date]);
      if (!missing.length) return;

      try {
        const responses = await Promise.all(
          missing.map(async (date) => [date, await currencyApi.getRates(date)] as const),
        );
        setRatesByDate((prev) => {
          const next = { ...prev };
          responses.forEach(([date, data]) => {
            next[date] = data;
          });
          return next;
        });
      } catch (err) {
        console.error('Error loading historical currency rates:', err);
      }
    },
    [ratesByDate],
  );

  const convertWithRates = useCallback(
    (amount: number, from: Currency, to: Currency, rateData: CurrencyRates | null) => {
      if (!rateData || from === to) return amount;

      const base = rateData.base;
      const fromRate = from === base ? 1 : rateData.rates[from];
      const toRate = to === base ? 1 : rateData.rates[to];
      if (!fromRate || !toRate) return amount;

      const amountInBase = from === base ? amount : amount / fromRate;
      return to === base ? amountInBase : amountInBase * toRate;
    },
    [],
  );

  const getUsableRates = useCallback(
    (rateData: CurrencyRates | null, from: Currency, to: Currency) => {
      if (!rateData) return null;
      const base = rateData.base;
      const fromRate = from === base ? 1 : rateData.rates[from];
      const toRate = to === base ? 1 : rateData.rates[to];
      if (!fromRate || !toRate) return null;
      return rateData;
    },
    [],
  );

  const convertAmount = useCallback(
    (amount: number, fromCurrency: Currency = 'RUB', date?: string | Date): number => {
      const normalizedFrom = normalizeCurrencyCode(fromCurrency);
      const normalizedTo = normalizeCurrencyCode(currency);
      let rateData = rates;

      if (date) {
        const dateKey = normalizeDateKey(date);
        if (dateKey) {
          const historical = getUsableRates(
            ratesByDate[dateKey] ?? null,
            normalizedFrom,
            normalizedTo,
          );
          rateData = historical ?? rates;
        }
      }

      return convertWithRates(amount, normalizedFrom, normalizedTo, rateData);
    },
    [convertWithRates, currency, getUsableRates, normalizeDateKey, rates, ratesByDate],
  );

  const getCurrencySymbol = useCallback(
    (symbolCurrency: Currency = currency): string => {
      return CURRENCY_SYMBOLS[symbolCurrency];
    },
    [currency],
  );

  const contextValue = useMemo(
    () => ({
      currency,
      setCurrency,
      rates,
      loading,
      error,
      convertAmount,
      getCurrencySymbol,
      refreshRates,
      prefetchRatesForDates,
    }),
    [
      currency,
      setCurrency,
      rates,
      loading,
      error,
      convertAmount,
      getCurrencySymbol,
      refreshRates,
      prefetchRatesForDates,
    ],
  );

  return <CurrencyContext.Provider value={contextValue}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
