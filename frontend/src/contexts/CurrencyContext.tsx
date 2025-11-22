import React, { createContext, useContext, useState, ReactNode } from 'react';

type CurrencyCode = 'RUB' | 'USD' | 'EUR' | 'CNY';

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  currencySymbol: string;
  formatAmount: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const currencySymbols: Record<CurrencyCode, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  CNY: '¥',
};

const exchangeRates: Record<CurrencyCode, number> = {
  RUB: 1,
  USD: 0.011, // Примерный курс
  EUR: 0.01,
  CNY: 0.079,
};

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [currency, setCurrency] = useState<CurrencyCode>('RUB');

  const formatAmount = (amount: number): string => {
    const convertedAmount = amount * exchangeRates[currency];
    return `${convertedAmount.toLocaleString('ru-RU')} ${currencySymbols[currency]}`;
  };

  const value = {
    currency,
    setCurrency,
    currencySymbol: currencySymbols[currency],
    formatAmount,
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
