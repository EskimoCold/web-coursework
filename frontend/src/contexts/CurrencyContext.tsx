import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { currencyApi, CurrencyRates } from '../api/currency';

type Currency = 'RUB' | 'USD' | 'EUR' | 'CNY';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  rates: CurrencyRates | null;
  loading: boolean;
  error: string | null;
  convertAmount: (amount: number, fromCurrency?: Currency) => number;
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
      // Если не удалось загрузить курсы, используем фиксированные значения для работы без API
      setRates({
        base: 'RUB',
        date: new Date().toISOString().split('T')[0],
        rates: {
          RUB: 1.0,
          USD: 0.011, // Примерный курс: 1 RUB = 0.011 USD (примерно 90 RUB за 1 USD)
          EUR: 0.01, // Примерный курс: 1 RUB = 0.01 EUR (примерно 100 RUB за 1 EUR)
          CNY: 0.08, // Примерный курс: 1 RUB = 0.08 CNY (примерно 12.5 RUB за 1 CNY)
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshRates();
    // Обновляем курсы каждые 5 минут
    const interval = setInterval(refreshRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const convertAmount = (amount: number, fromCurrency: Currency = 'RUB'): number => {
    if (!rates) return amount;
    if (fromCurrency === currency) return amount;

    // API возвращает курсы в формате: rates["USD"] = сколько USD в 1 RUB
    // Например, если rates["USD"] = 0.011, то 1 RUB = 0.011 USD
    // Для конвертации из RUB в USD: amount * rates["USD"]
    // Для конвертации из USD в RUB: amount / rates["USD"]

    if (fromCurrency === 'RUB') {
      // Конвертируем из RUB в другую валюту
      return amount * rates.rates[currency];
    } else if (currency === 'RUB') {
      // Конвертируем из другой валюты в RUB
      return amount / rates.rates[fromCurrency];
    } else {
      // Конвертируем через RUB: from -> RUB -> to
      // Сначала конвертируем в RUB: amount / rates[fromCurrency]
      // Затем конвертируем из RUB в целевую: (amount / rates[fromCurrency]) * rates[currency]
      const amountInRub = amount / rates.rates[fromCurrency];
      return amountInRub * rates.rates[currency];
    }
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
