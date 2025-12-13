import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Currency = 'RUB' | 'USD' | 'EUR' | 'CNY';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  convertAmount: (amount: number, fromCurrency?: Currency) => number;
  formatAmount: (amount: number) => string;
  getCurrencySymbol: () => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Курсы валют (базовые значения, можно заменить на API)
const EXCHANGE_RATES: Record<Currency, number> = {
  RUB: 1,
  USD: 0.011, // 1 RUB = 0.011 USD (примерно 90 RUB за 1 USD)
  EUR: 0.01, // 1 RUB = 0.01 EUR (примерно 100 RUB за 1 EUR)
  CNY: 0.08, // 1 RUB = 0.08 CNY (примерно 12.5 RUB за 1 CNY)
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
    const saved = localStorage.getItem('currency') as Currency | null;
    return saved || 'RUB';
  });

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
  };

  const convertAmount = (amount: number, fromCurrency: Currency = 'RUB'): number => {
    if (fromCurrency === currency) {
      return amount;
    }
    // Конвертируем из fromCurrency в RUB, затем в целевую валюту
    const amountInRUB = amount / EXCHANGE_RATES[fromCurrency];
    return amountInRUB * EXCHANGE_RATES[currency];
  };

  const formatAmount = (amount: number): string => {
    const converted = convertAmount(amount);
    return converted.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getCurrencySymbol = (): string => {
    const symbols: Record<Currency, string> = {
      RUB: '₽',
      USD: '$',
      EUR: '€',
      CNY: '¥',
    };
    return symbols[currency];
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        convertAmount,
        formatAmount,
        getCurrencySymbol,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

