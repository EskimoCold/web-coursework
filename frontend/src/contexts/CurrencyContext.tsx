import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

export type Currency = 'RUB' | 'USD' | 'EUR' | 'CNY';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  convert: (amount: number) => number;
  formatAmount: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Курсы валют (базовый курс к RUB)
const EXCHANGE_RATES: Record<Currency, number> = {
  RUB: 1,
  USD: 0.011, // 1 RUB = 0.011 USD (примерно)
  EUR: 0.01, // 1 RUB = 0.01 EUR (примерно)
  CNY: 0.08, // 1 RUB = 0.08 CNY (примерно)
};

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  CNY: '¥',
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem('app_currency') as Currency | null;
    return saved && ['RUB', 'USD', 'EUR', 'CNY'].includes(saved) ? saved : 'RUB';
  });

  useEffect(() => {
    localStorage.setItem('app_currency', currency);
  }, [currency]);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
  };

  const convert = useMemo(
    () => (amount: number): number => {
      // Конвертируем из RUB в выбранную валюту
      return amount * EXCHANGE_RATES[currency];
    },
    [currency],
  );

  const formatAmount = useMemo(
    () => (amount: number): string => {
      const converted = amount * EXCHANGE_RATES[currency];
      const formatted = new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(converted);
      return `${formatted} ${CURRENCY_SYMBOLS[currency]}`;
    },
    [currency],
  );

  const contextValue = useMemo(
    () => ({ currency, setCurrency, convert, formatAmount }),
    [currency, convert, formatAmount],
  );

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
};

